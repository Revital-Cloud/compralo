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
} from '@/types';

export async function getSubscriptions(): Promise<SubscriptionPublic[]> {
  return await get<SubscriptionPublic[]>('/suscripciones');
}

export async function getActiveSubscriptions(): Promise<ActiveSubscriptionWithPlan[]> {
  return await get<ActiveSubscriptionWithPlan[]>('/suscripciones/activas');
}

export async function getSubscription(idSubscription: number | string): Promise<SubscriptionPublic> {
  return await get<SubscriptionPublic>(`/suscripciones/${idSubscription}`);
}

export async function createSubscription(data: SubscriptionCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/suscripciones', data);
}

export async function updateSubscription(idSubscription: number | string, data: SubscriptionUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/suscripciones/${idSubscription}`, data);
}

export async function cancelSubscription(idSubscription: number | string, motivo?: string): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/suscripciones/${idSubscription}`, {
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
    `/suscripciones/${idSubscription}/cambiar-plan?${params.toString()}`,
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
