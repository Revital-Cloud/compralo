/**
 * Custom Hook for Resource Usage
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import resourceUsageService from '@/services/resource-usage.service';
import type { ResourceUsagePublic, ResourceUsageCreate } from '@/types';

export const RESOURCE_USAGE_KEYS = {
  all: ['resource-usage'] as const,
  lists: () => [...RESOURCE_USAGE_KEYS.all, 'list'] as const,
  list: (idInstance?: number | string) => [...RESOURCE_USAGE_KEYS.lists(), { idInstance }] as const,
  alerts: () => [...RESOURCE_USAGE_KEYS.all, 'alerts'] as const,
  latest: (idInstance: number | string) => [...RESOURCE_USAGE_KEYS.all, 'latest', idInstance] as const,
};

export function useResourceUsage(idInstance?: number | string) {
  return useQuery({
    queryKey: RESOURCE_USAGE_KEYS.list(idInstance),
    queryFn: () => resourceUsageService.getResourceUsage(idInstance),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInstancesWithAlerts() {
  return useQuery({
    queryKey: RESOURCE_USAGE_KEYS.alerts(),
    queryFn: () => resourceUsageService.getInstancesWithAlerts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLatestResourceUsage(idInstance: number | string) {
  return useQuery({
    queryKey: RESOURCE_USAGE_KEYS.latest(idInstance),
    queryFn: () => resourceUsageService.getLatestResourceUsage(idInstance),
    enabled: !!idInstance,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateResourceUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResourceUsageCreate) => resourceUsageService.createResourceUsage(data),
    onSuccess: (_, variables) => {
      toast.success('Registro de uso de recursos creado exitosamente');
      queryClient.invalidateQueries({ queryKey: RESOURCE_USAGE_KEYS.list(variables.id_instancia) });
      queryClient.invalidateQueries({ queryKey: RESOURCE_USAGE_KEYS.latest(variables.id_instancia) });
      queryClient.invalidateQueries({ queryKey: RESOURCE_USAGE_KEYS.alerts() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al crear registro';
      toast.error(message);
    },
  });
}
