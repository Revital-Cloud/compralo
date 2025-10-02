'use client'

import React, { useMemo, useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { useDiscounts, useToggleDiscountStatus, useCreateDiscount, useUpdateDiscount } from '@/hooks/use-discounts'
import { CreateDiscountModal } from '@/components/admin/discounts/create-discount-modal'
import { EditDiscountModal } from '@/components/admin/discounts/edit-discount-modal'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Power } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'

interface Discount {
  id_descuento: string
  des_descuento: string
  tipo_descuento: 'porcentaje' | 'monto_fijo'
  val_descuento: string
  monto_min_compra?: string
  val_puntos_requeridos?: string
  cod_cupon?: string
  fec_inicio?: string
  fec_fin?: string
  ind_activo: boolean
  max_usos?: number
  usos_actuales?: number
  fec_insert?: string
}

const DiscountsPage = () => {
  const { data, isLoading, isError } = useDiscounts()
  const toggleStatusMutation = useToggleDiscountStatus()
  const createMutation = useCreateDiscount()
  const updateMutation = useUpdateDiscount()

  // Filtros locales
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'porcentaje' | 'monto_fijo'>('all')
  const [sortBy, setSortBy] = useState<'nombre' | 'fecha'>('nombre')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')

  // Modales
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editing, setEditing] = useState<Discount | null>(null)

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return []
    let rows = data as Discount[]
    
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r => 
        r.des_descuento?.toLowerCase().includes(q) ||
        r.cod_cupon?.toLowerCase().includes(q)
      )
    }

    if (filterType !== 'all') {
      rows = rows.filter(r => r.tipo_descuento === filterType)
    }

    rows = [...rows].sort((a, b) => {
      let va: any, vb: any
      if (sortBy === 'fecha') {
        va = a.fec_insert || ''
        vb = b.fec_insert || ''
      } else {
        va = a.des_descuento || ''
        vb = b.des_descuento || ''
      }
      const cmp = String(va).localeCompare(String(vb))
      return sortOrder === 'ASC' ? cmp : -cmp
    })
    return rows
  }, [data, search, filterType, sortBy, sortOrder])

  const columns: ColumnDef<Discount>[] = [
    {
      accessorKey: 'id_descuento',
      header: 'ID',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.id_descuento}</span>,
    },
    {
      accessorKey: 'des_descuento',
      header: 'Descripción',
      cell: ({ row }) => <span className="font-medium">{row.original.des_descuento}</span>,
    },
    {
      accessorKey: 'tipo_descuento',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.tipo_descuento === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'val_descuento',
      header: 'Valor',
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {row.original.tipo_descuento === 'porcentaje' 
            ? `${row.original.val_descuento}%` 
            : `$${parseFloat(row.original.val_descuento).toLocaleString('es-CO')}`
          }
        </span>
      ),
    },
    {
      accessorKey: 'cod_cupon',
      header: 'Código',
      cell: ({ row }) => (
        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm">
          {row.original.cod_cupon || '-'}
        </code>
      ),
    },
    {
      accessorKey: 'val_puntos_requeridos',
      header: 'Puntos',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.val_puntos_requeridos ? `${row.original.val_puntos_requeridos} pts` : '-'}
        </span>
      ),
    },
    {
      accessorKey: 'max_usos',
      header: 'Usos',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.usos_actuales || 0} / {row.original.max_usos || '∞'}
        </span>
      ),
    },
    {
      accessorKey: 'ind_activo',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge
          className={
            row.original.ind_activo
              ? 'bg-[#fec806] text-black hover:bg-[#fec806]'
              : 'bg-red-100 text-red-800 hover:bg-red-100'
          }
        >
          {row.original.ind_activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  const actions: ColumnDef<Discount>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            aria-label="Editar descuento"
            onClick={() => {
              setEditing(row.original)
              setOpenEdit(true)
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {row.original.ind_activo ? (
            <Button
              variant="destructive"
              size="icon"
              aria-label="Desactivar"
              onClick={() => toggleStatusMutation.mutate({ 
                id: row.original.id_descuento, 
                activate: false 
              })}
            >
              <Power className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              aria-label="Activar"
              onClick={() => toggleStatusMutation.mutate({ 
                id: row.original.id_descuento, 
                activate: true 
              })}
            >
              <Power className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

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
        onSubmit={async (values) => {
          try {
            await createMutation.mutateAsync(values)
            toast.success('Descuento creado exitosamente')
          } catch (error: any) {
            toast.error(error?.response?.data?.detail || 'Error al crear el descuento')
          }
        }}
      />

      <EditDiscountModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        initialValues={editing}
        onSubmit={async (values) => {
          try {
            await updateMutation.mutateAsync({ id: editing?.id_descuento || '', data: values })
            toast.success('Descuento actualizado exitosamente')
          } catch (error: any) {
            toast.error(error?.response?.data?.detail || 'Error al actualizar el descuento')
          }
        }}
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar por descripción o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="max-w-[200px]"
        >
          <option value="all">Todos los tipos</option>
          <option value="porcentaje">Porcentaje</option>
          <option value="monto_fijo">Monto Fijo</option>
        </Select>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="max-w-[200px]"
        >
          <option value="nombre">Ordenar por nombre</option>
          <option value="fecha">Ordenar por fecha</option>
        </Select>
        <Button
          variant="outline"
          onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
        >
          {sortOrder === 'ASC' ? '↑ Ascendente' : '↓ Descendente'}
        </Button>
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Cargando descuentos...</div>
      )}

      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar los descuentos.</div>
      )}

      {!isLoading && !isError && Array.isArray(filteredData) && filteredData.length > 0 && (
        <DataTable 
          columns={[...columns, ...actions]} 
          data={filteredData}
          pageSize={10}
        />
      )}

      {!isLoading && !isError && filteredData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron descuentos
        </div>
      )}
    </div>
  )
}

export default DiscountsPage

