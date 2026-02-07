import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { X, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterSuggestionsProps {
  activeFilters: {
    priceRange?: [number, number]
    categories?: string[]
    lines?: string[]
    sublines?: string[]
    brands?: string[]
    inStockOnly?: boolean
    onSaleOnly?: boolean
  }
  onRemoveFilter: (filterType: string, value?: string) => void
  onClearAll: () => void
  categoriesData?: any[]
  linesData?: any[]
  sublinesData?: any[]
  brandsData?: any[]
  className?: string
}

export const FilterSuggestions = ({
  activeFilters,
  onRemoveFilter,
  onClearAll,
  categoriesData,
  linesData,
  sublinesData,
  brandsData,
  className
}: FilterSuggestionsProps) => {
  // Funciones helper para obtener nombres reales
  const getCategoryName = (id: string) => {
    const category = categoriesData?.find(cat => cat.id?.toString() === id)
    return category?.name || `Categoría ${id}`
  }

  // Líneas usan clave compuesta "id_categoria-id_linea"
  const getLineName = (compositeKey: string) => {
    const parts = compositeKey.split('-')
    if (parts.length >= 2) {
      const [cat, lineId] = parts
      const line = linesData?.find(
        (l: { id_categoria?: number; id_linea?: number; nom_linea?: string }) =>
          String(l.id_categoria) === cat && String(l.id_linea) === lineId
      )
      return line?.nom_linea || `Línea ${compositeKey}`
    }
    const line = linesData?.find((l: { id_linea?: number }) => l.id_linea?.toString() === compositeKey)
    return line?.nom_linea || `Línea ${compositeKey}`
  }

  // Sub-líneas usan clave compuesta "id_categoria-id_linea-id_sublinea"
  const getSublineName = (compositeKey: string) => {
    const parts = compositeKey.split('-')
    if (parts.length >= 3) {
      const [cat, lineId, sublineId] = parts
      const subline = sublinesData?.find(
        (s: { id_categoria?: number; id_linea?: number; id_sublinea?: number; nom_sublinea?: string }) =>
          String(s.id_categoria) === cat && String(s.id_linea) === lineId && String(s.id_sublinea) === sublineId
      )
      return subline?.nom_sublinea || `Sub-línea ${compositeKey}`
    }
    const subline = sublinesData?.find((s: { id_sublinea?: number }) => s.id_sublinea?.toString() === compositeKey)
    return subline?.nom_sublinea || `Sub-línea ${compositeKey}`
  }

  const getBrandName = (id: string) => {
    const brand = brandsData?.find(b => b.id_marca?.toString() === id)
    return brand?.nom_marca || `Marca ${id}`
  }

  const hasActiveFilters = Object.values(activeFilters).some(value => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'boolean') return value
    return false
  })

  if (!hasActiveFilters) return null

  return (
    <div className={cn(
      "p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Filtros activos
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 h-6 px-2"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Limpiar todo
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* Precio mínimo */}
        {activeFilters.priceRange && activeFilters.priceRange[0] > 0 && (
          <Badge 
            variant="secondary" 
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            Precio mínimo: ${activeFilters.priceRange[0].toLocaleString()}
            <button
              onClick={() => onRemoveFilter('priceMin')}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {/* Precio máximo */}
        {activeFilters.priceRange && activeFilters.priceRange[1] < 10000000 && (
          <Badge 
            variant="secondary" 
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            Precio máximo: ${activeFilters.priceRange[1].toLocaleString()}
            <button
              onClick={() => onRemoveFilter('priceMax')}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {/* Categorías */}
        {activeFilters.categories?.map((category, index) => (
          <Badge 
            key={`category-${index}`}
            variant="secondary" 
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            {getCategoryName(category)}
            <button
              onClick={() => onRemoveFilter('categories', category)}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        {/* Líneas */}
        {activeFilters.lines?.map((line, index) => (
          <Badge 
            key={`line-${index}`}
            variant="secondary" 
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            {getLineName(line)}
            <button
              onClick={() => onRemoveFilter('lines', line)}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        {/* Sub-líneas */}
        {activeFilters.sublines?.map((subline, index) => (
          <Badge 
            key={`subline-${index}`}
            variant="secondary" 
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            {getSublineName(subline)}
            <button
              onClick={() => onRemoveFilter('sublines', subline)}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        {/* Marcas */}
        {activeFilters.brands?.map((brand, index) => (
          <Badge 
            key={`brand-${index}`}
            variant="secondary" 
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            {getBrandName(brand)}
            <button
              onClick={() => onRemoveFilter('brands', brand)}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        {/* Solo en stock */}
        {activeFilters.inStockOnly && (
          <Badge 
            variant="secondary" 
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            Solo en stock
            <button
              onClick={() => onRemoveFilter('inStockOnly')}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {/* Solo en oferta */}
        {activeFilters.onSaleOnly && (
          <Badge 
            variant="secondary" 
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            Solo en oferta
            <button
              onClick={() => onRemoveFilter('onSaleOnly')}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}
      </div>
    </div>
  )
}
