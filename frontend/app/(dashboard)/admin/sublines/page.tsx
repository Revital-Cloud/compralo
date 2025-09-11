import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'

const SublinesPage = () => {
  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Sublíneas"
        description="Organiza productos dentro de cada línea"
        createUrl="/admin/sublines/create"
        createLabel="Agregar Sublínea"
      />

      <EmptyState 
        title="Aún no tienes sublíneas"
        description="Crea sublíneas para clasificar los productos dentro de cada línea."
        iconPath="M4 6h16M8 10h8M6 14h12M10 18h4"
        primaryAction={<a href="/admin/sublines/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Sublínea</a>}
        secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
      />
    </div>
  )
}

export default SublinesPage