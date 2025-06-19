"use client"

import { useState, useMemo } from "react"
import { Filter, Grid, List, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ProductFilters, ProductGrid, ProductList } from "@/components/product"
import CartToast from "@/components/ui/cart-toast"
import { mockProducts, mockFilters, sortOptions } from "@/mockData/products-listing"
import { cn } from "@/lib/utils"

const ProductsPage = () => {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [sortBy, setSortBy] = useState('trending')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showCartToast, setShowCartToast] = useState(false)
  const [lastAddedProduct, setLastAddedProduct] = useState<any>(null)

  // Filter and sort logic
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...mockProducts]

    // Apply filters
    Object.entries(activeFilters).forEach(([filterType, selectedOptions]) => {
      if (selectedOptions.length > 0) {
        switch (filterType) {
          case 'price':
            filtered = filtered.filter(product => {
              return selectedOptions.some(range => {
                const [min, max] = range.split('-').map(v => v === '+' ? Infinity : parseInt(v))
                return product.price >= min && (max === undefined || product.price <= max)
              })
            })
            break
          // Add more filter logic as needed
        }
      }
    })

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'newest':
        // Assuming newer products have higher IDs
        filtered.sort((a, b) => b.id - a.id)
        break
      // 'trending' and 'bestseller' would use the default order
    }

    return filtered
  }, [activeFilters, sortBy])

  const handleFilterChange = (sectionId: string, optionId: string, checked: boolean) => {
    setActiveFilters(prev => {
      const current = prev[sectionId] || []
      if (checked) {
        return { ...prev, [sectionId]: [...current, optionId] }
      } else {
        return { ...prev, [sectionId]: current.filter(id => id !== optionId) }
      }
    })
  }

  const handleClearFilters = () => {
    setActiveFilters({})
  }

  const handleAddToCart = (productId: number) => {
    // Encontrar el producto
    const product = mockProducts.find(p => p.id === productId)
    if (product) {
      setLastAddedProduct(product)
      setShowCartToast(true)
    }
    console.log(`Agregado al carrito: ${productId}`)
    // Aquí iría la lógica para agregar al carrito
  }

  const handleToggleFavorite = (productId: number) => {
    console.log(`Toggle favorito: ${productId}`)
    // Aquí iría la lógica para agregar/quitar de favoritos
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).flat().length
  }

  const handleViewCart = () => {
    // Navegar al carrito
    console.log("Navegar al carrito")
    setShowCartToast(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{filteredAndSortedProducts.length} productos encontrados</p>
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
        <div className="lg:flex lg:gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-6">
              <ProductFilters
                filters={mockFilters}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full lg:flex-1 min-w-0">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                    {getActiveFilterCount() > 0 && (
                      <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 max-w-[90vw]">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <ProductFilters
                      filters={mockFilters}
                      activeFilters={activeFilters}
                      onFilterChange={handleFilterChange}
                      onClearFilters={handleClearFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Products Display */}
            <div className="w-full">
              {viewMode === 'grid' ? (
                <ProductGrid
                  products={filteredAndSortedProducts}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleToggleFavorite}
                />
              ) : (
                <ProductList
                  products={filteredAndSortedProducts}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}
            </div>

            {/* Pagination */}
            <div className="mt-8 md:mt-12 flex justify-center overflow-x-auto">
              <div className="flex items-center gap-1 md:gap-2 min-w-max px-4">
                <Button variant="outline" size="sm" disabled className="flex-shrink-0">
                  ← Anterior
                </Button>
                <Button variant="default" size="sm" className="flex-shrink-0">1</Button>
                <Button variant="outline" size="sm" className="flex-shrink-0">2</Button>
                <Button variant="outline" size="sm" className="flex-shrink-0">3</Button>
                <span className="px-1 md:px-2 text-gray-500 flex-shrink-0">...</span>
                <Button variant="outline" size="sm" className="flex-shrink-0">10</Button>
                <Button variant="outline" size="sm" className="flex-shrink-0">
                  Siguiente →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Toast */}
      {lastAddedProduct && (
        <CartToast
          isVisible={showCartToast}
          productName={lastAddedProduct.name}
          productImage={lastAddedProduct.image}
          price={lastAddedProduct.price}
          onClose={() => setShowCartToast(false)}
          onViewCart={handleViewCart}
        />
      )}
    </div>
  )
}

export default ProductsPage 