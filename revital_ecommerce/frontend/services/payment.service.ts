import { MetodoPagoUsuario, CardTokenData, WompiTokenResponse, AddPaymentMethodResponse } from '@/types/payment';
import { ApiResponse } from '@/types/common';
import api from '@/utils/apiWrapper';
import axios from 'axios';

/**
 * Mapa del servicio de pagos (frontend).
 *
 * Subflujos:
 * 1) Métodos de pago guardados (tokenización + alta/listado/eliminación/default).
 * 2) Operaciones transaccionales Wompi (PSE/CARD/CASH/CREDIT).
 *
 * Nota de seguridad:
 * - La tarjeta se tokeniza contra Wompi desde frontend y solo el token viaja al backend.
 */

const WOMPI_API_BASE_URL = `https://sandbox.wompi.co/v1`;

export const addPaymentMethod = async (cardData: {
    number: string;
    cvc: string;
    exp_month: string;
    exp_year: string;
    card_holder: string;
}): Promise<{ success: boolean; data?: AddPaymentMethodResponse; error?: string }> => {

    try {
        // 1. Tokenizar la tarjeta directamente con la API de Wompi
        const wompiResponse = await axios.post<WompiTokenResponse>(
            `${WOMPI_API_BASE_URL}/tokens/cards`,
            {
                number: cardData.number.replace(/\s/g, ''),
                cvc: cardData.cvc,
                exp_month: cardData.exp_month,
                exp_year: cardData.exp_year,
                card_holder: cardData.card_holder,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!}`,
                },
                timeout: 15000, // 15 segundos para tokenización
            }
        );

        if (wompiResponse.data.error) {
            console.error("Wompi tokenization error:", wompiResponse.data.error);
            const errorMessage = wompiResponse.data.error.messages?.card_holder?.[0] || wompiResponse.data.error.reason || "Error de validación de Wompi.";
            return { success: false, error: errorMessage };
        }
        
        const tokenData: CardTokenData = wompiResponse.data.data;

        // 2. Enviar token + marca al backend para crear la fuente de pago del usuario.
        // El apiWrapper se encarga de lanzar un error si la petición no es exitosa (status 2xx).
        const backendResponse = await api.post<AddPaymentMethodResponse>(
            `/payment/add-method`,
            {
                card_token: tokenData.id,
                brand: tokenData.brand,
            }
        );

        // Si llegamos aquí, la respuesta fue exitosa.
        return { success: true, data: backendResponse };

    } catch (error: any) {
        console.error('Error adding payment method:', error);
        
        // Manejar específicamente errores de timeout
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            return { 
                success: false, 
                error: 'La operación está tomando más tiempo del esperado. Por favor, intenta nuevamente.' 
            };
        }
        
        // Manejar errores de red
        if (error.code === 'NETWORK_ERROR' || !error.response) {
            return { 
                success: false, 
                error: 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.' 
            };
        }
        
        // Extraer el mensaje de error de la respuesta de la API (si existe)
        const errorMessage = error.response?.data?.detail 
                           || error.response?.data?.message 
                           || error.message 
                           || 'Error desconocido al procesar el método de pago';
                           
        return { success: false, error: errorMessage };
    }
};

export const listPaymentMethods = async (): Promise<MetodoPagoUsuario[]> => {
    try {
        // `api.get` retorna directamente el payload deserializado.
        const paymentMethods = await api.get<MetodoPagoUsuario[]>('/payment/list-methods');
        return paymentMethods;
    } catch (error: any) {
        console.error('Error listing payment methods:', error);
        return [];
    }
};

export const deletePaymentMethod = async (paymentMethodId: number): Promise<ApiResponse<null>> => {
    return api.delete<ApiResponse<null>>(`/payment/delete-method/${paymentMethodId}`);
};

export const setDefaultPaymentMethod = async (paymentMethodId: number): Promise<ApiResponse<null>> => {
    return api.put<ApiResponse<null>>(`/payment/set-default-method/${paymentMethodId}`);
};

// Servicios para transacciones Wompi
export interface CreateWompiTransactionPayload {
    amount: number;
    payment_method_type: "PSE" | "CARD" | "CASH" | "CREDIT";
    payment_method_data?: {
        type: string;
        user_type?: number; // 0: natural, 1: jurídica
        user_legal_id_type?: string; // "CC" o "NIT"
        user_legal_id?: string;
        financial_institution_code?: string;
        payment_description?: string;
        reference_one?: string; // IP del cliente
        reference_two?: string; // Fecha apertura producto (yyyymmdd)
        reference_three?: string; // Número documento beneficiario
    };
    customer_data?: {
        phone_number: string;
        full_name: string;
    };
    redirect_url?: string;
}

export interface WompiTransactionResponse {
    data: {
        id: string;
        status: string;
        payment_method?: {
            extra?: {
                async_payment_url?: string;
            };
        };
    };
}

export const getFinancialInstitutions = async (): Promise<any> => {
    try {
        const response = await api.get('/orders/wompi/financial-institutions');
        return response;
    } catch (error: any) {
        console.error('Error obteniendo instituciones financieras:', error);
        throw error;
    }
};

export const createWompiTransaction = async (
    payload: CreateWompiTransactionPayload
): Promise<WompiTransactionResponse> => {
    try {
        const response = await api.post<WompiTransactionResponse>(
            '/orders/wompi/create-transaction',
            payload
        );
        return response;
    } catch (error: any) {
        console.error('Error creando transacción Wompi:', error);
        throw error;
    }
};

export const getWompiTransaction = async (transactionId: string): Promise<any> => {
    try {
        const response = await api.get(`/orders/wompi/transaction/${transactionId}`);
        return response;
    } catch (error: any) {
        console.error('Error obteniendo transacción Wompi:', error);
        throw error;
    }
};

// Función helper para obtener la IP del cliente (para reference_one en PSE)
export const getClientIP = async (): Promise<string> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error obteniendo IP:', error);
        return '';
    }
};

// Función para hacer long polling hasta obtener async_payment_url
export const pollForAsyncPaymentUrl = async (
    transactionId: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
): Promise<string | null> => {
    // Polling acotado para flujos async (ej. PSE) hasta recibir URL de redirección.
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const transaction = await getWompiTransaction(transactionId);
            const asyncPaymentUrl = transaction?.data?.payment_method?.extra?.async_payment_url;
            
            if (asyncPaymentUrl) {
                return asyncPaymentUrl;
            }
            
            // Esperar antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        } catch (error) {
            console.error(`Error en intento ${attempt + 1}:`, error);
            if (attempt < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            }
        }
    }
    
    return null;
}; 