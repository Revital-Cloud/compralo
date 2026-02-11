'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import {
  IconSearch,
  IconFilter,
  IconX,
  IconSortAscending,
  IconSortDescending,
  IconLoader2
} from "@tabler/icons-react";
import { UniversalFiltersConfig, FilterConfig } from '@/types/filters';

interface UniversalFiltersProps extends UniversalFiltersConfig {}

export const UniversalFilters: React.FC<UniversalFiltersProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters = [],
  sortBy = 'nombre',
  onSortByChange,
  sortOrder = 'ASC',
  onSortOrderChange,
  sortOptions = [{ value: 'nombre', label: 'Nombre' }],
  stockStats,
  totalResults = 0,
  onClearFilters,
  hasActiveFilters = false,
  title = 'Filtros',
  showStockBadges = false,
  showTotalResults = true,
  compact = true,
}) => {
  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'search':
        return (
          <div key={filter.id} className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={filter.placeholder || 'Buscar...'}
              value={filter.value || ''}
              onChange={(e) => filter.onChange?.(e.target.value)}
              className="pl-8 h-9 text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        );

      case 'select':
        return (
          <Select
            value={filter.value && String(filter.value) ? String(filter.value) : "all"}
            onValueChange={(v) => filter.onChange?.(v === "all" ? "" : v)}
            disabled={filter.isLoading}
          >
            <SelectTrigger className="h-9 text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder={filter.isLoading ? 'Cargando...' : (filter.emptyOptionLabel ?? `Todos los ${filter.label.toLowerCase()}`)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {filter.isLoading ? 'Cargando...' : (filter.emptyOptionLabel ?? `Todos los ${filter.label.toLowerCase()}`)}
              </SelectItem>
              {!filter.isLoading && filter.options?.map((option, idx) => (
                <SelectItem key={`${filter.id}-${String(option.id)}-${idx}`} value={String(option.id)}>
                  {option.label || option.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconFilter className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          {showTotalResults && (
            <Badge variant="secondary" className="text-xs font-medium">
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        {showStockBadges && stockStats && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 text-xs font-medium">
              En Stock: {stockStats.enStock}
            </Badge>
            <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 text-xs font-medium">
              Stock Bajo: {stockStats.stockBajo}
            </Badge>
            <Badge className="bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800 text-xs font-medium">
              Sin Stock: {stockStats.sinStock}
            </Badge>
          </div>
        )}
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardContent className={compact ? 'p-4' : 'p-6'}>
          <div className="space-y-4">
            {/* Search and Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
              {/* Búsqueda principal */}
              {onSearchChange && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-300/90 dark:text-gray-300">
                    Buscar
                  </label>
                  <div className="relative">
                    <IconSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchValue}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-8 h-9 text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {/* Filtros dinámicos */}
              {filters.map((f) => (
                <div key={f.id} className="space-y-1">
                  <label className="text-xs font-medium text-gray-300/90 dark:text-gray-300">{f.label}</label>
                  {renderFilter({ ...f } as any)}
                </div>
              ))}
            </div>

            {/* Sort and Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Ordenar por */}
                {onSortByChange && sortOptions.length > 0 && (
                  <>
                    <label className="text-xs font-medium text-gray-300/90 dark:text-gray-300">
                      Ordenar:
                    </label>
                    <Select value={sortBy} onValueChange={onSortByChange}>
                      <SelectTrigger className="h-8 text-sm w-full min-w-[140px]">
                        <SelectValue placeholder="Ordenar" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Botón de orden */}
                    {onSortOrderChange && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSortOrderChange(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                        className="h-8 px-2.5"
                        title={sortOrder === 'ASC' ? 'Orden ascendente' : 'Orden descendente'}
                      >
                        {sortOrder === 'ASC' ? (
                          <IconSortAscending className="h-4 w-4" />
                        ) : (
                          <IconSortDescending className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && onClearFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-sm text-muted-foreground hover:text-foreground h-8 gap-1.5"
                >
                  <IconX className="h-4 w-4" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

