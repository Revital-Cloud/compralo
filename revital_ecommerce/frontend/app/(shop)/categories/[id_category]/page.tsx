'use client'

import { createElement, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCategory, useCategoriesRaw } from '@/hooks/use-categories'
import { useFilterProducts } from '@/hooks/use-products'
import { getIconForCategory } from '@/utils/category-mapper'
import { ArrowLeft, Package } from 'lucide-react'
import { CategoryCard } from '@/components/cards/CategoryCard'
import { ProductCard } from '@/components/cards/ProductCard'

const CategoryPage = () => {
  const { id_category } = useParams()
  const router = useRouter()
  const categoryId = Number(id_category)

  const { data: category } = useCategory(categoryId)
  const { data: allCategoriesRaw } = useCategoriesRaw()
  const childCategories = useMemo(
    () => (allCategoriesRaw ?? []).filter((c) => c.parent_id != null && Number(c.parent_id) === categoryId),
    [allCategoriesRaw, categoryId]
  )
  const hasChildren = childCategories.length > 0
  const categoryProductFilters = useMemo(
    () => ({ category_id: categoryId, include_subcategories: true, limit: 200 }),
    [categoryId]
  )
  const { data: categoryProductsResponse, isLoading: productsLoading } = useFilterProducts(categoryProductFilters, {
    enabled: true,
  })
  const categoryProducts = categoryProductsResponse?.products ?? []

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
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/90 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <h1 className="text-3xl font-bold text-foreground">
          {category?.name}
        </h1>
        <p className="text-muted-foreground mt-2">
          Explora las subcategorías y productos en esta categoría
        </p>
      </div>

      {hasChildren ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {childCategories.map((child) => {
            const IconComponent = getIconForCategory(child.name)
            return (
              <CategoryCard
                key={child.id}
                title={child.name}
                description={child.description}
                icon={createElement(IconComponent, { className: 'w-6 h-6' })}
                count={child.productos_count ?? 0}
                countLabel="productos"
                categoryId={String(child.id)}
                showExploreHint
              />
            )
          })}
        </div>
      ) : null}

      {categoryProducts.length > 0 ? (
        <>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {hasChildren ? 'Productos' : `Productos de ${category?.name}`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
