'use client'

import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllCategories, updateCategory, deactivateActivateCategory } from '@/services/category.service'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui'
import { Badge } from "@/components/ui"
import { Pencil, Power, Eye } from 'lucide-react'
import { CreateEntityModal } from '@/components/admin/common/create-entity-modal'
import { EditEntityModal } from '@/components/admin/common/edit-entity-modal'
import { useMemo, useState } from 'react'
import { CategoriesFilters } from '@/components/admin/categories/categories-filters'
import type { Category } from '@/types/category'
import { toast } from 'sonner'

const CategoriesPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: getAllCategories,
  })

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const clearFilters = () => setSearch('')

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []
    let rows = data as unknown as Category[]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r => r.nom_categoria?.toLowerCase().includes(q))
    }
    return [...rows].sort((a, b) =>
      String((a as any).nom_categoria || '').localeCompare(String((b as any).nom_categoria || ''))
    )
  }, [data, search])

  const deactivateActivateCategoryMutation = useMutation({
    mutationFn: async ({ id_categoria, activar }: { id_categoria: number; activar: boolean }) => {
      const { deactivateActivateCategory } = await import('@/services/category.service')
      const result = await deactivateActivateCategory(id_categoria, activar)
      // Verificar que realmente se cambió el estado
      if (!result || (result as any).message === undefined) {
        throw new Error('No se recibió confirmación del servidor')
      }
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', 'all'] })
      toast.success(variables.activar ? 'Categoría activada exitosamente' : 'Categoría desactivada exitosamente')
    },
    onError: (error: any, variables) => {
      console.error(`Error al ${variables.activar ? 'activar' : 'desactivar'} categoría:`, error)
      const errorMessage = error?.response?.data?.detail || error?.message || `Error al ${variables.activar ? 'activar' : 'desactivar'} la categoría`
      toast.error(errorMessage)
    },
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
      cell: ({ row }) => {
        const isActive = Boolean(row.original.ind_activo)
        const isPending = deactivateActivateCategoryMutation.isPending
        
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Ver categoría" onClick={() => setSelectedCategory(row.original)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Editar categoría" onClick={() => { setEditing(row.original); setOpenEdit(true) }}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant={isActive ? "default" : "destructive"}
              size="icon"
              aria-label={isActive ? "Desactivar" : "Activar"}
              onClick={() => {
                const id = Number(row.original.id_categoria)
                if (isNaN(id)) {
                  toast.error('ID de categoría inválido')
                  return
                }
                deactivateActivateCategoryMutation.mutate({ id_categoria: id, activar: !isActive })
              }}
              disabled={isPending}
              className={isActive ? "bg-green-600 hover:bg-green-700 text-white" : ""}
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

      <CategoriesFilters
        search={search}
        onSearchChange={setSearch}
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
          secondaryAction={
            <button
              type="button"
              title="Funcionalidad en desarrollo"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-all"
            >
              Importar Excel
            </button>
          }
        />
      )}

      {!isLoading && !isError && Array.isArray(filteredData) && filteredData.length > 0 && (
        <DataTable 
          columns={[...columns, ...actions]} 
          data={filteredData as unknown as Category[]}
          pageSize={10}
        />
      )}

      {/* Drawer ver categoría */}
      <Sheet open={!!selectedCategory} onOpenChange={(open) => !open && setSelectedCategory(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto px-6 sm:px-8 pt-8 pb-8">
          <SheetHeader className="px-0 pb-6">
            <SheetTitle className="pr-8">Detalle de categoría</SheetTitle>
          </SheetHeader>
          {selectedCategory && (
            <div className="space-y-6 pt-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{selectedCategory.nom_categoria}</h3>
                <p className="text-sm text-muted-foreground">ID: {selectedCategory.id_categoria}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Estado</h4>
                <span className={selectedCategory.ind_activo ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
                  {selectedCategory.ind_activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {selectedCategory.fec_insert && (
                <p className="text-sm text-muted-foreground">
                  Fecha de creación: {new Date(selectedCategory.fec_insert).toLocaleDateString('es', { dateStyle: 'medium' })}
                </p>
              )}
              <div className="flex flex-col gap-3 pt-6 mt-2 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEditing(selectedCategory);
                    setSelectedCategory(null);
                    setOpenEdit(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar categoría
                </Button>
                <Button
                  variant={selectedCategory.ind_activo ? 'default' : 'destructive'}
                  className={selectedCategory.ind_activo ? 'w-full bg-green-600 hover:bg-green-700' : 'w-full'}
                  onClick={() => {
                    const id = Number(selectedCategory.id_categoria);
                    if (!isNaN(id)) {
                      deactivateActivateCategoryMutation.mutate({ id_categoria: id, activar: !selectedCategory.ind_activo });
                    }
                    setSelectedCategory(null);
                  }}
                  disabled={deactivateActivateCategoryMutation.isPending}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {selectedCategory.ind_activo ? 'Desactivar' : 'Activar'} categoría
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default CategoriesPage