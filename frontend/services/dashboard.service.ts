import { get } from '@/utils/apiWrapper'

export interface DashboardKPIData {
  value: number
  growth: number
  trend: 'up' | 'down' | 'stable'
  formatted: string
}

export interface DashboardKPIs {
  totalOrders: DashboardKPIData
  activeOrders: DashboardKPIData
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
  async getDashboardData(timeRange: string = 'monthly'): Promise<DashboardData> {
    return get<DashboardData>(`/admin/dashboard?time_range=${timeRange}`)
  }
}

