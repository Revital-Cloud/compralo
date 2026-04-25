// =============================================================================
// TIPOS DE AUTENTICACIÓN
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  /** Token de Cloudflare Turnstile (se valida server-side en backend) */
  turnstile_token?: string;
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

// =============================================================================
// TIPOS DE USUARIO PÚBLICO (SEGURO)
// =============================================================================

export interface UserPublic {
  id_usuario: number;
  nom_usuario: string;
  ape_usuario: string;
  email_usuario: string;
  id_rol?: number;
  cel_usuario?: string;
  des_direccion?: string;
  fec_nacimiento?: string;
  ind_genero?: boolean;
  avatar_seed?: string | null; // Seed personalizado para Facehash (opcional)
  avatar_colors?: string | null; // Colores hex separados por coma para Facehash (opcional)
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

export interface VerifyEmailOtpRequest {
  email: string;
  code: string;
}

// =============================================================================
// TIPOS DE REGISTRO
// =============================================================================

export interface RegisterRequest {
  id_usuario: number;
  nom_usuario: string;
  ape_usuario: string;
  email_usuario: string;
  password_usuario: string;
  id_rol: number;
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