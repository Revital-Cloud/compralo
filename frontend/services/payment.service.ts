import api from '@/utils/apiWrapper';
import { PaymentMethod } from '@/types/payment'; // Asegúrate que este tipo coincida con la nueva respuesta

// NOTA: Los tipos 'PaymentMethod' deben ser revisados para que coincidan con la nueva API.

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  // Endpoint actualizado
  return api.get('/payment-methods/');
};

export const addPaymentMethod = async (cardToken: string): Promise<any> => {
  // Endpoint y payload actualizados
  return api.post('/payment-methods/', { card_token: cardToken });
};

export const deletePaymentMethod = async (paymentMethodId: number): Promise<any> => {
  // Endpoint actualizado
  return api.delete(`/payment-methods/${paymentMethodId}`);
};

export const setDefaultPaymentMethod = async (paymentMethodId: number): Promise<any> => {
  // Endpoint actualizado
  return api.put(`/payment-methods/${paymentMethodId}/default`);
}; 