"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/utils/apiWrapper";
import { useState } from "react";

interface OrderItem {
  id_orden: number;
  fec_pedido: string;
  val_total_pedido: number;
  ind_estado: number;
}

interface OrderProductItem {
  id_item?: number;
  id_producto?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image?: string | null;
  item_discounts?: any;
}

interface OrderDetail {
  id_orden: number;
  fec_insert: string;
  val_total_productos: number;
  val_total_descuentos: number;
  val_total_pedido: number;
  ind_estado: number;
  des_observaciones?: string | null;
  items?: OrderProductItem[];
  detalle_descuentos_aplicados?: any[] | null;
  metodo_pago?: string | null;
}

function formatStatus(state: number) {
  switch (state) {
    case 1: return "Pendiente";
    case 2: return "Procesada";
    case 3: return "Enviada/Cancelada";
    case 4: return "Cancelada";
    default: return "Desconocido";
  }
}

function formatPaymentMethod(m?: string | null) {
  if (!m) return "—";
  const map: Record<string, string> = {
    tarjeta: "Tarjeta",
    efectivo_red_pagos: "Efectivo (red de pagos)",
    transferencia: "Transferencia",
  };
  return map[m] || m;
}

function formatDate(dateString: string) {
  try {
    // Extraer solo la parte de fecha (antes de la T)
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    
    // Formatear como dd/MM/yyyy
    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'Fecha inválida';
  }
}

export default function OrdersTab() {
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", "me"],
    queryFn: async () => {
      const res = await api.get<OrderItem[]>("/orders");
      return res || [];
    }
  });

  const { data: orderDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["order-detail", selectedOrder?.id_orden],
    queryFn: async () => {
      if (!selectedOrder?.id_orden) return null;
      return await api.get<OrderDetail>(`/orders/${selectedOrder.id_orden}/detail`);
    },
    enabled: !!selectedOrder?.id_orden,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Órdenes</CardTitle>
          <CardDescription>Revisa todas tus compras y su estado actual</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando órdenes…</p>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aún no tienes órdenes</p>
              <p className="text-sm text-muted-foreground/70">Cuando realices tu primera compra aparecerá aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div 
                  key={o.id_orden} 
                  className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder({ 
                    id_orden: o.id_orden, 
                    fec_insert: o.fec_pedido, 
                    val_total_productos: 0, 
                    val_total_descuentos: 0, 
                    val_total_pedido: o.val_total_pedido, 
                    ind_estado: o.ind_estado 
                  })}
                >
                  <div>
                    <p className="font-medium">Orden #{Number(o.id_orden)}</p>
                    <p className="text-sm text-muted-foreground">{formatDate((o as any).fec_insert ?? o.fec_pedido)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(o.val_total_pedido).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">{formatStatus(o.ind_estado)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles de orden */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl [&>button]:cursor-pointer">
          <DialogHeader>
            <DialogTitle>Orden #{selectedOrder?.id_orden}</DialogTitle>
            <DialogDescription>
              Detalles completos de tu orden
            </DialogDescription>
          </DialogHeader>
          {isLoadingDetail ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando detalles…</p>
            </div>
          ) : orderDetail ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha</span>
                  <span>{orderDetail.fec_insert ? formatDate(orderDetail.fec_insert) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <span>{formatStatus(orderDetail.ind_estado)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método de pago</span>
                  <span>{formatPaymentMethod(orderDetail.metodo_pago)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${Number(orderDetail.val_total_productos).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descuentos</span>
                  <span>-${Number(orderDetail.val_total_descuentos || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${Number(orderDetail.val_total_pedido).toLocaleString()}</span>
                </div>
                <div className="pt-2 space-y-1">
                  <span className="text-muted-foreground">Descuentos aplicados:</span>
                  {(orderDetail.detalle_descuentos_aplicados && (orderDetail.detalle_descuentos_aplicados as any[])?.length > 0) ? (
                    <ul className="list-disc pl-5 text-sm">
                      {(orderDetail.detalle_descuentos_aplicados as any[]).map((d, idx) => (
                        <li key={idx}>{d.nombre || d.codigo || "Descuento"} (-${Number(d.monto || d.valor || 0).toLocaleString()})</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin descuentos aplicados</p>
                  )}
                </div>
              </div>

              {orderDetail.items && orderDetail.items.length > 0 && (
                <div className="rounded-md border border-border p-4">
                  <p className="font-medium mb-3">Productos</p>
                  <div className="space-y-3">
                    {orderDetail.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="truncate">{it.product_name}</p>
                          <p className="text-sm text-muted-foreground">Cantidad: {it.quantity}</p>
                          {it.item_discounts && (
                            <p className="text-xs text-muted-foreground">Descuentos: {Array.isArray(it.item_discounts) ? it.item_discounts.map((d:any)=>d.nombre||d.codigo).join(', ') : '-'}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm">${Number(it.unit_price).toLocaleString()} c/u</p>
                          <p className="font-semibold">${Number(it.total_price).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {orderDetail.des_observaciones && (
                <div className="pt-2">
                  <span className="text-muted-foreground">Observaciones:</span>
                  <p>{orderDetail.des_observaciones}</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
