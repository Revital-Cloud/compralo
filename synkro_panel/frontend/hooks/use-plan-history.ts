/**
 * Custom Hook for Plan History
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import planHistoryService from '@/services/plan-history.service';
import type { PlanHistoryPublic, PlanHistoryCreate } from '@/types';

export const PLAN_HISTORY_KEYS = {
  all: ['plan-history'] as const,
  lists: () => [...PLAN_HISTORY_KEYS.all, 'list'] as const,
  list: (idSubscription?: number | string) => [...PLAN_HISTORY_KEYS.lists(), { idSubscription }] as const,
  details: () => [...PLAN_HISTORY_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...PLAN_HISTORY_KEYS.details(), id] as const,
};

export function usePlanHistory(idSubscription?: number | string) {
  return useQuery({
    queryKey: PLAN_HISTORY_KEYS.list(idSubscription),
    queryFn: () => planHistoryService.getPlanHistory(idSubscription),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlanHistoryRecord(idHistory: number | string) {
  return useQuery({
    queryKey: PLAN_HISTORY_KEYS.detail(idHistory),
    queryFn: () => planHistoryService.getPlanHistoryRecord(idHistory),
    enabled: !!idHistory,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePlanHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PlanHistoryCreate) => planHistoryService.createPlanHistory(data),
    onSuccess: (_, variables) => {
      toast.success('Registro de historial creado exitosamente');
      queryClient.invalidateQueries({ queryKey: PLAN_HISTORY_KEYS.list(variables.id_suscripcion) });
      queryClient.invalidateQueries({ queryKey: PLAN_HISTORY_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al crear registro';
      toast.error(message);
    },
  });
}
