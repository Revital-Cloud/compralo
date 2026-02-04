import { get, post, put } from '@/utils/apiWrapper';

export interface Comment {
  id_comentario: number;
  id_categoria: number;
  id_linea: number;
  id_sublinea: number;
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
  id_categoria: number;
  id_linea: number;
  id_sublinea: number;
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
 * Obtener comentarios de un producto específico
 */
export async function getProductComments(
  id_categoria: number,
  id_linea: number,
  id_sublinea: number,
  id_producto: number
): Promise<CommentResponse> {
  const productId = `${id_categoria}-${id_linea}-${id_sublinea}-${id_producto}`;
  return await get<CommentResponse>(`/comentaries/product/${productId}`);
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
