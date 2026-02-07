/**
 * Custom Hook for Deployments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import deploymentService from '@/services/deployment.service';
import type { DeploymentPublic, DeploymentCreate, DeploymentUpdate } from '@/types';

export const DEPLOYMENT_KEYS = {
  all: ['deployments'] as const,
  lists: () => [...DEPLOYMENT_KEYS.all, 'list'] as const,
  list: (idInstance?: number | string) => [...DEPLOYMENT_KEYS.lists(), { idInstance }] as const,
  details: () => [...DEPLOYMENT_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...DEPLOYMENT_KEYS.details(), id] as const,
};

export function useDeployments(idInstance?: number | string) {
  return useQuery({
    queryKey: DEPLOYMENT_KEYS.list(idInstance),
    queryFn: () => deploymentService.getDeployments(idInstance),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeployment(idDeployment: number | string) {
  return useQuery({
    queryKey: DEPLOYMENT_KEYS.detail(idDeployment),
    queryFn: () => deploymentService.getDeployment(idDeployment),
    enabled: !!idDeployment,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeploymentCreate) => deploymentService.createDeployment(data),
    onSuccess: (_, variables) => {
      toast.success('Deployment creado exitosamente');
      queryClient.invalidateQueries({ queryKey: DEPLOYMENT_KEYS.list(variables.id_instancia) });
      queryClient.invalidateQueries({ queryKey: DEPLOYMENT_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al crear deployment';
      toast.error(message);
    },
  });
}

export function useUpdateDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idDeployment, data }: { idDeployment: number | string; data: DeploymentUpdate }) =>
      deploymentService.updateDeployment(idDeployment, data),
    onSuccess: (_, variables) => {
      toast.success('Deployment actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: DEPLOYMENT_KEYS.detail(variables.idDeployment) });
      queryClient.invalidateQueries({ queryKey: DEPLOYMENT_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al actualizar deployment';
      toast.error(message);
    },
  });
}
