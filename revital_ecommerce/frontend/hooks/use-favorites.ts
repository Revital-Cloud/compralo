"use client"

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { favoritesService } from '@/services/favorites.service'
import { useAuth } from './use-auth'
import { 
  FavoriteProduct, 
  CreateFavoriteRequest, 
  FavoritesState, 
  UseFavoritesReturn 
} from '@/types/favorites'
import { toast } from 'sonner'

export const useFavorites = (): UseFavoritesReturn => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Query para obtener favoritos
  const { 
    data: favoritesData, 
    isLoading: queryLoading, 
    error: queryError,
    refetch: refetchFavorites 
  } = useQuery({
    queryKey: ['favorites', user?.id_usuario],
    queryFn: () => favoritesService.getFavorites(user!.id_usuario),
    enabled: !!user?.id_usuario,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  // Mutation para agregar a favoritos
  const addToFavoritesMutation = useMutation({
    mutationFn: (favoriteData: CreateFavoriteRequest) => 
      favoritesService.addToFavorites(favoriteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id_usuario] })
      toast.success('Producto agregado a favoritos')
    },
    onError: (error: any) => {
      // Manejar error específico de duplicado
      const errorMessage = error?.response?.data?.detail || error.message || ''
      
      if (errorMessage.includes('ya existe') || errorMessage.includes('duplicado') || errorMessage.includes('duplicate') || errorMessage.includes('ya está en tus favoritos') || error?.response?.status === 400) {
        toast.warning('Este producto ya está en tus favoritos')
      } else {
        toast.error('Error al agregar a favoritos')
      }
    }
  })

  // Mutation para eliminar de favoritos
  const removeFromFavoritesMutation = useMutation({
    mutationFn: (id_producto: number) =>
      favoritesService.removeFromFavorites(user!.id_usuario, id_producto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id_usuario] })
      toast.success('Producto eliminado de favoritos')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar de favoritos')
    }
  })

  // Actualizar estado local cuando cambian los datos de la query
  useEffect(() => {
    if (favoritesData) {
      setFavorites(favoritesData)
    }
    setIsLoading(queryLoading)
    setError(queryError?.message || null)
  }, [favoritesData, queryLoading, queryError])

  // Función para agregar a favoritos
  const addToFavorites = useCallback(async (favoriteData: CreateFavoriteRequest) => {
    if (!user?.id_usuario) {
      toast.error('Debes iniciar sesión para agregar favoritos')
      return
    }
    
    try {
      await addToFavoritesMutation.mutateAsync(favoriteData)
    } catch (error) {
      console.error('Error adding to favorites:', error)
    }
  }, [user?.id_usuario, addToFavoritesMutation])

  // Función para eliminar de favoritos
  const removeFromFavorites = useCallback(async (id_producto: number) => {
    if (!user?.id_usuario) {
      toast.error('Debes iniciar sesión para gestionar favoritos')
      return
    }
    try {
      await removeFromFavoritesMutation.mutateAsync(id_producto)
    } catch (error) {
      console.error('Error removing from favorites:', error)
    }
  }, [user?.id_usuario, removeFromFavoritesMutation])

  // Función para verificar si un producto está en favoritos
  const isProductFavorite = useCallback((id_producto: number): boolean => {
    if (!user?.id_usuario || !favorites || favorites.length === 0) return false
    const prodId = Number(id_producto)
    return favorites.some((favorite) => Number(favorite.id_producto) === prodId)
  }, [favorites, user?.id_usuario])

  // Función para alternar favorito (solo id_producto; tab_favoritos usa product_id)
  const toggleFavorite = useCallback(async (id_producto: number, isFavorite: boolean) => {
    if (!user?.id_usuario) {
      toast.error('Debes iniciar sesión para gestionar favoritos')
      return
    }
    if (isFavorite) {
      await removeFromFavorites(id_producto)
    } else {
      await addToFavorites({ id_producto })
    }
  }, [user?.id_usuario, addToFavorites, removeFromFavorites])

  // Función para refrescar favoritos
  const refreshFavorites = useCallback(async () => {
    if (user?.id_usuario) {
      await refetchFavorites()
    }
  }, [user?.id_usuario, refetchFavorites])

  return {
    favorites,
    isLoading,
    error,
    addToFavorites,
    removeFromFavorites,
    isProductFavorite,
    toggleFavorite,
    refreshFavorites
  }
}
