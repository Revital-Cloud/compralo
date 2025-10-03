'use client'

import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllCategories, updateCategory, deactivateCategory } from '@/services/category.service'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Power } from 'lucide-react'
import { CreateEntityModal } from '@/components/admin/common/create-entity-modal'
import { EditEntityModal } from '@/components/admin/common/edit-entity-modal'
import { useMemo, useState } from 'react'
import { CategoriesFilters } from '@/components/admin/categories/categories-filters'
import type { Category } from '@/types/category'

const CategoriesPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: getAllCategories,
  })

  // Filtros locales
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'nombre' | 'fecha'>('nombre')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')

  const clearFilters = () => {
    setSearch('')
    setSortBy('nombre')
    setSortOrder('ASC')
  }

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []
    let rows = data as unknown as Category[]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r => r.nom_categoria?.toLowerCase().includes(q))
    }
    rows = [...rows].sort((a, b) => {
      let va: any, vb: any
      if (sortBy === 'fecha') {
        va = (a as any).fec_insert || ''
        vb = (b as any).fec_insert || ''
      } else {
        va = (a as any).nom_categoria || ''
        vb = (b as any).nom_categoria || ''
      }
      const cmp = String(va).localeCompare(String(vb))
      return sortOrder === 'ASC' ? cmp : -cmp
    })
    return rows
  }, [data, search, sortBy, sortOrder])

  const deactivateMutation = useMutation({
    mutationFn: (id_categoria: number) => deactivateCategory(id_categoria),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories', 'all'] }),
  })

  const activateMutation = useMutation({
    mutationFn: (id_categoria: number) => updateCategory(id_categoria, { ind_activo: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories', 'all'] }),
  })

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: 'id_categoria',
      header: 'ID',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.id_categoria}</span>,
    },
    {
      accessorKey: 'nom_categoria',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-medium">{row.original.nom_categoria}</span>,
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

  const actions: ColumnDef<Category>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Editar categoría" onClick={() => { setEditing(row.original); setOpenEdit(true) }}>
            <Pencil className="w-4 h-4" />
          </Button>
          {row.original.ind_activo ? (
            <Button
              variant="destructive"
              size="icon"
              aria-label="Desactivar"
              onClick={() => deactivateMutation.mutate(row.original.id_categoria as unknown as number)}
            >
              <Power className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              aria-label="Activar"
              onClick={() => activateMutation.mutate(row.original.id_categoria as unknown as number)}
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
        title="Categorías"
        description="Gestiona las categorías para organizar tus productos"
        onCreateClick={() => setOpenCreate(true)}
        createLabel="Agregar Categoría"
      />

      <CreateEntityModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        type="category"
        title="Nueva Categoría"
        onSubmit={async (values) => {
          const { createCategory } = await import('@/services/category.service')
          await createCategory({ nom_categoria: values.nom_categoria, ind_activo: values.ind_activo })
          queryClient.invalidateQueries({ queryKey: ['categories', 'all'] })
        }}
      />

      <EditEntityModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        type="category"
        title="Editar Categoría"
        initialValues={{ nom_categoria: (editing as any)?.nom_categoria, ind_activo: (editing as any)?.ind_activo ?? true }}
        onSubmit={async (values) => {
          await updateCategory((editing as any)?.id_categoria, { nom_categoria: values.nom_categoria, ind_activo: values.ind_activo })
          queryClient.invalidateQueries({ queryKey: ['categories', 'all'] })
        }}
      />

      {/* Filtros */}
      <CategoriesFilters
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortByChange={(v) => setSortBy(v as any)}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onClearFilters={clearFilters}
        totalResults={Array.isArray(filteredData) ? filteredData.length : 0}
      />

      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando categorías...</div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar las categorías.</div>
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length === 0 && (
        <EmptyState 
          title="Aún no tienes categorías"
          description="Crea categorías para organizar tus productos por tipo."
          iconPath="M4 6h16M4 10h16M4 14h10"
          primaryAction={<a href="/admin/categories/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Categoría</a>}
          secondaryAction={<button className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all">Importar Excel</button>}
        />
      )}

      {!isLoading && !isError && Array.isArray(filteredData) && filteredData.length > 0 && (
        <DataTable 
          columns={[...columns, ...actions]} 
          data={filteredData as unknown as Category[]}
          pageSize={10}
        />
      )}
    </div>
  )
}

export default CategoriesPage