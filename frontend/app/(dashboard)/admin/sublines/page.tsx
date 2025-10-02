'use client'

import React, { useMemo, useState } from 'react'
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
import { CreateEntityModal } from '@/components/admin/common/create-entity-modal'
import { EditEntityModal } from '@/components/admin/common/edit-entity-modal'
import { lineService } from '@/services/line.service'
import { SublinesFilters } from '@/components/admin/sublines/sublines-filters'

const SublinesPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useAllSublines()

  // Filtros locales
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'nombre' | 'linea' | 'categoria' | 'fecha'>('nombre')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')
  const [category, setCategory] = useState('')
  const [line, setLine] = useState('')

  const clearFilters = () => {
    setSearch('')
    setSortBy('nombre')
    setSortOrder('ASC')
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
        String((r as any).id_categoria).includes(q)
      ))
    }
    if (category) {
      rows = rows.filter(r => String((r as any).id_categoria) === String(category))
    }
    if (line) {
      rows = rows.filter(r => String((r as any).id_linea) === String(line))
    }
    rows = [...rows].sort((a, b) => {
      let va: any, vb: any
      if (sortBy === 'fecha') {
        va = (a as any).fec_insert || ''
        vb = (b as any).fec_insert || ''
      } else if (sortBy === 'linea') {
        va = (a as any).nom_linea || ''
        vb = (b as any).nom_linea || ''
      } else if (sortBy === 'categoria') {
        va = (a as any).nom_categoria || ''
        vb = (b as any).nom_categoria || ''
      } else {
        va = (a as any).nom_sublinea || ''
        vb = (b as any).nom_sublinea || ''
      }
      const cmp = String(va).localeCompare(String(vb))
      return sortOrder === 'ASC' ? cmp : -cmp
    })
    return rows
  }, [data, search, category, line, sortBy, sortOrder])

  // Modal crear sublínea
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

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
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar sublínea"
            onClick={() => { setEditing(row.original); setOpenEdit(true) }}
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
        onCreateClick={() => setOpenCreate(true)}
        createLabel="Agregar Sublínea"
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

      {/* Filtros */}
      <SublinesFilters
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortByChange={(v) => setSortBy(v as any)}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
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
          secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
        />
      )}

      {!isLoading && !isError && Array.isArray(filteredData) && filteredData.length > 0 && (
        <DataTable 
          columns={[...columns, ...actions]} 
          data={filteredData}
          pageSize={10}
        />
      )}
    </div>
  )
}

export default SublinesPage