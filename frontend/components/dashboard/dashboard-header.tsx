'use client'

import React from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconCalendar, IconRefresh } from "@tabler/icons-react"

interface DashboardHeaderProps {
  timeRange: string
  onTimeRangeChange: (value: string) => void
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

export const DashboardHeader = ({ 
  timeRange, 
  onTimeRangeChange, 
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
    <div className="flex items-center space-x-2">
      <Select value={timeRange} onValueChange={onTimeRangeChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="weekly">Semanal</SelectItem>
          <SelectItem value="monthly">Mensual</SelectItem>
          <SelectItem value="quarterly">Trimestral</SelectItem>
          <SelectItem value="yearly">Anual</SelectItem>
        </SelectContent>
      </Select>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        disabled={loading}
        className="min-w-[100px]"
      >
        <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Actualizando...' : 'Actualizar'}
      </Button>
    </div>
  </div>
) 