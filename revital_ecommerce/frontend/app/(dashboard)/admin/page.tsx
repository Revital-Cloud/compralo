'use client'

import { useState, useEffect } from 'react'
import { 
  IconShoppingCart, 
  IconCash,
  IconTruck,
  IconArrowUpRight
} from "@tabler/icons-react"

// Dashboard Components
import {
  KPICard,
  SalesChart,
  BestSellers,
  RecentOrders,
  DashboardHeader,
  LoadingSkeleton
} from '@/components/dashboard'
import type { DashboardRefreshIntervalKey } from '@/components/dashboard/dashboard-header'

// Custom Hook
import { useDashboardData, DASHBOARD_REFRESH_INTERVALS } from '@/hooks/use-dashboard-data'

const STORAGE_KEY = 'dashboard-refresh-interval'
const DEFAULT_REFRESH: DashboardRefreshIntervalKey = '30s'

const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState('monthly')
  const [refreshInterval, setRefreshInterval] = useState<DashboardRefreshIntervalKey>(DEFAULT_REFRESH)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as DashboardRefreshIntervalKey | null
      if (stored && Object.keys(DASHBOARD_REFRESH_INTERVALS).includes(stored)) {
        setRefreshInterval(stored)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, refreshInterval)
    } catch {
      // ignore
    }
  }, [refreshInterval])

  const refreshIntervalMs = DASHBOARD_REFRESH_INTERVALS[refreshInterval as keyof typeof DASHBOARD_REFRESH_INTERVALS] ?? 30_000
  const { data, loading, lastUpdate, refetch } = useDashboardData(timeRange, refreshIntervalMs)

  // Show loading skeleton on initial load
  if (!data && loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6 bg-background transition-colors duration-300">
      {/* Header Section */}
      <DashboardHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={setRefreshInterval}
        loading={loading}
        lastUpdate={lastUpdate}
        onRefresh={refetch}
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Órdenes"
          data={data?.kpis?.totalOrders}
          icon={IconShoppingCart}
          loading={loading}
        />
        <KPICard
          title="Órdenes Activas"
          data={data?.kpis?.activeOrders}
          icon={IconCash}
          loading={loading}
        />
        <KPICard
          title="Órdenes Enviadas"
          data={data?.kpis?.shippedOrders}
          icon={IconTruck}
          loading={loading}
        />
        <KPICard
          title="Ingresos Totales"
          data={data?.kpis?.totalRevenue}
          icon={IconArrowUpRight}
          loading={loading}
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SalesChart 
          salesData={data?.salesData || []} 
          summary={data?.summary || { totalSales: 0, totalOrders: 0, conversionRate: '0' }}
          loading={loading}
        />
        <BestSellers 
          bestSellers={data?.bestSellers || []}
          loading={loading}
        />
      </div>

      {/* Recent Orders Section */}
      <div className="grid grid-cols-1">
        <RecentOrders 
          recentOrders={data?.recentOrders || []}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default AdminDashboard