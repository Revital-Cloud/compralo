import { get, post } from '@/utils/apiWrapper'
import type { DiscountExchangeable, ExchangePointsDiscountResponse, CanjeDisponible } from '@/types/discount'

/**
 * Service de canjes por puntos (frontend).
 *
 * Encapsula el acceso a endpoints del backend relacionados con:
 * - descuentos canjeables por usuario
 * - listado de canjes disponibles/no utilizados
 * - redención (post) de puntos por un descuento específico
 *
 * Las funciones son usadas por `ExchangeTab` en el perfil.
 */
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
