/**
 * Custom Hook for Plans
 */

import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import planService from '@/services/plan.service';
import { getErrorMessage } from '@/types/errors';
import type { PlanCreate, PlanUpdate } from '@/types';

export const PLAN_KEYS = {
  all: ['plans'] as const,
  lists: () => [...PLAN_KEYS.all, 'list'] as const,
  list: (activeOnly?: boolean) => [...PLAN_KEYS.lists(), { activeOnly }] as const,
  details: () => [...PLAN_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...PLAN_KEYS.details(), id] as const,
};

export function usePlans(activeOnly: boolean = true) {
  return useQuery({
    queryKey: PLAN_KEYS.list(activeOnly),
    queryFn: () => planService.getPlanes(activeOnly),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlansSuspense(activeOnly: boolean = true) {
  return useSuspenseQuery({
    queryKey: PLAN_KEYS.list(activeOnly),
    queryFn: () => planService.getPlanes(activeOnly),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlan(idPlan: number | string) {
  return useQuery({
    queryKey: PLAN_KEYS.detail(idPlan),
    queryFn: () => planService.getPlan(idPlan),
    enabled: !!idPlan,
    staleTime: 5 * 60 * 1000,
  });
}

/** Only use when idPlan is non-empty (e.g. after subscription has loaded). */
export function usePlanSuspense(idPlan: number | string) {
  return useSuspenseQuery({
    queryKey: PLAN_KEYS.detail(idPlan),
    queryFn: () => planService.getPlan(idPlan),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PlanCreate) => planService.createPlan(data),
    onSuccess: () => {
      toast.success('Plan creado exitosamente');
      queryClient.invalidateQueries({ queryKey: PLAN_KEYS.lists() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear plan'));
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idPlan, data }: { idPlan: number | string; data: PlanUpdate }) =>
      planService.updatePlan(idPlan, data),
    onSuccess: (_, variables) => {
      toast.success('Plan actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: PLAN_KEYS.detail(variables.idPlan) });
      queryClient.invalidateQueries({ queryKey: PLAN_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al actualizar plan';
      toast.error(message);
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idPlan: number | string) => planService.deletePlan(idPlan),
    onSuccess: () => {
      toast.success('Plan eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: PLAN_KEYS.lists() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar plan'));
    },
  });
}
