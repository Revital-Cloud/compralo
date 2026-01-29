# 🧹 Limpieza del Flujo de Pagos Wompi

## 📋 Resumen de Cambios

Este documento contiene los cambios específicos para eliminar errores, warnings y simplificar el flujo de pagos sin romper funcionalidad.

---

## ❌ PROBLEMA 1: Llamadas a `/v1/merchants`

**Causa**: El widget de Wompi NO debe consultar `/merchants`. `publicKey` NO es `merchant_id`.

**Solución**: Asegurar que la configuración del widget sea correcta y no incluya campos que puedan confundir al widget.

---

## ❌ PROBLEMA 2: `redirectUrl: null` o `undefined`

**Causa**: Se está pasando explícitamente `redirectUrl: null` al widget, lo cual puede causar problemas.

**Solución**: NO incluir `redirectUrl` en absoluto en la configuración del widget embebido.

---

## ❌ PROBLEMA 3: Lógica excesiva en frontend

**Causa**: 
- `window.onerror` innecesario
- `postMessage` manual innecesario
- Polling duplicado (frontend + backend)

**Solución**: Simplificar el flujo confiando en el callback del widget y el polling del backend.

---

## ❌ PROBLEMA 4: Warning `aria-hidden`

**Causa**: Radix UI Dialog con `aria-hidden` cuando el widget tiene focus.

**Solución**: Ajustar el Dialog para que no bloquee el focus del widget.

---

## 🔧 CAMBIOS ESPECÍFICOS

### 📁 `components/PayButton.tsx`

#### ❌ ELIMINAR: Líneas 124-135 (window.onerror)

```typescript
// ❌ ELIMINAR ESTE BLOQUE COMPLETO
// 4. Agregar listener para errores globales del widget (si está disponible)
const originalErrorHandler = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (typeof message === 'string' && message.includes('wompi')) {
    console.warn("⚠️ [FRONTEND] Error relacionado con Wompi detectado:", message);
    // No bloquear el flujo, solo loguear
  }
  if (originalErrorHandler) {
    return originalErrorHandler(message, source, lineno, colno, error);
  }
  return false;
};
```

#### ❌ ELIMINAR: Líneas 102 (redirectUrl: null)

```typescript
// ❌ ANTES:
const widgetConfig = {
  currency: paymentConfig.currency,
  amountInCents: paymentConfig.amount_in_cents,
  reference: paymentConfig.reference,
  publicKey: paymentConfig.public_key,
  signature: {
    integrity: paymentConfig.integrity_signature,
  },
  redirectUrl: null, // ❌ ELIMINAR ESTA LÍNEA
};

// ✅ DESPUÉS:
const widgetConfig = {
  currency: paymentConfig.currency,
  amountInCents: paymentConfig.amount_in_cents,
  reference: paymentConfig.reference,
  publicKey: paymentConfig.public_key,
  signature: {
    integrity: paymentConfig.integrity_signature,
  },
  // ✅ NO incluir redirectUrl en absoluto
};
```

#### ❌ ELIMINAR: Líneas 213-236 (postMessage listener)

```typescript
// ❌ ELIMINAR ESTE BLOQUE COMPLETO
// Mecanismo alternativo 1: Escuchar mensajes postMessage del iframe de Wompi
const messageHandler = (event: MessageEvent) => {
  // Verificar que el mensaje viene de Wompi
  if (event.origin.includes('wompi.co') || event.origin.includes('checkout.wompi.co')) {
    console.log("🔍 [FRONTEND] Mensaje recibido de Wompi:", event.data);
    
    // Si el mensaje contiene información de transacción, procesarla
    if (event.data && (event.data.transaction || event.data.status)) {
      console.log("✅ [FRONTEND] Transacción detectada vía postMessage:", event.data);
      // Procesar como si fuera el callback
      const result = event.data;
      if (result.transaction) {
        const transaction = result.transaction;
        const transactionId = transaction.id;
        const transactionStatus = transaction.status;
        
        // Attach y polling
        handleTransactionResult(transactionId, transactionStatus, paymentConfig.reference);
      }
    }
  }
};

window.addEventListener('message', messageHandler);
```

#### ❌ ELIMINAR: Líneas 238-327 (verificación periódica)

```typescript
// ❌ ELIMINAR ESTE BLOQUE COMPLETO
// Mecanismo alternativo 2: Verificar periódicamente si el payment tiene transaction_id
// Esto funciona como respaldo si el callback nunca se ejecuta
let checkInterval: NodeJS.Timeout | null = null;
let checkAttempts = 0;
const maxCheckAttempts = 30; // 30 intentos = 1 minuto (cada 2 segundos)

const startPeriodicCheck = () => {
  // ... todo el código de verificación periódica ...
};

// Iniciar verificación periódica después de 5 segundos (dar tiempo al callback)
setTimeout(() => {
  if (checkInterval === null) {
    startPeriodicCheck();
  }
}, 5000);

// Limpiar listeners después de 10 minutos
setTimeout(() => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  window.removeEventListener('message', messageHandler);
  window.onerror = originalErrorHandler;
}, 10 * 60 * 1000); // 10 minutos
```

