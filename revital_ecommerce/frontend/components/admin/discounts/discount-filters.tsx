'use client'

import { Input } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { Button } from "@/components/ui"

interface DiscountFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  filterType: 'all' | 'porcentaje' | 'monto_fijo'
  onFilterTypeChange: (value: 'all' | 'porcentaje' | 'monto_fijo') => void
  sortBy: 'nombre' | 'fecha'
  onSortByChange: (value: 'nombre' | 'fecha') => void
  sortOrder: 'ASC' | 'DESC'
  onSortOrderToggle: () => void
}

export const DiscountFilters: React.FC<DiscountFiltersProps> = ({
  search,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Input
        placeholder="Buscar por nombre, descripción o código..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      <Select value={filterType} onValueChange={(v) => onFilterTypeChange(v as 'all' | 'porcentaje' | 'monto_fijo')}>
        <SelectTrigger className="max-w-[200px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="porcentaje">Porcentaje</SelectItem>
          <SelectItem value="monto_fijo">Monto Fijo</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortBy} onValueChange={(v) => onSortByChange(v as 'nombre' | 'fecha')}>
        <SelectTrigger className="max-w-[200px]">
          <SelectValue placeholder="Ordenar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nombre">Ordenar por nombre</SelectItem>
          <SelectItem value="fecha">Ordenar por fecha</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        onClick={onSortOrderToggle}
      >
        {sortOrder === 'ASC' ? '↑ Ascendente' : '↓ Descendente'}
      </Button>
    </div>
  )
}

