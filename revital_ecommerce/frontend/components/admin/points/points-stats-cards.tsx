'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { IconCoins, IconUsers, IconTrendingUp } from '@tabler/icons-react'
import type { UserWithPoints } from '@/types/points'

interface PointsStatsCardsProps {
  users: UserWithPoints[]
}

export const PointsStatsCards = ({ users }: PointsStatsCardsProps) => {
  const totalUsuarios = users.length
  const totalPuntosCirculacion = users.reduce((sum, user) => sum + user.puntos_disponibles, 0)
  const promedioPuntosUsuario = totalUsuarios > 0 ? Math.round(totalPuntosCirculacion / totalUsuarios) : 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
          <IconUsers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsuarios}</div>
          <p className="text-xs text-muted-foreground">
            Usuarios registrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Puntos en Circulación</CardTitle>
          <IconCoins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPuntosCirculacion.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Puntos disponibles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio por Usuario</CardTitle>
          <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{promedioPuntosUsuario.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Puntos promedio
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
