'use client';

import React, { useMemo } from 'react';
import { UniversalFilters } from "@/components/ui";
import { useFilterOptions } from '@/hooks';
import { FilterConfig, StockStats } from '@/types/filters';
import type { FilterOptions } from '@/types/product';

interface ProductsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  line?: string;
  onLineChange?: (value: string) => void;
  subline?: string;
  onSublineChange?: (value: string) => void;
  brand: string;
  onBrandChange: (value: string) => void;
  provider: string;
  onProviderChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
  products: any[];
  filterOptionsOverride?: FilterOptions | null;
  optionsLoading?: boolean;
  /** Estadísticas de stock del conjunto completo (no solo la página actual); evita que cambien al paginar */
  stockStatsOverride?: StockStats | null;
}

export const ProductsFilters: React.FC<ProductsFiltersProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  line = '',
  onLineChange,
  subline = '',
  onSublineChange,
  brand,
  onBrandChange,
  provider,
  onProviderChange,
  onClearFilters,
  totalResults,
  products,
  filterOptionsOverride,
  optionsLoading: optionsLoadingOverride,
  stockStatsOverride,
}) => {
  const { data: filterOptionsFromHook, isLoading: hookLoading } = useFilterOptions();
  const filterOptions = filterOptionsOverride ?? filterOptionsFromHook;
  const isLoading = optionsLoadingOverride ?? hookLoading;

  const rawCategories = filterOptions?.categorias ?? [];
  const rawBrands = filterOptions?.marcas ?? [];
  const rawProviders = filterOptions?.proveedores ?? [];

  type CatWithParent = { id: number; nom_categoria?: string; name?: string; parent_id?: number | null; parentId?: number | null };
  const categoriesWithParent = rawCategories as CatWithParent[];
  const getParentId = (c: CatWithParent) => {
    const p = c.parent_id ?? (c as { parentId?: number | null }).parentId;
    return p == null ? null : Number(p);
  };
  const roots = categoriesWithParent.filter((c) => getParentId(c) === null);

  // Categoría = solo raíces (padre, parent_id null)
  const categoryOptions = roots.map((c) => ({
    id: Number(c.id),
    nombre: (c.nom_categoria ?? c.name) ?? '',
  }));

  // Línea = hijas (parent_id = raíz). Si hay Categoría elegida, solo hijas de esa raíz
  const lineCandidates = categoriesWithParent.filter((c) => {
    const pid = getParentId(c);
    return pid != null && roots.some((r) => Number(r.id) === pid);
  });
  const lineOptions = (category
    ? lineCandidates.filter((c) => getParentId(c) === Number(category))
    : lineCandidates
  ).map((c) => ({
    id: Number(c.id),
    nombre: (c.nom_categoria ?? c.name) ?? '',
  }));

  // Sublínea = nietas (categorías cuyo padre es una línea/hija). Si hay Línea elegida, solo las de esa línea
  const lineIds = new Set(lineCandidates.map((c) => Number(c.id)));
  const allNietas = categoriesWithParent.filter((c) => {
    const pid = getParentId(c);
    return pid != null && lineIds.has(pid);
  });
  const sublineOptions: { id: number; nombre: string }[] = onSublineChange
    ? (line
        ? allNietas.filter((c) => getParentId(c) === Number(line))
        : allNietas
      ).map((c) => ({
        id: Number(c.id),
        nombre: (c.nom_categoria ?? c.name) ?? '',
      }))
    : [];

  const brandOptions = rawBrands.map((b: any) => ({
    id: b.id_marca,
    nombre: b.nom_marca,
  }));

  const providerOptions = rawProviders.map((p: any) => ({
    id: p.id_proveedor,
    nombre: p.nom_proveedor,
  }));

  const hasActiveFilters = Boolean(search || category || line || subline || brand || provider);

  const computedStockStats = useMemo(() => {
    return products.reduce((acc, product) => {
      const stock = product.num_stock ?? product.stock_total ?? 0;
      if (stock === 0) acc.sinStock++;
      else if (stock <= 10) acc.stockBajo++;
      else acc.enStock++;
      return acc;
    }, { enStock: 0, stockBajo: 0, sinStock: 0 });
  }, [products]);
  const stockStats: StockStats = stockStatsOverride ?? computedStockStats;

  const filters: FilterConfig[] = [
    {
      id: 'category',
      label: 'Categoría',
      emptyOptionLabel: 'Todas las categorías',
      type: 'select',
      value: category,
      onChange: onCategoryChange,
      options: categoryOptions,
      isLoading,
    },
    ...(onLineChange
      ? [
          {
            id: 'line',
            label: 'Línea',
            emptyOptionLabel: 'Todas las líneas',
            type: 'select' as const,
            value: line,
            onChange: onLineChange,
            options: lineOptions,
            isLoading,
          },
        ]
      : []),
    ...(onSublineChange
      ? [
          {
            id: 'subline',
            label: 'Sublínea',
            emptyOptionLabel: 'Todas las sublíneas',
            type: 'select' as const,
            value: subline,
            onChange: onSublineChange,
            options: sublineOptions,
            isLoading,
          },
        ]
      : []),
    {
      id: 'brand',
      label: 'Marca',
      emptyOptionLabel: 'Todas las marcas',
      type: 'select',
      value: brand,
      onChange: onBrandChange,
      options: brandOptions,
      isLoading,
    },
    {
      id: 'provider',
      label: 'Proveedor',
      emptyOptionLabel: 'Todos los proveedores',
      type: 'select',
      value: provider,
      onChange: onProviderChange,
      options: providerOptions,
      isLoading,
    },
  ];

  return (
    <UniversalFilters
      title="Filtros"
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Nombre del producto..."
      filters={filters}
      stockStats={stockStats}
      totalResults={totalResults}
      onClearFilters={onClearFilters}
      hasActiveFilters={hasActiveFilters}
      showStockBadges={true}
      showTotalResults={true}
      compact={true}
    />
  );
};