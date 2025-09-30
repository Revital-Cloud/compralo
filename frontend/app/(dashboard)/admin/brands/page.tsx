'use client'

import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useAllBrands } from '@/hooks/use-brands'
import { brandService } from '@/services/brand.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Power } from 'lucide-react'

interface Brand {
  id_marca: number
  nom_marca: string
  des_marca?: string
  fec_insert?: string
  fec_update?: string
  ind_activo?: boolean
}

const BrandsPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useAllBrands()

  const deactivateMutation = useMutation({
    mutationFn: (id_marca: number) => brandService.deactivateBrand(id_marca),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands', 'all'] }),
  })

  const activateMutation = useMutation({
    mutationFn: (id_marca: number) => brandService.updateBrand(id_marca, { ind_activo: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brands', 'all'] }),
  })

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: 'id_marca',
      header: 'ID',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.id_marca}</span>,
    },
    {
      accessorKey: 'nom_marca',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-medium">{row.original.nom_marca}</span>,
    },
    {
      accessorKey: 'des_marca',
      header: 'Descripción',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.des_marca || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'fec_insert',
      header: 'Fecha de Creación',
      cell: ({ getValue }) => {
        const v = getValue<string | undefined>()
        return v ? new Date(v).toLocaleDateString('es-ES') : <span className="text-muted-foreground">-</span>
      },
    },
    {
      accessorKey: 'ind_activo',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.ind_activo ? 'default' : 'secondary'}>
          {row.original.ind_activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  const actions: ColumnDef<Brand>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar marca"
            onClick={() => window.location.href = `/admin/brands/${row.original.id_marca}/edit`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {row.original.ind_activo ? (
            <Button
              variant="destructive"
              size="icon"
              aria-label="Desactivar"
              onClick={() => deactivateMutation.mutate(row.original.id_marca)}
            >
              <Power className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              aria-label="Activar"
              onClick={() => activateMutation.mutate(row.original.id_marca)}
            >
              <Power className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

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
        <DataTable 
          columns={[...columns, ...actions]} 
          data={data}
          pageSize={10}
        />
      )}
    </div>
  )
}

export default BrandsPage