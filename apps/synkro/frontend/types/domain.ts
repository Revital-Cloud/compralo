/**
 * Domain Types
 */

export type DomainType = 'subdominio' | 'personalizado' | 'wildcard';

export type DomainStatus = 'pendiente' | 'activo' | 'error' | 'desactivado';

export interface DomainBase {
  id_instancia: number | string;
  nom_dominio: string;
  tipo_dominio?: DomainType;
  ssl_habilitado?: boolean;
}

export interface DomainCreate extends DomainBase {
  estado_dominio?: DomainStatus;
}

export interface DomainUpdate {
  nom_dominio?: string;
  tipo_dominio?: DomainType;
  estado_dominio?: DomainStatus;
  ssl_habilitado?: boolean;
  fecha_ssl_emision?: string | null;
  fecha_ssl_vencimiento?: string | null;
}

export interface DomainPublic {
  id_dominio: number | string;
  id_instancia: number | string;
  nom_dominio: string;
  tipo_dominio: string;
  estado_dominio: string;
  ssl_habilitado: boolean;
  fecha_ssl_emision?: string | null;
  fecha_ssl_vencimiento?: string | null;
}
