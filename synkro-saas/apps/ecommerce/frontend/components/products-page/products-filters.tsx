import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface ProductsFiltersProps {
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  priceRange: number[]
  setPriceRange: (range: number[]) => void
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
  selectedLines: string[]
  setSelectedLines: (lines: string[]) => void
  selectedSublines: string[]
  setSelectedSublines: (sublines: string[]) => void
  selectedBrands: string[]
  setSelectedBrands: (brands: string[]) => void
  inStockOnly: boolean
  setInStockOnly: (value: boolean) => void
  onSaleOnly: boolean
  setOnSaleOnly: (value: boolean) => void
  categoriesData: any
  categoriesLoading: boolean
  linesData: any
  linesLoading: boolean
  sublinesData: any
  sublinesLoading: boolean
  brandsData: any
  brandsLoading: boolean
  activeFiltersCount: number
  clearAllFilters: () => void
  priceRangeOptions?: { min: number; max: number } // Rango dinámico de la DB
}

export const ProductsFilters = ({
  showFilters,
  setShowFilters,
  priceRange,
  setPriceRange,
  selectedCategories,
  setSelectedCategories,
  selectedLines,
  setSelectedLines,
  selectedSublines,
  setSelectedSublines,
  selectedBrands,
  setSelectedBrands,
  inStockOnly,
  setInStockOnly,
  onSaleOnly,
  setOnSaleOnly,
  categoriesData,
  categoriesLoading,
  linesData,
  linesLoading,
  sublinesData,
  sublinesLoading,
  brandsData,
  brandsLoading,
  activeFiltersCount,
  clearAllFilters,
  priceRangeOptions
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
          <div className="px-2 space-y-2">
            {priceRangeOptions ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Mín.</label>
                  <input
                    type="number"
                    value={priceRange[0]}
                    min={priceRangeOptions.min}
                    max={priceRange[1]}
                    step={Math.max(1000, Math.floor((priceRangeOptions.max - priceRangeOptions.min) / 100))}
                    onChange={(e) => {
                      const raw = Number(e.target.value)
                      const clamped = isNaN(raw) ? priceRangeOptions.min : Math.max(priceRangeOptions.min, Math.min(raw, priceRange[1]))
                      if (clamped !== priceRange[0]) {
                        setPriceRange([clamped, priceRange[1]])
                      }
                    }}
                    className="w-full h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Máx.</label>
                  <input
                    type="number"
                    value={priceRange[1]}
                    min={priceRange[0]}
                    max={priceRangeOptions.max}
                    step={Math.max(1000, Math.floor((priceRangeOptions.max - priceRangeOptions.min) / 100))}
                    onChange={(e) => {
                      const raw = Number(e.target.value)
                      const clamped = isNaN(raw) ? priceRangeOptions.max : Math.min(priceRangeOptions.max, Math.max(raw, priceRange[0]))
                      if (clamped !== priceRange[1]) {
                        setPriceRange([priceRange[0], clamped])
                      }
                    }}
                    className="w-full h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Cargando rango de precios...</div>
            )}
            {priceRangeOptions && priceRangeOptions.max > 0 && priceRange[1] > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>${priceRange[0].toLocaleString()}</span>
                <span>${priceRange[1].toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Categories Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Categorías</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            
            {categoriesLoading ? (
               <div className="text-sm text-gray-500">Cargando categorías...</div>
             ) : categoriesData && categoriesData.length > 0 ? (
               // Los datos ya vienen mapeados, no necesitamos filtrar duplicados
               categoriesData.map((category: any) => {
                 // Validar que la categoría tenga un ID válido
                 if (!category || !category.id) {
                   console.log('Invalid category:', category);
                   return null;
                 }
                 
                 const categoryId = category.id.toString();
                 
                 return (
                   <div key={`category-${categoryId}`} className="flex items-center space-x-2">
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
                       {category.name || 'Sin nombre'}
                     </label>
                   </div>
                 );
               }).filter(Boolean) // Filtrar elementos null
            ) : (
              <div className="text-sm text-gray-500">
                No hay categorías disponibles
                {categoriesData && (
                  <div className="text-xs text-gray-400 mt-1">
                    Data: {JSON.stringify(categoriesData).substring(0, 100)}...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lines Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Líneas</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {linesLoading ? (
              <div className="text-sm text-gray-500">Cargando líneas...</div>
            ) : linesData && linesData.length > 0 ? (
              // Filtrar duplicados por ID antes de renderizar
              linesData
                .filter((line: any, index: number, self: any[]) => 
                  line && line.id_linea && 
                  index === self.findIndex((l: any) => l.id_linea === line.id_linea)
                )
                .map((line: any) => {
                  if (!line || !line.id_linea) {
                    return null;
                  }
                  
                  const lineId = line.id_linea.toString();
                  
                  return (
                    <div key={`line-${lineId}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`line-${lineId}`}
                        checked={selectedLines.includes(lineId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLines([...selectedLines, lineId])
                          } else {
                            setSelectedLines(selectedLines.filter(id => id !== lineId))
                          }
                        }}
                      />
                      <label
                        htmlFor={`line-${lineId}`}
                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        {line.nom_linea || 'Sin nombre'}
                      </label>
                    </div>
                  );
                }).filter(Boolean)
            ) : (
              <div className="text-sm text-gray-500">No hay líneas disponibles</div>
            )}
          </div>
        </div>

        {/* Sublines Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Sub-líneas</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sublinesLoading ? (
              <div className="text-sm text-gray-500">Cargando sub-líneas...</div>
            ) : sublinesData && sublinesData.length > 0 ? (
              // Filtrar duplicados por ID antes de renderizar
              sublinesData
                .filter((subline: any, index: number, self: any[]) => 
                  subline && subline.id_sublinea && 
                  index === self.findIndex((s: any) => s.id_sublinea === subline.id_sublinea)
                )
                .map((subline: any) => {
                  if (!subline || !subline.id_sublinea) {
                    return null;
                  }
                  
                  const sublineId = subline.id_sublinea.toString();
                  
                  return (
                    <div key={`subline-${sublineId}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subline-${sublineId}`}
                        checked={selectedSublines.includes(sublineId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSublines([...selectedSublines, sublineId])
                          } else {
                            setSelectedSublines(selectedSublines.filter(id => id !== sublineId))
                          }
                        }}
                      />
                      <label
                        htmlFor={`subline-${sublineId}`}
                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        {subline.nom_sublinea || 'Sin nombre'}
                      </label>
                    </div>
                  );
                }).filter(Boolean)
            ) : (
              <div className="text-sm text-gray-500">No hay sub-líneas disponibles</div>
            )}
          </div>
        </div>

        {/* Brands Filter */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Marcas</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {brandsLoading ? (
              <div className="text-sm text-gray-500">Cargando marcas...</div>
            ) : brandsData && brandsData.length > 0 ? (
              // Filtrar duplicados por ID antes de renderizar
              brandsData
                .filter((brand: any, index: number, self: any[]) => 
                  brand && brand.id_marca && 
                  index === self.findIndex((b: any) => b.id_marca === brand.id_marca)
                )
                .map((brand: any) => {
                  if (!brand || !brand.id_marca) {
                    return null;
                  }
                  
                  const brandId = brand.id_marca.toString();
                  
                  return (
                    <div key={`brand-${brandId}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brandId}`}
                        checked={selectedBrands.includes(brandId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedBrands([...selectedBrands, brandId])
                          } else {
                            setSelectedBrands(selectedBrands.filter(id => id !== brandId))
                          }
                        }}
                      />
                      <label
                        htmlFor={`brand-${brandId}`}
                        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        {brand.nom_marca || 'Sin nombre'}
                      </label>
                    </div>
                  );
                }).filter(Boolean)
            ) : (
              <div className="text-sm text-gray-500">No hay marcas disponibles</div>
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

        {/* Los filtros se aplican automáticamente - no necesitamos botón */}
      </div>
    </div>
  )
}
