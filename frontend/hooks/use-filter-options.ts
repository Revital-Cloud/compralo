import { useQuery } from '@tanstack/react-query';
import { get } from '@/utils/apiWrapper';

interface FilterOption {
  id: string;
  nombre: string;
}

interface FilterOptions {
  categories: FilterOption[];
  brands: FilterOption[];
  lines: FilterOption[];
  sublines: FilterOption[];
  providers: FilterOption[];
}

export const useFilterOptions = () => {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: async (): Promise<FilterOptions> => {
      const [categories, brands, lines, sublines, providers] = await Promise.all([
        get<FilterOption[]>('/categories'),
        get<FilterOption[]>('/brands'),
        get<FilterOption[]>('/lines'),
        get<FilterOption[]>('/sublines'),
        get<FilterOption[]>('/providers'),
      ]);

      return {
        categories: categories || [],
        brands: brands || [],
        lines: lines || [],
        sublines: sublines || [],
        providers: providers || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};
