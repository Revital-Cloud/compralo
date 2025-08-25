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

/**
 * Crear y configurar la instancia de Axios
 */
function createApiInstance(): AxiosInstance {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  
  const instance = axios.create({
    baseURL,
    timeout: 10000,
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
      // Si ya marcamos esta instancia como no autenticada, no hacer requests
      if (instance.defaults.headers.common['Authorization'] === '') {
        return Promise.reject(new Error('Not authenticated'));
      }
      
      // Leer el token en cada petición para asegurar que siempre esté actualizado
      const token = getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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

      // Si el token expiró (401) y no hemos intentado renovarlo ya
      if (error.response?.status === 401 && !originalRequest._retry) {
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
          
          console.log('Token refreshed successfully');
          
          // Actualizar el header del request original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
          
          // Procesar la cola de requests fallidos
          failedQueue.forEach(({ resolve }) => {
            resolve();
          });
          failedQueue = [];
          
          // Reintentar la petición original
          return instance(originalRequest);
          
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
          
          // Si falla el refresh, limpiar tokens y marcar como no autenticado
          clearTokens();
          
          // Marcar esta instancia como no autenticada para evitar más intentos
          instance.defaults.headers.common['Authorization'] = '';
          
          // Solo redirigir si estamos en el browser y no es una petición de verificación
          if (typeof window !== 'undefined' && !originalRequest.url?.includes('/verify-token')) {
            // Evitar múltiples redirecciones
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
// FUNCIONES DE MANEJO DE TOKENS (Solo Storage)
// =============================================================================

/**
 * Obtener el token almacenado en localStorage
 */
export function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

/**
 * Obtener el refresh token almacenado
 */
export function getStoredRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
}

/**
 * Almacenar tokens en localStorage
 */
export function storeTokens(accessToken: string, refreshToken: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
}

/**
 * Limpiar tokens del localStorage
 */
export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

/**
 * Verificar si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return !!getStoredToken();
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
  const response = await api.post<T>(endpoint, data, config);
  return response.data;
}

/**
 * Función genérica para peticiones PUT
 */
export async function put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const api = getApiInstance();
  const response = await api.put<T>(endpoint, data, config);
  return response.data;
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
    timeout: 10000,
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
  getStoredRefreshToken,
  storeTokens,
  clearTokens,
  isAuthenticated,
  
  // Utilities
  getApiConfig,
  validateApiResponse,
};

export default apiWrapper;

