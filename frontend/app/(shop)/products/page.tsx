"use client"

import { useState } from "react"
import { Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loading } from "@/components/ui"
import { ProductGrid, ProductList } from "@/components/product"
import { useProducts } from "@/hooks/use-products"

const sortOptions = [
  { value: 'trending', label: 'Tendencia' },
  { value: 'newest', label: 'Más nuevos' },
  { value: 'price-low', label: 'Precio: Menor a Mayor' },
  { value: 'price-high', label: 'Precio: Mayor a Menor' },
  { value: 'rating', label: 'Mejor calificación' }
]

const ProductsPage = () => {
  const [sortBy, setSortBy] = useState('trending')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Obtener productos del API
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts()

  // Funciones simples para manejar acciones
  const handleAddToCart = (productId: string) => {
    console.log(`Agregado al carrito: ${productId}`)
  }

  const handleToggleFavorite = (productId: string) => {
    console.log(`Toggle favorito: ${productId}`)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                 {productsLoading ? 'Cargando productos...' :
                  productsError ? 'Error al cargar productos' :
                  Array.isArray(productsData) ? `${productsData.length} productos encontrados` :
                  productsData?.items ? `${productsData.items.length} productos encontrados` :
                  productsData ? '1 producto encontrado' : '0 productos encontrados'}
               </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] sm:w-[180px]">
                  <SelectValue />
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

      <div className="container mx-auto px-4 py-4 md:py-6">
        {/* Main Content */}
        <div className="w-full">
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
            ) : Array.isArray(productsData) ? (
               // Si productsData es un array directo
               productsData.length === 0 ? (
                 <div className="text-center py-12">
                   <p className="text-gray-600 dark:text-gray-400">
                     No hay productos disponibles.
                   </p>
                 </div>
               ) : viewMode === 'grid' ? (
                 <ProductGrid
                   products={productsData}
                   onAddToCart={handleAddToCart}
                   onToggleFavorite={handleToggleFavorite}
                 />
               ) : (
                 <ProductList
                   products={productsData}
                   onAddToCart={handleAddToCart}
                   onToggleFavorite={handleToggleFavorite}
                 />
               )
             ) : productsData?.items ? (
               // Si productsData tiene estructura paginada
               productsData.items.length === 0 ? (
                 <div className="text-center py-12">
                   <p className="text-gray-600 dark:text-gray-400">
                     No hay productos disponibles.
                   </p>
                 </div>
               ) : viewMode === 'grid' ? (
                 <ProductGrid
                   products={productsData.items}
                   onAddToCart={handleAddToCart}
                   onToggleFavorite={handleToggleFavorite}
                 />
               ) : (
                 <ProductList
                   products={productsData.items}
                   onAddToCart={handleAddToCart}
                   onToggleFavorite={handleToggleFavorite}
                 />
               )
             ) : (
               // Si productsData es un producto individual, lo convertimos a array
               <div className="w-full">
                 {viewMode === 'grid' ? (
                   <ProductGrid
                     products={productsData && !Array.isArray(productsData) && !productsData.items ? [productsData as any] : []}
                     onAddToCart={handleAddToCart}
                     onToggleFavorite={handleToggleFavorite}
                   />
                 ) : (
                   <ProductList
                     products={productsData && !Array.isArray(productsData) && !productsData.items ? [productsData as any] : []}
                     onAddToCart={handleAddToCart}
                     onToggleFavorite={handleToggleFavorite}
                   />
                 )}
               </div>
             )}
          </div>

          {/* Pagination - Simulado por ahora */}
          {productsData && productsData.total > productsData.limit && (
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
      </div>

    </div>
  )
}

export default ProductsPage 