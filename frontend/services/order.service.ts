import api from '@/utils/apiWrapper';

export interface CreateOrderRequest {
  id_carrito: number;
  id_direccion: number;
  codigo_descuento?: string | null;
  des_observaciones?: string | null;
  id_canje?: number | null;
}

export interface CreateOrderResponse {
  success?: boolean;
  message?: string;
  error?: string;
  id_orden?: number;
  datos?: Record<string, any>;
}

export interface PayOrderRequest {
  payment_method_id: number;
}

export interface PayOrderResponse {
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING';
  transaction_id?: string;
  message?: string;
}

export async function createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
  // Backend expone POST /api/order
  const res = await api.post<CreateOrderResponse>('/order', payload);
  return res;
}

export async function payOrder(orderId: number, payload: PayOrderRequest): Promise<PayOrderResponse> {
  // Backend expone POST /api/{order_id}/pay
  const res = await api.post<PayOrderResponse>(`/${orderId}/pay`, payload);
  return res;
}

const orderService = { createOrder, payOrder };
export default orderService; 