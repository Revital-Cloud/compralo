'use client';

import React from 'react';
import { UniversalFilters } from '@/components/ui';
import type { FilterConfig } from '@/types/filters';

interface CategoriesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
  /** Filtros adicionales según el tab (ej. Categoría padre en Línea, Línea padre en Sublínea). */
  extraFilters?: FilterConfig[];
  /** Título opcional (ej. "Filtros de Líneas"). */
  title?: string;
  /** Placeholder del buscador según el tab (ej. "Buscar línea..."). */
  searchPlaceholder?: string;
}

export const CategoriesFilters: React.FC<CategoriesFiltersProps> = ({
  search,
  onSearchChange,
  onClearFilters,
  totalResults,
  extraFilters,
  title = 'Filtros de Categorías',
  searchPlaceholder = 'Buscar categoría...',
}) => {
  const hasActiveFilters =
    !!search || (extraFilters?.some((f) => f.value != null && f.value !== '') ?? false);

  return (
    <UniversalFilters
      title={title}
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      filters={extraFilters ?? []}
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
