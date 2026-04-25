import { get, post, put } from '@/utils/apiWrapper'
import type { 
  Order, 
  OrderDetail, 
  OrderStats, 
  OrderFilters 
} from '@/types/order'

/**
 * Mapa del servicio de órdenes (frontend).
 *
 * Responsabilidad:
 * - Centralizar endpoints administrativos de órdenes.
 * - Mantener compatibilidad con flujo cliente legado de pago desde carrito.
 *
 * Endpoints principales:
 * - Admin: `/admin/orders/*`, `/admin/stats`
 * - Cliente legado: `/cart/{cartId}/pay`
 */

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

export const orderService = {
  // Admin endpoints
  async getAllOrders(filters?: OrderFilters): Promise<Order[]> {
    const params = new URLSearchParams()
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    
    const queryString = params.toString()
    const url = `/admin/orders/all${queryString ? `?${queryString}` : ''}`
    return get<Order[]>(url)
  },

  async getOrderStats(): Promise<OrderStats> {
    return get<OrderStats>('/admin/stats')
  },

  async getOrderDetail(orderId: string): Promise<OrderDetail> {
    return get<OrderDetail>(`/admin/orders/${orderId}`)
  },

  async updateOrderStatus(orderId: string, status: number): Promise<{ message: string }> {
    return put<{ message: string }>(`/admin/orders/${orderId}/status`, { new_status: status })
  },

  // Cliente endpoints (mantener compatibilidad)
  async payCartAndCreateOrder(
    cartId: number,
    payload: PayCartAndCreateOrderRequest
  ): Promise<PayCartAndCreateOrderResponse> {
    // Flujo heredado: pago + creación de orden en una sola operación backend.
    const res = await post<PayCartAndCreateOrderResponse>(`/cart/${cartId}/pay`, payload);
    return res;
  }
}

// Export individual functions for backward compatibility
export const payCartAndCreateOrder = orderService.payCartAndCreateOrder

export default orderService 