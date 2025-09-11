import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'

const CategoriesPage = () => {
  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Categorías"
        description="Gestiona las categorías para organizar tus productos"
        createUrl="/admin/categories/create"
        createLabel="Agregar Categoría"
      />

      <EmptyState 
        title="Aún no tienes categorías"
        description="Crea categorías para organizar tus productos por tipo."
        iconPath="M4 6h16M4 10h16M4 14h10"
        primaryAction={<a href="/admin/categories/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Categoría</a>}
        secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
      />
    </div>
  )
}

export default CategoriesPage