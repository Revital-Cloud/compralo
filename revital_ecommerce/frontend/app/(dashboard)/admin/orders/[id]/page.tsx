'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrderDetail, useUpdateOrderStatus } from '@/hooks/use-orders'
import { OrderDetailCards } from '@/components/admin/orders/order-detail-cards'
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { IconArrowLeft, IconPackage, IconCoins, IconDiscount, IconCalendar, IconUser } from '@tabler/icons-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { AdminDetailSkeleton } from "@/components/admin/skeletons"

const OrderDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const { data: orderDetail, isLoading, isError } = useOrderDetail(orderId)
  const updateStatusMutation = useUpdateOrderStatus()
  
  const [newStatus, setNewStatus] = useState<number | undefined>(undefined)

  const handleStatusUpdate = async () => {
    if (newStatus === undefined) return
    
    try {
      await updateStatusMutation.mutateAsync({ orderId, status: newStatus })
      toast.success('Estado de orden actualizado exitosamente')
      setNewStatus(undefined)
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Error al actualizar el estado')
    }
  }

  if (isLoading) {
    return (
      <AdminDetailSkeleton />
    )
  }

  if (isError || !orderDetail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Orden no encontrada</h1>
        </div>
        <div className="text-sm text-red-600">No se pudo cargar la información de la orden.</div>
      </div>
    )
  }

  const { orden, productos, direccion_envio, puntos_ganados, descuentos_aplicados } = orderDetail

  // img_producto en la BD es JSONB: puede ser string (URL) u objeto { main, gallery?, thumbnails? }
  const getProductImageUrl = (img: unknown): string => {
    if (!img) return ''
    if (typeof img === 'string') return img
    if (typeof img === 'object' && img !== null && 'main' in img && typeof (img as { main?: string }).main === 'string') {
      return (img as { main: string }).main
    }
    const obj = img as { gallery?: string[] }
    if (Array.isArray(obj?.gallery) && obj.gallery.length > 0) return obj.gallery[0]
    return ''
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Orden #{orden.id_orden}</h1>
            <p className="text-muted-foreground">
              Creada el {new Date(orden.fec_pedido).toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <OrderStatusBadge status={orden.ind_estado} />
          <div className="flex items-center gap-2">
            <Select
              value={newStatus?.toString() ?? orden.ind_estado.toString()}
              onValueChange={(v) => setNewStatus(parseInt(v, 10))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Pendiente</SelectItem>
                <SelectItem value="2">Completada</SelectItem>
                <SelectItem value="3">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            {newStatus !== undefined && newStatus !== orden.ind_estado && (
              <Button 
                size="sm" 
                onClick={handleStatusUpdate}
                disabled={updateStatusMutation.isPending}
              >
                Guardar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cards de información */}
      <OrderDetailCards orderDetail={orderDetail} />

      {/* Información adicional */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Puntos ganados */}
        {puntos_ganados && puntos_ganados > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCoins className="h-5 w-5" />
                Puntos Ganados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                +{puntos_ganados.toLocaleString()} pts
              </div>
              <p className="text-sm text-muted-foreground">
                Puntos acumulados por esta compra
              </p>
            </CardContent>
          </Card>
        )}

        {/* Descuentos aplicados */}
        {descuentos_aplicados && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <IconDiscount className="h-5 w-5" />
                </div>
                Descuentos Aplicados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                let discounts: any[] = []
                if (typeof descuentos_aplicados === 'string') {
                  try {
                    discounts = JSON.parse(descuentos_aplicados)
                  } catch {
                    return (
                      <div className="rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                        Sin descuentos aplicados
                      </div>
                    )
                  }
                } else if (Array.isArray(descuentos_aplicados)) {
                  discounts = descuentos_aplicados
                } else if (typeof descuentos_aplicados === 'object' && descuentos_aplicados !== null) {
                  discounts = [descuentos_aplicados]
                }

                if (!discounts || discounts.length === 0) {
                  return (
                    <div className="rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                      Sin descuentos aplicados
                    </div>
                  )
                }

                const formatAplicaA = (s: string) =>
                  s
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())

                return (
                  <ul className="space-y-2">
                      {discounts.map((discount: any, idx: number) => {
                        const nombre = discount.nombre || discount.codigo || 'Descuento'
                        const tipo = discount.tipo || discount.tipo_descuento || 'descuento'
                        const valor = discount.valor ?? discount.monto ?? 0
                        const descuentoAplicado = Number(discount.descuento_aplicado ?? discount.monto ?? valor)
                        const aplicaA = discount.aplica_a || discount.tipo_aplicacion || ''

                        let tipoLabel = ''
                        if (tipo === 'porcentaje') {
                          tipoLabel = `${valor}% OFF`
                        } else if (tipo === 'fijo' || tipo === 'monto') {
                          tipoLabel = `$${Number(valor).toLocaleString('es-CO')} OFF`
                        } else if (tipo === 'automatico') {
                          tipoLabel = 'Automático'
                        } else if (tipo === 'canje_puntos' || tipo === 'canje') {
                          tipoLabel = 'Canje de puntos'
                        } else {
                          tipoLabel = String(tipo).replace(/_/g, ' ')
                        }

                        return (
                          <li
                            key={idx}
                            className="flex items-center gap-4 rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                              <span className="text-sm font-bold">{tipo === 'porcentaje' ? `${valor}%` : '−'}</span>
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="font-semibold text-foreground">{nombre}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                  {tipoLabel}
                                </span>
                                {aplicaA && (
                                  <span className="inline-flex items-center rounded-md border border-border/80 bg-background px-2 py-0.5 text-xs text-muted-foreground">
                                    {formatAplicaA(aplicaA)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Ahorro
                              </p>
                              <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                −${descuentoAplicado.toLocaleString('es-CO')}
                              </p>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                )
              })()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Productos de la orden */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPackage className="h-5 w-5" />
            Productos ({productos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="space-y-2">
                {/* Header: alineación por columna (7 columnas) */}
                <div className="grid grid-cols-7 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground items-center">
                  <div>Producto</div>
                  <div className="text-left">Cantidad</div>
                  <div className="text-left">Precio Unit.</div>
                  <div className="text-left">Subtotal</div>
                  <div className="text-left">Opciones elegidas</div>
                  <div className="text-left">Imagen</div>
                  <div className="text-left font-mono">ID</div>
                </div>

                {/* Rows */}
                {productos.map((producto, index) => {
                  const imgUrl = (producto as { imagen_url?: string }).imagen_url || getProductImageUrl(producto.img_producto)
                  let opts = (producto as { opciones_elegidas?: Record<string, string> | string }).opciones_elegidas
                  if (typeof opts === 'string') {
                    try { opts = opts ? JSON.parse(opts) : {} } catch { opts = {} }
                  }
                  const optsObj = opts && typeof opts === 'object' ? opts : {}
                  const optsText = Object.keys(optsObj).length > 0
                    ? Object.entries(optsObj)
                        .filter(([, v]) => v != null && String(v).trim() !== '')
                        .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
                        .join(', ')
                    : '—'
                  return (
                    <div key={`order-item-${index}-${producto.id_producto}`} className="grid grid-cols-7 gap-4 py-2 border-b items-center">
                      <div className="font-medium">{producto.nom_producto}</div>
                      <div className="text-left">
                        <Badge variant="outline">{producto.cantidad}</Badge>
                      </div>
                      <div className="text-sm text-left">${producto.val_precio_unitario.toLocaleString('es-CO')}</div>
                      <div className="font-semibold text-left">${producto.val_subtotal.toLocaleString('es-CO')}</div>
                      <div className="text-sm text-muted-foreground text-left">{optsText}</div>
                      <div>
                        {imgUrl ? (
                          <img 
                            src={imgUrl} 
                            alt={producto.nom_producto}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <IconPackage className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">{producto.id_producto}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {productos.map((producto, index) => {
                const imgUrl = (producto as { imagen_url?: string }).imagen_url || getProductImageUrl(producto.img_producto)
                let opts = (producto as { opciones_elegidas?: Record<string, string> | string }).opciones_elegidas
                if (typeof opts === 'string') {
                  try { opts = opts ? JSON.parse(opts) : {} } catch { opts = {} }
                }
                const optsObj = opts && typeof opts === 'object' ? opts : {}
                const optsText = Object.keys(optsObj).length > 0
                  ? Object.entries(optsObj)
                      .filter(([, v]) => v != null && String(v).trim() !== '')
                      .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
                      .join(', ')
                  : null
                return (
                <div key={`order-item-mobile-${index}-${producto.id_producto}`} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {imgUrl ? (
                      <img 
                        src={imgUrl} 
                        alt={producto.nom_producto}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <IconPackage className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{producto.nom_producto}</div>
                      <div className="text-sm text-muted-foreground font-mono">ID: {producto.id_producto}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cantidad:</span>
                      <div className="font-medium">
                        <Badge variant="outline">{producto.cantidad}</Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Precio unit.:</span>
                      <div className="font-medium">${producto.val_precio_unitario.toLocaleString('es-CO')}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Subtotal:</span>
                      <div className="font-semibold">${producto.val_subtotal.toLocaleString('es-CO')}</div>
                    </div>
                  </div>
                  {optsText && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Opciones elegidas: </span>
                      <span>{optsText}</span>
                    </div>
                  )}
                </div>
              )
            })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de la orden */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de la Orden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal productos:</span>
              <span className="font-medium">${orden.val_total_productos.toLocaleString('es-CO')}</span>
            </div>
            {orden.val_total_descuentos > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuentos:</span>
                <span className="font-medium">-${orden.val_total_descuentos.toLocaleString('es-CO')}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total:</span>
              <span>${orden.val_total_pedido.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderDetailPage