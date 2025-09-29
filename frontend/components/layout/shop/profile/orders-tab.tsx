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

interface OrderDetail {
  id_orden: number;
  fec_insert: string;
  val_total_productos: number;
  val_total_descuentos: number;
  val_total_pedido: number;
  ind_estado: number;
  des_observaciones?: string | null;
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
      return await api.get<OrderDetail>(`/orders/${selectedOrder.id_orden}`);
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
                    <p className="text-sm text-muted-foreground">{formatDate(o.fec_insert)}</p>
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
                {orderDetail.des_observaciones && (
                  <div className="pt-2">
                    <span className="text-muted-foreground">Observaciones:</span>
                    <p>{orderDetail.des_observaciones}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
