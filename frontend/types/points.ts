export interface UserWithPoints {
  id_usuario: string
  nom_usuario: string
  ape_usuario: string
  email_usuario: string
  cel_usuario?: string
  puntos_disponibles: number
  puntos_totales_ganados: number
  puntos_totales_canjeados: number
  fec_ultimo_canje?: string
  ind_activo: boolean
}

export interface PointsMovement {
  id_movimiento_puntos: number
  tipo_movimiento_codigo: number // 1, 2, 3
  tipo_movimiento_descripcion: string
  cantidad_puntos: number
  puntos_disponibles_anterior: number
  puntos_disponibles_actual: number
  descripcion: string
  fec_movimiento: string
  id_orden_origen?: string
  id_descuento_canjeado?: string
  nombre_descuento?: string
}

export interface PointsHistoryResponse {
  success: boolean
  id_usuario: string
  historial: PointsMovement[]
}

export interface PointsStats {
  total_usuarios: number
  total_puntos_circulacion: number
  promedio_puntos_usuario: number
}

// Tipos para configuración de puntos (mantener compatibilidad)
export interface PointsConfig {
  id_config_puntos: string
  pesos_por_punto: string
  puntos_por_peso: string
  fec_inicio: string
  fec_fin?: string
  ind_activo: boolean
  fec_insert?: string
  fec_update?: string
}

export interface PointsConfigCreate {
  pesos_por_punto: string
  puntos_por_peso: string
  fec_inicio: string
  fec_fin?: string
  ind_activo?: boolean
}

export interface PointsConfigUpdate {
  pesos_por_punto?: string
  puntos_por_peso?: string
  fec_inicio?: string
  fec_fin?: string
  ind_activo?: boolean
}

export interface PointsPerUser {
  id_usuario: string
  total_puntos: string
  puntos_disponibles: string
  puntos_canjeados: string
}
