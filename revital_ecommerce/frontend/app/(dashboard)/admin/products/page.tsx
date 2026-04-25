'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from "sonner";
import { ProductsHeader } from "@/components/admin/products";
import { ProductsFilters } from "@/components/admin/products/products-filters";
// Import explícito para evitar "Pagination is not defined" (referencia desde barrel u otro módulo)
import { Pagination } from "@/components/admin/products/pagination";
import { useProductsAdmin, useDeactivateActivateProductById, useFilterOptionsAdmin } from "@/hooks/use-products";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { Pencil, Power, Eye } from 'lucide-react';
import { formatPrice } from '@/utils/format-price';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAdminTour } from '../_tour/useAdminDriverTour';

/** Trunca texto por número de palabras y muestra el completo en tooltip */
function TruncateWithTooltip({
  text,
  maxWords = 3,
  className,
}: {
  text: string;
  maxWords?: number;
  className?: string;
}) {
  const s = (text || '').trim();
  if (!s) return <span className={className}>–</span>;
  const words = s.split(/\s+/);
  const truncated = words.length <= maxWords ? s : words.slice(0, maxWords).join(' ') + '...';
  if (words.length <= maxWords) {
    return <span className={className}>{s}</span>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(className, 'cursor-help underline decoration-dotted')}>{truncated}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {s}
      </TooltipContent>
    </Tooltip>
  );
}

const PRODUCTS_LIST_TOUR_KEY = 'revital_products_tour_seen';

const ProductsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estado de orden (la página actual viene de la URL)
  const [sortBy, setSortBy] = useState<'nombre' | 'precio' | 'stock' | 'fecha' | 'categoria' | 'marca'>('nombre');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [pageSize, setPageSize] = useState<number>(10);
  
  // Obtener parámetros de búsqueda de la URL
  const search = searchParams.get('search') || '';
  // Página actual desde la URL (sincronizada para que la paginación y la petición coincidan)
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  
  // Estado local para el input de búsqueda (se actualiza inmediatamente)
  const [searchInput, setSearchInput] = useState(search);
  
  // Ref para almacenar el timeout del debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Producto seleccionado para ver en el drawer
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // Producto pendiente de confirmar desactivación (para AlertDialog)
  const [productToDeactivate, setProductToDeactivate] = useState<Product | null>(null);
  
  const category = searchParams.get('category') || '';
  const line = searchParams.get('line') || '';
  const subline = searchParams.get('subline') || '';
  const brand = searchParams.get('brand') || '';
  const provider = searchParams.get('provider') || '';

  const { data: filterOptions, isLoading: optionsLoading } = useFilterOptionsAdmin();
  const { startProductsListTour } = useAdminTour();

  // Mapa category_id -> { category, line, subline } para mostrar Categoría/Línea/Sublínea en la tabla
  const categoryIdToLineSubline = useMemo(() => {
    const categorias = (filterOptions?.categorias ?? []) as Array<{ id: number; name?: string; nom_categoria?: string; parent_id?: number | null; parentId?: number | null }>;
    const getParentId = (c: (typeof categorias)[number]) => (c.parent_id ?? (c as { parentId?: number | null }).parentId) ?? null;
    const getName = (c: (typeof categorias)[number]) => (c.nom_categoria ?? c.name) ?? '–';
    const roots = categorias.filter((c) => getParentId(c) === null);
    const rootIds = new Set(roots.map((r) => Number(r.id)));
    const lineCandidates = categorias.filter((c) => {
      const pid = getParentId(c);
      return pid != null && rootIds.has(pid);
    });
    const lineIds = new Set(lineCandidates.map((c) => Number(c.id)));
    const sublineCandidates = categorias.filter((c) => {
      const pid = getParentId(c);
      return pid != null && lineIds.has(pid);
    });
    const result: Record<number, { category: string; line: string; subline: string }> = {};
    roots.forEach((r) => {
      result[Number(r.id)] = { category: getName(r), line: '–', subline: '–' };
    });
    lineCandidates.forEach((c) => {
      const pid = getParentId(c);
      const root = pid != null ? roots.find((r) => Number(r.id) === pid) : null;
      result[Number(c.id)] = { category: root ? getName(root) : '–', line: getName(c), subline: '–' };
    });
    sublineCandidates.forEach((c) => {
      const pid = getParentId(c);
      const line = pid != null ? lineCandidates.find((l) => Number(l.id) === pid) : null;
      const rootId = line ? getParentId(line) : null;
      const root = rootId != null ? roots.find((r) => Number(r.id) === rootId) : null;
      result[Number(c.id)] = {
        category: root ? getName(root) : '–',
        line: line ? getName(line) : '–',
        subline: getName(c),
      };
    });
    return result;
  }, [filterOptions?.categorias]);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(PRODUCTS_LIST_TOUR_KEY);
      if (!seen) {
        startProductsListTour();
        localStorage.setItem(PRODUCTS_LIST_TOUR_KEY, '1');
      }
    } catch {
      // ignore
    }
  }, [startProductsListTour]);

  // Pedir todos los productos (límite alto) para que el DataTable pagine en cliente, igual que Categorías
  const filters = {
    ordenar_por: sortBy,
    orden: sortOrder,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
    search: search || undefined,
    category_id: category ? Number(category) : undefined,
    line_id: line ? Number(line) : undefined,
    subline_id: subline ? Number(subline) : undefined,
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

  const deactivateActivateProductMutation = useDeactivateActivateProductById();

  // Manejar cambio de página (actualiza la URL; currentPage se lee de la URL)
  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page <= 1) params.delete('page');
    else params.set('page', page.toString());
    router.push(`/admin/products${params.toString() ? `?${params.toString()}` : ''}`);
  }, [router, searchParams]);

  const handleToggleActive = useCallback((row: Product) => {
    const isActive = Boolean((row as { ind_activo?: boolean; is_active?: boolean }).ind_activo ?? (row as { is_active?: boolean }).is_active ?? true);
    if (isActive) {
      setProductToDeactivate(row);
      return;
    }
    const productId = Number(row.id);
    if (!productId) return;
    deactivateActivateProductMutation.mutate({ productId, activar: true });
  }, [deactivateActivateProductMutation]);

  const handleConfirmDeactivate = useCallback(() => {
    if (!productToDeactivate) return;
    const productId = Number(productToDeactivate.id);
    if (!productId) return;
    deactivateActivateProductMutation.mutate({ productId, activar: false });
    setProductToDeactivate(null);
  }, [deactivateActivateProductMutation, productToDeactivate]);

  // Manejar cambios en el input con debounce directo (sin useEffect)
  const handleSearchChange = useCallback((value: string) => {
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
  }, [router, searchParams]);

  const handleCategoryChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handleBrandChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('brand', value);
    } else {
      params.delete('brand');
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handleProviderChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('provider', value);
    } else {
      params.delete('provider');
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const handleLineChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('line', value);
    else params.delete('line');
    params.delete('subline'); // al cambiar línea limpiamos sublínea
    router.push(`/admin/products?${params.toString()}`);
  }, [router, searchParams]);

  const handleSublineChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('subline', value);
    else params.delete('subline');
    router.push(`/admin/products?${params.toString()}`);
  }, [router, searchParams]);

  const handleClearFilters = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setSearchInput('');
    router.push('/admin/products');
  }, [router]);

  // Extraer datos de la respuesta (todos los productos de la consulta; el DataTable pagina en cliente)
  const adminProducts = Array.isArray(productsResponse) ? productsResponse : [];
  const totalItems = adminProducts.length > 0 ? adminProducts[0].total_registros : 0;
  const totalPages = Math.ceil(totalItems / (pageSize || 1));

  // Estadísticas globales de stock (todo el inventario, no solo la tabla filtrada)
  const first = adminProducts[0];
  const globalStockStats =
    adminProducts.length > 0 && first && typeof first.stock_stats_en_stock === 'number'
      ? {
          enStock: Number(first.stock_stats_en_stock) || 0,
          stockBajo: Number(first.stock_stats_bajo) || 0,
          sinStock: Number(first.stock_stats_sin_stock) || 0,
        }
      : null;

  const products: Product[] = adminProducts.map((adminProduct) => {
    const stock = Number(adminProduct.stock_total) || 0;
    const isActive = adminProduct.is_active ?? true;
    const priceMin = adminProduct.price_min || '0';
    const priceMax = (adminProduct as { price_max?: string }).price_max || priceMin;
    return {
      id: adminProduct.id,
      name: adminProduct.name,
      description: adminProduct.description,
      image_url: adminProduct.image_url,
      price_min: priceMin,
      price_max: priceMax,
      id_proveedor: (adminProduct as { id_proveedor?: string }).id_proveedor,
      id_marca: adminProduct.id_marca,
      category_id: adminProduct.category_id,
      num_stock: stock,
      stock_total: stock,
      usr_insert: '0',
      fec_insert: adminProduct.fec_insert,
      usr_update: null,
      fec_update: null,
      is_active: isActive,
      ind_activo: isActive,
      images: undefined,
      category_name: adminProduct.category_name,
      nom_proveedor: (adminProduct as { nom_proveedor?: string }).nom_proveedor,
      nom_marca: adminProduct.nom_marca,
    };
  });

  // Definir columnas de la tabla
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'image_url',
      header: 'Imagen',
      cell: ({ row }) => {
        const o = row.original as any;
        const imgUrl = o.image_url ?? (typeof o.img_producto === 'string' ? o.img_producto : o.img_producto?.main) ?? '';
        return (
          <div className="w-12 h-12 relative rounded-md overflow-hidden bg-gray-100">
            {imgUrl ? (
              <Image
                src={imgUrl}
                alt={row.original.name}
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
      accessorKey: 'name',
      header: 'Producto',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">ID: {row.original.id}</div>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Categoría',
      cell: ({ row }) => {
        const catId = Number((row.original as { category_id?: string }).category_id);
        const info = categoryIdToLineSubline[catId];
        return (
          <span className="text-sm">
            {info ? (
              <TruncateWithTooltip text={info.category} maxWords={3} className="text-sm" />
            ) : (
              '–'
            )}
          </span>
        );
      },
    },
    {
      id: 'line',
      header: 'Línea',
      cell: ({ row }) => {
        const catId = Number((row.original as { category_id?: string }).category_id);
        const info = categoryIdToLineSubline[catId];
        return (
          <span className="text-sm">
            {info && info.line !== '–' ? (
              <TruncateWithTooltip text={info.line} maxWords={3} className="text-sm" />
            ) : (
              '–'
            )}
          </span>
        );
      },
    },
    {
      id: 'subline',
      header: 'Sublínea',
      cell: ({ row }) => {
        const catId = Number((row.original as { category_id?: string }).category_id);
        const info = categoryIdToLineSubline[catId];
        return (
          <span className="text-sm">
            {info && info.subline !== '–' ? (
              <TruncateWithTooltip text={info.subline} maxWords={3} className="text-sm" />
            ) : (
              '–'
            )}
          </span>
        );
      },
    },
    {
      accessorKey: 'nom_marca',
      header: 'Marca',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.nom_marca || '-'}</span>
      ),
    },
    {
      accessorKey: 'price_min',
      header: 'Precio',
      cell: ({ row }) => {
        const minRaw = (row.original as any).price_min ?? (row.original as any).val_precio ?? 0;
        const min = parseFloat(String(minRaw)) || 0;
        const maxRaw = (row.original as any).price_max;
        const max = maxRaw != null ? (parseFloat(String(maxRaw)) || min) : min;
        const showRange = !Number.isNaN(min) && !Number.isNaN(max) && min !== max && min > 0 && max > 0;
        return (
          <span className="font-semibold">
            {min > 0 && (showRange
              ? `${formatPrice(min, 'COP')} – ${formatPrice(max, 'COP')}`
              : formatPrice(min, 'COP'))}
            {min === 0 && <span className="text-muted-foreground">$0</span>}
          </span>
        )
      },
    },
    {
      accessorKey: 'stock_total',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = Number((row.original as any).stock_total ?? (row.original as any).num_stock ?? 0);
        const stockValue = isNaN(stock) ? 0 : stock;
        return (
          <Badge 
            variant={stockValue === 0 ? 'destructive' : stockValue <= 10 ? 'default' : 'secondary'}
            className={
              stockValue === 0 
                ? 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:text-white' 
                : stockValue <= 10 
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-100' 
                : 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100'
            }
          >
            {stockValue}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => {
        const isActive = Boolean((row.original as any).is_active ?? (row.original as any).ind_activo_producto);
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
            onClick={() => router.push(`/admin/products/${row.original.id}/edit`)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={row.original.is_active ? "default" : "destructive"}
            size="icon"
            aria-label={row.original.is_active ? "Desactivar producto" : "Activar producto"}
            onClick={() => handleToggleActive(row.original)}
            disabled={deactivateActivateProductMutation.isPending}
            className={row.original.is_active ? "bg-green-600 hover:bg-green-700 text-white" : ""}
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
      <div data-tour-id="products-filters">
        <ProductsFilters
          search={searchInput}
          onSearchChange={handleSearchChange}
          category={category}
          onCategoryChange={handleCategoryChange}
          line={line}
          onLineChange={handleLineChange}
          subline={subline}
          onSublineChange={handleSublineChange}
          brand={brand}
          onBrandChange={handleBrandChange}
          provider={provider}
          onProviderChange={handleProviderChange}
          onClearFilters={handleClearFilters}
          totalResults={totalItems}
          products={products}
          filterOptionsOverride={filterOptions}
          optionsLoading={optionsLoading}
          stockStatsOverride={globalStockStats}
        />
      </div>

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
                {(selectedProduct as any).image_url || (selectedProduct as any).img_producto ? (
                  <Image
                    src={(selectedProduct as any).image_url ?? (typeof (selectedProduct as any).img_producto === 'string' ? (selectedProduct as any).img_producto : (selectedProduct as any).img_producto?.main) ?? ''}
                    alt={selectedProduct.name}
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
                <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                <p className="text-sm text-muted-foreground">ID: {selectedProduct.id}</p>
              </div>

              {/* Clasificación */}
              <div className="grid gap-4">
                <h4 className="text-sm font-medium text-muted-foreground">Clasificación</h4>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <dt className="text-muted-foreground">Categoría</dt>
                  <dd>{selectedProduct.category_name || '-'}</dd>
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
                  <dd className="font-semibold">
                    {(() => {
                      const min = parseFloat(String((selectedProduct as any).price_min ?? (selectedProduct as any).val_precio ?? 0))
                      const maxRaw = (selectedProduct as any).price_max
                      const max = maxRaw != null ? parseFloat(String(maxRaw)) : min
                      const showRange = !Number.isNaN(min) && !Number.isNaN(max) && min !== max
                      return showRange ? `${formatPrice(min, 'COP')} – ${formatPrice(max, 'COP')}` : formatPrice(min, 'COP')
                    })()}
                  </dd>
                  <dt className="text-muted-foreground">Stock</dt>
                  <dd>
                    {(() => {
                      const stock = selectedProduct.num_stock ?? selectedProduct.stock_total ?? 0;
                      return (
                        <Badge
                          variant={stock === 0 ? 'destructive' : stock <= 10 ? 'default' : 'secondary'}
                          className={
                            stock === 0
                              ? 'bg-red-100 text-red-800'
                              : stock <= 10
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }
                        >
                          {stock}
                        </Badge>
                      );
                    })()}
                  </dd>
                </dl>
              </div>

              {/* Estado */}
              <div className="grid gap-4">
                <h4 className="text-sm font-medium text-muted-foreground">Estado</h4>
                <p>
                  <span className={selectedProduct.is_active ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
                    {selectedProduct.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
              </div>

              {/* Especificaciones */}
              {((selectedProduct as any).spcf_producto && Object.keys((selectedProduct as any).spcf_producto).length > 0) || ((selectedProduct as any).description) ? (
                <div className="grid gap-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Especificaciones</h4>
                  <dl className="grid gap-3 text-sm">
                    {selectedProduct.description ? <p className="text-sm text-muted-foreground">{selectedProduct.description}</p> : null}
                    {Object.entries((selectedProduct as any).spcf_producto || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4 border-b border-border pb-3">
                        <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                        <dd className="text-right">{String(value ?? '-')}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

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
                    router.push(`/admin/products/${selectedProduct.id}/edit`);
                    setSelectedProduct(null);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar producto
                </Button>
                <Button
                  variant={selectedProduct.is_active ? "default" : "destructive"}
                  className={selectedProduct.is_active ? "w-full bg-green-600 hover:bg-green-700" : "w-full"}
                  onClick={() => {
                    handleToggleActive(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  disabled={deactivateActivateProductMutation.isPending}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {selectedProduct.is_active ? 'Desactivar' : 'Activar'} producto
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
                <span className="mt-2 block font-medium text-foreground">{productToDeactivate.name}</span>
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
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200/40 dark:bg-gray-800/40 rounded-md animate-pulse" />
            ))}
          </div>
        </div>
      ) : products.length > 0 ? (
        <div data-tour-id="products-table">
          <DataTable
            columns={[...columns, ...actions]}
            data={products}
            pageSize={pageSize}
            manualPagination
            pageCount={totalPages}
            pageIndex={currentPage - 1}
            onPageChange={(pageIndex) => handlePageChange(pageIndex + 1)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              handlePageChange(1);
            }}
          />
        </div>
      ) : (
        <div className="text-center py-12" data-tour-id="products-table">
          <div className="text-muted-foreground">No se encontraron productos</div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;