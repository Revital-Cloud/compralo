# Correcciones Técnicas - Pagos Wompi

## 🔍 Análisis del Problema

### Causas Identificadas

1. **Callback del widget no se ejecuta:**
   - El widget puede cerrarse sin llamar al callback
   - El callback puede recibir `result = null` o `result.transaction = null`
   - No hay fallback si el callback falla

2. **Validaciones insuficientes:**
   - No se valida que `transaction.id` sea string no vacío
   - No se valida `reference` antes de llamar al backend
   - El backend no valida estrictamente los parámetros

3. **Falta de logging:**
   - No hay logs suficientes para diagnosticar dónde falla
   - No se loguea el resultado crudo del widget

---

## ✅ Correcciones Implementadas

### 1. Frontend - `PayButton.tsx`

#### a) Callback con Fallback de postMessage

```typescript
// Función centralizada para procesar resultado
const processWidgetResult = async (result: any, source: string) => {
  // Validaciones estrictas con logs detallados
  // ...
};

// Listener de postMessage como fallback
postMessageListener = (event: MessageEvent) => {
  if (event.origin !== 'https://checkout.wompi.co') return;
  if (event.data?.transaction) {
    processWidgetResult(event.data, 'postMessage');
  }
};
window.addEventListener('message', postMessageListener);

// Callback principal
checkout.open(async (result: any) => {
  await processWidgetResult(result, 'widget-callback');
});
```

**Cambios clave:**
- ✅ Logging obligatorio del resultado crudo
- ✅ Validación estricta: `transaction.id` debe ser string no vacío
- ✅ Fallback con `postMessage` si el callback no se ejecuta
- ✅ Timeout de seguridad para limpiar listener

#### b) Validación antes de Attach

```typescript
const handleTransactionResult = async (transactionId: string, transactionStatus: string, reference: string) => {
  // Validación estricta ANTES de llamar al backend
  if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
    console.error("❌ transactionId inválido:", transactionId);
    return;
  }
  
  // Logging detallado del payload
  console.log(`🔍 [FRONTEND] ========== ATTACH TRANSACTION ==========`);
  console.log(`🔍 [FRONTEND] reference: ${reference}`);
  console.log(`🔍 [FRONTEND] transaction_id: ${transactionId}`);
  
  // Llamar a attach solo si todo es válido
  // ...
};
```

**Cambios clave:**
- ✅ Validación de `transactionId` antes de llamar al backend
- ✅ Validación de `reference` antes de llamar al backend
- ✅ Logging detallado del payload enviado
- ✅ Logging de la respuesta del backend

---

### 2. Backend - `payment_widget_router.py`

#### Validaciones Estrictas en `/api/payments/attach-transaction`

```python
@router.post("/attach-transaction")
async def attach_transaction(payload: AttachTransactionRequest, ...):
    logger.info(f"🔍 ========== ATTACH TRANSACTION RECIBIDO ==========")
    
    # Validación estricta de reference
    if not reference or not isinstance(reference, str) or len(reference.strip()) == 0:
        raise HTTPException(400, "reference es requerido y debe ser un string no vacío")
    
    # Validación estricta de transaction_id
    if not transaction_id or not isinstance(transaction_id, str) or len(transaction_id.strip()) == 0:
        raise HTTPException(400, "transaction_id debe ser un string no vacío")
    
    # Verificar que el payment existe
    payment = get_payment_by_reference(db, reference)
    if not payment:
        raise HTTPException(404, f"Payment con reference {reference} no encontrado")
    
    # Verificar idempotencia
    existing_transaction_id = payment.get("provider_transaction_id")
    if existing_transaction_id == transaction_id:
        return {"status": "ok", "message": "Transaction ID ya estaba asociado"}
    
    # Attach y verificar
    attach_transaction_id(db, reference, transaction_id)
    
    # Verificar que se guardó correctamente
    payment_after = get_payment_by_reference(db, reference)
    if payment_after.get("provider_transaction_id") != transaction_id:
        raise HTTPException(500, "Error al guardar transaction_id")
    
    return {"status": "ok", "transaction_id": transaction_id}
```

**Cambios clave:**
- ✅ Validación estricta de tipos y valores
- ✅ Verificación de existencia del payment
- ✅ Idempotencia (no falla si ya está attachado)
- ✅ Verificación post-attach para confirmar que se guardó

---

### 3. Backend - `payment_widget_service.py`

#### Validaciones y Verificación en `attach_transaction_id()`

