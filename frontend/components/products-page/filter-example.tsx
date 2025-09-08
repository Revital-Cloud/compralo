/**
 * Ejemplo de uso del sistema de filtros de productos
 * 
 * Este componente muestra cómo usar los nuevos hooks de filtros
 * con la función de base de datos fun_filter_products
 */

"use client"

import { useState, useMemo } from 'react'
import { useFilterProducts, useFilterOptions, useFilterStats, useQuickSearch } from '@/hooks'
import type { ProductFilterParams } from '@/types/product'

export const FilterExample = () => {
  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [selectedBrand, setSelectedBrand] = useState<number | undefined>()
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'precio' | 'nombre' | 'stock' | 'fecha'>('nombre')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Obtener opciones de filtros
  const { data: filterOptions, isLoading: optionsLoading } = useFilterOptions()

  // Construir parámetros de filtro
  const filterParams: ProductFilterParams = useMemo(() => ({
    id_categoria: selectedCategory,
    id_marca: selectedBrand,
    nombre_producto: searchQuery || undefined,
    precio_min: priceRange[0] > 0 ? priceRange[0] : undefined,
    precio_max: priceRange[1] < 1000 ? priceRange[1] : undefined,
    solo_con_stock: inStockOnly,
    ordenar_por: sortBy,
    orden: 'ASC',
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  }), [
    selectedCategory,
    selectedBrand,
    searchQuery,
    priceRange,
    inStockOnly,
    sortBy,
    itemsPerPage,
    currentPage
  ])

  // Obtener productos filtrados
  const { 
    data: productsData, 
    isLoading: productsLoading, 
    error: productsError 
  } = useFilterProducts(filterParams)

  // Obtener estadísticas
  const { data: filterStats } = useFilterStats(filterParams)

  // Búsqueda rápida
  const { data: quickSearchResults } = useQuickSearch(searchQuery, 5)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sistema de Filtros de Productos</h1>
      
      {/* Búsqueda rápida */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Búsqueda rápida:</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {quickSearchResults && quickSearchResults.products.length > 0 && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">Resultados de búsqueda rápida:</p>
            <ul className="text-sm">
              {quickSearchResults.products.slice(0, 3).map((product) => (
                <li key={product.id_producto} className="py-1">
                  {product.nom_producto} - ${product.val_precio}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Categoría */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Categoría:</label>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={optionsLoading}
          >
            <option value="">Todas las categorías</option>
            {filterOptions?.categorias.map((category) => (
              <option key={category.id_categoria} value={category.id_categoria}>
                {category.nom_categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Marca */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Marca:</label>
          <select
            value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={optionsLoading}
          >
            <option value="">Todas las marcas</option>
            {filterOptions?.marcas.map((brand) => (
              <option key={brand.id_marca} value={brand.id_marca}>
                {brand.nom_marca}
              </option>
            ))}
          </select>
        </div>

        {/* Ordenar por */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Ordenar por:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="nombre">Nombre</option>
            <option value="precio">Precio</option>
            <option value="stock">Stock</option>
            <option value="fecha">Fecha</option>
          </select>
        </div>
      </div>

      {/* Rango de precios */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Rango de precios: ${priceRange[0]} - ${priceRange[1]}
        </label>
        <div className="flex space-x-4">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Precio mínimo"
          />
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Precio máximo"
          />
        </div>
      </div>

      {/* Filtros adicionales */}
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="mr-2"
          />
          Solo productos con stock
        </label>
      </div>

      {/* Estadísticas */}
      {filterStats && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="font-medium text-blue-900 mb-2">Estadísticas de filtros:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total productos:</span>
              <span className="ml-2 font-medium">{filterStats.total_productos}</span>
            </div>
            <div>
              <span className="text-blue-700">Precio mínimo:</span>
              <span className="ml-2 font-medium">${filterStats.precio_minimo || 0}</span>
            </div>
            <div>
              <span className="text-blue-700">Precio máximo:</span>
              <span className="ml-2 font-medium">${filterStats.precio_maximo || 0}</span>
            </div>
            <div>
              <span className="text-blue-700">Stock total:</span>
              <span className="ml-2 font-medium">{filterStats.total_stock}</span>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Productos encontrados: {productsData?.total || 0}
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Lista de productos */}
        {productsLoading ? (
          <div className="text-center py-8">Cargando productos...</div>
        ) : productsError ? (
          <div className="text-center py-8 text-red-600">
            Error al cargar productos: {productsError.message}
          </div>
        ) : productsData?.products.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No se encontraron productos con los filtros aplicados
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsData?.products.map((product) => (
              <div key={product.id_producto} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-lg">{product.nom_producto}</h3>
                <p className="text-gray-600 text-sm">{product.nom_categoria} - {product.nom_marca}</p>
                <p className="text-green-600 font-semibold">${product.val_precio}</p>
                <p className="text-sm text-gray-500">
                  Stock: {product.num_stock} unidades
                </p>
                <p className="text-xs text-gray-400">
                  Proveedor: {product.nom_proveedor}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {productsData && productsData.total_pages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm">
              Página {currentPage} de {productsData.total_pages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(productsData.total_pages, currentPage + 1))}
              disabled={currentPage === productsData.total_pages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterExample
