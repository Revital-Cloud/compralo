"use client";

import { createElement, useMemo, useState, useEffect } from 'react';
import { useRootCategories, useCategoriesRaw } from '@/hooks/use-categories';
import { CategoryCard } from '@/components/cards/CategoryCard';
import { getIconForCategory } from '@/utils/category-mapper';
import { Package } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Category } from '@/types/category';

const CARDS_PER_PAGE = 16; // 4x4 grid

/** Conteo recursivo: productos en esta categoría + todos los descendientes */
function useRecursiveProductCounts(categories: Category[]): Map<number, number> {
  return useMemo(() => {
    const map = new Map<number, number>();
    const list = categories ?? [];
    const direct = new Map<number, number>();
    list.forEach((c) => direct.set(Number(c.id), c.productos_count ?? 0));

    function getTotal(id: number): number {
      if (map.has(id)) return map.get(id)!;
      const directCount = direct.get(id) ?? 0;
      const children = list.filter((c) => Number(c.parent_id) === id);
      const childrenTotal = children.reduce((sum, ch) => sum + getTotal(Number(ch.id)), 0);
      const total = directCount + childrenTotal;
      map.set(id, total);
      return total;
    }
    list.forEach((c) => getTotal(Number(c.id)));
    return map;
  }, [categories]);
}

export default function CategoriesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: categories, isLoading } = useRootCategories();
  const { data: allCategoriesRaw } = useCategoriesRaw();
  const recursiveCounts = useRecursiveProductCounts(allCategoriesRaw ?? []);

  // Al entrar a esta página, llevar con animación al tope para que el título se vea completo
  useEffect(() => {
    const scrollToTop = () =>
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    scrollToTop();
    requestAnimationFrame(scrollToTop); // Por si el navegador restaura scroll después del primer paint
  }, []);

  const totalItems = categories?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / CARDS_PER_PAGE));
  const paginatedCategories = useMemo(
    () => (categories ?? []).slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE),
    [categories, currentPage]
  );

  const bentoLargeByIndex = useMemo(() => {
    // Solo hacemos "grandes" a partir de `xl` (grid de 4 columnas).
    // El objetivo es seleccionar categorías relevantes y, al mismo tiempo,
    // evitar columnas huérfanas usando una simulación simple del cursor.
    const GRID_COLS_XL = 4;
    // Menos tarjetas "grandes" para que no se perciban pegadas.
    const desiredCount = Math.min(3, Math.max(1, Math.floor((paginatedCategories.length ?? 0) / 6)));

    const scored = (paginatedCategories ?? []).map((c, index) => {
      const score = recursiveCounts.get(Number(c.id)) ?? c.productCount ?? 0;
      return { index, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const desired = new Set(scored.slice(0, desiredCount).map((x) => x.index));

    let colCursor = 0; // 0..3
    return (paginatedCategories ?? []).map((_, index) => {
      const canPlaceLarge = colCursor === 0 || colCursor === 2;
      const shouldLarge = canPlaceLarge && desired.has(index);

      colCursor += shouldLarge ? 2 : 1;
      if (colCursor >= GRID_COLS_XL) colCursor = 0;
      return shouldLarge;
    });
  }, [paginatedCategories, recursiveCounts]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header (más jerarquía visual, menos plano) */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-muted/25 to-background px-6 py-8 md:px-10 md:py-10 mb-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(254,200,6,0.22),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.14),transparent_45%)] opacity-80"
        />
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                Todas las Categorías
              </h1>
              <p className="text-base text-muted-foreground mt-3">
                Explora todas nuestras categorías de productos y encuentra lo que buscas. Desde aquí puedes entrar a cada categoría y ver sus líneas y sublíneas.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-6">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/10">
                  {totalItems} categorías
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Categorías (raíz) 4x4 = 16 por página */}
      {categories && categories.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 grid-flow-dense">
            {paginatedCategories.map((category, index) => {
              const IconComponent = getIconForCategory(category.name);
              const totalProducts = recursiveCounts.get(Number(category.id)) ?? category.productCount ?? 0;
              const isLarge = bentoLargeByIndex[index] ?? false;
              const bentoClass = isLarge ? "xl:col-span-2" : "";
              return (
                <div key={category.id} className={bentoClass}>
                  <CategoryCard
                    title={category.name}
                    description={category.description}
                    icon={createElement(IconComponent, { className: 'w-6 h-6' })}
                    count={totalProducts}
                    countLabel="productos"
                    variant="default"
                    categoryId={category.id}
                  />
                </div>
              );
            })}
          </div>
          {/* Paginación: 16 tarjetas por página (4x4) */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Mostrando{' '}
                <span className="font-medium">{(currentPage - 1) * CARDS_PER_PAGE + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(currentPage * CARDS_PER_PAGE, totalItems)}
                </span>{' '}
                de <span className="font-medium">{totalItems}</span> categorías
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No hay categorías disponibles
          </h3>
          <p className="text-muted-foreground">
            No se encontraron categorías en este momento
          </p>
        </div>
      )}
    </div>
  );
}