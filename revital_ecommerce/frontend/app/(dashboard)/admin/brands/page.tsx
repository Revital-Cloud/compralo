'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { CreateEntityModal } from '@/components/admin/common/create-entity-modal'
import { EditEntityModal } from '@/components/admin/common/edit-entity-modal'
import { EmptyState } from '@/components/admin/empty-states'
import { useAllBrands } from '@/hooks/use-brands'
import { brandService } from '@/services/brand.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui'
import { Badge } from "@/components/ui"
import { Pencil, Power, Eye } from 'lucide-react'
import { BrandsFilters } from '@/components/admin/brands/brands-filters'
import { toast } from 'sonner'
import { useAdminTour } from '../_tour/useAdminDriverTour'
import { searchMatches } from '@/utils/search-helpers'
import { AdminFiltersSkeleton, AdminTableSkeleton } from '@/components/admin/skeletons'

interface Brand {
  id_marca: number
  nom_marca: string
  fec_insert?: string
  fec_update?: string
  ind_activo?: boolean
}

const BrandsPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useAllBrands()

  const [search, setSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

  const clearFilters = () => setSearch('')

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []
    let rows = data as Brand[]
    if (search.trim()) {
      rows = rows.filter((r) => searchMatches(search, r.nom_marca))
    }
    return [...rows].sort((a, b) => String(a.nom_marca || '').localeCompare(String(b.nom_marca || '')))
  }, [data, search])

  const deactivateActivateBrandMutation = useMutation({
    mutationFn: async ({ id_marca, activar }: { id_marca: number; activar: boolean }) => {
      const result = await brandService.deactivateActivateBrand(id_marca, activar)
      if (!result || (result as any).message === undefined) {
        throw new Error('No se recibió confirmación del servidor')
      }
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brands', 'all'] })
      toast.success(variables.activar ? 'Marca activada exitosamente' : 'Marca desactivada exitosamente')
    },
    onError: (error: any, variables) => {
      console.error(`Error al ${variables.activar ? 'activar' : 'desactivar'} marca:`, error)
      const errorMessage = error?.response?.data?.detail || error?.message || `Error al ${variables.activar ? 'activar' : 'desactivar'} la marca`
      toast.error(errorMessage)
    },
  })

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: 'id_marca',
      header: 'ID',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.id_marca}</span>,
    },
    {
      accessorKey: 'nom_marca',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-medium">{row.original.nom_marca}</span>,
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

  const actions: ColumnDef<Brand>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Ver marca" onClick={() => setSelectedBrand(row.original)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Editar marca" onClick={() => { setEditing(row.original); setOpenEdit(true) }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={row.original.ind_activo ? "default" : "destructive"}
            size="icon"
            aria-label={row.original.ind_activo ? "Desactivar" : "Activar"}
            onClick={() => {
              const isActive = Boolean(row.original.ind_activo)
              deactivateActivateBrandMutation.mutate({ id_marca: row.original.id_marca, activar: !isActive })
            }}
            disabled={deactivateActivateBrandMutation.isPending}
            className={row.original.ind_activo ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            <Power className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ]

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const { startBrandsTour } = useAdminTour()

  useEffect(() => {
    try {
      const seen = localStorage.getItem('revital_brands_tour_seen')
      if (!seen) {
        startBrandsTour()
        localStorage.setItem('revital_brands_tour_seen', '1')
      }
    } catch {
      // ignore
    }
  }, [startBrandsTour])

  return (
    <div className="space-y-6">
      <div data-tour-id="brands-header">
        <CatalogHeader 
          title="Marcas"
          description="Registra las marcas con las que trabajas"
          onCreateClick={() => setOpenCreate(true)}
          createLabel="Agregar Marca"
          showImportButton={false}
        />
      </div>

      <CreateEntityModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        type="brand"
        title="Nueva Marca"
        onSubmit={async (values) => {
          await brandService.createBrand({ nom_marca: values.nom_marca, ind_activo: values.ind_activo })
          queryClient.invalidateQueries({ queryKey: ['brands', 'all'] })
        }}
      />

      <EditEntityModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        type="brand"
        title="Editar Marca"
        initialValues={{ nom_marca: (editing as any)?.nom_marca, ind_activo: (editing as any)?.ind_activo ?? true }}
        onSubmit={async (values) => {
          await brandService.updateBrand((editing as any)?.id_marca, { nom_marca: values.nom_marca, ind_activo: values.ind_activo })
          queryClient.invalidateQueries({ queryKey: ['brands', 'all'] })
        }}
      />

      <div data-tour-id="brands-filters">
        <BrandsFilters
          search={search}
          onSearchChange={setSearch}
          onClearFilters={clearFilters}
          totalResults={Array.isArray(filteredData) ? filteredData.length : 0}
        />
      </div>

      {isLoading && (
        <div className="space-y-4">
          <AdminFiltersSkeleton />
          <AdminTableSkeleton rows={8} />
        </div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar las marcas.</div>
      )}

      {!isLoading && !isError && Array.isArray(data) && data.length === 0 && (
        <EmptyState 
          title="Aún no tienes marcas"
          description="Registra marcas para asociarlas a tus productos."
          iconPath="M12 6l-2 4-4 .5 3 3-.8 4.5L12 16l3.8 2-1-4.5 3-3-4-.5L12 6z"
          primaryAction={<a href="/admin/brands/create" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">Agregar Marca</a>}
        />
      )}

      {!isLoading && !isError && Array.isArray(filteredData) && filteredData.length > 0 && (
        <div data-tour-id="brands-table">
          <DataTable 
            columns={[...columns, ...actions]} 
            data={filteredData}
            pageSize={10}
            getRowId={(row: Brand) => String(row.id_marca)}
          />
        </div>
      )}

      <Sheet open={!!selectedBrand} onOpenChange={(open) => !open && setSelectedBrand(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto px-6 sm:px-8 pt-8 pb-8">
          <SheetHeader className="px-0 pb-6">
            <SheetTitle className="pr-8">Detalle de marca</SheetTitle>
          </SheetHeader>
          {selectedBrand && (
            <div className="space-y-6 pt-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{selectedBrand.nom_marca}</h3>
                <p className="text-sm text-muted-foreground">ID: {selectedBrand.id_marca}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Estado</h4>
                <span className={selectedBrand.ind_activo ? 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-[#fec806] text-black' : 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-600 text-white'}>
                  {selectedBrand.ind_activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {selectedBrand.fec_insert && (
                <p className="text-sm text-muted-foreground">
                  Fecha de creación: {new Date(selectedBrand.fec_insert).toLocaleDateString('es', { dateStyle: 'medium' })}
                </p>
              )}
              {selectedBrand.fec_update && (
                <p className="text-sm text-muted-foreground">
                  Fecha de actualización: {new Date(selectedBrand.fec_update).toLocaleDateString('es', { dateStyle: 'medium' })}
                </p>
              )}
              <div className="flex flex-col gap-3 pt-6 mt-2 border-t border-border">
                <Button variant="outline" className="w-full" onClick={() => { setEditing(selectedBrand); setSelectedBrand(null); setOpenEdit(true) }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar marca
                </Button>
                <Button
                  variant={selectedBrand.ind_activo ? 'default' : 'destructive'}
                  className={selectedBrand.ind_activo ? 'w-full bg-green-600 hover:bg-green-700' : 'w-full'}
                  onClick={() => {
                    deactivateActivateBrandMutation.mutate({ id_marca: selectedBrand.id_marca, activar: !selectedBrand.ind_activo })
                    setSelectedBrand(null)
                  }}
                  disabled={deactivateActivateBrandMutation.isPending}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {selectedBrand.ind_activo ? 'Desactivar' : 'Activar'} marca
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default BrandsPage