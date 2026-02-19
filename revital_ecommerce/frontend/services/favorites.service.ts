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
   * Elimina un producto de favoritos (tab_favoritos: id_usuario, product_id)
   */
  async removeFromFavorites(userId: number, id_producto: number): Promise<FavoritesResponse> {
    try {
      return await apiWrapper.delete<FavoritesResponse>(
        `${this.baseUrl}/${userId}-${id_producto}`
      )
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }

  /**
   * Verifica si un producto está en favoritos
   */
  async isProductFavorite(userId: number, id_producto: number): Promise<boolean> {
    try {
      const favorites = await this.getFavorites(userId)
      return favorites.some((favorite) => Number(favorite.id_producto) === Number(id_producto))
    } catch (error) {
      console.error('Error checking if product is favorite:', error)
      return false
    }
  }
}

export const favoritesService = new FavoritesService()
