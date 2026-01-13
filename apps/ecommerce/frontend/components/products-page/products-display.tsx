import { Button } from "@repo/ui"
import Loading from "@repo/ui"
import { ProductGrid, ProductList } from "@/components/product"
import { EmptyProductsState } from "@repo/ui"
import { FilterSuggestions } from "@repo/ui"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"

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
  onRemoveFilter?: (filterType: string, value?: string) => void
  categoriesData?: any[]
  linesData?: any[]
  sublinesData?: any[]
  brandsData?: any[]
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
  clearAllFilters,
  onRemoveFilter,
  categoriesData,
  linesData,
  sublinesData,
  brandsData
}: ProductsDisplayProps) => {
  // Hook del carrito para funcionalidad real
  const { addToCart, isAddingToCart } = useCart()

  // Función real para agregar al carrito
  const handleAddToCart = async (productId: string) => {
    try {
      // Buscar el producto en la lista
      const product = productsData?.data?.find((p: any) => p.id_producto.toString() === productId)
      
      if (!product) {
        toast.error('Producto no encontrado')
        return
      }

      // Verificar stock
      if (product.num_stock <= 0) {
        toast.error('Producto agotado')
        return
      }

      // Preparar datos del producto para el carrito
      const cartProductData = {
        id_categoria_producto: product.id_categoria_producto || 1,
        id_linea_producto: product.id_linea_producto || 1, 
        id_sublinea_producto: product.id_sublinea_producto || 1,
        id_producto: product.id_producto,
        cantidad: 1,
        precio_unitario_carrito: parseFloat(product.val_precio.toString()),
        stock_disponible: product.num_stock // Pasar stock para validación
      }

      console.log('🛒 Agregando producto al carrito desde grid:', cartProductData)

      // Llamar al hook del carrito
      addToCart(cartProductData)
      
      // Mostrar toast de éxito
      toast.success(`${product.nom_producto} agregado al carrito`)
      
    } catch (error) {
      console.error('❌ Error al agregar producto al carrito:', error)
      toast.error('Error al agregar producto al carrito')
    }
  }

  const handleToggleFavorite = (productId: string) => {
    // Funcionalidad implementada en product-grid.tsx y product-list.tsx con useFavorites
    console.log(`Toggle favorito: ${productId}`)
  }

  // Función para manejar la eliminación de filtros individuales
  const handleRemoveFilter = (filterType: string, value?: string) => {
    if (onRemoveFilter) {
      onRemoveFilter(filterType, value)
    } else {
      console.log(`Remover filtro: ${filterType}`, value)
    }
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
      // Nota: Este filtro se aplica en el backend, aquí es solo para mostrar información
      if (priceRange[1] < 10000000 && productPrice > priceRange[1]) {
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
    // Los datos del endpoint de filtros vienen como { products: [], total: number, ... }
    if (productsData?.products && Array.isArray(productsData.products)) {
      return productsData.products
    }
    // Fallback para datos que vienen como array directo
    return Array.isArray(productsData) ? productsData : []
  }

  const allProducts = getProductsToDisplay()
  // Los filtros ya se aplicaron en el backend, no necesitamos filtrar de nuevo
  const filteredProducts = allProducts

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
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="mb-6 p-4 rounded-full bg-red-100 dark:bg-red-900/20">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Error al cargar productos
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Ocurrió un problema al cargar los productos. Por favor, intenta de nuevo o contacta con soporte si el problema persiste.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button onClick={() => window.location.reload()}>
                  Recargar página
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/products'}>
                  Volver a productos
                </Button>
              </div>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyProductsState 
            hasFilters={productsData?.total && productsData.total > 0}
            onClearFilters={clearAllFilters}
          />
        ) : (
          <>
            {/* Filtros activos info - Solo mostrar si hay productos */}
            {filteredProducts.length > 0 && (
              <div className="mb-6 space-y-4">
                <FilterSuggestions
                  activeFilters={{
                    priceRange: priceRange[0] > 0 || priceRange[1] < 10000000 ? [priceRange[0], priceRange[1]] as [number, number] : undefined,
                    categories: selectedCategories,
                    lines: selectedLines,
                    sublines: selectedSublines,
                    brands: selectedBrands,
                    inStockOnly,
                    onSaleOnly
                  }}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={clearAllFilters}
                  categoriesData={categoriesData}
                  linesData={linesData}
                  sublinesData={sublinesData}
                  brandsData={brandsData}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Mostrando {filteredProducts.length} productos
                </p>
              </div>
            )}

            {/* Products Grid/List */}
            {viewMode === 'grid' ? (
              <ProductGrid
                products={filteredProducts}
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

    </div>
  )
}
