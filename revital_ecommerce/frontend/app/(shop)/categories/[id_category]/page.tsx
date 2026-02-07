'use client'

import { createElement } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCategory } from '@/hooks/use-categories'
import { useLinesByCategory } from '@/hooks/use-lines'
import { getIconForLine } from '@/utils/category-mapper'
import { ArrowLeft, Package } from 'lucide-react'
import { CategoryCard } from '@/components/cards/CategoryCard'

const CategoryPage = () => {
  const { id_category } = useParams()
  const router = useRouter()
  const categoryId = Number(id_category)
  
  const { data: category } = useCategory(categoryId)
  const { data: lines, isLoading } = useLinesByCategory(categoryId)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/90 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        
        <h1 className="text-3xl font-bold text-foreground">
          {category?.nom_categoria}
        </h1>
        <p className="text-muted-foreground mt-2">
          Explora las diferentes líneas de productos en esta categoría
        </p>
      </div>

      {/* Grid de Líneas */}
      {lines && lines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lines.map((line) => {
            const LineIcon = getIconForLine(line.nom_linea)
            return (
              <CategoryCard
                key={`${line.id_categoria}-${line.id_linea}`}
                title={line.nom_linea}
                description={line.desc_linea}
                icon={createElement(LineIcon, { className: 'w-6 h-6' })}
                count={line.sublineas_count ?? 0}
                countLabel="sublíneas"
                onClick={() => router.push(`/categories/${categoryId}/lines/${line.id_linea}`)}
                showExploreHint
              />
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No hay líneas disponibles
          </h3>
          <p className="text-muted-foreground">
            Esta categoría no tiene líneas de productos en este momento
          </p>
        </div>
      )}
    </div>
  )
}

export default CategoryPage