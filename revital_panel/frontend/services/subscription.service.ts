/**
 * Subscription Service
 */

import { get, post, put } from '@/utils/apiWrapper';
import type {
  SubscriptionPublic,
  SubscriptionCreate,
  SubscriptionUpdate,
  ResponseMessage,
} from '@/types';

const SUBSCRIPTIONS_BASE = '/subscriptions';

export async function getSubscriptions(): Promise<SubscriptionPublic[]> {
  return await get<SubscriptionPublic[]>(SUBSCRIPTIONS_BASE);
}

export async function getActiveSubscriptions(): Promise<any[]> {
  return await get<any[]>(`${SUBSCRIPTIONS_BASE}/active`);
}

export async function getSubscription(idSubscription: number | string): Promise<SubscriptionPublic> {
  return await get<SubscriptionPublic>(`${SUBSCRIPTIONS_BASE}/${idSubscription}`);
}

export async function createSubscription(data: SubscriptionCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>(SUBSCRIPTIONS_BASE, data);
}

export async function updateSubscription(
  idSubscription: number | string,
  data: SubscriptionUpdate
): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`${SUBSCRIPTIONS_BASE}/${idSubscription}`, data);
}

export async function cancelSubscription(
  idSubscription: number | string,
  motivo?: string
): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`${SUBSCRIPTIONS_BASE}/${idSubscription}`, {
    estado_suscripcion: 'cancelada',
    motivo_cancelacion: motivo,
  } as SubscriptionUpdate);
}

export interface CreateFirstSubscriptionResponse {
  message?: string;
  success: boolean;
  checkout_url?: string | null;
}

export async function changeSubscriptionPlan(
  idSubscription: number | string,
  idPlanNuevo: number | string,
  tipoCambio: 'upgrade' | 'downgrade' | 'lateral',
  motivo?: string
): Promise<CreateFirstSubscriptionResponse> {
  const params = new URLSearchParams();
  params.set('id_plan_nuevo', String(idPlanNuevo));
  params.set('tipo_cambio', tipoCambio);
  if (motivo != null && motivo !== '') params.set('motivo_cambio', motivo);
  const qs = params.toString();
  const url = qs
    ? `${SUBSCRIPTIONS_BASE}/${idSubscription}/change-plan?${qs}`
    : `${SUBSCRIPTIONS_BASE}/${idSubscription}/change-plan?id_plan_nuevo=${idPlanNuevo}&tipo_cambio=${tipoCambio}`;
  return await post<CreateFirstSubscriptionResponse>(url);
}

export async function createFirstSubscription(
  data: SubscriptionCreate
): Promise<CreateFirstSubscriptionResponse> {
  return await post<CreateFirstSubscriptionResponse>(`${SUBSCRIPTIONS_BASE}/create-first`, data);
}

const subscriptionService = {
  getSubscriptions,
  getActiveSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  changeSubscriptionPlan,
  createFirstSubscription,
};

export default subscriptionService;
