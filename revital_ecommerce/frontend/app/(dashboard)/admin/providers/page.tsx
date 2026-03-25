'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui'
import { Pencil, Power, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminTour } from '../_tour/useAdminDriverTour'
import { searchMatches } from '@/utils/search-helpers'
import { AdminPageHeaderSkeleton, AdminFiltersSkeleton, AdminTableSkeleton } from "@/components/admin/skeletons"

interface Provider {
  id_proveedor: number
  nom_proveedor: string
  email?: string
  tel_proveedor?: number
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
          <Button variant="outline" size="icon" aria-label="Ver proveedor" onClick={() => setSelectedProvider(row.original)}>
            <Eye className="w-4 h-4" />
          </Button>
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

  const [search, setSearch] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)

  const clearFilters = () => setSearch('')

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []
    let rows = data as Provider[]
    if (search.trim()) {
      rows = rows.filter((r) => searchMatches(search, r.nom_proveedor))
    }
    return [...rows].sort((a, b) => String(a.nom_proveedor || '').localeCompare(String(b.nom_proveedor || '')))
  }, [data, search])

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const { startProvidersTour } = useAdminTour()

  useEffect(() => {
    try {
      const seen = localStorage.getItem('revital_providers_tour_seen')
      if (!seen) {
        startProvidersTour()
        localStorage.setItem('revital_providers_tour_seen', '1')
      }
    } catch {
      // ignore
    }
  }, [startProvidersTour])

  return (
    <div className="space-y-6">
      <div data-tour-id="providers-header">
        <CatalogHeader 
          title="Proveedores"
          description="Agrega y gestiona tus proveedores"
          onCreateClick={() => setOpenCreate(true)}
          createLabel="Agregar Proveedor"
          showImportButton={false}
        />
      </div>

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

      <div data-tour-id="providers-filters">
        <ProvidersFilters
          search={search}
          onSearchChange={setSearch}
          onClearFilters={clearFilters}
          totalResults={Array.isArray(filteredData) ? filteredData.length : 0}
        />
      </div>

      {isLoading && (
        <div className="space-y-4">
          <AdminPageHeaderSkeleton />
          <AdminFiltersSkeleton />
          <AdminTableSkeleton rows={8} />
        </div>
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
        />
      )}

      {!isLoading && !isError && Array.isArray(filteredData) && filteredData.length > 0 && (
        <div data-tour-id="providers-table">
          <DataTable 
            columns={[...columns, ...actions]} 
            data={filteredData}
            pageSize={10}
            getRowId={(row: Provider) => String(row.id_proveedor)}
          />
        </div>
      )}

      <Sheet open={!!selectedProvider} onOpenChange={(open) => !open && setSelectedProvider(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto px-6 sm:px-8 pt-8 pb-8">
          <SheetHeader className="px-0 pb-6">
            <SheetTitle className="pr-8">Detalle de proveedor</SheetTitle>
          </SheetHeader>
          {selectedProvider && (
            <div className="space-y-6 pt-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{selectedProvider.nom_proveedor}</h3>
                <p className="text-sm text-muted-foreground">ID: {selectedProvider.id_proveedor}</p>
              </div>
              {(selectedProvider as any).email && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                  <p className="text-sm">{(selectedProvider as any).email}</p>
                </div>
              )}
              {(selectedProvider as any).tel_proveedor != null && (selectedProvider as any).tel_proveedor !== '' && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Teléfono</h4>
                  <p className="text-sm">{(selectedProvider as any).tel_proveedor}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Estado</h4>
                <span className={selectedProvider.ind_activo ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
                  {selectedProvider.ind_activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {selectedProvider.fec_insert && (
                <p className="text-sm text-muted-foreground">
                  Fecha de creación: {new Date(selectedProvider.fec_insert).toLocaleDateString('es', { dateStyle: 'medium' })}
                </p>
              )}
              {selectedProvider.fec_update && (
                <p className="text-sm text-muted-foreground">
                  Fecha de actualización: {new Date(selectedProvider.fec_update).toLocaleDateString('es', { dateStyle: 'medium' })}
                </p>
              )}
              <div className="flex flex-col gap-3 pt-6 mt-2 border-t border-border">
                <Button variant="outline" className="w-full" onClick={() => { setEditing(selectedProvider); setSelectedProvider(null); setOpenEdit(true) }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar proveedor
                </Button>
                <Button
                  variant={selectedProvider.ind_activo ? 'default' : 'destructive'}
                  className={selectedProvider.ind_activo ? 'w-full bg-green-600 hover:bg-green-700' : 'w-full'}
                  onClick={() => {
                    deactivateActivateProviderMutation.mutate({ id_proveedor: selectedProvider.id_proveedor, activar: !selectedProvider.ind_activo })
                    setSelectedProvider(null)
                  }}
                  disabled={deactivateActivateProviderMutation.isPending}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {selectedProvider.ind_activo ? 'Desactivar' : 'Activar'} proveedor
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default ProvidersPage