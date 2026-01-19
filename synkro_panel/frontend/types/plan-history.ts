/**
 * Plan History Types
 */

export type ChangeType = 'upgrade' | 'downgrade' | 'inicial' | 'renovacion';

export interface PlanHistoryBase {
  id_suscripcion: number | string;
  id_plan_anterior?: number | string | null;
  id_plan_nuevo: number | string;
  precio_anterior?: number | string | null;
  precio_nuevo: number | string;
  tipo_cambio: ChangeType;
  fecha_efectiva: string;
  motivo_cambio?: string | null;
  usuario_email?: string | null;
}

export interface PlanHistoryCreate extends PlanHistoryBase {}

export interface PlanHistoryPublic {
  id_historial: number | string;
  id_suscripcion: number | string;
  id_plan_anterior?: number | string | null;
  id_plan_nuevo: number | string;
  precio_anterior?: number | string | null;
  precio_nuevo: number | string;
  tipo_cambio: string;
  fecha_cambio: string;
  fecha_efectiva: string;
  diferencia_precio: number | string;
  porcentaje_cambio?: number | string | null;
  motivo_cambio?: string | null;
  usuario_email?: string | null;
}
