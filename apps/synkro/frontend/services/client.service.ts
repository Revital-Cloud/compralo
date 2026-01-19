/**
 * Client Service
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type { ClientPublic, ClientCreate, ClientUpdate, ResponseMessage } from '@/types';

export async function getClients(): Promise<ClientPublic[]> {
  return await get<ClientPublic[]>('/clientes');
}

export async function getClient(identificacionFiscal: string): Promise<ClientPublic> {
  return await get<ClientPublic>(`/clientes/${identificacionFiscal}`);
}

export async function getMyProfile(): Promise<ClientPublic> {
  return await get<ClientPublic>('/clientes/me');
}

export async function updateMyProfile(data: ClientUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>('/clientes/me', data);
}

export async function getMySubscription(): Promise<any> {
  return await get('/clientes/me/suscripcion');
}

export async function getMyPlan(): Promise<any> {
  return await get('/clientes/me/plan');
}

export async function createClient(data: ClientCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/clientes', data);
}

export async function updateClient(identificacionFiscal: string, data: ClientUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/clientes/${identificacionFiscal}`, data);
}

export async function deleteClient(identificacionFiscal: string): Promise<ResponseMessage> {
  return await del<ResponseMessage>(`/clientes/${identificacionFiscal}`);
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
