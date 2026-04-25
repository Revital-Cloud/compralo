import { get, post, put } from '@/utils/apiWrapper';

/**
 * Service de reseñas/comentarios (frontend).
 *
 * Encapsula endpoints del backend para:
 * - comentarios por producto
 * - creación de comentario
 * - testimonios (landing)
 * - productos ya reseñados en una orden (para habilitar/deshabilitar botón de reseña)
 */
export interface Comment {
  id_comentario: number;
  id_producto: number;
  id_usuario: number;
  comentario: string;
  calificacion: number;
  ind_activo: boolean;
  fec_insert: string;
  nombre_usuario?: string;
  email_usuario?: string;
}

export interface CreateCommentRequest {
  id_producto: number;
  id_orden?: number;
  comentario: string;
  calificacion: number;
}

export interface CommentResponse {
  success: boolean;
  data?: Comment[];
  total?: number;
  message?: string;
}

/**
 * Obtener comentarios de un producto (acepta product_id numérico o slug)
 */
export async function getProductComments(productIdOrSlug: string): Promise<CommentResponse> {
  return await get<CommentResponse>(`/comentaries/product/${encodeURIComponent(productIdOrSlug)}`);
}

/**
 * Crear un nuevo comentario
 */
export async function createComment(commentData: CreateCommentRequest): Promise<{ message: string }> {
  return await post<{ message: string }>('/comentaries', commentData);
}


export interface TestimonialFromApi {
  id_comentario: number;
  comentario: string;
  calificacion: number;
  nombre_usuario: string;
  nom_usuario?: string;
  ape_usuario?: string;
  producto_nombre?: string | null;
  producto_imagen?: unknown;
  producto_slug?: string | null;
}

/**
 * Obtener reseñas de 5 estrellas para la sección de testimonios del landing.
 */
export async function getTestimonials(
  limit: number = 3
): Promise<{ success: boolean; data: TestimonialFromApi[] }> {
  return await get<{ success: boolean; data: TestimonialFromApi[] }>(
    `/comentaries/testimonials?limit=${limit}`
  );
}

/**
 * Obtener productos ya reseñados en una orden específica
 */
export async function getReviewedProductsInOrder(
  id_orden: number
): Promise<{ success: boolean; data: string[] }> {
  return await get<{ success: boolean; data: string[] }>(
    `/comentaries/order/${id_orden}/reviewed-products`
  );
}
