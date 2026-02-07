import apiWrapper from '@/utils/apiWrapper'
import { FavoriteProduct, CreateFavoriteRequest, FavoritesResponse } from '@/types/favorites'

class FavoritesService {
  private baseUrl = '/favorites'

  /**
   * Obtiene todos los favoritos del usuario actual
   */
  async getFavorites(userId: number): Promise<FavoriteProduct[]> {
    try {
      return await apiWrapper.get<FavoriteProduct[]>(`${this.baseUrl}/${userId}`)
    } catch (error) {
      console.error('Error fetching favorites:', error)
      throw error
    }
  }

  /**
   * Agrega un producto a favoritos
   */
  async addToFavorites(favoriteData: CreateFavoriteRequest): Promise<FavoritesResponse> {
    try {
      console.log('📤 Enviando a backend - Datos del favorito:', favoriteData)
      return await apiWrapper.post<FavoritesResponse>(this.baseUrl, favoriteData)
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }

  /**
   * Elimina un producto de favoritos
   */
  async removeFromFavorites(
    userId: number,
    id_categoria_producto: number,
    id_linea_producto: number,
    id_sublinea_producto: number,
    id_producto: number
  ): Promise<FavoritesResponse> {
    try {
      return await apiWrapper.delete<FavoritesResponse>(
        `${this.baseUrl}/${userId}-${id_categoria_producto}-${id_linea_producto}-${id_sublinea_producto}-${id_producto}`
      )
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }

  /**
   * Verifica si un producto está en favoritos
   */
  async isProductFavorite(
    userId: number,
    id_categoria_producto: number,
    id_linea_producto: number,
    id_sublinea_producto: number,
    id_producto: number
  ): Promise<boolean> {
    try {
      const favorites = await this.getFavorites(userId)
      return favorites.some(
        (favorite) =>
          favorite.id_categoria_producto === id_categoria_producto &&
          favorite.id_linea_producto === id_linea_producto &&
          favorite.id_sublinea_producto === id_sublinea_producto &&
          favorite.id_producto === id_producto
      )
    } catch (error) {
      console.error('Error checking if product is favorite:', error)
      return false
    }
  }
}

export const favoritesService = new FavoritesService()
