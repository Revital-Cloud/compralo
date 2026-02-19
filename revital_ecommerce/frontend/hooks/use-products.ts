/**
 * Hook personalizado para productos
 * 
 * Este hook maneja todas las operaciones relacionadas con productos,
 * categorías, marcas, inventario usando React Query.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as productService from '@/services/product.service';
import type { Product, ProductCreateComposite, ProductFilterParams, ProductFilterResponse, ProductFilterStats, FilterOptions, ProductAdmin, ProductAdminParams } from '@/types/product';
import type { PaginationParams } from '@/types/common';

export const PRODUCT_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
  list: (filters: PaginationParams) => [...PRODUCT_KEYS.lists(), filters] as const,
  details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
  detail: (id: string | number) => [...PRODUCT_KEYS.details(), id] as const,
  // Admin
  admin: () => [...PRODUCT_KEYS.all, 'admin'] as const,
  adminList: (params: ProductAdminParams) => [...PRODUCT_KEYS.admin(), 'list', params] as const,
  // Filtros avanzados
  filters: () => [...PRODUCT_KEYS.all, 'filters'] as const,
  filter: (filters: ProductFilterParams) => [...PRODUCT_KEYS.filters(), filters] as const,
  filterStats: (filters: ProductFilterParams) => [...PRODUCT_KEYS.filters(), 'stats', filters] as const,
  filterOptions: (categoryId?: number | null) => [...PRODUCT_KEYS.filters(), 'options', categoryId ?? 'all'] as const,
  filterOptionsAdmin: () => [...PRODUCT_KEYS.admin(), 'filter-options'] as const,
  search: (query: string) => [...PRODUCT_KEYS.all, 'search', query] as const,
};

export function useProductsHomePage() {
  return useQuery<Product[]>({
    queryKey: ['products', 'homepage'],
    queryFn: () => productService.getProducts() as Promise<Product[]>,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
  });
}

export function useProducts(filters: PaginationParams = { page: 1, limit: 12 }) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(filters),
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
  });
}

export function useProduct(slugOrId: string) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(slugOrId),
    queryFn: () => productService.getProductBySlugOrId(slugOrId),
    enabled: !!slugOrId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: () => {
      toast.success('Producto eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Error al eliminar el producto';
      toast.error(message);
    },
  });
}

/**
 * Activar/desactivar producto por product_id
 */
export function useDeactivateActivateProductById() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, activar }: { productId: number; activar: boolean }) =>
      productService.deactivateActivateProductById(productId, activar),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.admin() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      toast.success(variables.activar ? 'Producto activado' : 'Producto desactivado');
    },
    onError: (error: any, variables) => {
      const msg = error?.response?.data?.detail || error?.message;
      toast.error(msg || `Error al ${variables.activar ? 'activar' : 'desactivar'} producto`);
    },
  });
}

/**
 * Crear producto compuesto (producto + variantes + imágenes)
 */
export function useCreateProductComposite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      imageFiles,
    }: {
      payload: ProductCreateComposite;
      imageFiles?: File[];
    }) => productService.createProductComposite(payload, imageFiles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.admin() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      toast.success('Producto creado correctamente');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || error?.message;
      toast.error(msg || 'Error al crear el producto');
    },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => productService.getBrands(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// =============================================================================
// HOOKS DE FILTROS AVANZADOS (NUEVOS)
// =============================================================================

/**
 * Hook para filtrar productos con criterios avanzados
 * @param enabled - Si false, no ejecuta la consulta (útil para fallbacks condicionales)
 */
export function useFilterProducts(filters: ProductFilterParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: PRODUCT_KEYS.filter(filters),
    queryFn: () => productService.filterProducts(filters),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutos - aumentar para evitar llamadas frecuentes
    placeholderData: (previousData) => previousData, // Mantener datos anteriores durante la carga
    refetchOnWindowFocus: false, // Evitar refetch innecesario
    refetchOnMount: false, // Evitar refetch al montar si ya tenemos datos
    refetchOnReconnect: false, // Evitar refetch al reconectar
  });
}

/**
 * Hook para obtener estadísticas de productos filtrados
 */
export function useFilterStats(filters: ProductFilterParams) {
  return useQuery({
    queryKey: PRODUCT_KEYS.filterStats(filters),
    queryFn: () => productService.getFilterStats(filters),
    staleTime: 10 * 60 * 1000, // 10 minutos - estadísticas cambian menos
    refetchOnWindowFocus: false, // Evitar refetch innecesario
    refetchOnMount: false, // Evitar refetch al montar si ya tenemos datos
    refetchOnReconnect: false, // Evitar refetch al reconectar
  });
}

/**
 * Hook para obtener opciones de filtros (tienda: solo activos).
 * Si se pasa selectedCategoryId, los atributos devueltos son solo los de esa categoría.
 * placeholderData mantiene categorías/marcas visibles mientras se recargan solo los atributos.
 */
export function useFilterOptions(selectedCategoryId?: number | null) {
  return useQuery({
    queryKey: PRODUCT_KEYS.filterOptions(selectedCategoryId ?? undefined),
    queryFn: () => productService.getFilterOptions(selectedCategoryId ?? undefined),
    staleTime: 15 * 60 * 1000, // 15 minutos - las opciones cambian poco
    placeholderData: (previousData) => previousData, // No recargar categorías al cambiar categoría; solo actualizar atributos
  });
}

/**
 * Hook para opciones de filtro en admin (incluye activos e inactivos)
 */
export function useFilterOptionsAdmin() {
  return useQuery({
    queryKey: PRODUCT_KEYS.filterOptionsAdmin(),
    queryFn: () => productService.getFilterOptionsAdmin(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para búsqueda rápida de productos
 */
export function useQuickSearch(query: string, limit: number = 20) {
  return useQuery({
    queryKey: PRODUCT_KEYS.search(query),
    queryFn: () => productService.quickSearchProducts(query, limit),
    enabled: !!query && query.length >= 2, // Solo buscar si hay al menos 2 caracteres
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// =============================================================================
// HOOKS PARA ADMINISTRACIÓN
// =============================================================================

/**
 * Hook para obtener productos para administración (solo admin)
 */
export function useProductsAdmin(params: ProductAdminParams = {}) {
  return useQuery({
    queryKey: PRODUCT_KEYS.adminList(params),
    queryFn: () => productService.getProductsAdmin(params),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData, // Mantener total y stats al cambiar de página
  });
}
