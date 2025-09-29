'use client'

import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useCategories } from '@/hooks/use-categories'

const CategoriesPage = () => {
  const { data, isLoading, isError } = useCategories()

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Categorías"
        description="Gestiona las categorías para organizar tus productos"
        createUrl="/admin/categories/create"
        createLabel="Agregar Categoría"
      />

      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando categorías...</div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar las categorías.</div>
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length === 0 && (
        <EmptyState 
          title="Aún no tienes categorías"
          description="Crea categorías para organizar tus productos por tipo."
          iconPath="M4 6h16M4 10h16M4 14h10"
          primaryAction={<a href="/admin/categories/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Categoría</a>}
          secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
        />
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((category) => (
            <div key={category.id} className="border rounded-xl p-4">
              <div className="font-medium">{category.name}</div>
              {category.description ? (
                <div className="text-sm text-muted-foreground mt-1">{category.description}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CategoriesPage