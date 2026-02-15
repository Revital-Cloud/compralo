import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/services/category.service';
import { brandService } from '@/services/brand.service';
import { providerService } from '@/services/provider.service';
import type { FilterOption } from '@/types/filters';
import type { Category, Brand, Provider } from '@/types/product';

interface FilterOptions {
  categories: FilterOption[];
  brands: FilterOption[];
  providers: FilterOption[];
}

export const useFilterOptions = () => {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: async (): Promise<FilterOptions> => {
      const [categories, brands, providers] = await Promise.all([
        getCategories() as Promise<Category[]>,
        brandService.getAllBrands() as Promise<Brand[]>,
        providerService.getAllProviders() as Promise<Provider[]>,
      ]);

      const mapCategory = (c: Category): FilterOption => ({
        id: (c as { id?: number }).id ?? (c as { id_categoria?: number }).id_categoria ?? 0,
        nombre: c.name,
      });

      const mapBrand = (b: Brand): FilterOption => ({
        id: b.id_marca,
        nombre: b.nom_marca,
      });

      const mapProvider = (p: Provider): FilterOption => ({
        id: p.id_proveedor,
        nombre: p.nom_proveedor,
      });

      return {
        categories: (categories || []).map(mapCategory),
        brands: (brands || []).map(mapBrand),
        providers: (providers || []).map(mapProvider),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};
