/**
 * API Wrapper - Configuración de Axios
 * 
 * Este archivo solo se encarga de configurar axios con interceptores
 * y proporcionar métodos HTTP básicos. La lógica específica de cada
 * dominio está en los archivos de /services.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// =============================================================================
// CONFIGURACIÓN Y INSTANCE DE AXIOS
// =============================================================================

let apiInstance: AxiosInstance | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

/** Access token en memoria (SEC-001). No usar localStorage para reducir impacto de XSS. */
let inMemoryAccessToken: string | null = null;

/**
 * Crear y configurar la instancia de Axios
 */
function createApiInstance(): AxiosInstance {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  
  // Log para debugging (solo en desarrollo)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[API Wrapper] Base URL configurada:', baseURL);
    console.log('[API Wrapper] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  }
  
  const instance = axios.create({
    baseURL,
    timeout: 30000, // 30 segundos para operaciones complejas como pagos
    withCredentials: true, // Enviar cookies (refresh_token HTTPOnly) en refresh y logout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Configurar interceptores
  setupInterceptors(instance);
  
  return instance;
}

/**
 * Obtener la instancia de API (Singleton)
 */
function getApiInstance(): AxiosInstance {
  if (!apiInstance) {
    apiInstance = createApiInstance();
  }
  return apiInstance;
}

/**
 * Configurar interceptores para manejo automático de tokens y errores
 */
function setupInterceptors(instance: AxiosInstance): void {
  // Interceptor de REQUEST: Agregar token de autenticación automáticamente
  instance.interceptors.request.use(
    (config) => {
      // Endpoints que NO requieren autenticación
      const publicEndpoints = [
        '/login',
        '/refresh',
        '/forgot-password',
        '/reset-password',
        '/verify-email-otp',
        '/users/reactivate-request',
        // Endpoints del carrito (soportan usuarios anónimos)
        '/carrito-usuario',
        '/carrito-productos',
        '/carrito-productos-detalle',
        '/carrito-productos-basico',
        '/calcular-total',
        '/comentaries/testimonials',
        '/discounts/active',
        '/tasa-activa',
        '/top-info-bar/active',
      ];
      const isPublicEndpoint = publicEndpoints.some(endpoint => 
        config.url?.includes(endpoint)
      );

      // Si no es un endpoint público y ya marcamos esta instancia como no autenticada, rechazar
      if (!isPublicEndpoint && instance.defaults.headers.common['Authorization'] === '') {
        return Promise.reject(new Error('Not authenticated'));
      }
      
      // Solo agregar token si NO es un endpoint público
      if (!isPublicEndpoint) {
        const token = getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      
      // No sobrescribir Content-Type si es FormData (Axios lo maneja automáticamente)
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor de RESPONSE: Manejar respuestas y errores automáticamente
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Endpoints que NO deben intentar refresh automático
      const publicEndpoints = [
        '/login', 
        '/refresh', 
        '/forgot-password',
        '/reset-password',
        '/auth/forgot-password', 
        '/auth/reset-password',
        // Endpoints del carrito (soportan usuarios anónimos)
        '/carrito-usuario',
        '/carrito-productos',
        '/carrito-productos-detalle',
        '/carrito-productos-basico',
        '/calcular-total',
        '/comentaries/testimonials',
        '/discounts/active',
        '/tasa-activa',
      ];
      const isPublicEndpoint = publicEndpoints.some(endpoint =>
        originalRequest.url?.includes(endpoint)
      );

      // Si el token expiró (401) y no hemos intentado renovarlo ya, y NO es un endpoint público
      if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
        originalRequest._retry = true;

        try {
          // Si ya estamos refrescando, agregar este request a la cola
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(() => {
              return instance(originalRequest);
            });
          }

          isRefreshing = true;
          
          // Intentar renovar el token usando el servicio de auth
          const { refreshToken } = await import('@/services/auth.service');
          const tokens = await refreshToken();
          
          if (tokens?.access_token) {
            setAccessToken(tokens.access_token);
            originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
            instance.defaults.headers.common['Authorization'] = `Bearer ${tokens.access_token}`;
          }
          
          // Procesar la cola de requests fallidos
          failedQueue.forEach(({ resolve }) => {
            resolve();
          });
          failedQueue = [];
          
          // Reintentar la petición original con el nuevo token
          try {
            const retryResponse = await instance(originalRequest);
            return retryResponse;
          } catch (retryError) {
            console.error('Retry after token refresh failed:', retryError);
            throw retryError;
          }
          
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
          
          // Solo redirigir a login si el usuario tenía sesión (token/refresh) y expiró.
          // Si no había token (usuario anónimo), no redirigir: solo rechazar el error.
          const hadSession = !!(getStoredToken() || getStoredRefreshToken());
          
          clearTokens();
          instance.defaults.headers.common['Authorization'] = '';
          
          if (hadSession && typeof window !== 'undefined' && !originalRequest.url?.includes('/verify-token')) {
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?session=expired';
            }
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}

// =============================================================================
// FUNCIONES DE MANEJO DE TOKENS (memoria + cookie HTTPOnly, SEC-001)
// =============================================================================

/**
 * Obtener el access token desde memoria (no localStorage).
 */
export function getStoredToken(): string | null {
  return inMemoryAccessToken;
}

/**
 * Establecer solo el access token en memoria (refresh va en cookie HTTPOnly).
 */
export function setAccessToken(accessToken: string): void {
  inMemoryAccessToken = accessToken;
}

/**
 * @deprecated Refresh token está en cookie HTTPOnly; no se expone al JS.
 */
export function getStoredRefreshToken(): string | null {
  return null;
}

/**
 * Almacenar access token en memoria; refresh_token lo gestiona el backend vía cookie.
 */
export function storeTokens(accessToken: string, _refreshToken?: string): void {
  inMemoryAccessToken = accessToken;
}

/**
 * Limpiar access token de memoria. Llamar a logout del backend para borrar la cookie.
 */
export function clearTokens(): void {
  inMemoryAccessToken = null;
}

/**
 * Verificar si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

/** Clave y TTL para token en sessionStorage solo durante redirect de pago (Wompi devuelve a payment-result y se pierde la memoria). */
const PAYMENT_CALLBACK_TOKEN_KEY = "revital_payment_callback_token";
const PAYMENT_CALLBACK_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Guardar token en sessionStorage para recuperarlo tras el redirect de Wompi a payment-result.
 * Llamar al abrir el modal de pago (el redirect recarga la página y se pierde inMemoryAccessToken).
 */
export function setPaymentCallbackToken(): void {
  const token = inMemoryAccessToken;
  if (typeof window === "undefined" || !token) return;
  try {
    sessionStorage.setItem(
      PAYMENT_CALLBACK_TOKEN_KEY,
      JSON.stringify({ token, ts: Date.now() })
    );
  } catch {
    // sessionStorage no disponible
  }
}

/**
 * Obtener token para confirm-checkout/order-by-reference: primero memoria, luego sessionStorage.
 * No se borra aquí para que confirm-checkout y el polling puedan reutilizarlo; borrar con clearPaymentCallbackToken() al redirigir.
 */
export function getTokenForPaymentCallback(): string | null {
  const fromMemory = getStoredToken();
  if (fromMemory) return fromMemory;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PAYMENT_CALLBACK_TOKEN_KEY);
    if (!raw) return null;
    const { token, ts } = JSON.parse(raw) as { token?: string; ts?: number };
    if (!token || typeof token !== "string") return null;
    if (ts != null && Date.now() - ts > PAYMENT_CALLBACK_TOKEN_TTL_MS) return null;
    return token;
  } catch {
    return null;
  }
}

/** Borrar token de callback de pago (llamar al redirigir a detalle de orden para no dejar token en sessionStorage). */
export function clearPaymentCallbackToken(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PAYMENT_CALLBACK_TOKEN_KEY);
  } catch {
    // ignore
  }
}

// =============================================================================
// MÉTODOS HTTP BÁSICOS
// =============================================================================

/**
 * Función genérica para peticiones GET
 */
export async function get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  const api = getApiInstance();
  const response = await api.get<T>(endpoint, config);
  return response.data;
}

/**
 * Función genérica para peticiones POST
 */
export async function post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const api = getApiInstance();
  console.log("🔍 [API] POST request:", { endpoint, data, config });
  try {
    const response = await api.post<T>(endpoint, data, config);
    console.log("✅ [API] POST response:", response.status, response.data);
    return response.data;
  } catch (error: any) {
    const data = error?.response?.data;
    const detail = data?.detail;
    const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((e: any) => e?.msg ?? e).join(", ") : detail ?? error?.message ?? "Error en la petición";
    // Evitar ruido en consola para /refresh: fallos de refresh son casos esperados
    // (usuario sin cookie, cookie rota, usuario borrado, etc.). La app simplemente
    // tratará la sesión como no autenticada.
    if (endpoint === "/refresh") {
      console.log("ℹ️ [API] POST /refresh falló (sesión no válida o sin refresh):", msg);
    } else {
      console.error("❌ [API] POST error:", msg, data ?? error);
    }
    throw error;
  }
}

