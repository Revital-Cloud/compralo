# Archivos que Actualizan el Estado de la Orden a Pagada (ind_estado = 2)

Este documento lista todos los archivos que se encargan de actualizar el estado de una orden a **Pagada** (`ind_estado = 2`).

---

## 📋 Resumen

El estado de una orden cambia a **Pagada (2)** cuando:
1. Un pago es aprobado (`status = 'APPROVED'`)
2. Se ejecuta una función SQL que actualiza `ind_estado = 2`
3. Los triggers de la base de datos se activan automáticamente

---

## 🔧 Backend (Python/FastAPI)

### 1. **`backend/app/services/payment_widget_service.py`**

**Función principal:** `update_payment_status()`

**Líneas relevantes:** 411-689

**Descripción:**
- Actualiza el estado de un payment en `tab_pagos`
- Si `mark_order_paid=True` y `status="APPROVED"`, marca la orden como pagada
- Llama a `order_service.update_order_payment_info()` con `ind_estado=2`

**Código clave:**
```python
if mark_order_paid and status == "APPROVED":
    order_service.update_order_payment_info(
        db,
        order_id_decimal,
        metodo_pago=metodo_pago_orden,
        ind_estado=2,  # 2 = procesada/aprobada
        commit=False
    )
```

**Llamado desde:**
- `payment_widget_router.py` - Endpoint `/api/payments/poll` (línea 335)
- `payment_router.py` - Webhook `/api/payment/webhook` (línea 287)

---

### 2. **`backend/app/services/order_service.py`**

**Función principal:** `update_order_payment_info()`

**Líneas relevantes:** 458-512

**Descripción:**
- Actualiza `metodo_pago` y/o `ind_estado` de una orden
- Ejecuta `UPDATE tab_ordenes SET ind_estado = :ind_estado WHERE id_orden = :id_orden`
- Puede hacer commit o dejar que el llamador lo maneje

**Código clave:**
```python
def update_order_payment_info(
    db: Session, 
    id_orden: Decimal, 
    metodo_pago: str | None = None, 
    ind_estado: int | None = None, 
    commit: bool = True
):
    # ...
    if ind_estado is not None:
        sets.append("ind_estado = :ind_estado")
        params["ind_estado"] = ind_estado
    # ...
    query = text(f"UPDATE tab_ordenes SET {', '.join(sets)} WHERE id_orden = :id_orden")
    db.execute(query, params)
```

**Llamado desde:**
- `payment_widget_service.py` - `update_payment_status()` (línea 586)

---

### 3. **`backend/app/routers/payment_widget_router.py`**

**Endpoint:** `GET /api/payments/poll`

**Líneas relevantes:** 282-368

**Descripción:**
- Hace polling del estado de una transacción en Wompi
- Si el estado es `APPROVED`, llama a `update_payment_status()` con `mark_order_paid=True`

**Código clave:**
```python
if status_result in ["APPROVED", "DECLINED", "VOIDED", "ERROR"]:
    update_payment_status(
        db=db,
        reference=reference,
        status=status_result,
        transaction_data=transaction_data,
        mark_order_paid=(status_result == "APPROVED")  # ← Aquí se marca como pagada
    )
```

---

### 4. **`backend/app/routers/payment_router.py`**

**Endpoint:** `POST /api/payment/webhook`

**Líneas relevantes:** 159-301

**Descripción:**
- Recibe webhooks de Wompi
- Si el status es `APPROVED`, llama a `update_payment_status()` con `mark_order_paid=True`

**Código clave:**
```python
update_payment_status(
    db=db,
    reference=payment.get("reference") or reference,
    status=status_tx,
    transaction_data=tx,
    mark_order_paid=(status_tx == "APPROVED")  # ← Aquí se marca como pagada
)
```

---

## 🗄️ Base de Datos (PostgreSQL)

### 5. **`db/Functions/tab_pagos/fun_marcar_orden_pagada.sql`**

