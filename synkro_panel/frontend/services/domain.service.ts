/**
 * Domain Service
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type { DomainPublic, DomainCreate, DomainUpdate, ResponseMessage } from '@/types';

export async function getDomains(idInstance?: number | string): Promise<DomainPublic[]> {
  const url = idInstance ? `/dominios?id_instancia=${idInstance}` : '/dominios';
  return await get<DomainPublic[]>(url);
}

export async function getDomain(idDomain: number | string): Promise<DomainPublic> {
  return await get<DomainPublic>(`/dominios/${idDomain}`);
}

export async function createDomain(data: DomainCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/dominios', data);
}

export async function updateDomain(idDomain: number | string, data: DomainUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/dominios/${idDomain}`, data);
}

export async function deleteDomain(idDomain: number | string): Promise<ResponseMessage> {
  return await del<ResponseMessage>(`/dominios/${idDomain}`);
}

const domainService = {
  getDomains,
  getDomain,
  createDomain,
  updateDomain,
  deleteDomain,
};

export default domainService;