#### ❌ ELIMINAR: Líneas 175-179 (timeout de callback)

```typescript
// ❌ ELIMINAR:
// Agregar timeout de seguridad para detectar si el callback nunca se ejecuta
const callbackTimeout = setTimeout(() => {
  console.warn("⚠️ [FRONTEND] Timeout: El callback del widget no se ha ejecutado después de 5 minutos");
  // No hacer nada agresivo, solo loguear - el usuario puede estar completando el pago
}, 5 * 60 * 1000); // 5 minutos

// ❌ Y también eliminar dentro del callback:
clearTimeout(callbackTimeout);
```

#### ✏️ SIMPLIFICAR: Líneas 181-209 (callback del widget)

```typescript
// ✅ DESPUÉS (simplificado):
checkout.open(async (result: any) => {
  console.log("🔍 [FRONTEND] Callback del widget ejecutado. Resultado:", result);
  
  if (!result?.transaction) {
    console.error("❌ [FRONTEND] No se recibió información de la transacción");
    toast.error("No se recibió información de la transacción");
    setIsProcessing(false);
    return;
  }

  const transaction = result.transaction;
  const transactionId = transaction.id;
  const transactionStatus = transaction.status;
  console.log(`🔍 [FRONTEND] Transaction ID: ${transactionId}, Status: ${transactionStatus}`);

  // Attach transaction_id y dejar que el backend maneje el polling
  await handleTransactionResult(transactionId, transactionStatus, paymentConfig.reference);
});
```

#### ✏️ SIMPLIFICAR: Líneas 137-169 (handleTransactionResult)

```typescript
// ✅ DESPUÉS (simplificado - solo attach, NO polling):
const handleTransactionResult = async (transactionId: string, transactionStatus: string, reference: string) => {
  // Attach transaction_id
  try {
    console.log(`🔍 [FRONTEND] Attachando transaction_id: ${transactionId}`);
    const attachResponse = await fetch("/api/payments/attach-transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: reference,
        transaction_id: transactionId,
      }),
    });

    if (!attachResponse.ok) {
      const errorData = await attachResponse.json();
      console.error("❌ [FRONTEND] Error al attachar transaction_id:", errorData);
      toast.error("Error al registrar la transacción");
      setIsProcessing(false);
      return;
    }

    console.log("✅ [FRONTEND] Transaction ID attachado exitosamente");
    
    // ✅ El backend ya hace polling automáticamente, solo redirigir según el estado
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
  } catch (error) {
    console.error("❌ [FRONTEND] Error al attachar transaction_id:", error);
    toast.error("Error al registrar la transacción");
    setIsProcessing(false);
  }
};
```

#### ❌ ELIMINAR: Líneas 353-437 (pollPaymentStatus completo)

```typescript
// ❌ ELIMINAR ESTA FUNCIÓN COMPLETA
// El backend ya hace polling automáticamente
const pollPaymentStatus = async (
  reference: string,
  initialStatus: string
): Promise<void> => {
  // ... todo el código de polling ...
};
```

#### ❌ ELIMINAR: Líneas 439-464 (handlePaymentResult)

```typescript
// ❌ ELIMINAR ESTA FUNCIÓN COMPLETA
// Ya no es necesaria después de simplificar handleTransactionResult
const handlePaymentResult = (status: string, reference: string) => {
  // ... todo el código ...
};
```

#### ✏️ SIMPLIFICAR: Líneas 466-526 (handleReattempt)

```typescript
// ✅ DESPUÉS (simplificado):
const handleReattempt = async () => {
  if (isProcessing) return;
  setIsProcessing(true);

  try {
    const reattemptResponse = await fetch("/api/payments/reattempt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_id: orderId }),
    });

    if (!reattemptResponse.ok) {
      const error = await reattemptResponse.json();
      throw new Error(error.error || error.detail || "Error al crear reintento");
    }

    const paymentConfig: PaymentCreateResponse = await reattemptResponse.json();

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
      // ✅ NO incluir redirectUrl
    });

    checkout.open(async (result: any) => {
      const transaction = result?.transaction;
      if (transaction) {
        await handleTransactionResult(
          transaction.id,
          transaction.status,
          paymentConfig.reference
        );
      }
    });
  } catch (error: any) {
    console.error("Error en reintento:", error);
    toast.error(error.message || "Error al reintentar el pago");
    setIsProcessing(false);
  }
};
```

#### ✏️ ELIMINAR: Líneas 335, 338 (restauración de window.onerror)

```typescript
// ❌ ELIMINAR estas líneas ya que eliminamos window.onerror:
window.onerror = originalErrorHandler;
```

---

