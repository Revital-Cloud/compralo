'use client'

import React, { useMemo, useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { useAllOrders, useOrderStats } from '@/hooks/use-orders'
import { OrderStatsCards } from '@/components/admin/orders/order-stats-cards'
import { OrderFilters } from '@/components/admin/orders/order-filters'
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconEye, IconCalendar, IconUser, IconMail, IconShoppingCart } from '@tabler/icons-react'
import Link from 'next/link'
import type { Order, OrderFilters as OrderFiltersType } from '@/types/order'

const OrdersPage = () => {
  const [filters, setFilters] = useState<OrderFiltersType>({
    limit: 50,
    offset: 0
  })
  
  const { data: orders = [], isLoading, isError } = useAllOrders(filters)
  const { data: stats } = useOrderStats()

  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Filtrar por búsqueda
    if (filters.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter(order => 
        order.id_orden.toLowerCase().includes(q) ||
        order.nom_usuario.toLowerCase().includes(q) ||
        order.ape_usuario.toLowerCase().includes(q) ||
        order.email_usuario.toLowerCase().includes(q)
      )
    }

    // Filtrar por estado
    if (filters.status !== undefined) {
      filtered = filtered.filter(order => order.ind_estado === filters.status)
    }

    // Filtrar por fechas
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(order => new Date(order.fec_pedido) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // Incluir todo el día
      filtered = filtered.filter(order => new Date(order.fec_pedido) <= toDate)
    }

    return filtered
  }, [orders, filters])

  const columns: ColumnDef<Order>[] = [
    { 
      accessorKey: 'id_orden', 
      header: 'ID Orden', 
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.id_orden}</span>
      ) 
    },
    { 
      id: 'cliente', 
      header: 'Cliente', 
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.nom_usuario} {row.original.ape_usuario}</div>
          <div className="text-sm text-muted-foreground">{row.original.email_usuario}</div>
        </div>
      ) 
    },
    { 
      accessorKey: 'fec_pedido', 
      header: 'Fecha', 
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.fec_pedido).toLocaleDateString('es-CO')}
        </div>
      ) 
    },
    { 
      accessorKey: 'ind_estado', 
      header: 'Estado', 
      cell: ({ row }) => <OrderStatusBadge status={row.original.ind_estado} />
    },
    { 
      id: 'monto', 
      header: 'Monto', 
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-semibold">${row.original.val_total_pedido.toLocaleString('es-CO')}</div>
          {row.original.val_total_descuentos > 0 && (
            <div className="text-sm text-green-600">
              -${row.original.val_total_descuentos.toLocaleString('es-CO')} desc.
            </div>
          )}
        </div>
      ) 
    },
    { 
      id: 'items_count', 
      header: 'Items', 
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline">
            {row.original.items_count || 0}
          </Badge>
        </div>
      ) 
    },
    { 
      accessorKey: 'metodo_pago', 
      header: 'Pago', 
      cell: ({ row }) => (
        <span className="text-sm">{row.original.metodo_pago || '-'}</span>
      ) 
    },
  ]

  const actions: ColumnDef<Order>[] = [
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <Link href={`/admin/orders/${row.original.id_orden}`}>
          <Button variant="outline" size="sm">
            <IconEye className="h-4 w-4 mr-2" />
            Ver Detalle
          </Button>
        </Link>
      ),
    },
  ]

  const handleFiltersChange = (newFilters: OrderFiltersType) => {
    setFilters(newFilters)
  }

  const handleSearch = () => {
    // Los filtros ya se aplican automáticamente en el useMemo
  }

  const handleClear = () => {
    setFilters({
      limit: 50,
      offset: 0
    })
  }

  return (
    <div className="space-y-6">
      <CatalogHeader 
        title="Órdenes"
        description="Gestiona todas las órdenes de tu tienda"
        createLabel=""
        onCreateClick={() => {}} // Sin botón crear
      />

      {/* Estadísticas */}
      {stats && <OrderStatsCards stats={stats} />}

      {/* Filtros */}
      <OrderFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />

      {/* Tabla de órdenes */}
      {isLoading && <div className="text-sm text-muted-foreground">Cargando órdenes...</div>}
      {isError && <div className="text-sm text-red-600">No se pudieron cargar las órdenes.</div>}
      {!isLoading && !isError && Array.isArray(filteredOrders) && (
        <DataTable 
          columns={[...columns, ...actions]} 
          data={filteredOrders} 
          pageSize={10} 
        />
      )}

      {!isLoading && !isError && filteredOrders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <IconShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <div className="text-lg font-medium">No se encontraron órdenes</div>
          <div className="text-sm">Intenta ajustar los filtros de búsqueda</div>
        </div>
      )}
    </div>
  )
}

export default OrdersPage