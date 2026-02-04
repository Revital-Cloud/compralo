/**
 * Custom Hook for Instances
 */

import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import instanceService from '@/services/instance.service';
import { getErrorMessage } from '@/types/errors';
import type { InstanceCreate, InstanceUpdate } from '@/types';

export const INSTANCE_KEYS = {
  all: ['instances'] as const,
  lists: () => [...INSTANCE_KEYS.all, 'list'] as const,
  list: () => [...INSTANCE_KEYS.lists()] as const,
  details: () => [...INSTANCE_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...INSTANCE_KEYS.details(), id] as const,
};

export function useInstances() {
  return useQuery({
    queryKey: INSTANCE_KEYS.list(),
    queryFn: () => instanceService.getInstances(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInstancesSuspense() {
  return useSuspenseQuery({
    queryKey: INSTANCE_KEYS.list(),
    queryFn: () => instanceService.getInstances(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInstance(idInstance: number | string) {
  return useQuery({
    queryKey: INSTANCE_KEYS.detail(idInstance),
    queryFn: () => instanceService.getInstance(idInstance),
    enabled: !!idInstance,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InstanceCreate) => instanceService.createInstance(data),
    onSuccess: () => {
      toast.success('Instancia creada exitosamente');
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al crear instancia';
      toast.error(message);
    },
  });
}

export function useUpdateInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idInstance, data }: { idInstance: number | string; data: InstanceUpdate }) =>
      instanceService.updateInstance(idInstance, data),
    onSuccess: (_, variables) => {
      toast.success('Instancia actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEYS.detail(variables.idInstance) });
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEYS.lists() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar instancia'));
    },
  });
}

export function useDeleteInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idInstance: number | string) => instanceService.deleteInstance(idInstance),
    onSuccess: () => {
      toast.success('Instancia eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: INSTANCE_KEYS.lists() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar instancia'));
    },
  });
}
