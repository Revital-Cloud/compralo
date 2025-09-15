import { post, put, del, get } from '@/utils/apiWrapper';

// =============================================================================
// CONSTANTES
// =============================================================================

export const CART_LIMITS = {
  MAX_TOTAL: 20000000, // $20.000.000 pesos colombianos
} as const;

// =============================================================================
// INTERFACES Y TIPOS
// =============================================================================

export interface CartUser {
  id_usuario?: number;
  session_id?: number;
}

export interface CartResponse {
  id_carrito: number;
  message: string;
}

export interface CartProductCreate {
  id_categoria_producto: number;
  id_linea_producto: number;
  id_sublinea_producto: number;
  id_producto: number;
  cantidad: number;
  precio_unitario_carrito: number;
  id_usuario?: number;
  session_id?: number;
}

export interface CartProductUpdate {
  cantidad: number;
  id_usuario?: number;
  session_id?: number;
}

export interface CartTotalResponse {
  success: boolean;
  total_final: number;
  total_productos: number;
  total_descuentos: number;
  ahorro_total: number;
  resumen: {
    subtotal: number;
    descuentos: number;
    total: number;
    costo_envio?: number;
    impuestos?: number;
  };
  descuentos_automaticos?: Array<Record<string, any>>;
  descuento_canjeado?: Record<string, any>;
  total_desc_automaticos: number;
  total_desc_canjeado: number;
  es_primera_compra: boolean;
  puntos_a_ganar: number;
  id_canje_aplicado?: number;
  mensaje: string;
  mensaje_puntos: string;
  mensaje_resumen: string;
}

export interface CartProductDetail {
  id_carrito_producto: number;
  id_producto: number;
  nombre_producto: string;
  descripcion_producto?: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  imagen_url?: string;
  categoria?: string;
  marca?: string;
  linea?: string;
  sublinea?: string;
  stock_disponible?: number; // Stock disponible del producto
}

export interface MigrateCartRequest {
  id_carrito: number;
}

export interface ResponseMessage {
  message: string;
}

// =============================================================================
// FUNCIONES DEL SERVICIO
// =============================================================================

/**
 * Genera un ID de sesión único para usuarios anónimos
 */
export function generateSessionId(): number {
  return Math.floor(Math.random() * 1000000000);
}

/**
 * Obtiene o crea un carrito para un usuario (registrado o anónimo)
 */
export async function getOrCreateCart(cartUser: CartUser): Promise<CartResponse> {
  return await post<CartResponse>('/carrito-usuario', cartUser);
}

/**
 * Agrega un producto al carrito
 */
export async function addToCart(product: CartProductCreate): Promise<ResponseMessage> {
  // Si hay session_id, enviarlo como query parameter
  const params = product.session_id ? { session_id: product.session_id } : {};
  
  // Crear una copia del producto sin session_id para el body
  const { session_id, ...productBody } = product;
  
  return await post<ResponseMessage>('/carrito-productos', productBody, { params });
}

/**
 * Actualiza la cantidad de un producto en el carrito
 */
export async function updateCartItemQuantity(
  id_carrito_producto: number, 
  cantidad: number
): Promise<ResponseMessage> {
  return await put<ResponseMessage>(`/carrito-productos/${id_carrito_producto}`, { cantidad });
}

/**
 * Elimina un producto del carrito
 */
export async function removeFromCart(
  id_carrito_producto: number,
  usr_update?: number
): Promise<ResponseMessage> {
  return await del<ResponseMessage>(`/carrito-productos/${id_carrito_producto}`);
}

/**
 * Obtiene los productos del carrito con detalles completos
 */
export async function getCartProductsDetail(cartUser: CartUser): Promise<CartProductDetail[]> {
  return await post<CartProductDetail[]>('/carrito-productos-detalle', cartUser);
}

/**
 * Calcula el total del carrito
 */
export async function calculateCartTotal(cartUser: CartUser): Promise<CartTotalResponse> {
  return await post<CartTotalResponse>('/calcular-total', {
    ...cartUser,
    id_canje_aplicar: null
  });
}

/**
 * Migra un carrito anónimo a un usuario registrado
 */
export async function migrateAnonymousCart(migrateData: MigrateCartRequest): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/migrar', migrateData);
}
