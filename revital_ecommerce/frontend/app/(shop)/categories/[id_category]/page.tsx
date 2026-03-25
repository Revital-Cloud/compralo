"use client"

import { createElement, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCategory, useCategoriesRaw } from '@/hooks/use-categories'
import { useFilterProducts } from '@/hooks/use-products'
import { getIconForCategory } from '@/utils/category-mapper'
import { ArrowLeft, Package } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CategoryCard } from '@/components/cards/CategoryCard'
import { ProductCard } from '@/components/cards/ProductCard'
import type { Category } from '@/types/category'
const CARDS_PER_PAGE = 16 // 4x4 grid para Líneas/Sublíneas

/** Conteo recursivo: productos en esta categoría + todos los descendientes */
function useRecursiveProductCounts(categories: Category[]): Map<number, number> {
  return useMemo(() => {
    const map = new Map<number, number>()
    const list = categories ?? []
    const direct = new Map<number, number>()
    list.forEach((c) => direct.set(Number(c.id), c.productos_count ?? 0))

    function getTotal(id: number): number {
      const cached = map.get(id)
      if (cached !== undefined) return cached
      const directCount = direct.get(id) ?? 0
      const children = list.filter((c) => Number(c.parent_id) === id)
      const childrenTotal = children.reduce((sum, ch) => sum + getTotal(Number(ch.id)), 0)
      const total = directCount + childrenTotal
      map.set(id, total)
      return total
    }
    list.forEach((c) => getTotal(Number(c.id)))
    return map
  }, [categories])
}

