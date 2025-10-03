'use client'

import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { useAllLines, type Line } from '@/hooks/use-lines'
import { Switch } from '@/components/ui/switch'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lineService } from '@/services/line.service'
import { Button } from '@/components/ui/button'
import { Pencil, Power } from 'lucide-react'

const LinesPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useAllLines()

  const activateMutation = useMutation({
    mutationFn: async (params: { id_categoria: number; id_linea: number; nom_linea: string }) => {
      // Activar enviando update con toda la info necesaria e ind_activo=true
      return lineService.updateLine(params.id_categoria, params.id_linea, {
        nom_linea: params.nom_linea,
        ind_activo: true,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines', 'all'] })
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: async (params: { id_categoria: number; id_linea: number }) => {
      return lineService.deactivateLine(params.id_categoria, params.id_linea)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lines', 'all'] })
    },
  })

  const columns: ColumnDef<Line>[] = [
    {
      accessorKey: 'id_linea',
      header: 'ID',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.id_linea}</span>,
    },
    {
      accessorKey: 'nom_linea',
      header: 'Nombre',
    },
    {
      accessorKey: 'fec_insert',
      header: 'Fecha de Creación',
      cell: ({ getValue }) => {
        const v = getValue<string | undefined>()
        return v ? new Date(v).toLocaleDateString() : <span className="text-muted-foreground"></span>
      },
    },
    {
      accessorKey: 'fec_update',
      header: 'Fecha de Actualización',
      cell: ({ getValue }) => {
        const v = getValue<string | undefined>()
        return v ? new Date(v).toLocaleDateString() : <span className="text-muted-foreground"></span>
      },
    },
    {
      accessorKey: 'ind_activo',
      header: 'Activo',
      cell: ({ row }) => {
        const value = row.original.ind_activo === true
        return (
          <Switch
            checked={value}
            onCheckedChange={(checked) => {
              const { id_categoria, id_linea, nom_linea } = row.original as any
              if (checked) {
                activateMutation.mutate({ id_categoria, id_linea, nom_linea })
              } else {
                deactivateMutation.mutate({ id_categoria, id_linea })
              }
            }}
          />
        )
      },
    },
  ]

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
        <DataTable 
          columns={columns} 
          data={data} 
          pageSize={10}
          actionsHeader="Acciones"
          actions={(row) => (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="icon" aria-label="Editar línea">
                <a href={`/admin/lines/${(row.original as any).id_linea}/edit`}>
                  <Pencil />
                </a>
              </Button>
              {row.original.ind_activo === true ? (
                <Button
                  variant="destructive"
                  size="icon"
                  aria-label="Desactivar línea"
                  onClick={() => {
                    const { id_categoria, id_linea } = row.original as any
                    deactivateMutation.mutate({ id_categoria, id_linea })
                  }}
                >
                  <Power />
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Activar línea"
                  onClick={() => {
                    const { id_categoria, id_linea, nom_linea } = row.original as any
                    activateMutation.mutate({ id_categoria, id_linea, nom_linea })
                  }}
                >
                  <Power />
                </Button>
              )}
            </div>
          )}
        />
      )}
    </div>
  )
}

export default LinesPage