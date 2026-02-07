/**
 * Instance Service
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type { InstancePublic, InstanceCreate, InstanceUpdate, ResponseMessage } from '@/types';

export async function getInstances(): Promise<InstancePublic[]> {
  return await get<InstancePublic[]>('/instancias');
}

export async function getInstance(idInstance: number | string): Promise<InstancePublic> {
  return await get<InstancePublic>(`/instancias/${idInstance}`);
}

export async function createInstance(data: InstanceCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/instancias', data);
}

export async function updateInstance(idInstance: number | string, data: InstanceUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/instancias/${idInstance}`, data);
}

export async function deleteInstance(idInstance: number | string): Promise<ResponseMessage> {
  return await del<ResponseMessage>(`/instancias/${idInstance}`);
}

const instanceService = {
  getInstances,
  getInstance,
  createInstance,
  updateInstance,
  deleteInstance,
};

export default instanceService;
