'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconSearch,
  IconFilter,
  IconX,
  IconSortAscending,
  IconSortDescending,
  IconId,
  IconList,
  IconLoader2
} from "@tabler/icons-react";
import { useFilterOptions } from '@/hooks/use-filter-options';

interface ProductsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'ASC' | 'DESC';
  onSortOrderChange: (value: 'ASC' | 'DESC') => void;
  category: string;
  onCategoryChange: (value: string) => void;
  brand: string;
  onBrandChange: (value: string) => void;
  line: string;
  onLineChange: (value: string) => void;
  subline: string;
  onSublineChange: (value: string) => void;
  provider: string;
  onProviderChange: (value: string) => void;
  onClearFilters: () => void;
  totalResults: number;
  products: any[];
}

export const ProductsFilters: React.FC<ProductsFiltersProps> = ({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  category,
  onCategoryChange,
  brand,
  onBrandChange,
  line,
  onLineChange,
  subline,
  onSublineChange,
  provider,
  onProviderChange,
  onClearFilters,
  totalResults,
  products
}) => {
  const { data: filterOptions, isLoading } = useFilterOptions();
  const sortOptions = [
    { value: 'nombre', label: 'Nombre' },
    { value: 'precio', label: 'Precio' },
    { value: 'stock', label: 'Stock' },
    { value: 'fecha', label: 'Fecha de creación' },
    { value: 'categoria', label: 'Categoría' },
    { value: 'marca', label: 'Marca' }
  ];

  const hasActiveFilters = search || category || brand || line || subline || provider || sortBy !== 'nombre' || sortOrder !== 'ASC';

  // Calcular estadísticas de stock
  const stockStats = products.reduce((acc, product) => {
    const stock = product.num_stock || 0;
    if (stock === 0) {
      acc.sinStock++;
    } else if (stock <= 10) {
      acc.stockBajo++;
    } else {
      acc.enStock++;
    }
    return acc;
  }, { enStock: 0, stockBajo: 0, sinStock: 0 });

  return (
    <div className="space-y-2">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <IconFilter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Filtros</h3>
          <Badge variant="secondary" className="text-xs">
            {totalResults} productos
          </Badge>
        </div>
        
        <div className="flex items-center space-x-1">
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
            En Stock: {stockStats.enStock}
          </Badge>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
            Stock Bajo: {stockStats.stockBajo}
          </Badge>
          <Badge variant="destructive" className="bg-red-100 hover:bg-red-100 text-xs text-white">
            Sin Stock: {stockStats.sinStock}
          </Badge>
        </div>
      </div>

      {/* Filtros compactos */}
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Primera fila: Búsqueda y filtros principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {/* Búsqueda */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Buscar</label>
                <div className="relative">
                  <IconSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Nombre del producto..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-7 h-7 text-xs"
                  />
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Categoría</label>
                <Select value={category || "all"} onValueChange={(value) => onCategoryChange(value === "all" ? "" : value)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        <IconLoader2 className="h-3 w-3 mr-2 animate-spin" />
                        Cargando...
                      </SelectItem>
                    ) : (
                      filterOptions?.categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </SelectItem>
                      )) || []
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Línea */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Línea</label>
                <Select value={line || "all"} onValueChange={(value) => onLineChange(value === "all" ? "" : value)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las líneas</SelectItem>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        <IconLoader2 className="h-3 w-3 mr-2 animate-spin" />
                        Cargando...
                      </SelectItem>
                    ) : (
                      filterOptions?.lines?.map((line) => (
                        <SelectItem key={line.id} value={line.id}>
                          {line.nombre}
                        </SelectItem>
                      )) || []
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Sublínea */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Sublínea</label>
                <Select value={subline || "all"} onValueChange={(value) => onSublineChange(value === "all" ? "" : value)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sublíneas</SelectItem>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        <IconLoader2 className="h-3 w-3 mr-2 animate-spin" />
                        Cargando...
                      </SelectItem>
                    ) : (
                      filterOptions?.sublines?.map((subline) => (
                        <SelectItem key={subline.id} value={subline.id}>
                          {subline.nombre}
                        </SelectItem>
                      )) || []
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Marca */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Marca</label>
                <Select value={brand || "all"} onValueChange={(value) => onBrandChange(value === "all" ? "" : value)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las marcas</SelectItem>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        <IconLoader2 className="h-3 w-3 mr-2 animate-spin" />
                        Cargando...
                      </SelectItem>
                    ) : (
                      filterOptions?.brands?.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.nombre}
                        </SelectItem>
                      )) || []
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Proveedor */}
              <div className="space-y-1">
                <label className="text-xs font-medium">Proveedor</label>
                <Select value={provider || "all"} onValueChange={(value) => onProviderChange(value === "all" ? "" : value)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proveedores</SelectItem>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        <IconLoader2 className="h-3 w-3 mr-2 animate-spin" />
                        Cargando...
                      </SelectItem>
                    ) : (
                      filterOptions?.providers?.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.nombre}
                        </SelectItem>
                      )) || []
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Segunda fila: Ordenamiento y controles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Ordenar por */}
                <div className="flex items-center space-x-1">
                  <label className="text-xs font-medium">Ordenar:</label>
                  <Select value={sortBy} onValueChange={onSortByChange}>
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botón de orden */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSortOrderChange(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                  className="h-7 px-2 text-xs"
                >
                  {sortOrder === 'ASC' ? (
                    <IconSortAscending className="h-3 w-3" />
                  ) : (
                    <IconSortDescending className="h-3 w-3" />
                  )}
                </Button>

                {/* Filtros activos */}
                {hasActiveFilters && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-muted-foreground">Activos:</span>
                    {search && (
                      <Badge variant="secondary" className="text-xs">
                        {search}
                      </Badge>
                    )}
                    {category && (
                      <Badge variant="secondary" className="text-xs">
                        Cat: {filterOptions?.categories.find(c => c.id === category)?.nombre || category}
                      </Badge>
                    )}
                    {brand && (
                      <Badge variant="secondary" className="text-xs">
                        Marca: {filterOptions?.brands.find(b => b.id === brand)?.nombre || brand}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-1">
                {/* Botón de limpiar filtros */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
                  >
                    <IconX className="h-3 w-3 mr-1" />
                    Limpiar
                  </Button>
                )}

                {/* Botones de vista */}
                <div className="flex items-center border rounded">
                  <Button variant="default" size="sm" className="rounded-r-none h-7 px-2">
                    <IconId className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-l-none h-7 px-2">
                    <IconList className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};