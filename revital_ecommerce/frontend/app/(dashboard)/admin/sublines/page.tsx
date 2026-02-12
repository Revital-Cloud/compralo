'use client'

import React, { useMemo, useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useAllSublines, type Subline } from '@/hooks/use-sublines'
import { sublineService } from '@/services/subline.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui'
import { Badge } from "@/components/ui"
import { Pencil, Power, Eye } from 'lucide-react'
import { CreateEntityModal } from '@/components/admin/common/create-entity-modal'
import { EditEntityModal } from '@/components/admin/common/edit-entity-modal'
import { lineService } from '@/services/line.service'
import { SublinesFilters } from '@/components/admin/sublines/sublines-filters'
import { toast } from 'sonner'

const SublinesPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useAllSublines()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [line, setLine] = useState('')
  const [selectedSubline, setSelectedSubline] = useState<Subline | null>(null)

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setLine('')
  }

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []
    let rows = data as unknown as Subline[]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r => (
        (r as any).nom_sublinea?.toLowerCase().includes(q) ||
        (r as any).nom_linea?.toLowerCase().includes(q) ||
        (r as any).nom_categoria?.toLowerCase().includes(q) ||
        String((r as any).id_categoria).includes(q)
      ))
    }
    if (category) {
      rows = rows.filter(r => String((r as any).id_categoria) === String(category))
    }
    if (line) {
      const parts = line.split('-').map(Number)
      if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
        rows = rows.filter(r => r.id_categoria === parts[0] && r.id_linea === parts[1])
      }
    }
    return [...rows].sort((a, b) =>
      String((a as any).nom_sublinea || '').localeCompare(String((b as any).nom_sublinea || ''))
    )
  }, [data, search, category, line])

  // Modal crear sublínea
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const deactivateActivateSublineMutation = useMutation({
    mutationFn: async ({ ids, activar }: { ids: { id_categoria: number; id_linea: number; id_sublinea: number }; activar: boolean }) => {
      const result = await sublineService.deactivateActivateSubline(ids, activar)
      if (!result || (result as any).message === undefined) {
        throw new Error('No se recibió confirmación del servidor')
      }
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sublines', 'all'] })
      toast.success(variables.activar ? 'Sublínea activada exitosamente' : 'Sublínea desactivada exitosamente')
    },
    onError: (error: any, variables) => {
      console.error(`Error al ${variables.activar ? 'activar' : 'desactivar'} sublínea:`, error)
      const errorMessage = error?.response?.data?.detail || error?.message || `Error al ${variables.activar ? 'activar' : 'desactivar'} la sublínea`
      toast.error(errorMessage)
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
      id: 'categoria',
      header: 'Categoría',
      accessorFn: (row) => (row as any).nom_categoria || String((row as any).id_categoria || ''),
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{String(getValue() || '')}</span>
      ),
      enableSorting: true,
    },
    {
      id: 'linea',
      header: 'Línea',
      accessorFn: (row) => (row as any).nom_linea || String((row as any).id_linea || ''),
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
        return v ? new Date(v).toLocaleDateString('es-ES') : <span className="text-muted-foreground">-</span>
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

  const actions: ColumnDef<Subline>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const isActive = Boolean(row.original.ind_activo)
        const isPending = deactivateActivateSublineMutation.isPending
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Ver sublínea" onClick={() => setSelectedSubline(row.original)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Editar sublínea"
              onClick={() => { setEditing(row.original); setOpenEdit(true) }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant={row.original.ind_activo ? "default" : "destructive"}
              size="icon"
              aria-label={row.original.ind_activo ? "Desactivar" : "Activar"}
              onClick={() => {
                deactivateActivateSublineMutation.mutate({
                  ids: {
                    id_categoria: (row.original as any).id_categoria,
                    id_linea: (row.original as any).id_linea,
                    id_sublinea: row.original.id_sublinea,
                  },
                  activar: !isActive
                })
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
        title="Sublíneas"
        description="Organiza productos dentro de cada línea"
        onCreateClick={() => setOpenCreate(true)}
        createLabel="Agregar Sublínea"
        showImportButton={false}
      />

      <CreateEntityModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        type="subline"
        title="Nueva Sublínea"
        onSubmit={async (values) => {
          await lineService.createSubline({ id_categoria: Number(values.id_categoria), id_linea: Number(values.id_linea), nom_sublinea: values.nom_sublinea, ind_activo: values.ind_activo })
          queryClient.invalidateQueries({ queryKey: ['sublines', 'all'] })
        }}
      />

      <EditEntityModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        type="subline"
        title="Editar Sublínea"
        initialValues={{
          id_categoria: (editing as any)?.id_categoria,
          id_linea: (editing as any)?.id_linea,
          nom_sublinea: (editing as any)?.nom_sublinea,
          ind_activo: (editing as any)?.ind_activo ?? true,
        }}
        onSubmit={async (values) => {
          const ids = editing as any
          await lineService.updateSubline(Number(values.id_categoria), Number(values.id_linea), Number(ids.id_sublinea), { nom_sublinea: values.nom_sublinea, ind_activo: values.ind_activo })
          queryClient.invalidateQueries({ queryKey: ['sublines', 'all'] })
        }}
      />

      <SublinesFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        line={line}
        onLineChange={setLine}
        onClearFilters={clearFilters}
        totalResults={Array.isArray(filteredData) ? filteredData.length : 0}
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
        />
      )}

      {!isLoading && !isError && Array.isArray(filteredData) && filteredData.length > 0 && (
        <DataTable
          columns={[...columns, ...actions]}
          data={filteredData}
          pageSize={10}
          getRowId={(row: Subline) => `${row.id_categoria}-${row.id_linea}-${row.id_sublinea}`}
        />
      )}

      {/* Drawer ver sublínea */}
      <Sheet open={!!selectedSubline} onOpenChange={(open) => !open && setSelectedSubline(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto px-6 sm:px-8 pt-8 pb-8">
          <SheetHeader className="px-0 pb-6">
            <SheetTitle className="pr-8">Detalle de sublínea</SheetTitle>
          </SheetHeader>
          {selectedSubline && (
            <div className="space-y-6 pt-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{(selectedSubline as any).nom_sublinea}</h3>
                <p className="text-sm text-muted-foreground">ID: {(selectedSubline as any).id_categoria}-{(selectedSubline as any).id_linea}-{selectedSubline.id_sublinea}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Categoría</h4>
                <p className="text-sm">{(selectedSubline as any).nom_categoria ?? '-'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Línea</h4>
                <p className="text-sm">{(selectedSubline as any).nom_linea ?? '-'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Estado</h4>
                <span className={selectedSubline.ind_activo ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
                  {selectedSubline.ind_activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {(selectedSubline as any).fec_insert && (
                <p className="text-sm text-muted-foreground">
                  Fecha de creación: {new Date((selectedSubline as any).fec_insert).toLocaleDateString('es', { dateStyle: 'medium' })}
                </p>
              )}
              {(selectedSubline as any).fec_update && (
                <p className="text-sm text-muted-foreground">
                  Fecha de actualización: {new Date((selectedSubline as any).fec_update).toLocaleDateString('es', { dateStyle: 'medium' })}
                </p>
              )}
              <div className="flex flex-col gap-3 pt-6 mt-2 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEditing(selectedSubline);
                    setSelectedSubline(null);
                    setOpenEdit(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar sublínea
                </Button>
                <Button
                  variant={selectedSubline.ind_activo ? 'default' : 'destructive'}
                  className={selectedSubline.ind_activo ? 'w-full bg-green-600 hover:bg-green-700' : 'w-full'}
                  onClick={() => {
                    deactivateActivateSublineMutation.mutate({
                      ids: {
                        id_categoria: (selectedSubline as any).id_categoria,
                        id_linea: (selectedSubline as any).id_linea,
                        id_sublinea: selectedSubline.id_sublinea,
                      },
                      activar: !selectedSubline.ind_activo,
                    });
                    setSelectedSubline(null);
                  }}
                  disabled={deactivateActivateSublineMutation.isPending}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {selectedSubline.ind_activo ? 'Desactivar' : 'Activar'} sublínea
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default SublinesPage