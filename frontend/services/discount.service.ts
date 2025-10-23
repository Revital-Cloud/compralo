import { get, post, put } from '@/utils/apiWrapper'
import type { 
  Discount, 
  DiscountStats, 
  DiscountExchange 
} from '@/types/discount'

export const discountService = {
  // Descuentos básicos
  async getDiscounts(): Promise<Discount[]> {
    return get<Discount[]>('/discounts')
  },

  async createDiscount(data: any): Promise<{ message: string }> {
    return post<{ message: string }>('/discounts', data)
  },

  async updateDiscount(id: string, data: any): Promise<{ message: string }> {
    return put<{ message: string }>(`/discounts/${id}`, data)
  },

  async toggleDiscountStatus(id: string, activate: boolean): Promise<{ message: string }> {
    return put<{ message: string }>(`/discounts/${id}/${activate}/deactivate-activate`)
  },

  // Admin endpoints
  async getDiscountStats(): Promise<DiscountStats> {
    return get<DiscountStats>('/admin/stats')
  },

  async getDiscountExchanges(discountId: string): Promise<DiscountExchange[]> {
    return get<DiscountExchange[]>(`/${discountId}/admin/canjes`)
  }
}

export default discountService