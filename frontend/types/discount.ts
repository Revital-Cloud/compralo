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
  // Campos para productos específicos (requeridos para verificar producto completo)
  id_categoria?: string | number
  id_linea?: string | number
  id_sublinea?: string | number
  id_producto_aplica?: string | number
  // Campos para otros tipos de aplicación
  id_categoria_aplica?: string | number
  id_marca_aplica?: string | number
  id_linea_aplica?: string | number
  id_sublinea_aplica?: string | number
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
