import { get } from '@/utils/apiWrapper'

/**
 * Mapa del servicio de dashboard (frontend).
 *
 * Responsabilidad:
 * - Tipar la respuesta del endpoint admin de dashboard.
 * - Exponer una única función de consumo para páginas/hooks.
 */

export interface DashboardKPIData {
  value: number
  growth: number
  trend: 'up' | 'down' | 'stable'
  formatted: string
}

export interface DashboardKPIs {
  totalOrders: DashboardKPIData
  /** Suma de unidades vendidas en pedidos completados del período. */
  unitsSold: DashboardKPIData
  shippedOrders: DashboardKPIData
  totalRevenue: DashboardKPIData
}

export interface SalesDataPoint {
  period: string
  sales: number
  orders: number
}

export interface BestSeller {
  id: string
  id_categoria?: string
  id_linea?: string
  id_sublinea?: string
  id_producto?: string
  name: string
  image?: string
  sales: number
  revenue: number
}

export interface RecentOrder {
  id: string
  customer: string
  date: string
  amount: number
  status: 'delivered' | 'pending' | 'processing' | 'shipped' | 'canceled'
  items: number
}

export interface DashboardSummary {
  totalSales: number
  totalOrders: number
  conversionRate: string
}

export interface DashboardData {
  kpis: DashboardKPIs
  salesData: SalesDataPoint[]
  bestSellers: BestSeller[]
  recentOrders: RecentOrder[]
  summary: DashboardSummary
  timeRange: string
}

export const dashboardService = {
  /**
   * Solicita datos del dashboard para un rango de tiempo.
   *
   * Endpoint backend:
   * - GET `/admin/dashboard?time_range=daily|weekly|monthly`
   *
   * `timeRange` controla la ventana temporal y granularidad de agregación
   * que aplica el backend para KPIs y series.
   */
  async getDashboardData(timeRange: string = 'monthly'): Promise<DashboardData> {
    return get<DashboardData>(`/admin/dashboard?time_range=${timeRange}`)
  }
}

