'use client'

import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllCategories, deactivateActivateCategory } from '@/services/category.service'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui'
import { Pencil, Power, Eye, Info } from 'lucide-react'
import { CategoryModal } from '@/components/admin/categories/category-modal'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CategoriesFilters } from '@/components/admin/categories/categories-filters'
import type { Category } from '@/types/category'
import { toast } from 'sonner'
import { useAdminTour } from '../_tour/useAdminDriverTour'
import { searchMatches } from '@/utils/search-helpers'
import { AdminFiltersSkeleton, AdminTableSkeleton } from '@/components/admin/skeletons'

const TAB_VALUES = ['categoria', 'linea', 'sublinea'] as const
type CategoryTab = (typeof TAB_VALUES)[number]
const DEFAULT_TAB: CategoryTab = 'categoria'
const CATEGORIES_TOUR_KEY = 'revital_categories_tour_seen'

function isValidTab(value: string | null): value is CategoryTab {
  return value !== null && TAB_VALUES.includes(value as CategoryTab)
}

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
  // When list is already filtered by search, parent nodes may be missing.
  // Treat entries whose parent is absent from the current subset as roots too.
  const roots = list.filter((c) => {
    const pid = parentIdNum(c)
    return pid == null || !byId.has(pid)
  })
  const result: Category[] = []
  const visited = new Set<number>()
  function visit(id: number) {
    const c = byId.get(id)
    if (c && !visited.has(id)) {
      visited.add(id)
      result.push(c)
    }
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
  // Safety: include any leftover nodes not traversed.
  for (const c of list) visit(categoryIdNum(c))
  return result
}