```python
def attach_transaction_id(db: Session, reference: str, transaction_id: str) -> bool:
    logger.info(f"🔍 attach_transaction_id: reference={reference}, transaction_id={transaction_id}")
    
    # Validación adicional
    if not transaction_id or not isinstance(transaction_id, str) or len(transaction_id.strip()) == 0:
        raise HTTPException(400, "transaction_id debe ser un string no vacío")
    
    transaction_id = transaction_id.strip()
    reference = reference.strip()
    
    # UPDATE con logging
    query = text("""
        UPDATE tab_pagos
        SET provider_transaction_id = :transaction_id,
            status = CASE WHEN status = 'CREATED' THEN 'PENDING' ELSE status END,
            fec_update = NOW()
        WHERE reference = :reference
        RETURNING id_pago
    """)
    
    result = db.execute(query, {"reference": reference, "transaction_id": transaction_id})
    payment_id = result.scalar()
    
    if not payment_id:
        raise HTTPException(404, f"Payment con reference {reference} no encontrado")
    
    logger.info(f"✅ UPDATE ejecutado: payment_id={payment_id}, rows_affected={result.rowcount}")
    
    db.commit()
    
    # Verificar que se guardó correctamente
    verify_query = text("SELECT provider_transaction_id, status FROM tab_pagos WHERE reference = :reference")
    verify_result = db.execute(verify_query, {"reference": reference})
    verify_row = verify_result.fetchone()
    
    if verify_row:
        saved_transaction_id = verify_row.provider_transaction_id
        if saved_transaction_id != transaction_id:
            raise HTTPException(500, "Error al guardar transaction_id: no coincide")
        logger.info(f"✅ Transaction ID attachado y verificado: {transaction_id}")
    
    return True
```

**Cambios clave:**
- ✅ Validación de parámetros antes del UPDATE
- ✅ Logging del `rowcount` para verificar que se actualizó
- ✅ Verificación post-commit para confirmar que se guardó
- ✅ Error explícito si no coincide

---

## 📋 Código Recomendado - WidgetCheckout.open()

```typescript
// Flag para evitar múltiples ejecuciones
let callbackExecuted = false;
let postMessageListener: ((event: MessageEvent) => void) | null = null;

// Función centralizada para procesar resultado
const processWidgetResult = async (result: any, source: string) => {
  if (callbackExecuted) {
    console.warn(`⚠️ Callback ya ejecutado (${source}), ignorando`);
    return;
  }
  
  try {
    console.log(`🔍 ========== CALLBACK EJECUTADO (${source}) ==========`);
    console.log("🔍 Resultado RAW completo:", JSON.stringify(result, null, 2));
    
    // Guard clauses con validación estricta
    if (!result || !result.transaction) {
      console.warn(`⚠️ result.transaction inválido (${source})`);
      setIsProcessing(false);
      return;
    }
    
    const transaction = result.transaction;
    const transactionId = transaction.id;
    const transactionStatus = transaction.status;
    
    // Validación estricta: transactionId debe ser string no vacío
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
      console.error(`❌ transaction.id inválido (${source}):`, transactionId);
      toast.error("Error: ID de transacción inválido");
      setIsProcessing(false);
      return;
    }
    
    // Validación estricta: transactionStatus debe ser string
    if (!transactionStatus || typeof transactionStatus !== 'string') {
      console.error(`❌ transaction.status inválido (${source}):`, transactionStatus);
      toast.error("Error: Estado de transacción inválido");
      setIsProcessing(false);
      return;
    }
    
    console.log(`✅ Transaction VÁLIDA (${source}) - ID: ${transactionId}, Status: ${transactionStatus}`);
    
    callbackExecuted = true;
    
    // Limpiar listener si existe
    if (postMessageListener) {
      window.removeEventListener('message', postMessageListener);
      postMessageListener = null;
    }
    
    // Procesar resultado
    await handleTransactionResult(transactionId, transactionStatus, paymentConfig.reference);
    
  } catch (error: any) {
    console.error(`❌ Error procesando resultado (${source}):`, error);
    toast.error("Error al procesar el resultado del pago");
    setIsProcessing(false);
    callbackExecuted = true;
  }
};

// Listener de postMessage como fallback
postMessageListener = (event: MessageEvent) => {
  if (event.origin !== 'https://checkout.wompi.co') return;
  
  console.log("🔍 postMessage recibido de Wompi:", event.data);
  
  if (event.data?.transaction) {
    processWidgetResult(event.data, 'postMessage');
  } else if (event.data?.type === 'transaction' && event.data?.data) {
    processWidgetResult({ transaction: event.data.data }, 'postMessage-alt');
  }
};

window.addEventListener('message', postMessageListener);

// Callback principal del widget
checkout.open(async (result: any) => {
  await processWidgetResult(result, 'widget-callback');
});

// Timeout de seguridad
setTimeout(() => {
  if (postMessageListener) {
    window.removeEventListener('message', postMessageListener);
  }
}, 5 * 60 * 1000);
```

---

## 🔒 Validaciones Mínimas Adicionales en Backend

### 1. Rechazar attach sin transaction_id

```python
# Ya implementado en payment_widget_router.py
if not transaction_id or not isinstance(transaction_id, str) or len(transaction_id.strip()) == 0:
    raise HTTPException(400, "transaction_id es requerido")
```

### 2. Loggear correctamente cuando el attach ocurre