/**
 * Función genérica para peticiones PUT
 */
export async function put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const api = getApiInstance();
  console.log("🔍 [API] PUT request:", { endpoint, data, config });
  try {
    const response = await api.put<T>(endpoint, data, config);
    console.log("✅ [API] PUT response:", response.status, response.data);
    return response.data;
  } catch (error: any) {
    const data = error?.response?.data;
    const detail = data?.detail;
    const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((e: any) => e?.msg ?? e).join(", ") : detail ?? error?.message ?? "Error en la petición";
    console.error("❌ [API] PUT error:", msg, data ?? error);
    throw error;
  }
}

/**
 * Función genérica para peticiones DELETE
 */
export async function del<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  const api = getApiInstance();
  const response = await api.delete<T>(endpoint, config);
  return response.data;
}

/**
 * Función genérica para peticiones PATCH
 */
export async function patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const api = getApiInstance();
  const response = await api.patch<T>(endpoint, data, config);
  return response.data;
}

// =============================================================================
// FUNCIONES DE UTILIDAD
// =============================================================================

/**
 * Obtener configuración de la API
 */
export function getApiConfig() {
  return {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    timeout: 30000, // 30 segundos para operaciones complejas como pagos
    isAuthenticated: isAuthenticated(),
    token: getStoredToken(),
  };
}

