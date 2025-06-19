// =============================================================================
// TIPOS DE AUTENTICACIÓN
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TokenData {
  user_id?: number;
  email?: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UserInToken {
  id_usuario: number;
  email_usuario: string;
  nom_usuario: string;
  ape_usuario: string;
  id_rol: number;
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

// =============================================================================
// TIPOS DE REGISTRO
// =============================================================================

export interface RegisterRequest {
  nom_usuario: string;
  ape_usuario: string;
  email_usuario: string;
  password_usuario: string;
  cel_usuario: string;
  ind_genero: boolean;
  des_direccion?: string;
  fec_nacimiento?: string;
}

// =============================================================================
// TIPOS DE SESIÓN
// =============================================================================

export interface AuthSession {
  user: UserInToken;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInToken | null;
  loading: boolean;
} 