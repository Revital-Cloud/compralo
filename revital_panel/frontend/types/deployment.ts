/**
 * Tipos de Deployments
 */

export type TipoDeploy = 'manual' | 'automatico' | 'rollback' | 'hotfix';

export type Ambiente = 'desarrollo' | 'staging' | 'produccion';

export type EstadoDeploy = 'iniciado' | 'en_proceso' | 'completado' | 'fallido' | 'cancelado';

export interface DeploymentBase {
  id_instancia: number | string;
  version_deploy: string;
  tipo_deploy?: TipoDeploy;
  ambiente?: Ambiente;
  iniciado_por?: string | null;
}

export interface DeploymentCreate extends DeploymentBase {
  estado_deploy?: EstadoDeploy;
}

export interface DeploymentUpdate {
  estado_deploy?: EstadoDeploy;
  logs_deploy?: string | null;
  fecha_fin?: string | null;
  duracion_segundos?: number | null;
}

export interface DeploymentPublic {
  id_deployment: number | string;
  id_instancia: number | string;
  version_deploy: string;
  tipo_deploy: string;
  estado_deploy: string;
  ambiente: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  duracion_segundos?: number | null;
  iniciado_por?: string | null;
}
