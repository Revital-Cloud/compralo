import { MetodoPagoUsuario, CardTokenData, WompiTokenResponse, AddPaymentMethodResponse } from '@/types/payment';
import { ApiResponse } from '@/types/common';
import api from '@/utils/apiWrapper';
import axios from 'axios';

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
            }
        );

        if (wompiResponse.data.error) {
            console.error("Wompi tokenization error:", wompiResponse.data.error);
            const errorMessage = wompiResponse.data.error.messages?.card_holder?.[0] || wompiResponse.data.error.reason || "Error de validación de Wompi.";
            return { success: false, error: errorMessage };
        }
        
        const tokenData: CardTokenData = wompiResponse.data.data;

        // 2. Enviar el token y la marca a nuestro backend. 
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
        
        // Extraer el mensaje de error de la respuesta de la API (si existe)
        const errorMessage = error.response?.data?.detail 
                           || error.response?.data?.message 
                           || error.message 
                           || 'Error desconocido';
                           
        return { success: false, error: errorMessage };
    }
};

export const listPaymentMethods = async (): Promise<MetodoPagoUsuario[]> => {
    try {
        // api.get devuelve directamente el array de datos de la respuesta.
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