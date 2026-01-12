/**
 * Resource Usage Service
 */

import { get, post } from '@/utils/apiWrapper';
import type { ResourceUsagePublic, ResourceUsageCreate, ResponseMessage } from '@/types';

export async function getResourceUsage(idInstance?: number | string): Promise<ResourceUsagePublic[]> {
  const url = idInstance ? `/uso-recursos?id_instancia=${idInstance}` : '/uso-recursos';
  return await get<ResourceUsagePublic[]>(url);
}

export async function getInstancesWithAlerts(): Promise<any[]> {
  return await get<any[]>('/uso-recursos/alertas');
}

export async function getLatestResourceUsage(idInstance: number | string): Promise<ResourceUsagePublic> {
  return await get<ResourceUsagePublic>(`/uso-recursos/ultimo/${idInstance}`);
}

export async function createResourceUsage(data: ResourceUsageCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/uso-recursos', data);
}

const resourceUsageService = {
  getResourceUsage,
  getInstancesWithAlerts,
  getLatestResourceUsage,
  createResourceUsage,
};

export default resourceUsageService;
