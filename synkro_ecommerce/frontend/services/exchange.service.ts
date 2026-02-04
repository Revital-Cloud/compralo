import { get, post } from '@/utils/apiWrapper'
import type { DiscountExchangeable, ExchangePointsDiscountResponse, CanjeDisponible } from '@/types/discount'

export const exchangeService = {
  /** Lista descuentos que el usuario puede canjear por puntos */
  async getExchangeableDiscounts(userId: number, limit = 20): Promise<DiscountExchangeable[]> {
    return get<DiscountExchangeable[]>(`/discounts/exchangeable/${userId}?limit=${limit}`)
  },

  /** Lista canjes disponibles del usuario (canjeados, no utilizados y no vencidos) */
  async getMyAvailableCanjes(): Promise<CanjeDisponible[]> {
    return get<CanjeDisponible[]>('/canjes/mis-canjes')
  },

  /** Canjea puntos por un descuento (solo el usuario autenticado) */
  async redeemPointsForDiscount(payload: {
    id_usuario: number
    id_descuento: number
  }): Promise<ExchangePointsDiscountResponse> {
    return post<ExchangePointsDiscountResponse>('/canjes-puntos-descuento', payload)
  },
}

export default exchangeService
