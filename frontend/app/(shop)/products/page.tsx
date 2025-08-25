"use client"

import { useState } from "react"
import { ProductsHeader, ProductsFilters, ProductsDisplay } from "@/components/products-page"
import { useProducts } from "@/hooks/use-products"
import { useCategories } from "@/hooks/use-categories"

const ProductsPage = () => {
  const [sortBy, setSortBy] = useState('trending')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  
  // Estados para filtros
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [onSaleOnly, setOnSaleOnly] = useState(false)

  // Obtener productos y categorías del API
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts()
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setPriceRange([0, 10000])
    setSelectedCategories([])
    setInStockOnly(false)
    setOnSaleOnly(false)
  }

  // Función para aplicar filtros
  const applyFilters = () => {
    console.log('Aplicando filtros:', {
      priceRange,
      selectedCategories,
      inStockOnly,
      onSaleOnly
    })
    // Aquí implementarías la lógica de filtrado
  }

  // Contar filtros activos
  const activeFiltersCount = selectedCategories.length + 
    (inStockOnly ? 1 : 0) + (onSaleOnly ? 1 : 0) + 
    (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header Section */}
      <ProductsHeader
        productsData={productsData}
        productsLoading={productsLoading}
        productsError={productsError}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <ProductsFilters
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            onSaleOnly={onSaleOnly}
            setOnSaleOnly={setOnSaleOnly}
            categoriesData={categoriesData}
            categoriesLoading={categoriesLoading}
            activeFiltersCount={activeFiltersCount}
            clearAllFilters={clearAllFilters}
            applyFilters={applyFilters}
          />

          {/* Main Content */}
          <ProductsDisplay
            productsData={productsData}
            productsLoading={productsLoading}
            productsError={productsError}
            viewMode={viewMode}
            priceRange={priceRange}
            selectedCategories={selectedCategories}
            inStockOnly={inStockOnly}
            onSaleOnly={onSaleOnly}
            clearAllFilters={clearAllFilters}
          />
        </div>
      </div>
    </div>
  )
}

export default ProductsPage 