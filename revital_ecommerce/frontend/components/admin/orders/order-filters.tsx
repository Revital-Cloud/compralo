'use client'

import React from 'react'
import { Input } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { Button } from "@/components/ui"
import { Calendar } from "@/components/ui"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui"
import { IconSearch, IconCalendar } from '@tabler/icons-react'
import { es } from 'date-fns/locale'
import { parseDateSafe, toLocalISOString, isFutureDate } from '@/utils/date-helpers'
import type { OrderFilters as OrderFiltersType } from '@/types/order'

interface OrderFiltersProps {
  filters: OrderFiltersType
  onFiltersChange: (filters: OrderFiltersType) => void
  onClear: () => void
}

export const OrderFilters = ({ filters, onFiltersChange, onClear }: OrderFiltersProps) => {
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
      {/* Fila principal de filtros: misma altura (h-9) para todos los controles */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por ID, cliente o email..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>

        <Select value={filters.status?.toString() || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-9 w-[180px] shrink-0">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="1">Pendiente</SelectItem>
            <SelectItem value="2">Completada</SelectItem>
            <SelectItem value="3">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="h-9 min-w-[100px] shrink-0" onClick={onClear}>
          Limpiar
        </Button>
      </div>

      {/* Fila de fechas: Calendar component */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <IconCalendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Rango de fechas:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Desde:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-[150px] justify-start text-left font-normal"
                >
                  {filters.dateFrom
                    ? parseDateSafe(filters.dateFrom)?.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) ?? filters.dateFrom
                    : 'dd/mm/aaaa'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={es}
                  captionLayout="dropdown"
                  startMonth={new Date(new Date().getFullYear() - 2, 0)}
                  endMonth={new Date()}
                  selected={parseDateSafe(filters.dateFrom) ?? undefined}
                  onSelect={(date) => handleDateFromChange(date ? toLocalISOString(date) : '')}
                  defaultMonth={parseDateSafe(filters.dateFrom) ?? undefined}
                  disabled={isFutureDate}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Hasta:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-[150px] justify-start text-left font-normal"
                >
                  {filters.dateTo
                    ? parseDateSafe(filters.dateTo)?.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) ?? filters.dateTo
                    : 'dd/mm/aaaa'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={es}
                  captionLayout="dropdown"
                  startMonth={new Date(new Date().getFullYear() - 2, 0)}
                  endMonth={new Date()}
                  selected={parseDateSafe(filters.dateTo) ?? undefined}
                  onSelect={(date) => handleDateToChange(date ? toLocalISOString(date) : '')}
                  defaultMonth={parseDateSafe(filters.dateTo) ?? undefined}
                  disabled={isFutureDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  )
}
