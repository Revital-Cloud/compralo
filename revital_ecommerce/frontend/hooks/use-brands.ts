import { useQuery } from '@tanstack/react-query';
import { brandService } from '@/services/brand.service';
import type { Brand } from '@/types/product';

export const useAllBrands = () => {
  return useQuery<Brand[]>({
    queryKey: ['brands', 'all'],
    queryFn: () => brandService.getAllBrands(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useBrand = (brandId: number) => {
  return useQuery<Brand>({
    queryKey: ['brand', brandId],
    queryFn: () => brandService.getBrand(brandId),
    enabled: !!brandId,
  });
};
