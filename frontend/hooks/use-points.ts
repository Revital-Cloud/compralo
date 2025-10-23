import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pointsService } from '@/services/points.service'
import type { PointsConfigCreate, PointsConfigUpdate } from '@/types/points'

export const useActivePointsRate = () => {
  return useQuery({
    queryKey: ['points', 'active-rate'],
    queryFn: () => pointsService.getActiveRate(),
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

export const usePointsPerUser = () => {
  return useQuery({
    queryKey: ['points', 'user'],
    queryFn: () => pointsService.getPointsPerUser(),
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

export const usePointsHistory = () => {
  return useQuery({
    queryKey: ['points', 'history'],
    queryFn: () => pointsService.getPointsHistory(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useCreatePointsConfig = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: PointsConfigCreate) => pointsService.createPointsConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points'] })
    },
  })
}

export const useUpdatePointsConfig = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PointsConfigUpdate }) => 
      pointsService.updatePointsConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points'] })
    },
  })
}

// Admin hooks
export const useAllUsersWithPoints = () => {
  return useQuery({
    queryKey: ['points', 'admin', 'all-users'],
    queryFn: () => pointsService.getAllUsersWithPoints(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useUserPointsHistory = (userId: string) => {
  return useQuery({
    queryKey: ['points', 'admin', 'user-history', userId],
    queryFn: () => pointsService.getUserPointsHistory(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

