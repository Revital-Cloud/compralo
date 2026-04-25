'use client';

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { Separator } from "@/components/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { 
  IconTrendingUp,
  IconTrendingDown, 
  IconShoppingCart, 
  IconUsers, 
  IconCash,
  IconPackage,
  IconDeviceAnalytics,
  IconTarget,
  IconChartBarPopular,
  IconCategory,
  IconPackages,
  IconBox,
  IconRefresh,
  IconMapPin,
  IconDownload,
  IconStar
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

/**
 * Mapa de esta página (`/admin/analytics`).
 *
 * Responsabilidad:
 * - Renderizar la vista avanzada de analytics para administradores.
 * - Consumir `analyticsService.getAnalyticsData`.
 * - Gestionar estados de carga/error y refresco manual.
 * - Sincronizar la pestaña activa con el query param `tab`.
 */

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
  // Color de la cuarta barra ajustado para mejor contraste en temas claro/oscuro
  '#22c55e',
  'var(--chart-5, #ec4899)',
  '#0ea5e9',
  '#6366f1',
  '#14b8a6'
]

/** Texto compacto de variación (evita badges grandes repetidos). */
const CategoryGrowthHint = ({ growth }: { growth: number }) => {
  if (growth > 0) {
    return (
      <span className="shrink-0 tabular-nums text-xs font-medium text-emerald-700 dark:text-emerald-400">
        +{growth.toFixed(1)}%
      </span>
    )
  }
  if (growth < 0) {
    return (
      <span className="shrink-0 tabular-nums text-xs font-medium text-rose-700 dark:text-rose-400">
        {growth.toFixed(1)}%
      </span>
    )
  }
  return <span className="shrink-0 text-xs text-muted-foreground">—</span>
}

const STACK_TOP_N = 5

