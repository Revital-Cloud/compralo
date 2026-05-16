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

interface OrderShippingLive {
  tracking_number?: string | null;
  tracking_url?: string | null;
  label_url?: string | null;
  carrier?: string | null;
  estado_envio?: string | null;
}

interface OrderDetail {
  id_orden: number;
  fec_insert: string;
  val_total_productos: number;
  val_total_descuentos: number;
  val_costo_envio?: number;
  val_total_pedido: number;
  ind_estado: number;
  des_observaciones?: string | null;
  detalle_descuentos_aplicados?: Array<{ nombre?: string; tipo_descuento?: string; descuento_aplicado?: number; monto?: number; valor?: number; codigo?: string }> | null;
  items?: OrderProductItem[];
  tracking_number?: string | null;
  tracking_url?: string | null;
  shipping_address?: unknown;
  billing_address?: unknown;
  shipping_method?: string | null;
  metodo_pago?: string | null;
}

function formatStatus(state: number) {
  // `ind_estado` viene del backend como un entero y representa el ciclo de vida
  // de la orden. Mapeamos esos estados a textos amigables para UI.
  switch (state) {
    case 1: return 'Pendiente de pago';
    case 2: return 'En camino';
    case 3: return 'Completada';
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

function formatPaymentMethod(method?: string | null) {
  if (!method) return "No disponible";

  const map: Record<string, string> = {
    tarjeta: "Tarjeta",
    efectivo_red_pagos: "Efectivo (red de pagos)",
    transferencia: "Transferencia",
    apple_pay: "Apple Pay",
    mastercard: "Mastercard",
  };

  return map[method] ?? method;
}

function isHttpUrl(s: string | null | undefined): boolean {
  const t = (s ?? "").trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

function formatAddress(address: unknown) {
  if (!address) return ["No disponible"];

  if (typeof address === "string") {
    return [address];
  }

  if (typeof address === "object") {
    const data = address as Record<string, unknown>;
    const lines: string[] = [];

    const name = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
    if (name) lines.push(name);

    const line1 = String(data.line1 ?? data.address1 ?? data.direccion ?? "").trim();
    if (line1) lines.push(line1);

    const line2 = String(data.line2 ?? data.address2 ?? "").trim();
    if (line2) lines.push(line2);

    const city = String(data.city ?? data.ciudad ?? "").trim();
    const state = String(data.state ?? data.departamento ?? "").trim();
    const zip = String(data.zip ?? data.postal_code ?? data.codigo_postal ?? "").trim();
    const country = String(data.country ?? data.pais ?? "").trim();
    const cityLine = [city, state, zip].filter(Boolean).join(", ").trim();
    if (cityLine) lines.push(cityLine);
    if (country) lines.push(country);

    return lines.length > 0 ? lines : ["No disponible"];
  }

  return ["No disponible"];
}

function getHeadlineByStatus(status: number) {
  switch (status) {
    case 1:
      return "Estamos procesando tu pedido";
    case 2:
      return "¡Tu pedido va en camino!";
    case 3:
      return "Pedido completado";
    case 4:
      return "Tu pedido fue cancelado";
    default:
      return "Tu pedido está en camino";
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

  const { data: shippingLive } = useQuery({
    queryKey: ['order-shipping', id],
    queryFn: async () => await api.get<OrderShippingLive>(`/orders/${id}/shipping`),
    enabled: !!id,
  });

  if (isLoading || !order) {
    // Estado de carga (y “sin datos” aún) hasta que el backend responda.
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando orden…
        </div>
      </div>
    );
  }

  const shippingLines = formatAddress(order.shipping_address);
  const billingLines = formatAddress(order.billing_address);

  const trackNum = shippingLive?.tracking_number ?? order.tracking_number;
  const trackUrl = shippingLive?.tracking_url ?? order.tracking_url;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="space-y-2">
        <p className="text-base font-medium text-primary">Thank you!</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{getHeadlineByStatus(order.ind_estado)}</h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Tu orden #{order.id_orden} está en estado{" "}
          <span className="font-medium text-foreground">{formatStatus(order.ind_estado)}</span>.
        </p>
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <p className="text-base font-semibold text-foreground">Envío y seguimiento</p>
        {(shippingLive?.carrier || order.shipping_method) && (
          <p className="mt-2 text-sm text-muted-foreground">
            Transportista:{" "}
            <span className="text-foreground font-medium">
              {shippingLive?.carrier || order.shipping_method}
            </span>
          </p>
        )}
        {shippingLive?.estado_envio && (
          <p className="mt-1 text-sm text-muted-foreground">
            Estado del envío:{" "}
            <span className="text-foreground font-medium">{shippingLive.estado_envio}</span>
          </p>
        )}
        {trackUrl && trackNum ? (
          <a
            href={trackUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-base text-primary underline-offset-4 hover:underline"
          >
            {trackNum}
          </a>
        ) : (
          <p className="mt-2 text-base text-muted-foreground">
            {trackNum ||
              "Cuando el transportista asigne el número de seguimiento, aparecerá aquí."}
          </p>
        )}
        {isHttpUrl(shippingLive?.label_url) ? (
          <p className="mt-3">
            <a
              href={(shippingLive?.label_url ?? "").trim()}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Descargar etiqueta de envío (PDF)
            </a>
          </p>
        ) : null}
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <p className="text-base font-semibold text-foreground">Productos</p>

        {order.items && order.items.length > 0 ? (
          <div className="mt-6 space-y-8">
            {order.items.map((it, idx) => {
              const opts = it.opciones_elegidas;
              const optsText = opts && Object.keys(opts).length > 0
                ? Object.entries(opts)
                    .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
                    .join(", ")
                : null;
              const imageUrl = getProductImageUrl(it.imagen_url || it.product_image, "/placeholder-product.jpg");

              return (
                <div key={idx} className="flex flex-col gap-5 border-b border-border pb-8 last:border-b-0 last:pb-0 sm:flex-row">
                  <div className="flex-shrink-0">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={it.product_name}
                        width={160}
                        height={160}
                        className="h-40 w-full max-w-40 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-40 w-full max-w-40 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-xl font-medium tracking-tight sm:text-2xl">{it.product_name}</p>
                    {optsText && <p className="mt-2 text-base text-muted-foreground">{optsText}</p>}

                    <div className="mt-6 flex flex-wrap items-center gap-2 text-base sm:gap-3 sm:text-lg">
                      <span className="font-medium">Quantity</span>
                      <span className="text-muted-foreground">{it.quantity}</span>
                      <span className="h-5 w-px bg-border" />
                      <span className="font-medium">Price</span>
                      <span className="text-muted-foreground">{formatPrice(it.unit_price)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-muted-foreground">No se encontró detalle de productos para esta orden.</p>
        )}
      </div>

      <div className="mt-10 grid gap-8 border-t border-border pt-8 sm:grid-cols-2">
        <section>
          <p className="text-xl font-medium sm:text-2xl">Shipping address</p>
          <div className="mt-3 space-y-1 break-words text-base text-muted-foreground sm:text-lg">
            {shippingLines.map((line, idx) => (
              <p key={`shipping-${idx}`}>{line}</p>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xl font-medium sm:text-2xl">Billing address</p>
          <div className="mt-3 space-y-1 break-words text-base text-muted-foreground sm:text-lg">
            {billingLines.map((line, idx) => (
              <p key={`billing-${idx}`}>{line}</p>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-10 grid gap-8 border-t border-border pt-8 sm:grid-cols-2">
        <section>
          <p className="text-xl font-medium sm:text-2xl">Payment method</p>
          <div className="mt-3 space-y-1 break-words text-base text-muted-foreground sm:text-lg">
            <p className="break-words">{formatPaymentMethod(order.metodo_pago)}</p>
          </div>
        </section>

        <section>
          <p className="text-xl font-medium sm:text-2xl">Shipping method</p>
          <div className="mt-3 space-y-1 break-words text-base text-muted-foreground sm:text-lg">
            <p className="break-words">{order.shipping_method || "No disponible"}</p>
          </div>
        </section>
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <p className="text-xl font-medium sm:text-2xl">Resumen</p>
        <div className="mt-4 space-y-3 text-base sm:text-lg">
          <div className="flex justify-between text-muted-foreground">
            <span>Fecha</span>
            <span>{order.fec_insert ? formatDate(order.fec_insert) : "—"}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(order.val_total_productos)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Descuentos</span>
            <span>-{formatPrice(order.val_total_descuentos || 0)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Envío</span>
            <span>
              {Number(order.val_costo_envio ?? 0) > 0
                ? formatPrice(Number(order.val_costo_envio))
                : "Gratis"}
            </span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.val_total_pedido)}</span>
          </div>
        </div>

        {order.detalle_descuentos_aplicados && order.detalle_descuentos_aplicados.length > 0 && (
          <ul className="mt-4 space-y-1 text-base text-muted-foreground">
            {order.detalle_descuentos_aplicados.map((d, idx) => {
              const label = d.tipo_descuento === "canje_puntos"
                ? `Descuento por puntos${d.nombre ? `: ${d.nombre}` : ""}`
                : (d.nombre || d.codigo || "Descuento");
              const amount = d.descuento_aplicado ?? d.monto ?? d.valor ?? 0;

              return (
                <li key={idx} className="flex items-center justify-between">
                  <span>{label}</span>
                  <span>-{formatPrice(amount)}</span>
                </li>
              );
            })}
          </ul>
        )}

        {order.des_observaciones && (
          <div className="mt-6">
            <p className="font-medium">Observaciones</p>
            <p className="mt-1 text-muted-foreground">{order.des_observaciones}</p>
          </div>
        )}
      </div>
    </div>
  );
} 