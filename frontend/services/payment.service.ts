import api from '@/utils/apiWrapper';
import { PaymentMethod } from '@/types/payment';

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  return api.get('/payments/cards');
};

export const addPaymentMethod = async (token: string): Promise<any> => {
  return api.post('/payments/cards', { token });
};

export const deletePaymentMethod = async (paymentMethodId: number): Promise<any> => {
  return api.delete(`/payments/cards/${paymentMethodId}`);
};

export const setDefaultPaymentMethod = async (paymentMethodId: number): Promise<any> => {
  return api.put(`/payments/cards/${paymentMethodId}/default`);
}; 