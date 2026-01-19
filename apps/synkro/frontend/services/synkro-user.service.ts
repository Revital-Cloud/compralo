/**
 * Synkro User (Admin) Service
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type { SynkroUserPublic, SynkroUserCreate, SynkroUserUpdate, ResponseMessage } from '@/types';

export async function getSynkroUsers(): Promise<SynkroUserPublic[]> {
  return await get<SynkroUserPublic[]>('/admin/usuarios');
}

export async function getSynkroUser(idUser: number | string): Promise<SynkroUserPublic> {
  return await get<SynkroUserPublic>(`/admin/usuarios/${idUser}`);
}

export async function createSynkroUser(data: SynkroUserCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/admin/usuarios', data);
}

export async function updateSynkroUser(idUser: number | string, data: SynkroUserUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/admin/usuarios/${idUser}`, data);
}

export async function deleteSynkroUser(idUser: number | string): Promise<ResponseMessage> {
  return await del<ResponseMessage>(`/admin/usuarios/${idUser}`);
}

const synkroUserService = {
  getSynkroUsers,
  getSynkroUser,
  createSynkroUser,
  updateSynkroUser,
  deleteSynkroUser,
};

export default synkroUserService;
