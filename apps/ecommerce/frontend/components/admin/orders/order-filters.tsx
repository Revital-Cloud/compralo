'use client'

import React from 'react'
import { Input } from '@repo/ui'
import { Select } from '@repo/ui'
import { Button } from '@repo/ui'
import { IconSearch, IconFilter, IconCalendar } from '@tabler/icons-react'
import type { OrderFilters } from '@/types/order'

interface OrderFiltersProps {
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
  onSearch: () => void
  onClear: () => void
}

export const OrderFilters = ({ filters, onFiltersChange, onSearch, onClear }: OrderFiltersProps) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleStatusChange = (value: string) => {
    const status = value === 'all' ? undefined : parseInt(value)
    onFiltersChange({ ...filters, status })
  }

  const handleDateFromChange = (value: string) => {
    onFiltersChange({ ...filters, dateFrom: value })
  }

  const handleDateToChange = (value: string) => {
    onFiltersChange({ ...filters, dateTo: value })
  }

  return (
    <div className="space-y-4">
      {/* Fila principal de filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, cliente o email..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={filters.status?.toString() || 'all'} onChange={(e) => handleStatusChange(e.target.value)} className="w-[180px]">
          <option value="all">Todos los estados</option>
          <option value="1">Pendiente</option>
          <option value="2">Completada</option>
          <option value="3">Cancelada</option>
        </Select>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onSearch}>
            <IconFilter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
          <Button variant="outline" onClick={onClear}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Fila de fechas */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <IconCalendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Rango de fechas:</span>
        </div>
        
        <div className="flex gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Desde:</label>
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="w-[150px]"
            />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Hasta:</label>
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="w-[150px]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
