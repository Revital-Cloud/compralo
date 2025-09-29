/**
 * Hook personalizado para productos
 * 
 * Este hook maneja todas las operaciones relacionadas con productos,
 * categorías, marcas, inventario usando React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as productService from '@/services/product.service';
import type { Product, ProductCreate, ProductUpdate, ProductFilterParams, ProductFilterResponse, ProductFilterStats, FilterOptions, ProductAdmin, ProductAdminParams } from '@/types/product';
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
  filterOptions: () => [...PRODUCT_KEYS.filters(), 'options'] as const,
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

export function useProduct(slug: string) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(slug),
    queryFn: () => productService.getProductByIds(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productData: ProductCreate) => productService.createProduct(productData),
    onSuccess: () => {
      toast.success('Producto creado exitosamente');
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Error al crear el producto';
      toast.error(message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdate }) => 
      productService.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      toast.success('Producto actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Error al actualizar el producto';
      toast.error(message);
    },
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

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutos
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
 */
export function useFilterProducts(filters: ProductFilterParams) {
  return useQuery({
    queryKey: PRODUCT_KEYS.filter(filters),
    queryFn: () => {
      console.log('🚀 Ejecutando query de filtros:', filters)
      return productService.filterProducts(filters)
    },
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
    queryFn: () => {
      console.log('📊 Ejecutando query de estadísticas:', filters)
      return productService.getFilterStats(filters)
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - estadísticas cambian menos
    refetchOnWindowFocus: false, // Evitar refetch innecesario
    refetchOnMount: false, // Evitar refetch al montar si ya tenemos datos
    refetchOnReconnect: false, // Evitar refetch al reconectar
  });
}

/**
 * Hook para obtener opciones de filtros
 */
export function useFilterOptions() {
  return useQuery({
    queryKey: PRODUCT_KEYS.filterOptions(),
    queryFn: () => productService.getFilterOptions(),
    staleTime: 15 * 60 * 1000, // 15 minutos - las opciones cambian poco
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
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    gcTime: 5 * 60 * 1000, // 5 minutos en cache
  });
} 