```python
# Ya implementado - logs detallados en cada paso:
logger.info(f"🔍 ========== ATTACH TRANSACTION RECIBIDO ==========")
logger.info(f"✅ Payment encontrado: id_pago={payment.get('id_pago')}")
logger.info(f"✅ UPDATE ejecutado: payment_id={payment_id}, rows_affected={result.rowcount}")
logger.info(f"✅ Transaction ID attachado y verificado: {transaction_id}")
```

### 3. Evitar estados incoherentes

```python
# Verificación post-commit
payment_after = get_payment_by_reference(db, reference)
if payment_after.get("provider_transaction_id") != transaction_id:
    raise HTTPException(500, "Error al guardar transaction_id: no coincide")
```

---

## ✅ Checklist de Verificación

### 1. Payment pasa de CREATED → APPROVED

```sql
SELECT id_pago, reference, status, provider_transaction_id 
FROM tab_pagos 
WHERE reference = 'revital_<order_id>_<random>'
ORDER BY fec_insert DESC 
LIMIT 1;
```

**Verificar:**
- [ ] `status` = 'APPROVED' (no 'CREATED' ni 'PENDING')
- [ ] `provider_transaction_id` NO es NULL

### 2. provider_transaction_id se guarda

```sql
SELECT provider_transaction_id 
FROM tab_pagos 
WHERE reference = 'revital_<order_id>_<random>';
```

**Verificar:**
- [ ] `provider_transaction_id` NO es NULL
- [ ] `provider_transaction_id` es un string válido (ej: "12345678-1234-1234-1234-123456789012")

### 3. Orden pasa a ind_estado = 2

```sql
SELECT id_orden, ind_estado, metodo_pago 
FROM tab_ordenes 
WHERE id_orden = <order_id>;
```

**Verificar:**
- [ ] `ind_estado` = 2 (Pagada)
- [ ] `metodo_pago` NO es NULL (ej: "Nequi", "Tarjeta", "Wompi")

### 4. Se ejecutan triggers (puntos, limpieza de carrito, stock)

#### a) Stock reducido:
```sql
SELECT p.id_producto, p.nom_producto, p.stock_disponible, op.cant_producto
FROM tab_orden_productos op
JOIN tab_productos p ON p.id_producto = op.id_producto
WHERE op.id_orden = <order_id>;
```
- [ ] `stock_disponible` se redujo según `cant_producto`

#### b) Carrito limpiado:
```sql
SELECT COUNT(*) as items_en_carrito
FROM tab_carritos
WHERE id_usuario = <user_id>;
```
- [ ] `items_en_carrito` = 0

#### c) Puntos acumulados:
```sql
SELECT cantidad_puntos, tipo_movimiento, id_orden_origen
FROM tab_movimientos_puntos
WHERE id_orden_origen = <order_id>
ORDER BY fec_insert DESC
LIMIT 1;
```
- [ ] Existe registro con `tipo_movimiento` = 1
- [ ] `cantidad_puntos` > 0

---

## 📊 Logs Esperados en Consola

### Frontend (Navegador):
```
🔍 [FRONTEND] ========== CALLBACK EJECUTADO (widget-callback) ==========
🔍 [FRONTEND] Resultado RAW completo: { "transaction": { "id": "...", "status": "APPROVED" } }
✅ [FRONTEND] Transaction VÁLIDA - ID: <id>, Status: APPROVED
🔍 [FRONTEND] ========== ATTACH TRANSACTION ==========
✅ [FRONTEND] Transaction ID attachado exitosamente
🔍 [FRONTEND] Iniciando polling para actualizar orden...
✅ [FRONTEND] Polling completado: status=APPROVED
```

### Backend (Servidor):
```
🔍 ========== ATTACH TRANSACTION RECIBIDO ==========
✅ Payment encontrado: id_pago=<id>, id_orden=<id>, status_actual=CREATED
✅ UPDATE ejecutado: payment_id=<id>, rows_affected=1
✅ Transaction ID attachado y verificado: <transaction_id>
🔍 POLLING INICIADO: reference=<reference>
✅ Llamando a update_payment_status con mark_order_paid=True
✅ Condición cumplida: marcando orden <id> como pagada
✅ UPDATE ejecutado: 1 fila(s) afectada(s) para orden <id>
✅ COMMIT exitoso
✅ Verificación post-commit: orden <id> - estado=2
```

---

## 🚨 Si Algo Falla

1. **Si `provider_transaction_id` sigue siendo NULL:**
   - Revisar logs del frontend: ¿se ejecuta el callback?
   - Revisar logs del backend: ¿llega la petición a `/api/payments/attach-transaction`?
   - Verificar que el `UPDATE` se ejecuta y afecta filas

2. **Si la orden no cambia a `ind_estado = 2`:**
   - Verificar que el payment tiene `status = 'APPROVED'`
   - Verificar logs de `update_payment_status` con `mark_order_paid=True`
   - Verificar que `update_order_payment_info` se ejecuta sin errores

3. **Si los triggers no se ejecutan:**
   - Verificar que `ind_estado` realmente cambió a `2`
   - Verificar que los triggers están activos en la base de datos
   - Revisar logs de PostgreSQL para errores en triggers

---

**Última actualización:** 2026-01-25

