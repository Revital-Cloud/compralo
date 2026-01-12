/**
 * Plan History Service
 */

import { get, post } from '@/utils/apiWrapper';
import type { PlanHistoryPublic, PlanHistoryCreate, ResponseMessage } from '@/types';

export async function getPlanHistory(idSubscription?: number | string): Promise<PlanHistoryPublic[]> {
  const url = idSubscription ? `/historial-planes?id_suscripcion=${idSubscription}` : '/historial-planes';
  return await get<PlanHistoryPublic[]>(url);
}

export async function getPlanHistoryRecord(idHistory: number | string): Promise<PlanHistoryPublic> {
  return await get<PlanHistoryPublic>(`/historial-planes/${idHistory}`);
}

export async function createPlanHistory(data: PlanHistoryCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/historial-planes', data);
}

const planHistoryService = {
  getPlanHistory,
  getPlanHistoryRecord,
  createPlanHistory,
};

export default planHistoryService;
