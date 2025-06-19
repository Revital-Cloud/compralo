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

  const generateKPIData = (): Record<string, KPIData> => {
    const base = {
      totalOrders: 2642600 + Math.random() * 100000,
      activeOrders: 1265400 + Math.random() * 50000,
      shippedOrders: 374400 + Math.random() * 25000,
      totalRevenue: 5890000 + Math.random() * 200000
    }

    return {
      totalOrders: {
        value: base.totalOrders,
        growth: 34.7 + (Math.random() - 0.5) * 10,
        trend: Math.random() > 0.3 ? 'up' : 'down',
        formatted: `$${(base.totalOrders / 1000).toFixed(0)}K`
      },
      activeOrders: {
        value: base.activeOrders,
        growth: 14.3 + (Math.random() - 0.5) * 8,
        trend: Math.random() > 0.2 ? 'up' : 'down',
        formatted: `$${(base.activeOrders / 1000).toFixed(0)}K`
      },
      shippedOrders: {
        value: base.shippedOrders,
        growth: 24.7 + (Math.random() - 0.5) * 12,
        trend: Math.random() > 0.4 ? 'up' : 'down',
        formatted: `$${(base.shippedOrders / 1000).toFixed(0)}K`
      },
      totalRevenue: {
        value: base.totalRevenue,
        growth: 18.5 + (Math.random() - 0.5) * 15,
        trend: 'up',
        formatted: `$${(base.totalRevenue / 1000000).toFixed(1)}M`
      }
    }
  }

  const generateSalesData = (): SalesDataPoint[] => {
    const months = ['JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
    return months.map((month, index) => ({
      month,
      sales: 100 + (index * 50) + Math.random() * 100,
      orders: 50 + (index * 25) + Math.random() * 50,
      revenue: (100 + (index * 50)) * 89.5 // Precio promedio
    }))
  }

  const generateBestSellers = (): BestSeller[] => {
    const products = [
      { name: 'Adidas Ultra boost', category: 'Zapatillas', basePrice: 196.50 },
      { name: 'Nike Air Force 1', category: 'Zapatillas', basePrice: 156.50 },
      { name: 'Adidas Forum Low', category: 'Casual', basePrice: 126.50 },
      { name: 'Nike React Vision', category: 'Running', basePrice: 186.00 },
      { name: 'Adidas Gazelle', category: 'Retro', basePrice: 96.50 }
    ]

    return products.slice(0, 5).map((product, index) => ({
      id: `prod_${index + 1}`,
      name: product.name,
      price: product.basePrice + (Math.random() - 0.5) * 20,
      sales: `${(3200 - index * 500 + Math.random() * 200).toFixed(0)} vendidos`,
      growth: 15 + (Math.random() - 0.5) * 30,
      category: product.category
    }))
  }

  const generateRecentOrders = (): RecentOrder[] => {
    const customers = [
      'María González', 'Carlos Rodríguez', 'Ana Martínez', 
      'Luis García', 'Carmen López', 'José Fernández',
      'Isabel Sánchez', 'Miguel Torres', 'Laura Ruiz'
    ]
    
    const statuses: RecentOrder['status'][] = ['delivered', 'pending', 'processing', 'shipped', 'canceled']
    const products = ['Adidas Ultra boost', 'Nike Air Force 1', 'Adidas Forum Low']

    return Array.from({ length: 8 }, (_, index) => ({
      id: `#${2456 - index}`,
      product: products[Math.floor(Math.random() * products.length)],
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      customer: customers[Math.floor(Math.random() * customers.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      amount: 150 + Math.random() * 100
    }))
  }

  const fetchData = async () => {
    setLoading(true)
    
    // Simular llamada API
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const newData: DashboardData = {
      kpis: generateKPIData(),
      salesData: generateSalesData(),
      bestSellers: generateBestSellers(),
      recentOrders: generateRecentOrders(),
      timeRange,
      summary: {
        totalSales: Math.floor(Math.random() * 500 + 400),
        totalOrders: Math.floor(Math.random() * 200 + 999),
        conversionRate: (2.5 + Math.random() * 2).toFixed(1)
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