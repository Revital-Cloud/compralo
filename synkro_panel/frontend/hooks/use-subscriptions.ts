/**
 * Custom Hook for Subscriptions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import subscriptionService from '@/services/subscription.service';
import type {
  SubscriptionPublic,
  SubscriptionCreate,
  SubscriptionUpdate,
  ActiveSubscriptionWithPlan,
} from '@/types';

export const SUBSCRIPTION_KEYS = {
  all: ['subscriptions'] as const,
  lists: () => [...SUBSCRIPTION_KEYS.all, 'list'] as const,
  list: () => [...SUBSCRIPTION_KEYS.lists()] as const,
  active: () => [...SUBSCRIPTION_KEYS.all, 'active'] as const,
  details: () => [...SUBSCRIPTION_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...SUBSCRIPTION_KEYS.details(), id] as const,
};

export function useSubscriptions() {
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.list(),
    queryFn: () => subscriptionService.getSubscriptions(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveSubscriptions() {
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.active(),
    queryFn: (): Promise<ActiveSubscriptionWithPlan[]> => subscriptionService.getActiveSubscriptions(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubscription(idSubscription: number | string) {
  return useQuery({
    queryKey: SUBSCRIPTION_KEYS.detail(idSubscription),
    queryFn: () => subscriptionService.getSubscription(idSubscription),
    enabled: !!idSubscription,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubscriptionCreate) => subscriptionService.createSubscription(data),
    onSuccess: () => {
      toast.success('Suscripción creada exitosamente');
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.active() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al crear suscripción';
      toast.error(message);
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idSubscription, data }: { idSubscription: number | string; data: SubscriptionUpdate }) =>
      subscriptionService.updateSubscription(idSubscription, data),
    onSuccess: (_, variables) => {
      toast.success('Suscripción actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.detail(variables.idSubscription) });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.active() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al actualizar suscripción';
      toast.error(message);
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idSubscription, motivo }: { idSubscription: number | string; motivo?: string }) =>
      subscriptionService.cancelSubscription(idSubscription, motivo),
    onSuccess: () => {
      toast.success('Suscripción cancelada exitosamente');
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.active() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al cancelar suscripción';
      toast.error(message);
    },
  });
}

export function useChangeSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      idSubscription,
      idPlanNuevo,
      tipoCambio,
      motivo,
    }: {
      idSubscription: number | string;
      idPlanNuevo: number | string;
      tipoCambio: 'upgrade' | 'downgrade' | 'lateral';
      motivo?: string;
    }) =>
      subscriptionService.changeSubscriptionPlan(
        idSubscription,
        idPlanNuevo,
        tipoCambio,
        motivo,
      ),
    onSuccess: () => {
      toast.success('Subscription plan updated successfully');
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_KEYS.active() });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Error updating subscription plan';
      toast.error(message);
    },
  });
}
