import { get, post, put } from '@/utils/apiWrapper'
import type { 
  Discount, 
  DiscountStats, 
  DiscountExchange 
} from '@/types/discount'

/**
 * Transforma los datos del formulario al formato esperado por el backend
 */
export const transformDiscountPayload = (values: any): any => {
  const payload: any = {
    nom_descuento: values.nom_descuento,
    des_descuento: values.des_descuento,
    tipo_calculo: values.tipo_descuento === 'porcentaje',
    val_porce_descuento: values.tipo_descuento === 'porcentaje' ? parseFloat(values.val_descuento) : 0,
    val_monto_descuento: values.tipo_descuento !== 'porcentaje' ? parseFloat(values.val_descuento) : 0,
    aplica_a: values.aplica_a || 'total_pedido',
    min_valor_pedido: (() => {
      if (values.aplica_a === 'costo_envio' && values.costo_envio) {
        return parseFloat(values.costo_envio)
      }
      if (values.aplica_a === 'compra_minima' && values.compra_minima) {
        return parseFloat(values.compra_minima)
      }
      if (values.monto_min_compra) {
        return parseFloat(values.monto_min_compra)
      }
      return 0
    })(),
    ind_es_para_cumpleanos: values.ind_es_para_cumpleanos || false,
    fec_inicio: values.fec_inicio,
    fec_fin: values.fec_fin,
    ind_activo: values.ind_activo !== undefined ? values.ind_activo : true,
    max_usos_total: values.max_usos ? parseInt(values.max_usos) : undefined,
    costo_puntos_canje: values.val_puntos_requeridos ? parseInt(values.val_puntos_requeridos) : undefined,
    ind_canjeable_puntos: values.ind_canjeable_puntos || false,
    codigo_descuento: values.cod_cupon && values.cod_cupon.trim() !== '' ? values.cod_cupon : undefined,
    max_usos_por_usuario: values.max_usos_por_usuario ? parseInt(values.max_usos_por_usuario) : undefined,
    solo_primera_compra: values.solo_primera_compra || false,
    monto_minimo_producto: values.monto_minimo_producto ? parseFloat(values.monto_minimo_producto) : 0,
    cantidad_minima_producto: values.cantidad_minima_producto ? parseInt(values.cantidad_minima_producto) : 1,
    requiere_codigo: values.requiere_codigo || false,
    // IDs condicionales según "aplica_a"
    ...(values.aplica_a === 'producto_especifico' && values.id_producto_aplica && {
      id_producto_aplica: parseInt(values.id_producto_aplica),
      id_categoria: values.id_categoria_producto ? parseInt(values.id_categoria_producto) : undefined,
      id_linea: values.id_linea_producto ? parseInt(values.id_linea_producto) : undefined,
      id_sublinea: values.id_sublinea_producto ? parseInt(values.id_sublinea_producto) : undefined,
    }),
    ...(values.aplica_a === 'categoria_especifica' && values.id_categoria_aplica && {
      id_categoria_aplica: parseInt(values.id_categoria_aplica)
    }),
    ...(values.aplica_a === 'marca_especifica' && values.id_marca_aplica && {
      id_marca_aplica: parseInt(values.id_marca_aplica)
    }),
    ...(values.aplica_a === 'linea_especifica' && values.id_categoria_linea && values.id_linea_aplica && {
      id_linea_aplica: parseInt(values.id_linea_aplica),
      id_categoria: parseInt(values.id_categoria_linea)
    }),
    ...(values.aplica_a === 'sublinea_especifica' && values.id_categoria_sublinea && values.id_linea_sublinea && values.id_sublinea_aplica && {
      id_sublinea_aplica: parseInt(values.id_sublinea_aplica),
      id_categoria: parseInt(values.id_categoria_sublinea),
      id_linea: parseInt(values.id_linea_sublinea)
    }),
  }

  // Eliminar campos undefined/null
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined || payload[key] === null) {
      delete payload[key]
    }
  })

  return payload
}

export const discountService = {
  // Descuentos básicos
  async getDiscounts(): Promise<Discount[]> {
    return get<Discount[]>('/discounts')
  },

  // Obtener descuentos activos para usuarios (público)
  async getActiveDiscounts(limit: number = 50): Promise<Discount[]> {
    return get<Discount[]>(`/discounts/active?limit=${limit}`)
  },

  // Buscar descuento por código de cupón
  async getDiscountByCode(codigo: string): Promise<Discount> {
    return get<Discount>(`/discounts/by-code/${codigo.toUpperCase()}`)
  },

  // Validar código de descuento para el carrito actual
  async validateDiscountForCart(codigo: string, id_carrito?: number): Promise<any> {
    return post<any>('/discounts/validate-for-cart', {
      codigo: codigo.toUpperCase(),
      id_carrito: id_carrito || undefined
    })
  },

  async createDiscount(values: any): Promise<{ message: string }> {
    const payload = transformDiscountPayload(values)
    return post<{ message: string }>('/discounts', payload)
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