/**
 * Revital User (Admin) Service
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type { RevitalUserPublic, RevitalUserCreate, RevitalUserUpdate, ResponseMessage } from '@/types';

export async function getRevitalUsers(): Promise<RevitalUserPublic[]> {
  return await get<RevitalUserPublic[]>('/admin/users');
}

export async function getRevitalUser(idUser: number | string): Promise<RevitalUserPublic> {
  return await get<RevitalUserPublic>(`/admin/users/${idUser}`);
}

export async function createRevitalUser(data: RevitalUserCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/admin/users', data);
}

export async function updateRevitalUser(idUser: number | string, data: RevitalUserUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/admin/users/${idUser}`, data);
}

export async function deleteRevitalUser(idUser: number | string): Promise<ResponseMessage> {
  return await del<ResponseMessage>(`/admin/users/${idUser}`);
}

const revitalUserService = {
  getRevitalUsers,
  getRevitalUser,
  createRevitalUser,
  updateRevitalUser,
  deleteRevitalUser,
};

export default revitalUserService;
