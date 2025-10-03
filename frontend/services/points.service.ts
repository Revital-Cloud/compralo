import { get, post, put } from '@/utils/apiWrapper'

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

export interface PointsHistory {
  id_historial: string
  id_usuario: string
  tipo_movimiento: string
  val_puntos: string
  id_pedido?: string
  id_descuento?: string
  des_movimiento?: string
  fec_insert: string
}

export interface PointsHistoryResponse {
  historial: PointsHistory[]
  total_registros: number
}

export const pointsService = {
  // Configuración de puntos (Admin)
  async createPointsConfig(data: PointsConfigCreate): Promise<{ message: string }> {
    return post<{ message: string }>('/config', data)
  },

  async updatePointsConfig(id_config_puntos: string, data: PointsConfigUpdate): Promise<{ message: string }> {
    return put<{ message: string }>(`/configuracion/${id_config_puntos}`, data)
  },

  async getActiveRate(): Promise<PointsConfig[]> {
    return get<PointsConfig[]>('/tasa-activa')
  },

  // Puntos por usuario (Cliente)
  async getPointsPerUser(): Promise<PointsPerUser> {
    return get<PointsPerUser>('/points-per-user')
  },

  async getPointsHistory(): Promise<PointsHistoryResponse> {
    return get<PointsHistoryResponse>('/historial-puntos')
  }
}

export default pointsService

