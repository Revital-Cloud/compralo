"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ArrowLeft,
  Home,
  Receipt,
  PackageCheck,
  Truck,
  Sparkles
} from "lucide-react";
import { formatPrice } from "@/utils/format-price";
import Loading from "@/components/ui/loading";
import { getTokenForPaymentCallback, clearPaymentCallbackToken } from "@/utils/apiWrapper";
import { clearCartStorage, useCartStore } from "@/stores/cart-store";

type PaymentStatus = 'success' | 'pending' | 'declined' | 'error' | 'unknown';

interface PaymentResultData {
  status: PaymentStatus;
  transactionId?: string;
  amount?: number;
  reference?: string;
  message?: string;
}

interface OrderPreviewItem {
  id_item?: number;
  product_name: string;
  quantity: number;
  total_price: number;
  imagen_url?: string | null;
  product_image?: string | null;
}

interface OrderPreviewDetail {
  id_orden: number;
  items?: OrderPreviewItem[];
}

const normalizeOrderId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const extractOrderId = (payload: unknown): number | null => {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const nestedData = obj.data && typeof obj.data === "object" ? (obj.data as Record<string, unknown>) : null;
  return (
    normalizeOrderId(obj.order_id) ??
    normalizeOrderId(obj.id_orden) ??
    normalizeOrderId(obj.orderId) ??
    normalizeOrderId(obj.idOrder) ??
    normalizeOrderId(nestedData?.order_id) ??
    normalizeOrderId(nestedData?.id_orden) ??
    normalizeOrderId(nestedData?.orderId) ??
    normalizeOrderId(nestedData?.idOrder)
  );
};

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 15000;
const PENDING_FALLBACK_REDIRECT_MS = 5000;

const PaymentResultPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [paymentData, setPaymentData] = useState<PaymentResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pollingOrderId, setPollingOrderId] = useState<number | null | "pending">(null);
  const [orderPreview, setOrderPreview] = useState<OrderPreviewDetail | null>(null);
  const [pendingSince, setPendingSince] = useState<number | null>(null);
  const initializedParamsRef = useRef<string | null>(null);
  const confirmFlowStartedRef = useRef<string | null>(null);
  const finalizedCheckoutRef = useRef(false);
  const pendingFallbackNavigatedRef = useRef(false);
  const statusParam = (searchParams.get("status") as PaymentStatus) || "unknown";
  const transactionIdParam = searchParams.get("transaction_id");
  const amountParam = searchParams.get("amount");
  const referenceParam = searchParams.get("reference");
  const messageParam = searchParams.get("message");

  useEffect(() => {
    const paramsKey = `${statusParam}|${transactionIdParam ?? ""}|${amountParam ?? ""}|${referenceParam ?? ""}|${messageParam ?? ""}`;
    if (initializedParamsRef.current === paramsKey) {
      return;
    }
    initializedParamsRef.current = paramsKey;

    setPaymentData({
      status: statusParam,
      transactionId: transactionIdParam || undefined,
      amount: amountParam ? parseInt(amountParam) : undefined,
      reference: referenceParam || undefined,
      message: messageParam || undefined
    });

    setIsLoading(false);

    if (statusParam === "success") {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }

    if (transactionIdParam) {
      console.log("Transaction ID:", transactionIdParam);
    }
  }, [
    amountParam,
    messageParam,
    queryClient,
    referenceParam,
    statusParam,
    transactionIdParam
  ]);

  // Confirmar checkout y/o hacer polling: si tenemos transaction_id llamamos confirm-checkout (respaldo si el webhook no llegó)
  useEffect(() => {
    const reference = referenceParam;
    const status = statusParam;
    const transactionId = transactionIdParam;
    if (status !== "success" || !reference || !reference.startsWith("revital_cart_")) {
      return;
    }
    const flowKey = `${status}|${reference}|${transactionId ?? ""}`;
    if (confirmFlowStartedRef.current === flowKey) {
      return;
    }
    confirmFlowStartedRef.current = flowKey;

    setPollingOrderId("pending");
    setPendingSince(Date.now());

    // Tras redirect de Wompi la página se recarga y el token en memoria se pierde; usar token guardado para este flujo
    const token = getTokenForPaymentCallback();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const fetchOrderByReference = async (): Promise<{ order_id?: number } | null> => {
      try {
        const res = await fetch(
          `/api/payments/order-by-reference?reference=${encodeURIComponent(reference)}`,
          { method: "GET", headers }
        );
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    };

    let cancelled = false;
    const start = Date.now();

    const tryConfirmCheckout = async (): Promise<number | null> => {
      if (!transactionId) return null;
      try {
        const confirmRes = await fetch("/api/payments/confirm-checkout", {
          method: "POST",
          headers,
          body: JSON.stringify({ reference, transaction_id: transactionId }),
        });
        const confirmData = await confirmRes.json().catch(() => ({}));
        if (cancelled) return null;
          const orderId = extractOrderId(confirmData);
          if (orderId != null) {
          queryClient.invalidateQueries({ queryKey: ["cart"] });
          queryClient.invalidateQueries({ queryKey: ["orders"] });
            return orderId;
        }
      } catch {
        // Ignorar y continuar con el polling
      }
      return null;
    };

    const run = async () => {
      // Primer intento paralelo para minimizar latencia de "obteniendo pedido...".
      const [confirmNow, byReferenceNow] = await Promise.all([
        tryConfirmCheckout(),
        fetchOrderByReference(),
      ]);

      if (cancelled) return;

      const firstResolvedOrderId = confirmNow ?? extractOrderId(byReferenceNow);
      if (firstResolvedOrderId != null) {
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        setPollingOrderId(firstResolvedOrderId);
        setPendingSince(null);
        return;
      }

      // Si no tenemos order_id aún, reintentar confirm-checkout + polling por referencia en paralelo.
      while (!cancelled && Date.now() - start < POLL_TIMEOUT_MS) {
        const [retryConfirmOrderId, retryByReference] = await Promise.all([
          tryConfirmCheckout(),
          fetchOrderByReference(),
        ]);

        if (cancelled) return;

        const resolvedOrderId = retryConfirmOrderId ?? extractOrderId(retryByReference);
        if (resolvedOrderId != null) {
          queryClient.invalidateQueries({ queryKey: ["cart"] });
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          setPollingOrderId(resolvedOrderId);
          setPendingSince(null);
          return;
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }

      if (!cancelled) setPollingOrderId(null);
      if (!cancelled) setPendingSince(null);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [queryClient, referenceParam, statusParam, transactionIdParam]);

  // Fallback UX: si el flujo tarda demasiado, enviar al listado de órdenes.
  useEffect(() => {
    if (pendingSince == null) return;
    if (pendingFallbackNavigatedRef.current) return;
    const timeout = setTimeout(() => {
      if (pendingFallbackNavigatedRef.current) return;
      pendingFallbackNavigatedRef.current = true;
      router.replace("/profile?tab=orders");
    }, PENDING_FALLBACK_REDIRECT_MS);
    return () => clearTimeout(timeout);
  }, [pendingSince, router]);

  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          title: '¡Pago Exitoso!',
          description: 'Tu pago ha sido procesado correctamente.',
          actionText: 'Ver mi pedido',
          actionVariant: 'default' as const
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          title: 'Pago Pendiente',
          description: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
          actionText: 'Seguir comprando',
          actionVariant: 'outline' as const
        };
      case 'declined':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          title: 'Pago Rechazado',
          description: 'Tu pago no pudo ser procesado. Intenta con otro método de pago.',
          actionText: 'Intentar nuevamente',
          actionVariant: 'destructive' as const
        };
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          title: 'Error en el Pago',
          description: 'Ocurrió un error durante el procesamiento del pago.',
          actionText: 'Intentar nuevamente',
          actionVariant: 'destructive' as const
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          title: 'Estado Desconocido',
          description: 'No se pudo determinar el estado del pago.',
          actionText: 'Contactar soporte',
          actionVariant: 'outline' as const
        };
    }
  };

  const getOrderIdFromReference = (reference?: string): number | null => {
    if (!reference) return null;
    // Referencia legacy: revital_{order_id}_{random}
    const match = reference.match(/^revital_(\d+)_/);
    if (match && match[1]) return parseInt(match[1], 10);
    return null;
  };

  // order_id obtenido por polling (checkout session) o por referencia legacy
  const resolvedOrderId =
    paymentData?.reference?.startsWith("revital_cart_")
      ? typeof pollingOrderId === "number"
        ? pollingOrderId
        : null
      : getOrderIdFromReference(paymentData?.reference);

  // Finalizar checkout localmente cuando ya exista order_id:
  // - limpiar token temporal
  // - limpiar estado/caché de carrito para evitar stale UI
  // - mantener al usuario en esta vista con resumen de compra
  useEffect(() => {
    if (paymentData?.status !== "success" || !resolvedOrderId) return;
    if (!paymentData.reference?.startsWith("revital_cart_")) return;
    if (finalizedCheckoutRef.current) return;
    finalizedCheckoutRef.current = true;
    clearPaymentCallbackToken();
    useCartStore.getState().clearCart();
    useCartStore.getState().setCartId(undefined);
    clearCartStorage();
    queryClient.removeQueries({ queryKey: ["cart"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [paymentData?.status, paymentData?.reference, resolvedOrderId, router, queryClient]);

  // Cargar resumen de productos del pedido para mostrarlo en esta misma vista
  useEffect(() => {
    if (!resolvedOrderId) {
      setOrderPreview(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const token = getTokenForPaymentCallback();
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`/api/orders/${resolvedOrderId}/detail`, { method: "GET", headers });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setOrderPreview(data);
        }
      } catch {
        // vista sigue funcionando aunque falle el preview
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [resolvedOrderId]);

  const handlePrimaryAction = () => {
    switch (paymentData?.status) {
      case 'success':
        if (resolvedOrderId) {
          router.push(`/profile/orders/${resolvedOrderId}`);
        } else if (paymentData.reference?.startsWith("revital_cart_") && pollingOrderId === "pending") {
          // Evitar bloqueo de UX: permitir salida al listado de órdenes mientras termina de sincronizar.
          router.push('/profile?tab=orders');
        } else {
          router.push('/profile?tab=orders');
        }
        break;
      case 'pending':
        // Redirigir a la tienda
        router.push('/');
        break;
      case 'declined':
      case 'error':
        // Volver al checkout
        router.push('/checkout');
        break;
      default:
        // Contactar soporte o ir al inicio
        router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Información no disponible</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No se pudo obtener la información del pago.
            </p>
            <Button onClick={() => router.push('/')}>
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getStatusConfig(paymentData.status);
  const StatusIcon = statusConfig.icon;
  const isSuccess = paymentData.status === "success";
  const transactionDate = new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>

        {/* Resultado del pago */}
        <Card className={`${isSuccess ? "border-slate-200/80 shadow-xl shadow-slate-200/40 dark:shadow-none dark:border-slate-800" : `${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}`}>
          <CardContent className="p-8">
            {isSuccess ? (
              <div className="space-y-8">
                <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-cyan-950/30 dark:border-emerald-900/60 p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-slate-900 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                        <Sparkles className="h-3.5 w-3.5" />
                        Pago confirmado
                      </div>
                      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Tu compra ya está en proceso
                      </h1>
                      <p className="text-slate-600 dark:text-slate-300 max-w-xl">
                        Recibimos tu pago correctamente. Estamos preparando tu pedido y muy pronto podrás seguir su estado.
                      </p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-9 w-9 text-emerald-600 dark:text-emerald-300" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white/90 dark:bg-slate-900/80">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</p>
                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">Confirmado</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white/90 dark:bg-slate-900/80">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Fecha</p>
                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">{transactionDate}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white/90 dark:bg-slate-900/80">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total pagado</p>
                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                      {paymentData.amount ? `${formatPrice(paymentData.amount / 100)} COP` : "Sin dato"}
                    </p>
                  </div>
                </div>

                {(paymentData.transactionId || paymentData.reference) && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Datos de la compra
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 text-sm">
                      {paymentData.transactionId && (
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 mb-1">ID de transacción</p>
                          <p className="font-mono text-slate-900 dark:text-white break-all">{paymentData.transactionId}</p>
                        </div>
                      )}
                      {paymentData.reference && (
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 mb-1">Referencia</p>
                          <p className="font-mono text-slate-900 dark:text-white break-all">{paymentData.reference}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <PackageCheck className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      Siguientes pasos
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <li>Estamos validando y preparando tu pedido.</li>
                      <li>Recibirás actualizaciones en tu historial de órdenes.</li>
                      <li>Puedes revisar el detalle cuando quieras.</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      Seguimiento
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Cuando tu pedido cambie de estado podrás verlo desde <span className="font-medium text-slate-900 dark:text-white">Mis Órdenes</span>.
                    </p>
                  </div>
                </div>

                {orderPreview?.items && orderPreview.items.length > 0 && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                      Productos de tu pedido
                    </h3>
                    <div className="space-y-3">
                      {orderPreview.items.map((item, idx) => (
                        <div key={`${item.id_item ?? idx}-${item.product_name}`} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {item.product_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Cantidad: {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatPrice(Number(item.total_price || 0))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <StatusIcon className={`h-16 w-16 ${statusConfig.color} mx-auto`} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {statusConfig.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {statusConfig.description}
                </p>
              </div>
            )}

            {paymentData.message && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {paymentData.message}
                </p>
              </div>
            )}

            {paymentData.status === 'success' &&
              paymentData.reference?.startsWith('revital_cart_') &&
              pollingOrderId === 'pending' && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  Obteniendo tu pedido...
                </p>
            )}
            {paymentData.status === 'success' &&
              paymentData.reference?.startsWith('revital_cart_') &&
              pollingOrderId === null && (
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-4">
                  Si tu pago fue exitoso, tu pedido puede tardar un momento en aparecer. Revisa en Mis Órdenes.
                </p>
            )}

            <div className={`flex flex-col sm:flex-row gap-3 ${isSuccess ? "justify-start pt-8" : "justify-center pt-6"}`}>
              <Button
                variant={statusConfig.actionVariant}
                onClick={handlePrimaryAction}
                className="flex items-center gap-2"
              >
                {statusConfig.actionText}
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Ir al inicio
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Tienes problemas con tu pago?{' '}
            <Button variant="link" className="p-0 h-auto text-sm">
              Contacta nuestro soporte
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentResultPage;
