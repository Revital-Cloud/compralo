'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProductsBySubline } from '@/hooks/use-products';
import { useCategory } from '@/hooks/use-categories';
import { useLine } from '@/hooks/use-lines';
import { useSubline } from '@/hooks/use-sublines';
import { Badge } from '@repo/ui';
import { ChevronRight, ArrowLeft, Package } from 'lucide-react';
import { ProductCard } from '@/components/cards/ProductCard';

export default function SublinesProductsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = Number(params.id_category);
  const lineId = Number(params.id_line);
  const sublineId = Number(params.id_subline);
  
  const { data: products, isLoading } = useProductsBySubline(sublineId);
  const { data: category } = useCategory(categoryId);
  const { data: line } = useLine(lineId);
  const { data: subline } = useSubline(sublineId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/categories/${categoryId}/lines/${lineId}/sublines`)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Sublíneas
        </button>
        
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span 
            onClick={() => router.push(`/categories/${categoryId}`)} 
            className="cursor-pointer hover:text-blue-600"
          >
            {category?.nom_categoria}
          </span>
          <ChevronRight className="w-4 h-4" />
          <span 
            onClick={() => router.push(`/categories/${categoryId}/lines`)} 
            className="cursor-pointer hover:text-blue-600"
          >
            {line?.nom_linea}
          </span>
          <ChevronRight className="w-4 h-4" />
          <span 
            onClick={() => router.push(`/categories/${categoryId}/lines/${lineId}/sublines`)} 
            className="cursor-pointer hover:text-blue-600"
          >
            {subline?.nom_sublinea}
          </span>
        </nav>
        
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Productos de {subline?.nom_sublinea}
          </h1>
          <Badge variant="secondary" className="text-sm">
            {products?.length || 0} productos encontrados
          </Badge>
        </div>
        <p className="text-gray-600 mt-2">
          Explora todos los productos disponibles en esta sublínea
        </p>
      </div>

      {/* Grid de Productos */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={`${product.id_categoria}-${product.id_linea}-${product.id_sublinea}-${product.id_producto}`}
              product={product}
              onClick={() => router.push(`/products/${product.id_producto}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay productos disponibles
          </h3>
          <p className="text-gray-600">
            Esta sublínea no tiene productos en este momento
          </p>
        </div>
      )}
    </div>
  );
}
