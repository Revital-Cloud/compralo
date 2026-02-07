/**
 * Dashboard data for Suspense boundary: instances, active subscriptions, pending invoices.
 */

import { useSuspenseQueries } from '@tanstack/react-query';
import instanceService from '@/services/instance.service';
import subscriptionService from '@/services/subscription.service';
import billingService from '@/services/billing.service';
import { INSTANCE_KEYS } from '@/hooks/use-instances';
import { SUBSCRIPTION_KEYS } from '@/hooks/use-subscriptions';
import { BILLING_KEYS } from '@/hooks/use-billing';
import type { ActiveSubscriptionWithPlan } from '@/types';
import type { InvoicePending } from '@/types';

const STALE_TIME = 5 * 60 * 1000;

export function useDashboardDataSuspense() {
  const results = useSuspenseQueries({
    queries: [
      {
        queryKey: INSTANCE_KEYS.list(),
        queryFn: () => instanceService.getInstances(),
        staleTime: STALE_TIME,
      },
      {
        queryKey: SUBSCRIPTION_KEYS.active(),
        queryFn: (): Promise<ActiveSubscriptionWithPlan[]> =>
          subscriptionService.getActiveSubscriptions(),
        staleTime: STALE_TIME,
      },
      {
        queryKey: BILLING_KEYS.pending(),
        queryFn: (): Promise<InvoicePending[]> => billingService.getPendingInvoices(),
        staleTime: STALE_TIME,
      },
    ],
  });

  const [instancesResult, subscriptionsResult, pendingResult] = results;
  return {
    instances: instancesResult.data,
    subscriptions: subscriptionsResult.data,
    pendingInvoices: pendingResult.data,
  };
}