// Distribución por categoría: KPIs + barra apilada 100% + ranking (sin dona)
const ProductPerformance = ({ performance }: { performance: ProductPerformanceData[] }) => {
  const visiblePerformance = performance.filter((p) => p.percentage > 0)

  if (performance.length === 0 || visiblePerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución por categoría</CardTitle>
          <CardDescription>Participación de cada categoría en el período analizado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No hay datos por categoría en este período</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ranked = [...visiblePerformance].sort((a, b) => b.percentage - a.percentage)
  const rankedRows = ranked.map((product, index) => ({
    product,
    color: CHART_COLORS[index % CHART_COLORS.length],
    key: `${product.category}-${index}`
  }))

  const topStack = ranked.slice(0, STACK_TOP_N)
  const restPct = ranked.slice(STACK_TOP_N).reduce((s, p) => s + p.percentage, 0)
  type StackSeg = { id: string; label: string; pct: number; color: string }
  const stackSegments: StackSeg[] = topStack.map((p, i) => ({
    id: `${p.category}-stack-${i}`,
    label: p.category,
    pct: p.percentage,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }))
  if (restPct >= 0.05) {
    stackSegments.push({
      id: 'otros-stack',
      label: 'Otros',
      pct: restPct,
      color: 'hsl(var(--muted-foreground) / 0.45)'
    })
  }

  const top3Share = ranked
    .slice(0, 3)
    .reduce((s, p) => s + p.percentage, 0)

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Distribución por categoría</CardTitle>
        <CardDescription>
          Indicadores clave, composición del total y ranking. Pasa el cursor sobre el ranking para
          importe y variación.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="col-span-2 rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-4 ring-1 ring-primary/15 xl:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Líder en participación
            </p>
            <p className="mt-1 truncate text-lg font-semibold leading-tight" title={ranked[0].category}>
              {ranked[0].category}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
              {ranked[0].percentage.toFixed(1)}
              <span className="text-xl font-semibold text-muted-foreground">%</span>
            </p>
            <div className="mt-2">
              <CategoryGrowthHint growth={ranked[0].growth} />
            </div>
          </div>
          {[1, 2].map(slot => {
            const p = ranked[slot]
            if (!p) {
              return (
                <div
                  key={`kpi-empty-${slot}`}
                  className="rounded-xl border border-dashed bg-muted/20 p-4 text-muted-foreground"
                >
                  <p className="text-xs font-medium uppercase tracking-wide">#{slot + 1}</p>
                  <p className="mt-3 text-sm">—</p>
                </div>
              )
            }
            const color = CHART_COLORS[slot % CHART_COLORS.length]
            return (
              <div
                key={p.category}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  #{slot + 1} en participación
                </p>
                <p className="mt-1 truncate text-sm font-semibold" title={p.category}>
                  {p.category}
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color }}>
                  {p.percentage.toFixed(1)}%
                </p>
              </div>
            )
          })}
          <div className="col-span-2 rounded-xl border bg-card p-4 shadow-sm xl:col-span-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconChartBarPopular className="size-4 shrink-0" aria-hidden />
              <p className="text-xs font-medium uppercase tracking-wide">Resumen</p>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{ranked.length}</p>
            <p className="text-xs text-muted-foreground">categorías con datos</p>
            <p className="mt-3 border-t pt-2 text-xs text-muted-foreground leading-snug">
              Top 3 concentran{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {top3Share.toFixed(1)}%
              </span>{' '}
              del total
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Composición del total</p>
            <p className="text-xs text-muted-foreground">Top {STACK_TOP_N} + resto</p>
          </div>
          <div
            className="flex h-6 w-full overflow-hidden rounded-full bg-muted ring-1 ring-border/60"
            role="img"
            aria-label="Barra apilada: participación por categoría (top cinco y otros)"
          >
            {stackSegments.map(seg => (
              <div
                key={seg.id}
                style={{
                  width: `${seg.pct}%`,
                  minWidth: seg.pct > 0 && seg.pct < 1 ? '4px' : undefined,
                  backgroundColor: seg.color
                }}
                className="h-full shrink-0 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                title={`${seg.label}: ${seg.pct.toFixed(1)}%`}
              />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {stackSegments.map((seg, i) => (
              <li key={`leg-${seg.id}`} className="flex items-center gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: seg.color }}
                  aria-hidden
                />
                <span className="max-w-[140px] truncate">{seg.label}</span>
                <span className="tabular-nums">{seg.pct.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Ranking por participación</p>
          <div className="max-h-[min(480px,60vh)] space-y-4 overflow-y-auto pr-1">
            {rankedRows.map(({ product, color, key }) => {
              const pct = Math.min(100, Math.max(0, product.percentage))
              const detail = `Importe aprox.: $${product.sales.toLocaleString()}. Variación: ${
                product.growth > 0 ? '+' : ''
              }${product.growth.toFixed(1)}%`
              return (
                <div
                  key={`bar-row-${key}`}
                  className="rounded-lg border border-transparent px-1 py-1 transition-colors hover:border-border hover:bg-muted/30"
                  title={detail}
                >
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full ring-2 ring-background"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-medium leading-snug">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-baseline gap-3">
                      <span className="text-sm font-semibold tabular-nums">{pct.toFixed(1)}%</span>
                      <CategoryGrowthHint growth={product.growth} />
                    </div>
                  </div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-muted sm:h-3"
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${product.category}: ${pct.toFixed(1)} por ciento del total`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const STAR_PATH =
  'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'

const CatalogStarRating = ({ value }: { value: number }) => {
  const clamped = Math.min(5, Math.max(0, value))
  return (
    <div
      className="flex gap-0.5 pt-1"
      role="img"
      aria-label={`Valoración media ${clamped.toFixed(1)} de 5 estrellas`}
    >
      {[0, 1, 2, 3, 4].map(i => {
        const fill = Math.min(1, Math.max(0, clamped - i))
        return (
          <span key={i} className="relative inline-flex size-7 shrink-0">
            <svg viewBox="0 0 24 24" className="size-7 text-muted-foreground/35" aria-hidden>
              <path fill="currentColor" d={STAR_PATH} />
            </svg>
            {fill > 0 ? (
              <span
                className="absolute inset-0 overflow-hidden text-amber-500"
                style={{ width: `${fill * 100}%` }}
              >
                <svg viewBox="0 0 24 24" className="size-7">
                  <path fill="currentColor" d={STAR_PATH} />
                </svg>
              </span>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}

const INVENTORY_SEGMENTS: {
  key: string
  label: string
  color: string
  get: (m: ProductMetrics) => number
}[] = [
  { key: 'activos', label: 'Activos', color: '#059669', get: m => m.productosActivos ?? 0 },
  { key: 'inactivos', label: 'Inactivos', color: '#d97706', get: m => m.productosInactivos ?? 0 },
  { key: 'sinStock', label: 'Sin stock', color: '#e11d48', get: m => m.sinStock ?? 0 }
]

const ProductOperationalKpis = ({ metrics }: { metrics: ProductMetrics }) => {
  const activos = metrics.productosActivos ?? 0
  const inactivos = metrics.productosInactivos ?? 0
  const sinStock = metrics.sinStock ?? 0
  const conStock = Math.max(0, activos - sinStock)
  const totalCatalogo = activos + inactivos
  const cats = metrics.categoriasActivas ?? 0
  const skus = metrics.variantesActivas ?? 0
  const stockPct = activos > 0 ? (conStock / activos) * 100 : 0

  const tiles: {
    label: string
    value: string
    hint: string
    icon: React.ElementType
  }[] = [
    {
      label: 'Categorías con productos',
      value: cats.toLocaleString(),
      hint: 'Con al menos un activo',
      icon: IconCategory
    },
    {
      label: 'Variantes listadas',
      value: skus.toLocaleString(),
      hint: 'SKUs activos en tienda',
      icon: IconPackages
    },
    {
      label: 'Con stock',
      value: conStock.toLocaleString(),
      hint: `De ${activos.toLocaleString()} productos activos`,
      icon: IconPackage
    },
    {
      label: 'Catálogo total',
      value: totalCatalogo.toLocaleString(),
      hint: `${activos.toLocaleString()} activos · ${inactivos.toLocaleString()} inactivos`,
      icon: IconBox
    }
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Operación de catálogo</CardTitle>
        <CardDescription>SKUs, categorías y disponibilidad</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map(({ label, value, hint, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                <span
                  className="flex-1 truncate text-xs font-medium uppercase tracking-wide"
                  title={label}
                >
                  {label}
                </span>
              </div>
              <p className="mt-2 min-h-9 leading-none text-2xl font-bold tabular-nums tracking-tight">
                {value}
              </p>
              <p className="mt-1 min-h-6 text-xs text-muted-foreground leading-snug">
                {hint}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium">Cobertura de stock (activos)</span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {stockPct.toFixed(1)}% con unidades
            </span>
          </div>
          <div
            className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-muted"
            role="presentation"
            aria-hidden
          >
            <div
              className="h-full bg-emerald-600 transition-all duration-500 dark:bg-emerald-500"
              style={{ width: `${stockPct}%` }}
            />
            <div
              className="h-full bg-rose-500/75 transition-all duration-500"
              style={{ width: `${100 - stockPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {activos === 0
              ? 'No hay productos activos.'
              : sinStock > 0
                ? `${sinStock.toLocaleString()} activo(s) sin stock disponible.`
                : 'Todos los activos tienen al menos una variante con stock.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

const ProductCatalogMetrics = ({ metrics }: { metrics: ProductMetrics }) => {
  const activos = metrics.productosActivos ?? 0
  const inactivos = metrics.productosInactivos ?? 0
  const sinStock = metrics.sinStock ?? 0
  const totalCatalogo = activos + inactivos
  const precio = metrics.precioPromedio ?? 0
  const rating = metrics.ratingPromedio ?? 0

  const stackParts: { key: string; pct: number; color: string; label: string }[] = []
  if (totalCatalogo > 0) {
    if (activos > 0) {
      stackParts.push({
        key: 'activos',
        pct: (activos / totalCatalogo) * 100,
        color: '#059669',
        label: 'Activos'
      })
    }
    if (inactivos > 0) {
      stackParts.push({
        key: 'inactivos',
        pct: (inactivos / totalCatalogo) * 100,
        color: '#d97706',
        label: 'Inactivos'
      })
    }
  }

  const priceCap = Math.max(10_000_000, precio * 1.5, precio + 1)
  const priceBarPct = precio > 0 ? Math.min(100, (precio / priceCap) * 100) : 0
  const ratingBarPct = Math.min(100, Math.max(0, (rating / 5) * 100))

  return (
    <Card className="flex w-full flex-col">
      <CardHeader>
        <CardTitle>Resumen de catálogo</CardTitle>
        <CardDescription>Inventario, precios y satisfacción</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Composición del catálogo</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Activos frente a inactivos. &quot;Sin stock&quot; cuenta activos sin unidades (no suma al
            100%).
          </p>
          {totalCatalogo > 0 ? (
            <div
              className="mb-4 flex h-7 w-full overflow-hidden rounded-lg bg-muted ring-1 ring-border/60"
              role="img"
              aria-label="Proporción de productos activos e inactivos"
            >
              {stackParts.map(seg => (
                <div
                  key={seg.key}
                  className="h-full shrink-0 transition-all duration-500 first:rounded-l-lg last:rounded-r-lg"
                  style={{
                    width: `${seg.pct}%`,
                    minWidth: seg.pct > 0 && seg.pct < 1 ? '6px' : undefined,
                    backgroundColor: seg.color
                  }}
                  title={`${seg.label}: ${seg.pct.toFixed(1)}%`}
                />
              ))}
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
              Sin productos en catálogo
            </div>
          )}
          <ul className="flex flex-col gap-3 text-sm" aria-label="Desglose de inventario">
            {INVENTORY_SEGMENTS.map(seg => {
              const n = seg.get(metrics)
              const pctCat =
                seg.key === 'sinStock'
                  ? activos > 0
                    ? (n / activos) * 100
                    : 0
                  : totalCatalogo > 0
                    ? (n / totalCatalogo) * 100
                    : 0
              return (
                <li key={seg.key}>
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex shrink-0 items-center gap-2 sm:w-32">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: seg.color }}
                        aria-hidden
                      />
                      <span className="truncate font-medium">{seg.label}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
                        role="presentation"
                        aria-hidden
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pctCat}%`,
                            minWidth: n > 0 ? '4px' : undefined,
                            backgroundColor: seg.color
                          }}
                        />
                      </div>
                      <span className="w-[6.5rem] shrink-0 text-right tabular-nums text-muted-foreground text-xs sm:text-sm">
                        {n.toLocaleString()}
                        <span className="ml-1 text-[11px] opacity-90 sm:text-xs">
                          (
                          {seg.key === 'sinStock'
                            ? `${pctCat.toFixed(1)}% act.`
                            : `${pctCat.toFixed(1)}%`}
                          )
                        </span>
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-start">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <IconCash className="size-4 shrink-0" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide">Precio promedio</span>
            </div>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              ${precio.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </p>
            <div
              className="mt-3 h-3 overflow-hidden rounded-full bg-muted"
              role="presentation"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-500"
                style={{ width: `${priceBarPct}%`, minWidth: precio > 0 ? '4px' : undefined }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-snug">
              Barra relativa al catálogo (referencia visual hasta ~${(priceCap / 1e6).toFixed(1)}M).
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <IconStar className="size-4 shrink-0" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide">Valoración</span>
            </div>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {rating.toFixed(1)}
              <span className="text-base font-semibold text-muted-foreground"> / 5</span>
            </p>
            <CatalogStarRating value={rating} />
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(ratingBarPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Puntuación ${rating.toFixed(1)} sobre cinco`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                style={{ width: `${ratingBarPct}%` }}
              />
            </div>
          </div>
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
        {/* Fila de barras y fila de etiquetas separadas: si la etiqueta va dentro de la misma
            columna con items-end en el padre, las columnas con label quedan más altas y la barra
            sube (falsa lectura del tráfico en 00h, 04h, etc.). */}
        <div className="flex h-64 flex-col gap-1">
          <div className="flex min-h-0 flex-1 items-end justify-between gap-0.5">
            {hourlyTraffic.map(data => (
              <div key={data.hour} className="flex h-full min-w-0 flex-1 items-end justify-center">
                <div
                  className="w-full cursor-pointer rounded-t-sm bg-gradient-to-t from-blue-500 to-blue-300 transition-all hover:from-blue-600 hover:to-blue-400"
                  style={{
                    height: `${(data.visitors / maxVisitors) * 200}px`,
                    minHeight: '4px',
                    maxHeight: '100%'
                  }}
                  title={`${data.hour}:00 - ${data.visitors} órdenes`}
                />
              </div>
            ))}
          </div>
          <div className="flex h-5 shrink-0 justify-between gap-0.5">
            {hourlyTraffic.map((data, index) => (
              <div
                key={`${data.hour}-axis`}
                className="flex min-w-0 flex-1 items-start justify-center"
              >
                {index % 4 === 0 ? (
                  <span className="text-xs text-muted-foreground tabular-nums">{data.hour}h</span>
                ) : null}
              </div>
            ))}
          </div>
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

  // Se traduce valor URL -> valor interno de Tabs para mantener enlaces compartibles.
  const tabParam = searchParams.get('tab') ?? ''
  const currentTab = (URL_TO_TAB[tabParam] as keyof typeof TAB_TO_URL) ?? DEFAULT_TAB

  const handleTabChange = (value: string) => {
    // Mantiene navegación sin recarga completa y evita salto de scroll.
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

  // Estado base para renderizar componentes incluso antes de tener payload real.
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
      productosInactivos: 0,
      sinStock: 0,
      precioPromedio: 0,
      ratingPromedio: 0,
      categoriasActivas: 0,
      variantesActivas: 0
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
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
            <div className="xl:col-span-7 2xl:col-span-8">
              <ProductOperationalKpis metrics={data.productMetrics} />
            </div>
            <div className="xl:col-span-5 2xl:col-span-4">
              <ProductCatalogMetrics metrics={data.productMetrics} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AnalyticsPage