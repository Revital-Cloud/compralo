'use client'

import React from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useAllSublines, type Subline } from '@/hooks/use-sublines'
import { sublineService } from '@/services/subline.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Power } from 'lucide-react'

const SublinesPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useAllSublines()

  const deactivateMutation = useMutation({
    mutationFn: (ids: { id_categoria: number; id_linea: number; id_sublinea: number }) =>
      sublineService.deactivateSubline(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sublines', 'all'] })
    },
  })

  const activateMutation = useMutation({
    mutationFn: (params: { ids: { id_categoria: number; id_linea: number; id_sublinea: number }; nom_sublinea: string }) =>
      sublineService.updateSubline(params.ids, { ind_activo: true, nom_sublinea: params.nom_sublinea }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sublines', 'all'] })
    },
  })

  const columns: ColumnDef<Subline>[] = [
    {
      accessorKey: 'id_sublinea',
      header: 'ID',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.id_sublinea}</span>,
    },
    {
      accessorKey: 'nom_sublinea',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-medium">{row.original.nom_sublinea}</span>,
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

  const actions: ColumnDef<Subline>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar sublínea"
            onClick={() => window.location.href = `/admin/sublines/${row.original.id_sublinea}/edit`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {row.original.ind_activo ? (
            <Button
              variant="destructive"
              size="icon"
              aria-label="Desactivar"
              onClick={() =>
                deactivateMutation.mutate({
                  id_categoria: (row.original as any).id_categoria,
                  id_linea: (row.original as any).id_linea,
                  id_sublinea: row.original.id_sublinea,
                })
              }
            >
              <Power className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              aria-label="Activar"
              onClick={() =>
                activateMutation.mutate({
                  ids: {
                    id_categoria: (row.original as any).id_categoria,
                    id_linea: (row.original as any).id_linea,
                    id_sublinea: row.original.id_sublinea,
                  },
                  nom_sublinea: row.original.nom_sublinea,
                })
              }
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
        <DataTable 
          columns={[...columns, ...actions]} 
          data={data}
          pageSize={10}
        />
      )}
    </div>
  )
}

export default SublinesPage