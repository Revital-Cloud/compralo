/**
 * Subscription Service
 */

import { get, post, put } from '@/utils/apiWrapper';
import type {
  SubscriptionPublic,
  SubscriptionCreate,
  SubscriptionUpdate,
  ActiveSubscriptionWithPlan,
  ResponseMessage,
  CrearPrimeraSuscripcionResponse,
} from '@/types';

export async function getSubscriptions(): Promise<SubscriptionPublic[]> {
  return await get<SubscriptionPublic[]>('/subscriptions');
}

export async function getActiveSubscriptions(): Promise<ActiveSubscriptionWithPlan[]> {
  return await get<ActiveSubscriptionWithPlan[]>('/subscriptions/active');
}

export async function getSubscription(idSubscription: number | string): Promise<SubscriptionPublic> {
  return await get<SubscriptionPublic>(`/subscriptions/${idSubscription}`);
}

export async function createSubscription(data: SubscriptionCreate): Promise<CrearPrimeraSuscripcionResponse> {
  return await post<CrearPrimeraSuscripcionResponse>('/subscriptions/create-first', data);
}

export async function updateSubscription(idSubscription: number | string, data: SubscriptionUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/subscriptions/${idSubscription}`, data);
}

export async function cancelSubscription(idSubscription: number | string, motivo?: string): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/subscriptions/${idSubscription}`, {
    estado_suscripcion: 'cancelada',
    motivo_cancelacion: motivo,
  } as SubscriptionUpdate);
}

export async function changeSubscriptionPlan(
  idSubscription: number | string,
  idPlanNuevo: number | string,
  tipoCambio: 'upgrade' | 'downgrade' | 'lateral',
  motivo?: string,
): Promise<ResponseMessage> {
  const params = new URLSearchParams({
    id_plan_nuevo: String(idPlanNuevo),
    tipo_cambio: tipoCambio,
  });
  if (motivo) {
    params.append('motivo_cambio', motivo);
  }

  return await post<ResponseMessage>(
    `/subscriptions/${idSubscription}/change-plan?${params.toString()}`,
    {},
  );
}

const subscriptionService = {
  getSubscriptions,
  getActiveSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  changeSubscriptionPlan,
};

export default subscriptionService;
