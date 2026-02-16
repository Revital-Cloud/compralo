'use client'

import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllCategories, deactivateActivateCategory } from '@/services/category.service'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { Pencil, Power, Eye, Info } from 'lucide-react'
import { CategoryModal } from '@/components/admin/categories/category-modal'
import { useMemo, useState } from 'react'
import { CategoriesFilters } from '@/components/admin/categories/categories-filters'
import type { Category } from '@/types/category'
import { toast } from 'sonner'

function categoryIdNum(c: Category): number {
  return typeof c.id === 'number' ? c.id : Number(c.id)
}

function parentIdNum(c: Category): number | null {
  if (c.parent_id == null) return null
  return typeof c.parent_id === 'number' ? c.parent_id : Number(c.parent_id)
}

/** Path from root to category (inclusive). Empty if category not in list. */
function getCategoryPathIds(categoryId: number, list: Category[]): number[] {
  const ids: number[] = []
  let current = list.find((c) => categoryIdNum(c) === categoryId)
  while (current) {
    ids.unshift(categoryIdNum(current))
    const pid = parentIdNum(current)
    if (pid == null) break
    current = list.find((c) => categoryIdNum(c) === pid)
  }
  return ids
}

/** Names for path from root to category (inclusive). */
function getCategoryPathNames(categoryId: number, list: Category[]): string[] {
  return getCategoryPathIds(categoryId, list).map(
    (id) => list.find((c) => categoryIdNum(c) === id)?.name ?? '—'
  )
}

function getCategoryLevel(category: Category, list: Category[]): 'root' | 'line' | 'subline' {
  const pid = parentIdNum(category)
  if (pid == null) return 'root'
  const parent = list.find((c) => categoryIdNum(c) === pid)
  if (!parent) return 'line'
  if (parentIdNum(parent) == null) return 'line'
  return 'subline'
}

function getCategoryLevelNumber(category: Category, list: Category[]): number {
  const path = getCategoryPathIds(categoryIdNum(category), list)
  return path.length > 0 ? path.length - 1 : 0
}

