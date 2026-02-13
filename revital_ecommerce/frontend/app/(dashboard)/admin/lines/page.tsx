'use client'

import { CatalogHeader } from '@/components/admin/catalog-header'
import { CreateEntityModal } from '@/components/admin/common/create-entity-modal'
import { EditEntityModal } from '@/components/admin/common/edit-entity-modal'
import { EmptyState } from '@/components/admin/empty-states'
import DataTable from '@/components/tables/table'
import { ColumnDef, Row } from '@tanstack/react-table'
import { useAllLines, type Line } from '@/hooks/use-lines'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lineService } from '@/services/line.service'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui'
import { Badge } from "@/components/ui"
import { Pencil, Power, Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LinesFilters } from '@/components/admin/lines/lines-filters'
import { toast } from 'sonner'

const LinesPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useAllLines()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selectedLine, setSelectedLine] = useState<Line | null>(null)

  const clearFilters = () => {
    setSearch('')
    setCategory('')
  }

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []
    let rows = data as unknown as Line[]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r => (
        (r as any).nom_linea?.toLowerCase().includes(q) ||
        String((r as any).id_categoria).includes(q)
      ))
    }
    if (category) {
      rows = rows.filter(r => String((r as any).id_categoria) === String(category))
    }
    return [...rows].sort((a, b) =>
      String((a as any).nom_linea || '').localeCompare(String((b as any).nom_linea || ''))
    )
  }, [data, search, category])

  // Modal crear línea
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const deactivateActivateLineMutation = useMutation({
    mutationFn: async ({ id_categoria, id_linea, activar }: { id_categoria: number; id_linea: number; activar: boolean }) => {
      const result = await lineService.deactivateActivateLine(id_categoria, id_linea, activar)
      if (!result || (result as any).message === undefined) {
        throw new Error('No se recibió confirmación del servidor')
      }
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lines', 'all'] })
      toast.success(variables.activar ? 'Línea activada exitosamente' : 'Línea desactivada exitosamente')
    },
    onError: (error: any, variables) => {
      console.error(`Error al ${variables.activar ? 'activar' : 'desactivar'} línea:`, error)
      const errorMessage = error?.response?.data?.detail || error?.message || `Error al ${variables.activar ? 'activar' : 'desactivar'} la línea`
      toast.error(errorMessage)
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
      id: 'categoria',
      header: 'Categoría',
      accessorFn: (row) => (row as any).nom_categoria || String((row as any).id_categoria || ''),
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{String(getValue() || '')}</span>
      ),
      enableSorting: true,
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
      header: 'Estado',
      cell: ({ row }) => (
        <span className={row.original.ind_activo ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
          {row.original.ind_activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  const actions: ColumnDef<Line>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const isActive = Boolean(row.original.ind_activo)
        const isPending = deactivateActivateLineMutation.isPending
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Ver línea" onClick={() => setSelectedLine(row.original)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Editar línea" onClick={() => { setEditing(row.original); setOpenEdit(true) }}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant={row.original.ind_activo ? "default" : "destructive"}
              size="icon"
              aria-label={row.original.ind_activo ? "Desactivar línea" : "Activar línea"}
              onClick={() => {
                const { id_categoria, id_linea } = row.original as any
                deactivateActivateLineMutation.mutate({ id_categoria, id_linea, activar: !isActive })
              }}
              disabled={isPending}
              className={row.original.ind_activo ? "bg-green-600 hover:bg-green-700 text-white" : ""}
            >
              <Power className="w-4 h-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Líneas"
        description="Define las líneas principales de tu catálogo"
        onCreateClick={() => setOpenCreate(true)}
        createLabel="Agregar Línea"
        showImportButton={false}
      />

      <EditEntityModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        type="line"
        title="Editar Línea"
        initialValues={{
          id_categoria: (editing as any)?.id_categoria,
          nom_linea: (editing as any)?.nom_linea,
          ind_activo: (editing as any)?.ind_activo ?? true,
        }}
        onSubmit={async (values) => {
          const ids = editing as any
          await lineService.updateLine(Number(values.id_categoria), Number(ids.id_linea), { nom_linea: values.nom_linea, ind_activo: values.ind_activo })
          queryClient.invalidateQueries({ queryKey: ['lines', 'all'] })
        }}
      />

      <CreateEntityModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        type="line"
        title="Nueva Línea"
        onSubmit={async (values) => {
          await lineService.createLine({ id_categoria: Number(values.id_categoria), nom_linea: values.nom_linea, ind_activo: values.ind_activo })
          queryClient.invalidateQueries({ queryKey: ['lines', 'all'] })
        }}
      />

      <LinesFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        onClearFilters={clearFilters}
        totalResults={Array.isArray(filteredData) ? filteredData.length : 0}
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
        />
      )}

      {!isLoading && !isError && Array.isArray(filteredData) && filteredData.length > 0 && (
        <DataTable
          columns={[...columns, ...actions]}
          data={filteredData}
          pageSize={10}
          getRowId={(row: Line) => `${row.id_categoria}-${row.id_linea}`}
        />
      )}

      {/* Drawer ver línea */}
      <Sheet open={!!selectedLine} onOpenChange={(open) => !open && setSelectedLine(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto px-6 sm:px-8 pt-8 pb-8">
          <SheetHeader className="px-0 pb-6">
            <SheetTitle className="pr-8">Detalle de línea</SheetTitle>
          </SheetHeader>
          {selectedLine && (
            <div className="space-y-6 pt-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{(selectedLine as any).nom_linea}</h3>
                <p className="text-sm text-muted-foreground">ID: {(selectedLine as any).id_categoria}-{(selectedLine as any).id_linea}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Categoría</h4>
                <p className="text-sm">{(selectedLine as any).nom_categoria ?? '-'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Estado</h4>
                <span className={selectedLine.ind_activo ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
                  {selectedLine.ind_activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {(selectedLine as any).fec_insert && (
                <p className="text-sm text-muted-foreground">
                  Fecha de creación: {new Date((selectedLine as any).fec_insert).toLocaleDateString('es', { dateStyle: 'medium' })}
                </p>
              )}
              {(selectedLine as any).fec_update && (
                <p className="text-sm text-muted-foreground">
                  Fecha de actualización: {new Date((selectedLine as any).fec_update).toLocaleDateString('es', { dateStyle: 'medium' })}
                </p>
              )}
              <div className="flex flex-col gap-3 pt-6 mt-2 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEditing(selectedLine);
                    setSelectedLine(null);
                    setOpenEdit(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar línea
                </Button>
                <Button
                  variant={selectedLine.ind_activo ? 'default' : 'destructive'}
                  className={selectedLine.ind_activo ? 'w-full bg-green-600 hover:bg-green-700' : 'w-full'}
                  onClick={() => {
                    const { id_categoria, id_linea } = selectedLine as any;
                    deactivateActivateLineMutation.mutate({ id_categoria, id_linea, activar: !selectedLine.ind_activo });
                    setSelectedLine(null);
                  }}
                  disabled={deactivateActivateLineMutation.isPending}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {selectedLine.ind_activo ? 'Desactivar' : 'Activar'} línea
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default LinesPage