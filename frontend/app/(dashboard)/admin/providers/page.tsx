'use client'

import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useAllProviders } from '@/hooks/use-providers'

const ProvidersPage = () => {
  const { data, isLoading, isError } = useAllProviders()

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Proveedores"
        description="Agrega y gestiona tus proveedores"
        createUrl="/admin/providers/create"
        createLabel="Agregar Proveedor"
      />

      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando proveedores...</div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar los proveedores.</div>
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length === 0 && (
        <EmptyState 
          title="Aún no tienes proveedores"
          description="Agrega proveedores para gestionar compras e inventario."
          iconPath="M3 7h18M7 7v10m10-10v10M5 17h14"
          primaryAction={<a href="/admin/providers/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Proveedor</a>}
          secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
        />
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((provider) => (
            <div key={provider.id_proveedor} className="border rounded-xl p-4">
              <div className="font-medium">{provider.nom_proveedor}</div>
              {provider.des_proveedor ? (
                <div className="text-sm text-muted-foreground mt-1">{provider.des_proveedor}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProvidersPage