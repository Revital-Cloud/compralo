'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui"
import { Badge } from "@/components/ui"
import { Button } from "@/components/ui"
import { IconX, IconPlus, IconMinus, IconClock } from '@tabler/icons-react'
import { useUserPointsHistory } from '@/hooks/use-points'
import type { PointsMovement } from '@/types/points'

interface UserPointsHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
}

const getMovementIcon = (tipo: number) => {
  switch (tipo) {
    case 1: // Acumulación
      return <IconPlus className="h-4 w-4 text-green-500" />
    case 2: // Canje
      return <IconMinus className="h-4 w-4 text-red-500" />
    case 3: // Expiración
      return <IconClock className="h-4 w-4 text-gray-500" />
    default:
      return <IconClock className="h-4 w-4 text-gray-500" />
  }
}

const getMovementBadge = (tipo: number) => {
  switch (tipo) {
    case 1: // Acumulación
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Acumulación</Badge>
    case 2: // Canje
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Canje</Badge>
    case 3: // Expiración
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Expiración</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Desconocido</Badge>
  }
}

export const UserPointsHistoryModal = ({ 
  open, 
  onOpenChange, 
  userId, 
  userName 
}: UserPointsHistoryModalProps) => {
  const { data: historyData, isLoading, isError } = useUserPointsHistory(userId)

  const movements: PointsMovement[] = historyData?.historial || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de Puntos - {userName}</DialogTitle>
          <DialogDescription>
            Movimientos de puntos del usuario
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Cargando historial...</div>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-red-600">Error al cargar el historial</div>
          </div>
        )}

        {!isLoading && !isError && movements.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">No hay movimientos registrados</div>
          </div>
        )}

        {!isLoading && !isError && movements.length > 0 && (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-6 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                  <div>Tipo</div>
                  <div>Cantidad</div>
                  <div>Saldo Anterior</div>
                  <div>Saldo Actual</div>
                  <div>Descripción</div>
                  <div>Fecha</div>
                </div>

                {/* Rows */}
                {movements.map((movement) => (
                  <div key={movement.id_movimiento_puntos} className="grid grid-cols-6 gap-4 py-2 border-b items-center">
                    <div className="flex items-center gap-2">
                      {getMovementIcon(movement.tipo_movimiento_codigo)}
                      {getMovementBadge(movement.tipo_movimiento_codigo)}
                    </div>
                    <div className={`font-semibold ${movement.cantidad_puntos > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.cantidad_puntos > 0 ? '+' : ''}{movement.cantidad_puntos.toLocaleString()}
                    </div>
                    <div className="text-sm">{movement.puntos_disponibles_anterior.toLocaleString()}</div>
                    <div className="text-sm font-medium">{movement.puntos_disponibles_actual.toLocaleString()}</div>
                    <div className="text-sm">{movement.descripcion}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(movement.fec_movimiento).toLocaleDateString('es-CO')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {movements.map((movement) => (
                <div key={movement.id_movimiento_puntos} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getMovementIcon(movement.tipo_movimiento_codigo)}
                      {getMovementBadge(movement.tipo_movimiento_codigo)}
                    </div>
                    <div className={`font-semibold ${movement.cantidad_puntos > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.cantidad_puntos > 0 ? '+' : ''}{movement.cantidad_puntos.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-sm">{movement.descripcion}</div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Saldo anterior:</span>
                      <div className="font-medium">{movement.puntos_disponibles_anterior.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Saldo actual:</span>
                      <div className="font-medium">{movement.puntos_disponibles_actual.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {new Date(movement.fec_movimiento).toLocaleDateString('es-CO')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <IconX className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
