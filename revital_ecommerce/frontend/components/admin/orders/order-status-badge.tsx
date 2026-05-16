'use client'

import React from 'react'
import { Badge } from "@/components/ui"
import type { Order } from '@/types/order'

interface OrderStatusBadgeProps {
  status: number | undefined
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const getStatusConfig = (status: number | undefined) => {
    switch (status ?? 0) {
      case 1:
        return {
          label: 'Pendiente de pago',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
        }
      case 2:
        return {
          label: 'En camino',
          className: 'bg-sky-100 text-sky-900 hover:bg-sky-100'
        }
      case 3:
        return {
          label: 'Completada',
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        }
      default:
        return {
          label: 'Desconocido',
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  )
}
