'use client';

import { useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from "sonner";
import { ProductsHeader } from "@/components/admin/products";
import { ProductsFilters } from "@/components/admin/products/products-filters";
import { useProductsAdmin, useDeactivateActivateProduct, useFilterOptionsAdmin } from "@/hooks/use-products";
import type { Product } from '@/types/product';
import DataTable from '@/components/tables/table';
import { ColumnDef } from '@tanstack/react-table';
import {
  Button,
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui";
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
  const itemsPerPage = 10;
  
  // Obtener parámetros de búsqueda de la URL
  const search = searchParams.get('search') || '';
  
  // Estado local para el input de búsqueda (se actualiza inmediatamente)
  const [searchInput, setSearchInput] = useState(search);
  
  // Ref para almacenar el timeout del debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Producto seleccionado para ver en el drawer
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Producto pendiente de confirmar desactivación (para AlertDialog)
  const [productToDeactivate, setProductToDeactivate] = useState<Product | null>(null);
  
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const line = searchParams.get('line') || '';
  const subline = searchParams.get('subline') || '';
  const provider = searchParams.get('provider') || '';

  // Opciones de filtro para admin (incluye activos e inactivos; así aparecen todas las sublíneas)
  const { data: filterOptions, isLoading: optionsLoading } = useFilterOptionsAdmin();
  
  // Filtros para la API
  const filters = {
    ordenar_por: sortBy,
    orden: sortOrder,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    search: search || undefined,
    id_categoria: category ? Number(category) : undefined,
    id_linea: line ? Number(line) : undefined,
    id_sublinea: subline ? Number(subline) : undefined,
    id_marca: brand ? Number(brand) : undefined,
    id_proveedor: provider ? Number(provider) : undefined,
  };

  // Hook para obtener productos (usando endpoint admin)
  const { 
    data: productsResponse, 
    isLoading, 
    error 
  } = useProductsAdmin({
    ...filters,
  });

  // Mutation activar/desactivar producto
  const deactivateActivateProductMutation = useDeactivateActivateProduct();

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Actualizar URL con la nueva página
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/admin/products?${params.toString()}`);
  };

  // Manejar activar/desactivar producto
  const handleToggleActive = (row: Product) => {
    const isActive = Boolean(row.ind_activo);
    if (isActive) {
      setProductToDeactivate(row);
      return;
    }
    const params = {
      id_categoria: Number(row.id_categoria),
      id_linea: Number(row.id_linea),
      id_sublinea: Number(row.id_sublinea),
      id_producto: Number(row.id_producto),
    };
    deactivateActivateProductMutation.mutate({ params, activar: true });
  };

  const handleConfirmDeactivate = () => {
    if (!productToDeactivate) return;
    const params = {
      id_categoria: Number(productToDeactivate.id_categoria),
      id_linea: Number(productToDeactivate.id_linea),
      id_sublinea: Number(productToDeactivate.id_sublinea),
      id_producto: Number(productToDeactivate.id_producto),
    };
    deactivateActivateProductMutation.mutate({ params, activar: false });
    setProductToDeactivate(null);
  };

  // Manejar cambios en el input con debounce directo (sin useEffect)
  const handleSearchChange = (value: string) => {
    // Actualizar estado local inmediatamente (para que el input responda al instante)
    setSearchInput(value);
    
    // Limpiar timeout anterior si existe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Crear nuevo timeout para actualizar URL después de 500ms sin escribir
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      const trimmedSearch = value.trim();
      
      // Solo buscar si tiene 3+ caracteres o si está vacío (para limpiar)
      if (trimmedSearch.length === 0) {
        params.delete('search');
      } else if (trimmedSearch.length >= 3) {
        params.set('search', trimmedSearch);
      } else {
        // Si tiene menos de 3 caracteres, limpiar la búsqueda de la URL
        params.delete('search');
      }
      
      router.push(`?${params.toString()}`);
    }, 500); // 500ms de debounce
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
      // Valor compuesto "id_categoria-id_linea" desde el select de línea (evita línea equivocada entre categorías)
      if (value.includes('-')) {
        const [categoryVal, lineVal] = value.split('-');
        params.set('category', categoryVal);
        params.set('line', lineVal);
      } else {
        const selectedLine = filterOptions?.lineas?.find((l: any) => 
          String(l.id_linea) === value
        );
        if (selectedLine) {
          params.set('line', value);
          params.set('category', String(selectedLine.id_categoria));
        } else {
          params.set('line', value);
        }
      }
    } else {
      params.delete('line');
    }
    
    router.push(`?${params.toString()}`);
  };

  const handleSublineChange = (value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      // Valor compuesto "id_categoria-id_linea-id_sublinea" desde el select de sublínea
      const parts = value.split('-');
      if (parts.length >= 3) {
        params.set('category', parts[0]);
        params.set('line', parts[1]);
        params.set('subline', parts[2]);
      } else {
        const selectedSubline = filterOptions?.sublineas?.find((s: any) =>
          String(s.id_sublinea) === value
        );
        if (selectedSubline) {
          params.set('subline', value);
          params.set('line', String(selectedSubline.id_linea));
          params.set('category', String(selectedSubline.id_categoria));
        } else {
          params.set('subline', value);
        }
      }
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
    // Limpiar timeout pendiente si existe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    setSortBy('nombre');
    setSortOrder('ASC');
    setSearchInput(''); // Limpiar también el input local
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
          <span className={isActive ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
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
            onClick={() => setSelectedProduct(row.original)}
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
            variant={row.original.ind_activo ? "default" : "destructive"}
            size="icon"
            aria-label={row.original.ind_activo ? "Desactivar producto" : "Activar producto"}
            onClick={() => handleToggleActive(row.original)}
            disabled={deactivateActivateProductMutation.isPending}
            className={row.original.ind_activo ? "bg-green-600 hover:bg-green-700 text-white" : ""}
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
        search={searchInput}
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
        filterOptionsOverride={filterOptions}
        optionsLoading={optionsLoading}
      />

      {/* Drawer de detalle del producto */}
      <Sheet open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto px-6 sm:px-8">
          <SheetHeader className="px-0 pb-6">
            <SheetTitle className="pr-8">Detalle del producto</SheetTitle>
          </SheetHeader>
          {selectedProduct && (
            <div className="space-y-8 py-2 px-1">
              {/* Imagen */}
              <div className="aspect-square max-h-48 w-full relative rounded-lg overflow-hidden bg-muted">
                {selectedProduct.img_producto ? (
                  <Image
                    src={typeof selectedProduct.img_producto === 'string' ? selectedProduct.img_producto : (selectedProduct.img_producto as any)?.main || ''}
                    alt={selectedProduct.nom_producto}
                    fill
                    sizes="(max-width: 384px) 100vw, 24rem"
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Eye className="w-16 h-16" />
                  </div>
                )}
              </div>

              {/* Nombre e ID */}
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{selectedProduct.nom_producto}</h3>
                <p className="text-sm text-muted-foreground">ID: {selectedProduct.id_producto}</p>
              </div>

              {/* Clasificación */}
              <div className="grid gap-4">
                <h4 className="text-sm font-medium text-muted-foreground">Clasificación</h4>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <dt className="text-muted-foreground">Categoría</dt>
                  <dd>{selectedProduct.nom_categoria || '-'}</dd>
                  <dt className="text-muted-foreground">Línea</dt>
                  <dd>{selectedProduct.nom_linea || '-'}</dd>
                  <dt className="text-muted-foreground">Sublínea</dt>
                  <dd>{selectedProduct.nom_sublinea || '-'}</dd>
                  <dt className="text-muted-foreground">Marca</dt>
                  <dd>{selectedProduct.nom_marca || '-'}</dd>
                  <dt className="text-muted-foreground">Proveedor</dt>
                  <dd>{selectedProduct.nom_proveedor || '-'}</dd>
                </dl>
              </div>

              {/* Precio y stock */}
              <div className="grid gap-4">
                <h4 className="text-sm font-medium text-muted-foreground">Precio y stock</h4>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <dt className="text-muted-foreground">Precio</dt>
                  <dd className="font-semibold">{formatPrice(selectedProduct.val_precio)}</dd>
                  <dt className="text-muted-foreground">Stock</dt>
                  <dd>
                    <Badge
                      variant={selectedProduct.num_stock === 0 ? 'destructive' : selectedProduct.num_stock <= 10 ? 'default' : 'secondary'}
                      className={
                        selectedProduct.num_stock === 0
                          ? 'bg-red-100 text-red-800'
                          : selectedProduct.num_stock <= 10
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {selectedProduct.num_stock}
                    </Badge>
                  </dd>
                </dl>
              </div>

              {/* Estado */}
              <div className="grid gap-4">
                <h4 className="text-sm font-medium text-muted-foreground">Estado</h4>
                <p>
                  <span className={selectedProduct.ind_activo ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
                    {selectedProduct.ind_activo ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
              </div>

              {/* Especificaciones */}
              {selectedProduct.spcf_producto && Object.keys(selectedProduct.spcf_producto).length > 0 && (
                <div className="grid gap-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Especificaciones</h4>
                  <dl className="grid gap-3 text-sm">
                    {Object.entries(selectedProduct.spcf_producto).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4 border-b border-border pb-3">
                        <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                        <dd className="text-right">{String(value ?? '-')}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Fecha de alta */}
              {selectedProduct.fec_insert && (
                <div className="text-sm text-muted-foreground pt-1">
                  Fecha de alta: {new Date(selectedProduct.fec_insert).toLocaleDateString('es', { dateStyle: 'medium' })}
                </div>
              )}

              {/* Acciones en el drawer */}
              <div className="flex flex-col gap-3 pt-6 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    router.push(`/admin/products/${selectedProduct.id_categoria}-${selectedProduct.id_linea}-${selectedProduct.id_sublinea}-${selectedProduct.id_producto}/edit`);
                    setSelectedProduct(null);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar producto
                </Button>
                <Button
                  variant={selectedProduct.ind_activo ? "default" : "destructive"}
                  className={selectedProduct.ind_activo ? "w-full bg-green-600 hover:bg-green-700" : "w-full"}
                  onClick={() => {
                    handleToggleActive(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  disabled={deactivateActivateProductMutation.isPending}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {selectedProduct.ind_activo ? 'Desactivar' : 'Activar'} producto
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!productToDeactivate} onOpenChange={(open) => !open && setProductToDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar producto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres desactivar este producto? Dejará de mostrarse en la tienda.
              {productToDeactivate && (
                <span className="mt-2 block font-medium text-foreground">{productToDeactivate.nom_producto}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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