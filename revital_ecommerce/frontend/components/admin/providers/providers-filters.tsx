'use client';

import React from 'react';
import { UniversalFilters } from "@/components/ui";
import { FilterConfig } from '@/types/filters';

interface ProvidersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export const ProvidersFilters: React.FC<ProvidersFiltersProps> = ({
  search,
  onSearchChange,
  onClearFilters,
  totalResults
}) => {
  const hasActiveFilters = !!search;
  const filters: FilterConfig[] = [];

  return (
    <UniversalFilters
      title="Filtros de Proveedores"
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar proveedor..."
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
