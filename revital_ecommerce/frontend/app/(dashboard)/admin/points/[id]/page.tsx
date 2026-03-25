'use client'

import React, { useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useUserPointsHistory } from '@/hooks/use-points'
import type { PointsMovement } from '@/types/points'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { IconArrowLeft, IconPlus, IconMinus, IconClock } from '@tabler/icons-react'
import { AdminDetailSkeleton } from '@/components/admin/skeletons'

const getMovementIcon = (tipo: number) => {
  switch (tipo) {
    case 1:
      return <IconPlus className="h-4 w-4 text-green-500" />
    case 2:
      return <IconMinus className="h-4 w-4 text-red-500" />
    case 3:
      return <IconClock className="h-4 w-4 text-gray-500" />
    default:
      return <IconClock className="h-4 w-4 text-gray-500" />
  }
}

const getMovementBadge = (tipo: number) => {
  switch (tipo) {
    case 1:
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Acumulación</Badge>
    case 2:
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Canje</Badge>
    case 3:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Expiración</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Desconocido</Badge>
  }
}

const UserPointsHistoryPage = () => {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const userId = params?.id as string
  const userName = searchParams.get('name') || userId

  const { data: historyData, isLoading, isError } = useUserPointsHistory(userId)
  const movements: PointsMovement[] = historyData?.historial || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/points')}
          >
            <IconArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Historial de Puntos - <span className="font-semibold">{userName}</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Movimientos de puntos del usuario
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <AdminDetailSkeleton />
      )}

      {isError && (
        <Card>
          <CardContent className="py-8 text-sm text-red-600">
            Error al cargar el historial.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && movements.length === 0 && (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No hay movimientos registrados para este usuario.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && movements.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Historial de movimientos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Header */}
            <div className="grid grid-cols-[140px_100px_110px_110px_1fr_110px] gap-4 px-4 py-3 border-b font-medium text-xs uppercase tracking-wide text-muted-foreground bg-muted/30">
              <div className="text-left">Tipo</div>
              <div className="text-right">Cantidad</div>
              <div className="text-right">Saldo anterior</div>
              <div className="text-right">Saldo actual</div>
              <div className="text-left">Descripción</div>
              <div className="text-right">Fecha</div>
            </div>

            {/* Rows */}
            <div className="max-h-[70vh] overflow-y-auto">
              {movements.map((movement, index) => (
                <div
                  key={movement.id_movimiento_puntos}
                  className={`grid grid-cols-[140px_100px_110px_110px_1fr_110px] gap-4 px-4 py-3 items-start text-sm ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getMovementIcon(movement.tipo_movimiento_codigo)}
                    {getMovementBadge(movement.tipo_movimiento_codigo)}
                  </div>
                  <div
                    className={`font-semibold text-right tabular-nums flex-shrink-0 ${
                      movement.cantidad_puntos > 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {movement.cantidad_puntos > 0 ? '+' : ''}
                    {movement.cantidad_puntos.toLocaleString()}
                  </div>
                  <div className="text-right text-sm tabular-nums text-muted-foreground flex-shrink-0">
                    {movement.puntos_disponibles_anterior.toLocaleString()}
                  </div>
                  <div className="text-right text-sm font-medium tabular-nums flex-shrink-0">
                    {movement.puntos_disponibles_actual.toLocaleString()}
                  </div>
                  <div className="text-sm text-foreground/90 break-words pr-2">
                    {movement.descripcion}
                  </div>
                  <div className="text-right text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {new Date(movement.fec_movimiento).toLocaleDateString('es-CO')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default UserPointsHistoryPage

