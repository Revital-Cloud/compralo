'use client';

import React from 'react';
import { UniversalFilters } from "@/components/ui";
import { useCategories } from '@/hooks/use-categories';
import { FilterConfig, SortOption } from '@/types/filters';

interface LinesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'ASC' | 'DESC';
  onSortOrderChange: (value: 'ASC' | 'DESC') => void;
  category: string;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export const LinesFilters: React.FC<LinesFiltersProps> = ({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  category,
  onCategoryChange,
  onClearFilters,
  totalResults
}) => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const sortOptions: SortOption[] = [
    { value: 'nombre', label: 'Nombre' },
    { value: 'categoria', label: 'Categoría' },
    { value: 'fecha', label: 'Fecha de creación' }
  ];

  const hasActiveFilters = search || category || sortBy !== 'nombre' || sortOrder !== 'ASC';

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

