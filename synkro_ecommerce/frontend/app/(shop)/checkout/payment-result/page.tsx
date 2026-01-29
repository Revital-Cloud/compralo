"use client";

import React, { useEffect, useState } from "react";
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
  Receipt
} from "lucide-react";
import { formatPrice } from "@/utils/format-price";
import Loading from "@/components/ui/loading";

type PaymentStatus = 'success' | 'pending' | 'declined' | 'error' | 'unknown';

interface PaymentResultData {
  status: PaymentStatus;
  transactionId?: string;
  amount?: number;
  reference?: string;
  message?: string;
}

const PaymentResultPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [paymentData, setPaymentData] = useState<PaymentResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener parámetros de la URL
    const status = searchParams.get('status') as PaymentStatus || 'unknown';
    const transactionId = searchParams.get('transaction_id');
    const amount = searchParams.get('amount');
    const reference = searchParams.get('reference');
    const message = searchParams.get('message');

    setPaymentData({
      status,
      transactionId: transactionId || undefined,
      amount: amount ? parseInt(amount) : undefined,
      reference: reference || undefined,
      message: message || undefined
    });

    setIsLoading(false);

    // Pago exitoso: invalidar carrito y órdenes para que la UI refleje el estado real
    // (el backend ya limpió el carrito con el trigger al marcar la orden como pagada)
    if (status === "success") {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }

    if (transactionId) {
      console.log("Transaction ID:", transactionId);
    }
  }, [searchParams, queryClient]);

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
    
    // La referencia tiene el formato: synkro_{order_id}_{random}
    // Ejemplo: synkro_1_46f07a0bd2 -> order_id = 1
    const match = reference.match(/^synkro_(\d+)_/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    
    return null;
  };

  const handlePrimaryAction = () => {
    switch (paymentData?.status) {
      case 'success':
        // Intentar obtener order_id de la referencia
        const orderId = getOrderIdFromReference(paymentData.reference);
        if (orderId) {
          // Redirigir a la página de detalles de la orden específica
          router.push(`/profile/orders/${orderId}`);
        } else {
          // Si no se puede extraer, redirigir a la lista de pedidos
        router.push('/profile/orders');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>

        {/* Resultado del pago */}
        <Card className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}>
          <CardContent className="p-8 text-center">
            {/* Icono de estado */}
            <div className="mb-6">
              <StatusIcon className={`h-16 w-16 ${statusConfig.color} mx-auto`} />
            </div>

            {/* Título y descripción */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {statusConfig.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {statusConfig.description}
            </p>

            {/* Detalles de la transacción */}
            {(paymentData.transactionId || paymentData.reference || paymentData.amount) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Detalles de la transacción
                </h3>
                <div className="space-y-2 text-sm">
                  {paymentData.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">ID de transacción:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {paymentData.transactionId}
                      </span>
                    </div>
                  )}
                  {paymentData.reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Referencia:</span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {paymentData.reference}
                      </span>
                    </div>
                  )}
                  {paymentData.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Monto:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatPrice(paymentData.amount / 100)} COP
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date().toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje adicional */}
            {paymentData.message && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {paymentData.message}
                </p>
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
