"use client";

import api from '@/utils/apiWrapper';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface OrderProductItem {
  id_item?: number;
  id_categoria?: number;
  id_linea?: number;
  id_sublinea?: number;
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
}

function formatStatus(state: number) {
  switch (state) {
    case 1: return 'Pendiente';
    case 2: return 'Procesada';
    case 3: return 'Enviada/Cancelada';
    case 4: return 'Cancelada';
    default: return 'Desconocido';
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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: async () => await api.get<OrderDetail>(`/orders/${id}/detail`),
    enabled: !!id,
  });

  if (isLoading || !order) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando orden…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Orden #{id}</h1>
      <div className="rounded-md border border-border p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fecha</span>
          <span>{order?.fec_insert ? formatDate(order.fec_insert) : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estado</span>
          <span>{formatStatus(order.ind_estado)}</span>
        </div>
        
        {order.items && order.items.length > 0 && (
          <div className="pt-2">
            <p className="font-medium mb-3">Productos</p>
            <div className="space-y-3">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate">{it.product_name}</p>
                    <p className="text-sm text-muted-foreground">Cantidad: {it.quantity}</p>
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
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${Number(order.val_total_productos).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Descuentos</span>
          <span>-${Number(order.val_total_descuentos || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>${Number(order.val_total_pedido).toLocaleString()}</span>
        </div>
        {order.des_observaciones && (
          <div className="pt-2">
            <span className="text-muted-foreground">Observaciones:</span>
            <p>{order.des_observaciones}</p>
          </div>
        )}
      </div>
    </div>
  );
} 