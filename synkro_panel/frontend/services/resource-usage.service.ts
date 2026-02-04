/**
 * Resource Usage Service
 */

import { get, post } from '@/utils/apiWrapper';
import type {
  ResourceUsagePublic,
  ResourceUsageCreate,
  ResponseMessage,
  InstanceWithAlert,
} from '@/types';

export async function getResourceUsage(idInstance?: number | string): Promise<ResourceUsagePublic[]> {
  const url = idInstance ? `/resource-usage?id_instancia=${idInstance}` : '/resource-usage';
  return await get<ResourceUsagePublic[]>(url);
}

export async function getInstancesWithAlerts(): Promise<InstanceWithAlert[]> {
  return await get<InstanceWithAlert[]>('/resource-usage/alertas');
}

export async function getLatestResourceUsage(idInstance: number | string): Promise<ResourceUsagePublic> {
  return await get<ResourceUsagePublic>(`/resource-usage/ultimo/${idInstance}`);
}

export async function createResourceUsage(data: ResourceUsageCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/resource-usage', data);
}

const resourceUsageService = {
  getResourceUsage,
  getInstancesWithAlerts,
  getLatestResourceUsage,
  createResourceUsage,
};

export default resourceUsageService;
