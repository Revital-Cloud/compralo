import { Grid, List, Filter } from "lucide-react"
import { Button, Badge } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * Cabecera de catálogo: contador, ordenamiento, toggle grid/list y botón de filtros móvil.
 */

const sortOptions = [
  { value: 'nombre-asc', label: 'Nombre (A-Z)' },
  { value: 'nombre-desc', label: 'Nombre (Z-A)' },
  { value: 'precio-asc', label: 'Precio: Menor a Mayor' },
  { value: 'precio-desc', label: 'Precio: Mayor a Menor' },
  { value: 'fecha-desc', label: 'Más nuevos' }
]

interface ProductsHeaderProps {
  productsData: any
  productsLoading: boolean
  productsError: any
  sortBy: string
  setSortBy: (value: string) => void
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  activeFiltersCount: number
}

export const ProductsHeader = ({
  productsData,
  productsLoading,
  productsError,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  showFilters,
  setShowFilters,
  activeFiltersCount
}: ProductsHeaderProps) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {productsLoading ? 'Cargando productos...' :
               productsError ? 'Error al cargar productos' :
               productsData?.total > 0 ? `${productsData.total} productos encontrados` :
               productsData?.products && productsData.products.length > 0 ? `${productsData.products.length} productos encontrados` :
               Array.isArray(productsData) && productsData.length > 0 ? `${productsData.length} productos encontrados` :
               'No hay productos disponibles'}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Filter Button for Mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] sm:w-[180px] h-9">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggles */}
            <div className="hidden md:flex border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3 py-1"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3 py-1"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
