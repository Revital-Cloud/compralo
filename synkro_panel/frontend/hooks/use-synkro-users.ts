/**
 * Custom Hook for Synkro Users (Admins)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import synkroUserService from '@/services/synkro-user.service';
import type { SynkroUserPublic, SynkroUserCreate, SynkroUserUpdate } from '@/types';

export const SYNKRO_USER_KEYS = {
  all: ['synkro-users'] as const,
  lists: () => [...SYNKRO_USER_KEYS.all, 'list'] as const,
  list: () => [...SYNKRO_USER_KEYS.lists()] as const,
  details: () => [...SYNKRO_USER_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...SYNKRO_USER_KEYS.details(), id] as const,
};

export function useSynkroUsers() {
  return useQuery({
    queryKey: SYNKRO_USER_KEYS.list(),
    queryFn: () => synkroUserService.getSynkroUsers(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSynkroUser(idUser: number | string) {
  return useQuery({
    queryKey: SYNKRO_USER_KEYS.detail(idUser),
    queryFn: () => synkroUserService.getSynkroUser(idUser),
    enabled: !!idUser,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSynkroUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SynkroUserCreate) => synkroUserService.createSynkroUser(data),
    onSuccess: () => {
      toast.success('Usuario creado exitosamente');
      queryClient.invalidateQueries({ queryKey: SYNKRO_USER_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al crear usuario';
      toast.error(message);
    },
  });
}

export function useUpdateSynkroUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idUser, data }: { idUser: number | string; data: SynkroUserUpdate }) =>
      synkroUserService.updateSynkroUser(idUser, data),
    onSuccess: (_, variables) => {
      toast.success('Usuario actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: SYNKRO_USER_KEYS.detail(variables.idUser) });
      queryClient.invalidateQueries({ queryKey: SYNKRO_USER_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al actualizar usuario';
      toast.error(message);
    },
  });
}

export function useDeleteSynkroUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idUser: number | string) => synkroUserService.deleteSynkroUser(idUser),
    onSuccess: () => {
      toast.success('Usuario eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: SYNKRO_USER_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al eliminar usuario';
      toast.error(message);
    },
  });
}
