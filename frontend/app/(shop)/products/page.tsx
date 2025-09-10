"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { ProductsHeader, ProductsFilters, ProductsDisplay } from "@/components/products-page"
import { useFilterProducts, useFilterOptions, useFilterStats, useCategories, useAllLines, useAllSublines, useBrands } from "@/hooks"
import type { ProductFilterParams } from "@/types/product"

const ProductsPage = () => {
  const [sortBy, setSortBy] = useState('nombre')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  
  // Estados para filtros
  const [priceRange, setPriceRange] = useState([0, 0]) // Se inicializará con datos de la DB
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLines, setSelectedLines] = useState<string[]>([])
  const [selectedSublines, setSelectedSublines] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [onSaleOnly, setOnSaleOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Obtener opciones de filtros
  const { data: filterOptions, isLoading: optionsLoading } = useFilterOptions()
  
  // Rango de precios dinámico basado en los datos de la DB
  const dynamicPriceRange = useMemo(() => {
    if (filterOptions?.precio_rango) {
      return {
        min: filterOptions.precio_rango.minimo,
        max: filterOptions.precio_rango.maximo
      }
    }
    return { min: 0, max: 0 }
  }, [filterOptions])
  
  // Obtener datos para los componentes existentes
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const { data: linesData, isLoading: linesLoading } = useAllLines()
  const { data: sublinesData, isLoading: sublinesLoading } = useAllSublines()
  const { data: brandsData, isLoading: brandsLoading } = useBrands()

  // Construir parámetros de filtro - optimizado para evitar llamadas excesivas
  const filterParams: ProductFilterParams = useMemo(() => {
    console.log('🔄 useMemo ejecutándose - filterParams recalculado')
    const params: ProductFilterParams = {
      ordenar_por: sortBy as 'precio' | 'nombre' | 'stock' | 'fecha',
      orden: 'ASC' as 'ASC' | 'DESC',
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    }

    // Solo agregar solo_con_stock si realmente se está aplicando el filtro
    if (inStockOnly) {
      params.solo_con_stock = true
    }

    // Solo agregar filtros si tienen valores válidos
    if (selectedCategories.length > 0) {
      params.id_categoria = selectedCategories.map(Number)
    }
    if (selectedLines.length > 0) {
      params.id_linea = selectedLines.map(Number)
    }
    if (selectedSublines.length > 0) {
      params.id_sublinea = selectedSublines.map(Number)
    }
    if (selectedBrands.length > 0) {
      params.id_marca = selectedBrands.map(Number)
    }
    if (selectedProviders.length > 0) {
      params.id_proveedor = selectedProviders.map(Number)
    }
    if (searchQuery.trim()) {
      params.nombre_producto = searchQuery.trim()
    }
    if (priceRange[0] > dynamicPriceRange.min) {
      params.precio_min = priceRange[0]
    }
    if (priceRange[1] < dynamicPriceRange.max) {
      params.precio_max = priceRange[1]
    }
    
    return params
  }, [
    selectedCategories,
    selectedLines,
    selectedSublines,
    selectedBrands,
    selectedProviders,
    searchQuery,
    priceRange[0], // Descomponer el array para evitar re-renders innecesarios
    priceRange[1],
    dynamicPriceRange.min, // Incluir el rango dinámico
    dynamicPriceRange.max,
    inStockOnly,
    sortBy,
    itemsPerPage,
    currentPage
  ])


  // Solo hacer llamadas si realmente hay filtros activos o es la carga inicial
  const hasActiveFilters = selectedCategories.length > 0 || 
    selectedLines.length > 0 || 
    selectedSublines.length > 0 || 
    selectedBrands.length > 0 || 
    selectedProviders.length > 0 ||
    searchQuery.trim() !== '' || 
    priceRange[0] > dynamicPriceRange.min || 
    priceRange[1] < dynamicPriceRange.max ||
    inStockOnly

  console.log('🔍 Debug - hasActiveFilters:', hasActiveFilters, 'filterParams:', filterParams)

  // Obtener productos filtrados - solo si hay filtros activos o es carga inicial
  const { 
    data: productsData, 
    isLoading: productsLoading, 
    error: productsError 
  } = useFilterProducts(hasActiveFilters ? filterParams : {
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    ordenar_por: sortBy as 'precio' | 'nombre' | 'stock' | 'fecha',
    orden: 'ASC' as 'ASC' | 'DESC'
  })


  // Obtener estadísticas de filtros - solo si hay filtros activos
  const { data: filterStats } = useFilterStats(hasActiveFilters ? filterParams : {})

  // Función para limpiar todos los filtros - estabilizada con useCallback
  const clearAllFilters = useCallback(() => {
    setPriceRange([dynamicPriceRange.min, dynamicPriceRange.max]) // Usar rango dinámico
    setSelectedCategories([])
    setSelectedLines([])
    setSelectedSublines([])
    setSelectedBrands([])
    setSelectedProviders([])
    setInStockOnly(false)
    setSearchQuery('')
    setCurrentPage(1)
  }, [dynamicPriceRange.min, dynamicPriceRange.max])

  // Función para eliminar filtros individuales
  const handleRemoveFilter = useCallback((filterType: string, value?: string) => {
    switch (filterType) {
      case 'categories':
        setSelectedCategories(prev => prev.filter(cat => cat !== value))
        break
      case 'lines':
        setSelectedLines(prev => prev.filter(line => line !== value))
        break
      case 'sublines':
        setSelectedSublines(prev => prev.filter(subline => subline !== value))
        break
      case 'brands':
        setSelectedBrands(prev => prev.filter(brand => brand !== value))
        break
      case 'priceMin':
        setPriceRange(prev => [dynamicPriceRange.min, prev[1]])
        break
      case 'priceMax':
        setPriceRange(prev => [prev[0], dynamicPriceRange.max])
        break
      case 'inStockOnly':
        setInStockOnly(false)
        break
      case 'onSaleOnly':
        setOnSaleOnly(false)
        break
    }
  }, [dynamicPriceRange.min, dynamicPriceRange.max])

  // Los filtros se aplican automáticamente con useMemo - no necesitamos función applyFilters

  // Contar filtros activos
  const activeFiltersCount = selectedCategories.length + 
    selectedLines.length + selectedSublines.length + selectedBrands.length +
    selectedProviders.length + (inStockOnly ? 1 : 0) + 
    (searchQuery ? 1 : 0) + (priceRange[0] > dynamicPriceRange.min || priceRange[1] < dynamicPriceRange.max ? 1 : 0)

  // Inicializar el rango de precios cuando se cargan los datos de la DB
  useEffect(() => {
    if (filterOptions?.precio_rango && priceRange[0] === 0 && priceRange[1] === 0) {
      setPriceRange([
        filterOptions.precio_rango.minimo,
        filterOptions.precio_rango.maximo
      ])
    }
  }, [filterOptions, priceRange])


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
            selectedLines={selectedLines}
            setSelectedLines={setSelectedLines}
            selectedSublines={selectedSublines}
            setSelectedSublines={setSelectedSublines}
            selectedBrands={selectedBrands}
            setSelectedBrands={setSelectedBrands}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            onSaleOnly={onSaleOnly}
            setOnSaleOnly={setOnSaleOnly}
            categoriesData={categoriesData}
            categoriesLoading={categoriesLoading}
            linesData={linesData}
            linesLoading={linesLoading}
            sublinesData={sublinesData}
            sublinesLoading={sublinesLoading}
            brandsData={brandsData}
            brandsLoading={brandsLoading}
            activeFiltersCount={activeFiltersCount}
            clearAllFilters={clearAllFilters}
            priceRangeOptions={dynamicPriceRange}
          />

          {/* Main Content */}
          <ProductsDisplay
            productsData={productsData}
            productsLoading={productsLoading}
            productsError={productsError}
            viewMode={viewMode}
            priceRange={priceRange}
            selectedCategories={selectedCategories}
            selectedLines={selectedLines}
            selectedSublines={selectedSublines}
            selectedBrands={selectedBrands}
            inStockOnly={inStockOnly}
            onSaleOnly={onSaleOnly}
            clearAllFilters={clearAllFilters}
            onRemoveFilter={handleRemoveFilter}
            categoriesData={categoriesData}
            linesData={linesData}
            sublinesData={sublinesData}
            brandsData={brandsData}
          />
        </div>
      </div>
    </div>
  )
}

export default ProductsPage 