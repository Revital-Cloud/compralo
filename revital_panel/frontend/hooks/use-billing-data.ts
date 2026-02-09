/**
 * Billing data for Suspense boundary: all invoices and pending invoices.
 */

import { useSuspenseQueries } from '@tanstack/react-query';
import billingService from '@/services/billing.service';
import { BILLING_KEYS } from '@/hooks/use-billing';
import type { InvoicePublic } from '@/types';
import type { InvoicePending } from '@/types';

const STALE_TIME = 5 * 60 * 1000;

export function useBillingDataSuspense() {
  const results = useSuspenseQueries({
    queries: [
      {
        queryKey: BILLING_KEYS.list(),
        queryFn: () => billingService.getInvoices(),
        staleTime: STALE_TIME,
      },
      {
        queryKey: BILLING_KEYS.pending(),
        queryFn: (): Promise<InvoicePending[]> => billingService.getPendingInvoices(),
        staleTime: STALE_TIME,
      },
    ],
  });

  const [allResult, pendingResult] = results;
  return {
    allInvoices: (allResult.data ?? []) as InvoicePublic[],
    pendingInvoices: (pendingResult.data ?? []) as InvoicePending[],
  };
}
