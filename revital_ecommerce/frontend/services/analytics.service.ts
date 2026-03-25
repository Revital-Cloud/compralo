import { get } from '@/utils/apiWrapper'

export interface ConversionMetric {
  title: string
  value: string
  change: string
  icon: string
}

export interface TrafficSource {
  source: string
  visitors: number
  percentage: number
  change: number
}

export interface CustomerDemographic {
  ageGroup: string
  percentage: number
  revenue: number
}

export interface ProductPerformanceData {
  category: string
  sales: number
  growth: number
  percentage: number
}

export interface GeoData {
  region: string
  orders: number
  revenue: number
}

export interface ProductMetrics {
  productosActivos: number
  productosInactivos: number
  sinStock: number
  precioPromedio: number
  ratingPromedio: number
  /** Categorías distintas con al menos un producto activo */
  categoriasActivas?: number
  /** Combinaciones variante activas (SKUs listados) */
  variantesActivas?: number
}

export interface AnalyticsData {
  conversionMetrics: ConversionMetric[]
  trafficSources: TrafficSource[]
  customerDemographics: CustomerDemographic[]
  productPerformance: ProductPerformanceData[]
  geoData: GeoData[]
  hourlyTraffic: { hour: string; visitors: number }[]
  productMetrics: ProductMetrics
}

export const analyticsService = {
  async getAnalyticsData(): Promise<AnalyticsData> {
    return get<AnalyticsData>('/admin/analytics')
  }
}

