/**
 * Servicio de Autenticación
 * 
 * Contiene todas las funciones relacionadas con autenticación,
 * cambio de contraseñas, etc.
 */

import { post, get, storeTokens, clearTokens } from '@/utils/apiWrapper';
import type {
  LoginRequest,
  TokenResponse,
  UserInToken,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirm,
  ResponseMessage,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
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
 * Register a new user (public registration)
 * Creates a new client account with 'trial' status and auto-login
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const tokens = await post<RegisterResponse>('/auth/register', data);
  
  // Store tokens for auto-login
  storeTokens(tokens.access_token, tokens.refresh_token);
  
  return tokens;
}

/**
 * Obtener datos del usuario actual (información segura)
 */
export async function getCurrentUser(): Promise<UserInToken> {
  return await get<UserInToken>('/auth/me');
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
 * Verificar si el token actual es válido
 */
export async function verifyToken(): Promise<ResponseMessage> {
  return await get<ResponseMessage>('/auth/verify-token');
}

/**
 * Cambiar contraseña
 */
export async function changePassword(passwordData: ChangePasswordRequest): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/auth/change-password', passwordData);
}

/**
 * Solicitar reset de contraseña
 */
export async function requestPasswordReset(resetData: ResetPasswordRequest): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/auth/forgot-password', resetData);
}

/**
 * Confirmar reset de contraseña
 */
export async function confirmPasswordReset(confirmData: ResetPasswordConfirm): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/auth/reset-password', confirmData);
}

/**
 * Cerrar sesión invalidando el refresh token
 */
export async function logoutWithToken(refreshTokenValue: string): Promise<ResponseMessage> {
  return await post<ResponseMessage>('/auth/logout', {
    refresh_token: refreshTokenValue
  } as RefreshTokenRequest);
}

// =============================================================================
// EXPORT COMO OBJETO PARA COMPATIBILIDAD
// =============================================================================

const authService = {
  login,
  register,
  logout,
  refreshToken,
  getCurrentUser,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  verifyToken,
  logoutWithToken,
};

export default authService;
