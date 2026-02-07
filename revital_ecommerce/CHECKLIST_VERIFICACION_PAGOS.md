# Checklist de Verificación - Flujo de Pagos Wompi

## ✅ Verificación Post-Implementación

### 1. Frontend - Callback del Widget

- [ ] **Logs en consola del navegador:**
  - [ ] Ver `🔍 [FRONTEND] ========== CALLBACK EJECUTADO (widget-callback) ==========`
  - [ ] Ver `🔍 [FRONTEND] Resultado RAW completo:` con estructura JSON completa
  - [ ] Ver `✅ [FRONTEND] Transaction VÁLIDA - ID: <transaction_id>, Status: <status>`
  - [ ] Ver `🔍 [FRONTEND] ========== ATTACH TRANSACTION ==========`
  - [ ] Ver `✅ [FRONTEND] Transaction ID attachado exitosamente:`

- [ ] **Si el callback no se ejecuta:**
  - [ ] Verificar logs de `postMessage` (fallback)
  - [ ] Verificar que el widget se abre correctamente
  - [ ] Verificar que no hay errores de JavaScript en consola

### 2. Backend - Attach Transaction

- [ ] **Logs del backend:**
  - [ ] Ver `🔍 ========== ATTACH TRANSACTION RECIBIDO ==========`
  - [ ] Ver `✅ Payment encontrado: id_pago=<id>, id_orden=<id>, status_actual=<status>`
  - [ ] Ver `🔍 Ejecutando UPDATE para attach transaction_id`
  - [ ] Ver `✅ UPDATE ejecutado: payment_id=<id>, rows_affected=1`
  - [ ] Ver `✅ Transaction ID attachado y verificado`

- [ ] **Verificar en base de datos:**
  ```sql
  SELECT id_pago, id_orden, reference, provider_transaction_id, status 
  FROM tab_pagos 
  WHERE reference = 'revital_<order_id>_<random>'
  ORDER BY fec_insert DESC 
  LIMIT 1;
  ```
  - [ ] `provider_transaction_id` NO es NULL
  - [ ] `status` es 'PENDING' o 'APPROVED' (no 'CREATED')

### 3. Backend - Polling

- [ ] **Logs del backend:**
  - [ ] Ver `🔍 POLLING INICIADO: reference=<reference>`
  - [ ] Ver `🔍 Payment encontrado: True`
  - [ ] Ver `🔍 Polling resultado: status=APPROVED, es_estado_final=True`
  - [ ] Ver `✅ Llamando a update_payment_status con mark_order_paid=True`
  - [ ] Ver `✅ update_payment_status completado exitosamente`

- [ ] **Verificar en base de datos después del polling:**
  ```sql
  SELECT id_pago, status, provider_transaction_id 
  FROM tab_pagos 
  WHERE reference = 'revital_<order_id>_<random>';
  ```
  - [ ] `status` = 'APPROVED'

### 4. Backend - Actualización de Orden

- [ ] **Logs del backend:**
  - [ ] Ver `🔍 update_payment_status: mark_order_paid=True, status=APPROVED`
  - [ ] Ver `✅ Condición cumplida: marcando orden <id> como pagada`
  - [ ] Ver `🔍 Llamando a update_order_payment_info para orden <id>`
  - [ ] Ver `✅ UPDATE ejecutado: <n> fila(s) afectada(s) para orden <id>`
  - [ ] Ver `✅ COMMIT exitoso`
  - [ ] Ver `✅ Verificación post-commit: orden <id> - estado=2`

- [ ] **Verificar en base de datos:**
  ```sql
  SELECT id_orden, ind_estado, metodo_pago 
  FROM tab_ordenes 
  WHERE id_orden = <order_id>;
  ```
  - [ ] `ind_estado` = 2 (Pagada)
  - [ ] `metodo_pago` NO es NULL (ej: "Nequi", "Tarjeta", "Wompi")

### 5. Triggers Automáticos

- [ ] **Stock reducido:**
  ```sql
  SELECT p.id_producto, p.nom_producto, p.stock_disponible, op.cant_producto
  FROM tab_orden_productos op
  JOIN tab_productos p ON p.id_producto = op.id_producto
  WHERE op.id_orden = <order_id>;
  ```
  - [ ] `stock_disponible` se redujo según `cant_producto`

- [ ] **Carrito limpiado:**
  ```sql
  SELECT COUNT(*) as items_en_carrito
  FROM tab_carritos
  WHERE id_usuario = <user_id>;
  ```
  - [ ] `items_en_carrito` = 0

- [ ] **Puntos acumulados:**
  ```sql
  SELECT cantidad_puntos, tipo_movimiento, id_orden_origen
  FROM tab_movimientos_puntos
  WHERE id_orden_origen = <order_id>
  ORDER BY fec_insert DESC
  LIMIT 1;
  ```
  - [ ] Existe un registro con `tipo_movimiento` = 1 (acreditación)
  - [ ] `cantidad_puntos` > 0

### 6. Flujo Completo - Verificación Final

```sql
-- Verificar payment
SELECT 
    p.id_pago,
    p.id_orden,
    p.reference,
    p.provider_transaction_id,
    p.status as pago_status,
    p.payment_method_type,
    o.ind_estado as orden_estado,
    o.metodo_pago,
    o.val_total_pedido
FROM tab_pagos p
JOIN tab_ordenes o ON o.id_orden = p.id_orden
WHERE p.reference = 'revital_<order_id>_<random>'
ORDER BY p.fec_insert DESC
LIMIT 1;
```

**Resultado esperado:**
- [ ] `provider_transaction_id` NO es NULL
- [ ] `pago_status` = 'APPROVED'
- [ ] `orden_estado` = 2
- [ ] `metodo_pago` NO es NULL
- [ ] `payment_method_type` NO es NULL

---

## 🐛 Troubleshooting

### Si `provider_transaction_id` sigue siendo NULL:

1. **Verificar logs del frontend:**
   - ¿Se ejecuta el callback del widget?
   - ¿El `result.transaction.id` existe?
   - ¿Se llama a `/api/payments/attach-transaction`?

2. **Verificar logs del backend:**
   - ¿Llega la petición a `/api/payments/attach-transaction`?
   - ¿El `UPDATE` se ejecuta correctamente?
   - ¿Hay errores en `attach_transaction_id`?

3. **Verificar en base de datos:**
   ```sql
   SELECT * FROM tab_pagos WHERE reference = '<reference>' ORDER BY fec_insert DESC LIMIT 1;
   ```

### Si la orden no cambia a `ind_estado = 2`:

1. **Verificar que el payment tiene `status = 'APPROVED'`:**
   ```sql
   SELECT status FROM tab_pagos WHERE reference = '<reference>';
   ```

2. **Verificar logs de `update_payment_status`:**
   - ¿Se llama con `mark_order_paid=True`?
   - ¿Se llama a `update_order_payment_info`?
   - ¿El `UPDATE` afecta filas?

3. **Verificar triggers:**
   ```sql
   SELECT trigger_name, event_manipulation, event_object_table
   FROM information_schema.triggers
   WHERE event_object_table = 'tab_ordenes'
   AND trigger_name LIKE '%pagada%';
   ```

---

## 📝 Notas

- Todos los logs deben aparecer en orden cronológico
- Si falta algún log, el problema está en ese paso
- Los triggers se ejecutan automáticamente cuando `ind_estado` cambia a `2`
- El webhook de Wompi también puede actualizar el payment (verificar logs del webhook)

