/**
 * Revital User (Admin) Types
 */

export type RevitalRole = 'admin_revital' | 'soporte' | 'ventas';

export interface RevitalUserBase {
  nom_usuario: string;
  ape_usuario: string;
  email_usuario: string;
  rol_revital: RevitalRole;
  ind_activo?: boolean;
}

export interface RevitalUserCreate extends RevitalUserBase {
  password_usuario: string;
}

export interface RevitalUserUpdate {
  nom_usuario?: string;
  ape_usuario?: string;
  email_usuario?: string;
  password_usuario?: string;
  rol_revital?: RevitalRole;
  ind_activo?: boolean;
}

export interface RevitalUserPublic {
  id_usuario: number | string;
  nom_usuario: string;
  ape_usuario: string;
  email_usuario: string;
  rol_revital: string;
  ind_activo: boolean;
  fecha_ultimo_acceso?: string | null;
}
