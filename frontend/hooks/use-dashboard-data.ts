'use client'

import { useState, useEffect } from 'react'
import type { KPIData } from '@/components/dashboard/kpi-card'
import type { SalesDataPoint } from '@/components/dashboard/sales-chart'
import type { BestSeller } from '@/components/dashboard/best-sellers'
import type { RecentOrder } from '@/components/dashboard/recent-orders'

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

export const useDashboardData = (timeRange: string) => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchData = async () => {
    setLoading(true)
    
    // TODO: Reemplazar con llamada real al API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newData: DashboardData = {
      kpis: {
        totalOrders: { value: 0, growth: 0, trend: 'up', formatted: '$0K' },
        activeOrders: { value: 0, growth: 0, trend: 'up', formatted: '$0K' },
        shippedOrders: { value: 0, growth: 0, trend: 'up', formatted: '$0K' },
        totalRevenue: { value: 0, growth: 0, trend: 'up', formatted: '$0M' }
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
    
    setData(newData)
    setLastUpdate(new Date())
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [timeRange])

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  return { data, loading, lastUpdate, refetch: fetchData }
} 