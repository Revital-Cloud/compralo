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
  const { data: stats, isLoading: isLoadingStats } = useOrderStats()
  
  // Usar estadísticas del API si están disponibles, de lo contrario calcular desde las órdenes
  const calculatedStats = useMemo(() => {
    // Si hay stats del API (incluso si total es 0), usarlas
    if (stats && stats.total !== undefined) {
      return stats
    }
    
    // Fallback: calcular desde las órdenes cargadas (solo como respaldo temporal)
    const total = orders.length
    const pendiente = orders.filter(o => o.ind_estado === 1).length
    const completada = orders.filter(o => o.ind_estado === 2).length
    const cancelada = orders.filter(o => o.ind_estado === 3).length
    const totalVentas = orders
      .filter(o => o.ind_estado === 2)
      .reduce((sum, o) => sum + (o.val_total_pedido || 0), 0)
    
    return {
      total,
      pendiente,
      completada,
      cancelada,
      total_ventas: totalVentas
    }
  }, [stats, orders])

  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Filtrar por búsqueda
    if (filters.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter(order => {
        const id = (order.id_orden || '').toLowerCase()
        const nom = (order.nom_usuario || '').toLowerCase()
        const ape = (order.ape_usuario || '').toLowerCase()
        const email = (order.email_usuario || '').toLowerCase()
        
        return id.includes(q) || nom.includes(q) || ape.includes(q) || email.includes(q)
      })
    }

    // Filtrar por estado
    if (filters.status !== undefined) {
      filtered = filtered.filter(order => order.ind_estado === filters.status)
    }

    // Filtrar por fechas
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(order => {
        if (!order.fec_pedido) return false
        try {
          return new Date(order.fec_pedido) >= fromDate
        } catch {
          return false
        }
      })
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // Incluir todo el día
      filtered = filtered.filter(order => {
        if (!order.fec_pedido) return false
        try {
          return new Date(order.fec_pedido) <= toDate
        } catch {
          return false
        }
      })
    }

    return filtered
  }, [orders, filters])

  const columns: ColumnDef<Order>[] = [
    { 
      accessorKey: 'id_orden', 
      header: 'ID Orden', 
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.id_orden || '-'}</span>
      ) 
    },
    { 
      id: 'cliente', 
      header: 'Cliente', 
      cell: ({ row }) => {
        const nomUsuario = row.original.nom_usuario ?? ''
        const apeUsuario = row.original.ape_usuario ?? ''
        const emailUsuario = row.original.email_usuario ?? ''
        
        return (
          <div className="space-y-1">
            <div className="font-medium">{nomUsuario} {apeUsuario}</div>
            <div className="text-sm text-muted-foreground">{emailUsuario}</div>
          </div>
        )
      }
    },
    { 
      accessorKey: 'fec_pedido', 
      header: 'Fecha', 
      cell: ({ row }) => {
        const fecha = row.original.fec_pedido
        if (!fecha) return <div className="text-sm">-</div>
        
        try {
          return (
            <div className="text-sm">
              {new Date(fecha).toLocaleDateString('es-CO')}
            </div>
          )
        } catch {
          return <div className="text-sm">-</div>
        }
      }
    },
    { 
      accessorKey: 'ind_estado', 
      header: 'Estado', 
      cell: ({ row }) => <OrderStatusBadge status={row.original.ind_estado ?? 0} />
    },
    { 
      id: 'monto', 
      header: 'Monto', 
      cell: ({ row }) => {
        const valTotal = row.original.val_total_pedido ?? 0
        const valDescuentos = row.original.val_total_descuentos ?? 0
        
        return (
          <div className="text-right">
            <div className="font-semibold">${valTotal.toLocaleString('es-CO')}</div>
            {valDescuentos > 0 && (
              <div className="text-sm text-green-600">
                -${valDescuentos.toLocaleString('es-CO')} desc.
              </div>
            )}
          </div>
        )
      } 
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
        showImportButton={false}
      />

      {/* Estadísticas */}
      <OrderStatsCards stats={calculatedStats} />

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