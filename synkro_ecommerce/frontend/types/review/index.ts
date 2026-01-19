// =============================================================================
// TIPOS DE RESEÑAS/COMENTARIOS
// =============================================================================

export interface Review {
  id_comentario: number;
  id_categoria: number;
  id_linea: number;
  id_sublinea: number;
  id_producto: number;
  id_usuario: number;
  comentario: string;
  ind_activo: boolean;
  fec_insert: string;
  // Campos adicionales que se pueden obtener con JOINs
  nombre_usuario?: string;
  email_usuario?: string;
  avatar_usuario?: string;
}

export interface ReviewWithUser extends Review {
  nombre_usuario: string;
  email_usuario: string;
  avatar_usuario?: string;
}

export interface CreateReviewRequest {
  id_categoria: number;
  id_linea: number;
  id_sublinea: number;
  id_producto: number;
  comentario: string;
}

export interface ReviewResponse {
  success: boolean;
  message: string;
  data?: Review;
}

export interface ReviewsListResponse {
  success: boolean;
  data: ReviewWithUser[];
  total: number;
}
