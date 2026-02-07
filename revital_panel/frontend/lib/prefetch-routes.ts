/**
 * Prefetch React Query data for dashboard routes on hover/focus.
 * Uses the same keys and fetchers as page hooks so data is ready when the user navigates.
 */

import type { QueryClient } from '@tanstack/react-query';
import instanceService from '@/services/instance.service';
import subscriptionService from '@/services/subscription.service';
import billingService from '@/services/billing.service';
import planService from '@/services/plan.service';
import { INSTANCE_KEYS } from '@/hooks/use-instances';
import { SUBSCRIPTION_KEYS } from '@/hooks/use-subscriptions';
import { BILLING_KEYS } from '@/hooks/use-billing';
import { PLAN_KEYS } from '@/hooks/use-planes';

const STALE = 5 * 60 * 1000;

/** Normalize path (no trailing slash, no locale) for route matching. */
function pathForRoute(path: string): string {
  const p = path.replace(/^\/[a-z]{2}(?=\/|$)/, '').replace(/\/$/, '') || '/';
  return p;
}

/**
 * Prefetch queries needed for the given route so navigation feels instant.
 * Call on sidebar link hover/focus; does not block.
 */
export function prefetchForPath(queryClient: QueryClient, path: string): void {
  const route = pathForRoute(path);

  const run = () => {
    if (route === '/dashboard') {
      void queryClient.prefetchQuery({
        queryKey: INSTANCE_KEYS.list(),
        queryFn: () => instanceService.getInstances(),
        staleTime: STALE,
      });
      void queryClient.prefetchQuery({
        queryKey: SUBSCRIPTION_KEYS.active(),
        queryFn: () => subscriptionService.getActiveSubscriptions(),
        staleTime: STALE,
      });
      void queryClient.prefetchQuery({
        queryKey: BILLING_KEYS.pending(),
        queryFn: () => billingService.getPendingInvoices(),
        staleTime: STALE,
      });
      return;
    }

    if (route === '/instance' || route.startsWith('/instance/')) {
      void queryClient.prefetchQuery({
        queryKey: INSTANCE_KEYS.list(),
        queryFn: () => instanceService.getInstances(),
        staleTime: STALE,
      });
      return;
    }

    if (route === '/resources') {
      void queryClient.prefetchQuery({
        queryKey: INSTANCE_KEYS.list(),
        queryFn: () => instanceService.getInstances(),
        staleTime: STALE,
      });
      // Note: /resource-usage/alerts is admin-only, so we don't prefetch it here
      // It should only be prefetched in admin routes
      return;
    }

    if (route === '/subscription') {
      void queryClient.prefetchQuery({
        queryKey: SUBSCRIPTION_KEYS.active(),
        queryFn: () => subscriptionService.getActiveSubscriptions(),
        staleTime: STALE,
      });
      void queryClient.prefetchQuery({
        queryKey: PLAN_KEYS.list(true),
        queryFn: () => planService.getPlanes(true),
        staleTime: STALE,
      });
      return;
    }

    if (route === '/billing' || route.startsWith('/billing')) {
      void queryClient.prefetchQuery({
        queryKey: BILLING_KEYS.list(),
        queryFn: () => billingService.getInvoices(),
        staleTime: STALE,
      });
      void queryClient.prefetchQuery({
        queryKey: BILLING_KEYS.pending(),
        queryFn: () => billingService.getPendingInvoices(),
        staleTime: STALE,
      });
      return;
    }

    if (route === '/settings' || route.startsWith('/settings')) {
      // Settings/profile pages are light; optional: prefetch profile if needed
      return;
    }
  };

  run();
}
