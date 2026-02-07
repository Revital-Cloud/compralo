export interface AdminOverviewMetrics {
  total_clientes: number;
  total_instancias: number;
  instancias_por_estado: Record<string, number>;
  instancias_por_region: Record<string, number>;
  mrr_actual: number;
  ingresos_ultimos_30_dias: number;
  ingresos_por_plan: Record<string, number>;
  funnel_ultimos_6_meses: ClientsTimeseriesPoint[];
}

export interface RevenuePoint {
  fecha: string; // ISO date
  total: number;
}

export interface ClientsTimeseriesPoint {
  periodo: string; // ISO date (primer día del mes)
  registros: number;
  trials: number;
  activos: number;
}

export interface InstancesByPlanItem {
  id_plan: number;
  nom_plan: string;
  total_instancias: number;
  activas: number;
  suspendidas: number;
  eliminadas: number;
  error: number;
}

