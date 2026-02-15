import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCategories, getAllCategories } from '@/services/category.service'
import { mapCategoriesToDisplay } from '@/utils/category-mapper'
import type { CategoryDisplay } from '@/types/category'

/**
 * Hook para obtener categorías usando React Query
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const apiCategories = await getCategories()
      return mapCategoriesToDisplay(apiCategories)
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - los datos se consideran frescos
    gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en caché
    retry: 2, // Reintentar 2 veces en caso de error
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
  })
}

/**
 * Hook para obtener categorías crudas (Category[]) – útil en formularios admin
 */
export function useCategoriesRaw() {
  return useQuery({
    queryKey: ['categories', 'raw'],
    queryFn: () => getCategories(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook para obtener solo categorías raíz (parent_id === null) para la página "Todas las Categorías"
 */
export function useRootCategories() {
  return useQuery({
    queryKey: ['categories', 'roots'],
    queryFn: async () => {
      const apiCategories = await getCategories()
      const roots = apiCategories.filter((c) => c.parent_id == null)
      return mapCategoriesToDisplay(roots)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook específico para categorías destacadas (limitadas a 6)
 */
export function useFeaturedCategories() {
  return useQuery({
    queryKey: ['categories', 'featured'],
    queryFn: async () => {
      const apiCategories = await getCategories()
      const roots = apiCategories.filter((c) => c.parent_id == null)
      const displayCategories = mapCategoriesToDisplay(roots)
      return displayCategories.slice(0, 6) // Limitar a 6 categorías
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook para obtener una categoría específica por ID
 */
export function useCategory(id: string | number) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: async () => {
      const { getCategoryById } = await import('@/services/category.service')
      return await getCategoryById(id)
    },
    enabled: !!id, // Solo ejecutar si hay ID
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  })
}

/**
 * Hook para invalidar el caché de categorías
 */
export function useCategoriesActions() {
  const queryClient = useQueryClient()
  
  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
  }
  
  const refetchCategories = () => {
    queryClient.refetchQueries({ queryKey: ['categories'] })
  }
  
  return {
    invalidateCategories,
    refetchCategories,
  }
}

/**
 * Hook para obtener todas las categorías (incluye inactivas) – útil en Admin
 */
export function useAllCategories() {
  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const list = await getAllCategories()
      return list
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  })
}
