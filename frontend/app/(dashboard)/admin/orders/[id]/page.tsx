'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrderDetail, useUpdateOrderStatus } from '@/hooks/use-orders'
import { OrderDetailCards } from '@/components/admin/orders/order-detail-cards'
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { IconArrowLeft, IconPackage, IconCoins, IconDiscount, IconCalendar, IconUser } from '@tabler/icons-react'
import { toast } from 'sonner'
import Link from 'next/link'

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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="text-sm text-muted-foreground">Cargando detalles de la orden...</div>
      </div>
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
            <Select value={newStatus?.toString() || orden.ind_estado.toString()} onChange={(e) => setNewStatus(parseInt(e.target.value))}>
              <option value="1">Pendiente</option>
              <option value="2">Completada</option>
              <option value="3">Cancelada</option>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDiscount className="h-5 w-5" />
                Descuentos Aplicados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {typeof descuentos_aplicados === 'object' ? (
                  <div className="text-sm">
                    <div className="font-medium">Descuentos:</div>
                    <div className="text-muted-foreground">
                      {JSON.stringify(descuentos_aplicados, null, 2)}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {descuentos_aplicados}
                  </div>
                )}
              </div>
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
                {/* Header */}
                <div className="grid grid-cols-6 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                  <div>Producto</div>
                  <div>Cantidad</div>
                  <div>Precio Unit.</div>
                  <div>Subtotal</div>
                  <div>Imagen</div>
                  <div>ID</div>
                </div>

                {/* Rows */}
                {productos.map((producto) => (
                  <div key={producto.id_producto} className="grid grid-cols-6 gap-4 py-2 border-b items-center">
                    <div className="font-medium">{producto.nom_producto}</div>
                    <div className="text-center">
                      <Badge variant="outline">{producto.cantidad}</Badge>
                    </div>
                    <div className="text-sm">${producto.val_precio_unitario.toLocaleString('es-CO')}</div>
                    <div className="font-semibold">${producto.val_subtotal.toLocaleString('es-CO')}</div>
                    <div>
                      {producto.img_producto ? (
                        <img 
                          src={producto.img_producto} 
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
                ))}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {productos.map((producto) => (
                <div key={producto.id_producto} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {producto.img_producto ? (
                      <img 
                        src={producto.img_producto} 
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
                </div>
              ))}
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