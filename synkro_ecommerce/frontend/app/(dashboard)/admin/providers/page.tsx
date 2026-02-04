'use client'

import { useMemo, useState } from 'react'
import { ProvidersFilters } from '@/components/admin/providers/providers-filters'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { CreateEntityModal } from '@/components/admin/common/create-entity-modal'
import { EditEntityModal } from '@/components/admin/common/edit-entity-modal'
import { EmptyState } from '@/components/admin/empty-states'
import { useAllProviders } from '@/hooks/use-providers'
import { providerService } from '@/services/provider.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from "@/components/ui"
import { Pencil, Power } from 'lucide-react'
import { toast } from 'sonner'

interface Provider {
  id_proveedor: number
  nom_proveedor: string
  fec_insert?: string
  fec_update?: string
  ind_activo?: boolean
}


const ProvidersPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useAllProviders()

  const deactivateActivateProviderMutation = useMutation({
    mutationFn: async ({ id_proveedor, activar }: { id_proveedor: number; activar: boolean }) => {
      const result = await providerService.deactivateActivateProvider(id_proveedor, activar)
      if (!result || (result as any).message === undefined) {
        throw new Error('No se recibió confirmación del servidor')
      }
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['providers', 'all'] })
      toast.success(variables.activar ? 'Proveedor activado exitosamente' : 'Proveedor desactivado exitosamente')
    },
    onError: (error: any, variables) => {
      console.error(`Error al ${variables.activar ? 'activar' : 'desactivar'} proveedor:`, error)
      const errorMessage = error?.response?.data?.detail || error?.message || `Error al ${variables.activar ? 'activar' : 'desactivar'} el proveedor`
      toast.error(errorMessage)
    },
  })

  const columns: ColumnDef<Provider>[] = [
    {
      accessorKey: 'id_proveedor',
      header: 'ID',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.id_proveedor}</span>,
    },
    {
      accessorKey: 'nom_proveedor',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-medium">{row.original.nom_proveedor}</span>,
    },
    {
      accessorKey: 'fec_insert',
      header: 'Fecha de Creación',
      cell: ({ getValue }) => {
        const v = getValue<string | undefined>()
        return v ? new Date(v).toLocaleDateString('es-ES') : <span className="text-muted-foreground"></span>
      },
    },
    {
      accessorKey: 'fec_update',
      header: 'Fecha de Actualización',
      cell: ({ getValue }) => {
        const v = getValue<string | undefined>()
        return v ? new Date(v).toLocaleDateString('es-ES') : <span className="text-muted-foreground"></span>
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

  const actions: ColumnDef<Provider>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Editar proveedor" onClick={() => { setEditing(row.original); setOpenEdit(true) }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={row.original.ind_activo ? "default" : "destructive"}
            size="icon"
            aria-label={row.original.ind_activo ? "Desactivar" : "Activar"}
            onClick={() => {
              const isActive = Boolean(row.original.ind_activo)
              deactivateActivateProviderMutation.mutate({ id_proveedor: row.original.id_proveedor, activar: !isActive })
            }}
            disabled={deactivateActivateProviderMutation.isPending}
            className={row.original.ind_activo ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            <Power className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

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
    let rows = data
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((r: any) => r.nom_proveedor?.toLowerCase().includes(q))
    }
    rows = [...rows].sort((a: any, b: any) => {
      let va: any, vb: any
      if (sortBy === 'fecha') {
        va = a.fec_insert || ''
        vb = b.fec_insert || ''
      } else {
        va = a.nom_proveedor || ''
        vb = b.nom_proveedor || ''
      }
      const cmp = String(va).localeCompare(String(vb))
      return sortOrder === 'ASC' ? cmp : -cmp
    })
    return rows
  }, [data, search, sortBy, sortOrder])

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Proveedores"
        description="Agrega y gestiona tus proveedores"
        onCreateClick={() => setOpenCreate(true)}
        createLabel="Agregar Proveedor"
      />

      <CreateEntityModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        type="provider"
        title="Nuevo Proveedor"
        onSubmit={async (values) => {
          await providerService.createProvider({ 
            nom_proveedor: values.nom_proveedor, 
            email: values.email,
            tel_proveedor: values.tel_proveedor,
            ind_activo: values.ind_activo 
          })
          queryClient.invalidateQueries({ queryKey: ['providers', 'all'] })
        }}
      />

      <EditEntityModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        type="provider"
        title="Editar Proveedor"
        initialValues={{ 
          nom_proveedor: (editing as any)?.nom_proveedor, 
          email: (editing as any)?.email || '',
          tel_proveedor: (editing as any)?.tel_proveedor || '',
          ind_activo: (editing as any)?.ind_activo ?? true 
        }}
        onSubmit={async (values) => {
          await providerService.updateProvider((editing as any)?.id_proveedor, { 
            nom_proveedor: values.nom_proveedor,
            email: values.email || undefined,
            tel_proveedor: values.tel_proveedor || undefined,
            ind_activo: values.ind_activo 
          })
          queryClient.invalidateQueries({ queryKey: ['providers', 'all'] })
        }}
      />

      {/* Filtros */}
      <ProvidersFilters
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
        <div className="text-sm text-muted-foreground">Cargando proveedores...</div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar los proveedores.</div>
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length === 0 && (
        <EmptyState 
          title="Aún no tienes proveedores"
          description="Agrega proveedores para gestionar compras e inventario."
          iconPath="M3 7h18M7 7v10m10-10v10M5 17h14"
          primaryAction={<a href="/admin/providers/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Proveedor</a>}
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

export default ProvidersPage