'use client';

import React, { useMemo } from 'react';
import { UniversalFilters } from "@/components/ui";
import { useFilterOptions } from '@/hooks';
import { FilterConfig, StockStats } from '@/types/filters';
import type { FilterOptions } from '@/types/product';

interface ProductsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy?: string;
  onSortByChange?: (value: string) => void;
  sortOrder?: 'ASC' | 'DESC';
  onSortOrderChange?: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  brand: string;
  onBrandChange: (value: string) => void;
  provider: string;
  onProviderChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
  products: any[];
  filterOptionsOverride?: FilterOptions | null;
  optionsLoading?: boolean;
}

const SORT_OPTIONS = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'precio', label: 'Precio' },
  { value: 'stock', label: 'Stock' },
  { value: 'fecha', label: 'Fecha' },
  { value: 'categoria', label: 'Categoría' },
  { value: 'marca', label: 'Marca' },
];

export const ProductsFilters: React.FC<ProductsFiltersProps> = ({
  search,
  onSearchChange,
  sortBy = 'nombre',
  onSortByChange,
  sortOrder = 'ASC',
  onSortOrderChange,
  category,
  onCategoryChange,
  brand,
  onBrandChange,
  provider,
  onProviderChange,
  onClearFilters,
  totalResults,
  products,
  filterOptionsOverride,
  optionsLoading: optionsLoadingOverride,
}) => {
  const { data: filterOptionsFromHook, isLoading: hookLoading } = useFilterOptions();
  const filterOptions = filterOptionsOverride ?? filterOptionsFromHook;
  const isLoading = optionsLoadingOverride ?? hookLoading;

  const rawCategories = filterOptions?.categorias ?? [];
  const rawBrands = filterOptions?.marcas ?? [];
  const rawProviders = filterOptions?.proveedores ?? [];

  const categoryOptions = rawCategories.map((c: any) => ({
    id: c.id ?? c.category_id,
    nombre: c.name,
  }));

  const brandOptions = rawBrands.map((b: any) => ({
    id: b.id_marca,
    nombre: b.nom_marca,
  }));

  const providerOptions = rawProviders.map((p: any) => ({
    id: p.id_proveedor,
    nombre: p.nom_proveedor,
  }));

  const hasActiveFilters = Boolean(search || category || brand || provider);

  // Calcular estadísticas de stock
  const stockStats: StockStats = useMemo(() => {
    return products.reduce((acc, product) => {
      const stock = product.num_stock || 0;
      if (stock === 0) {
        acc.sinStock++;
      } else if (stock <= 10) {
        acc.stockBajo++;
      } else {
        acc.enStock++;
      }
      return acc;
    }, { enStock: 0, stockBajo: 0, sinStock: 0 });
  }, [products]);

  // Configurar filtros dinámicos
  const filters: FilterConfig[] = [
    {
      id: 'category',
      label: 'Categoría',
      emptyOptionLabel: 'Todas las categorías',
      type: 'select',
      value: category,
      onChange: onCategoryChange,
      options: categoryOptions,
      isLoading
    },
    {
      id: 'brand',
      label: 'Marca',
      emptyOptionLabel: 'Todas las marcas',
      type: 'select',
      value: brand,
      onChange: onBrandChange,
      options: brandOptions,
      isLoading
    },
    {
      id: 'provider',
      label: 'Proveedor',
      emptyOptionLabel: 'Todos los proveedores',
      type: 'select',
      value: provider,
      onChange: onProviderChange,
      options: providerOptions,
      isLoading
    }
  ];

  return (
    <UniversalFilters
      title="Filtros"
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Nombre del producto..."
      filters={filters}
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      sortOrder={sortOrder}
      onSortOrderChange={onSortOrderChange}
      sortOptions={SORT_OPTIONS}
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