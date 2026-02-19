'use client';

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Button } from "@/components/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { Progress } from "@/components/ui"
import { 
  IconTrendingUp,
  IconTrendingDown, 
  IconShoppingCart, 
  IconUsers, 
  IconCash,
  IconPackage,
  IconTruck,
  IconDeviceAnalytics,
  IconTarget,
  IconHeart,
  IconRefresh,
  IconMapPin,
  IconDownload
} from "@tabler/icons-react"
import { toast } from "sonner"
import { useAdminTour } from '../_tour/useAdminDriverTour'
import { analyticsService } from '@/services/analytics.service'
import type {
  ConversionMetric,
  CustomerDemographic,
  ProductPerformanceData,
  GeoData,
  AnalyticsData,
  ProductMetrics
} from '@/services/analytics.service'

// Los tipos se importan desde el servicio

// Mapeo de iconos por nombre
const iconMap: Record<string, React.ElementType> = {
  'IconTarget': IconTarget,
  'IconShoppingCart': IconShoppingCart,
  'IconPackage': IconPackage,
  'IconCash': IconCash,
  'IconTrendingUp': IconTrendingUp,
  'IconTrendingDown': IconTrendingDown
}

// Sincronización tab ↔ URL
const TAB_TO_URL: Record<string, string> = {
  conversion: 'conversacion',
  traffic: 'trafico',
  customers: 'clientes',
  products: 'productos'
}
const URL_TO_TAB: Record<string, string> = {
  conversacion: 'conversion',
  trafico: 'traffic',
  clientes: 'customers',
  productos: 'products'
}
const DEFAULT_TAB = 'conversion'

