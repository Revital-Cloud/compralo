/**
 * Servicio de Autenticación
 * 
 * Contiene todas las funciones relacionadas con autenticación,
 * registro, cambio de contraseñas, etc.
 *
 * Mapa de consumo:
 * - Hooks: `hooks/use-auth.ts`, formularios de login/registro/OTP.
 * - Backend objetivo: endpoints de `auth_router` y parte de `user_router`.
 * - Gestión de tokens:
 *   - Access token en memoria vía `storeTokens`.
 *   - Refresh token en cookie HTTPOnly (backend).
 */

import { post, get, storeTokens, clearTokens } from '@/utils/apiWrapper';
import type {
  LoginRequest,
  TokenResponse,
  UserPublic,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirm,
  VerifyEmailOtpRequest,
  ApiResponse,
  RegisterRequest,
} from '@/types';

// =============================================================================
// FUNCIONES DE AUTENTICACIÓN
// =============================================================================

/**
 * Login del usuario
 *
 * Endpoint:
 * - `POST /login`
 *
 * Nota:
 * - El refresh token no se expone al cliente JS; se mantiene en cookie segura.
 */
export async function login(credentials: LoginRequest): Promise<TokenResponse> {
  const tokens = await post<TokenResponse>('/login', credentials);
  storeTokens(tokens.access_token);
  return { ...tokens, refresh_token: '' };
}

/**
 * Obtener datos del usuario actual (información segura)
 *
 * Endpoint:
 * - `GET /me`
 */
export async function getCurrentUser(): Promise<UserPublic> {
  return await get<UserPublic>('/me');
}

/**
 * Logout: invalida cookie en el backend y limpia token en memoria.
 */
export async function logout(): Promise<void> {
  try {
    await post<{ message: string }>('/logout', {});
  } catch {
    // Ignorar error (ej. ya expirado); limpiar estado local igual
  }
  clearTokens();
}

/**
 * Renovar el token de acceso. El refresh token se envía por cookie (HTTPOnly).
 *
 * Endpoint:
 * - `POST /refresh`
 */
export async function refreshToken(): Promise<TokenResponse> {
  const tokens = await post<TokenResponse>('/refresh', {});
  storeTokens(tokens.access_token);
  return { ...tokens, refresh_token: '' };
}

/**
 * Verificar si el token actual es válido
 *
 * Endpoint:
 * - `GET /verify-token`
 */
export async function verifyToken(): Promise<{ valid: boolean; user_id?: number; email?: string }> {
  return await get<{ valid: boolean; user_id?: number; email?: string }>('/verify-token');
}

/**
 * Cambiar contraseña
 */
export async function changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse> {
  return await post<ApiResponse>('/change-password', passwordData);
}

/**
 * Solicitar reset de contraseña
 */
export async function requestPasswordReset(resetData: ResetPasswordRequest): Promise<ApiResponse> {
  return await post<ApiResponse>('/forgot-password', resetData);
}

/**
 * Confirmar reset de contraseña
 */
export async function confirmPasswordReset(confirmData: ResetPasswordConfirm): Promise<ApiResponse> {
  return await post<ApiResponse>('/reset-password', confirmData);
}

/**
 * Verificar email con código OTP. Devuelve tokens para auto-login.
 */
export async function verifyEmailOtp(data: VerifyEmailOtpRequest): Promise<TokenResponse> {
  const tokens = await post<TokenResponse>('/verify-email-otp', data);
  storeTokens(tokens.access_token);
  return { ...tokens, refresh_token: '' };
}

/**
 * Reenviar código OTP de verificación de email.
 */
export async function resendEmailOtp(email: string): Promise<ApiResponse> {
  return await post<ApiResponse>('/resend-email-otp', { email });
}

/**
 * Registro de un nuevo usuario
 *
 * Endpoint:
 * - `POST /users`
 */
export async function register(userData: RegisterRequest): Promise<ApiResponse> {
  // El backend espera un objeto JSON directamente.
  return await post<ApiResponse>('/users', userData);
}

/**
 * Desactiva la cuenta del usuario autenticado (soft delete).
 */
export async function deactivateAccount(): Promise<ApiResponse> {
  return await post<ApiResponse>('/users/me/deactivate', {});
}

/**
 * Solicita reactivación de cuenta soft-deleted. Envía email de cambio de contraseña.
 */
export async function requestAccountReactivation(email: string): Promise<ApiResponse> {
  return await post<ApiResponse>('/users/reactivate-request', { email });
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
  verifyEmailOtp,
  verifyToken,
  deactivateAccount,
  requestAccountReactivation,
   resendEmailOtp,
};

export default authService; 