/**
 * Validar respuesta de la API
 */
export function validateApiResponse<T>(response: any): response is T {
  return response && typeof response === 'object';
}

// =============================================================================
// EXPORT DEFAULT PARA COMPATIBILIDAD
// =============================================================================

const apiWrapper = {
  // HTTP Methods
  get,
  post,
  put,
  delete: del,
  patch,
  
  // Token Management
  getStoredToken,
  setAccessToken,
  getStoredRefreshToken,
  storeTokens,
  clearTokens,
  isAuthenticated,
  setPaymentCallbackToken,
  getTokenForPaymentCallback,
  clearPaymentCallbackToken,

  // Utilities
  getApiConfig,
  validateApiResponse,
};

/**
 * Mensaje en español para HTTP 429 (rate limit).
 * Usa `retry_after` del body si viene en número o string numérico.
 */
export function getRateLimitMessage(error: unknown): string {
  const err = error as {
    response?: { headers?: Record<string, string>; data?: { retry_after?: unknown } };
  };
  const fromBody = err?.response?.data?.retry_after;
  let seconds: number | null = null;
  if (typeof fromBody === "number" && Number.isFinite(fromBody)) {
    seconds = Math.max(0, Math.ceil(fromBody));
  } else if (typeof fromBody === "string") {
    const n = parseInt(fromBody, 10);
    if (!Number.isNaN(n)) seconds = Math.max(0, n);
  }
  if (seconds === null) {
    const ra = err?.response?.headers?.["retry-after"] ?? err?.response?.headers?.["Retry-After"];
    if (ra !== undefined) {
      const n = parseInt(String(ra), 10);
      if (!Number.isNaN(n)) seconds = Math.max(0, n);
    }
  }
  if (seconds !== null && seconds > 0) {
    if (seconds >= 60) {
      const m = Math.ceil(seconds / 60);
      return `Demasiadas solicitudes. Espera ${m} minuto${m > 1 ? "s" : ""} e inténtalo de nuevo.`;
    }
    return `Demasiadas solicitudes. Espera ${seconds} segundo${seconds > 1 ? "s" : ""} e inténtalo de nuevo.`;
  }
  return "Demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo.";
}

/**
 * Extrae un mensaje legible del detail de una respuesta de error del API.
 * Soporta detail como string (4xx/5xx) o como array (422 validación Pydantic).
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: {
      status?: number;
      data?: { detail?: string | Array<{ msg?: string }> };
    };
  };
  if (err?.response?.status === 429) {
    return getRateLimitMessage(error);
  }
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    return typeof first === "object" && first?.msg ? first.msg : String(first);
  }
  return fallback;
}

export default apiWrapper;

