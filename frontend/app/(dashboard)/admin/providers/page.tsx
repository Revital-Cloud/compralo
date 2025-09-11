import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'

const ProvidersPage = () => {
  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Proveedores"
        description="Agrega y gestiona tus proveedores"
        createUrl="/admin/providers/create"
        createLabel="Agregar Proveedor"
      />

      <EmptyState 
        title="Aún no tienes proveedores"
        description="Agrega proveedores para gestionar compras e inventario."
        iconPath="M3 7h18M7 7v10m10-10v10M5 17h14"
        primaryAction={<a href="/admin/providers/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Proveedor</a>}
        secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
      />
    </div>
  )
}

export default ProvidersPage