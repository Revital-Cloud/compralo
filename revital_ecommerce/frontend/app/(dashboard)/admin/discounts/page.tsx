'use client'

import React, { useEffect, useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { useToggleDiscountStatus, useCreateDiscount, useUpdateDiscount, useDiscountStats } from '@/hooks/use-discounts'
import { transformDiscountPayload, discountService } from '@/services/discount.service'
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
import { AdminPageHeaderSkeleton, AdminFiltersSkeleton, AdminTableSkeleton } from "@/components/admin/skeletons"

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
      // Fechas NO obligatorias si:
      // - Es canjeable por puntos
      // - Es solo primera compra
      // - Requiere código de cupón
      // - Es para cumpleaños
      const fechasNoObligatorias = values.ind_canjeable_puntos || values.solo_primera_compra || values.requiere_codigo || values.ind_es_para_cumpleanos
      
      if (!fechasNoObligatorias && (!values.fec_inicio || !values.fec_fin)) {
        toast.error('Las fechas de inicio y fin son requeridas para descuentos generales')
        return
      }
      // Si las fechas no son obligatorias y solo se llenó una, enviar ambas como vacías (el backend exige ambas o ninguna)
      const valuesToSend = { ...values }
      if (fechasNoObligatorias && (!!values.fec_inicio !== !!values.fec_fin)) {
        valuesToSend.fec_inicio = ''
        valuesToSend.fec_fin = ''
      }

      const response = await createMutation.mutateAsync(valuesToSend) as { message?: string; id_descuento?: number }
      toast.success('Descuento creado exitosamente')
      if (response?.id_descuento != null && values.id_usuario_destino && values.cod_cupon?.trim()) {
        try {
          await discountService.sendCouponToUser(response.id_descuento, Number(values.id_usuario_destino))
          toast.success('Código enviado por correo al usuario seleccionado')
        } catch (err: any) {
          toast.error(err?.response?.data?.detail || 'Error al enviar el código por correo')
        }
      }
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
      // Fechas NO obligatorias si:
      // - Es canjeable por puntos
      // - Es solo primera compra
      // - Requiere código de cupón
      // - Es para cumpleaños
      const fechasNoObligatorias = values.ind_canjeable_puntos || values.solo_primera_compra || values.requiere_codigo || values.ind_es_para_cumpleanos
      
      if (!fechasNoObligatorias && (!values.fec_inicio || !values.fec_fin)) {
        toast.error('Las fechas de inicio y fin son requeridas para descuentos generales')
        return
      }
      // Si las fechas no son obligatorias y solo se llenó una, enviar ambas como vacías (el backend exige ambas o ninguna)
      const valuesToSend = { ...values }
      if (fechasNoObligatorias && (!!values.fec_inicio !== !!values.fec_fin)) {
        valuesToSend.fec_inicio = ''
        valuesToSend.fec_fin = ''
      }

      const payload = transformDiscountPayload(valuesToSend)
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
          showImportButton={false}
        />
      </div>

      <CreateDiscountModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSubmit={handleCreateSubmit}
      />

      <EditDiscountModal
        open={openEdit}
        onOpenChange={(v) => {
          setOpenEdit(v)
          if (!v) setEditing(null)
        }}
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
        <div className="space-y-4">
          <AdminPageHeaderSkeleton />
          <AdminFiltersSkeleton />
          <AdminTableSkeleton rows={8} />
        </div>
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
