'use client'

import React, { useState } from 'react'
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
  const [selectedMovement, setSelectedMovement] = useState<PointsMovement | null>(movements[0] || null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Historial de Puntos - <span className="font-bold">{userName}</span>
          </DialogTitle>
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
          <div className="space-y-6">
            {/* Layout desktop: tabla + detalle lateral */}
            <div className="hidden lg:grid lg:grid-cols-[2fr_1.3fr] lg:gap-6">
              {/* Tabla historial */}
              <div className="rounded-lg border border-border/60 bg-background/60 shadow-sm">
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
                <div className="max-h-[60vh] overflow-y-auto">
                  {movements.map((movement, index) => {
                    const isSelected = selectedMovement?.id_movimiento_puntos === movement.id_movimiento_puntos
                    return (
                      <div
                        key={movement.id_movimiento_puntos}
                        onClick={() => setSelectedMovement(movement)}
                        className={`grid grid-cols-[140px_100px_110px_110px_1fr_110px] gap-4 px-4 py-3 items-start text-sm cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border-l-4 border-primary'
                            : index % 2 === 0
                              ? 'bg-background'
                              : 'bg-muted/40'
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
                          {movement.cantidad_puntos > 0 ? '+' : ''}{movement.cantidad_puntos.toLocaleString()}
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
                    )
                  })}
                </div>
              </div>

              {/* Detalle del movimiento seleccionado */}
              <div className="rounded-lg border border-border/60 bg-background/80 shadow-sm p-4 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Detalle del movimiento
                </h3>
                {selectedMovement ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {getMovementIcon(selectedMovement.tipo_movimiento_codigo)}
                        {getMovementBadge(selectedMovement.tipo_movimiento_codigo)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(selectedMovement.fec_movimiento).toLocaleDateString('es-CO')}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cantidad</p>
                        <p className={`font-semibold tabular-nums ${
                          selectedMovement.cantidad_puntos > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {selectedMovement.cantidad_puntos > 0 ? '+' : ''}{selectedMovement.cantidad_puntos.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tipo</p>
                        <div className="mt-1 inline-flex items-center gap-2">
                          {getMovementIcon(selectedMovement.tipo_movimiento_codigo)}
                          {getMovementBadge(selectedMovement.tipo_movimiento_codigo)}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Saldo anterior</p>
                        <p className="font-medium tabular-nums">
                          {selectedMovement.puntos_disponibles_anterior.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Saldo actual</p>
                        <p className="font-medium tabular-nums">
                          {selectedMovement.puntos_disponibles_actual.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Descripción</p>
                      <p className="text-sm leading-relaxed break-words">
                        {selectedMovement.descripcion}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Selecciona un movimiento en la tabla para ver el detalle.
                  </p>
                )}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {movements.map((movement) => (
                <div key={movement.id_movimiento_puntos} className="border rounded-lg p-4 space-y-3 bg-background/80 shadow-sm">
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
