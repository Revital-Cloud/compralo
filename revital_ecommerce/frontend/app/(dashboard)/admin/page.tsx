'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  IconShoppingCart, 
  IconPackage,
  IconTruck,
  IconArrowUpRight,
  IconSparkles
} from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { aiService } from '@/services/ai.service'

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
import { useAdminTour } from './_tour/useAdminDriverTour';

/**
 * Mapa de la página principal admin (`/admin`).
 *
 * Qué hace:
 * - Consume el hook `useDashboardData` para KPIs y widgets.
 * - Administra intervalo de refresco persistido en `localStorage`.
 * - Solicita resumen IA (si está habilitado) mediante `aiService`.
 * - Lanza tour guiado inicial para onboarding de administración.
 */

const STORAGE_KEY = 'dashboard-refresh-interval'
const DEFAULT_REFRESH: DashboardRefreshIntervalKey = '30s'
const ADMIN_TOUR_SEEN_KEY = 'revital_admin_tour_seen'

const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState('monthly')
  const [refreshInterval, setRefreshInterval] = useState<DashboardRefreshIntervalKey>(DEFAULT_REFRESH)
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null)
  const { startAdminOverviewTour } = useAdminTour()

  const fetchAiSummary = useCallback(async () => {
    // Evita golpear endpoint de IA cuando la capacidad está desactivada.
    if (!aiEnabled) return
    setAiSummaryLoading(true)
    setAiSummaryError(null)
    try {
      const res = await aiService.getSummary(timeRange)
      setAiSummary(res.summary)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 503) {
        setAiSummaryError('IA no disponible')
      } else {
        setAiSummaryError('Error al generar resumen')
      }
    } finally {
      setAiSummaryLoading(false)
    }
  }, [aiEnabled, timeRange])

  useEffect(() => {
    // Healthcheck de IA para decidir si se muestra la tarjeta de resumen.
    aiService.getHealth().then((res) => setAiEnabled(res.enabled)).catch(() => setAiEnabled(false))
  }, [])

  useEffect(() => {
    if (aiEnabled) fetchAiSummary()
  }, [aiEnabled, fetchAiSummary])

  useEffect(() => {
    // Restaura preferencia de auto-refresh del usuario si existe.
    try {
      const seen = localStorage.getItem(ADMIN_TOUR_SEEN_KEY)
      if (!seen) {
        startAdminOverviewTour()
        localStorage.setItem(ADMIN_TOUR_SEEN_KEY, '1')
      }
    } catch {
      // ignore
    }
  }, [startAdminOverviewTour])

  useEffect(() => {
    // Persiste cambios de preferencia para próximas visitas.
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

  // En primera carga se prioriza skeleton para evitar layout shift agresivo.
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

      {/* AI Summary Card */}
      {aiEnabled === true && (
        <Card className="transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IconSparkles className="h-4 w-4 text-primary" />
              Resumen del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiSummaryLoading && (
              <p className="text-sm text-muted-foreground animate-pulse">Generando resumen...</p>
            )}
            {aiSummaryError && (
              <p className="text-sm text-muted-foreground">{aiSummaryError}</p>
            )}
            {!aiSummaryLoading && !aiSummaryError && aiSummary && (
              <p className="text-sm text-muted-foreground">{aiSummary}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPI Cards Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        data-tour-id="admin-dashboard-kpis"
      >
        <KPICard
          title="Total de Órdenes"
          description="Pedidos creados en el período (cualquier estado)"
          data={data?.kpis?.totalOrders}
          icon={IconShoppingCart}
          loading={loading}
        />
        <KPICard
          title="Unidades vendidas"
          description="Suma de cantidades en líneas de pedidos completados"
          data={data?.kpis?.unitsSold}
          icon={IconPackage}
          loading={loading}
        />
        <KPICard
          title="Órdenes Enviadas"
          description="Pedidos completados o pagados en el período"
          data={data?.kpis?.shippedOrders}
          icon={IconTruck}
          loading={loading}
        />
        <KPICard
          title="Ingresos Totales"
          description="Suma del total de pedidos completados"
          data={data?.kpis?.totalRevenue}
          icon={IconArrowUpRight}
          loading={loading}
        />
      </div>

      {/* Main Dashboard Content */}
      <div data-tour-id="admin-dashboard-charts" className="space-y-6">
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
    </div>
  )
}

export default AdminDashboard