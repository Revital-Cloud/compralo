'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from "sonner";
import { 
  ProductsHeader, 
  ProductsGrid, 
  Pagination 
} from "@/components/admin/products";
import { useProducts, useDeleteProduct } from "@/hooks/use-products";
import type { PaginatedResponse } from '@/types/common';
import type { Product } from '@/types/product';

const ProductsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Obtener parámetros de búsqueda de la URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  
  // Filtros para la API
  const filters = {
    page: currentPage,
    limit: itemsPerPage,
    search: search || undefined,
    id_categoria: category ? parseInt(category) : undefined,
    id_marca: brand ? parseInt(brand) : undefined,
  };

  // Hook para obtener productos
  const { 
    data: productsResponse, 
    isLoading, 
    error 
  } = useProducts(filters);

  // Hook para eliminar productos
  const deleteProductMutation = useDeleteProduct();

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Actualizar URL con la nueva página
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/admin/products?${params.toString()}`);
  };

  // Manejar eliminación de producto
  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProductMutation.mutateAsync(id);
    } catch (error) {
      // El error ya se maneja en el hook
      console.error('Error al eliminar producto:', error);
    }
  };

  // Manejar importación completada
  const handleImportComplete = (result: any) => {
    toast.success(`¡Importación completada! ${result.successfulRows} productos agregados`);
    // Refrescar la lista de productos
    window.location.reload();
  };

  // Manejar exportación
  const handleExport = () => {
    // Implementar lógica de exportación
    toast.info('Funcionalidad de exportación en desarrollo');
  };

  // Extraer datos de la respuesta
  const products = (productsResponse as PaginatedResponse<Product>)?.items || [];
  const totalItems = (productsResponse as PaginatedResponse<Product>)?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Manejar errores
  if (error) {
    return (
      <div className="space-y-6">
        <ProductsHeader 
          onImportComplete={handleImportComplete}
          onExport={handleExport}
        />
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Error al cargar productos</h3>
          <p className="text-red-600 mb-4">
            {error?.message || 'Ha ocurrido un error inesperado'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProductsHeader 
        onImportComplete={handleImportComplete}
        onExport={handleExport}
      />

      {/* Filtros de búsqueda (opcional) */}
      {totalItems > 0 && (
        <div className="bg-muted/30 p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            Mostrando {products.length} de {totalItems} productos
            {search && ` para "${search}"`}
            {category && ` en categoría "${category}"`}
            {brand && ` de marca "${brand}"`}
          </p>
        </div>
      )}

      {/* Products Grid */}
      <ProductsGrid 
        products={products}
        onDelete={handleDeleteProduct}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};

export default ProductsPage;