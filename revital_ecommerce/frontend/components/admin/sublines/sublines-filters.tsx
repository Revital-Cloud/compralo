'use client';

import React from 'react';
import { UniversalFilters } from "@/components/ui";
import { useCategories } from '@/hooks/use-categories';
import { useAllLines, useLinesByCategory } from '@/hooks/use-lines';
import { FilterConfig } from '@/types/filters';

interface SublinesFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  line: string;
  onLineChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
  sortBy?: string;
  onSortByChange?: (value: string) => void;
  sortOrder?: 'ASC' | 'DESC';
  onSortOrderChange?: (value: string) => void;
}

export const SublinesFilters: React.FC<SublinesFiltersProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  line,
  onLineChange,
  onClearFilters,
  totalResults
}) => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const catId = Number(category) || 0;
  const { data: linesByCat, isLoading: linesByCatLoading } = useLinesByCategory(catId);
  const { data: allLines, isLoading: allLinesLoading } = useAllLines();
  const lines = catId ? linesByCat : allLines;
  const linesLoading = catId ? linesByCatLoading : allLinesLoading;

  const handleCategoryChange = (value: string) => {
    onCategoryChange(value);
    onLineChange('');
  };

  const handleLineChange = (value: string) => {
    if (value && value.includes('-')) {
      const [catId] = value.split('-');
      onCategoryChange(catId);
    }
    onLineChange(value);
  };

  const hasActiveFilters = !!search || !!category || !!line;

  const filters: FilterConfig[] = [
    {
      id: 'category',
      label: 'Categoría',
      type: 'select',
      value: category,
      onChange: handleCategoryChange,
      options: (categories || []).map((cat: any) => ({ id: `${cat.id}`, nombre: cat.name, label: cat.name })),
      isLoading: categoriesLoading
    },
    {
      id: 'line',
      label: 'Línea',
      type: 'select',
      value: line,
      onChange: handleLineChange,
      options: (lines as any)?.map((l: any) => ({ id: `${(l as any).id_categoria}-${l.id_linea}`, nombre: l.nom_linea, label: l.nom_linea })) || [],
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
