"use client";

import api from '@/utils/apiWrapper';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { formatPrice } from '@/utils/format-price';

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
  /** URL de imagen según color elegido (backend la envía cuando aplica). */
  imagen_url?: string | null;
  item_discounts?: any;
  /** Opciones elegidas por el cliente (ej. { color: "azul", talla: "40" }). */
  opciones_elegidas?: Record<string, string>;
}

interface OrderDetail {
  id_orden: number;
  fec_insert: string;
  val_total_productos: number;
  val_total_descuentos: number;
  val_total_pedido: number;
  ind_estado: number;
  des_observaciones?: string | null;
  detalle_descuentos_aplicados?: Array<{ nombre?: string; tipo_descuento?: string; descuento_aplicado?: number; monto?: number; valor?: number; codigo?: string }> | null;
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
              {order.items.map((it, idx) => {
                const opts = it.opciones_elegidas
                const optsText = opts && Object.keys(opts).length > 0
                  ? Object.entries(opts)
                      .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
                      .join(', ')
                  : null
                return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate">{it.product_name}</p>
                    <p className="text-sm text-muted-foreground">Cantidad: {it.quantity}</p>
                    {optsText && (
                      <p className="text-sm text-muted-foreground mt-0.5">{optsText}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {(() => {
                      // Calcular precio original si hay descuentos aplicados
                      const unitPrice = Number(it.unit_price)
                      const totalPrice = Number(it.total_price)
                      // Si hay descuentos en el item o en la orden, intentar calcular el precio original
                      const hasItemDiscounts = it.item_discounts && Array.isArray(it.item_discounts) && it.item_discounts.length > 0
                      const orderDiscounts = order.detalle_descuentos_aplicados || []
                      
                      // Si hay descuentos, calcular precio original aproximado
                      let originalUnitPrice: number | undefined
                      let discountPercentage: number | undefined
                      
                      if (hasItemDiscounts || orderDiscounts.length > 0) {
                        // Calcular descuento aproximado basado en el total de descuentos de la orden
                        const totalDiscounts = Number(order.val_total_descuentos || 0)
                        const totalProducts = Number(order.val_total_productos || 0)
                        if (totalProducts > 0 && totalDiscounts > 0) {
                          // Aproximación: distribuir el descuento proporcionalmente
                          const discountRatio = totalDiscounts / totalProducts
                          originalUnitPrice = unitPrice / (1 - discountRatio)
                          discountPercentage = Math.round((discountRatio * 100))
                        }
                      }
                      
                      const originalTotalPrice = originalUnitPrice ? originalUnitPrice * it.quantity : undefined
                      const showDiscount = originalUnitPrice && originalUnitPrice > unitPrice
                      
                      return (
                        <>
                          <div className="flex items-center gap-2 justify-end flex-wrap">
                            <p className="text-sm">{formatPrice(unitPrice)} c/u</p>
                            {showDiscount && originalUnitPrice && (
                              <>
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatPrice(originalUnitPrice)} c/u
                                </span>
                                {discountPercentage && discountPercentage > 0 && (
                                  <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
                                    -{discountPercentage}%
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 justify-end flex-wrap mt-1">
                            <p className="font-semibold">{formatPrice(totalPrice)}</p>
                            {showDiscount && originalTotalPrice && originalTotalPrice > totalPrice && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(originalTotalPrice)}
                              </span>
                            )}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              );
              })}
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
        {order.detalle_descuentos_aplicados && order.detalle_descuentos_aplicados.length > 0 && (
          <ul className="list-disc pl-5 text-sm text-muted-foreground">
            {order.detalle_descuentos_aplicados.map((d, idx) => {
              const label = d.tipo_descuento === "canje_puntos"
                ? `Descuento por puntos${d.nombre ? `: ${d.nombre}` : ""}`
                : (d.nombre || d.codigo || "Descuento");
              const amount = d.descuento_aplicado ?? d.monto ?? d.valor ?? 0;
              return (
                <li key={idx}>{label} (-${Number(amount).toLocaleString()})</li>
              );
            })}
          </ul>
        )}
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