import { post, put, del, get } from "@/utils/apiWrapper";

/**
 * Mapa del servicio de carrito (frontend).
 *
 * Responsabilidad:
 * - Centralizar llamadas HTTP de carrito para usuarios autenticados y anónimos.
 * - Exponer tipos de request/response usados por hooks y páginas (`use-cart`, `cart`, `checkout`).
 *
 * Endpoints backend principales:
 * - `/carrito-usuario`
 * - `/carrito-productos*`
 * - `/calcular-total`
 * - `/migrar`
 */

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
  session_id?: string;
}

export interface GetCartDetail {
  id_usuario?: number;
  session_id?: string;
}

export interface CartResponse {
  id_carrito: number;
  message: string;
}

/**
 * Crear ítem en el carrito.
 * tab_carrito_productos usa variant_id; la API acepta variant_id (preferido) o id_producto
 * (en ese caso usa la primera variante activa). Sin línea/sublínea.
 */
export interface CartProductCreate {
  /** ID de variante (tab_product_variants). Preferido. */
  variant_id?: number;
  /** ID de producto (tab_products.id). Si no hay variant_id, se usa la primera variante activa. */
  id_producto: number;
  cantidad: number;
  precio_unitario_carrito: number;
  stock_disponible?: number;
  opciones_elegidas?: Record<string, string>;
  id_usuario?: number;
  session_id?: string;
}

export interface CartProductUpdate {
  cantidad: number;
  id_usuario?: number;
  session_id?: string;
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

/** Detalle de ítem en el carrito (respuesta API). tab_carrito_productos usa variant_id; sin línea/sublínea. */
export interface CartProductDetail {
  id_carrito_producto: number;
  variant_id?: number;
  id_producto: number;
  nombre_producto: string;
  descripcion_producto?: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  imagen_url?: string;
  categoria?: string;
  marca?: string;
  stock_disponible?: number;
  opciones_elegidas?: Record<string, string>;
  /** Slug del producto para enlace al detalle (si el backend lo envía). */
  product_slug?: string;
  /** category_id (tab_products) para "También te puede gustar". */
  category_id?: number;
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
  * Genera un ID de sesión único para usuarios anónimos (UUID v4 compatible).
 * Usa crypto.randomUUID si está disponible; si no, genera un UUID con getRandomValues o fallback.
 */
export function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b!.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Obtiene o crea un carrito para un usuario (registrado o anónimo)
 *
 * Endpoint:
 * - `POST /carrito-usuario`
 */
export async function getOrCreateCart(
  cartUser: CartUser
): Promise<CartResponse> {
  return await post<CartResponse>("/carrito-usuario", cartUser);
}

/**
 * Agrega un producto al carrito
 *
 * Endpoint:
 * - `POST /carrito-productos`
 *
 * Nota:
 * - `session_id` se envía como query param para conservar el contexto anónimo.
 */
export async function addToCart(
  product: CartProductCreate
): Promise<ResponseMessage> {
  // Si hay session_id, enviarlo como query parameter
  const params = product.session_id ? { session_id: product.session_id } : {};

  // Crear una copia del producto sin session_id para el body
  const { session_id, ...productBody } = product;

  return await post<ResponseMessage>("/carrito-productos", productBody, {
    params,
  });
}

/**
 * Actualiza la cantidad de un producto en el carrito
 */
export async function updateCartItemQuantity(
  id_carrito_producto: number,
  cantidad: number
): Promise<ResponseMessage> {
  return await put<ResponseMessage>(
    `/carrito-productos/${id_carrito_producto}`,
    { cantidad }
  );
}

/**
 * Elimina un producto del carrito
 */
export async function removeFromCart(
  id_carrito_producto: number,
  usr_update?: number
): Promise<ResponseMessage> {
  return await del<ResponseMessage>(
    `/carrito-productos/${id_carrito_producto}`
  );
}

/**
 * Obtiene los productos del carrito con detalles completos
 */
export async function getCartProductsDetail(
  cartUser: CartUser
): Promise<CartProductDetail[]> {
  return await post<CartProductDetail[]>(
    "/carrito-productos-detalle",
    cartUser
  );
}

/**
 * Calcula el total del carrito (opcionalmente con un canje de puntos aplicado).
 *
 * Endpoint:
 * - `POST /calcular-total`
 */
export async function calculateCartTotal(
  cartUser: CartUser,
  id_canje_aplicar?: number | null
): Promise<CartTotalResponse> {
  return await post<CartTotalResponse>("/calcular-total", {
    ...cartUser,
    id_canje_aplicar: id_canje_aplicar ?? null,
  });
}


/**
 * Migra un carrito anónimo a un usuario registrado
 */
export async function migrateAnonymousCart(
  migrateData: MigrateCartRequest
): Promise<ResponseMessage> {
  return await post<ResponseMessage>("/migrar", migrateData);
}

export interface ProductBasicInfo {
  marca?: string;
  color?: string;
}

export interface CartItemWithBasicInfo {
  id_carrito_producto: number;
  id_carrito: number;
  cantidad: number;
  precio_unitario_carrito: number;
  subtotal: number;
  nombre_producto: string;
  imagen_url?: string;
  stock_disponible: number;
  basic_info: ProductBasicInfo;
}

/**
 * Obtiene los productos del carrito con información básica (marca y color)
 */
export async function getCartProductsWithBasicInfo(
  cartUser: CartUser
): Promise<CartItemWithBasicInfo[]> {
  const cartDetail: GetCartDetail = {
    id_usuario: cartUser.id_usuario,
    session_id: cartUser.session_id
  };
  
  return await post<CartItemWithBasicInfo[]>(
    "/carrito-productos-basico",
    cartDetail
  );
}
