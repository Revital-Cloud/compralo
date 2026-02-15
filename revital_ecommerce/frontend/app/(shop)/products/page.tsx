"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { ProductsHeader, ProductsFilters, ProductsDisplay } from "@/components/products-page"
import { useFilterProducts, useFilterOptions, useFilterStats } from "@/hooks"
import type { ProductFilterParams } from "@/types/product"

const ProductsPage = () => {
  const [sortBy, setSortBy] = useState('nombre-asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const [priceRange, setPriceRange] = useState([0, 0])
  /** Una sola categoría (árbol): al filtrar se incluyen subcategorías */
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [onSaleOnly, setOnSaleOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  /** Atributos dinámicos: { "attributeId": ["Negro", "Blanco"] } */
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({})

  const { data: filterOptions, isLoading: optionsLoading } = useFilterOptions()

  const dynamicPriceRange = useMemo(() => {
    const range = filterOptions?.precio_rango ?? filterOptions?.price_range
    if (range) {
      return { min: range.minimo, max: range.maximo }
    }
    return { min: 0, max: 0 }
  }, [filterOptions])

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
      include_subcategories: true,
    }
    return {
      ...base,
      ...(inStockOnly && { solo_con_stock: true }),
      ...(selectedCategoryId != null && { category_id: selectedCategoryId }),
      ...(selectedBrands.length > 0 && { id_marca: Number(selectedBrands[0]) }),
      ...(searchQuery.trim() && { nombre_producto: searchQuery.trim() }),
      ...(priceRange[0] > dynamicPriceRange.min && { precio_min: priceRange[0] }),
      ...(priceRange[1] < dynamicPriceRange.max && !(priceRange[0] === 0 && priceRange[1] === 0) && { precio_max: priceRange[1] }),
      ...(Object.keys(selectedAttributes).length > 0 && { atributos: selectedAttributes }),
    }
  }, [
    selectedCategoryId,
    selectedBrands,
    searchQuery,
    priceRange[0],
    priceRange[1],
    dynamicPriceRange.min,
    dynamicPriceRange.max,
    inStockOnly,
    selectedAttributes,
    sortBy,
    itemsPerPage,
    currentPage,
  ])


  const hasActiveFilters = useMemo(() => {
    const priceRangeInitialized = !(priceRange[0] === 0 && priceRange[1] === 0)
    const priceFilterActive = priceRangeInitialized && (
      priceRange[0] > dynamicPriceRange.min || priceRange[1] < dynamicPriceRange.max
    )
    const hasAttributeFilters = Object.values(selectedAttributes).some((arr) => arr.length > 0)
    return (
      selectedCategoryId != null ||
      selectedBrands.length > 0 ||
      searchQuery.trim() !== '' ||
      priceFilterActive ||
      inStockOnly ||
      hasAttributeFilters
    )
  }, [
    selectedCategoryId,
    selectedBrands.length,
    searchQuery,
    priceRange[0],
    priceRange[1],
    dynamicPriceRange.min,
    dynamicPriceRange.max,
    inStockOnly,
    selectedAttributes,
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

  const clearAllFilters = useCallback(() => {
    setPriceRange([dynamicPriceRange.min, dynamicPriceRange.max])
    setSelectedCategoryId(null)
    setSelectedBrands([])
    setSelectedAttributes({})
    setInStockOnly(false)
    setSearchQuery('')
    setCurrentPage(1)
  }, [dynamicPriceRange.min, dynamicPriceRange.max])

  const handleRemoveFilter = useCallback((filterType: string, value?: string) => {
    const handlers: Record<string, () => void> = {
      category: () => setSelectedCategoryId(null),
      brands: () => setSelectedBrands((prev) => (value ? prev.filter((b) => b !== value) : [])),
      priceMin: () => setPriceRange((prev) => [dynamicPriceRange.min, prev[1]]),
      priceMax: () => setPriceRange((prev) => [prev[0], dynamicPriceRange.max]),
      inStockOnly: () => setInStockOnly(false),
      onSaleOnly: () => setOnSaleOnly(false),
      attribute: () =>
        value
          ? setSelectedAttributes((prev) => {
              const next = { ...prev }
              delete next[value]
              return next
            })
          : setSelectedAttributes({}),
    }
    handlers[filterType]?.()
  }, [dynamicPriceRange.min, dynamicPriceRange.max])

  // Los filtros se aplican automáticamente con useMemo - no necesitamos función applyFilters

  const priceRangeInitialized = !(priceRange[0] === 0 && priceRange[1] === 0)
  const priceFilterActive = priceRangeInitialized && (priceRange[0] > dynamicPriceRange.min || priceRange[1] < dynamicPriceRange.max)
  const attributeFiltersCount = Object.values(selectedAttributes).reduce((acc, arr) => acc + arr.length, 0)
  const activeFiltersCount =
    (selectedCategoryId != null ? 1 : 0) +
    selectedBrands.length +
    (inStockOnly ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (priceFilterActive ? 1 : 0) +
    attributeFiltersCount

  // Inicializar el rango de precios cuando se cargan los datos de la DB
  useEffect(() => {
    const range = filterOptions?.precio_rango ?? filterOptions?.price_range
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
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            selectedBrands={selectedBrands}
            setSelectedBrands={setSelectedBrands}
            selectedAttributes={selectedAttributes}
            setSelectedAttributes={setSelectedAttributes}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            onSaleOnly={onSaleOnly}
            setOnSaleOnly={setOnSaleOnly}
            filterOptions={filterOptions}
            optionsLoading={optionsLoading}
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
            selectedCategoryId={selectedCategoryId}
            selectedBrands={selectedBrands}
            selectedAttributes={selectedAttributes}
            inStockOnly={inStockOnly}
            onSaleOnly={onSaleOnly}
            clearAllFilters={clearAllFilters}
            onRemoveFilter={handleRemoveFilter}
            filterOptions={filterOptions}
          />
        </div>
      </div>
    </div>
  )
}

export default ProductsPage 