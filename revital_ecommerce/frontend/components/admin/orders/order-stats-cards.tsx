'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { IconShoppingCart, IconClock, IconCheck, IconX, IconCash } from '@tabler/icons-react'
import type { OrderStats } from '@/types/order'

interface OrderStatsCardsProps {
  stats: OrderStats
}

export const OrderStatsCards = ({ stats }: OrderStatsCardsProps) => {
  // Valores por defecto para evitar errores de undefined
  const total = stats?.total ?? 0
  const pendiente = stats?.pendiente ?? 0
  const completada = stats?.completada ?? 0
  const cancelada = stats?.cancelada ?? 0
  // Convertir total_ventas a número si viene como string (Decimal desde backend)
  const totalVentas = typeof stats?.total_ventas === 'string' 
    ? parseFloat(stats.total_ventas) || 0
    : (stats?.total_ventas ?? 0)

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Órdenes</CardTitle>
          <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm sm:text-base lg:text-lg xl:text-2xl font-bold tabular-nums">{total.toLocaleString('es-CO')}</div>
          <p className="text-xs text-muted-foreground truncate">
            Todas las órdenes
          </p>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Pendientes</CardTitle>
          <IconClock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm sm:text-base lg:text-lg xl:text-2xl font-bold text-yellow-600 tabular-nums">{pendiente.toLocaleString('es-CO')}</div>
          <p className="text-xs text-muted-foreground truncate">
            En proceso
          </p>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Completadas</CardTitle>
          <IconCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm sm:text-base lg:text-lg xl:text-2xl font-bold text-green-600 tabular-nums">{completada.toLocaleString('es-CO')}</div>
          <p className="text-xs text-muted-foreground truncate">
            Entregadas
          </p>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Canceladas</CardTitle>
          <IconX className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm sm:text-base lg:text-lg xl:text-2xl font-bold text-red-600 tabular-nums">{cancelada.toLocaleString('es-CO')}</div>
          <p className="text-xs text-muted-foreground truncate">
            Canceladas
          </p>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
          <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Ventas</CardTitle>
          <IconCash className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm sm:text-base lg:text-lg xl:text-2xl font-bold text-blue-600 tabular-nums">
            ${totalVentas.toLocaleString('es-CO')}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Ventas completadas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
