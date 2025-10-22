'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from "sonner";
import { ProductsHeader } from "@/components/admin/products";
import { ProductsFilters } from "@/components/admin/products/products-filters";
import { useProductsAdmin, useDeactivateProduct, useActivateProduct } from "@/hooks/use-products";
import type { Product } from '@/types/product';
import DataTable from '@/components/tables/table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Power, Eye } from 'lucide-react';
import { formatPrice } from '@/utils/format-price';
import Image from 'next/image';

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

  // Mutations activar/desactivar
  const deactivateProduct = useDeactivateProduct();
  const activateProduct = useActivateProduct();

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Actualizar URL con la nueva página
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/admin/products?${params.toString()}`);
  };

  // Manejar activar/desactivar producto
  const handleToggleActive = async (row: Product) => {
    if (row.ind_activo) {
      if (confirm('¿Desactivar este producto?')) {
        await deactivateProduct.mutateAsync({
          id_categoria: Number(row.id_categoria),
          id_linea: Number(row.id_linea),
          id_sublinea: Number(row.id_sublinea),
          id_producto: Number(row.id_producto),
        });
      }
    } else {
      await activateProduct.mutateAsync(row);
    }
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

  // Adaptar ProductAdmin a Product para el componente DataTable
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
    usr_insert: "0",
    fec_insert: adminProduct.fec_insert,
    usr_update: null,
    fec_update: null,
    ind_activo: adminProduct.ind_activo_producto,
    images: null,
    nom_categoria: adminProduct.nom_categoria,
    nom_linea: adminProduct.nom_linea,
    nom_sublinea: adminProduct.nom_sublinea,
    nom_proveedor: adminProduct.nom_proveedor,
    nom_marca: adminProduct.nom_marca
  }));

  // Definir columnas de la tabla
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'img_producto',
      header: 'Imagen',
      cell: ({ row }) => {
        const imgUrl = typeof row.original.img_producto === 'string' 
          ? row.original.img_producto 
          : row.original.img_producto?.main || '';
        
        return (
          <div className="w-12 h-12 relative rounded-md overflow-hidden bg-gray-100">
            {imgUrl ? (
              <Image
                src={imgUrl}
                alt={row.original.nom_producto}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Eye className="w-6 h-6" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'nom_producto',
      header: 'Producto',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{row.original.nom_producto}</div>
          <div className="text-xs text-muted-foreground">ID: {row.original.id_producto}</div>
        </div>
      ),
    },
    {
      accessorKey: 'nom_categoria',
      header: 'Categoría',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.nom_categoria || '-'}</span>
      ),
    },
    {
      accessorKey: 'nom_linea',
      header: 'Linea',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.nom_linea || '-'}</span>
      ),
    },
    {
      accessorKey: 'nom_sublinea',
      header: 'SubLinea',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.nom_sublinea || '-'}</span>
      ),
    },
    {
      accessorKey: 'nom_marca',
      header: 'Marca',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.nom_marca || '-'}</span>
      ),
    },
    {
      accessorKey: 'val_precio',
      header: 'Precio',
      cell: ({ row }) => (
        <span className="font-semibold">{formatPrice(row.original.val_precio)}</span>
      ),
    },
    {
      accessorKey: 'num_stock',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = row.original.num_stock || 0;
        return (
          <Badge 
            variant={stock === 0 ? 'destructive' : stock <= 10 ? 'default' : 'secondary'}
            className={
              stock === 0 
                ? 'bg-red-100 text-red-800 hover:bg-red-100' 
                : stock <= 10 
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' 
                : 'bg-green-100 text-green-800 hover:bg-green-100'
            }
          >
            {stock}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'ind_activo',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = !!row.original.ind_activo;
        return (
          <Badge
            className={
              isActive
                ? 'bg-[#fec806] text-black hover:bg-[#fec806]'
                : 'bg-red-100 text-red-800 hover:bg-red-100'
            }
            variant={isActive ? 'secondary' : 'destructive'}
          >
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
  ];

  const actions: ColumnDef<Product>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Ver producto"
            onClick={() => router.push(`/products/${row.original.id_producto}`)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar producto"
            onClick={() => router.push(`/admin/products/${row.original.id_categoria}-${row.original.id_linea}-${row.original.id_sublinea}-${row.original.id_producto}/edit`)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={row.original.ind_activo ? 'destructive' : 'secondary'}
            size="icon"
            aria-label={row.original.ind_activo ? 'Desactivar producto' : 'Activar producto'}
            onClick={() => handleToggleActive(row.original)}
          >
            <Power className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Manejar errores
  if (error) {
    return (
      <div className="space-y-6">
        <ProductsHeader />
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
      <ProductsHeader />

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

      {/* Products Table */}
      {isLoading ? (
        <div className="space-y-4">
          {/* Skeleton de filtros y header de tabla */}
          <div className="h-10 bg-gray-200/50 dark:bg-gray-800/60 rounded-md animate-pulse" />
          {/* Skeleton de filas de tabla */}
          <div className="space-y-3">
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200/40 dark:bg-gray-800/40 rounded-md animate-pulse" />
            ))}
          </div>
        </div>
      ) : products.length > 0 ? (
        <DataTable 
          columns={[...columns, ...actions]} 
          data={products}
          pageSize={itemsPerPage}
        />
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No se encontraron productos</div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;