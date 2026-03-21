'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"

interface KPIData {
  value: number
  growth: number
  trend: 'up' | 'down' | 'stable'
  formatted: string
}

interface KPICardProps {
  title: string
  /** Texto breve bajo el título (p. ej. definición de la métrica). */
  description?: string
  data?: KPIData
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
}

export const KPICard = ({ title, description, data, icon: Icon, loading = false }: KPICardProps) => {
  // Safe fallbacks for data
  const safeData = data || { value: 0, growth: 0, trend: 'stable' as const, formatted: '$0' }
  
  const TrendIcon = safeData.trend === 'up' ? IconTrendingUp : IconTrendingDown
  const trendColor =
    safeData.trend === 'up'
      ? 'text-green-600 dark:text-green-400'
      : safeData.trend === 'down'
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground'

  // Fondo del ícono debe respetar light/dark (evita "cuadrito" blanco en dark mode)
  const iconBgColor =
    safeData.trend === 'up'
      ? 'bg-green-500/10 dark:bg-green-500/20'
      : safeData.trend === 'down'
        ? 'bg-red-500/10 dark:bg-red-500/20'
        : 'bg-muted'

  const iconColor =
    safeData.trend === 'up'
      ? 'text-green-700 dark:text-green-300'
      : safeData.trend === 'down'
        ? 'text-red-700 dark:text-red-300'
        : 'text-muted-foreground'

  return (
    <Card
      className={`flex h-full flex-col transition-all duration-300 hover:shadow-lg ${loading ? 'animate-pulse' : ''}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        {/* Caja de altura fija: misma posición del valor en todas las tarjetas (descripción acotada a 2 líneas) */}
        <div className="flex h-[5.25rem] min-w-0 flex-1 flex-col gap-1 pr-1">
          <CardTitle className="line-clamp-2 text-sm font-medium leading-tight text-muted-foreground">
            {title}
          </CardTitle>
          {description ? (
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground/90">{description}</p>
          ) : (
            <div className="min-h-0 flex-1" aria-hidden />
          )}
        </div>
        <div className={`shrink-0 self-start p-2 rounded-lg ${iconBgColor}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="text-2xl font-bold tracking-tight">{safeData.formatted}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
          <div className={`flex items-center ${trendColor}`}>
            <TrendIcon className="mr-1 h-3 w-3" />
            <span className="font-medium">{Math.abs(safeData.growth).toFixed(1)}%</span>
          </div>
          <span>vs mes anterior</span>
        </div>
      </CardContent>
    </Card>
  )
}

export type { KPIData } 