import { get } from '@/utils/apiWrapper'

/**
 * Mapa del servicio de analytics (frontend).
 *
 * Responsabilidad:
 * - Definir el contrato tipado de la respuesta que entrega backend para
 *   `/admin/analytics`.
 * - Centralizar la llamada HTTP para que componentes/hooks no dependan de
 *   detalles de transporte.
 */

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
  /**
   * Obtiene el payload completo de analytics para el panel admin.
   *
   * Endpoint backend:
   * - GET `/admin/analytics`
   *
   * Retorna:
   * - Métricas de conversión, tráfico, clientes, categorías, geografía y
   *   KPIs de catálogo en un único objeto.
   */
  async getAnalyticsData(): Promise<AnalyticsData> {
    return get<AnalyticsData>('/admin/analytics')
  }
}

