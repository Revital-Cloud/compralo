import { useQuery } from '@tanstack/react-query';
import adminMetricsService from '@/services/admin-metrics.service';
import type {
  AdminOverviewMetrics,
  RevenueTimeseriesResponse,
  ClientsTimeseriesResponse,
  InstancesByPlanResponse,
} from '@/services/admin-metrics.service';

export const ADMIN_METRICS_KEYS = {
  overview: ['admin-metrics', 'overview'] as const,
  revenue: (from?: string, to?: string) => ['admin-metrics', 'revenue', { from, to }] as const,
  clients: (from?: string, to?: string) => ['admin-metrics', 'clients', { from, to }] as const,
  instancesByPlan: ['admin-metrics', 'instances-by-plan'] as const,
};

export function useAdminOverviewMetrics() {
  return useQuery<AdminOverviewMetrics>({
    queryKey: ADMIN_METRICS_KEYS.overview,
    queryFn: () => adminMetricsService.getAdminOverviewMetrics(),
    staleTime: 60 * 1000,
  });
}

export function useRevenueTimeseries(from?: string, to?: string) {
  return useQuery<RevenueTimeseriesResponse>({
    queryKey: ADMIN_METRICS_KEYS.revenue(from, to),
    queryFn: () => adminMetricsService.getRevenueTimeseries({ from_date: from, to_date: to }),
    staleTime: 60 * 1000,
  });
}

export function useClientsTimeseries(from?: string, to?: string) {
  return useQuery<ClientsTimeseriesResponse>({
    queryKey: ADMIN_METRICS_KEYS.clients(from, to),
    queryFn: () => adminMetricsService.getClientsTimeseries({ from_date: from, to_date: to }),
    staleTime: 60 * 1000,
  });
}

export function useInstancesByPlan() {
  return useQuery<InstancesByPlanResponse>({
    queryKey: ADMIN_METRICS_KEYS.instancesByPlan,
    queryFn: () => adminMetricsService.getInstancesByPlan(),
    staleTime: 5 * 60 * 1000,
  });
}

