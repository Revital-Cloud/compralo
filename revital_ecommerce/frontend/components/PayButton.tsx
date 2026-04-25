"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/utils/apiWrapper";

interface PayButtonProps {
  orderId: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface PaymentCreateResponse {
  reference: string;
  amount_in_cents: number;
  currency: string;
  public_key: string;
  integrity_signature: string;
}

interface PollPaymentResponse {
  status: string;
  transaction_id?: string;
  reference: string;
  message?: string;
}

export function PayButton({
  orderId,
  disabled = false,
  className,
  children
}: PayButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Función auxiliar para manejar el resultado de la transacción
  const handleTransactionResult = async (transactionId: string, transactionStatus: string, reference: string) => {
    // Validación estricta ANTES de llamar al backend
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
      console.error("❌ [FRONTEND] handleTransactionResult: transactionId inválido:", transactionId);
      toast.error("Error: ID de transacción inválido");
      setIsProcessing(false);
      return;
    }
    
    if (!reference || typeof reference !== 'string' || reference.trim().length === 0) {
      console.error("❌ [FRONTEND] handleTransactionResult: reference inválido:", reference);
      toast.error("Error: Referencia de pago inválida");
      setIsProcessing(false);
      return;
    }
    
    // Attach transaction_id
    try {
      console.log(`🔍 [FRONTEND] ========== ATTACH TRANSACTION ==========`);
      console.log(`🔍 [FRONTEND] reference: ${reference}`);
      console.log(`🔍 [FRONTEND] transaction_id: ${transactionId}`);
      console.log(`🔍 [FRONTEND] transaction_status: ${transactionStatus}`);
      
      const attachPayload = {
        reference: reference.trim(),
        transaction_id: transactionId.trim(),
      };
      
      console.log("🔍 [FRONTEND] Payload a enviar:", JSON.stringify(attachPayload, null, 2));
      
      const token = getStoredToken();
      const attachResponse = await fetch("/api/payments/attach-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(attachPayload),
      });

      console.log("🔍 [FRONTEND] Response status:", attachResponse.status);
      console.log("🔍 [FRONTEND] Response ok:", attachResponse.ok);

      if (!attachResponse.ok) {
        const errorData = await attachResponse.json().catch(() => ({ error: "Error desconocido" }));
        console.error("❌ [FRONTEND] Error al attachar transaction_id:", errorData);
        console.error("❌ [FRONTEND] Status code:", attachResponse.status);
        toast.error(`Error al registrar la transacción: ${errorData.error || errorData.detail || "Error desconocido"}`);
        setIsProcessing(false);
        return;
      }

      const attachResult = await attachResponse.json();
      console.log("✅ [FRONTEND] Transaction ID attachado exitosamente:", attachResult);
      
      // IMPORTANTE: Siempre llamar al polling para que el backend actualice la orden
      // Incluso si el status es APPROVED, el backend necesita procesar el pago
      // para marcar la orden como pagada y actualizar el stock
      console.log("🔍 [FRONTEND] Iniciando polling para actualizar orden...");
      try {
        const pollResponse = await fetch(`/api/payments/poll?reference=${encodeURIComponent(reference)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (pollResponse.ok) {
          const pollData: PollPaymentResponse = await pollResponse.json();
          console.log(`✅ [FRONTEND] Polling completado: status=${pollData.status}`);
          
          // El backend ya actualizó la orden si el status es APPROVED
          setIsProcessing(false);
          
          if (pollData.status === "APPROVED") {
            toast.success("¡Pago aprobado exitosamente!");
            router.push(`/checkout/payment-result?status=success&reference=${reference}`);
          } else if (pollData.status === "DECLINED") {
            toast.error("El pago fue rechazado");
            router.push(`/checkout/payment-result?status=declined&reference=${reference}`);
          } else if (pollData.status === "PENDING") {
            toast.info(pollData.message || "El pago está pendiente de confirmación");
            router.push(`/checkout/payment-result?status=pending&reference=${reference}`);
          } else {
            toast.error("Ocurrió un error durante el pago");
            setIsProcessing(false);
          }
        } else {
          // Si el polling falla, aún redirigir según el status inicial del widget
          console.warn("⚠️ [FRONTEND] Polling falló, usando status inicial del widget");
          setIsProcessing(false);
          
          if (transactionStatus === "APPROVED") {
            toast.success("¡Pago aprobado exitosamente!");
            router.push(`/checkout/payment-result?status=success&reference=${reference}`);
          } else if (transactionStatus === "DECLINED") {
            toast.error("El pago fue rechazado");
            router.push(`/checkout/payment-result?status=declined&reference=${reference}`);
          } else if (transactionStatus === "PENDING") {
            toast.info("El pago está pendiente de confirmación");
            router.push(`/checkout/payment-result?status=pending&reference=${reference}`);
          } else {
            toast.error("Ocurrió un error durante el pago");
            setIsProcessing(false);
          }
        }
      } catch (pollError) {
        console.error("❌ [FRONTEND] Error en polling:", pollError);
        // Continuar con el flujo usando el status inicial
        setIsProcessing(false);
        
        if (transactionStatus === "APPROVED") {
          toast.success("¡Pago aprobado exitosamente!");
          router.push(`/checkout/payment-result?status=success&reference=${reference}`);
        } else if (transactionStatus === "DECLINED") {
          toast.error("El pago fue rechazado");
          router.push(`/checkout/payment-result?status=declined&reference=${reference}`);
        } else if (transactionStatus === "PENDING") {
          toast.info("El pago está pendiente de confirmación");
          router.push(`/checkout/payment-result?status=pending&reference=${reference}`);
        } else {
          toast.error("Ocurrió un error durante el pago");
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error("❌ [FRONTEND] Error al attachar transaction_id:", error);
      toast.error("Error al registrar la transacción");
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (isProcessing || disabled) return;

    setIsProcessing(true);

    try {
      // 1. Crear pago en backend
      const token = getStoredToken();

      // Idempotencia: evita duplicar el payment si el request se reintenta por red.
      // (El backend usa esta clave para generar una `reference` deterministica.)
      const idempotencyKey =
        typeof (globalThis as any)?.crypto?.randomUUID === "function"
          ? (globalThis as any).crypto.randomUUID()
          : `idemp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const createResponse = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || error.detail || "Error al crear el pago");
      }

      const paymentConfig: PaymentCreateResponse = await createResponse.json();
      
      // Validar que la configuración esté completa
      console.log("🔍 [FRONTEND] Configuración recibida del backend:", {
        reference: paymentConfig.reference,
        amount_in_cents: paymentConfig.amount_in_cents,
        currency: paymentConfig.currency,
        has_public_key: !!paymentConfig.public_key,
        public_key_preview: paymentConfig.public_key?.substring(0, 20) + "...",
        has_integrity_signature: !!paymentConfig.integrity_signature,
        integrity_signature_length: paymentConfig.integrity_signature?.length || 0
      });
      
      if (!paymentConfig.public_key) {
        console.error("❌ [FRONTEND] public_key no está presente en la respuesta del backend");
        throw new Error("Error: La configuración del pago está incompleta. Falta la llave pública.");
      }
      
      if (!paymentConfig.integrity_signature) {
        console.error("❌ [FRONTEND] integrity_signature no está presente en la respuesta del backend");
        throw new Error("Error: La configuración del pago está incompleta. Falta la firma de integridad.");
      }

      // 2. Verificar que WidgetCheckout esté disponible
      if (typeof (window as any).WidgetCheckout === "undefined") {
        console.error("❌ [FRONTEND] WidgetCheckout no está disponible en window");
        throw new Error("Widget de Wompi no está disponible. Recarga la página e intenta nuevamente.");
      }
      
      console.log("✅ [FRONTEND] WidgetCheckout está disponible, creando instancia...");

      // 3. Crear instancia del widget
      const widgetConfig = {
        currency: paymentConfig.currency,
        amountInCents: paymentConfig.amount_in_cents,
        reference: paymentConfig.reference,
        publicKey: paymentConfig.public_key,
        signature: {
          integrity: paymentConfig.integrity_signature,
        },
        // NO incluir redirectUrl - el widget embebido no lo necesita
      };
      
      console.log("🔍 [FRONTEND] Configuración del widget (sin signature):", {
        currency: widgetConfig.currency,
        amountInCents: widgetConfig.amountInCents,
        reference: widgetConfig.reference,
        publicKey: widgetConfig.publicKey?.substring(0, 20) + "...",
        hasSignature: !!widgetConfig.signature?.integrity
      });
      
      let checkout: any;
      try {
        checkout = new (window as any).WidgetCheckout(widgetConfig);
        console.log("✅ [FRONTEND] Instancia de WidgetCheckout creada exitosamente");
      } catch (error: any) {
        console.error("❌ [FRONTEND] Error al crear instancia de WidgetCheckout:", error);
        toast.error("Error al inicializar el widget de pago. Intenta recargar la página.");
        setIsProcessing(false);
        return;
      }
      
      // 4. Abrir widget con callback
      try {
        console.log("🎯 [FRONTEND] ========== PREPARANDO PARA ABRIR WIDGET ==========");
        console.log("🎯 [FRONTEND] Instancia checkout:", checkout);
        console.log("🎯 [FRONTEND] Tipo de checkout.open:", typeof checkout?.open);
        
        // Flag para evitar múltiples ejecuciones del callback
        let callbackExecuted = false;
        let postMessageListener: ((event: MessageEvent) => void) | null = null;
        let safetyTimeoutId: ReturnType<typeof setTimeout> | null = null;

        const clearSafetyTimeout = () => {
          if (safetyTimeoutId) {
            clearTimeout(safetyTimeoutId);
            safetyTimeoutId = null;
          }
        };
        
        console.log("🔍 [FRONTEND] Definindo función processWidgetResult...");
        
        // Función centralizada para procesar resultado del widget
        const processWidgetResult = async (result: any, source: string) => {
          if (callbackExecuted) {
            console.warn(`⚠️ [FRONTEND] Callback ya ejecutado (fuente: ${source}), ignorando`);
            return;
          }
          
          try {
            console.log(`🔍 [FRONTEND] ========== CALLBACK EJECUTADO (${source}) ==========`);
            console.log("🔍 [FRONTEND] Resultado RAW completo:", JSON.stringify(result, null, 2));
            console.log("🔍 [FRONTEND] Tipo de result:", typeof result);
            console.log("🔍 [FRONTEND] Keys de result:", result ? Object.keys(result) : "N/A");
            
            // Guard clause 1: result existe
            if (result === null || result === undefined) {
              console.warn(`⚠️ [FRONTEND] result es null/undefined (${source}) - widget cerrado sin completar`);
              callbackExecuted = true;
              clearSafetyTimeout();
              setIsProcessing(false);
              return;
            }

            // Guard clause 2: result.transaction existe y es objeto válido
            const transaction = result.transaction;
            console.log("🔍 [FRONTEND] result.transaction existe?", !!transaction);
            console.log("🔍 [FRONTEND] result.transaction:", transaction);
            console.log("🔍 [FRONTEND] Tipo de result.transaction:", typeof transaction);
            
            if (!transaction || transaction === null || typeof transaction !== 'object') {
              console.warn(`⚠️ [FRONTEND] result.transaction inválido (${source}):`, transaction);
              console.warn("⚠️ [FRONTEND] Estructura completa de result:", JSON.stringify(result, null, 2));
              callbackExecuted = true;
              clearSafetyTimeout();
              setIsProcessing(false);
              return;
            }

            // Guard clause 3: transaction.id existe y es string no vacío
            const transactionId = transaction.id;
            console.log("🔍 [FRONTEND] transaction.id:", transactionId);
            console.log("🔍 [FRONTEND] Tipo de transaction.id:", typeof transactionId);
            console.log("🔍 [FRONTEND] transaction.id es string?", typeof transactionId === 'string');
            console.log("🔍 [FRONTEND] transaction.id tiene longitud?", transactionId?.length);
            
            if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
              console.error(`❌ [FRONTEND] transaction.id inválido (${source}):`, transactionId);
              console.error("❌ [FRONTEND] Transaction completa:", JSON.stringify(transaction, null, 2));
              toast.error("Error: ID de transacción inválido");
              callbackExecuted = true;
              clearSafetyTimeout();
              setIsProcessing(false);
              return;
            }

            // Guard clause 4: transaction.status existe y es string
            const transactionStatus = transaction.status;
            console.log("🔍 [FRONTEND] transaction.status:", transactionStatus);
            console.log("🔍 [FRONTEND] Tipo de transaction.status:", typeof transactionStatus);
            
            if (!transactionStatus || typeof transactionStatus !== 'string') {
              console.error(`❌ [FRONTEND] transaction.status inválido (${source}):`, transactionStatus);
              console.error("❌ [FRONTEND] Transaction completa:", JSON.stringify(transaction, null, 2));
              toast.error("Error: Estado de transacción inválido");
              callbackExecuted = true;
              clearSafetyTimeout();
              setIsProcessing(false);
              return;
            }

            console.log(`✅ [FRONTEND] Transaction VÁLIDA (${source}) - ID: ${transactionId}, Status: ${transactionStatus}`);
            
            // Marcar como ejecutado ANTES de procesar
            callbackExecuted = true;
            clearSafetyTimeout();
            
            // Limpiar listener de postMessage si existe
            if (postMessageListener) {
              window.removeEventListener('message', postMessageListener);
              postMessageListener = null;
            }

            // Attach transaction_id y procesar
            await handleTransactionResult(transactionId, transactionStatus, paymentConfig.reference);
            console.log(`✅ [FRONTEND] handleTransactionResult completado (${source})`);
          } catch (error: any) {
            console.error(`❌ [FRONTEND] Error procesando resultado (${source}):`, error);
            console.error("❌ [FRONTEND] Stack trace:", error.stack);
            toast.error("Error al procesar el resultado del pago");
            setIsProcessing(false);
            callbackExecuted = true;
            clearSafetyTimeout();
          }
        };
        
        // Listener de postMessage como fallback (por si el callback no se ejecuta)
        console.log("🔍 [FRONTEND] Creando listener de postMessage...");
        postMessageListener = (event: MessageEvent) => {
          console.log("🔍 [FRONTEND] postMessage recibido - origin:", event.origin, "data:", event.data);
          
          // Solo procesar mensajes de Wompi
          if (event.origin !== 'https://checkout.wompi.co' && event.origin !== 'https://checkout.wompi.co/') {
            console.log("⚠️ [FRONTEND] postMessage ignorado - origin no es Wompi:", event.origin);
            return;
          }
          
          console.log("✅ [FRONTEND] postMessage de Wompi confirmado, procesando...");
          console.log("🔍 [FRONTEND] Tipo de event.data:", typeof event.data);
          console.log("🔍 [FRONTEND] event.data completo:", JSON.stringify(event.data, null, 2));
          
          // Intentar extraer transaction del mensaje
          if (event.data && typeof event.data === 'object') {
            if (event.data.transaction) {
              console.log("✅ [FRONTEND] postMessage contiene transaction, procesando...");
              processWidgetResult(event.data, 'postMessage');
            } else if (event.data.type === 'transaction' && event.data.data) {
              console.log("✅ [FRONTEND] postMessage con formato alternativo, procesando...");
              processWidgetResult({ transaction: event.data.data }, 'postMessage-alt');
            } else {
              console.warn("⚠️ [FRONTEND] postMessage no tiene formato esperado:", Object.keys(event.data));
            }
          } else {
            console.warn("⚠️ [FRONTEND] postMessage data no es objeto:", event.data);
          }
        };
        
        console.log("🔍 [FRONTEND] Registrando listener de postMessage en window...");
        window.addEventListener('message', postMessageListener);
        console.log("✅ [FRONTEND] Listener de postMessage registrado");
        
        // Callback principal del widget
        console.log("🔍 [FRONTEND] Registrando callback principal del widget...");
        const widgetCallback = async (result: any) => {
          console.log("🔍 [FRONTEND] ========== CALLBACK PRINCIPAL EJECUTADO ==========");
          console.log("🔍 [FRONTEND] Result recibido en callback principal:", result);
          await processWidgetResult(result, 'widget-callback');
        };
        
        console.log("🔍 [FRONTEND] Llamando a checkout.open() con callback...");
        console.log("🔍 [FRONTEND] checkout.open es función?", typeof checkout.open === 'function');
        
        try {
          checkout.open(widgetCallback);
          console.log("✅ [FRONTEND] checkout.open() llamado exitosamente");
        } catch (openError: any) {
          console.error("❌ [FRONTEND] Error al llamar checkout.open():", openError);
          console.error("❌ [FRONTEND] Stack:", openError.stack);
          throw openError;
        }
        
        console.log("✅ [FRONTEND] Widget abierto, esperando callback o postMessage...");
        console.log("🔍 [FRONTEND] Estado: callbackExecuted=", callbackExecuted);
        console.log("🔍 [FRONTEND] Estado: postMessageListener registrado=", !!postMessageListener);
        
        // Timeout de seguridad: si después de 5 minutos no hay callback, limpiar listener
        safetyTimeoutId = setTimeout(() => {
          // Si nada llegó en el timeout, hacemos salida segura:
          // - cortar el flujo (marcar callbackExecuted)
          // - liberar listener
          // - desbloquear UI
          // - ofrecer reintento
          if (!callbackExecuted) {
            callbackExecuted = true;
            clearSafetyTimeout();

            if (postMessageListener) {
              window.removeEventListener('message', postMessageListener);
              postMessageListener = null;
            }

            setIsProcessing(false);
            toast.error("El pago tardó demasiado en confirmarse. Puedes reintentarlo si quieres.", {
              duration: 8000,
              action: {
                label: "Reintentar",
                onClick: () => handleReattempt(),
              },
            });
          }
        }, 5 * 60 * 1000);
        
      } catch (error: any) {
        console.error("❌ [FRONTEND] Error al abrir widget:", error);
        toast.error("Error al abrir el widget de pago: " + (error.message || "Error desconocido"));
        setIsProcessing(false);
        return;
      }

    } catch (error: any) {
      console.error("Error al procesar pago:", error);
      toast.error(error.message || "Error al procesar el pago");
      setIsProcessing(false);
    }
  };

  // Función eliminada: pollPaymentStatus
  // El backend ya hace polling automáticamente a través del webhook de Wompi

  async function handleReattempt() {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const token = getStoredToken();
      const reattemptResponse = await fetch("/api/payments/reattempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (!reattemptResponse.ok) {
        const error = await reattemptResponse.json();
        throw new Error(error.error || error.detail || "Error al crear reintento");
      }

      const paymentConfig: PaymentCreateResponse = await reattemptResponse.json();

      // Abrir widget con nueva configuración
      if (typeof (window as any).WidgetCheckout === "undefined") {
        throw new Error("Widget de Wompi no está disponible");
      }

      const checkout = new (window as any).WidgetCheckout({
        currency: paymentConfig.currency,
        amountInCents: paymentConfig.amount_in_cents,
        reference: paymentConfig.reference,
        publicKey: paymentConfig.public_key,
        signature: {
          integrity: paymentConfig.integrity_signature,
        },
        // NO incluir redirectUrl
      });

      // Flag para evitar múltiples ejecuciones
      let reattemptCallbackExecuted = false;
      
      checkout.open(async (result: any) => {
        // Prevenir múltiples ejecuciones
        if (reattemptCallbackExecuted) {
          console.warn("⚠️ [FRONTEND] Reintento: Callback ya ejecutado, ignorando");
          return;
        }

        try {
          // Guard clause 1: result existe
          if (result === null || result === undefined) {
            console.warn("⚠️ [FRONTEND] Reintento: result es null/undefined");
            setIsProcessing(false);
            return;
          }

          // Guard clause 2: result.transaction existe y no es null
          if (!result.transaction || result.transaction === null || typeof result.transaction !== 'object') {
            console.warn("⚠️ [FRONTEND] Reintento: result.transaction no existe o es null");
            setIsProcessing(false);
            return;
          }

          const transaction = result.transaction;

          // Guard clause 3: transaction.id existe y es string
          if (!transaction.id || typeof transaction.id !== 'string') {
            console.error("❌ [FRONTEND] Reintento: transaction.id no existe o no es string");
            toast.error("Error: La información de la transacción está incompleta");
            setIsProcessing(false);
            return;
          }

          // Guard clause 4: transaction.status existe y es string
          if (!transaction.status || typeof transaction.status !== 'string') {
            console.error("❌ [FRONTEND] Reintento: transaction.status no existe o no es string");
            toast.error("Error: La información de la transacción está incompleta");
            setIsProcessing(false);
            return;
          }

          reattemptCallbackExecuted = true;

          await handleTransactionResult(
            transaction.id,
            transaction.status,
            paymentConfig.reference
          );
        } catch (error: any) {
          console.error("❌ [FRONTEND] Error en callback de reintento:", error);
          toast.error("Error al procesar el resultado del pago");
          setIsProcessing(false);
          reattemptCallbackExecuted = true;
        }
      });
    } catch (error: any) {
      console.error("Error en reintento:", error);
      toast.error(error.message || "Error al reintentar el pago");
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handlePayment}
        disabled={disabled || isProcessing}
        className={className}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Abriendo widget...
          </>
        ) : (
          children || "Pagar ahora"
        )}
      </Button>
      
      {/* Botón de reintentar (se muestra cuando hay error) */}
      {/* TODO: Mostrar condicionalmente cuando el último pago falló */}
    </div>
  );
}

