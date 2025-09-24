'use client'

import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useAllLines } from '@/hooks/use-lines'

const LinesPage = () => {
  const { data, isLoading, isError } = useAllLines()

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Líneas"
        description="Define las líneas principales de tu catálogo"
        createUrl="/admin/lines/create"
        createLabel="Agregar Línea"
      />

      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando líneas...</div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar las líneas.</div>
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length === 0 && (
        <EmptyState 
          title="Aún no tienes líneas"
          description="Crea líneas para agrupar sublíneas y productos relacionados."
          iconPath="M3 7h18M3 12h18M3 17h18"
          primaryAction={<a href="/admin/lines/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Línea</a>}
          secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
        />
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((line) => (
            <div key={line.id_linea} className="border rounded-xl p-4">
              <div className="font-medium">{line.nom_linea}</div>
              {line.desc_linea ? (
                <div className="text-sm text-muted-foreground mt-1">{line.desc_linea}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LinesPage