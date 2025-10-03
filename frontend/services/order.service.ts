import api from '@/utils/apiWrapper';

// Nota: Eliminamos las funciones de crear/pagar orden directamente.
// El flujo soportado es pagar el carrito y, solo si Wompi APRUEBA, crear la orden.

export interface PayCartAndCreateOrderRequest {
  payment_method_id: number;
  id_direccion: number;
  codigo_descuento?: string | null;
  des_observaciones?: string | null;
  id_canje?: number | null;
}

export interface PayCartAndCreateOrderResponse {
  status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING' | 'UNKNOWN';
  order_id?: number | null;
  transaction_id?: string;
}

// (Se eliminan createOrder y payOrder para evitar usos accidentales)

export async function payCartAndCreateOrder(
  cartId: number,
  payload: PayCartAndCreateOrderRequest
): Promise<PayCartAndCreateOrderResponse> {
  const res = await api.post<PayCartAndCreateOrderResponse>(`/cart/${cartId}/pay`, payload);
  return res;
}

const orderService = { payCartAndCreateOrder };
export default orderService; 