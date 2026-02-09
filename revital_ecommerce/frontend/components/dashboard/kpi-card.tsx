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
  data?: KPIData
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
}

export const KPICard = ({ title, data, icon: Icon, loading = false }: KPICardProps) => {
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
    <Card className={`transition-all duration-300 hover:shadow-lg ${loading ? 'animate-pulse' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${iconBgColor}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
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