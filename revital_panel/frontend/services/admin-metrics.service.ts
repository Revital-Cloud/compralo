import { get } from '@/utils/apiWrapper';
import type {
  AdminOverviewMetrics,
  RevenuePoint,
  ClientsTimeseriesPoint,
  InstancesByPlanItem,
} from '@/types';

export interface RevenueTimeseriesResponse {
  from_date: string;
  to_date: string;
  puntos: RevenuePoint[];
}

export interface ClientsTimeseriesResponse {
  from_date: string;
  to_date: string;
  puntos: ClientsTimeseriesPoint[];
}

export interface InstancesByPlanResponse {
  items: InstancesByPlanItem[];
}

export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  return await get<AdminOverviewMetrics>('/admin/metrics/overview');
}

export async function getRevenueTimeseries(params?: {
  from_date?: string;
  to_date?: string;
}): Promise<RevenueTimeseriesResponse> {
  const search = new URLSearchParams();
  if (params?.from_date) search.set('from_date', params.from_date);
  if (params?.to_date) search.set('to_date', params.to_date);
  const qs = search.toString();
  const url = qs ? `/admin/metrics/revenue-timeseries?${qs}` : '/admin/metrics/revenue-timeseries';
  return await get<RevenueTimeseriesResponse>(url);
}

export async function getClientsTimeseries(params?: {
  from_date?: string;
  to_date?: string;
}): Promise<ClientsTimeseriesResponse> {
  const search = new URLSearchParams();
  if (params?.from_date) search.set('from_date', params.from_date);
  if (params?.to_date) search.set('to_date', params.to_date);
  const qs = search.toString();
  const url = qs ? `/admin/metrics/clients-timeseries?${qs}` : '/admin/metrics/clients-timeseries';
  return await get<ClientsTimeseriesResponse>(url);
}

export async function getInstancesByPlan(): Promise<InstancesByPlanResponse> {
  return await get<InstancesByPlanResponse>('/admin/metrics/instances-by-plan');
}

const adminMetricsService = {
  getAdminOverviewMetrics,
  getRevenueTimeseries,
  getClientsTimeseries,
  getInstancesByPlan,
};

export default adminMetricsService;

