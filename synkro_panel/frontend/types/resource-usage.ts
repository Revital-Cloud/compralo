/**
 * Resource Usage Types
 */

export interface ResourceUsageBase {
  id_instancia: number | string;
  id_suscripcion: number | string;
  productos_actuales: number;
  usuarios_actuales: number;
  almacenamiento_actual_gb: number | string;
  max_productos?: number | null;
  max_usuarios?: number | null;
  max_almacenamiento_gb?: number | null;
}

export interface ResourceUsageCreate extends ResourceUsageBase {}

export interface ResourceUsagePublic {
  id_uso_recurso: number | string;
  id_instancia: number | string;
  id_suscripcion: number | string;
  fecha_medicion: string;
  productos_actuales: number;
  usuarios_actuales: number;
  almacenamiento_actual_gb: number | string;
  max_productos?: number | null;
  max_usuarios?: number | null;
  max_almacenamiento_gb?: number | null;
  porcentaje_uso_productos?: number | string | null;
  porcentaje_uso_usuarios?: number | string | null;
  porcentaje_uso_almacenamiento?: number | string | null;
  ind_alerta_productos: boolean;
  ind_alerta_usuarios: boolean;
  ind_alerta_almacenamiento: boolean;
}
