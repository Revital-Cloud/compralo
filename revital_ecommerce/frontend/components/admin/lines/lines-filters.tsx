'use client';

import React from 'react';
import { UniversalFilters } from "@/components/ui";
import { useCategories } from '@/hooks/use-categories';
import { FilterConfig } from '@/types/filters';

interface LinesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export const LinesFilters: React.FC<LinesFiltersProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onClearFilters,
  totalResults
}) => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const hasActiveFilters = !!search || !!category;

  const filters: FilterConfig[] = [
    {
      id: 'category',
      label: 'Categoría',
      type: 'select',
      value: category,
      onChange: onCategoryChange,
      options: (categories || []).map((cat: any) => ({ id: `${cat.id}`, nombre: `${cat.name}`, label: `${cat.name} (ID: ${cat.id})` })),
      isLoading: categoriesLoading
    }
  ];

  return (
    <UniversalFilters
      title="Filtros de Líneas"
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar línea..."
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

