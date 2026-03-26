'use client'

import { useState, useEffect, useCallback } from 'react'
import { dashboardService } from '@/services/dashboard.service'
import type { KPIData } from '@/components/dashboard/kpi-card'
import type { SalesDataPoint } from '@/components/dashboard/sales-chart'
import type { BestSeller } from '@/components/dashboard/best-sellers'
import type { RecentOrder } from '@/components/dashboard/recent-orders'
import type { DashboardData as DashboardDataResponse } from '@/services/dashboard.service'

/**
 * Mapa del hook `useDashboardData`.
 *
 * Objetivo:
 * - Orquestar carga de datos del dashboard admin.
 * - Adaptar la forma del payload backend al shape que esperan componentes UI.
 * - Soportar refresco manual y auto-refresh configurable.
 */

interface DashboardData {
  kpis: Record<string, KPIData>
  salesData: SalesDataPoint[]
  bestSellers: BestSeller[]
  recentOrders: RecentOrder[]
  timeRange: string
  summary: {
    totalSales: number
    totalOrders: number
    conversionRate: string
  }
}

/** Intervalo en ms. 0 = sin auto-actualización. */
export const DASHBOARD_REFRESH_INTERVALS = {
  off: 0,
  '30s': 30_000,
  '1m': 60_000,
  '2m': 120_000,
  '5m': 300_000,
} as const

export type DashboardRefreshIntervalKey = keyof typeof DASHBOARD_REFRESH_INTERVALS

/**
 * Hook de estado+datos para el dashboard administrativo.
 *
 * Flujo:
 * 1) Consulta backend con `dashboardService`.
 * 2) Adapta campos a contratos de componentes visuales.
 * 3) Mantiene estados de loading/lastUpdate.
 * 4) Configura auto-refresh cuando el intervalo es mayor a 0.
 */
export const useDashboardData = (
  timeRange: string,
  refreshIntervalMs: number = 30_000
) => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    try {
      const response = await dashboardService.getDashboardData(timeRange)
      
      // Adaptar los datos del backend al formato esperado por los componentes.
      // Esta capa desacopla el contrato visual del contrato HTTP.
      const adaptedData: DashboardData = {
        kpis: {
          totalOrders: response.kpis.totalOrders,
          unitsSold: response.kpis.unitsSold,
          shippedOrders: response.kpis.shippedOrders,
          totalRevenue: response.kpis.totalRevenue
        },
        // El chart usa clave `month`; backend entrega `period`.
        salesData: response.salesData.map(item => ({
          month: item.period,
          sales: item.sales,
          orders: item.orders,
          revenue: item.sales // Usar sales como revenue
        })),
        // Normaliza best sellers al modelo de tarjetas del dashboard.
        bestSellers: response.bestSellers.map(item => ({
          id: item.id,
          name: item.name,
          image: item.image,
          price: item.revenue / (item.sales || 1), // Calcular precio promedio
          sales: item.sales.toString(),
          growth: 0, // Placeholder hasta que backend exponga crecimiento por producto.
          category: '' // Placeholder: actualmente este campo no llega en respuesta.
        })),
        // Convierte órdenes recientes al formato de tabla/listado.
        recentOrders: response.recentOrders.map(order => ({
          id: order.id,
          product: `${order.items} item${order.items !== 1 ? 's' : ''}`,
          date: new Date(order.date).toLocaleDateString('es-CO'),
          customer: order.customer,
          status: order.status,
          amount: order.amount
        })),
        timeRange: response.timeRange,
        summary: response.summary
      }
      
      setData(adaptedData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error)
      // Fallback estable para que la UI renderice sin romperse ante errores.
      const emptyData: DashboardData = {
        kpis: {
          totalOrders: { value: 0, growth: 0, trend: 'up', formatted: '0' },
          unitsSold: { value: 0, growth: 0, trend: 'up', formatted: '0' },
          shippedOrders: { value: 0, growth: 0, trend: 'up', formatted: '0' },
          totalRevenue: { value: 0, growth: 0, trend: 'up', formatted: '$0' }
        },
        salesData: [],
        bestSellers: [],
        recentOrders: [],
        timeRange,
        summary: {
          totalSales: 0,
          totalOrders: 0,
          conversionRate: '0.0'
        }
      }
      setData(emptyData)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh según el intervalo elegido (0 = desactivado)
  useEffect(() => {
    if (refreshIntervalMs <= 0) return
    const interval = setInterval(fetchData, refreshIntervalMs)
    return () => clearInterval(interval)
  }, [refreshIntervalMs, fetchData])

  return { data, loading, lastUpdate, refetch: fetchData }
} 