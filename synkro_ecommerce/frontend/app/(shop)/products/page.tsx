"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { ProductsHeader, ProductsFilters, ProductsDisplay } from "@/components/products-page"
import { useFilterProducts, useFilterOptions, useFilterStats, useCategories, useAllLines, useAllSublines, useBrands } from "@/hooks"
import type { ProductFilterParams } from "@/types/product"

const ProductsPage = () => {
  const [sortBy, setSortBy] = useState('nombre-asc')
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

  const computeSort = (value: string): ['precio' | 'nombre' | 'stock' | 'fecha', 'ASC' | 'DESC'] => {
    const [campo, dir] = value.split('-')
    const ordenarPor = (['precio', 'nombre', 'stock', 'fecha'].includes(campo) ? campo : 'nombre') as 'precio' | 'nombre' | 'stock' | 'fecha'
    const orden = (dir === 'desc' ? 'DESC' : 'ASC') as 'ASC' | 'DESC'
    return [ordenarPor, orden]
  }

  const filterParams: ProductFilterParams = useMemo(() => {
    const [ordenar_por, orden] = computeSort(sortBy)

    const base: ProductFilterParams = {
      ordenar_por,
      orden,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    }

    // Líneas vienen como "id_categoria-id_linea" (valor compuesto)
    // Extraer tanto categorías como líneas para filtrar correctamente
    const lineData = selectedLines.length > 0
      ? selectedLines.map((s) => {
          if (s.includes('-')) {
            const parts = s.split('-')
            return { categoria: Number(parts[0]), linea: Number(parts[1]) }
          }
          return { categoria: null, linea: Number(s) }
        }).filter((d) => !Number.isNaN(d.linea))
      : []

    const lineIds = lineData.map((d) => d.linea)
    const lineCategories = lineData.map((d) => d.categoria).filter((c) => c !== null)

    // Sublíneas vienen como "id_categoria-id_linea-id_sublinea"
    const sublineData = selectedSublines.length > 0
      ? selectedSublines.map((s) => {
          if (s.includes('-')) {
            const parts = s.split('-')
            return { categoria: Number(parts[0]), linea: Number(parts[1]), sublinea: Number(parts[2]) }
          }
          return { categoria: null, linea: null, sublinea: Number(s) }
        }).filter((d) => !Number.isNaN(d.sublinea))
      : []

    const sublineIds = sublineData.map((d) => d.sublinea)
    const sublineCategories = sublineData.map((d) => d.categoria).filter((c) => c !== null)

    // Combinar categorías: las seleccionadas explícitamente + las de líneas/sublíneas seleccionadas
    const allCategoryIds = [
      ...selectedCategories.map(Number),
      ...lineCategories,
      ...sublineCategories
    ].filter((n) => !Number.isNaN(n) && n > 0)
    const uniqueCategoryIds = [...new Set(allCategoryIds)]

    return {
      ...base,
      ...(inStockOnly && { solo_con_stock: true }),
      ...(uniqueCategoryIds.length > 0 && { id_categoria: uniqueCategoryIds.length === 1 ? uniqueCategoryIds[0] : uniqueCategoryIds }),
      ...(lineIds.length > 0 && { id_linea: lineIds.length === 1 ? lineIds[0] : [...new Set(lineIds)] }),
      ...(sublineIds.length > 0 && { id_sublinea: sublineIds.length === 1 ? sublineIds[0] : [...new Set(sublineIds)] }),
      ...(selectedBrands.length > 0 && { id_marca: selectedBrands.map(Number) }),
      ...(selectedProviders.length > 0 && { id_proveedor: selectedProviders.map(Number) }),
      ...(searchQuery.trim() && { nombre_producto: searchQuery.trim() }),
      ...(priceRange[0] > dynamicPriceRange.min && { precio_min: priceRange[0] }),
      ...(priceRange[1] < dynamicPriceRange.max && { precio_max: priceRange[1] }),
    }
  }, [
    selectedCategories,
    selectedLines,
    selectedSublines,
    selectedBrands,
    selectedProviders,
    searchQuery,
    priceRange[0],
    priceRange[1],
    dynamicPriceRange.min,
    dynamicPriceRange.max,
    inStockOnly,
    sortBy,
    itemsPerPage,
    currentPage,
  ])


  // Solo hacer llamadas si realmente hay filtros activos o es la carga inicial
  const hasActiveFilters = useMemo(() => {
    return (
      selectedCategories.length > 0 ||
      selectedLines.length > 0 ||
      selectedSublines.length > 0 ||
      selectedBrands.length > 0 ||
      selectedProviders.length > 0 ||
      searchQuery.trim() !== '' ||
      priceRange[0] > dynamicPriceRange.min ||
      priceRange[1] < dynamicPriceRange.max ||
      inStockOnly
    )
  }, [
    selectedCategories.length,
    selectedLines.length,
    selectedSublines.length,
    selectedBrands.length,
    selectedProviders.length,
    searchQuery,
    priceRange[0],
    priceRange[1],
    dynamicPriceRange.min,
    dynamicPriceRange.max,
    inStockOnly,
  ])

  // Debug desactivado para evitar ruido y re-render innecesario

  // Obtener productos filtrados - solo si hay filtros activos o es carga inicial
  const defaultFilters = useMemo(() => {
    const [ordenar_por, orden] = computeSort(sortBy)
    return { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage, ordenar_por, orden }
  }, [sortBy, itemsPerPage, currentPage])

  const { 
    data: productsData, 
    isLoading: productsLoading, 
    error: productsError 
  } = useFilterProducts(hasActiveFilters ? filterParams : defaultFilters)


  // Obtener estadísticas de filtros - solo si hay filtros activos
  const emptyFilters = useMemo(() => ({} as ProductFilterParams), [])
  const { data: filterStats } = useFilterStats(hasActiveFilters ? filterParams : emptyFilters)

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
    const handlers: Record<string, () => void> = {
      categories: () => setSelectedCategories(prev => prev.filter(cat => cat !== value)),
      lines: () => setSelectedLines(prev => prev.filter(line => line !== value)),
      sublines: () => setSelectedSublines(prev => prev.filter(subline => subline !== value)),
      brands: () => setSelectedBrands(prev => prev.filter(brand => brand !== value)),
      priceMin: () => setPriceRange(prev => [dynamicPriceRange.min, prev[1]]),
      priceMax: () => setPriceRange(prev => [prev[0], dynamicPriceRange.max]),
      inStockOnly: () => setInStockOnly(false),
      onSaleOnly: () => setOnSaleOnly(false),
    }
    handlers[filterType]?.()
  }, [dynamicPriceRange.min, dynamicPriceRange.max])

  // Los filtros se aplican automáticamente con useMemo - no necesitamos función applyFilters

  // Contar filtros activos
  const activeFiltersCount = selectedCategories.length + 
    selectedLines.length + selectedSublines.length + selectedBrands.length +
    selectedProviders.length + (inStockOnly ? 1 : 0) + 
    (searchQuery ? 1 : 0) + (priceRange[0] > dynamicPriceRange.min || priceRange[1] < dynamicPriceRange.max ? 1 : 0)

  // Inicializar el rango de precios cuando se cargan los datos de la DB
  useEffect(() => {
    const range = filterOptions?.precio_rango
    if (!range) return
    if (priceRange[0] === 0 && priceRange[1] === 0) {
      setPriceRange([range.minimo, range.maximo])
    }
  }, [filterOptions])


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