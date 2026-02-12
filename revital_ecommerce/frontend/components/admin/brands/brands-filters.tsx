'use client';

import React from 'react';
import { UniversalFilters } from "@/components/ui";
import { FilterConfig } from '@/types/filters';

interface BrandsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export const BrandsFilters: React.FC<BrandsFiltersProps> = ({
  search,
  onSearchChange,
  onClearFilters,
  totalResults
}) => {
  const hasActiveFilters = !!search;
  const filters: FilterConfig[] = [];

  return (
    <UniversalFilters
      title="Filtros de Marcas"
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar marca..."
      filters={filters}
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