// Componente para métricas de conversión
const ConversionMetrics = ({ metrics }: { metrics: ConversionMetric[] }) => {
  if (metrics.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground h-4 bg-gray-200 rounded w-24" />
              <div className="h-4 w-4 bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = iconMap[metric.icon] || IconTrendingUp
        const changeValue = parseFloat(metric.change.replace('%', '')) || 0
        const isPositive = changeValue >= 0
        
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  {isPositive ? (
                    <IconTrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <IconTrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={isPositive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {metric.change}
                  </span>
                </div>
                <span>vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Componente para demografía de clientes
const CustomerDemographics = ({ demographics }: { demographics: CustomerDemographic[] }) => {
  if (demographics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demografía de Clientes</CardTitle>
          <CardDescription>Distribución por grupos de edad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay datos demográficos disponibles</p>
            <p className="text-xs mt-2">Se requiere agregar información de edad de usuarios</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demografía de Clientes</CardTitle>
        <CardDescription>Distribución por grupos de edad</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {demographics.map((demo, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <IconUsers className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{demo.ageGroup} años</p>
                <p className="text-xs text-muted-foreground">${demo.revenue.toLocaleString()} ingresos</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold">{demo.percentage}%</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Colores para el gráfico de dona por categoría (usan variables del tema + fallbacks)
const CHART_COLORS = [
  'var(--chart-1, #3b82f6)',
  'var(--chart-2, #10b981)',
  'var(--chart-3, #f59e0b)',
  'var(--chart-4, #8b5cf6)',
  'var(--chart-5, #ec4899)',
  '#0ea5e9',
  '#6366f1',
  '#14b8a6'
]

// Componente para performance de productos (barras + gráfico dona)
const ProductPerformance = ({ performance }: { performance: ProductPerformanceData[] }) => {
  if (performance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance por Categoría</CardTitle>
          <CardDescription>Ventas y crecimiento por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay datos de categorías disponibles</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalSales = performance.reduce((sum, p) => sum + p.sales, 0)
  const maxSales = Math.max(...performance.map((p) => p.sales), 1)
  const circumference = 2 * Math.PI * 42
  let offset = 0
  const chartHeight = 200
  const barGap = 12
  const barMinHeight = 8

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Categoría</CardTitle>
        <CardDescription>Ventas y crecimiento por categoría</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fila 1: Dona + Gráfico de barras verticales (para que se vea más lleno) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-b pb-6">
          {/* Dona: participación por categoría */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex-shrink-0" aria-hidden>
              <svg width={120} height={120} className="rotate-[-90deg]">
                <circle
                  cx={60}
                  cy={60}
                  r={42}
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth={14}
                />
                {performance.map((product, index) => {
                  const segment = (product.percentage / 100) * circumference
                  const color = CHART_COLORS[index % CHART_COLORS.length]
                  const el = (
                    <circle
                      key={`${product.category}-${index}`}
                      cx={60}
                      cy={60}
                      r={42}
                      fill="none"
                      stroke={color}
                      strokeWidth={14}
                      strokeDasharray={`${segment} ${circumference}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  )
                  offset += segment
                  return el
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-muted-foreground">
                  {totalSales > 0 ? `${performance.length} cat.` : '—'}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Participación por categoría</p>
              <ul className="space-y-1.5">
                {performance.map((product, index) => (
                  <li key={`${product.category}-${index}`} className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      aria-hidden
                    />
                    <span className="truncate">{product.category}</span>
                    <span className="text-muted-foreground tabular-nums">{product.percentage.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Gráfico de barras verticales: ventas en $ */}
          <div className="min-h-[220px]">
            <p className="text-sm font-medium text-muted-foreground mb-4">Ventas por categoría</p>
            <div
              className="flex items-end justify-around gap-2 w-full h-[200px] px-2"
              style={{ minHeight: chartHeight }}
              role="img"
              aria-label="Gráfico de barras de ventas por categoría"
            >
              {performance.map((product, index) => {
                const heightRatio = maxSales > 0 ? product.sales / maxSales : 0
                const barHeight = Math.max(barMinHeight, heightRatio * (chartHeight - 24))
                const color = CHART_COLORS[index % CHART_COLORS.length]
                return (
                  <div
                    key={`bar-${product.category}-${index}`}
                    className="flex flex-col items-center flex-1 min-w-0 group"
                  >
                    <span
                      className="text-xs font-medium text-muted-foreground mb-1 truncate w-full text-center"
                      title={product.category}
                    >
                      {product.category.length > 12 ? `${product.category.slice(0, 10)}…` : product.category}
                    </span>
                    <div className="w-full flex justify-center items-end flex-1">
                      <div
                        className="w-full max-w-[56px] rounded-t-md transition-all duration-300 hover:opacity-90"
                        style={{
                          height: barHeight,
                          backgroundColor: color,
                          minHeight: barMinHeight
                        }}
                        title={`${product.category}: $${product.sales.toLocaleString()}`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 tabular-nums">
                      ${(product.sales / 1e6).toFixed(1)}M
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Barras horizontales: ventas y crecimiento */}
        <div className="space-y-4">
          {performance.map((product, index) => (
            <div key={`${product.category}-${index}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{product.category}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">${product.sales.toLocaleString()}</span>
                  <Badge variant={product.growth > 0 ? "default" : "destructive"}>
                    {product.growth > 0 ? '+' : ''}{product.growth.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              <Progress value={product.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para datos geográficos
const GeographicData = ({ geoData }: { geoData: GeoData[] }) => {
  if (geoData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ventas por Región</CardTitle>
          <CardDescription>Distribución geográfica de pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay datos geográficos disponibles</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por Región</CardTitle>
        <CardDescription>Distribución geográfica de pedidos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {geoData.map((geo, index) => (
          <div key={`${geo.region}-${index}`} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <IconMapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{geo.region}</span>
            </div>
            <div className="text-right">
              <p className="font-bold">{geo.orders} pedidos</p>
              <p className="text-xs text-muted-foreground">${geo.revenue.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Componente para tráfico por horas
const HourlyTrafficChart = ({ hourlyTraffic }: { hourlyTraffic: { hour: string; visitors: number }[] }) => {
  const maxVisitors = Math.max(...hourlyTraffic.map(d => d.visitors), 1)
  const totalVisitors = hourlyTraffic.reduce((sum, d) => sum + d.visitors, 0)
  const avgVisitors = totalVisitors / 24
  const peakHour = hourlyTraffic.reduce((max, d) => d.visitors > max.visitors ? d : max, hourlyTraffic[0])
  const lowHour = hourlyTraffic.reduce((min, d) => d.visitors < min.visitors ? d : min, hourlyTraffic[0])

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Tráfico por Horas</CardTitle>
        <CardDescription>Órdenes por hora del día (últimos 30 días)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-between space-x-1">
          {hourlyTraffic.map((data, index) => (
            <div key={data.hour} className="flex flex-col items-center space-y-1 flex-1">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-sm transition-all hover:from-blue-600 hover:to-blue-400 cursor-pointer"
                style={{
                  height: `${(data.visitors / maxVisitors) * 200}px`,
                  minHeight: '4px'
                }}
                title={`${data.hour}:00 - ${data.visitors} órdenes`}
              />
              {index % 4 === 0 && (
                <span className="text-xs text-muted-foreground">{data.hour}h</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Pico</p>
            <p className="font-bold">{peakHour?.hour || 'N/A'}:00</p>
            <p className="text-xs text-muted-foreground">{peakHour?.visitors || 0} órdenes</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valle</p>
            <p className="font-bold">{lowHour?.hour || 'N/A'}:00</p>
            <p className="text-xs text-muted-foreground">{lowHour?.visitors || 0} órdenes</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Promedio</p>
            <p className="font-bold">{avgVisitors.toFixed(1)} órdenes/hora</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const AnalyticsPage = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tabParam = searchParams.get('tab') ?? ''
  const currentTab = (URL_TO_TAB[tabParam] as keyof typeof TAB_TO_URL) ?? DEFAULT_TAB

  const handleTabChange = (value: string) => {
    const urlTab = TAB_TO_URL[value] ?? TAB_TO_URL[DEFAULT_TAB]
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', urlTab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Escribir tab por defecto en la URL si no existe
  useEffect(() => {
    if (!searchParams.get('tab')) {
      router.replace(`${pathname}?tab=${TAB_TO_URL[DEFAULT_TAB]}`, { scroll: false })
    }
  }, [pathname, router, searchParams])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await analyticsService.getAnalyticsData()
      setAnalyticsData(data)
    } catch (err) {
      console.error('Error al obtener datos de analytics:', err)
      setError('Error al cargar los datos de analytics')
      toast.error('No se pudieron cargar los datos de analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const handleRefresh = () => {
    fetchAnalyticsData()
    toast.success('Datos actualizados')
  }

  // Datos por defecto si no hay datos
  const data: AnalyticsData = analyticsData || {
    conversionMetrics: [],
    trafficSources: [],
    customerDemographics: [],
    productPerformance: [],
    geoData: [],
    hourlyTraffic: Array.from({ length: 24 }, (_, i) => ({ 
      hour: `${i}`.padStart(2, '0'), 
      visitors: 0 
    })),
    productMetrics: {
      productosActivos: 0,
      sinStock: 0,
      precioPromedio: 0,
      ratingPromedio: 0
    }
  }

  const { startAnalyticsTour } = useAdminTour()

  useEffect(() => {
    try {
      const seen = localStorage.getItem('revital_analytics_tour_seen')
      if (!seen) {
        startAnalyticsTour()
        localStorage.setItem('revital_analytics_tour_seen', '1')
      }
    } catch {
      // ignore
    }
  }, [startAnalyticsTour])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between" data-tour-id="analytics-header">
        <div>
          <h1 className="text-2xl font-bold">Analytics Avanzados</h1>
          <p className="text-muted-foreground">
            Métricas detalladas de performance y comportamiento
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs para diferentes vistas de analytics (sincronizado con URL ?tab=conversacion|trafico|clientes|productos) */}
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="space-y-6"
        data-tour-id="analytics-tabs"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conversion">Conversión</TabsTrigger>
          <TabsTrigger value="traffic">Tráfico</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>

        <TabsContent value="conversion" className="space-y-6">
          <ConversionMetrics metrics={data.conversionMetrics} />
          <ProductPerformance performance={data.productPerformance} />
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <HourlyTrafficChart hourlyTraffic={data.hourlyTraffic} />
          <GeographicData geoData={data.geoData} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <ConversionMetrics metrics={data.conversionMetrics} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CustomerDemographics demographics={data.customerDemographics} />
            <GeographicData geoData={data.geoData} />
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductPerformance performance={data.productPerformance} />
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{(data.productMetrics?.productosActivos || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Productos Activos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{(data.productMetrics?.sinStock || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Sin Stock</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">${(data.productMetrics?.precioPromedio || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
                    <p className="text-sm text-muted-foreground">Precio Promedio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{(data.productMetrics?.ratingPromedio || 0).toFixed(1)}★</p>
                    <p className="text-sm text-muted-foreground">Rating Promedio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsPage