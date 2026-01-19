/**
 * Custom Hook for Domains
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import domainService from '@/services/domain.service';
import type { DomainPublic, DomainCreate, DomainUpdate } from '@/types';

export const DOMAIN_KEYS = {
  all: ['domains'] as const,
  lists: () => [...DOMAIN_KEYS.all, 'list'] as const,
  list: (idInstance?: number | string) => [...DOMAIN_KEYS.lists(), { idInstance }] as const,
  details: () => [...DOMAIN_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...DOMAIN_KEYS.details(), id] as const,
};

export function useDomains(idInstance?: number | string) {
  return useQuery({
    queryKey: DOMAIN_KEYS.list(idInstance),
    queryFn: () => domainService.getDomains(idInstance),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDomain(idDomain: number | string) {
  return useQuery({
    queryKey: DOMAIN_KEYS.detail(idDomain),
    queryFn: () => domainService.getDomain(idDomain),
    enabled: !!idDomain,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DomainCreate) => domainService.createDomain(data),
    onSuccess: (_, variables) => {
      toast.success('Dominio creado exitosamente');
      queryClient.invalidateQueries({ queryKey: DOMAIN_KEYS.list(variables.id_instancia) });
      queryClient.invalidateQueries({ queryKey: DOMAIN_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al crear dominio';
      toast.error(message);
    },
  });
}

export function useUpdateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idDomain, data }: { idDomain: number | string; data: DomainUpdate }) =>
      domainService.updateDomain(idDomain, data),
    onSuccess: (_, variables) => {
      toast.success('Dominio actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: DOMAIN_KEYS.detail(variables.idDomain) });
      queryClient.invalidateQueries({ queryKey: DOMAIN_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al actualizar dominio';
      toast.error(message);
    },
  });
}

export function useDeleteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idDomain: number | string) => domainService.deleteDomain(idDomain),
    onSuccess: () => {
      toast.success('Dominio eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: DOMAIN_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al eliminar dominio';
      toast.error(message);
    },
  });
}
