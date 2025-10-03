import { get, post, put } from '@/utils/apiWrapper'

export interface Discount {
  id_descuento: string
  des_descuento: string
  tipo_descuento: 'porcentaje' | 'monto_fijo'
  val_descuento: string
  monto_min_compra?: string
  val_puntos_requeridos?: string
  cod_cupon?: string
  fec_inicio?: string
  fec_fin?: string
  ind_activo: boolean
  max_usos?: number
  usos_actuales?: number
  fec_insert?: string
  fec_update?: string
}

export interface DiscountCreate {
  des_descuento: string
  tipo_descuento: 'porcentaje' | 'monto_fijo'
  val_descuento: string
  monto_min_compra?: string
  val_puntos_requeridos?: string
  cod_cupon?: string
  fec_inicio?: string
  fec_fin?: string
  ind_activo?: boolean
  max_usos?: number
}

export interface DiscountUpdate {
  des_descuento?: string
  tipo_descuento?: 'porcentaje' | 'monto_fijo'
  val_descuento?: string
  monto_min_compra?: string
  val_puntos_requeridos?: string
  cod_cupon?: string
  fec_inicio?: string
  fec_fin?: string
  ind_activo?: boolean
  max_usos?: number
}

export interface DiscountExchangeable {
  id_descuento: string
  des_descuento: string
  tipo_descuento: string
  val_descuento: string
  val_puntos_requeridos: string
  puntos_disponibles: string
  puede_canjear: boolean
}

export const discountService = {
  // Obtener todos los descuentos (Admin)
  async getDiscounts(): Promise<Discount[]> {
    return get<Discount[]>('/discounts')
  },

  // Obtener descuentos canjeables (Cliente)
  async getExchangeableDiscounts(id_usuario: string, limit: number = 20): Promise<DiscountExchangeable[]> {
    return get<DiscountExchangeable[]>(`/discounts/exchangeable/${id_usuario}?limit=${limit}`)
  },

  // Crear descuento (Admin)
  async createDiscount(data: DiscountCreate): Promise<{ message: string }> {
    return post<{ message: string }>('/discounts', data)
  },

  // Actualizar descuento (Admin)
  async updateDiscount(id_descuento: string, data: DiscountUpdate): Promise<{ message: string }> {
    return put<{ message: string }>(`/discounts/${id_descuento}`, data)
  },

  // Activar/Desactivar descuento (Admin)
  async toggleDiscountStatus(id_descuento: string, activate: boolean): Promise<{ message: string }> {
    return put<{ message: string }>(`/discounts/${id_descuento}/${activate}/deactivate-activate`, {})
  },

  // Validar descuento
  async validateDiscount(id_descuento: string, id_usuario: string, codigo_ingresado?: string): Promise<{ aplicable: boolean; mensaje: string }> {
    return post<{ aplicable: boolean; mensaje: string }>('/discounts/validate', {
      id_descuento,
      id_usuario,
      codigo_ingresado,
      usr_insert: id_usuario
    })
  }
}

export default discountService