/** Sort categories hierarchically: roots first, then children under each root, then grandchildren. */
function sortCategoriesHierarchically(list: Category[]): Category[] {
  const byId = new Map(list.map((c) => [categoryIdNum(c), c]))
  const roots = list.filter((c) => parentIdNum(c) == null)
  const result: Category[] = []
  function visit(id: number) {
    const c = byId.get(id)
    if (c) result.push(c)
  }
  function dfs(cats: Category[]) {
    const sorted = [...cats].sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')))
    for (const c of sorted) {
      visit(categoryIdNum(c))
      const children = list.filter((c2) => parentIdNum(c2) === categoryIdNum(c))
      if (children.length) dfs(children)
    }
  }
  dfs(roots)
  return result
}

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
      rows = rows.filter(r => r.name?.toLowerCase().includes(q))
    }
    return sortCategoriesHierarchically([...rows])
  }, [data, search])

  const deactivateActivateCategoryMutation = useMutation({
    mutationFn: async ({ id, activar }: { id: number; activar: boolean }) => {
      const { deactivateActivateCategory } = await import('@/services/category.service')
      const result = await deactivateActivateCategory(id, activar)
      // Verificar que realmente se cambió el estado
      if (!result || (result as any).message === undefined) {
        throw new Error('No se recibió confirmación del servidor')
      }
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories', 'raw'] })
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

  const categoriesList = Array.isArray(data) ? (data as Category[]) : []

  /** Metadata per category for tree lines: level and whether it's the last sibling under its parent. */
  const categoryRowMeta = useMemo(() => {
    const map = new Map<number, { level: number; isLastInGroup: boolean }>()
    const list = filteredData as Category[]
    for (let i = 0; i < list.length; i++) {
      const cat = list[i]
      const id = categoryIdNum(cat)
      const level = getCategoryLevelNumber(cat, categoriesList)
      const next = list[i + 1]
      const sameParent = next && parentIdNum(next) === parentIdNum(cat)
      map.set(id, { level, isLastInGroup: !sameParent })
    }
    return map
  }, [filteredData, categoriesList])

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.id}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => {
        const cat = row.original
        const id = categoryIdNum(cat)
        const meta = categoryRowMeta.get(id)
        const level = meta?.level ?? 0
        const isLast = meta?.isLastInGroup ?? true
        const parentId = parentIdNum(cat)
        const parentMeta = parentId != null ? categoryRowMeta.get(parentId) : null
        const parentIsLast = parentMeta?.isLastInGroup ?? true

        const branch = isLast ? '└' : '├'
        const vertical = parentIsLast ? '    ' : '│   '
        const line = '── '
        const prefix =
          level === 0
            ? ''
            : level === 1
              ? `${branch}${line}`
              : `${vertical}${branch}${line}`

        return (
          <span className="flex items-center font-medium">
            <span className="shrink-0 text-muted-foreground font-normal tabular-nums tracking-tight" style={{ fontFamily: 'ui-monospace, monospace' }}>
              {prefix}
            </span>
            <span>{row.original.name}</span>
          </span>
        )
      },
    },
    {
      accessorKey: 'level',
      header: 'Nivel',
      cell: ({ row }) => {
        const level = getCategoryLevel(row.original, categoriesList)
        const label = level === 'root' ? 'Categoría' : level === 'line' ? 'Línea' : 'Sublínea'
        return <span className="text-muted-foreground">{label}</span>
      },
    },
    {
      accessorKey: 'parent_id',
      header: () => (
        <span className="inline-flex items-center gap-1">
          Padre
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="inline-flex text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" aria-label="Ayuda">
                <Info className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>
              Categoría superior bajo la que se muestra esta. Las categorías principales no tienen padre.
            </TooltipContent>
          </Tooltip>
        </span>
      ),
      cell: ({ row }) => {
        const cat = row.original
        const pid = parentIdNum(cat)
        const parent = pid != null ? categoriesList.find((c) => categoryIdNum(c) === pid) : null
        const pathNames = getCategoryPathNames(categoryIdNum(cat), categoriesList)
        const pathLabel = pathNames.length > 0 ? pathNames.join(' › ') : ''

        if (pid == null || !parent) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-default">Ninguno</span>
              </TooltipTrigger>
              <TooltipContent>Categoría principal (nivel superior)</TooltipContent>
            </Tooltip>
          )
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setSelectedCategory(parent)}
                className="text-primary hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded text-left"
              >
                {parent.name}
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>
              {pathLabel || parent.name}
            </TooltipContent>
          </Tooltip>
        )
      },
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
      cell: ({ row }) => {
        const active = (row.original.ind_activo ?? (row.original as { is_active?: boolean }).is_active) !== false
        return (
          <span className={active ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
            {active ? 'Activo' : 'Inactivo'}
          </span>
        )
      },
    },
  ]

  const actions: ColumnDef<Category>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const isActive = (row.original.ind_activo ?? (row.original as { is_active?: boolean }).is_active) !== false
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
                const id = Number(row.original.id)
                if (isNaN(id)) {
                  toast.error('ID de categoría inválido')
                  return
                }
                deactivateActivateCategoryMutation.mutate({ id: id, activar: !isActive })
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
        showImportButton={false}
      />

      <CategoryModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        mode="create"
        categories={categoriesList}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['categories', 'all'] })
          queryClient.invalidateQueries({ queryKey: ['categories'] })
          queryClient.invalidateQueries({ queryKey: ['categories', 'raw'] })
          toast.success('Categoría creada correctamente')
        }}
      />

      <CategoryModal
        open={openEdit}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
          setOpenEdit(open)
        }}
        mode="edit"
        categories={categoriesList}
        editingCategory={editing}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['categories', 'all'] })
          queryClient.invalidateQueries({ queryKey: ['categories'] })
          queryClient.invalidateQueries({ queryKey: ['categories', 'raw'] })
          toast.success('Categoría actualizada correctamente')
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
                <h3 className="font-semibold text-lg">{selectedCategory.name}</h3>
                <p className="text-sm text-muted-foreground">ID: {selectedCategory.id}</p>
                {(() => {
                  const pathNames = getCategoryPathNames(categoryIdNum(selectedCategory), categoriesList)
                  if (pathNames.length <= 1) return null
                  return (
                    <p className="text-xs text-muted-foreground" title="Ruta jerárquica">
                      Ruta: {pathNames.join(' › ')}
                    </p>
                  )
                })()}
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Estado</h4>
                <span className={(selectedCategory.ind_activo ?? (selectedCategory as { is_active?: boolean }).is_active) !== false ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
                  {(selectedCategory.ind_activo ?? (selectedCategory as { is_active?: boolean }).is_active) !== false ? 'Activo' : 'Inactivo'}
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
                  variant={(selectedCategory.ind_activo ?? (selectedCategory as { is_active?: boolean }).is_active) !== false ? 'default' : 'destructive'}
                  className={(selectedCategory.ind_activo ?? (selectedCategory as { is_active?: boolean }).is_active) !== false ? 'w-full bg-green-600 hover:bg-green-700' : 'w-full'}
                  onClick={() => {
                    const id = Number(selectedCategory.id);
                    const currentlyActive = (selectedCategory.ind_activo ?? (selectedCategory as { is_active?: boolean }).is_active) !== false
                    if (!isNaN(id)) {
                      deactivateActivateCategoryMutation.mutate({ id: id, activar: !currentlyActive });
                    }
                    setSelectedCategory(null);
                  }}
                  disabled={deactivateActivateCategoryMutation.isPending}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {(selectedCategory.ind_activo ?? (selectedCategory as { is_active?: boolean }).is_active) !== false ? 'Desactivar' : 'Activar'} categoría
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