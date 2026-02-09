/**
 * Plan History Service
 */

import { get, post } from '@/utils/apiWrapper';
import type { PlanHistoryPublic, PlanHistoryCreate, ResponseMessage } from '@/types';

export async function getPlanHistory(idSubscription?: number | string): Promise<PlanHistoryPublic[]> {
  const url = idSubscription ? `/plan-history?id_suscripcion=${idSubscription}` : '/plan-history';
  return await get<PlanHistoryPublic[]>(url);
}

export async function getPlanHistoryRecord(idHistory: number | string): Promise<PlanHistoryPublic> {
  return await get<PlanHistoryPublic>(`/plan-history/${idHistory}`);
}

export async function createPlanHistory(data: PlanHistoryCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/plan-history', data);
}

const planHistoryService = {
  getPlanHistory,
  getPlanHistoryRecord,
  createPlanHistory,
};

export default planHistoryService;
