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
import { IconX, IconCheck, IconClock, IconAlertCircle } from '@tabler/icons-react'
import { useDiscountExchanges } from '@/hooks/use-discounts'
import type { DiscountExchange } from '@/types/discount'

interface DiscountExchangesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  discountId: string
  discountName: string
}

const formatPuntos = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  return Number.isNaN(n) ? '-' : n.toLocaleString('es-CO')
}

const formatDate = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-'
  try {
    const d = new Date(String(value))
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-CO')
  } catch {
    return '-'
  }
}

const getExchangeStatusBadge = (exchange: DiscountExchange) => {
  if (exchange.ind_utilizado) {
    return (
      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 gap-1 font-normal">
        <IconCheck className="h-3.5 w-3.5" />
        Usado
      </Badge>
    )
  }
  if (exchange.fec_expiracion_canje && new Date(exchange.fec_expiracion_canje) < new Date()) {
    return (
      <Badge variant="secondary" className="bg-red-500/20 text-red-700 dark:text-red-300 gap-1 font-normal">
        <IconAlertCircle className="h-3.5 w-3.5" />
        Expirado
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 gap-1 font-normal">
      <IconClock className="h-3.5 w-3.5" />
      Disponible
    </Badge>
  )
}

function ExchangeCard({ exchange }: { exchange: DiscountExchange }) {
  return (
    <article className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-card-foreground">
            {exchange.nom_usuario} {exchange.ape_usuario}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{exchange.email_usuario}</p>
        </div>
        {getExchangeStatusBadge(exchange)}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Puntos</dt>
          <dd className="font-medium text-orange-600 dark:text-orange-400">
            {formatPuntos(exchange.puntos_utilizados)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Canje</dt>
          <dd className="font-medium">{formatDate(exchange.fec_canje)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Uso</dt>
          <dd className="font-medium">{formatDate(exchange.fec_utilizacion)}</dd>
        </div>
        {exchange.fec_expiracion_canje && (
          <div>
            <dt className="text-muted-foreground">Expira</dt>
            <dd className="font-medium">{formatDate(exchange.fec_expiracion_canje)}</dd>
          </div>
        )}
      </dl>
    </article>
  )
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
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] flex flex-col gap-5 p-6 sm:p-6">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-lg font-semibold">Historial de canjes</DialogTitle>
          <DialogDescription className="text-sm">
            {discountName} — usuarios que canjearon este descuento
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Cargando canjes...
          </div>
        )}

        {isError && (
          <div className="py-10 text-center text-sm text-destructive">
            Error al cargar los canjes
          </div>
        )}

        {!isLoading && !isError && exchanges.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground rounded-lg border border-dashed bg-muted/30">
            No hay canjes registrados
          </div>
        )}

        {!isLoading && !isError && exchanges.length > 0 && (
          <ul className="space-y-3 max-h-[min(60vh,400px)] overflow-y-auto">
            {exchanges.map((exchange) => (
              <li key={String(exchange.id_canje)}>
                <ExchangeCard exchange={exchange} />
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end border-t pt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <IconX className="h-4 w-4 mr-1.5" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
