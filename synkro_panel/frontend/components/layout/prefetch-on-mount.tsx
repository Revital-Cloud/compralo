'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchForPath } from '@/lib/prefetch-routes';

const DASHBOARD_ROUTES = ['/dashboard', '/instance', '/resources', '/subscription', '/billing'];

/** Delay before prefetching so we don't block initial paint. */
const PREFETCH_DELAY_MS = 600;

/**
 * Prefetches data for main dashboard routes in the background after mount
 * so navigation feels instant. Does not block initial render.
 */
export function PrefetchOnMount() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => {
      for (const route of DASHBOARD_ROUTES) {
        prefetchForPath(queryClient, route);
      }
    }, PREFETCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [queryClient]);

  return null;
}
