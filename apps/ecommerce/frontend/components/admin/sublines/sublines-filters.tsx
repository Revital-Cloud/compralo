'use client';

import React from 'react';
import { UniversalFilters } from '@repo/ui';
import { useCategories } from '@/hooks/use-categories';
import { useAllLines, useLinesByCategory } from '@/hooks/use-lines';
import { FilterConfig, SortOption } from '@/types/filters';

interface SublinesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'ASC' | 'DESC';
  onSortOrderChange: (value: 'ASC' | 'DESC') => void;
  category: string;
  onCategoryChange: (value: string) => void;
  line: string;
  onLineChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
}

export const SublinesFilters: React.FC<SublinesFiltersProps> = ({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  category,
  onCategoryChange,
  line,
  onLineChange,
  onClearFilters,
  totalResults
}) => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: allLines, isLoading: allLinesLoading } = useAllLines();
  const catId = Number(category) || 0;
  const { data: linesByCat, isLoading: linesByCatLoading } = useLinesByCategory(catId);
  const lines = catId ? linesByCat : allLines;
  const linesLoading = catId ? linesByCatLoading : allLinesLoading;

  const sortOptions: SortOption[] = [
    { value: 'nombre', label: 'Nombre' },
    { value: 'linea', label: 'Línea' },
    { value: 'categoria', label: 'Categoría' },
    { value: 'fecha', label: 'Fecha de creación' }
  ];

  const hasActiveFilters = search || category || line || sortBy !== 'nombre' || sortOrder !== 'ASC';

  const filters: FilterConfig[] = [
    {
      id: 'category',
      label: 'Categoría',
      type: 'select',
      value: category,
      onChange: onCategoryChange,
      options: (categories || []).map((cat: any) => ({ id: `${cat.id}`, nombre: `${cat.name}`, label: `${cat.name} (ID: ${cat.id})` })),
      isLoading: categoriesLoading
    },
    {
      id: 'line',
      label: 'Línea',
      type: 'select',
      value: line,
      onChange: onLineChange,
      options: (lines as any)?.map((l: any) => ({ id: `${(l as any).id_categoria}-${l.id_linea}`, nombre: `${l.nom_linea}`, label: `${l.nom_linea} — Cat ${ (l as any).id_categoria }` })) || [],
      isLoading: linesLoading
    }
  ];

  return (
    <UniversalFilters
      title="Filtros de Sublíneas"
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar sublínea..."
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

