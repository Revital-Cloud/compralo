/**
 * Servicio de Autenticación
 * 
 * Contiene todas las funciones relacionadas con autenticación,
 * registro, cambio de contraseñas, etc.
 */

import { post, storeTokens, clearTokens } from '@/utils/apiWrapper';
import type {
  LoginRequest,
  TokenResponse,
  User,
  RegisterRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirm,
  ApiResponse,
  RefreshTokenRequest,
} from '@/types';
import { getStoredRefreshToken } from '@/utils/apiWrapper';

// =============================================================================
// FUNCIONES DE AUTENTICACIÓN
// =============================================================================

/**
 * Login del usuario
 */
export async function login(credentials: LoginRequest): Promise<TokenResponse> {
  const tokens = await post<TokenResponse>('/auth/login', credentials);
  
  // Almacenar tokens automáticamente
  storeTokens(tokens.access_token, tokens.refresh_token);
  
  return tokens;
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

  const tokens = await post<TokenResponse>('/auth/refresh', {
    refresh_token: refreshTokenValue
  } as RefreshTokenRequest);
  
  storeTokens(tokens.access_token, tokens.refresh_token);
  
  return tokens;
}

/**
 * Registrar nuevo usuario
 */
export async function register(userData: RegisterRequest): Promise<User> {
  return await post<User>('/auth/register', userData);
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
  return await post<ApiResponse>('/auth/reset-password', resetData);
}

/**
 * Confirmar reset de contraseña
 */
export async function confirmPasswordReset(confirmData: ResetPasswordConfirm): Promise<ApiResponse> {
  return await post<ApiResponse>('/auth/reset-password/confirm', confirmData);
}

/**
 * Verificar email
 */
export async function verifyEmail(token: string): Promise<ApiResponse> {
  return await post<ApiResponse>('/auth/verify-email', { token });
}

/**
 * Reenviar email de verificación
 */
export async function resendVerificationEmail(email: string): Promise<ApiResponse> {
  return await post<ApiResponse>('/auth/resend-verification', { email });
}

// =============================================================================
// EXPORT COMO OBJETO PARA COMPATIBILIDAD
// =============================================================================

const authService = {
  login,
  logout,
  refreshToken,
  register,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,
  resendVerificationEmail,
};

export default authService; 