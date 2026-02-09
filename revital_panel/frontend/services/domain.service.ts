/**
 * Domain Service
 */

import { get, post, put, del } from '@/utils/apiWrapper';
import type { DomainPublic, DomainCreate, DomainUpdate, ResponseMessage } from '@/types';

export async function getDomains(idInstance?: number | string): Promise<DomainPublic[]> {
  const url = idInstance ? `/domains?id_instancia=${idInstance}` : '/domains';
  return await get<DomainPublic[]>(url);
}

export async function getDomain(idDomain: number | string): Promise<DomainPublic> {
  return await get<DomainPublic>(`/domains/${idDomain}`);
}

export async function createDomain(data: DomainCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/domains', data);
}

export async function updateDomain(idDomain: number | string, data: DomainUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/domains/${idDomain}`, data);
}

export async function deleteDomain(idDomain: number | string): Promise<ResponseMessage> {
  return await del<ResponseMessage>(`/domains/${idDomain}`);
}

const domainService = {
  getDomains,
  getDomain,
  createDomain,
  updateDomain,
  deleteDomain,
};

export default domainService;
