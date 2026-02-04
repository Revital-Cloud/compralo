'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFilterProducts } from '@/hooks/use-products';
import { useCategory } from '@/hooks/use-categories';
import { useLine } from '@/hooks/use-lines';
import { useSublinesByLine } from '@/hooks/use-sublines';
import { ChevronRight, ArrowLeft, Package } from 'lucide-react';
import { Badge } from '@/components/ui';
import { ProductCard } from '@/components/cards/ProductCard';

function isValidId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export default function SublinesProductsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = Number(params.id_category);
  const lineId = Number(params.id_line);
  const sublineId = Number(params.id_subline);
  const hasValidParams = isValidId(categoryId) && isValidId(lineId) && isValidId(sublineId);

  const filters = useMemo(
    () => ({
      id_categoria: categoryId,
      id_linea: lineId,
      id_sublinea: sublineId,
      limit: 200,
    }),
    [categoryId, lineId, sublineId]
  );
  const { data: filterResponse, isLoading } = useFilterProducts(filters);
  const products = filterResponse?.products ?? [];

  const { data: category } = useCategory(hasValidParams ? categoryId : 0);
  const { data: line } = useLine(lineId, hasValidParams ? categoryId : undefined);
  const { data: sublines, isLoading: sublinesLoading } = useSublinesByLine(lineId, hasValidParams ? categoryId : undefined);
  const subline = useMemo(
    () => sublines?.find((s) => Number(s.id_sublinea) === sublineId),
    [sublines, sublineId]
  );

  const metaReady = !!category && !!line && sublines !== undefined;
  const showContent = metaReady && !isLoading;

  if (!hasValidParams) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground text-center">Categoría, línea o sublínea no válida.</p>
      </div>
    );
  }

  if (!showContent || sublinesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  const sublineName = subline?.nom_sublinea ?? `Sublínea ${sublineId}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl w-full">
      {/* Breadcrumb Navigation */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/categories/${categoryId}/lines/${lineId}/sublines`)}
          className="flex items-center gap-2 text-primary hover:text-primary/90 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Sublíneas
        </button>

        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
          <span
            onClick={() => router.push(`/categories/${categoryId}`)}
            className="cursor-pointer hover:text-primary"
          >
            {category?.nom_categoria}
          </span>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span
            onClick={() => router.push(`/categories/${categoryId}/lines/${lineId}/sublines`)}
            className="cursor-pointer hover:text-primary"
          >
            {line?.nom_linea}
          </span>
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="text-foreground font-medium">
            {sublineName}
          </span>
        </nav>

        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">
            Productos de {sublineName}
          </h1>
          <Badge variant="secondary" className="text-sm">
            {products.length} productos encontrados
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Explora todos los productos disponibles en esta sublínea
        </p>
      </div>

      {/* Grid de Productos */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full min-w-0">
          {products.map((product) => (
            <ProductCard
              key={`${product.id_categoria}-${product.id_linea}-${product.id_sublinea}-${product.id_producto}`}
              product={{
                id_producto: product.id_producto,
                nom_producto: product.nom_producto,
                val_precio: product.val_precio,
                stock_cantidad: product.num_stock,
                img_producto: product.img_producto as { main: string; gallery: string[]; thumbnails: string[] } | undefined,
              }}
              onClick={() =>
                router.push(
                  `/products/${product.id_categoria}-${product.id_linea}-${product.id_sublinea}-${product.id_producto}`
                )
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No hay productos disponibles
          </h3>
          <p className="text-muted-foreground">
            Esta sublínea no tiene productos en este momento
          </p>
        </div>
      )}
    </div>
  );
}
