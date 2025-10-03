'use client';

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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

// Tipos para los datos de analytics
interface ConversionMetric {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
}

interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
  change: number;
}

interface CustomerDemographic {
  ageGroup: string;
  percentage: number;
  revenue: number;
}

interface ProductPerformanceData {
  category: string;
  sales: number;
  growth: number;
  percentage: number;
}

interface GeoData {
  region: string;
  orders: number;
  revenue: number;
}

interface AnalyticsData {
  conversionMetrics: ConversionMetric[];
  trafficSources: TrafficSource[];
  customerDemographics: CustomerDemographic[];
  productPerformance: ProductPerformanceData[];
  geoData: GeoData[];
  hourlyTraffic: { hour: string; visitors: number }[];
}

// Mock data para analytics avanzados
const analyticsData: AnalyticsData = {
  conversionMetrics: [],
  trafficSources: [],
  customerDemographics: [],
  productPerformance: [],
  geoData: [],
  hourlyTraffic: Array.from({ length: 24 }, (_, i) => ({ 
    hour: `${i}`.padStart(2, '0'), 
    visitors: 0 
  }))
}

// Componente para métricas de conversión
const ConversionMetrics = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {analyticsData.conversionMetrics.map((metric, index) => (
      <Card key={index}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {metric.title}
          </CardTitle>
          <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metric.value}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="flex items-center">
              <IconTrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">{metric.change}</span>
            </div>
            <span>vs mes anterior</span>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

// Componente para fuentes de tráfico
const TrafficSources = () => (
  <Card>
    <CardHeader>
      <CardTitle>Fuentes de Tráfico</CardTitle>
      <CardDescription>Análisis de canales de adquisición</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {analyticsData.trafficSources.map((source, index) => (
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

// Componente para demografía de clientes
const CustomerDemographics = () => (
  <Card>
    <CardHeader>
      <CardTitle>Demografía de Clientes</CardTitle>
      <CardDescription>Distribución por grupos de edad</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {analyticsData.customerDemographics.map((demo, index) => (
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

// Componente para performance de productos
const ProductPerformance = () => (
  <Card>
    <CardHeader>
      <CardTitle>Performance por Categoría</CardTitle>
      <CardDescription>Ventas y crecimiento por categoría</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {analyticsData.productPerformance.map((product, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{product.category}</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">${product.sales.toLocaleString()}</span>
              <Badge variant={product.growth > 0 ? "default" : "destructive"}>
                {product.growth > 0 ? '+' : ''}{product.growth}%
              </Badge>
            </div>
          </div>
          <Progress value={product.percentage} className="h-2" />
        </div>
      ))}
    </CardContent>
  </Card>
)

// Componente para datos geográficos
const GeographicData = () => (
  <Card>
    <CardHeader>
      <CardTitle>Ventas por Región</CardTitle>
      <CardDescription>Distribución geográfica de pedidos</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {analyticsData.geoData.map((geo, index) => (
        <div key={index} className="flex items-center justify-between">
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

// Componente para tráfico por horas
const HourlyTrafficChart = () => {
  const maxVisitors = Math.max(...analyticsData.hourlyTraffic.map(d => d.visitors))
  
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Tráfico por Horas</CardTitle>
        <CardDescription>Visitantes por hora del día</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-between space-x-1">
          {analyticsData.hourlyTraffic.map((data, index) => (
            <div key={data.hour} className="flex flex-col items-center space-y-1 flex-1">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-sm transition-all hover:from-blue-600 hover:to-blue-400"
                style={{ 
                  height: `${(data.visitors / maxVisitors) * 200}px`,
                  minHeight: '4px'
                }}
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
            <p className="font-bold">N/A</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valle</p>
            <p className="font-bold">N/A</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Promedio</p>
            <p className="font-bold">0 visitas/hora</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const AnalyticsPage = () => {
  const handleExportComplete = (filename: string) => {
    toast.success(`¡Datos de analytics exportados exitosamente en ${filename}!`);
  };

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
          <Button variant="outline" size="sm">
            <IconRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tabs para diferentes vistas de analytics */}
      <Tabs defaultValue="conversion" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conversion">Conversión</TabsTrigger>
          <TabsTrigger value="traffic">Tráfico</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
        </TabsList>

        <TabsContent value="conversion" className="space-y-6">
          <ConversionMetrics />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrafficSources />
            <ProductPerformance />
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <HourlyTrafficChart />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GeographicData />
            <TrafficSources />
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <ConversionMetrics />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CustomerDemographics />
            <GeographicData />
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductPerformance />
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">1,245</p>
                    <p className="text-sm text-muted-foreground">Productos Activos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">87</p>
                    <p className="text-sm text-muted-foreground">Sin Stock</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">23.4%</p>
                    <p className="text-sm text-muted-foreground">Margen Promedio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">4.2★</p>
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