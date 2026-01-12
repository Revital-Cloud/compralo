/**
 * Subscription Service
 */

import { get, post, put } from '@/utils/apiWrapper';
import type { SubscriptionPublic, SubscriptionCreate, SubscriptionUpdate, ResponseMessage } from '@/types';

export async function getSubscriptions(): Promise<SubscriptionPublic[]> {
  return await get<SubscriptionPublic[]>('/suscripciones');
}

export async function getActiveSubscriptions(): Promise<any[]> {
  return await get<any[]>('/suscripciones/activas');
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

const subscriptionService = {
  getSubscriptions,
  getActiveSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
};

export default subscriptionService;
