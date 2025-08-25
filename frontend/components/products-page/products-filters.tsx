import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface ProductsFiltersProps {
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  priceRange: number[]
  setPriceRange: (range: number[]) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  inStockOnly: boolean
  setInStockOnly: (value: boolean) => void
  onSaleOnly: boolean
  setOnSaleOnly: (value: boolean) => void
  categoriesData: any
  categoriesLoading: boolean
  activeFiltersCount: number
  clearAllFilters: () => void
  applyFilters: () => void
}

export const ProductsFilters = ({
  showFilters,
  setShowFilters,
  priceRange,
  setPriceRange,
  selectedCategories,
  setSelectedCategories,
  inStockOnly,
  setInStockOnly,
  onSaleOnly,
  setOnSaleOnly,
  categoriesData,
  categoriesLoading,
  activeFiltersCount,
  clearAllFilters,
  applyFilters
}: ProductsFiltersProps) => {
  return (
    <div className={`lg:w-80 lg:flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-4">
        {/* Filters Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h3>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Limpiar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="md:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Rango de Precio</h4>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={10000}
              min={0}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Categorías</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {categoriesLoading ? (
              <div className="text-sm text-gray-500">Cargando categorías...</div>
            ) : categoriesData && categoriesData.length > 0 ? (
              categoriesData.map((category: any) => {
                // Validar que la categoría tenga un ID válido
                if (!category || !category.id_categoria) {
                  return null;
                }
                
                const categoryId = category.id_categoria.toString();
                
                return (
                  <div key={categoryId} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${categoryId}`}
                      checked={selectedCategories.includes(categoryId)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, categoryId])
                        } else {
                          setSelectedCategories(selectedCategories.filter(id => id !== categoryId))
                        }
                      }}
                    />
                    <label
                      htmlFor={`category-${categoryId}`}
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {category.nom_categoria || 'Sin nombre'}
                    </label>
                  </div>
                );
              }).filter(Boolean) // Filtrar elementos null
            ) : (
              <div className="text-sm text-gray-500">No hay categorías disponibles</div>
            )}
          </div>
        </div>

        {/* Stock and Sale Filters */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Disponibilidad</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={inStockOnly}
                onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
              />
              <label
                htmlFor="inStock"
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Solo en stock
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onSale"
                checked={onSaleOnly}
                onCheckedChange={(checked) => setOnSaleOnly(checked as boolean)}
              />
              <label
                htmlFor="onSale"
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Solo en oferta
              </label>
            </div>
          </div>
        </div>

        {/* Apply Filters Button */}
        <Button
          onClick={applyFilters}
          className="w-full"
          disabled={activeFiltersCount === 0}
        >
          Aplicar Filtros
        </Button>
      </div>
    </div>
  )
}
