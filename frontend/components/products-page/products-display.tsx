import { Button } from "@/components/ui/button"
import Loading from "@/components/ui/loading"
import { ProductGrid, ProductList } from "@/components/product"
import { formatPrice } from "@/utils/format-price"

interface ProductsDisplayProps {
  productsData: any
  productsLoading: boolean
  productsError: any
  viewMode: 'grid' | 'list'
  priceRange: number[]
  selectedCategories: string[]
  selectedLines: string[]
  selectedSublines: string[]
  selectedBrands: string[]
  inStockOnly: boolean
  onSaleOnly: boolean
  clearAllFilters: () => void
}

export const ProductsDisplay = ({
  productsData,
  productsLoading,
  productsError,
  viewMode,
  priceRange,
  selectedCategories,
  selectedLines,
  selectedSublines,
  selectedBrands,
  inStockOnly,
  onSaleOnly,
  clearAllFilters
}: ProductsDisplayProps) => {
  // Funciones simples para manejar acciones
  const handleAddToCart = (productId: string) => {
    console.log(`Agregado al carrito: ${productId}`)
  }

  const handleToggleFavorite = (productId: string) => {
    console.log(`Toggle favorito: ${productId}`)
  }

  // Función para aplicar filtros a los productos
  const getFilteredProducts = (products: any[]) => {
    if (!products || !Array.isArray(products)) return []
    
    return products.filter(product => {
      // Filtro por precio - convertir string a número y aplicar filtros solo si están activos
      const productPrice = parseFloat(product.val_precio) || 0
      
      // Solo aplicar filtro de precio mínimo si el usuario lo ha modificado
      if (priceRange[0] > 0 && productPrice < priceRange[0]) {
        return false
      }
      
      // Solo aplicar filtro de precio máximo si el usuario lo ha modificado
      if (priceRange[1] < 10000 && productPrice > priceRange[1]) {
        return false
      }
      
      // Filtro por categoría
      if (selectedCategories.length > 0) {
        const productCategory = product.id_categoria?.toString()
        if (!productCategory || !selectedCategories.includes(productCategory)) {
          return false
        }
      }
      
      // Filtro por línea
      if (selectedLines.length > 0) {
        const productLine = product.id_linea?.toString()
        if (!productLine || !selectedLines.includes(productLine)) {
          return false
        }
      }
      
      // Filtro por sub-línea
      if (selectedSublines.length > 0) {
        const productSubline = product.id_sublinea?.toString()
        if (!productSubline || !selectedSublines.includes(productSubline)) {
          return false
        }
      }
      
      // Filtro por marca
      if (selectedBrands.length > 0) {
        const productBrand = product.id_marca?.toString()
        if (!productBrand || !selectedBrands.includes(productBrand)) {
          return false
        }
      }
      
      // Filtro por stock - usar num_stock en lugar de stock_cantidad
      if (inStockOnly && (product.num_stock || 0) <= 0) {
        return false
      }
      
      // Filtro por oferta (por ahora deshabilitado ya que no hay campo descuento)
      // if (onSaleOnly && !product.descuento && product.descuento !== 0) {
      //   return false
      // }
      
      return true
    })
  }

  // Obtener productos filtrados
  const getProductsToDisplay = () => {
    // Los datos vienen como array directo
    return Array.isArray(productsData) ? productsData : []
  }

  const allProducts = getProductsToDisplay()
  const filteredProducts = getFilteredProducts(allProducts)

  return (
    <div className="flex-1 min-w-0">
      {/* Products Display */}
      <div className="w-full">
        {productsLoading ? (
          <Loading 
            size="lg" 
            variant="spinner" 
            text="Cargando productos..." 
          />
        ) : productsError ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Error al cargar los productos. Por favor, intenta de nuevo.
            </p>
            <Button onClick={() => window.location.reload()}>
              Recargar página
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {allProducts.length === 0 ? 'No hay productos disponibles.' : 'No hay productos que coincidan con los filtros aplicados.'}
            </p>
            {allProducts.length > 0 && (
              <Button variant="outline" onClick={clearAllFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Filtros activos info */}
            {(priceRange[0] > 0 || priceRange[1] < 10000 || selectedCategories.length > 0 || inStockOnly || onSaleOnly) && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  Mostrando {filteredProducts.length} de {allProducts.length} productos
                </p>
                <div className="flex flex-wrap gap-2">
                  {priceRange[0] > 0 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      Precio mínimo: {formatPrice(priceRange[0])}
                    </span>
                  )}
                  {priceRange[1] < 10000 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      Precio máximo: {formatPrice(priceRange[1])}
                    </span>
                  )}
                  {selectedCategories.length > 0 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {selectedCategories.length} categoría{selectedCategories.length > 1 ? 's' : ''} seleccionada{selectedCategories.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {inStockOnly && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      Solo en stock
                    </span>
                  )}
                  {onSaleOnly && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      Solo en oferta
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Products Grid/List */}
            {viewMode === 'grid' ? (
              <ProductGrid
                products={filteredProducts}
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : (
              <ProductList
                products={filteredProducts}
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
              />
            )}
          </>
        )}
      </div>

      {/* Pagination - Solo si hay datos paginados */}
      {productsData && productsData.total && productsData.total > productsData.limit && (
        <div className="mt-8 md:mt-12 flex justify-center overflow-x-auto">
          <div className="flex items-center gap-1 md:gap-2 min-w-max px-4">
            <Button variant="outline" size="sm" disabled={productsData.page <= 1} className="flex-shrink-0">
              ← Anterior
            </Button>
            <Button variant="default" size="sm" className="flex-shrink-0">{productsData.page}</Button>
            <Button variant="outline" size="sm" disabled={productsData.page >= productsData.pages} className="flex-shrink-0">
              Siguiente →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
