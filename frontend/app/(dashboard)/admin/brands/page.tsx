import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'

const BrandsPage = () => {
  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Marcas"
        description="Registra las marcas con las que trabajas"
        createUrl="/admin/brands/create"
        createLabel="Agregar Marca"
      />

      <EmptyState 
        title="Aún no tienes marcas"
        description="Registra marcas para asociarlas a tus productos."
        iconPath="M12 6l-2 4-4 .5 3 3-.8 4.5L12 16l3.8 2-1-4.5 3-3-4-.5L12 6z"
        primaryAction={<a href="/admin/brands/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Marca</a>}
        secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
      />
    </div>
  )
}

export default BrandsPage