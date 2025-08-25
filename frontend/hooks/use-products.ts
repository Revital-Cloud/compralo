/**
 * Hook personalizado para productos
 * 
 * Este hook maneja todas las operaciones relacionadas con productos,
 * categorías, marcas, inventario usando React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as productService from '@/services/product.service';
import type { Product, ProductCreate, ProductUpdate, PaginationParams } from '@/types';

export const PRODUCT_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
  list: (filters: PaginationParams) => [...PRODUCT_KEYS.lists(), filters] as const,
  details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
  detail: (id: string | number) => [...PRODUCT_KEYS.details(), id] as const,
};

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