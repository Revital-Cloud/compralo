/**
 * Custom Hook for Revital Users (Admins)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import revitalUserService from '@/services/revital-user.service';
import type { RevitalUserPublic, RevitalUserCreate, RevitalUserUpdate } from '@/types';

export const REVITAL_USER_KEYS = {
  all: ['revital-users'] as const,
  lists: () => [...REVITAL_USER_KEYS.all, 'list'] as const,
  list: () => [...REVITAL_USER_KEYS.lists()] as const,
  details: () => [...REVITAL_USER_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...REVITAL_USER_KEYS.details(), id] as const,
};

export function useRevitalUsers() {
  return useQuery({
    queryKey: REVITAL_USER_KEYS.list(),
    queryFn: () => revitalUserService.getRevitalUsers(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRevitalUser(idUser: number | string) {
  return useQuery({
    queryKey: REVITAL_USER_KEYS.detail(idUser),
    queryFn: () => revitalUserService.getRevitalUser(idUser),
    enabled: !!idUser,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRevitalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RevitalUserCreate) => revitalUserService.createRevitalUser(data),
    onSuccess: () => {
      toast.success('Usuario creado exitosamente');
      queryClient.invalidateQueries({ queryKey: REVITAL_USER_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al crear usuario';
      toast.error(message);
    },
  });
}

export function useUpdateRevitalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idUser, data }: { idUser: number | string; data: RevitalUserUpdate }) =>
      revitalUserService.updateRevitalUser(idUser, data),
    onSuccess: (_, variables) => {
      toast.success('Usuario actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: REVITAL_USER_KEYS.detail(variables.idUser) });
      queryClient.invalidateQueries({ queryKey: REVITAL_USER_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al actualizar usuario';
      toast.error(message);
    },
  });
}

export function useDeleteRevitalUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idUser: number | string) => revitalUserService.deleteRevitalUser(idUser),
    onSuccess: () => {
      toast.success('Usuario eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: REVITAL_USER_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al eliminar usuario';
      toast.error(message);
    },
  });
}
