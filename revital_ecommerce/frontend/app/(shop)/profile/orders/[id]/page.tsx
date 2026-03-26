"use client";

import api from '@/utils/apiWrapper';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Package } from 'lucide-react';
import { formatPrice } from '@/utils/format-price';
import Image from 'next/image';
import { getProductImageUrl } from '@/utils/image-helpers';

/**
 * Mapa de la página `profile/orders/[id]`.
 *
 * Objetivo:
 * - Mostrar detalle completo de una orden del cliente.
 * - Renderizar líneas de producto, importes, descuentos y observaciones.
 */

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
  // `ind_estado` viene del backend como un entero y representa el ciclo de vida
  // de la orden. Mapeamos esos estados a textos amigables para UI.
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
    // El backend normalmente envía timestamps en ISO (por ej. "2026-03-26T...").
    // Nos quedamos solo con YYYY-MM-DD para formatear.
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

  // Consulta el detalle de la orden del usuario autenticado.
  // - `enabled: !!id` evita ejecutar la query cuando el `id` aún no se resuelve.
  // - `queryKey` incluye el `id` para cachear correctamente por orden.
  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: async () => await api.get<OrderDetail>(`/orders/${id}/detail`),
    enabled: !!id,
  });

  if (isLoading || !order) {
    // Estado de carga (y “sin datos” aún) hasta que el backend responda.
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
        {/* Metadatos principales de la orden */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fecha</span>
          <span>{order?.fec_insert ? formatDate(order.fec_insert) : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estado</span>
          <span>{formatStatus(order.ind_estado)}</span>
        </div>
        
        {/* Líneas de productos (cada `item` representa una línea snapshot de la compra) */}
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
                // Imagen:
                // - se intenta con `imagen_url` (si existe) o `product_image`
                // - si no hay imagen, se usa un placeholder local para evitar layout shifts.
                const imageUrl = getProductImageUrl(it.imagen_url || it.product_image, "/placeholder-product.jpg");

                return (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex-shrink-0">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={it.product_name}
                        width={60}
                        height={60}
                        className="rounded-md object-cover border border-border"
                      />
                    ) : (
                      <div className="w-15 h-15 bg-muted rounded-md flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{it.product_name}</p>
                    <p className="text-sm text-muted-foreground">Cantidad: {it.quantity}</p>
                    {optsText && (
                      <p className="text-sm text-muted-foreground mt-0.5">{optsText}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {(() => {
                      // Este bloque vive “por ítem” para calcular:
                      // - precio unitario actual
                      // - si el backend envía `item_discounts` con datos suficientes,
                      //   mostrar precio original y % de descuento.
                      const unitPrice = Number(it.unit_price)
                      const totalPrice = Number(it.total_price)

                      // Solo mostrar descuento por producto si el backend lo envía explícitamente en `item_discounts`.
                      // No se debe "inventar" un precio original distribuyendo el descuento total del pedido.
                      const itemDiscounts = Array.isArray(it.item_discounts) ? it.item_discounts : []

                      // Busca el primer valor numérico válido en un conjunto de claves “posibles”.
                      // Se usa porque la API podría variar el nombre del campo (legacy vs nuevo backend).
                      const pickNumber = (obj: any, keys: string[]) => {
                        for (const k of keys) {
                          const v = obj?.[k]
                          const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN
                          if (Number.isFinite(n)) return n
                        }
                        return undefined
                      }

                      // Heurística: si existe precio original o porcentaje en item_discounts, lo mostramos.
                      const originalUnitPrice =
                        itemDiscounts
                          .map((d: any) =>
                            pickNumber(d, [
                              'original_unit_price',
                              'unit_price_original',
                              'precio_unitario_original',
                              'precio_original',
                              'val_precio_original',
                            ])
                          )
                          .find((n: any) => typeof n === 'number' && Number.isFinite(n))

                      const discountPercentage =
                        itemDiscounts
                          .map((d: any) =>
                            pickNumber(d, [
                              'discount_percentage',
                              'percentage',
                              'porcentaje',
                              'porcentaje_descuento',
                              'val_porce_descuento',
                            ])
                          )
                          .find((n: any) => typeof n === 'number' && Number.isFinite(n))

                      // Decisión de UI:
                      // - mostramos el “tachado” del precio original solo si el original existe
                      //   y es mayor al precio unitario actual.
                      const showDiscount =
                        typeof originalUnitPrice === 'number' &&
                        Number.isFinite(originalUnitPrice) &&
                        originalUnitPrice > unitPrice

                      const originalTotalPrice = showDiscount ? originalUnitPrice * it.quantity : undefined
                      
                      return (
                        <>
                          <div className="flex items-center gap-2 justify-end flex-wrap">
                            <p className="text-sm">{formatPrice(unitPrice)} c/u</p>
                            {showDiscount && (
                              <>
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatPrice(originalUnitPrice)} c/u
                                </span>
                                {typeof discountPercentage === 'number' && discountPercentage > 0 && (
                                  <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
                                    -{Math.round(discountPercentage)}%
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 justify-end flex-wrap mt-1">
                            <p className="font-semibold">{formatPrice(totalPrice)}</p>
                            {/* Mostramos el total original solo si es coherente y reduce al total actual */}
                            {showDiscount && typeof originalTotalPrice === 'number' && originalTotalPrice > totalPrice && (
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
              // `detalle_descuentos_aplicados` puede incluir distintos tipos de descuento.
              // Mostramos una etiqueta legible:
              // - si es canje de puntos, rotulamos como “Descuento por puntos”
              // - si hay nombre/código, usamos esos campos para contexto
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