'use client'

import React, { useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { useToggleDiscountStatus, useCreateDiscount, useUpdateDiscount, useDiscountStats } from '@/hooks/use-discounts'
import { CreateDiscountModal } from '@/components/admin/discounts/create-discount-modal'
import { EditDiscountModal } from '@/components/admin/discounts/edit-discount-modal'
import { DiscountStatsCards } from '@/components/admin/discounts/discount-stats-cards'
import { DiscountExchangesModal } from '@/components/admin/discounts/discount-exchanges-modal'
import { DiscountFilters } from '@/components/admin/discounts/discount-filters'
import { useDiscountColumns } from '@/components/admin/discounts/discount-columns'
import { useDiscountData } from '@/components/admin/discounts/use-discount-data'
import DataTable from '@/components/tables/table'
import { toast } from 'sonner'

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

  const handleCreateSubmit = async (values: any) => {
    try {
      if (!values.fec_inicio || !values.fec_fin) {
        toast.error('Las fechas de inicio y fin son requeridas')
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
      await updateMutation.mutateAsync({ id: String(editing?.id_descuento) || '', data: values })
      toast.success('Descuento actualizado exitosamente')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Error al actualizar el descuento')
    }
  }

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Descuentos"
        description="Gestiona los descuentos y cupones de tu tienda"
        onCreateClick={() => setOpenCreate(true)}
        createLabel="Crear Descuento"
      />

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

      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando descuentos...</div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar los descuentos.</div>
      )}

      {!isLoading && !isError && Array.isArray(filteredData) && filteredData.length > 0 && (
        <DataTable 
          columns={columns} 
          data={filteredData}
          pageSize={10}
        />
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
