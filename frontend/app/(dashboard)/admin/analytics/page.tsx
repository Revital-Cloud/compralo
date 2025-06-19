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
  IconPercent,
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
import { ExportDialog } from "@/components/excel"
import { toast } from "sonner"

// Mock data para analytics avanzados
const analyticsData = {
  conversionMetrics: [
    {
      title: 'Tasa de Conversión',
      value: '3.24%',
      change: '+12.5%',
      icon: IconTarget
    },
    {
      title: 'Valor Promedio Orden',
      value: '$89.50',
      change: '-2.1%',
      icon: IconCash
    },
    {
      title: 'Abandono de Carrito',
      value: '68.2%',
      change: '-5.3%',
      icon: IconShoppingCart
    },
    {
      title: 'Valor Vida Cliente',
      value: '$245.80',
      change: '+18.7%',
      icon: IconHeart
    }
  ],
  trafficSources: [
    { source: 'Direct', visitors: 45231, percentage: 35.2, change: 8.1 },
    { source: 'Google Organic', visitors: 32156, percentage: 25.0, change: 15.3 },
    { source: 'Social Media', visitors: 18945, percentage: 14.7, change: -3.2 },
    { source: 'Email Marketing', visitors: 16234, percentage: 12.6, change: 22.4 },
    { source: 'Paid Ads', visitors: 9876, percentage: 7.7, change: -8.9 },
    { source: 'Referral', visitors: 6234, percentage: 4.8, change: 5.6 }
  ],
  customerDemographics: [
    { ageGroup: '18-24', percentage: 18.5, revenue: 12350 },
    { ageGroup: '25-34', percentage: 32.1, revenue: 28940 },
    { ageGroup: '35-44', percentage: 28.4, revenue: 35620 },
    { ageGroup: '45-54', percentage: 15.2, revenue: 22180 },
    { ageGroup: '55+', percentage: 5.8, revenue: 8950 }
  ],
  productPerformance: [
    { category: 'Calzado Deportivo', sales: 15420, growth: 23.1, percentage: 45.2 },
    { category: 'Ropa Casual', sales: 8930, growth: -5.3, percentage: 26.1 },
    { category: 'Accesorios', sales: 5240, growth: 12.8, percentage: 15.3 },
    { category: 'Equipamiento', sales: 4610, growth: 8.7, percentage: 13.4 }
  ],
  geoData: [
    { region: 'Buenos Aires', orders: 2341, revenue: 125430 },
    { region: 'Córdoba', orders: 1876, revenue: 98720 },
    { region: 'Santa Fe', orders: 1542, revenue: 82150 },
    { region: 'Mendoza', orders: 987, revenue: 54320 },
    { region: 'Tucumán', orders: 654, revenue: 35890 }
  ],
  hourlyTraffic: [
    { hour: '00', visitors: 45 }, { hour: '01', visitors: 32 }, { hour: '02', visitors: 28 },
    { hour: '03', visitors: 21 }, { hour: '04', visitors: 18 }, { hour: '05', visitors: 25 },
    { hour: '06', visitors: 42 }, { hour: '07', visitors: 68 }, { hour: '08', visitors: 95 },
    { hour: '09', visitors: 125 }, { hour: '10', visitors: 156 }, { hour: '11', visitors: 178 },
    { hour: '12', visitors: 195 }, { hour: '13', visitors: 189 }, { hour: '14', visitors: 172 },
    { hour: '15', visitors: 165 }, { hour: '16', visitors: 158 }, { hour: '17', visitors: 142 },
    { hour: '18', visitors: 135 }, { hour: '19', visitors: 148 }, { hour: '20', visitors: 162 },
    { hour: '21', visitors: 152 }, { hour: '22', visitors: 128 }, { hour: '23', visitors: 85 }
  ]
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
            <p className="font-bold">12:00 - 195 visitas</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valle</p>
            <p className="font-bold">04:00 - 18 visitas</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Promedio</p>
            <p className="font-bold">108 visitas/hora</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const AnalyticsPage = () => {
  const handleExport = async (options: any) => {
    try {
      // Simular exportación
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`¡Datos de analytics exportados exitosamente en formato ${options.format}!`);
    } catch (error) {
      toast.error('Error al exportar los datos de analytics');
    }
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
          <ExportDialog
            title="Exportar Analytics"
            description="Descarga los datos de analytics en Excel o CSV"
            defaultFilename="analytics-reporte"
            onExport={handleExport}
            trigger={
              <Button size="sm">
                <IconDownload className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            }
          />
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