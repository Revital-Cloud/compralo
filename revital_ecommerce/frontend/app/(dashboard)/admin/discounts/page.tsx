'use client'

import React, { useEffect, useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { useToggleDiscountStatus, useCreateDiscount, useUpdateDiscount, useDiscountStats } from '@/hooks/use-discounts'
import { transformDiscountPayload } from '@/services/discount.service'
import { CreateDiscountModal } from '@/components/admin/discounts/create-discount-modal'
import { EditDiscountModal } from '@/components/admin/discounts/edit-discount-modal'
import { DiscountStatsCards } from '@/components/admin/discounts/discount-stats-cards'
import { DiscountExchangesModal } from '@/components/admin/discounts/discount-exchanges-modal'
import { DiscountFilters } from '@/components/admin/discounts/discount-filters'
import { useDiscountColumns } from '@/components/admin/discounts/discount-columns'
import { useDiscountData } from '@/components/admin/discounts/use-discount-data'
import DataTable from '@/components/tables/table'
import { toast } from 'sonner'
import { useAdminTour } from '../_tour/useAdminDriverTour'

const DiscountsPage = () => {
  const { data: stats } = useDiscountStats()
  const toggleStatusMutation = useToggleDiscountStatus()
  const createMutation = useCreateDiscount()
  const updateMutation = useUpdateDiscount()

  // Modal states
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openExchanges, setOpenExchanges] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [selectedDiscount, setSelectedDiscount] = useState<{ id: string; name: string } | null>(null)

  // Custom hooks
  const { filteredData, isLoading, isError, filters } = useDiscountData()
  const columns = useDiscountColumns({
    onViewExchanges: (id, name) => {
      setSelectedDiscount({ id, name })
      setOpenExchanges(true)
    },
    onEdit: (discount) => {
      setEditing(discount)
      setOpenEdit(true)
    },
    onToggleStatus: (id, activate) => {
      toggleStatusMutation.mutate({ id, activate })
    },
    isToggling: toggleStatusMutation.isPending
  })

  const { startDiscountsTour } = useAdminTour()

  useEffect(() => {
    try {
      const seen = localStorage.getItem('revital_discounts_tour_seen')
      if (!seen) {
        startDiscountsTour()
        localStorage.setItem('revital_discounts_tour_seen', '1')
      }
    } catch {
      // ignore
    }
  }, [startDiscountsTour])

  const handleCreateSubmit = async (values: any) => {
    try {
      // Fechas obligatorias solo si no es canjeable por puntos (plantillas canjeables pueden no tener fechas)
      if (!values.ind_canjeable_puntos && (!values.fec_inicio || !values.fec_fin)) {
        toast.error('Las fechas de inicio y fin son requeridas cuando el descuento no es canjeable por puntos')
        return
      }
      if (values.ind_canjeable_puntos && (!!values.fec_inicio !== !!values.fec_fin)) {
        toast.error('Debe especificar ambas fechas o ninguna')
        return
      }

      await createMutation.mutateAsync(values)
      toast.success('Descuento creado exitosamente')
    } catch (error: any) {
      console.error('Error creating discount:', error)
      let errorMessage = 'Error al crear el descuento'
      
      if (error?.response?.data?.detail) {
        const detail = error.response.data.detail
        if (Array.isArray(detail)) {
          errorMessage = detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
        } else if (typeof detail === 'string') {
          errorMessage = detail
        } else {
          errorMessage = JSON.stringify(detail)
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    }
  }

  const handleEditSubmit = async (values: any) => {
    try {
      const payload = transformDiscountPayload(values)
      await updateMutation.mutateAsync({ id: String(editing?.id_descuento) || '', data: payload })
      toast.success('Descuento actualizado exitosamente')
    } catch (error: any) {
      let errorMessage = 'Error al actualizar el descuento'
      if (error?.response?.data?.detail) {
        const detail = error.response.data.detail
        errorMessage = Array.isArray(detail)
          ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
          : typeof detail === 'string' ? detail : JSON.stringify(detail)
      } else if (error?.message) {
        errorMessage = error.message
      }
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-6">
      <div data-tour-id="discounts-header">
        <CatalogHeader 
          title="Descuentos"
          description="Gestiona los descuentos y cupones de tu tienda"
          onCreateClick={() => setOpenCreate(true)}
          createLabel="Crear Descuento"
        />
      </div>

      <CreateDiscountModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSubmit={handleCreateSubmit}
      />

      <EditDiscountModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        initialValues={editing}
        onSubmit={handleEditSubmit}
      />

      {stats && <DiscountStatsCards stats={stats} />}

      <div data-tour-id="discounts-filters">
        <DiscountFilters
          search={filters.search}
          onSearchChange={filters.setSearch}
          filterType={filters.filterType}
          onFilterTypeChange={filters.setFilterType}
          sortBy={filters.sortBy}
          onSortByChange={filters.setSortBy}
          sortOrder={filters.sortOrder}
          onSortOrderToggle={() => filters.setSortOrder(filters.sortOrder === 'ASC' ? 'DESC' : 'ASC')}
        />
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando descuentos...</div>
      )}

      {isError && (
        <div className="text-sm text-muted-foreground">No hay descuentos disponibles.</div>
      )}

      {!isLoading && !isError && Array.isArray(filteredData) && filteredData.length > 0 && (
        <div data-tour-id="discounts-table">
          <DataTable 
            columns={columns} 
            data={filteredData}
            pageSize={10}
          />
        </div>
      )}

      {!isLoading && !isError && filteredData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron descuentos
        </div>
      )}

      {selectedDiscount && (
        <DiscountExchangesModal
          open={openExchanges}
          onOpenChange={setOpenExchanges}
          discountId={selectedDiscount.id}
          discountName={selectedDiscount.name}
        />
      )}
    </div>
  )
}

export default DiscountsPage
