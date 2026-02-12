'use client';

import React from 'react';
import { UniversalFilters } from '@/components/ui';

interface CategoriesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export const CategoriesFilters: React.FC<CategoriesFiltersProps> = ({
  search,
  onSearchChange,
  onClearFilters,
  totalResults,
}) => {
  const hasActiveFilters = !!search;

  return (
    <UniversalFilters
      title="Filtros de Categorías"
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar categoría..."
      filters={[]}
      sortOptions={[]}
      totalResults={totalResults}
      onClearFilters={onClearFilters}
      hasActiveFilters={hasActiveFilters}
      showStockBadges={false}
      showTotalResults={true}
      compact={true}
    />
  );
};
