/**
 * Custom Hook for Billing
 */

import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import billingService from '@/services/billing.service';
import { getErrorMessage } from '@/types/errors';
import type {
  InvoiceHeaderCreate,
  InvoiceHeaderUpdate,
  InvoicePending,
} from '@/types';

export const BILLING_KEYS = {
  all: ['billing'] as const,
  lists: () => [...BILLING_KEYS.all, 'list'] as const,
  list: () => [...BILLING_KEYS.lists()] as const,
  pending: () => [...BILLING_KEYS.all, 'pending'] as const,
  details: () => [...BILLING_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...BILLING_KEYS.details(), id] as const,
};

export function useInvoices() {
  return useQuery({
    queryKey: BILLING_KEYS.list(),
    queryFn: () => billingService.getInvoices(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvoicesSuspense() {
  return useSuspenseQuery({
    queryKey: BILLING_KEYS.list(),
    queryFn: () => billingService.getInvoices(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePendingInvoices() {
  return useQuery({
    queryKey: BILLING_KEYS.pending(),
    queryFn: (): Promise<InvoicePending[]> => billingService.getPendingInvoices(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePendingInvoicesSuspense() {
  return useSuspenseQuery({
    queryKey: BILLING_KEYS.pending(),
    queryFn: (): Promise<InvoicePending[]> => billingService.getPendingInvoices(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvoice(idInvoice: number | string) {
  return useQuery({
    queryKey: BILLING_KEYS.detail(idInvoice),
    queryFn: () => billingService.getInvoice(idInvoice),
    enabled: !!idInvoice,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvoiceHeaderCreate) => billingService.createInvoice(data),
    onSuccess: () => {
      toast.success('Factura creada exitosamente');
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.pending() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al crear factura';
      toast.error(message);
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idInvoice, data }: { idInvoice: number | string; data: InvoiceHeaderUpdate }) =>
      billingService.updateInvoice(idInvoice, data),
    onSuccess: (_, variables) => {
      toast.success('Factura actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.detail(variables.idInvoice) });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.pending() });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al actualizar factura'));
    },
  });
}