### 📁 `services/wompi-widget.service.ts`

#### ✏️ MODIFICAR: Líneas 410, 471 (redirectUrl: undefined)

```typescript
// ❌ ANTES:
const config: WompiWidgetConfig = {
  // ...
  redirectUrl: undefined, // ❌ NO incluir esta propiedad
};

// ✅ DESPUÉS:
const config: WompiWidgetConfig = {
  // ...
  // ✅ NO incluir redirectUrl en absoluto
};
```

#### ✏️ MODIFICAR: Líneas 545-560 (widgetConfig)

```typescript
// ✅ DESPUÉS (asegurar que redirectUrl NO se incluya):
const widgetConfig: any = {
  currency: config.currency,
  amountInCents: config.amountInCents,
  reference: config.reference,
  publicKey: config.publicKey,
  signature: {
    integrity: config.signature.integrity
  }
  // ✅ NO incluir redirectUrl, expirationTime, customerData, shippingAddress
  // a menos que sean estrictamente necesarios
};

// ✅ Solo incluir campos opcionales si están definidos Y son necesarios
if (config.expirationTime) {
  widgetConfig.expirationTime = config.expirationTime;
}

if (config.customerData && Object.keys(config.customerData).length > 0) {
  widgetConfig.customerData = config.customerData;
}

if (config.shippingAddress && Object.keys(config.shippingAddress).length > 0) {
  widgetConfig.shippingAddress = config.shippingAddress;
}
```

---

### 📁 `components/payment/wompi-modal.tsx`

#### ✏️ MODIFICAR: Línea 186 (Dialog para evitar aria-hidden)

```typescript
// ❌ ANTES:
<Dialog open={isOpen && isLoading} onOpenChange={onClose}>

// ✅ DESPUÉS:
<Dialog 
  open={isOpen && isLoading} 
  onOpenChange={onClose}
  modal={false} // ✅ Permite que el widget tenga focus
>
```

O mejor aún, usar `DialogContent` con `onInteractOutside`:

```typescript
// ✅ DESPUÉS (alternativa):
<DialogContent 
  className="max-w-md w-full p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
  onInteractOutside={(e) => e.preventDefault()} // Previene cierre accidental
  onEscapeKeyDown={(e) => e.preventDefault()} // Previene cierre con ESC
>
```

---

## ✅ FLUJO FINAL SIMPLIFICADO

### Pasos del flujo limpio:

1. **Frontend**: Usuario hace clic en "Pagar"
2. **Frontend**: Llama a `/api/payments/create` → Backend genera `reference`, `integrity_signature`
3. **Frontend**: Crea `new WidgetCheckout(config)` con configuración limpia (sin `redirectUrl`)
4. **Frontend**: Abre widget con `checkout.open(callback)`
5. **Usuario**: Completa el pago en el widget
6. **Widget**: Ejecuta callback con `result.transaction`
7. **Frontend**: Extrae `transaction.id` y `transaction.status`
8. **Frontend**: Llama a `/api/payments/attach-transaction` para guardar `transaction_id`
9. **Frontend**: Redirige según el estado (APPROVED → success, DECLINED → declined, etc.)
10. **Backend**: El webhook de Wompi actualiza el payment y marca la orden como pagada (si APPROVED)

### ✅ Lo que se mantiene:

- ✅ Creación de payment en backend
- ✅ Generación de integrity_signature en backend
- ✅ Widget embebido de Wompi
- ✅ Callback del widget
- ✅ Attach de transaction_id
- ✅ Webhook de Wompi (actualiza payment y orden)
- ✅ Redirección según estado

### ❌ Lo que se elimina:

- ❌ `window.onerror` personalizado
- ❌ `postMessage` listener manual
- ❌ Verificación periódica del frontend
- ❌ Polling duplicado en frontend
- ❌ `redirectUrl: null` o `undefined`
- ❌ Timeout de callback
- ❌ Funciones auxiliares innecesarias

---

## 🎯 RESULTADO ESPERADO

Después de aplicar estos cambios:

✅ **NO** habrá llamadas a `/v1/merchants`
✅ **NO** habrá errores 422/404 de Wompi en consola
✅ **NO** habrá warnings de `aria-hidden`
✅ El widget se abrirá y procesará pagos normalmente
✅ El flujo quedará listo para producción
✅ El código será más simple y mantenible

---

## 📝 NOTAS IMPORTANTES

1. **El backend ya hace polling**: No necesitamos polling en el frontend. El webhook de Wompi es la fuente de verdad.

2. **El callback del widget funciona**: Si el callback no se ejecuta, el webhook de Wompi actualizará el payment de todas formas.

3. **redirectUrl NO es necesario**: El widget embebido maneja la redirección internamente. Solo se usa `redirectUrl` para Web Checkout (redirección completa).

4. **publicKey NO es merchant_id**: El widget NO debe consultar `/merchants`. La `publicKey` es suficiente para inicializar el widget.

