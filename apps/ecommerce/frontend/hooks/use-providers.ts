import { useQuery } from '@tanstack/react-query';
import { providerService } from '@/services/provider.service';
import type { Provider } from '@/types/product';

export const useAllProviders = () => {
  return useQuery<Provider[]>({
    queryKey: ['providers', 'all'],
    queryFn: () => providerService.getAllProviders(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useProvider = (providerId: number) => {
  return useQuery<Provider>({
    queryKey: ['provider', providerId],
    queryFn: () => providerService.getProvider(providerId),
    enabled: !!providerId,
  });
};
