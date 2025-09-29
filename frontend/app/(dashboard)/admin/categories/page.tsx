'use client'

import { CatalogHeader } from '@/components/admin/catalog-header'
import { EmptyState } from '@/components/admin/empty-states'
import { useQuery } from '@tanstack/react-query'
import { getAllCategories } from '@/services/category.service'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Power } from 'lucide-react'
import type { Category } from '@/types/category'

const CategoriesPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: getAllCategories,
  })

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
        <Badge variant={row.original.ind_activo ? 'default' : 'secondary'}>
          {row.original.ind_activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  const actions: ColumnDef<Category>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar categoría"
            onClick={() => window.location.href = `/admin/categories/${row.original.id_categoria}/edit`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={row.original.ind_activo ? 'destructive' : 'secondary'}
            size="icon"
            aria-label={row.original.ind_activo ? 'Desactivar' : 'Activar'}
          >
            <Power className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Categorías"
        description="Gestiona las categorías para organizar tus productos"
        createUrl="/admin/categories/create"
        createLabel="Agregar Categoría"
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

      {!isLoading && !isError && Array.isArray(data) && data.length > 0 && (
        <DataTable 
          columns={[...columns, ...actions]} 
          data={data as unknown as Category[]}
          pageSize={10}
        />
      )}
    </div>
  )
}

export default CategoriesPage