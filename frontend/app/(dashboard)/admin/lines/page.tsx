import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'

const LinesPage = () => {
  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Líneas"
        description="Define las líneas principales de tu catálogo"
        createUrl="/admin/lines/create"
        createLabel="Agregar Línea"
      />

      <EmptyState 
        title="Aún no tienes líneas"
        description="Crea líneas para agrupar sublíneas y productos relacionados."
        iconPath="M3 7h18M3 12h18M3 17h18"
        primaryAction={<a href="/admin/lines/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Línea</a>}
        secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
      />
    </div>
  )
}

export default LinesPage