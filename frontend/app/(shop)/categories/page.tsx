'use client';

import { useCategories } from '@/hooks/use-categories';
import { CategoryCard } from '@/components/cards/CategoryCard';
import { Package } from 'lucide-react';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();

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
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Todas las Categorías
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explora todas nuestras categorías de productos y encuentra lo que buscas
        </p>
      </div>

      {/* Grid de Categorías */}
      {categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.name}
              description={category.description}
              count={0} // Por ahora no tenemos contador
              countLabel="productos"
              variant="default"
              categoryId={category.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay categorías disponibles
          </h3>
          <p className="text-gray-600">
            No se encontraron categorías en este momento
          </p>
        </div>
      )}
    </div>
  );
}