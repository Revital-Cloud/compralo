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
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Pencil, Power } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LinesFilters } from '@/components/admin/lines/lines-filters'

const LinesPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useAllLines()

  // Filtros locales
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'nombre' | 'categoria' | 'fecha'>('nombre')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')
  const [category, setCategory] = useState('')

  const clearFilters = () => {
    setSearch('')
    setSortBy('nombre')
    setSortOrder('ASC')
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
    rows = [...rows].sort((a, b) => {
      let va: any, vb: any
      if (sortBy === 'fecha') {
        va = (a as any).fec_insert || ''
        vb = (b as any).fec_insert || ''
      } else if (sortBy === 'categoria') {
        va = (a as any).nom_categoria || ''
        vb = (b as any).nom_categoria || ''
      } else {
        va = (a as any).nom_linea || ''
        vb = (b as any).nom_linea || ''
      }
      const cmp = String(va).localeCompare(String(vb))
      return sortOrder === 'ASC' ? cmp : -cmp
    })
    return rows
  }, [data, search, category, sortBy, sortOrder])

  // Modal crear línea
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

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
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Editar línea" onClick={() => { setEditing(row.original); setOpenEdit(true) }}>
            <Pencil />
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
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Líneas"
        description="Define las líneas principales de tu catálogo"
        onCreateClick={() => setOpenCreate(true)}
        createLabel="Agregar Línea"
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

      {/* Filtros */}
      <LinesFilters
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortByChange={(v) => setSortBy(v as any)}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
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

export default LinesPage