**Función:** `fun_marcar_orden_pagada()`

**Descripción:**
- Función centralizada para marcar una orden como pagada
- Valida la orden, verifica el monto, marca como pagada (estado 2)
- Procesa descuentos, acumula puntos, actualiza estadísticas

**Código clave:**
```sql
-- PASO 3: Marcar orden como pagada usando función centralizada
SELECT fun_cambiar_estado_orden(
    p_id_orden,
    2,  -- Estado: Pagada
    ...
) INTO v_resultado_cambio_estado;
```

**Llamado desde:**
- Triggers de `tab_pagos` (MercadoPago legacy)
- Puede ser llamado manualmente desde el backend

---

### 6. **`db/triggers/triggers.sql`**

**Triggers definidos:**

#### a) **`trg_orden_acumular_puntos`**
- **Tabla:** `tab_ordenes`
- **Evento:** `AFTER UPDATE`
- **Condición:** `WHEN (OLD.ind_estado != 2 AND NEW.ind_estado = 2)`
- **Función:** `trg_acumular_puntos_orden()`
- **Acción:** Acumula puntos cuando la orden cambia a pagada

#### b) **`trg_actualizar_estadisticas_orden_pagada`**
- **Tabla:** `tab_ordenes`
- **Evento:** `AFTER INSERT OR UPDATE OF ind_estado`
- **Condición:** `WHEN (NEW.ind_estado = 2)`
- **Función:** `fun_trigger_actualizar_estadisticas_orden()`
- **Acción:** Actualiza estadísticas cuando la orden está pagada

#### c) **`trg_actualizar_stock_orden_pagada`**
- **Tabla:** `tab_ordenes`
- **Evento:** `AFTER UPDATE`
- **Condición:** `WHEN (OLD.ind_estado != 2 AND NEW.ind_estado = 2)`
- **Función:** `fun_actualizar_stock_automatico()`
- **Acción:** Reduce el stock cuando la orden cambia a pagada

#### d) **`trg_limpiar_carrito_pagado`**
- **Tabla:** `tab_ordenes`
- **Evento:** `AFTER UPDATE`
- **Condición:** `WHEN (OLD.ind_estado != 2 AND NEW.ind_estado = 2)`
- **Función:** `fun_limpiar_carrito_pagado()`
- **Acción:** Limpia el carrito cuando la orden cambia a pagada

#### e) **`trg_marcar_orden_pagada_mercadopago`** (Legacy)
- **Tabla:** `tab_pagos`
- **Evento:** `AFTER UPDATE OF status`
- **Condición:** `WHEN (NEW.status = 'approved')`
- **Función:** `fun_trigger_marcar_orden_pagada_auto()`
- **Acción:** Marca orden como pagada cuando un pago se aprueba (MercadoPago legacy)

---

### 7. **`db/triggers/trg_actualizar_stock_orden_pagada.sql`**

**Trigger:** `trg_actualizar_stock_orden_pagada`

**Descripción:**
- Reduce automáticamente el stock cuando una orden cambia a pagada
- Se ejecuta cuando `ind_estado` cambia de cualquier valor a `2`

**Código:**
```sql
CREATE TRIGGER trg_actualizar_stock_orden_pagada
    AFTER UPDATE ON tab_ordenes
    FOR EACH ROW
    WHEN (OLD.ind_estado != 2 AND NEW.ind_estado = 2)
    EXECUTE FUNCTION fun_actualizar_stock_automatico();
```

---

### 8. **`db/triggers/trg_acumular_puntos_orden.sql`**

**Función trigger:** `trg_acumular_puntos_orden()`

**Descripción:**
- Acumula puntos automáticamente cuando una orden cambia a pagada
- Llama a `fun_acumular_puntos_compra()`

**Código clave:**
```sql
PERFORM fun_acumular_puntos_compra(
    NEW.id_usuario,
    NEW.id_orden,
    NEW.val_total_productos,
    COALESCE(NEW.usr_update, NEW.usr_insert)
);
```

