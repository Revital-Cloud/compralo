/**
 * Servicio de Deployments
 */

import { get, post, put } from '@/utils/apiWrapper';
import type { DeploymentPublic, DeploymentCreate, DeploymentUpdate, ResponseMessage } from '@/types';

export async function getDeployments(idInstancia?: number | string): Promise<DeploymentPublic[]> {
  const url = idInstancia ? `/deployments?id_instancia=${idInstancia}` : '/deployments';
  return await get<DeploymentPublic[]>(url);
}

export async function getDeployment(idDeployment: number | string): Promise<DeploymentPublic> {
  return await get<DeploymentPublic>(`/deployments/${idDeployment}`);
}

export async function createDeployment(data: DeploymentCreate): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/deployments', data);
}

export async function updateDeployment(idDeployment: number | string, data: DeploymentUpdate): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/deployments/${idDeployment}`, data);
}

const deploymentService = {
  getDeployments,
  getDeployment,
  createDeployment,
  updateDeployment,
};

export default deploymentService;
