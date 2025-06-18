// =============================================================================
// TIPOS DE USUARIO
// =============================================================================

export interface UserBase {
  id_usuario: number;
  nom_usuario: string;
  ape_usuario: string;
  email_usuario: string;
  password_usuario: string;
  des_direccion?: string;
  id_rol: number;
  ind_genero: boolean;
  cel_usuario: string;
  fec_nacimiento?: string;
}

export interface UserCreate extends Omit<UserBase, 'id_usuario'> {
  id_usuario?: number; // Opcional en create
}

export interface UserUpdate {
  nom_usuario?: string;
  ape_usuario?: string;
  email_usuario?: string;
  password_usuario?: string;
  des_direccion?: string;
  id_rol?: number;
  ind_genero?: boolean;
  cel_usuario?: string;
  fec_nacimiento?: string;
}

export interface User extends UserBase {
  id_usuario: number;
  fec_insert?: string;
  usr_insert?: string;
  fec_update?: string;
  usr_update?: string;
}

// =============================================================================
// TIPOS DE PERFIL
// =============================================================================

export interface UserProfile {
  id_usuario: number;
  nom_usuario: string;
  ape_usuario: string;
  email_usuario: string;
  des_direccion?: string;
  cel_usuario: string;
  ind_genero: boolean;
  fec_nacimiento?: string;
  avatar?: string;
}

export interface UpdateProfileRequest {
  nom_usuario?: string;
  ape_usuario?: string;
  des_direccion?: string;
  cel_usuario?: string;
  fec_nacimiento?: string;
  avatar?: string;
}

// =============================================================================
// TIPOS DE ROLES
// =============================================================================

export interface UserRole {
  id_rol: number;
  nom_rol: string;
  descripcion?: string;
  permisos: string[];
}

export enum UserRoleEnum {
  ADMIN = 1,
  USER = 2,
  MODERATOR = 3,
}

// =============================================================================
// TIPOS DE FILTROS DE USUARIO
// =============================================================================

export interface UserFilters {
  search?: string;
  rol?: number;
  genero?: boolean;
  page?: number;
  limit?: number;
  sort?: 'nom_usuario' | 'email_usuario' | 'fec_insert';
  order?: 'asc' | 'desc';
} 