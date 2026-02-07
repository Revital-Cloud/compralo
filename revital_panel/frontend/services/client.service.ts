/**
 * Client Service
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type {
  ClientPublic,
  ClientCreate,
  ClientUpdate,
  ResponseMessage,
  SubscriptionPublic,
  PlanPublic,
} from '@/types';

export async function getClients(): Promise<ClientPublic[]> {
  return await get<ClientPublic[]>('/clients');
}

export async function getClient(identificacionFiscal: string): Promise<ClientPublic> {
  return await get<ClientPublic>(`/clients/${identificacionFiscal}`);
}

export async function getMyProfile(): Promise<ClientPublic> {
  return await get<ClientPublic>('/clients/me');
}

export async function updateMyProfile(data: ClientUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>('/clients/me', data);
}

export async function getMySubscription(): Promise<SubscriptionPublic | null> {
  return await get<SubscriptionPublic | null>('/clients/me/subscription');
}

export async function getMyPlan(): Promise<PlanPublic | null> {
  return await get<PlanPublic | null>('/clients/me/plan');
}

export async function createClient(data: ClientCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/clients', data);
}

export async function updateClient(identificacionFiscal: string, data: ClientUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/clients/${identificacionFiscal}`, data);
}

export async function deleteClient(identificacionFiscal: string): Promise<ResponseMessage> {
  return await del<ResponseMessage>(`/clients/${identificacionFiscal}`);
}

const clientService = {
  getClients,
  getClient,
  getMyProfile,
  updateMyProfile,
  getMySubscription,
  getMyPlan,
  createClient,
  updateClient,
  deleteClient,
};

export default clientService;
