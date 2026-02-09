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
  user_type: 'admin_revital' | 'cliente';
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UserInToken {
  user_type: 'admin_revital' | 'cliente';
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

/**
 * Registration types
 */
import type { IdentificationType } from './common';
export type CountryCode = 'CO' | 'US' | 'MX' | 'AR' | 'CL' | 'PE' | 'EC' | 'PA' | 'UY' | 'BR' | 'ES' | 'OTRO';

export interface RegisterRequest {
  // Company info
  nom_empresa: string;
  identificacion_fiscal: string;
  tipo_identificacion?: IdentificationType;
  pais?: CountryCode;
  ciudad?: string;
  
  // Contact info
  nom_contacto_principal: string;
  email_contacto_principal: string;
  telefono_contacto?: string;
  
  // Account credentials
  password: string;
}

// RegisterResponse is the same as TokenResponse (auto-login after registration)
export type RegisterResponse = TokenResponse;
