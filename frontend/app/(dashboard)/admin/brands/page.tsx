'use client'
import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useAllBrands } from '@/hooks/use-brands'

const BrandsPage = () => {
  const { data, isLoading, isError } = useAllBrands()

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Marcas"
        description="Registra las marcas con las que trabajas"
        createUrl="/admin/brands/create"
        createLabel="Agregar Marca"
      />

      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando marcas...</div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar las marcas.</div>
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length === 0 && (
        <EmptyState 
          title="Aún no tienes marcas"
          description="Registra marcas para asociarlas a tus productos."
          iconPath="M12 6l-2 4-4 .5 3 3-.8 4.5L12 16l3.8 2-1-4.5 3-3-4-.5L12 6z"
          primaryAction={<a href="/admin/brands/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Marca</a>}
          secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
        />
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((brand) => (
            <div key={brand.id_marca} className="border rounded-xl p-4">
              <div className="font-medium">{brand.nom_marca}</div>
              {brand.des_marca ? (
                <div className="text-sm text-muted-foreground mt-1">{brand.des_marca}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BrandsPage