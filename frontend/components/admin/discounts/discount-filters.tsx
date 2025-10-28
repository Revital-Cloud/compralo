'use client'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

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
      <Select
        value={filterType}
        onChange={(e) => onFilterTypeChange(e.target.value as any)}
        className="max-w-[200px]"
      >
        <option value="all">Todos los tipos</option>
        <option value="porcentaje">Porcentaje</option>
        <option value="monto_fijo">Monto Fijo</option>
      </Select>
      <Select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value as any)}
        className="max-w-[200px]"
      >
        <option value="nombre">Ordenar por nombre</option>
        <option value="fecha">Ordenar por fecha</option>
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

