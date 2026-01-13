'use client';

import React from 'react';
import { UniversalFilters } from '@repo/ui';
import { FilterConfig, SortOption } from '@/types/filters';

interface CategoriesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'ASC' | 'DESC';
  onSortOrderChange: (value: 'ASC' | 'DESC') => void;
  onClearFilters: () => void;
  totalResults: number;
}

export const CategoriesFilters: React.FC<CategoriesFiltersProps> = ({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
  totalResults
}) => {
  // Opciones de ordenamiento específicas para categorías
  const sortOptions: SortOption[] = [
    { value: 'nombre', label: 'Nombre' },
    { value: 'fecha', label: 'Fecha de creación' }
  ];

  const hasActiveFilters = search || sortBy !== 'nombre' || sortOrder !== 'ASC';

  // Sin filtros adicionales para categorías (solo búsqueda y ordenamiento)
  const filters: FilterConfig[] = [];

  return (
    <UniversalFilters
      title="Filtros de Categorías"
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar categoría..."
      filters={filters}
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      sortOrder={sortOrder}
      onSortOrderChange={onSortOrderChange}
      sortOptions={sortOptions}
      totalResults={totalResults}
      onClearFilters={onClearFilters}
      hasActiveFilters={hasActiveFilters}
      showStockBadges={false}
      showTotalResults={true}
      compact={true}
    />
  );
};

