/**
 * Plan Types
 */

export type Currency =
  | 'USD'
  | 'COP'
  | 'EUR'
  | 'MXN'
  | 'BRL'
  | 'ARS'
  | 'CLP'
  | 'PEN'
  | 'UYU'
  | 'DOP'
  | 'CRC'
  | 'GTQ'
  | 'PAB'
  | 'VES'
  | 'GBP'
  | 'CAD'
  | 'OTRA';

export type EstadoPlan = 'activo' | 'inactivo' | 'deprecado';

export interface PlanBase {
  nom_plan: string;
  desc_plan?: string | null;
  precio_mensual: number | string;
  precio_anual?: number | string | null;
  moneda?: Currency;
  max_productos?: number | null;
  max_usuarios?: number | null;
  max_almacenamiento_gb?: number | null;
  features_json?: Record<string, any> | null;
  estado_plan?: EstadoPlan;
}

export interface PlanCreate extends PlanBase {}

export interface PlanUpdate {
  nom_plan?: string;
  desc_plan?: string | null;
  precio_mensual?: number | string;
  precio_anual?: number | string | null;
  moneda?: Currency;
  max_productos?: number | null;
  max_usuarios?: number | null;
  max_almacenamiento_gb?: number | null;
  features_json?: Record<string, any> | null;
  estado_plan?: EstadoPlan;
}

export interface PlanPublic {
  id_plan: number | string;
  nom_plan: string;
  desc_plan?: string | null;
  precio_mensual: number | string;
  precio_anual?: number | string | null;
  moneda: string;
  max_productos?: number | null;
  max_usuarios?: number | null;
  max_almacenamiento_gb?: number | null;
  features_json?: Record<string, any> | null;
  estado_plan: string;
}
