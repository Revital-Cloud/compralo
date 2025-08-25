/**
 * Hook personalizado para productos
 * 
 * Este hook maneja todas las operaciones relacionadas con productos,
 * categorías, marcas, inventario usando React Query.
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import productService from '@/services/product.service';
import type {
  ProductCreate,
  ProductUpdate,
  ProductFilters,
  PaginationParams,
  PaginatedResponse,
  Category,
  Brand,
  Provider,
  StockUpdate,
} from '@/types';
import type { Product } from '@/types/product';

// Keys para las queries
export const PRODUCT_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
  list: (filters?: ProductFilters) => [...PRODUCT_KEYS.lists(), { filters }] as const,
  details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
  detail: (id: string | number) => [...PRODUCT_KEYS.details(), id] as const,
  categories: ['categories'] as const,
  brands: ['brands'] as const,
  providers: ['providers'] as const,
  inventory: ['inventory'] as const,
  featured: ['products', 'featured'] as const,
  onSale: ['products', 'onSale'] as const,
};

// =============================================================================
// HOOKS DE CONSULTA DE PRODUCTOS
// =============================================================================

/**
 * Hook para obtener lista paginada de productos
 */
export function useProducts(params?: ProductFilters) {
  const query = useQuery({
    queryKey: PRODUCT_KEYS.list(params),
    queryFn: () => {
      console.log('🔍 useProducts: Llamando a getProducts con params:', params);
      return productService.getProducts(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  console.log('🔍 useProducts: Estado actual:', {
    isLoading: query.isLoading,
    isError: query.isError,
    data: query.data,
    error: query.error
  });

  return query;
}

/**
 * Hook para obtener productos con scroll infinito
 */
export function useInfiniteProducts(filters?: ProductFilters) {
  return useInfiniteQuery({
    queryKey: PRODUCT_KEYS.list(filters),
    queryFn: ({ pageParam = 1 }) => 
      productService.getProducts({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const hasNextPage = lastPage.page < lastPage.pages;
      return hasNextPage ? lastPage.page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener un producto específico
 */
export function useProductByIds(
  ids:
    | string
    | {
        id_categoria: string | number
        id_linea: string | number
        id_sublinea: string | number
        id_producto: string | number
      },
  enabled = true
) {
  const key = typeof ids === 'string' ? ids : `${ids.id_categoria}-${ids.id_linea}-${ids.id_sublinea}-${ids.id_producto}`
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(key),
    queryFn: () => productService.getProductByIds(ids),
    enabled: enabled && !!key,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar productos
 */
export function useSearchProducts(query: string, filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', 'search', query, filters],
    queryFn: () => productService.searchProducts(query, filters),
    enabled: query.length >= 2, // Solo buscar con al menos 2 caracteres
    staleTime: 2 * 60 * 1000, // 2 minutos para búsquedas
  });
}

/**
 * Hook para productos destacados
 */
export function useFeaturedProducts(limit?: number) {
  return useQuery({
    queryKey: PRODUCT_KEYS.featured,
    queryFn: () => productService.getFeaturedProducts(limit),
    staleTime: 10 * 60 * 1000, // 10 minutos para productos destacados
  });
}

/**
 * Hook para productos en oferta
 */
export function useProductsOnSale(params?: PaginationParams) {
  return useQuery({
    queryKey: PRODUCT_KEYS.onSale,
    queryFn: () => productService.getProductsOnSale(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para productos por categoría
 */
export function useProductsByCategory(categoryId: number, params?: PaginationParams) {
  return useQuery({
    queryKey: ['products', 'category', categoryId, params],
    queryFn: () => productService.getProductsByCategory(categoryId, params),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para productos por marca
 */
export function useProductsByBrand(brandId: number, params?: PaginationParams) {
  return useQuery({
    queryKey: ['products', 'brand', brandId, params],
    queryFn: () => productService.getProductsByBrand(brandId, params),
    enabled: !!brandId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para productos por sublínea
 */
export function useProductsBySubline(sublineId: number, params?: PaginationParams) {
  return useQuery({
    queryKey: ['products', 'subline', sublineId, params],
    queryFn: () => productService.getProductsBySubline(sublineId, params),
    enabled: !!sublineId,
    staleTime: 5 * 60 * 1000,
  });
}

// =============================================================================
// HOOKS DE MUTACIÓN DE PRODUCTOS
// =============================================================================

/**
 * Hook para crear producto
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: ProductCreate) => productService.createProduct(productData),
    onSuccess: (newProduct) => {
      // Invalidar listas de productos
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      
      toast.success(`Producto "${newProduct.nom_producto}" creado exitosamente`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al crear el producto';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar producto
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: ProductUpdate & { id: number }) => 
      productService.updateProduct(id, data),
    onSuccess: (updatedProduct, variables) => {
      // Actualizar cache del producto específico
      queryClient.setQueryData(
        PRODUCT_KEYS.detail(variables.id),
        updatedProduct
      );
      
      // Invalidar listas de productos
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      
      toast.success(`Producto "${updatedProduct.nom_producto}" actualizado exitosamente`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al actualizar el producto';
      toast.error(message);
    },
  });
}

/**
 * Hook para eliminar producto
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: (_, deletedId) => {
      // Remover de cache
      queryClient.removeQueries({ queryKey: PRODUCT_KEYS.detail(deletedId) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al eliminar el producto';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar stock
 */
export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stockData: StockUpdate) => productService.updateProductStock(stockData),
    onSuccess: (updatedProduct) => {
      // Actualizar cache del producto
      queryClient.setQueryData(
        PRODUCT_KEYS.detail(updatedProduct.id_producto),
        updatedProduct
      );
      
      // Invalidar listas para reflejar cambios de stock
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      
      toast.success('Stock actualizado exitosamente');
    },
    // Configurar actualización optimista
    onMutate: async (stockData) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ 
        queryKey: PRODUCT_KEYS.detail(stockData.id_producto) 
      });

      // Obtener datos actuales
      const previousProduct = queryClient.getQueryData(
        PRODUCT_KEYS.detail(stockData.id_producto)
      );

      // Actualizar optimistamente
      queryClient.setQueryData(
        PRODUCT_KEYS.detail(stockData.id_producto),
        (old: Product | undefined) => {
          if (!old) return old;
          return {
            ...old,
            stock_actual: stockData.num_stock,
          };
        }
      );

      return { previousProduct };
    },
    onError: (error: any, stockData, context) => {
      // Revertir cambios optimistas
      if (context?.previousProduct) {
        queryClient.setQueryData(
          PRODUCT_KEYS.detail(stockData.id_producto),
          context.previousProduct
        );
      }
      
      const message = error?.response?.data?.message || 'Error al actualizar el stock';
      toast.error(message);
    },
  });
}

// =============================================================================
// HOOKS PARA ENTIDADES RELACIONADAS
// =============================================================================

/**
 * Hook para obtener categorías
 */
export function useCategories() {
  return useQuery({
    queryKey: PRODUCT_KEYS.categories,
    queryFn: () => productService.getCategories(),
    staleTime: 15 * 60 * 1000, // 15 minutos (datos relativamente estáticos)
  });
}

/**
 * Hook para obtener marcas
 */
export function useBrands() {
  return useQuery({
    queryKey: PRODUCT_KEYS.brands,
    queryFn: () => productService.getBrands(),
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Hook para obtener proveedores
 */
export function useProviders() {
  return useQuery({
    queryKey: PRODUCT_KEYS.providers,
    queryFn: () => productService.getProviders(),
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Hook para productos con stock bajo
 */
export function useLowStockProducts(threshold?: number) {
  return useQuery({
    queryKey: [PRODUCT_KEYS.inventory, 'low-stock', threshold],
    queryFn: () => productService.getLowStockProducts(threshold),
    staleTime: 2 * 60 * 1000, // 2 minutos para inventario
  });
}

/**
 * Hook para reporte de inventario
 */
export function useInventoryReport() {
  return useQuery({
    queryKey: [PRODUCT_KEYS.inventory, 'report'],
    queryFn: () => productService.getInventoryReport(),
    staleTime: 5 * 60 * 1000,
  });
}

// =============================================================================
// HOOKS DE PREFETCHING
// =============================================================================

/**
 * Hook para prefetch de producto (útil para hovers)
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (ids: string | { id_categoria: string | number; id_linea: string | number; id_sublinea: string | number; id_producto: string | number; }) => {
    queryClient.prefetchQuery({
      queryKey: PRODUCT_KEYS.detail(typeof ids === 'string' ? ids : `${ids.id_categoria}-${ids.id_linea}-${ids.id_sublinea}-${ids.id_producto}`),
      queryFn: () => productService.getProductByIds(ids),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Hook para prefetch de productos por categoría
 */
export function usePrefetchProductsByCategory() {
  const queryClient = useQueryClient();

  return (categoryId: number, params?: PaginationParams) => {
    queryClient.prefetchQuery({
      queryKey: ['products', 'category', categoryId, params],
      queryFn: () => productService.getProductsByCategory(categoryId, params),
      staleTime: 5 * 60 * 1000,
    });
  };
} 