import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  className?: string
}

export const FilterSuggestions = ({
  activeFilters,
  onRemoveFilter,
  onClearAll,
  className
}: FilterSuggestionsProps) => {
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
            Categoría: {category}
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
            Línea: {line}
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
            Sub-línea: {subline}
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
            Marca: {brand}
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
