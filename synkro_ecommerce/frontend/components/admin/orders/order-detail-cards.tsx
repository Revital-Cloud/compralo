'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { IconUser, IconMail, IconPhone, IconMapPin, IconCreditCard, IconCalendar } from '@tabler/icons-react'
import type { OrderDetail, Address } from '@/types/order'

interface OrderDetailCardsProps {
  orderDetail: OrderDetail
}

export const OrderDetailCards = ({ orderDetail }: OrderDetailCardsProps) => {
  const { orden, direccion_envio, puntos_ganados, descuentos_aplicados } = orderDetail

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Información del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUser className="h-5 w-5" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm font-medium">Nombre:</span>
            <div className="text-sm">{orden.nom_usuario} {orden.ape_usuario}</div>
          </div>
          <div>
            <span className="text-sm font-medium">Email:</span>
            <div className="text-sm flex items-center gap-1">
              <IconMail className="h-3 w-3" />
              {orden.email_usuario}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium">ID Usuario:</span>
            <div className="text-sm text-muted-foreground">{orden.id_usuario}</div>
          </div>
        </CardContent>
      </Card>

      {/* Información de la Orden */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCreditCard className="h-5 w-5" />
            Orden
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm font-medium">ID Orden:</span>
            <div className="text-sm font-mono">{orden.id_orden}</div>
          </div>
          <div>
            <span className="text-sm font-medium">Fecha:</span>
            <div className="text-sm flex items-center gap-1">
              <IconCalendar className="h-3 w-3" />
              {new Date(orden.fec_pedido).toLocaleDateString('es-CO')}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium">Método de Pago:</span>
            <div className="text-sm">{orden.metodo_pago || 'No especificado'}</div>
          </div>
          <div>
            <span className="text-sm font-medium">Estado:</span>
            <Badge className={
              orden.ind_estado === 1 ? 'bg-yellow-100 text-yellow-800' :
              orden.ind_estado === 2 ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }>
              {orden.ind_estado === 1 ? 'Pendiente' :
               orden.ind_estado === 2 ? 'Completada' : 'Cancelada'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Dirección de Envío */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMapPin className="h-5 w-5" />
            Dirección
          </CardTitle>
        </CardHeader>
        <CardContent>
          {direccion_envio ? (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Dirección:</span>
                <div className="text-sm">
                  {direccion_envio.calle_direccion}
                  {direccion_envio.numero_direccion ? ` ${direccion_envio.numero_direccion}` : ''}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Ciudad:</span>
                <div className="text-sm">{direccion_envio.ciudad}, {direccion_envio.departamento}</div>
              </div>
              {(direccion_envio as any).barrio && (
                <div>
                  <span className="text-sm font-medium">Barrio:</span>
                  <div className="text-sm">{(direccion_envio as any).barrio}</div>
                </div>
              )}
              {(direccion_envio as any).codigo_postal && (
                <div>
                  <span className="text-sm font-medium">Código postal:</span>
                  <div className="text-sm">{(direccion_envio as any).codigo_postal}</div>
                </div>
              )}
              {(direccion_envio as any).complemento && (
                <div>
                  <span className="text-sm font-medium">Complemento:</span>
                  <div className="text-sm">{(direccion_envio as any).complemento}</div>
                </div>
              )}
              {(direccion_envio as any).referencias && (
                <div>
                  <span className="text-sm font-medium">Referencias:</span>
                  <div className="text-sm">{(direccion_envio as any).referencias}</div>
                </div>
              )}
              {direccion_envio.telefono_contacto && (
                <div>
                  <span className="text-sm font-medium">Teléfono:</span>
                  <div className="text-sm flex items-center gap-1">
                    <IconPhone className="h-3 w-3" />
                    {direccion_envio.telefono_contacto}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No hay información de dirección disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
