'use client'

import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useAllSublines } from '@/hooks/use-sublines'

const SublinesPage = () => {
  const { data, isLoading, isError } = useAllSublines()

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Sublíneas"
        description="Organiza productos dentro de cada línea"
        createUrl="/admin/sublines/create"
        createLabel="Agregar Sublínea"
      />

      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando sublíneas...</div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar las sublíneas.</div>
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length === 0 && (
        <EmptyState 
          title="Aún no tienes sublíneas"
          description="Crea sublíneas para clasificar los productos dentro de cada línea."
          iconPath="M4 6h16M8 10h8M6 14h12M10 18h4"
          primaryAction={<a href="/admin/sublines/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Sublínea</a>}
          secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
        />
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((subline, index) => (
            <div key={`${subline.id_sublinea}-${index}`} className="border rounded-xl p-4">
              <div className="font-medium">{subline.nom_sublinea}</div>
              {subline.desc_sublinea ? (
                <div className="text-sm text-muted-foreground mt-1">{subline.desc_sublinea}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SublinesPage