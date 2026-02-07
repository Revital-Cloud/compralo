/**
 * Custom Hook for Clients
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import clientService from '@/services/client.service';
import { getErrorMessage } from '@/types/errors';
import type { ClientCreate, ClientUpdate } from '@/types';

export const CLIENT_KEYS = {
  all: ['clients'] as const,
  lists: () => [...CLIENT_KEYS.all, 'list'] as const,
  list: () => [...CLIENT_KEYS.lists()] as const,
  details: () => [...CLIENT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CLIENT_KEYS.details(), id] as const,
  me: () => [...CLIENT_KEYS.all, 'me'] as const,
  mySubscription: () => [...CLIENT_KEYS.all, 'me', 'subscription'] as const,
  myPlan: () => [...CLIENT_KEYS.all, 'me', 'plan'] as const,
};

export function useClients() {
  return useQuery({
    queryKey: CLIENT_KEYS.list(),
    queryFn: () => clientService.getClients(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useClient(identificacionFiscal: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.detail(identificacionFiscal),
    queryFn: () => clientService.getClient(identificacionFiscal),
    enabled: !!identificacionFiscal,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: CLIENT_KEYS.me(),
    queryFn: () => clientService.getMyProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMySubscription() {
  return useQuery({
    queryKey: CLIENT_KEYS.mySubscription(),
    queryFn: () => clientService.getMySubscription(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyPlan() {
  return useQuery({
    queryKey: CLIENT_KEYS.myPlan(),
    queryFn: () => clientService.getMyPlan(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientCreate) => clientService.createClient(data),
    onSuccess: () => {
      toast.success('Cliente creado exitosamente');
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.lists() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al crear cliente'));
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ identificacionFiscal, data }: { identificacionFiscal: string; data: ClientUpdate }) =>
      clientService.updateClient(identificacionFiscal, data),
    onSuccess: (_, variables) => {
      toast.success('Cliente actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.detail(variables.identificacionFiscal) });
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.me() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al actualizar cliente';
      toast.error(message);
    },
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientUpdate) => clientService.updateMyProfile(data),
    onSuccess: () => {
      toast.success('Perfil actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.me() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al actualizar perfil';
      toast.error(message);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (identificacionFiscal: string) => clientService.deleteClient(identificacionFiscal),
    onSuccess: () => {
      toast.success('Cliente eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.lists() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al eliminar cliente'));
    },
  });
}
