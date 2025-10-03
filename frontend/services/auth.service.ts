/**
 * Servicio de Autenticación
 * 
 * Contiene todas las funciones relacionadas con autenticación,
 * registro, cambio de contraseñas, etc.
 */

import { post, get, storeTokens, clearTokens } from '@/utils/apiWrapper';
import type {
  LoginRequest,
  TokenResponse,
  UserPublic,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirm,
  ApiResponse,
  RefreshTokenRequest,
  RegisterRequest,
} from '@/types';
import { getStoredRefreshToken } from '@/utils/apiWrapper';

// =============================================================================
// FUNCIONES DE AUTENTICACIÓN
// =============================================================================

/**
 * Login del usuario
 */
export async function login(credentials: LoginRequest): Promise<TokenResponse> {
  const tokens = await post<TokenResponse>('/login', credentials);
  
  // Almacenar tokens automáticamente
  storeTokens(tokens.access_token, tokens.refresh_token);
  
  return tokens;
}

/**
 * Obtener datos del usuario actual (información segura)
 */
export async function getCurrentUser(): Promise<UserPublic> {
  return await get<UserPublic>('/me');
}

/**
 * Logout del usuario
 */
export function logout(): void {
  clearTokens();
}

/**
 * Renovar el token de acceso
 */
export async function refreshToken(): Promise<TokenResponse> {
  const refreshTokenValue = getStoredRefreshToken();
  if (!refreshTokenValue) {
    throw new Error('No refresh token available');
  }

  const tokens = await post<TokenResponse>('/refresh', {
    refresh_token: refreshTokenValue
  } as RefreshTokenRequest);
  
  storeTokens(tokens.access_token, tokens.refresh_token);
  
  return tokens;
}

/**
 * Verificar si el token actual es válido
 */
export async function verifyToken(): Promise<{ valid: boolean; user_id?: number; email?: string }> {
  return await get<{ valid: boolean; user_id?: number; email?: string }>('/verify-token');
}

/**
 * Cambiar contraseña
 */
export async function changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse> {
  return await post<ApiResponse>('/auth/change-password', passwordData);
}

/**
 * Solicitar reset de contraseña
 */
export async function requestPasswordReset(resetData: ResetPasswordRequest): Promise<ApiResponse> {
  return await post<ApiResponse>('/auth/forgot-password', resetData);
}

/**
 * Confirmar reset de contraseña
 */
export async function confirmPasswordReset(confirmData: ResetPasswordConfirm): Promise<ApiResponse> {
  return await post<ApiResponse>('/auth/reset-password', confirmData);
}

/**
 * Registro de un nuevo usuario
 */
export async function register(userData: RegisterRequest): Promise<ApiResponse> {
  // El backend espera un objeto JSON directamente.
  return await post<ApiResponse>('/users', userData);
}

// =============================================================================
// EXPORT COMO OBJETO PARA COMPATIBILIDAD
// =============================================================================

const authService = {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  verifyToken,
};

export default authService; 