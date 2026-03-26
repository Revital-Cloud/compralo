import { Button, Loading } from "@/components/ui"
import { ProductGrid, ProductList } from "@/components/product"
import { EmptyProductsState } from "@/components/ui"
import { ProductsPagination } from "./products-pagination"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"

/**
 * Vista de resultados del catálogo (grid/list + estados de carga/error + paginación).
 *
 * Nota:
 * - Este componente asume que los filtros ya fueron aplicados en backend.
 */

interface ProductsDisplayProps {
  productsData: any
  productsLoading: boolean
  productsError: any
  viewMode: "grid" | "list"
  priceRange: number[]
  selectedCategoryId: number | null
  selectedBrands: string[]
  selectedAttributes: Record<string, string[]>
  clearAllFilters: () => void
  onRemoveFilter?: (filterType: string, value?: string) => void
  filterOptions?: { categorias?: { id: number; name: string }[]; marcas?: { id_marca: number; nom_marca: string }[]; attributes?: { id: number; name: string; values: string[] }[] } | null
  /** Paginación: solo se muestra si totalPages > 1 */
  currentPage?: number
  totalPages?: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange?: (page: number) => void
}

export const ProductsDisplay = ({
  productsData,
  productsLoading,
  productsError,
  viewMode,
  priceRange,
  selectedCategoryId,
  selectedBrands,
  selectedAttributes,
  clearAllFilters,
  onRemoveFilter,
  filterOptions,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 20,
  onPageChange,
}: ProductsDisplayProps) => {
  // Hook del carrito para funcionalidad real
  const { addToCart, isAddingToCart } = useCart()

  // Función real para agregar al carrito
  const handleAddToCart = async (productId: string) => {
    try {
      // Normaliza distintas formas de payload que puede devolver el endpoint.
      const getProductsToDisplay = () => {
        if (productsData?.products && Array.isArray(productsData.products)) {
          return productsData.products
        }
        if (productsData?.data && Array.isArray(productsData.data)) {
          return productsData.data
        }
        return Array.isArray(productsData) ? productsData : []
      }
      
      const allProducts = getProductsToDisplay()
      
      let product: any = null
      if (productId.includes('-')) {
        const parts = productId.split('-')
        const prodId = parts[parts.length - 1]
        product = allProducts.find((p: any) => p.id?.toString() === prodId)
        if (!product && parts.length >= 1) {
          const prodId = parts[parts.length - 1]
          product = allProducts.find((p: any) => p.id?.toString() === prodId)
        }
      }
      if (!product) {
        product = allProducts.find((p: any) => p.id?.toString() === productId)
      }
      
      if (!product) {
        toast.error('Producto no encontrado')
        return
      }

      // Verificar stock
      if ((product.num_stock || 0) <= 0) {
        toast.error('Producto agotado')
        return
      }

      const cartProductData: Parameters<typeof addToCart>[0] = {
        id_producto: Number(product.id),
        cantidad: 1,
        precio_unitario_carrito: parseFloat(((product as any).price_min?.toString() ?? product.val_precio?.toString()) || "0"),
        stock_disponible: product.num_stock ?? 0,
      }

      console.log('🛒 Agregando producto al carrito desde lista:', cartProductData)

      // Llamar al hook del carrito
      addToCart(cartProductData)
      
      // Mostrar toast de éxito
      toast.success(`${product.name} agregado al carrito`)
      
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
            {/* Información de resultados (sin banner azul de filtros activos) */}
            {filteredProducts.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {totalPages > 1 && totalItems > 0
                    ? `Mostrando ${(currentPage - 1) * itemsPerPage + 1} a ${Math.min(currentPage * itemsPerPage, totalItems)} de ${totalItems} productos`
                    : `Mostrando ${filteredProducts.length} productos`}
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
                showAddToCartButton={false}
              />
            )}

            {/* Paginación */}
            {onPageChange && totalPages > 1 && (
              <ProductsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
              />
            )}
          </>
        )}
      </div>

    </div>
  )
}
