/**
 * Tipos de autenticación
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_type: 'admin_synkro' | 'cliente';
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UserInToken {
  user_type: 'admin_synkro' | 'cliente';
  id: string | number;
  email: string;
  nombre: string;
  rol?: string | null;
  identificacion_fiscal?: string | null;
  ind_activo: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirm {
  token: string;
  new_password: string;
}
