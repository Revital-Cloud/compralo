import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pointsService } from '@/services/points.service'
import type { PointsConfigCreate, PointsConfigUpdate } from '@/types/points'

/**
 * Hooks de puntos (fidelidad).
 *
 * Estos hooks encapsulan el acceso a la API del backend para:
 * - Tasa activa/configuración de puntos (admin).
 * - Puntos por usuario (cliente).
 * - Historial de puntos (cliente).
 * - Historial y listados para administración.
 *
 * Patrón:
 * - `queryKey` descriptivo para permitir invalidación selectiva.
 * - `staleTime` para reducir recargas innecesarias (puntos no cambian cada segundo).
 * - Las mutaciones invalidan `['points']` (o prefijos) para refrescar datos.
 */

export const useActivePointsRate = () => {
  return useQuery({
    queryKey: ['points', 'active-rate'],
    // Endpoint del backend que responde la tasa/configuración actualmente activa.
    queryFn: () => pointsService.getActiveRate(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

export const usePointsPerUser = () => {
  return useQuery({
    queryKey: ['points', 'user'],
    // Endpoint que retorna `puntos_disponibles` (usado por pestaña de canje en perfil).
    queryFn: () => pointsService.getPointsPerUser(),
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

export const usePointsHistory = () => {
  return useQuery({
    queryKey: ['points', 'history'],
    // Endpoint del backend con el historial de movimientos de puntos.
    queryFn: () => pointsService.getPointsHistory(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useCreatePointsConfig = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    // Admin: crea una nueva configuración/tasa de puntos.
    mutationFn: (data: PointsConfigCreate) => pointsService.createPointsConfig(data),
    onSuccess: () => {
      // Refrescamos cualquier vista que dependa de `points/*`.
      queryClient.invalidateQueries({ queryKey: ['points'] })
    },
  })
}

export const useUpdatePointsConfig = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    // Admin: actualiza una configuración/tasa existente.
    mutationFn: ({ id, data }: { id: string; data: PointsConfigUpdate }) => 
      pointsService.updatePointsConfig(id, data),
    onSuccess: () => {
      // Igual que creación: invalida para que el UI muestre la tasa actual.
      queryClient.invalidateQueries({ queryKey: ['points'] })
    },
  })
}

// Admin hooks
export const useAllUsersWithPoints = () => {
  return useQuery({
    queryKey: ['points', 'admin', 'all-users'],
    // Admin: lista todos los usuarios con sus puntos.
    queryFn: () => pointsService.getAllUsersWithPoints(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useUserPointsHistory = (userId: string) => {
  return useQuery({
    queryKey: ['points', 'admin', 'user-history', userId],
    // Admin: historial de un usuario específico.
    queryFn: () => pointsService.getUserPointsHistory(userId),
    // Evita llamar si `userId` llega vacío.
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

