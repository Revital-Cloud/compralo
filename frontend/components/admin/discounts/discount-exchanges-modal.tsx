'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconX, IconCheck, IconClock, IconAlertCircle } from '@tabler/icons-react'
import { useDiscountExchanges } from '@/hooks/use-discounts'
import type { DiscountExchange } from '@/types/discount'

interface DiscountExchangesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  discountId: string
  discountName: string
}

const getExchangeStatusIcon = (exchange: DiscountExchange) => {
  if (exchange.ind_utilizado) {
    return <IconCheck className="h-4 w-4 text-green-500" />
  }
  
  if (exchange.fec_expiracion_canje && new Date(exchange.fec_expiracion_canje) < new Date()) {
    return <IconAlertCircle className="h-4 w-4 text-red-500" />
  }
  
  return <IconClock className="h-4 w-4 text-yellow-500" />
}

const getExchangeStatusBadge = (exchange: DiscountExchange) => {
  if (exchange.ind_utilizado) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Usado</Badge>
  }
  
  if (exchange.fec_expiracion_canje && new Date(exchange.fec_expiracion_canje) < new Date()) {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Expirado</Badge>
  }
  
  return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Disponible</Badge>
}

export const DiscountExchangesModal = ({ 
  open, 
  onOpenChange, 
  discountId, 
  discountName 
}: DiscountExchangesModalProps) => {
  const { data: exchanges = [], isLoading, isError } = useDiscountExchanges(discountId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de Canjes - {discountName}</DialogTitle>
          <DialogDescription>
            Usuarios que han canjeado este descuento
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Cargando canjes...</div>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-red-600">Error al cargar los canjes</div>
          </div>
        )}

        {!isLoading && !isError && exchanges.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">No hay canjes registrados</div>
          </div>
        )}

        {!isLoading && !isError && exchanges.length > 0 && (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-6 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                  <div>Usuario</div>
                  <div>Email</div>
                  <div>Puntos Usados</div>
                  <div>Estado</div>
                  <div>Fecha Canje</div>
                  <div>Fecha Uso</div>
                </div>

                {/* Rows */}
                {exchanges.map((exchange) => (
                  <div key={exchange.id_canje} className="grid grid-cols-6 gap-4 py-2 border-b items-center">
                    <div className="font-medium">
                      {exchange.nom_usuario} {exchange.ape_usuario}
                    </div>
                    <div className="text-sm">{exchange.email_usuario}</div>
                    <div className="font-semibold text-orange-600">
                      {exchange.puntos_utilizados.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {getExchangeStatusIcon(exchange)}
                      {getExchangeStatusBadge(exchange)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(exchange.fec_canje).toLocaleDateString('es-CO')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {exchange.fec_utilizacion 
                        ? new Date(exchange.fec_utilizacion).toLocaleDateString('es-CO')
                        : '-'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {exchanges.map((exchange) => (
                <div key={exchange.id_canje} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {exchange.nom_usuario} {exchange.ape_usuario}
                    </div>
                    <div className="flex items-center gap-2">
                      {getExchangeStatusIcon(exchange)}
                      {getExchangeStatusBadge(exchange)}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">{exchange.email_usuario}</div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Puntos usados:</span>
                      <div className="font-semibold text-orange-600">
                        {exchange.puntos_utilizados.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fecha canje:</span>
                      <div className="font-medium">
                        {new Date(exchange.fec_canje).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  </div>
                  
                  {exchange.fec_utilizacion && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Fecha uso:</span>
                      <div className="font-medium">
                        {new Date(exchange.fec_utilizacion).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  )}
                  
                  {exchange.fec_expiracion_canje && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Expira:</span>
                      <div className="font-medium">
                        {new Date(exchange.fec_expiracion_canje).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  )}
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
