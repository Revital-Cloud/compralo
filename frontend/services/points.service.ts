import { get, post, put } from '@/utils/apiWrapper'
import type { 
  PointsConfig, 
  PointsConfigCreate, 
  PointsConfigUpdate, 
  PointsPerUser, 
  PointsHistoryResponse,
  UserWithPoints,
  PointsStats
} from '@/types/points'

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
  },

  // Admin endpoints
  async getAllUsersWithPoints(): Promise<UserWithPoints[]> {
    return get<UserWithPoints[]>('/admin/all')
  },

  async getUserPointsHistory(userId: string): Promise<PointsHistoryResponse> {
    return get<PointsHistoryResponse>(`/admin/user/${userId}/history`)
  }
}

export default pointsService

