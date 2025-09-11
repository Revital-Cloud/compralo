'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from "sonner";
import { 
  ProductsHeader, 
  ProductsGrid, 
  Pagination 
} from "@/components/admin/products";
import { ProductsFilters } from "@/components/admin/products/products-filters";
import { useProducts, useDeleteProduct, useProductsAdmin } from "@/hooks/use-products";
import type { PaginatedResponse } from '@/types/common';
import type { Product, ProductAdmin } from '@/types/product';

const ProductsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'nombre' | 'precio' | 'stock' | 'fecha' | 'categoria' | 'marca'>('nombre');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const itemsPerPage = 12;
  
  // Obtener parámetros de búsqueda de la URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const line = searchParams.get('line') || '';
  const subline = searchParams.get('subline') || '';
  const provider = searchParams.get('provider') || '';
  
  // Filtros para la API
  const filters = {
    page: currentPage,
    limit: itemsPerPage,
    search: search || undefined,
    id_categoria: category ? parseInt(category) : undefined,
    id_marca: brand ? parseInt(brand) : undefined,
  };

  // Hook para obtener productos (usando endpoint admin)
  const { 
    data: productsResponse, 
    isLoading, 
    error 
  } = useProductsAdmin({
    ordenar_por: sortBy,
    orden: sortOrder,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  });

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

  // Manejar cambios de filtros
  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.push(`?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    router.push(`?${params.toString()}`);
  };

  const handleBrandChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('brand', value);
    } else {
      params.delete('brand');
    }
    router.push(`?${params.toString()}`);
  };

  const handleLineChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('line', value);
    } else {
      params.delete('line');
    }
    router.push(`?${params.toString()}`);
  };

  const handleSublineChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('subline', value);
    } else {
      params.delete('subline');
    }
    router.push(`?${params.toString()}`);
  };

  const handleProviderChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('provider', value);
    } else {
      params.delete('provider');
    }
    router.push(`?${params.toString()}`);
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value as 'nombre' | 'precio' | 'stock' | 'fecha' | 'categoria' | 'marca');
  };

  const handleSortOrderChange = (value: 'ASC' | 'DESC') => {
    setSortOrder(value);
  };

  const handleClearFilters = () => {
    setSortBy('nombre');
    setSortOrder('ASC');
    router.push('/admin/products');
  };

  // Extraer datos de la respuesta
  // El endpoint admin devuelve un array directo con total_registros
  const adminProducts = Array.isArray(productsResponse) ? productsResponse : [];
  const totalItems = adminProducts.length > 0 ? adminProducts[0].total_registros : 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Adaptar ProductAdmin a Product para el componente ProductsGrid
  const products: Product[] = adminProducts.map(adminProduct => ({
    id_producto: adminProduct.id_producto,
    nom_producto: adminProduct.nom_producto,
    spcf_producto: adminProduct.spcf_producto,
    img_producto: adminProduct.img_producto,
    val_precio: adminProduct.val_precio,
    id_proveedor: adminProduct.id_proveedor,
    id_marca: adminProduct.id_marca,
    id_sublinea: adminProduct.id_sublinea,
    id_linea: adminProduct.id_linea,
    id_categoria: adminProduct.id_categoria,
    num_stock: adminProduct.num_stock,
    usr_insert: "0", // No disponible en ProductAdmin
    fec_insert: adminProduct.fec_insert,
    usr_update: null,
    fec_update: null,
    ind_activo: adminProduct.ind_activo_producto,
    images: null,
    // Agregar nombres del endpoint admin
    nom_categoria: adminProduct.nom_categoria,
    nom_linea: adminProduct.nom_linea,
    nom_sublinea: adminProduct.nom_sublinea,
    nom_proveedor: adminProduct.nom_proveedor,
    nom_marca: adminProduct.nom_marca
  }));

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

      {/* Filtros de productos */}
      <ProductsFilters
        search={search}
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        sortOrder={sortOrder}
        onSortOrderChange={handleSortOrderChange}
        category={category}
        onCategoryChange={handleCategoryChange}
        brand={brand}
        onBrandChange={handleBrandChange}
        line={line}
        onLineChange={handleLineChange}
        subline={subline}
        onSublineChange={handleSublineChange}
        provider={provider}
        onProviderChange={handleProviderChange}
        onClearFilters={handleClearFilters}
        totalResults={totalItems}
        products={products}
      />

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