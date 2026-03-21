import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { X, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterSuggestionsProps {
  activeFilters: {
    priceRange?: [number, number]
    categoryId?: number
    brands?: string[]
    attributes?: Record<string, string[]>
    onSaleOnly?: boolean
  }
  onRemoveFilter: (filterType: string, value?: string) => void
  onClearAll: () => void
  filterOptions?: {
    categorias?: { id: number; name: string }[]
    marcas?: { id_marca: number; nom_marca: string }[]
    attributes?: { id: number; name: string; values: string[] }[]
  } | null
  className?: string
}

export const FilterSuggestions = ({
  activeFilters,
  onRemoveFilter,
  onClearAll,
  filterOptions,
  className,
}: FilterSuggestionsProps) => {
  const getCategoryName = (id: number) => {
    const cat = filterOptions?.categorias?.find((c) => (c as any).id === id || (c as any).id_categoria === id)
    return cat?.name ?? `Categoría ${id}`
  }

  const getBrandName = (id: string) => {
    const brand = filterOptions?.marcas?.find((b) => b.id_marca?.toString() === id)
    return brand?.nom_marca ?? `Marca ${id}`
  }

  const getAttributeName = (attrId: string) => {
    const attr = filterOptions?.attributes?.find((a) => a.id.toString() === attrId)
    return attr?.name ?? `Atributo ${attrId}`
  }

  const hasActiveFilters =
    (activeFilters.priceRange && (activeFilters.priceRange[0] > 0 || activeFilters.priceRange[1] < 10000000)) ||
    activeFilters.categoryId != null ||
    (activeFilters.brands?.length ?? 0) > 0 ||
    (activeFilters.attributes && Object.values(activeFilters.attributes).some((arr) => arr.length > 0)) ||
    activeFilters.onSaleOnly

  if (!hasActiveFilters) return null

  return (
    <div
      className={cn(
        "p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Filtros activos</h4>
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
        {activeFilters.priceRange && activeFilters.priceRange[0] > 0 && (
          <Badge
            variant="secondary"
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            Precio mín: ${activeFilters.priceRange[0].toLocaleString()}
            <button
              onClick={() => onRemoveFilter("priceMin")}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {activeFilters.priceRange && activeFilters.priceRange[1] < 10000000 && (
          <Badge
            variant="secondary"
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            Precio máx: ${activeFilters.priceRange[1].toLocaleString()}
            <button
              onClick={() => onRemoveFilter("priceMax")}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {activeFilters.categoryId != null && (
          <Badge
            variant="secondary"
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            {getCategoryName(activeFilters.categoryId)}
            <button
              onClick={() => onRemoveFilter("category")}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}

        {activeFilters.brands?.map((brandId) => (
          <Badge
            key={`brand-${brandId}`}
            variant="secondary"
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            {getBrandName(brandId)}
            <button
              onClick={() => onRemoveFilter("brands", brandId)}
              className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}

        {activeFilters.attributes &&
          Object.entries(activeFilters.attributes).map(([attrId, values]) =>
            values.length > 0 ? (
              <Badge
                key={`attr-${attrId}`}
                variant="secondary"
                className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
              >
                {getAttributeName(attrId)}: {values.join(", ")}
                <button
                  onClick={() => onRemoveFilter("attribute", attrId)}
                  className="ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ) : null
          )}

        {activeFilters.onSaleOnly && (
          <Badge
            variant="secondary"
            className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
          >
            Solo en oferta
            <button
              onClick={() => onRemoveFilter("onSaleOnly")}
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