---

## 🔄 Flujo Completo

### Flujo Principal (Wompi Widget):

1. **Frontend:** Usuario completa pago en widget → `PayButton.tsx`
2. **Frontend:** Llama a `/api/payments/attach-transaction` → `attach-transaction/route.ts`
3. **Frontend:** Llama a `/api/payments/poll` → `poll/route.ts`
4. **Backend:** `payment_widget_router.py` → `poll_payment()`
5. **Backend:** `payment_widget_service.py` → `poll_transaction_status()`
6. **Backend:** `payment_widget_service.py` → `update_payment_status()` con `mark_order_paid=True`
7. **Backend:** `order_service.py` → `update_order_payment_info()` con `ind_estado=2`
8. **Database:** `UPDATE tab_ordenes SET ind_estado = 2 WHERE id_orden = X`
9. **Database:** Triggers se activan automáticamente:
   - `trg_actualizar_stock_orden_pagada` → Reduce stock
   - `trg_limpiar_carrito_pagado` → Limpia carrito
   - `trg_orden_acumular_puntos` → Acumula puntos
   - `trg_actualizar_estadisticas_orden_pagada` → Actualiza estadísticas

### Flujo Alternativo (Webhook):

1. **Wompi:** Envía webhook → `POST /api/payment/webhook`
2. **Backend:** `payment_router.py` → `handle_wompi_webhook()`
3. **Backend:** `payment_widget_service.py` → `update_payment_status()` con `mark_order_paid=True`
4. **Backend:** `order_service.py` → `update_order_payment_info()` con `ind_estado=2`
5. **Database:** `UPDATE tab_ordenes SET ind_estado = 2 WHERE id_orden = X`
6. **Database:** Triggers se activan automáticamente (igual que arriba)

---

## 📝 Notas Importantes

1. **Estado 2 = Pagada:** El estado `2` significa "Pagada" (pago confirmado, en preparación)
2. **Idempotencia:** Todas las funciones verifican el estado actual antes de actualizar
3. **Transacciones:** El commit se hace después de actualizar tanto el payment como la orden
4. **Triggers Automáticos:** Los triggers se ejecutan automáticamente cuando `ind_estado` cambia a `2`
5. **Logging:** Todos los archivos tienen logging extensivo para debugging

---

## 🐛 Debugging

Si las órdenes no se están marcando como pagadas:

1. Verificar logs del backend para `update_payment_status`
2. Verificar que `mark_order_paid=True` se está pasando
3. Verificar que `status == "APPROVED"` en el payment
4. Verificar que `update_order_payment_info` se ejecuta sin errores
5. Verificar que el `UPDATE` en la base de datos afecta filas (`rowcount > 0`)
6. Verificar que los triggers están activos en la base de datos

---

## 📂 Lista Completa de Archivos

### Backend:
- ✅ `backend/app/services/payment_widget_service.py` (líneas 411-689)
- ✅ `backend/app/services/order_service.py` (líneas 458-512)
- ✅ `backend/app/routers/payment_widget_router.py` (líneas 282-368)
- ✅ `backend/app/routers/payment_router.py` (líneas 159-301)

### Base de Datos:
- ✅ `db/Functions/tab_pagos/fun_marcar_orden_pagada.sql`
- ✅ `db/triggers/triggers.sql`
- ✅ `db/triggers/trg_actualizar_stock_orden_pagada.sql`
- ✅ `db/triggers/trg_acumular_puntos_orden.sql`
- ✅ `db/Functions/tab_carritos/fun_limpiar_carrito_completado.sql` (llamado por trigger)
- ✅ `db/Functions/tab_productos/fun_actualizar_stock_automatico.sql` (llamado por trigger)
- ✅ `db/Functions/tab_puntos_usuario/fun_acumular_puntos_por_compra.sql` (llamado por trigger)

---

**Última actualización:** 2026-01-25

