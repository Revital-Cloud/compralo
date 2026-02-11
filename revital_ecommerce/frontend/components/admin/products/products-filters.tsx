'use client';

import React, { useMemo, useRef } from 'react';
import { UniversalFilters } from "@/components/ui";
import { useFilterOptions } from '@/hooks';
import { FilterConfig, StockStats } from '@/types/filters';
import type { FilterOptions } from '@/types/product';

interface ProductsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
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
  /** Opciones de filtro para admin (incluye inactivos). Si se pasa, se usa en lugar del hook de tienda. */
  filterOptionsOverride?: FilterOptions | null;
  optionsLoading?: boolean;
}

export const ProductsFilters: React.FC<ProductsFiltersProps> = ({
  search,
  onSearchChange,
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
  products,
  filterOptionsOverride,
  optionsLoading: optionsLoadingOverride,
}) => {
  const { data: filterOptionsFromHook, isLoading: hookLoading } = useFilterOptions();
  const filterOptions = filterOptionsOverride ?? filterOptionsFromHook;
  const isLoading = optionsLoadingOverride ?? hookLoading;

  const rawCategories = filterOptions?.categorias ?? [];
  const rawLines = filterOptions?.lineas ?? [];
  const rawSublines = filterOptions?.sublineas ?? [];
  const rawBrands = filterOptions?.marcas ?? [];
  const rawProviders = filterOptions?.proveedores ?? [];

  // Opciones normalizadas para el componente de filtros universales
  const categoryOptions = rawCategories.map((c: any) => ({
    id: c.id_categoria,
    nombre: c.nom_categoria,
  }));

  // Filtrar líneas según la categoría seleccionada (si hay una)
  const filteredLines = useMemo(() => {
    if (!category) return rawLines;
    const categoryId = Number(category);
    return rawLines.filter((l: any) => Number(l.id_categoria) === categoryId);
  }, [category, rawLines]);

  // Valor compuesto categoria-linea para identificar de forma única (misma id_linea puede existir en varias categorías)
  const lineOptions = filteredLines.map((l: any) => ({
    id: `${l.id_categoria}-${l.id_linea}`,
    nombre: l.nom_linea,
  }));

  // Valor actual del select de línea: compuesto si tenemos categoría y línea para que coincida la opción correcta
  const lineSelectValue = category && line ? `${category}-${line}` : line || '';

  // Filtrar sublíneas por categoría y línea (ambos ids son compuestos: misma id_linea existe en varias categorías)
  const filteredSublines = useMemo(() => {
    if (!line) {
      if (category) {
        const categoryId = Number(category);
        return rawSublines.filter((s: any) => Number(s.id_categoria) === categoryId);
      }
      return rawSublines;
    }
    const lineId = Number(line);
    const categoryId = category ? Number(category) : null;
    return rawSublines.filter((s: any) => {
      if (Number(s.id_linea) !== lineId) return false;
      if (categoryId != null && Number(s.id_categoria) !== categoryId) return false;
      return true;
    });
  }, [line, category, rawSublines]);

  // Valor compuesto categoria-linea-sublinea para identificar de forma única
  const sublineOptions = filteredSublines.map((s: any) => ({
    id: `${s.id_categoria}-${s.id_linea}-${s.id_sublinea}`,
    nombre: s.nom_sublinea,
  }));

  const sublineSelectValue = category && line && subline
    ? `${category}-${line}-${subline}`
    : (subline || '');

  const brandOptions = rawBrands.map((b: any) => ({
    id: b.id_marca,
    nombre: b.nom_marca,
  }));

  const providerOptions = rawProviders.map((p: any) => ({
    id: p.id_proveedor,
    nombre: p.nom_proveedor,
  }));

  // Ref para evitar actualizaciones en bucle
  const isUpdatingRef = useRef(false);

  // Handlers internos para mantener coherencia entre categoría, línea y sublínea
  const handleCategoryChange = (value: string) => {
    if (isUpdatingRef.current) return;
    
    onCategoryChange(value);

    const categoryId = value ? Number(value) : undefined;

    if (!categoryId) {
      // Si se limpia la categoría, limpiamos también línea y sublínea
      if (line) onLineChange('');
      if (subline) onSublineChange('');
      return;
    }

    // Si la línea actual no pertenece a la nueva categoría, limpiarla
    if (line) {
      const currentLine = rawLines.find((l: any) => Number(l.id_linea) === Number(line));
      if (!currentLine || Number(currentLine.id_categoria) !== categoryId) {
        onLineChange('');
      }
    }

    // Si la sublínea actual no pertenece a la nueva categoría (y línea si hay), limpiarla
    if (subline) {
      const sublineId = Number(subline);
      const lineId = line ? Number(line) : null;
      const exists = rawSublines.some(
        (s: any) =>
          Number(s.id_sublinea) === sublineId &&
          Number(s.id_categoria) === categoryId &&
          (lineId == null || Number(s.id_linea) === lineId)
      );
      if (!exists) {
        onSublineChange('');
      }
    }
  };

  const handleLineChange = (value: string) => {
    if (isUpdatingRef.current) return;
    
    if (!value) {
      onLineChange('');
      if (subline) onSublineChange('');
      return;
    }

    // Valor compuesto "id_categoria-id_linea": enviar solo esto a la página para que actualice URL en una sola vez.
    // Si llamáramos onCategoryChange + onLineChange por separado, la página recibiría solo id_linea en handleLineChange
    // y haría find por id_linea, cogiendo la primera línea (categoría equivocada).
    const isComposite = value.includes('-');
    if (isComposite) {
      const [, lineIdStr] = value.split('-');
      const lineId = Number(lineIdStr);
      const catId = Number(value.split('-')[0]);
      if (subline) {
        const currentSubline = rawSublines.find((s: any) => 
          Number(s.id_sublinea) === Number(subline) &&
          Number(s.id_linea) === lineId &&
          Number(s.id_categoria) === catId
        );
        if (!currentSubline) {
          onSublineChange('');
        }
      }
      onLineChange(value);
      return;
    }

    // Compatibilidad: valor solo id_linea (buscar primera línea que coincida)
    const lineId = Number(value);
    const selectedLine = rawLines.find((l: any) => Number(l.id_linea) === lineId);
    if (!selectedLine) {
      onLineChange(value);
      return;
    }
    const categoryIdStr = String(selectedLine.id_categoria);
    const lineIdStr = String(selectedLine.id_linea);
    isUpdatingRef.current = true;
    if (category !== categoryIdStr) {
      onCategoryChange(categoryIdStr);
    }
    onLineChange(lineIdStr);
    if (subline) {
      const currentSubline = rawSublines.find((s: any) => 
        Number(s.id_sublinea) === Number(subline) &&
        Number(s.id_linea) === lineId &&
        Number(s.id_categoria) === Number(selectedLine.id_categoria)
      );
      if (!currentSubline) {
        onSublineChange('');
      }
    }
    setTimeout(() => { isUpdatingRef.current = false; }, 0);
  };

  const handleSublineChange = (value: string) => {
    if (isUpdatingRef.current) return;

    if (!value) {
      onSublineChange('');
      return;
    }

    // Valor compuesto "id_categoria-id_linea-id_sublinea": enviar solo esto a la página para una sola actualización de URL.
    // Si llamáramos onCategoryChange + onLineChange + onSublineChange por separado, la página recibiría solo id_sublinea
    // y haría find por id_sublinea, cogiendo la primera (categoría/línea equivocadas).
    const parts = value.split('-');
    if (parts.length >= 3) {
      onSublineChange(value);
      return;
    }

    // Compatibilidad: valor solo id_sublinea
    const sublineId = Number(value);
    const selectedSubline = rawSublines.find((s: any) => Number(s.id_sublinea) === sublineId);
    if (!selectedSubline) {
      onSublineChange(value);
      return;
    }
    const parentLine = rawLines.find((l: any) =>
      Number(l.id_linea) === Number(selectedSubline.id_linea) &&
      Number(l.id_categoria) === Number(selectedSubline.id_categoria)
    );
    if (!parentLine) {
      onSublineChange(value);
      return;
    }
    isUpdatingRef.current = true;
    if (category !== String(parentLine.id_categoria)) {
      onCategoryChange(String(parentLine.id_categoria));
    }
    if (line !== String(parentLine.id_linea)) {
      onLineChange(String(parentLine.id_linea));
    }
    onSublineChange(String(selectedSubline.id_sublinea));
    setTimeout(() => { isUpdatingRef.current = false; }, 0);
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = Boolean(search || category || brand || line || subline || provider);

  // Calcular estadísticas de stock
  const stockStats: StockStats = useMemo(() => {
    return products.reduce((acc, product) => {
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
  }, [products]);

  // Configurar filtros dinámicos
  const filters: FilterConfig[] = [
    {
      id: 'category',
      label: 'Categoría',
      type: 'select',
      value: category,
      onChange: handleCategoryChange,
      options: categoryOptions,
      isLoading
    },
    {
      id: 'line',
      label: 'Línea',
      type: 'select',
      value: lineSelectValue,
      onChange: handleLineChange,
      options: lineOptions,
      isLoading
    },
    {
      id: 'subline',
      label: 'Sublínea',
      type: 'select',
      value: sublineSelectValue,
      onChange: handleSublineChange,
      options: sublineOptions,
      isLoading
    },
    {
      id: 'brand',
      label: 'Marca',
      type: 'select',
      value: brand,
      onChange: onBrandChange,
      options: brandOptions,
      isLoading
    },
    {
      id: 'provider',
      label: 'Proveedor',
      type: 'select',
      value: provider,
      onChange: onProviderChange,
      options: providerOptions,
      isLoading
    }
  ];

  return (
    <UniversalFilters
      title="Filtros"
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Nombre del producto..."
      filters={filters}
      stockStats={stockStats}
      totalResults={totalResults}
      onClearFilters={onClearFilters}
      hasActiveFilters={hasActiveFilters}
      showStockBadges={true}
      showTotalResults={true}
      compact={true}
    />
  );
};