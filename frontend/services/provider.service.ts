import apiWrapper from '@/utils/apiWrapper';
import type { Provider } from '@/types/product';

class ProviderService {
  async getAllProviders(): Promise<Provider[]> {
    return apiWrapper.get(`/providers`);
  }

  async getProvider(providerId: number): Promise<Provider> {
    return apiWrapper.get(`/providers/${providerId}`);
  }

  async updateProvider(providerId: number, payload: { nom_proveedor?: string; des_proveedor?: string; ind_activo?: boolean }): Promise<{ message: string }> {
    return apiWrapper.put(`/providers/${providerId}`, payload);
  }

  async deactivateProvider(providerId: number): Promise<{ message: string }> {
    return apiWrapper.put(`/providers/${providerId}/deactivate`, {});
  }
}

export const providerService = new ProviderService();
