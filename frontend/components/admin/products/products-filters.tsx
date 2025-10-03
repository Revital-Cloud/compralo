'use client';

import React, { useMemo } from 'react';
import { UniversalFilters } from '@/components/ui/universal-filters';
import { useFilterOptions } from '@/hooks/use-filter-options';
import { FilterConfig, SortOption, StockStats } from '@/types/filters';

interface ProductsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'ASC' | 'DESC';
  onSortOrderChange: (value: 'ASC' | 'DESC') => void;
  category: string;
  onCategoryChange: (value: string) => void;
  brand: string;
  onBrandChange: (value: string) => void;
  line: string;
  onLineChange: (value: string) => void;
  subline: string;
  onSublineChange: (value: string) => void;
  provider: string;
  onProviderChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
  products: any[];
}

export const ProductsFilters: React.FC<ProductsFiltersProps> = ({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  category,
  onCategoryChange,
  brand,
  onBrandChange,
  line,
  onLineChange,
  subline,
  onSublineChange,
  provider,
  onProviderChange,
  onClearFilters,
  totalResults,
  products
}) => {
  const { data: filterOptions, isLoading } = useFilterOptions();

  // Opciones de ordenamiento
  const sortOptions: SortOption[] = [
    { value: 'nombre', label: 'Nombre' },
    { value: 'precio', label: 'Precio' },
    { value: 'stock', label: 'Stock' },
    { value: 'fecha', label: 'Fecha de creación' },
    { value: 'categoria', label: 'Categoría' },
    { value: 'marca', label: 'Marca' }
  ];

  // Verificar si hay filtros activos
  const hasActiveFilters = search || category || brand || line || subline || provider || sortBy !== 'nombre' || sortOrder !== 'ASC';

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
      type: 'select',
      value: category,
      onChange: onCategoryChange,
      options: filterOptions?.categories || [],
      isLoading
    },
    {
      id: 'line',
      label: 'Línea',
      type: 'select',
      value: line,
      onChange: onLineChange,
      options: filterOptions?.lines || [],
      isLoading
    },
    {
      id: 'subline',
      label: 'Sublínea',
      type: 'select',
      value: subline,
      onChange: onSublineChange,
      options: filterOptions?.sublines || [],
      isLoading
    },
    {
      id: 'brand',
      label: 'Marca',
      type: 'select',
      value: brand,
      onChange: onBrandChange,
      options: filterOptions?.brands || [],
      isLoading
    },
    {
      id: 'provider',
      label: 'Proveedor',
      type: 'select',
      value: provider,
      onChange: onProviderChange,
      options: filterOptions?.providers || [],
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
      sortOptions={sortOptions}
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