import apiWrapper from '@/utils/apiWrapper';
import type { Provider } from '@/types/product';

class ProviderService {
  async getAllProviders(): Promise<Provider[]> {
    return apiWrapper.get(`/providers`);
  }

  async getProvider(providerId: number): Promise<Provider> {
    return apiWrapper.get(`/providers/${providerId}`);
  }

  async updateProvider(providerId: number, payload: { nom_proveedor?: string; email?: string; tel_proveedor?: number; ind_activo?: boolean }): Promise<{ message: string }> {
    return apiWrapper.put(`/providers/${providerId}`, payload);
  }

  async deactivateActivateProvider(providerId: number, activar: boolean): Promise<{ message: string }> {
    return apiWrapper.put(`/providers/${providerId}/toggle`, { activar });
  }

  async deactivateProvider(providerId: number): Promise<{ message: string }> {
    return this.deactivateActivateProvider(providerId, false);
  }

  async createProvider(payload: { nom_proveedor: string; email: string; tel_proveedor: number; ind_activo?: boolean }): Promise<Provider> {
    return apiWrapper.post(`/providers`, payload);
  }
}

export const providerService = new ProviderService();