const CategoryPage = () => {
  const { id_category } = useParams()
  const router = useRouter()
  const categoryId = Number(id_category)

  const { data: category } = useCategory(categoryId)
  const { data: allCategoriesRaw } = useCategoriesRaw()
  const [childrenPage, setChildrenPage] = useState(1)
  const childCategories = useMemo(
    () => (allCategoriesRaw ?? []).filter((c) => c.parent_id != null && Number(c.parent_id) === categoryId),
    [allCategoriesRaw, categoryId]
  )
  const hasChildren = childCategories.length > 0
  const childrenTotalPages = Math.max(1, Math.ceil(childCategories.length / CARDS_PER_PAGE))
  const paginatedChildren = useMemo(
    () =>
      childCategories.slice(
        (childrenPage - 1) * CARDS_PER_PAGE,
        childrenPage * CARDS_PER_PAGE
      ),
    [childCategories, childrenPage]
  )

  const recursiveCounts = useRecursiveProductCounts(allCategoriesRaw ?? [])

  const bentoLargeByIndex = useMemo(() => {
    // Solo aplicamos spans "grandes" en `xl` (grid de 4 columnas).
    const GRID_COLS_XL = 4
    // Menos tarjetas "grandes" para evitar que queden demasiado juntas.
    const desiredCount = Math.min(3, Math.max(1, Math.floor((paginatedChildren.length ?? 0) / 6)))

    const scored = (paginatedChildren ?? []).map((c, index) => {
      const score = recursiveCounts.get(Number(c.id)) ?? c.productos_count ?? 0
      return { index, score }
    })

    scored.sort((a, b) => b.score - a.score)
    const desired = new Set(scored.slice(0, desiredCount).map((x) => x.index))

    let colCursor = 0
    return (paginatedChildren ?? []).map((_, index) => {
      const canPlaceLarge = colCursor === 0 || colCursor === 2
      const shouldLarge = canPlaceLarge && desired.has(index)

      colCursor += shouldLarge ? 2 : 1
      if (colCursor >= GRID_COLS_XL) colCursor = 0
      return shouldLarge
    })
  }, [paginatedChildren, recursiveCounts])
  // Si la categoría actual es raíz (parent_id null) → hijos son "Líneas"; si no → "Sublíneas"
  const isRootCategory = category?.parent_id == null
  const childrenSectionTitle = isRootCategory ? 'Líneas' : 'Sublíneas'
  // Solo pedir y mostrar productos cuando NO hay hijos: productos se muestran en el nivel más bajo (sublínea, o línea si no hay sublíneas, o categoría si no hay hijos)
  const categoryProductFilters = useMemo(
    () => ({ category_id: categoryId, include_subcategories: true, limit: 200 }),
    [categoryId]
  )
  const { data: categoryProductsResponse, isLoading: productsLoading } = useFilterProducts(categoryProductFilters, {
    enabled: !hasChildren,
  })
  const categoryProducts = categoryProductsResponse?.products ?? []
  const showProductsHere = !hasChildren && categoryProducts.length > 0

  const isLoading = !category && allCategoriesRaw === undefined
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-muted/20 to-background px-5 py-7 md:px-8 md:py-9 mb-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(254,200,6,0.18),transparent_55%),radial-gradient(circle_at_90%_10%,rgba(249,115,22,0.12),transparent_45%)] opacity-80"
        />
        <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="cursor-pointer flex items-center gap-2 text-primary hover:text-primary/90 mb-4 px-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>

          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {category?.name}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {hasChildren
              ? isRootCategory
                ? 'Explora las líneas y productos en esta categoría'
                : 'Explora las sublíneas y productos en esta línea'
              : isRootCategory
                ? 'Productos en esta categoría'
                : 'Productos en esta sublínea'}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-6">
            {hasChildren ? (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/10"
              >
                {childCategories.length} {childrenSectionTitle.toLowerCase()}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/10"
              >
                {categoryProducts.length} productos
              </Badge>
            )}
          </div>
        </div>
      </div>

      {hasChildren ? (
        <>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            {childrenSectionTitle}
            <Badge variant="outline" className="text-muted-foreground">
              {childCategories.length}
            </Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 mb-6 grid-flow-dense">
            {paginatedChildren.map((child, index) => {
              const IconComponent = getIconForCategory(child.name)
              const totalProducts = recursiveCounts.get(Number(child.id)) ?? child.productos_count ?? 0
              const isLarge = bentoLargeByIndex[index] ?? false
              const bentoClass = isLarge ? "xl:col-span-2" : "";
              return (
                <div key={child.id} className={bentoClass}>
                  <CategoryCard
                    title={child.name}
                    description={child.description}
                    icon={createElement(IconComponent, { className: 'w-6 h-6' })}
                    count={totalProducts}
                    countLabel="productos"
                    categoryId={String(child.id)}
                    showExploreHint
                  />
                </div>
              )
            })}
          </div>
          {childrenTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Mostrando{' '}
                <span className="font-medium">
                  {(childrenPage - 1) * CARDS_PER_PAGE + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(childrenPage * CARDS_PER_PAGE, childCategories.length)}
                </span>{' '}
                de <span className="font-medium">{childCategories.length}</span>{' '}
                {childrenSectionTitle.toLowerCase()}
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChildrenPage((p) => Math.max(1, p - 1))}
                  disabled={childrenPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Página {childrenPage} de {childrenTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setChildrenPage((p) => Math.min(childrenTotalPages, p + 1))
                  }
                  disabled={childrenPage === childrenTotalPages}
                  className="gap-1"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Productos solo en el nivel más bajo: sin hijos (sublínea, o línea sin sublíneas, o categoría sin líneas) */}
      {showProductsHere ? (
        <>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2 flex-wrap">
            Productos de {category?.name}
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/10">
              {categoryProducts.length} productos
            </Badge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
            {categoryProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id_producto: product.id,
                  nom_producto: product.name,
                  val_precio: product.price_min ?? (product as any).val_precio,
                  stock_cantidad: product.stock_total ?? (product as any).num_stock,
                  img_producto: product.image_url
                    ? { main: product.image_url }
                    : (product as any).img_producto,
                }}
                onClick={() => router.push(`/products/${product.slug ?? product.id}`)}
              />
            ))}
          </div>
        </>
      ) : !hasChildren && !productsLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No hay productos en esta categoría
          </h3>
          <p className="text-muted-foreground">
            No se encontraron productos ni subcategorías en este momento
          </p>
        </div>
      ) : null}
    </div>
  )
}

export default CategoryPage
