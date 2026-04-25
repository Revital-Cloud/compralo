"use client"

import React, { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui"
import { Checkbox } from "@/components/ui"
import { Badge } from "@/components/ui"
import type { FilterOptions, CategoryTreeNode } from "@/types/product"

/**
 * Panel lateral de filtros del catálogo.
 *
 * Incluye:
 * - árbol de categorías
 * - marcas
 * - rango de precio
 * - atributos dinámicos por categoría
 * - flag "solo en oferta"
 */

interface ProductsFiltersProps {
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  priceRange: number[]
  setPriceRange: (range: number[]) => void
  selectedCategoryId: number | null
  setSelectedCategoryId: (id: number | null) => void
  selectedBrands: string[]
  setSelectedBrands: (brands: string[]) => void
  selectedAttributes: Record<string, string[]>
  setSelectedAttributes: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
  onSaleOnly: boolean
  setOnSaleOnly: (value: boolean) => void
  filterOptions: FilterOptions | null | undefined
  optionsLoading: boolean
  activeFiltersCount: number
  clearAllFilters: () => void
  priceRangeOptions?: { min: number; max: number }
}

function CategoryTreeItem({
  node,
  selectedId,
  onSelect,
  level = 0,
  expandedCategories,
  toggleExpanded,
}: {
  node: CategoryTreeNode
  selectedId: number | null
  onSelect: (id: number | null) => void
  level?: number
  expandedCategories: Set<number>
  toggleExpanded: (id: number) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedId === node.id
  const isOpen = expandedCategories.has(node.id)

  return (
    <div className="ml-0" style={{ marginLeft: level * 12 }}>
      <div className="flex items-center gap-1 py-1">
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded(node.id)
            }}
            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={isOpen ? "Cerrar" : "Abrir"}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <Checkbox
            id={`cat-${node.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => {
              onSelect(checked ? node.id : null)
            }}
          />
          <label
            htmlFor={`cat-${node.id}`}
            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer truncate"
          >
            {node.name || "Sin nombre"}
          </label>
        </div>
      </div>
      {hasChildren && isOpen && (
        <div className="space-y-0">
          {node.children!.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
              expandedCategories={expandedCategories}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const ProductsFilters = ({
  showFilters,
  setShowFilters,
  priceRange,
  setPriceRange,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedBrands,
  setSelectedBrands,
  selectedAttributes,
  setSelectedAttributes,
  onSaleOnly,
  setOnSaleOnly,
  filterOptions,
  optionsLoading,
  activeFiltersCount,
  clearAllFilters,
  priceRangeOptions,
}: ProductsFiltersProps) => {
  const tree = filterOptions?.categories_tree
  const categorias = filterOptions?.categorias ?? []
  const marcas = filterOptions?.marcas ?? []
  const attributes = filterOptions?.attributes ?? []

  // Mantiene expand/collapse del árbol de categorías entre interacciones.
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [minPriceInput, setMinPriceInput] = useState<string>("")
  const [maxPriceInput, setMaxPriceInput] = useState<string>("")

  useEffect(() => {
    // Sin valor aplicado en filtros mostramos el input vacío
    setMinPriceInput(priceRange[0] > 0 ? String(priceRange[0]) : "")
    setMaxPriceInput(priceRange[1] > 0 ? String(priceRange[1]) : "")
  }, [priceRange[0], priceRange[1]])

  const toggleExpanded = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Auto-expandir la categoría seleccionada y sus ancestros si existe
  useEffect(() => {
    if (!selectedCategoryId || !tree) return
    
    const findPath = (nodes: CategoryTreeNode[], targetId: number, path: number[] = []): number[] | null => {
      for (const node of nodes) {
        const currentPath = [...path, node.id]
        if (node.id === targetId) {
          return currentPath
        }
        if (node.children && node.children.length > 0) {
          const found = findPath(node.children, targetId, currentPath)
          if (found) return found
        }
      }
      return null
    }

    const path = findPath(tree, selectedCategoryId)
    if (path) {
      setExpandedCategories((prev) => {
        const next = new Set(prev)
        // Expandir todos los ancestros de la categoría seleccionada
        path.forEach((id) => next.add(id))
        return next
      })
    }
  }, [selectedCategoryId, tree])

  // Aplicar filtro de precio mínimo tras una pequeña pausa sin escribir
  useEffect(() => {
    if (!priceRangeOptions) return

    const timeoutId = setTimeout(() => {
      if (!minPriceInput.trim()) {
        if (priceRange[0] !== 0) {
          setPriceRange([0, priceRange[1]])
        }
        return
      }
      const raw = Number(minPriceInput)
      if (isNaN(raw)) return
      const clamped = Math.max(0, Math.min(raw, priceRange[1] || priceRangeOptions.max))
      if (clamped !== priceRange[0]) {
        setPriceRange([clamped, priceRange[1]])
      }
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [minPriceInput, priceRange, priceRangeOptions, setPriceRange])

  // Aplicar filtro de precio máximo tras una pequeña pausa sin escribir
  useEffect(() => {
    if (!priceRangeOptions) return

    const timeoutId = setTimeout(() => {
      if (!maxPriceInput.trim()) {
        if (priceRange[1] !== 0) {
          setPriceRange([priceRange[0], 0])
        }
        return
      }
      const raw = Number(maxPriceInput)
      if (isNaN(raw)) return
      const clamped = Math.min(priceRangeOptions.max, Math.max(raw, priceRange[0] || 0))
      if (clamped !== priceRange[1]) {
        setPriceRange([priceRange[0], clamped])
      }
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [maxPriceInput, priceRange, priceRangeOptions, setPriceRange])

  const toggleAttribute = (attrId: number, value: string) => {
    const idStr = String(attrId)
    setSelectedAttributes((prev: Record<string, string[]>) => {
      const current = prev[idStr] ?? []
      const next = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value]
      const nextRecord = { ...prev }
      if (next.length === 0) delete nextRecord[idStr]
      else nextRecord[idStr] = next
      return nextRecord
    })
  }

  return (
    <div
      className={`lg:w-80 lg:flex-shrink-0 lg:self-start space-y-4 ${showFilters ? "block" : "hidden md:block"}`}
    >
      {/* Bloque 1: Categoría, Marca, Precio, Ofertas (estático al hacer scroll; no se recarga al cambiar categoría) */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h3>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Limpiar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="md:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Precio */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Precio</h4>
          <div className="px-2 space-y-2">
            {priceRangeOptions ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Mín.</label>
                    <input
                      type="number"
                      value={minPriceInput}
                      placeholder="0"
                      min={0}
                      max={priceRange[1] || priceRangeOptions.max}
                      step={Math.max(1000, Math.floor((priceRangeOptions.max - priceRangeOptions.min) / 100))}
                      onChange={(e) => {
                        setMinPriceInput(e.target.value)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      onBlur={() => {
                        if (!minPriceInput.trim()) {
                          // Limpiar filtro mínimo
                          if (priceRange[0] !== 0) setPriceRange([0, priceRange[1]])
                          return
                        }
                        const raw = Number(minPriceInput)
                        if (isNaN(raw)) return
                        const clamped = Math.max(0, Math.min(raw, priceRange[1] || priceRangeOptions.max))
                        if (clamped !== priceRange[0]) {
                          setPriceRange([clamped, priceRange[1]])
                        } else {
                          // Normalizar visualmente el valor
                          setMinPriceInput(String(clamped))
                        }
                      }}
                      className="w-full h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring/50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Máx.</label>
                    <input
                      type="number"
                      value={maxPriceInput}
                      placeholder="0"
                      min={priceRange[0]}
                      max={priceRangeOptions.max}
                      step={Math.max(1000, Math.floor((priceRangeOptions.max - priceRangeOptions.min) / 100))}
                      onChange={(e) => {
                        setMaxPriceInput(e.target.value)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          e.currentTarget.blur()
                        }
                      }}
                      onBlur={() => {
                        if (!maxPriceInput.trim()) {
                          // Limpiar filtro máximo
                          if (priceRange[1] !== 0) setPriceRange([priceRange[0], 0])
                          return
                        }
                        const raw = Number(maxPriceInput)
                        if (isNaN(raw)) return
                        const clamped = Math.min(priceRangeOptions.max, Math.max(raw, priceRange[0] || 0))
                        if (clamped !== priceRange[1]) {
                          setPriceRange([priceRange[0], clamped])
                        } else {
                          setMaxPriceInput(String(clamped))
                        }
                      }}
                      className="w-full h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring/50"
                    />
                  </div>
                </div>
                {priceRangeOptions.max > 0 && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>${priceRange[0].toLocaleString()}</span>
                    <span>${priceRange[1].toLocaleString()}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500">Cargando rango de precios...</div>
            )}
          </div>
        </div>

        {/* Categoría (árbol o lista plana) - no mostrar loading al cambiar categoría, solo en carga inicial */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Categoría</h4>
          <div className="space-y-0 max-h-48 overflow-y-auto">
            {optionsLoading && !tree && categorias.length === 0 ? (
              <div className="text-sm text-gray-500">Cargando categorías...</div>
            ) : tree && tree.length > 0 ? (
              tree.map((node) => (
                <CategoryTreeItem
                  key={node.id}
                  node={node}
                  selectedId={selectedCategoryId}
                  onSelect={setSelectedCategoryId}
                  expandedCategories={expandedCategories}
                  toggleExpanded={toggleExpanded}
                />
              ))
            ) : categorias.length > 0 ? (
              categorias.map((cat) => {
                const id = cat.id ?? (cat as any).id_categoria
                const isSelected = selectedCategoryId === id
                return (
                  <div key={`cat-${id}`} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`cat-flat-${id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        setSelectedCategoryId(checked ? id : null)
                      }}
                    />
                    <label
                      htmlFor={`cat-flat-${id}`}
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {cat.name || "Sin nombre"}
                    </label>
                  </div>
                )
              })
            ) : (
              <div className="text-sm text-gray-500">No hay categorías disponibles</div>
            )}
          </div>
        </div>

        {/* Marcas */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Marcas</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {marcas.length === 0 ? (
              <div className="text-sm text-gray-500">No hay marcas disponibles</div>
            ) : (
              marcas.map((brand) => {
                const id = String(brand.id_marca)
                return (
                  <div key={`brand-${id}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${id}`}
                      checked={selectedBrands.includes(id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedBrands([...selectedBrands, id])
                        else setSelectedBrands(selectedBrands.filter((b) => b !== id))
                      }}
                    />
                    <label
                      htmlFor={`brand-${id}`}
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {brand.nom_marca || "Sin nombre"}
                    </label>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Ofertas: descuentos automáticos activos (misma regla que precios tachados en la tienda) */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Ofertas</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onSale"
                checked={onSaleOnly}
                onCheckedChange={(checked) => setOnSaleOnly(checked as boolean)}
              />
              <label htmlFor="onSale" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Solo en oferta
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bloque 2: Atributos (solo cuando hay categoría seleccionada o ya hay atributos; recarga independiente) */}
      {(selectedCategoryId != null && (attributes.length > 0 || optionsLoading)) && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Atributos</h3>
          {optionsLoading ? (
            <div className="text-sm text-gray-500">Cargando atributos...</div>
          ) : attributes.length > 0 ? (
            <div className="space-y-4">
              {attributes.map((attr) => (
                <div key={attr.id}>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{attr.name}</div>
                  <div className="space-y-1.5 pl-1">
                    {(attr.values || []).map((val) => {
                      const checked = (selectedAttributes[String(attr.id)] ?? []).includes(val)
                      return (
                        <div key={`${attr.id}-${val}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`attr-${attr.id}-${val}`}
                            checked={checked}
                            onCheckedChange={() => toggleAttribute(attr.id, val)}
                          />
                          <label
                            htmlFor={`attr-${attr.id}-${val}`}
                            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                          >
                            {val}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Esta categoría no tiene atributos para filtrar</div>
          )}
        </div>
      )}
    </div>
  )
}
