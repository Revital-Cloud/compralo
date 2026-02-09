'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { IconDiscount, IconCoins, IconTrendingUp, IconUsers } from '@tabler/icons-react'
import type { DiscountStats } from '@/types/discount'

interface DiscountStatsCardsProps {
  stats: DiscountStats
}

export const DiscountStatsCards = ({ stats }: DiscountStatsCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Activos</CardTitle>
          <IconDiscount className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.total_activos}</div>
          <p className="text-xs text-muted-foreground">
            Descuentos disponibles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inactivos</CardTitle>
          <IconDiscount className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">{stats.total_inactivos}</div>
          <p className="text-xs text-muted-foreground">
            Descuentos pausados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Canjes</CardTitle>
          <IconTrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.total_canjes}</div>
          <p className="text-xs text-muted-foreground">
            Canjes realizados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Puntos Canjeados</CardTitle>
          <IconCoins className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.total_puntos_canjeados.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Puntos utilizados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
