export interface Discount {
  id_descuento: string
  nom_descuento: string
  des_descuento?: string
  tipo_calculo: boolean
  val_porce_descuento: number
  val_monto_descuento: number
  aplica_a: string
  min_valor_pedido?: number
  fec_inicio?: string
  fec_fin?: string
  ind_activo: boolean
  max_usos_total?: number
  usos_actuales_total?: number
  costo_puntos_canje?: number
  ind_canjeable_puntos: boolean
  codigo_descuento?: string
  max_usos_por_usuario?: number
  requiere_codigo?: boolean
  fec_insert?: string
  fec_update?: string
  // Campos según tab_descuentos: category_id_aplica, product_id_aplica, id_marca_aplica
  id_producto_aplica?: string | number
  id_categoria_aplica?: string | number
  id_marca_aplica?: string | number
  // Campos adicionales agregados por el backend para identificar tipos especiales
  es_cumpleanos?: boolean  // Marcador para descuentos de cumpleaños
  es_primera_compra?: boolean  // Marcador para descuentos de primera compra
  solo_primera_compra?: boolean  // Campo de la BD para descuentos solo primera compra
  ind_es_para_cumpleanos?: boolean  // Campo de la BD para descuentos de cumpleaños
}

export interface DiscountStats {
  total_activos: number
  total_inactivos: number
  total_canjes: number
  total_puntos_canjeados: number
}

export interface DiscountExchange {
  id_canje: string
  id_usuario: string
  nom_usuario: string
  ape_usuario: string
  email_usuario: string
  puntos_utilizados: number
  ind_utilizado: boolean
  fec_utilizacion?: string
  fec_expiracion_canje?: string
  fec_canje: string
  id_orden_aplicado?: string
}

/** Descuento listado como canjeable por puntos (GET /discounts/exchangeable/{id_usuario}) */
export interface DiscountExchangeable {
  id_descuento: number
  nom_descuento: string
  des_descuento: string
  costo_puntos_canje: number | null
  tipo_calculo_texto: string
  valor_descuento: string
  aplica_a: string
  fec_inicio: string | null
  fec_fin: string | null
  puede_canjear: boolean | null
  puntos_usuario: number | null
}

/** Respuesta del canje de puntos por descuento (POST /canjes-puntos-descuento) */
export interface ExchangePointsDiscountResponse {
  success: boolean
  message: string
  id_canje?: number
  descuento?: string
  puntos_utilizados?: number
  puntos_restantes?: number
  puntos_necesarios?: number
  puntos_disponibles?: number
}

/** Canje disponible del usuario (GET /canjes/mis-canjes) */
export interface CanjeDisponible {
  id_canje: number
  id_descuento: number
  nom_descuento: string
  puntos_utilizados: number | null
  fec_expiracion_canje: string | null
}
