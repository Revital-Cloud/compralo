import apiWrapper from '@/utils/apiWrapper';
import type { Provider } from '@/types/product';

class ProviderService {
  async getAllProviders(): Promise<Provider[]> {
    return apiWrapper.get(`/providers`);
  }

  async getProvider(providerId: number): Promise<Provider> {
    return apiWrapper.get(`/providers/${providerId}`);
  }
}

export const providerService = new ProviderService();
