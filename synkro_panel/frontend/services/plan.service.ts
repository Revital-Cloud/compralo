/**
 * Plan Service
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type { PlanPublic, PlanCreate, PlanUpdate, ResponseMessage } from '@/types';

export async function getPlanes(activeOnly: boolean = true): Promise<PlanPublic[]> {
  return await get<PlanPublic[]>(`/planes?solo_activos=${activeOnly}`);
}

export async function getPlan(idPlan: number | string): Promise<PlanPublic> {
  return await get<PlanPublic>(`/planes/${idPlan}`);
}

export async function createPlan(data: PlanCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/planes', data);
}

export async function updatePlan(idPlan: number | string, data: PlanUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/planes/${idPlan}`, data);
}

export async function deletePlan(idPlan: number | string): Promise<ResponseMessage> {
  return await del<ResponseMessage>(`/planes/${idPlan}`);
}

const planService = {
  getPlanes,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
};

export default planService;
