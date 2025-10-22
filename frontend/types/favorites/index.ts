export interface FavoriteProduct {
  id_usuario: number
  id_categoria_producto: number
  id_linea_producto: number
  id_sublinea_producto: number
  id_producto: number
  nom_producto: string
  img_producto: string | Record<string, any> | null | undefined  // Puede ser string, JSON object, null o undefined
  val_precio: number
  fec_insert: string
}

export interface CreateFavoriteRequest {
  id_categoria_producto: number
  id_linea_producto: number
  id_sublinea_producto: number
  id_producto: number
}

export interface FavoritesResponse {
  message: string
}

export interface FavoritesState {
  favorites: FavoriteProduct[]
  isLoading: boolean
  error: string | null
}

export interface UseFavoritesReturn extends FavoritesState {
  addToFavorites: (favoriteData: CreateFavoriteRequest) => Promise<void>
  removeFromFavorites: (
    id_categoria_producto: number,
    id_linea_producto: number,
    id_sublinea_producto: number,
    id_producto: number
  ) => Promise<void>
  isProductFavorite: (
    id_categoria_producto: number,
    id_linea_producto: number,
    id_sublinea_producto: number,
    id_producto: number
  ) => boolean
  toggleFavorite: (
    id_categoria_producto: number,
    id_linea_producto: number,
    id_sublinea_producto: number,
    id_producto: number,
    isFavorite: boolean
  ) => Promise<void>
  refreshFavorites: () => Promise<void>
}
