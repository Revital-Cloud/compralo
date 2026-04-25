'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CatalogHeader } from '@/components/admin/catalog-header'
import { useAllOrders, useOrderStats } from '@/hooks/use-orders'
import { OrderStatsCards } from '@/components/admin/orders/order-stats-cards'
import { OrderFilters } from '@/components/admin/orders/order-filters'
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge'
import DataTable from '@/components/tables/table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { IconEye, IconCalendar, IconUser, IconMail, IconShoppingCart } from '@tabler/icons-react'
import Link from 'next/link'
import { parseDateSafe } from '@/utils/date-helpers'
import type { Order, OrderFilters as OrderFiltersType } from '@/types/order'
import { useAdminTour } from '../_tour/useAdminDriverTour'
import { searchMatches } from '@/utils/search-helpers'

/** Devuelve el timestamp de inicio del día en hora local para una fecha (para comparar solo por día). */
function getLocalDayStart(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

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

    // Filtrar por búsqueda (sin importar tildes: "jose" encuentra "José")
    if (filters.search?.trim()) {
      const q = String(filters.search).trim()
      filtered = filtered.filter(
        (order) =>
          searchMatches(q, String(order.id_orden ?? '')) ||
          searchMatches(q, order.nom_usuario) ||
          searchMatches(q, order.ape_usuario) ||
          searchMatches(q, order.email_usuario)
      )
    }

    // Filtrar por estado
    if (filters.status !== undefined) {
      filtered = filtered.filter(order => order.ind_estado === filters.status)
    }

    // Filtrar por fechas (en hora local para no depender de UTC)
    const fromLocal = parseDateSafe(filters.dateFrom)
    const toLocal = parseDateSafe(filters.dateTo)
    if (fromLocal || toLocal) {
      const fromTs = fromLocal ? getLocalDayStart(fromLocal) : -Infinity
      const toTs = toLocal ? getLocalDayStart(toLocal) : Infinity
      filtered = filtered.filter(order => {
        if (!order.fec_pedido) return false
        try {
          const orderDate = new Date(order.fec_pedido)
          const orderDayTs = getLocalDayStart(orderDate)
          return orderDayTs >= fromTs && orderDayTs <= toTs
        } catch {
          return false
        }
      })
    }

    return filtered
  }, [orders, filters])

  const columns: ColumnDef<Order>[] = useMemo(() => [
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
      minSize: 130,
      cell: ({ row }) => {
        const valTotal = row.original.val_total_pedido ?? 0
        const valDescuentos = row.original.val_total_descuentos ?? 0
        
        return (
          <div className="tabular-nums min-w-[8rem] shrink-0">
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
      header: () => <div className="text-center w-full">Items</div>,
      cell: ({ row }) => (
        <div className="text-center w-full">
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
  ], [])

  const actions: ColumnDef<Order>[] = useMemo(() => [
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
  ], [])

  const handleFiltersChange = useCallback((newFilters: OrderFiltersType) => {
    setFilters(newFilters)
  }, [])

  const handleClear = useCallback(() => {
    setFilters({
      search: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      limit: 50,
      offset: 0,
    })
  }, [])

  const { startOrdersTour } = useAdminTour()

  useEffect(() => {
    try {
      const seen = localStorage.getItem('revital_orders_tour_seen')
      if (!seen) {
        startOrdersTour()
        localStorage.setItem('revital_orders_tour_seen', '1')
      }
    } catch {
      // ignore
    }
  }, [startOrdersTour])

  return (
    <div className="space-y-6">
      <div data-tour-id="orders-header">
        <CatalogHeader 
          title="Órdenes"
          description="Gestiona todas las órdenes de tu tienda"
          showImportButton={false}
        />
      </div>

      {/* Estadísticas */}
      <div data-tour-id="orders-stats">
        <OrderStatsCards stats={calculatedStats} />
      </div>

      {/* Filtros */}
      <div data-tour-id="orders-filters">
        <OrderFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClear={handleClear}
        />
      </div>

      {/* Tabla de órdenes */}
      {isError && (
        <div className="text-sm text-red-600">No se pudieron cargar las órdenes.</div>
      )}
      {isLoading ? (
        <div className="mt-2 space-y-4">
          {/* Skeleton de header de tabla / controles */}
          <div className="h-10 rounded-md bg-muted/60 animate-pulse" />
          {/* Skeleton de filas de tabla */}
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-md bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : (
        !isError && (
          <div data-tour-id="orders-table">
            <DataTable
              columns={[...columns, ...actions]}
              data={Array.isArray(filteredOrders) ? filteredOrders : []}
              pageSize={10}
              emptyMessage={
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <IconShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <div className="text-lg font-medium">No se encontraron órdenes</div>
                  <div className="text-sm">Intenta ajustar los filtros de búsqueda</div>
                </div>
              }
            />
          </div>
        )
      )}
    </div>
  )
}

export default OrdersPage