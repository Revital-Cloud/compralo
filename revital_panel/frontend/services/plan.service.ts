/**
 * Plan Service
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type { PlanPublic, PlanCreate, PlanUpdate, ResponseMessage } from '@/types';

export async function getPlanes(activeOnly: boolean = true): Promise<PlanPublic[]> {
  return await get<PlanPublic[]>(`/plans?solo_activos=${activeOnly}`);
}

export async function getPlan(idPlan: number | string): Promise<PlanPublic> {
  return await get<PlanPublic>(`/plans/${idPlan}`);
}

export async function createPlan(data: PlanCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/plans', data);
}

export async function updatePlan(idPlan: number | string, data: PlanUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/plans/${idPlan}`, data);
}

export async function deletePlan(idPlan: number | string): Promise<ResponseMessage> {
  return await del<ResponseMessage>(`/plans/${idPlan}`);
}

const planService = {
  getPlanes,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
};

export default planService;