const CategoriesPage = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: getAllCategories,
    staleTime: 5 * 60 * 1000, // 5 min: cache por tab/focus, sin refetch al cambiar de pestaña
  })

  const [search, setSearch] = useState('')
  const [filterByParentCategoryId, setFilterByParentCategoryId] = useState('')
  const [filterByParentLineId, setFilterByParentLineId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const tabParam = searchParams.get('tab')
  const currentTab: CategoryTab = isValidTab(tabParam) ? tabParam : DEFAULT_TAB

  const handleTabChange = useCallback((value: string) => {
    const next = isValidTab(value) ? value : DEFAULT_TAB
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  useEffect(() => {
    if (!searchParams.get('tab')) {
      router.replace(`${pathname}?tab=${DEFAULT_TAB}`, { scroll: false })
    }
  }, [pathname, router, searchParams])

  const clearFilters = useCallback(() => {
    setSearch('')
    setFilterByParentCategoryId('')
    setFilterByParentLineId('')
  }, [])

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []
    let rows = data as unknown as Category[]
    if (search.trim()) {
      rows = rows.filter((r) => searchMatches(search, r.name ?? r.nom_categoria))
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

  const categoriasOnly = useMemo(
    () => (filteredData as Category[]).filter((c) => getCategoryLevel(c, categoriesList) === 'root'),
    [filteredData, categoriesList]
  )
  const lineasOnly = useMemo(
    () => (filteredData as Category[]).filter((c) => getCategoryLevel(c, categoriesList) === 'line'),
    [filteredData, categoriesList]
  )
  const sublineasOnly = useMemo(
    () => (filteredData as Category[]).filter((c) => getCategoryLevel(c, categoriesList) === 'subline'),
    [filteredData, categoriesList]
  )

  const lineasFiltered = useMemo(() => {
    if (!filterByParentCategoryId) return lineasOnly
    const parentId = Number(filterByParentCategoryId)
    if (Number.isNaN(parentId)) return lineasOnly
    return lineasOnly.filter((c) => parentIdNum(c) === parentId)
  }, [lineasOnly, filterByParentCategoryId])

  const sublineasFiltered = useMemo(() => {
    if (!filterByParentLineId) return sublineasOnly
    const parentId = Number(filterByParentLineId)
    if (Number.isNaN(parentId)) return sublineasOnly
    return sublineasOnly.filter((c) => parentIdNum(c) === parentId)
  }, [sublineasOnly, filterByParentLineId])

  const { startCategoriesListTour } = useAdminTour()

  useEffect(() => {
    try {
      const seen = localStorage.getItem(CATEGORIES_TOUR_KEY)
      if (!seen) {
        startCategoriesListTour()
        localStorage.setItem(CATEGORIES_TOUR_KEY, '1')
      }
    } catch {
      // ignore
    }
  }, [startCategoriesListTour])

  const buildColumnsForTab = useCallback((tab: CategoryTab): ColumnDef<Category>[] => {
    const baseColumns: ColumnDef<Category>[] = [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.id}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Nombre',
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
    ]

    if (tab === 'linea' || tab === 'sublinea') {
      baseColumns.push({
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
                Categoría superior bajo la que se muestra esta.
              </TooltipContent>
            </Tooltip>
          </span>
        ),
        cell: ({ row }) => {
          const cat = row.original
          const pid = parentIdNum(cat)
          const parent = pid != null ? categoriesList.find((c) => categoryIdNum(c) === pid) : null
          if (pid == null || !parent) return <span className="text-muted-foreground">—</span>
          return (
            <button
              type="button"
              onClick={() => setSelectedCategory(parent)}
              className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded text-left transition-colors"
            >
              {parent.name}
            </button>
          )
        },
      })
    }

    baseColumns.push(
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
                variant={isActive ? 'default' : 'destructive'}
                size="icon"
                aria-label={isActive ? 'Desactivar' : 'Activar'}
                onClick={() => {
                  const id = Number(row.original.id)
                  if (isNaN(id)) {
                    toast.error('ID de categoría inválido')
                    return
                  }
                  deactivateActivateCategoryMutation.mutate({ id, activar: !isActive })
                }}
                disabled={isPending}
                className={isActive ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
              >
                <Power className="w-4 h-4" />
              </Button>
            </div>
          )
        },
      }
    )
    return baseColumns
  }, [categoriesList, deactivateActivateCategoryMutation.isPending])

  return (
    <div className="space-y-6">
      <div data-tour-id="categories-header">
        <CatalogHeader 
          title="Categorías"
          description="Gestiona las categorías para organizar tus productos"
          onCreateClick={() => setOpenCreate(true)}
          createLabel="Agregar Categoría"
          showImportButton={false}
        />
      </div>

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

      {isLoading && (
        <div className="space-y-4">
          <AdminFiltersSkeleton />
          <AdminTableSkeleton rows={10} />
        </div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar las categorías.</div>
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length === 0 && (
        <EmptyState
          title="Aún no tienes categorías"
          description="Crea categorías para organizar tus productos por tipo."
          iconPath="M4 6h16M4 10h16M4 14h10"
          primaryAction={
            <Button onClick={() => setOpenCreate(true)} className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
              Agregar Categoría
            </Button>
          }
        />
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length > 0 && (
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3" data-tour-id="categories-tabs">
            <TabsTrigger value="categoria">
              Categoría ({categoriasOnly.length})
            </TabsTrigger>
            <TabsTrigger value="linea">
              Línea ({lineasOnly.length})
            </TabsTrigger>
            <TabsTrigger value="sublinea">
              Sublínea ({sublineasOnly.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categoria" className="space-y-6 outline-none">
            <div data-tour-id="categories-filters">
              <CategoriesFilters
                search={search}
                onSearchChange={setSearch}
                onClearFilters={clearFilters}
                totalResults={categoriasOnly.length}
                title="Filtros de Categorías"
                searchPlaceholder="Buscar categoría..."
              />
            </div>
            {categoriasOnly.length === 0 ? (
              <EmptyState
                title="Aún no tienes categorías"
                description="Las categorías son el nivel superior. Crea una para organizar líneas y sublíneas."
                iconPath="M4 6h16M4 10h16M4 14h10"
                primaryAction={
                  <Button onClick={() => setOpenCreate(true)}>Agregar Categoría</Button>
                }
              />
            ) : (
              <div data-tour-id="categories-table">
                <DataTable
                  columns={buildColumnsForTab('categoria')}
                  data={categoriasOnly}
                  pageSize={10}
                  className="[&_[data-slot=table-container]]:overflow-y-visible"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="linea" className="space-y-6 outline-none">
            <div data-tour-id="categories-filters">
              <CategoriesFilters
                search={search}
                onSearchChange={setSearch}
                onClearFilters={clearFilters}
                totalResults={lineasFiltered.length}
                title="Filtros de Líneas"
                searchPlaceholder="Buscar línea..."
                extraFilters={[
                  {
                    id: 'parentCategory',
                    label: 'Categoría',
                    type: 'select',
                    emptyOptionLabel: 'Todas las categorías',
                    options: categoriasOnly.map((c) => ({ id: c.id, nombre: c.name ?? '', label: c.name ?? '' })),
                    value: filterByParentCategoryId,
                    onChange: (v) => setFilterByParentCategoryId(v ?? ''),
                  },
                ]}
              />
            </div>
            {lineasFiltered.length === 0 ? (
              <EmptyState
                title="Aún no tienes líneas"
                description="Las líneas se crean dentro de una categoría. Crea primero una categoría y luego añade líneas."
                iconPath="M4 6h16M4 10h16M4 14h10"
                primaryAction={
                  <Button onClick={() => setOpenCreate(true)}>Agregar Categoría</Button>
                }
              />
            ) : (
              <div data-tour-id="categories-table">
                <DataTable
                  columns={buildColumnsForTab('linea')}
                  data={lineasFiltered}
                  pageSize={10}
                  className="[&_[data-slot=table-container]]:overflow-y-visible"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="sublinea" className="space-y-6 outline-none">
            <div data-tour-id="categories-filters">
              <CategoriesFilters
                search={search}
                onSearchChange={setSearch}
                onClearFilters={clearFilters}
                totalResults={sublineasFiltered.length}
                title="Filtros de Sublíneas"
                searchPlaceholder="Buscar sublínea..."
                extraFilters={[
                  {
                    id: 'parentLine',
                    label: 'Línea',
                    type: 'select',
                    emptyOptionLabel: 'Todas las líneas',
                    options: lineasOnly.map((c) => ({ id: c.id, nombre: c.name ?? '', label: c.name ?? '' })),
                    value: filterByParentLineId,
                    onChange: (v) => setFilterByParentLineId(v ?? ''),
                  },
                ]}
              />
            </div>
            {sublineasFiltered.length === 0 ? (
              <EmptyState
                title="Aún no tienes sublíneas"
                description="Las sublíneas se crean dentro de una línea. Crea categorías y líneas primero."
                iconPath="M4 6h16M4 10h16M4 14h10"
                primaryAction={
                  <Button onClick={() => setOpenCreate(true)}>Agregar Categoría</Button>
                }
              />
            ) : (
              <div data-tour-id="categories-table">
                <DataTable
                  columns={buildColumnsForTab('sublinea')}
                  data={sublineasFiltered}
                  pageSize={10}
                  className="[&_[data-slot=table-container]]:overflow-y-visible"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
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