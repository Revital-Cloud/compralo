import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/services/category.service';
import { brandService } from '@/services/brand.service';
import { lineService } from '@/services/line.service';
import { sublineService } from '@/services/subline.service';
import { providerService } from '@/services/provider.service';
import type { FilterOption } from '@/types/filters';
import type {
  Category,
  Brand,
  ProductLine,
  ProductSubline,
  Provider,
} from '@/types/product';

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
      const [
        categories,
        brands,
        lines,
        sublines,
        providers,
      ] = await Promise.all([
        // Solo categorías activas
        getCategories() as Promise<Category[]>,
        brandService.getAllBrands() as Promise<Brand[]>,
        lineService.getAllLines() as Promise<ProductLine[]>,
        sublineService.getAllSublines() as Promise<ProductSubline[]>,
        providerService.getAllProviders() as Promise<Provider[]>,
      ]);

      const mapCategory = (c: Category): FilterOption => ({
        id: c.id_categoria,
        nombre: c.nom_categoria,
      });

      const mapBrand = (b: Brand): FilterOption => ({
        id: b.id_marca,
        nombre: b.nom_marca,
      });

      // Varias líneas / sublíneas pueden compartir el mismo id_linea / id_sublinea (por categoría),
      // pero para estos filtros solo necesitamos una opción por id para evitar múltiples elementos
      // con el mismo value (que es lo que causa varios checkmarks a la vez en el select).
      const uniqueLinesMap = new Map<string, ProductLine>();
      (lines || []).forEach((l) => {
        if (!l) return;
        const key = String((l as any).id_linea);
        if (key && !uniqueLinesMap.has(key)) {
          uniqueLinesMap.set(key, l);
        }
      });
      const uniqueLines = Array.from(uniqueLinesMap.values());

      const uniqueSublinesMap = new Map<string, ProductSubline>();
      (sublines || []).forEach((s) => {
        if (!s) return;
        const key = String((s as any).id_sublinea);
        if (key && !uniqueSublinesMap.has(key)) {
          uniqueSublinesMap.set(key, s);
        }
      });
      const uniqueSublines = Array.from(uniqueSublinesMap.values());

      const mapLine = (l: ProductLine): FilterOption => ({
        id: l.id_linea,
        nombre: l.nom_linea,
      });

      const mapSubline = (s: ProductSubline): FilterOption => ({
        id: s.id_sublinea,
        nombre: s.nom_sublinea,
      });

      const mapProvider = (p: Provider): FilterOption => ({
        id: p.id_proveedor,
        nombre: p.nom_proveedor,
      });

      return {
        categories: (categories || []).map(mapCategory),
        brands: (brands || []).map(mapBrand),
        lines: uniqueLines.map(mapLine),
        sublines: uniqueSublines.map(mapSubline),
        providers: (providers || []).map(mapProvider),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
};
