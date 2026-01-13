'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui"
import { Badge } from "@repo/ui"
import { Button } from "@repo/ui"
import { IconEye, IconDots, IconTruck, IconClock, IconPackage, IconX } from "@tabler/icons-react"

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

// Función para obtener configuración de estado
const getOrderStatusConfig = (status: RecentOrder['status']) => {
  const configs = {
    delivered: { color: 'bg-green-100 text-green-800', icon: IconTruck, label: 'Entregado' },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: IconClock, label: 'Pendiente' },
    processing: { color: 'bg-blue-100 text-blue-800', icon: IconPackage, label: 'Procesando' },
    shipped: { color: 'bg-purple-100 text-purple-800', icon: IconTruck, label: 'Enviado' },
    canceled: { color: 'bg-red-100 text-red-800', icon: IconX, label: 'Cancelado' }
  }
  return configs[status] || configs.pending
}

export const RecentOrders = ({ recentOrders, loading }: RecentOrdersProps) => (
  <Card className="col-span-1 lg:col-span-2">
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimas actualizaciones de órdenes</CardDescription>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm">
          <IconEye className="h-4 w-4 mr-2" />
          Ver Todo
        </Button>
        <Button variant="ghost" size="sm">
          <IconDots className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="w-20 h-6 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="space-y-3">
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground pb-3 border-b">
                <div>Cliente</div>
                <div>Producto</div>
                <div>ID Orden</div>
                <div>Fecha</div>
                <div>Estado</div>
                <div className="text-right">Monto</div>
              </div>
              {recentOrders.map((order, index) => {
                const statusConfig = getOrderStatusConfig(order.status)
                return (
                  <div key={order.id} className="grid grid-cols-6 gap-4 text-sm items-center py-3 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {order.customer.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="font-medium">{order.customer}</span>
                    </div>
                    <div className="font-medium text-gray-900">{order.product}</div>
                    <div className="text-muted-foreground font-mono">{order.id}</div>
                    <div className="text-muted-foreground">{order.date}</div>
                    <div>
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="text-right font-semibold">${order.amount.toFixed(2)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {recentOrders.map((order) => {
              const statusConfig = getOrderStatusConfig(order.status)
              return (
                <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {order.customer.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{order.customer}</p>
                          <p className="text-xs text-muted-foreground">{order.product}</p>
                        </div>
                      </div>
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        {order.id} • {order.date}
                      </div>
                      <div className="font-bold">${order.amount.toFixed(2)}</div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </CardContent>
  </Card>
)

export type { RecentOrder } 