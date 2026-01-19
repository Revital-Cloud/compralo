/**
 * Instance Types
 */

export type RegionDeployment =
  | 'us-east-1'
  | 'us-west-2'
  | 'sa-east-1'
  | 'eu-west-1'
  | 'eu-central-1'
  | 'ap-southeast-1'
  | 'ap-northeast-1'
  | 'custom';

export type InstanceStatus = 'creando' | 'activa' | 'suspendida' | 'eliminada' | 'error';

export interface InstanceBase {
  identificacion_fiscal_cliente: string;
  nom_instancia: string;
  slug_instancia: string;
  subdominio?: string | null;
  dominio_personalizado?: string | null;
  version_instancia?: string;
  db_nombre: string;
  db_host?: string | null;
  db_puerto?: number;
  db_usuario?: string | null;
  backend_url?: string | null;
  frontend_url?: string | null;
  region_deployment?: RegionDeployment;
  config_json?: Record<string, any> | null;
}

export interface InstanceCreate extends InstanceBase {
  estado_instancia?: InstanceStatus;
}

export interface InstanceUpdate {
  nom_instancia?: string;
  subdominio?: string | null;
  dominio_personalizado?: string | null;
  estado_instancia?: InstanceStatus;
  version_instancia?: string;
  db_host?: string | null;
  db_puerto?: number;
  db_usuario?: string | null;
  backend_url?: string | null;
  frontend_url?: string | null;
  region_deployment?: RegionDeployment;
  config_json?: Record<string, any> | null;
}

export interface InstancePublic {
  id_instancia: number | string;
  identificacion_fiscal_cliente: string;
  nom_instancia: string;
  slug_instancia: string;
  subdominio?: string | null;
  dominio_personalizado?: string | null;
  version_instancia?: string;
  estado_instancia: string;
  fecha_activacion?: string | null;
  fecha_ultimo_deploy?: string | null;
  backend_url?: string | null;
  frontend_url?: string | null;
  region_deployment?: string;
}
