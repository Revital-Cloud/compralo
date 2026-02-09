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
      case 1: // Pendiente
        return {
          label: 'Pendiente',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
        }
      case 2: // Completada
        return {
          label: 'Completada',
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        }
      case 3: // Cancelada
        return {
          label: 'Cancelada',
          className: 'bg-red-100 text-red-800 hover:bg-red-100'
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
