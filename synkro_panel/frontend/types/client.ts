/**
 * Client Types
 */

import type { IdentificationType } from './common';

export type Pais =
  | 'CO'
  | 'US'
  | 'MX'
  | 'AR'
  | 'CL'
  | 'PE'
  | 'EC'
  | 'PA'
  | 'UY'
  | 'BR'
  | 'ES'
  | 'OTRO';

export type ClientStatus = 'prospecto' | 'activo' | 'suspendido' | 'cancelado' | 'trial';

export interface ClientBase {
  identificacion_fiscal: string;
  tipo_identificacion?: IdentificationType;
  nom_empresa: string;
  email_contacto: string;
  telefono_contacto?: string | null;
  direccion_empresa?: string | null;
  ciudad?: string | null;
  pais?: Pais;
  nom_contacto_principal: string;
  email_contacto_principal: string;
  telefono_contacto_principal?: string | null;
  estado_cliente?: ClientStatus;
  notas_internas?: string | null;
}

export interface ClientCreate extends ClientBase {
  password_cliente?: string | null;
  ind_activo?: boolean;
}

export interface ClientUpdate {
  tipo_identificacion?: IdentificationType;
  nom_empresa?: string;
  email_contacto?: string;
  telefono_contacto?: string | null;
  direccion_empresa?: string | null;
  ciudad?: string | null;
  pais?: Pais;
  nom_contacto_principal?: string;
  email_contacto_principal?: string;
  telefono_contacto_principal?: string | null;
  estado_cliente?: ClientStatus;
  notas_internas?: string | null;
  password_cliente?: string;
  ind_activo?: boolean;
}

export interface ClientPublic {
  identificacion_fiscal: string;
  tipo_identificacion: string;
  nom_empresa: string;
  email_contacto: string;
  telefono_contacto?: string | null;
  direccion_empresa?: string | null;
  ciudad?: string | null;
  pais: string;
  nom_contacto_principal: string;
  email_contacto_principal: string;
  telefono_contacto_principal?: string | null;
  estado_cliente: string;
  ind_activo: boolean;
  fecha_activacion?: string | null;
  fecha_ultimo_acceso?: string | null;
}
