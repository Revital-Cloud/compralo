'use client'

import { Button } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { IconCalendar, IconRefresh } from "@tabler/icons-react"

export type DashboardRefreshIntervalKey = 'off' | '30s' | '1m' | '2m' | '5m'

interface DashboardHeaderProps {
  timeRange: string
  onTimeRangeChange: (value: string) => void
  refreshInterval: DashboardRefreshIntervalKey
  onRefreshIntervalChange: (value: DashboardRefreshIntervalKey) => void
  loading: boolean
  lastUpdate: Date
  onRefresh: () => void
}

const formatLastUpdate = (date: Date) => {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

const REFRESH_INTERVAL_LABELS: Record<DashboardRefreshIntervalKey, string> = {
  off: 'No auto',
  '30s': 'Cada 30 s',
  '1m': 'Cada 1 min',
  '2m': 'Cada 2 min',
  '5m': 'Cada 5 min',
}

export const DashboardHeader = ({ 
  timeRange, 
  onTimeRangeChange, 
  refreshInterval,
  onRefreshIntervalChange,
  loading, 
  lastUpdate, 
  onRefresh 
}: DashboardHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
        <IconCalendar className="h-4 w-4" />
        <span>Inicio → Dashboard</span>
        <span>•</span>
        <span>Actualizado: {formatLastUpdate(lastUpdate)}</span>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <Select value={timeRange} onValueChange={onTimeRangeChange}>
        <SelectTrigger className="h-8 w-32" aria-label="Rango de tiempo">
          <SelectValue placeholder="Rango" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="weekly">Semanal</SelectItem>
          <SelectItem value="monthly">Mensual</SelectItem>
          <SelectItem value="quarterly">Trimestral</SelectItem>
          <SelectItem value="yearly">Anual</SelectItem>
        </SelectContent>
      </Select>
      <Select value={refreshInterval} onValueChange={(v) => onRefreshIntervalChange(v as DashboardRefreshIntervalKey)}>
        <SelectTrigger className="h-8 w-36" aria-label="Intervalo de actualización">
          <SelectValue placeholder="Actualizar" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(REFRESH_INTERVAL_LABELS) as DashboardRefreshIntervalKey[]).map((key) => (
            <SelectItem key={key} value={key}>
              {REFRESH_INTERVAL_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        disabled={loading}
        className="min-w-[120px]"
      >
        <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Actualizando...' : 'Actualizar'}
      </Button>
    </div>
  </div>
) 