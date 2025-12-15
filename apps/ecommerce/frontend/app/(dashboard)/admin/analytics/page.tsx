'use client';

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui"
import { Badge } from "@repo/ui"
import { Button } from "@repo/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui"
import { Progress } from "@repo/ui"
import { 
  IconTrendingUp,
  IconTrendingDown, 
  IconShoppingCart, 
  IconUsers, 
  IconCash,
  IconEye,
  IconPackage,
  IconTruck,
  IconDeviceAnalytics,
  IconTarget,
  IconHeart,
  IconRefresh,
  IconMapPin,
  IconClock,
  IconDownload
} from "@tabler/icons-react"
import { toast } from "sonner"
import { analyticsService } from '@/services/analytics.service'
import type {
  ConversionMetric,
  TrafficSource,
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

// Componente para fuentes de tráfico
const TrafficSources = ({ sources }: { sources: TrafficSource[] }) => {
  if (sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fuentes de Tráfico</CardTitle>
          <CardDescription>Análisis de canales de adquisición</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay datos de fuentes de tráfico disponibles</p>
            <p className="text-xs mt-2">Se requiere implementar tracking de visitantes</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuentes de Tráfico</CardTitle>
        <CardDescription>Análisis de canales de adquisición</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sources.map((source, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <IconEye className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{source.source}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">{source.visitors.toLocaleString()}</span>
                <Badge variant={source.change > 0 ? "default" : "destructive"} className="text-xs">
                  {source.change > 0 ? '+' : ''}{source.change}%
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={source.percentage} className="flex-1" />
              <span className="text-sm font-medium">{source.percentage}%</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
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

// Componente para performance de productos
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Categoría</CardTitle>
        <CardDescription>Ventas y crecimiento por categoría</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Tabs para diferentes vistas de analytics */}
      <Tabs defaultValue="conversion" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conversion">Conversión</TabsTrigger>
          <TabsTrigger value="traffic">Tráfico</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>

        <TabsContent value="conversion" className="space-y-6">
          <ConversionMetrics metrics={data.conversionMetrics} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrafficSources sources={data.trafficSources} />
            <ProductPerformance performance={data.productPerformance} />
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <HourlyTrafficChart hourlyTraffic={data.hourlyTraffic} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GeographicData geoData={data.geoData} />
            <TrafficSources sources={data.trafficSources} />
          </div>
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