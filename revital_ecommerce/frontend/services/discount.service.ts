import { get, post, put } from '@/utils/apiWrapper'
import type { 
  Discount, 
  DiscountStats, 
  DiscountExchange 
} from '@/types/discount'

/**
 * Mapa del servicio de descuentos (frontend).
 *
 * Responsabilidad:
 * - Validar/transformar payloads del panel admin antes de enviarlos al backend.
 * - Exponer endpoints de descuentos para:
 *   - storefront (activos, por código, validar en carrito)
 *   - perfil usuario (my-available)
 *   - administración (CRUD, stats, canjes)
 */

/**
 * Helper para parsear números de forma segura
 */
const safeParseFloat = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === '') return defaultValue
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : Math.max(0, parsed) // Asegurar que sea >= 0
}

const safeParseInt = (value: any, defaultValue?: number): number | undefined => {
  if (value === null || value === undefined || value === '') return defaultValue
  const parsed = parseInt(value)
  return isNaN(parsed) ? defaultValue : Math.max(1, parsed) // Asegurar que sea >= 1 para enteros
}

/**
 * Transforma los datos del formulario al formato esperado por el backend
 */
export const transformDiscountPayload = (values: any): any => {
  const tipoDescuento = values.tipo_descuento === 'porcentaje'
  const valDescuento = safeParseFloat(values.val_descuento, 0)
  
  // Validar que el valor del descuento sea válido
  if (valDescuento <= 0) {
    throw new Error('El valor del descuento debe ser mayor a 0')
  }
  
  // Validar rango de porcentaje (0-100)
  if (tipoDescuento && valDescuento > 100) {
    throw new Error('El porcentaje de descuento no puede ser mayor a 100%')
  }

  const indCanjeablePuntos = values.ind_canjeable_puntos || false
  const costoPuntosCanje = safeParseInt(values.val_puntos_requeridos)
  
  // Validar constraint: si es canjeable por puntos, debe tener costo_puntos_canje > 0
  if (indCanjeablePuntos && (!costoPuntosCanje || costoPuntosCanje <= 0)) {
    throw new Error('Si el descuento es canjeable por puntos, debe especificar un costo en puntos mayor a 0')
  }

  const aplicaA = values.aplica_a || 'total_pedido'
  
  // Validar que los IDs requeridos estén presentes según el tipo de aplicación
  if (aplicaA === 'marca_especifica' && (!values.id_marca_aplica || values.id_marca_aplica === '')) {
    throw new Error('Para descuentos de marca específica se requiere seleccionar una marca')
  }
  if (aplicaA === 'categoria_especifica' && (!values.id_categoria_aplica || values.id_categoria_aplica === '')) {
    throw new Error('Para descuentos de categoría específica se requiere seleccionar una categoría')
  }
  if (aplicaA === 'producto_especifico' && (!values.id_producto_aplica || values.id_producto_aplica === '')) {
    throw new Error('Para descuentos de producto específico se requiere seleccionar un producto')
  }
  // linea_especifica y sublinea_especifica usan category_id_aplica en la BD
  if (aplicaA === 'linea_especifica' && (!values.id_categoria_aplica || values.id_categoria_aplica === '')) {
    throw new Error('Para descuentos de línea específica se requiere seleccionar una categoría')
  }
  if (aplicaA === 'sublinea_especifica' && (!values.id_categoria_aplica || values.id_categoria_aplica === '')) {
    throw new Error('Para descuentos de sublínea específica se requiere seleccionar una categoría')
  }

  const payload: any = {
    nom_descuento: values.nom_descuento,
    des_descuento: values.des_descuento,
    tipo_calculo: tipoDescuento,
    val_porce_descuento: tipoDescuento ? valDescuento : 0,
    val_monto_descuento: !tipoDescuento ? valDescuento : 0,
    aplica_a: aplicaA,
    min_valor_pedido: (() => {
      if (values.aplica_a === 'costo_envio' && values.costo_envio) {
        return safeParseFloat(values.costo_envio, 0)
      }
      if (values.aplica_a === 'compra_minima' && values.compra_minima) {
        return safeParseFloat(values.compra_minima, 0)
      }
      if (values.monto_min_compra) {
        return safeParseFloat(values.monto_min_compra, 0)
      }
      return 0
    })(),
    ind_es_para_cumpleanos: values.ind_es_para_cumpleanos || false,
    fec_inicio: values.fec_inicio?.trim() ? values.fec_inicio.trim() : null,
    fec_fin: values.fec_fin?.trim() ? values.fec_fin.trim() : null,
    ind_activo: values.ind_activo !== undefined ? values.ind_activo : true,
    max_usos_total: safeParseInt(values.max_usos),
    costo_puntos_canje: costoPuntosCanje,
    ind_canjeable_puntos: indCanjeablePuntos,
    codigo_descuento: values.cod_cupon && values.cod_cupon.trim() !== '' ? values.cod_cupon : undefined,
    max_usos_por_usuario: safeParseInt(values.max_usos_por_usuario),
    solo_primera_compra: values.solo_primera_compra || false,
    monto_minimo_producto: safeParseFloat(values.monto_minimo_producto, 0),
    cantidad_minima_producto: safeParseInt(values.cantidad_minima_producto, 1),
    requiere_codigo: values.requiere_codigo || false,
    id_usuario_destino: values.id_usuario_destino ? Number(values.id_usuario_destino) : undefined,
    // IDs según tab_descuentos: solo category_id_aplica, product_id_aplica, id_marca_aplica
    ...(aplicaA === 'producto_especifico' && {
      id_producto_aplica: parseInt(values.id_producto_aplica),
    }),
    ...(aplicaA === 'categoria_especifica' && {
      id_categoria_aplica: parseInt(values.id_categoria_aplica),
    }),
    ...(aplicaA === 'marca_especifica' && {
      id_marca_aplica: parseInt(values.id_marca_aplica),
    }),
    ...((aplicaA === 'linea_especifica' || aplicaA === 'sublinea_especifica') && {
      id_categoria_aplica: parseInt(values.id_categoria_aplica),
    }),
  }

  // Limpiar campos vacíos para evitar enviar ruido al backend.
  // Se preservan `fec_inicio/fec_fin` en null cuando corresponde.
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) delete payload[key]
    if (payload[key] === null && key !== 'fec_inicio' && key !== 'fec_fin') delete payload[key]
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

  // Obtener descuentos disponibles para el usuario autenticado (incluye cumpleaños y primera compra si aplican)
  async getMyAvailableDiscounts(limit: number = 50): Promise<Discount[]> {
    return get<Discount[]>(`/discounts/my-available?limit=${limit}`)
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

  async createDiscount(values: any): Promise<{ message: string; id_descuento?: number }> {
    const payload = transformDiscountPayload(values)
    return post<{ message: string; id_descuento?: number }>('/discounts', payload)
  },

  async sendCouponToUser(id_descuento: number | string, id_usuario: number): Promise<{ message: string }> {
    return post<{ message: string }>(`/discounts/${id_descuento}/send-coupon`, { id_usuario })
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