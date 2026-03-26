"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { ProductsHeader, ProductsFilters, ProductsDisplay } from "@/components/products-page"
import { useFilterProducts, useFilterOptions, useFilterStats } from "@/hooks"
import type { ProductFilterParams } from "@/types/product"
import { useSearchParams } from "next/navigation"

/**
 * Mapa de la página de catálogo (`/products`).
 *
 * Flujo:
 * 1) Lee estado de filtros/orden/paginación desde UI + query params iniciales.
 * 2) Construye `ProductFilterParams` y consulta backend con hooks de productos.
 * 3) Renderiza header, panel de filtros y lista/grid paginada.
 */

const computeSort = (value: string): ['precio' | 'nombre' | 'stock' | 'fecha', 'ASC' | 'DESC'] => {
  const [campo, dir] = value.split('-')
  const ordenarPor = (['precio', 'nombre', 'stock', 'fecha'].includes(campo) ? campo : 'nombre') as 'precio' | 'nombre' | 'stock' | 'fecha'
  const orden = (dir === 'desc' ? 'DESC' : 'ASC') as 'ASC' | 'DESC'
  return [ordenarPor, orden]
}

/** Contenido con estado de atributos; key por categoría resetea atributos al cambiar (sin useEffect). */
function ProductsPageInner({
  selectedCategoryId,
  setSelectedCategoryId,
  priceRange,
  setPriceRange,
  dynamicPriceRange,
  filterOptions,
  optionsLoading,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  showFilters,
  setShowFilters,
  selectedBrands,
  setSelectedBrands,
  onSaleOnly,
  setOnSaleOnly,
  searchQuery,
  setSearchQuery,
  currentPage,
  setCurrentPage,
  itemsPerPage,
}: {
  selectedCategoryId: number | null
  setSelectedCategoryId: React.Dispatch<React.SetStateAction<number | null>>
  priceRange: [number, number]
  setPriceRange: React.Dispatch<React.SetStateAction<[number, number]>>
  dynamicPriceRange: { min: number; max: number }
  filterOptions: Awaited<ReturnType<typeof useFilterOptions>>["data"]
  optionsLoading: boolean
  sortBy: string
  setSortBy: React.Dispatch<React.SetStateAction<string>>
  viewMode: 'grid' | 'list'
  setViewMode: React.Dispatch<React.SetStateAction<'grid' | 'list'>>
  showFilters: boolean
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>
  selectedBrands: string[]
  setSelectedBrands: React.Dispatch<React.SetStateAction<string[]>>
  onSaleOnly: boolean
  setOnSaleOnly: React.Dispatch<React.SetStateAction<boolean>>
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
  itemsPerPage: number
}) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({})

  const filterParams: ProductFilterParams = useMemo(() => {
    // Traduce estado UI a query params del endpoint `/products/filter`.
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
      ...(onSaleOnly && { solo_en_oferta: true }),
      ...(selectedCategoryId != null && { category_id: selectedCategoryId }),
      ...(selectedBrands.length > 0 && { id_marca: Number(selectedBrands[0]) }),
      ...(searchQuery.trim() && { nombre_producto: searchQuery.trim() }),
      // Filtrar por mínimo solo si el usuario escribe un valor > 0
      ...(priceRange[0] > 0 && { precio_min: priceRange[0] }),
      // Filtrar por máximo solo si es > 0 y menor que el máximo disponible
      ...(priceRange[1] > 0 && priceRange[1] < dynamicPriceRange.max && { precio_max: priceRange[1] }),
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
    onSaleOnly,
    selectedAttributes,
    sortBy,
    itemsPerPage,
    currentPage,
  ])

  const hasActiveFilters = useMemo(() => {
    const priceFilterActive =
      priceRange[0] > 0 ||
      (priceRange[1] > 0 && priceRange[1] < dynamicPriceRange.max)
    const hasAttributeFilters = Object.values(selectedAttributes).some((arr) => arr.length > 0)
    return (
      selectedCategoryId != null ||
      selectedBrands.length > 0 ||
      searchQuery.trim() !== '' ||
      priceFilterActive ||
      onSaleOnly ||
      hasAttributeFilters
    )
  }, [
    selectedCategoryId,
    selectedBrands.length,
    searchQuery,
      priceRange[0],
      priceRange[1],
      dynamicPriceRange.max,
    onSaleOnly,
    selectedAttributes,
  ])

  const defaultFilters = useMemo(() => {
    const [ordenar_por, orden] = computeSort(sortBy)
    return { limit: itemsPerPage, offset: (currentPage - 1) * itemsPerPage, ordenar_por, orden }
  }, [sortBy, itemsPerPage, currentPage])

  // Al cambiar filtros que afectan el resultado, volver a la página 1
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategoryId, selectedBrands, searchQuery, priceRange[0], priceRange[1], onSaleOnly, selectedAttributes])

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useFilterProducts(hasActiveFilters ? filterParams : defaultFilters)

  const emptyFilters = useMemo(() => ({} as ProductFilterParams), [])
  useFilterStats(hasActiveFilters ? filterParams : emptyFilters)

  const clearAllFilters = useCallback(() => {
    setPriceRange([0, 0])
    setSelectedCategoryId(null)
    setSelectedBrands([])
    setSelectedAttributes({})
    setOnSaleOnly(false)
    setSearchQuery('')
    setCurrentPage(1)
  }, [dynamicPriceRange.min, dynamicPriceRange.max, setPriceRange, setSelectedCategoryId, setSelectedBrands, setOnSaleOnly, setSearchQuery, setCurrentPage])

  const handleRemoveFilter = useCallback(
    (filterType: string, value?: string) => {
      const handlers: Record<string, () => void> = {
        category: () => setSelectedCategoryId(null),
        brands: () => setSelectedBrands((prev) => (value ? prev.filter((b) => b !== value) : [])),
        priceMin: () => setPriceRange([0, priceRange[1]]),
        priceMax: () => setPriceRange([priceRange[0], 0]),
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
    },
    [dynamicPriceRange.min, dynamicPriceRange.max, setSelectedCategoryId, setSelectedBrands, setPriceRange, setOnSaleOnly]
  )

  const priceFilterActive =
    priceRange[0] > 0 ||
    (priceRange[1] > 0 && priceRange[1] < dynamicPriceRange.max)
  const attributeFiltersCount = Object.values(selectedAttributes).reduce((acc, arr) => acc + arr.length, 0)
  const activeFiltersCount =
    (selectedCategoryId != null ? 1 : 0) +
    selectedBrands.length +
    (onSaleOnly ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (priceFilterActive ? 1 : 0) +
    attributeFiltersCount

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
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
          <ProductsFilters
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            priceRange={priceRange}
            setPriceRange={(range) => setPriceRange(range.length === 2 ? [range[0], range[1]] : [0, 0])}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            selectedBrands={selectedBrands}
            setSelectedBrands={setSelectedBrands}
            selectedAttributes={selectedAttributes}
            setSelectedAttributes={setSelectedAttributes}
            onSaleOnly={onSaleOnly}
            setOnSaleOnly={setOnSaleOnly}
            filterOptions={filterOptions}
            optionsLoading={optionsLoading}
            activeFiltersCount={activeFiltersCount}
            clearAllFilters={clearAllFilters}
            priceRangeOptions={dynamicPriceRange}
          />
          <ProductsDisplay
            productsData={productsData}
            productsLoading={productsLoading}
            productsError={productsError}
            viewMode={viewMode}
            priceRange={priceRange}
            selectedCategoryId={selectedCategoryId}
            selectedBrands={selectedBrands}
            selectedAttributes={selectedAttributes}
            clearAllFilters={clearAllFilters}
            onRemoveFilter={handleRemoveFilter}
            filterOptions={filterOptions}
            currentPage={currentPage}
            totalPages={productsData?.total_pages ?? 1}
            totalItems={productsData?.total ?? 0}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  )
}

const ProductsPage = () => {
  const searchParams = useSearchParams()

  const initialCategoryId = useMemo(() => {
    const value = searchParams.get("category_id")
    return value ? Number(value) : null
  }, [searchParams])

  const initialBrandId = useMemo(() => {
    const value = searchParams.get("brand_id")
    return value ? String(value) : null
  }, [searchParams])

  const [sortBy, setSortBy] = useState('nombre-asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(initialCategoryId)
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrandId ? [initialBrandId] : [])
  const [onSaleOnly, setOnSaleOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const { data: filterOptions, isLoading: optionsLoading } = useFilterOptions(selectedCategoryId)
  const dynamicPriceRange = useMemo(() => {
    const range = filterOptions?.precio_rango ?? filterOptions?.price_range
    if (range) return { min: range.minimo, max: range.maximo }
    return { min: 0, max: 0 }
  }, [filterOptions])

  return (
    <ProductsPageInner
      key={selectedCategoryId ?? 'all'}
      selectedCategoryId={selectedCategoryId}
      setSelectedCategoryId={setSelectedCategoryId}
      priceRange={priceRange}
      setPriceRange={setPriceRange}
      dynamicPriceRange={dynamicPriceRange}
      filterOptions={filterOptions}
      optionsLoading={optionsLoading}
      sortBy={sortBy}
      setSortBy={setSortBy}
      viewMode={viewMode}
      setViewMode={setViewMode}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      selectedBrands={selectedBrands}
      setSelectedBrands={setSelectedBrands}
      onSaleOnly={onSaleOnly}
      setOnSaleOnly={setOnSaleOnly}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      itemsPerPage={itemsPerPage}
    />
  )
}

export default ProductsPage 