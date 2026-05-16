"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui";
import { Button } from "@/components/ui";
import { ReviewForm } from "@/components/ui";
import { Package, X, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/utils/apiWrapper";
import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { getReviewedProductsInOrder } from "@/services/review.service";
import { getProductImageUrl } from "@/utils/image-helpers";

/**
 * Pestaña de órdenes del perfil.
 *
 * Funciones:
 * - lista órdenes del usuario
 * - abre detalle en drawer
 * - permite reseñar productos por orden (una vez por producto/orden)
 */

interface OrderItem {
  id_orden: number;
  fec_pedido: string;
  val_total_pedido: number;
  ind_estado: number;
}

interface OrderProductItem {
  id_item?: number;
  id_categoria?: number;
  id_producto?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image?: string | null;
  /** URL de imagen según color elegido (viene del backend cuando aplica). */
  imagen_url?: string | null;
  item_discounts?: any;
  /** Opciones elegidas (ej. color, talla). */
  opciones_elegidas?: Record<string, string>;
}

interface OrderDetail {
  id_orden: number;
  fec_insert: string;
  val_total_productos: number;
  val_total_descuentos: number;
  /** Costo de envío COP (tab_ordenes.val_costo_envio). */
  val_costo_envio?: number;
  val_total_pedido: number;
  ind_estado: number;
  des_observaciones?: string | null;
  items?: OrderProductItem[];
  detalle_descuentos_aplicados?: any[] | null;
  metodo_pago?: string | null;
}

interface OrderShippingLive {
  tracking_number?: string | null;
  tracking_url?: string | null;
  label_url?: string | null;
  carrier?: string | null;
  estado_envio?: string | null;
}

function formatStatus(state: number) {
  switch (state) {
    case 1: return "Pendiente de pago";
    case 2: return "En camino";
    case 3: return "Completada";
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

function formatCurrency(value: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function isHttpUrl(s: string | null | undefined): boolean {
  const t = (s ?? "").trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

function getOrderHeadline(state: number) {
  switch (state) {
    case 1:
      return "Estamos preparando tu pedido";
    case 2:
      return "Tu pedido va en camino";
    case 3:
      return "Pedido completado";
    case 4:
      return "Este pedido fue cancelado";
    default:
      return "Estado actualizado de tu pedido";
  }
}

export default function OrdersTab() {
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [reviewingProduct, setReviewingProduct] = useState<number | null>(null);
  const [existingReviews, setExistingReviews] = useState<Set<string>>(new Set());
  
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

  const { data: shippingLive } = useQuery({
    queryKey: ["order-shipping", selectedOrder?.id_orden],
    queryFn: async () => {
      if (!selectedOrder?.id_orden) return null;
      return await api.get<OrderShippingLive>(`/orders/${selectedOrder.id_orden}/shipping`);
    },
    enabled: !!selectedOrder?.id_orden,
    retry: false,
  });

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!reviewingProduct || !orderDetail) return;
    
    try {
      // Obtener los datos del producto desde la orden
      const product = orderDetail.items?.find((item: OrderProductItem) => item.id_item === reviewingProduct);
      if (!product) {
        toast.error('No se encontró el producto');
        return;
      }

      // Crear comentario (solo id_producto e id_orden; sin línea/sublinea)
      const { createComment } = await import('@/services/review.service');
      const idProducto = Number(product.id_producto);
      if (!idProducto) {
        toast.error('No se pudo identificar el producto para la reseña');
        return;
      }
      await createComment({
        id_producto: idProducto,
        id_orden: Number(orderDetail.id_orden),
        comentario: comment.trim(),
        calificacion: rating
      });

      // Clave de producto para “ya reseñado”: el backend devuelve product_id como string
      const productKey = String(idProducto);
      if (orderDetail?.id_orden) {
        setReviewsSentByOrder(prev => {
          const newMap = new Map(prev);
          const orderReviews = newMap.get(orderDetail.id_orden) || new Set();
          orderReviews.add(productKey);
          newMap.set(orderDetail.id_orden, orderReviews);
          return newMap;
        });
      }
      
      // Cerrar el formulario de reseña
      setReviewingProduct(null);
      
      toast.success('¡Reseña enviada exitosamente!');
    } catch (error: any) {
      const resData = error?.response?.data;
      console.error('Error al enviar comentario:', { status: error?.response?.status, data: resData, error });
      
      // Extraer el mensaje de error del backend (puede ser string o array de validación)
      let errorMessage = 'Error al enviar el comentario. Inténtalo de nuevo.';
      const detail = resData?.detail;
      if (detail != null) {
        errorMessage = typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((e: { msg?: string }) => e?.msg ?? '').filter(Boolean).join('. ') || errorMessage
            : errorMessage;
        
        // Si el error indica que ya existe una reseña, actualizar el estado
        if (typeof errorMessage === 'string' && errorMessage.includes('Ya has reseñado')) {
          const product = orderDetail?.items?.find((item: OrderProductItem) => item.id_item === reviewingProduct);
          if (product && orderDetail?.id_orden) {
            const productKey = product.id_producto != null ? String(product.id_producto) : `item-${product.id_item}`;
            setReviewsSentByOrder(prev => {
              const newMap = new Map(prev);
              const orderReviews = newMap.get(orderDetail.id_orden) || new Set();
              orderReviews.add(productKey);
              newMap.set(orderDetail.id_orden, orderReviews);
              return newMap;
            });
          }
          setReviewingProduct(null);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Mostrar el mensaje de error específico
      toast.error(errorMessage);
    }
  };

  const getProductImage = (productImage: any) => {
    return getProductImageUrl(productImage, "/placeholder-product.jpg");
  };

  // Estado para rastrear reseñas enviadas por orden (solo en la sesión actual)
  // Formato: Map<id_orden, Set<productKey>>
  const [reviewsSentByOrder, setReviewsSentByOrder] = useState<Map<number, Set<string>>>(new Map());

  // Cargar productos ya reseñados cuando se abre una orden
  useEffect(() => {
    const loadReviewedProducts = async () => {
      if (!orderDetail?.id_orden) return;
      
      // Verificar si ya cargamos las reseñas para esta orden
      if (reviewsSentByOrder.has(orderDetail.id_orden)) return;

      try {
        const response = await getReviewedProductsInOrder(orderDetail.id_orden);
        
        if (response.success && response.data.length > 0) {
          setReviewsSentByOrder(prev => {
            const newMap = new Map(prev);
            newMap.set(orderDetail.id_orden, new Set(response.data));
            return newMap;
          });
        }
      } catch (error) {
        console.error('Error al cargar productos reseñados:', error);
      }
    };

    loadReviewedProducts();
  }, [orderDetail?.id_orden]);

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
              {orders.map((o: OrderItem) => (
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

      {/* Drawer de detalles de orden */}
      <Drawer open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)} direction="right">
        <DrawerContent className="h-full w-full sm:w-3/5 lg:w-1/2">
          <DrawerHeader className="flex flex-row items-center justify-between">
            <div>
              <DrawerTitle>Orden #{selectedOrder?.id_orden}</DrawerTitle>
              <DrawerDescription>
                Detalles completos de tu orden
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <button className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </button>
            </DrawerClose>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isLoadingDetail ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando detalles…</p>
              </div>
            ) : orderDetail ? (
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <p className="text-sm font-medium text-primary">¡Gracias por tu compra!</p>
                <h2 className="mt-2 text-3xl font-semibold leading-tight tracking-tight">
                  {getOrderHeadline(orderDetail.ind_estado)}
                </h2>
                <p className="mt-3 text-base text-muted-foreground">
                  Tu orden #{orderDetail.id_orden} está en estado <span className="font-medium text-foreground">{formatStatus(orderDetail.ind_estado)}</span>.
                </p>

                <div className="mt-8 grid gap-6 border-y border-border py-6 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Fecha</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {orderDetail.fec_insert ? formatDate(orderDetail.fec_insert) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Método de pago</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatPaymentMethod(orderDetail.metodo_pago)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Total pagado</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(orderDetail.val_total_pedido)}</p>
                  </div>
                </div>

                {orderDetail.ind_estado >= 2 && (
                  <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm font-medium text-foreground">Envío y seguimiento</p>
                    {shippingLive?.carrier && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Transportista:{" "}
                        <span className="text-foreground font-medium">{shippingLive.carrier}</span>
                      </p>
                    )}
                    {shippingLive?.estado_envio && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Estado del envío:{" "}
                        <span className="text-foreground font-medium">{shippingLive.estado_envio}</span>
                      </p>
                    )}
                    {shippingLive?.tracking_url && shippingLive?.tracking_number ? (
                      <p className="mt-2 text-sm">
                        <a
                          href={shippingLive.tracking_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {shippingLive.tracking_number}
                        </a>
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {shippingLive?.tracking_number
                          ? shippingLive.tracking_number
                          : "Cuando el transportista asigne el número de seguimiento, aparecerá aquí."}
                      </p>
                    )}
                    {isHttpUrl(shippingLive?.label_url) ? (
                      <p className="mt-2 text-sm">
                        <a
                          href={(shippingLive?.label_url ?? "").trim()}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          Ver etiqueta (PDF)
                        </a>
                      </p>
                    ) : null}
                  </div>
                )}

                {orderDetail.items && orderDetail.items.length > 0 ? (
                  <div className="space-y-6 pt-8">
                    {orderDetail.items.map((it: OrderProductItem, idx: number) => {
                      const productImage = getProductImageUrl(it.imagen_url || it.product_image, "/placeholder-product.jpg");
                      const isReviewing = reviewingProduct === it.id_item;
                      const productKey = it.id_producto != null ? String(it.id_producto) : `item-${it.id_item ?? idx}`;
                      const orderReviews = reviewsSentByOrder.get(orderDetail.id_orden) || new Set();
                      const hasReviewInThisOrder = orderReviews.has(productKey);

                      return (
                        <div key={idx} className="space-y-3 border-b border-border pb-6 last:border-b-0 last:pb-0">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div className="flex-shrink-0">
                              {productImage ? (
                                <Image
                                  src={productImage}
                                  alt={it.product_name}
                                  width={100}
                                  height={100}
                                  className="h-[100px] w-[100px] rounded-lg border border-border object-cover"
                                />
                              ) : (
                                <div className="flex h-[100px] w-[100px] items-center justify-center rounded-lg border border-border bg-muted">
                                  <Package className="h-7 w-7 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <p className="text-2xl font-medium leading-tight">{it.product_name}</p>
                              {it.opciones_elegidas && Object.keys(it.opciones_elegidas).length > 0 && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {Object.entries(it.opciones_elegidas)
                                    .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
                                    .join(", ")}
                                </p>
                              )}
                              {it.item_discounts && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Descuentos: {Array.isArray(it.item_discounts) ? it.item_discounts.map((d:any)=>d.nombre||d.codigo).join(", ") : "-"}
                                </p>
                              )}

                              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                                <span className="font-medium text-foreground">Cantidad</span>
                                <span className="text-muted-foreground">{it.quantity}</span>
                                <span className="h-4 w-px bg-border" />
                                <span className="font-medium text-foreground">Precio</span>
                                <span className="text-muted-foreground">{formatCurrency(it.unit_price)}</span>
                                <span className="h-4 w-px bg-border" />
                                <span className="font-medium text-foreground">Subtotal</span>
                                <span className="text-muted-foreground">{formatCurrency(it.total_price)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReviewingProduct(isReviewing ? null : it.id_item || null)}
                              className="text-xs"
                              disabled={hasReviewInThisOrder}
                            >
                              <MessageSquare className="mr-1 h-3 w-3" />
                              {hasReviewInThisOrder
                                ? "Ya reseñaste este producto"
                                : isReviewing
                                  ? "Cancelar reseña"
                                  : "Haz tu reseña"}
                            </Button>
                          </div>

                          {isReviewing && (
                            <ReviewForm
                              productName={it.product_name}
                              onSubmit={handleReviewSubmit}
                              onCancel={() => setReviewingProduct(null)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="pt-8">
                    <p className="text-base font-medium">Productos</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No se encontró detalle de productos para esta orden. Si crees que es un error, contacta a soporte.
                    </p>
                  </div>
                )}

                <div className="mt-8 grid gap-6 border-y border-border py-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Resumen de pago</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatCurrency(orderDetail.val_total_productos)}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Descuentos</span>
                        <span>-{formatCurrency(orderDetail.val_total_descuentos || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Envío</span>
                        <span>
                          {Number(orderDetail.val_costo_envio ?? 0) > 0
                            ? formatCurrency(Number(orderDetail.val_costo_envio))
                            : "Gratis"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span>Total</span>
                        <span>{formatCurrency(orderDetail.val_total_pedido)}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Estado del envío</p>
                    <p className="mt-3 text-sm text-muted-foreground">{formatStatus(orderDetail.ind_estado)}</p>
                    {orderDetail.des_observaciones && (
                      <>
                        <p className="mt-4 text-sm font-medium text-foreground">Observaciones</p>
                        <p className="mt-1 text-sm text-muted-foreground">{orderDetail.des_observaciones}</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-6">
                  <p className="text-sm font-medium text-foreground">Descuentos aplicados</p>
                  {(orderDetail.detalle_descuentos_aplicados && (orderDetail.detalle_descuentos_aplicados as any[])?.length > 0) ? (
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {(orderDetail.detalle_descuentos_aplicados as any[]).map((d, idx) => {
                        const label = d.tipo_descuento === "canje_puntos"
                          ? `Descuento por puntos${d.nombre ? `: ${d.nombre}` : ""}`
                          : (d.nombre || d.codigo || "Descuento");
                        const amount = d.descuento_aplicado ?? d.monto ?? d.valor ?? 0;
                        return (
                          <li key={idx} className="flex items-center justify-between">
                            <span>{label}</span>
                            <span>-{formatCurrency(amount)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Sin descuentos aplicados</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
