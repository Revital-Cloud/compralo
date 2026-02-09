'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Button } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { IconEye, IconTruck, IconClock, IconPackage, IconX } from "@tabler/icons-react"
import { formatPrice } from "@/utils/format-price"
import DataTable from '@/components/tables/table'
import type { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

const PAGE_SIZE_OPTIONS = [5, 10, 20]
const DEFAULT_PAGE_SIZE = 5

interface RecentOrder {
  id: string
  product: string
  date: string
  customer: string
  status: 'delivered' | 'pending' | 'processing' | 'shipped' | 'canceled'
  amount: number
  avatar?: string
}

interface RecentOrdersProps {
  recentOrders: RecentOrder[]
  loading: boolean
}

const getOrderStatusConfig = (status: RecentOrder['status']) => {
  const configs = {
    delivered: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: IconTruck, label: 'Entregado' },
    pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: IconClock, label: 'Pendiente' },
    processing: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: IconPackage, label: 'Procesando' },
    shipped: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: IconTruck, label: 'Enviado' },
    canceled: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: IconX, label: 'Cancelado' }
  }
  return configs[status] || configs.pending
}

export const RecentOrders = ({ recentOrders, loading }: RecentOrdersProps) => {
  const [mobilePage, setMobilePage] = useState(0)
  const [mobilePageSize, setMobilePageSize] = useState(DEFAULT_PAGE_SIZE)

  const columns: ColumnDef<RecentOrder>[] = useMemo(() => [
    {
      id: 'cliente',
      header: 'Cliente',
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-muted-foreground">
              {row.original.customer.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <span className="font-medium">{row.original.customer}</span>
        </div>
      ),
    },
    { accessorKey: 'product', header: 'Producto', cell: ({ row }) => <span className="font-medium">{row.original.product}</span> },
    { accessorKey: 'id', header: 'ID Orden', cell: ({ row }) => <span className="text-muted-foreground font-mono">{row.original.id}</span> },
    { accessorKey: 'date', header: 'Fecha', cell: ({ row }) => <span className="text-muted-foreground">{row.original.date}</span> },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const config = getOrderStatusConfig(row.original.status)
        return <Badge className={config.color}>{config.label}</Badge>
      },
    },
    {
      accessorKey: 'amount',
      header: () => <div className="text-right">Monto</div>,
      cell: ({ row }) => <div className="text-right font-semibold">{formatPrice(row.original.amount)}</div>,
    },
  ], [])

  const mobilePaginatedOrders = useMemo(() => {
    const start = mobilePage * mobilePageSize
    return recentOrders.slice(start, start + mobilePageSize)
  }, [recentOrders, mobilePage, mobilePageSize])

  const mobileTotalPages = Math.max(1, Math.ceil(recentOrders.length / mobilePageSize))

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Últimas actualizaciones de órdenes</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/orders">
            <IconEye className="h-4 w-4 mr-2" />
            Ver Todo
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: DEFAULT_PAGE_SIZE }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="w-20 h-6 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Desktop: DataTable con paginación y select de filas */}
            <div className="hidden lg:block">
              <DataTable<RecentOrder, unknown>
                columns={columns}
                data={recentOrders}
                pageSize={DEFAULT_PAGE_SIZE}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                emptyMessage="No hay órdenes recientes"
                getRowId={(row) => row.id}
              />
            </div>

            {/* Mobile: cards con paginación */}
            <div className="lg:hidden space-y-3">
              {mobilePaginatedOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No hay órdenes recientes</p>
              ) : (
                mobilePaginatedOrders.map((order) => {
                  const statusConfig = getOrderStatusConfig(order.status)
                  return (
                    <Card key={order.id} className="p-4 hover:shadow-md hover:bg-muted/50 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-muted-foreground">
                                {order.customer.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{order.customer}</p>
                              <p className="text-xs text-muted-foreground">{order.product}</p>
                            </div>
                          </div>
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            {order.id} • {order.date}
                          </div>
                          <div className="font-bold">{formatPrice(order.amount)}</div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            <IconEye className="h-3 w-3 mr-2" />
                            Ver orden
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  )
                })
              )}
              {recentOrders.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Filas</span>
                    <Select
                      value={String(mobilePageSize)}
                      onValueChange={(v) => {
                        setMobilePageSize(Number(v))
                        setMobilePage(0)
                      }}
                    >
                      <SelectTrigger className="h-8 w-[72px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      Página {mobilePage + 1} de {mobileTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMobilePage((p) => Math.max(0, p - 1))}
                      disabled={mobilePage === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMobilePage((p) => Math.min(mobileTotalPages - 1, p + 1))}
                      disabled={mobilePage >= mobileTotalPages - 1}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export type { RecentOrder }
