'use client';

import React from 'react';
import { UniversalFilters } from "@/components/ui";
import { FilterConfig, SortOption } from '@/types/filters';

interface ProvidersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'ASC' | 'DESC';
  onSortOrderChange: (value: 'ASC' | 'DESC') => void;
  onClearFilters: () => void;
  totalResults: number;
}

export const ProvidersFilters: React.FC<ProvidersFiltersProps> = ({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
  totalResults
}) => {
  const sortOptions: SortOption[] = [
    { value: 'nombre', label: 'Nombre' },
    { value: 'fecha', label: 'Fecha de creación' }
  ];

  const hasActiveFilters = search || sortBy !== 'nombre' || sortOrder !== 'ASC';

  const filters: FilterConfig[] = [];

  return (
    <UniversalFilters
      title="Filtros de Proveedores"
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar proveedor..."
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

