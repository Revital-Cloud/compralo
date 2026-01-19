/**
 * Synkro User (Admin) Types
 */

export type SynkroRole = 'admin_synkro' | 'soporte' | 'ventas';

export interface SynkroUserBase {
  nom_usuario: string;
  ape_usuario: string;
  email_usuario: string;
  rol_synkro: SynkroRole;
  ind_activo?: boolean;
}

export interface SynkroUserCreate extends SynkroUserBase {
  password_usuario: string;
}

export interface SynkroUserUpdate {
  nom_usuario?: string;
  ape_usuario?: string;
  email_usuario?: string;
  password_usuario?: string;
  rol_synkro?: SynkroRole;
  ind_activo?: boolean;
}

export interface SynkroUserPublic {
  id_usuario: number | string;
  nom_usuario: string;
  ape_usuario: string;
  email_usuario: string;
  rol_synkro: string;
  ind_activo: boolean;
  fecha_ultimo_acceso?: string | null;
}
