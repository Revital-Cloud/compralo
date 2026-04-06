# Flujos end-to-end: carrito, checkout/pagos, descuentos y puntos (Revital E‑commerce)

Este documento explica **cómo funcionan los flujos clave** del e‑commerce, conectando:

- **Frontend (Next.js/React)**: hooks, store, servicios, API routes
- **Backend (FastAPI)**: routers/services, validaciones, persistencia
- **Base de datos (PostgreSQL)**: tablas, funciones PL/pgSQL y triggers

La idea no es “qué hace cada librería”, sino **cómo se usan en el flujo real**.

---

## Mapa rápido de dependencias por flujo

### En frontend
- **Estado local persistente**: `zustand` (`persist`) → `revital_ecommerce/frontend/stores/cart-store.ts`
- **Estado remoto/cache**: `@tanstack/react-query` → `revital_ecommerce/frontend/hooks/use-cart.ts`
- **HTTP client + auth/refresh**: `axios` (interceptors) → `revital_ecommerce/frontend/utils/apiWrapper.ts`
- **UX de feedback**: `sonner` (toasts) → en hooks y páginas (ej. `use-cart.ts`, forms)

### En backend
- **API**: `fastapi` + `starlette`
- **DB access**: `SQLAlchemy` (y algo de SQL con `text(...)`) + `psycopg2-binary` (Json)
- **Integración pagos**: `httpx` (consultas a Wompi desde backend)

### En base de datos
- **Funciones de carrito**:
  - `fun_obtener_carrito_usuario`
  - `fun_agregar_producto_carrito`
  - `fun_eliminar_producto_carrito`
  - `fun_migrar_carrito_anonimo_a_usuario`
  - `fun_calcular_total_carrito`
- **Orden y triggers (post‑pago)**:
  - `fun_actualizar_stock_automatico` (trigger en `tab_ordenes`)
  - `trg_acumular_puntos_orden` → `fun_acumular_puntos_compra`
- **Puntos/canjes**:
  - `fun_canjear_puntos_descuento`
  - `fun_obtener_resumen_puntos_usuario`

---

## Flujo 1) Persistencia de carrito: anónimo → logueado

### Objetivo de negocio
Permitir que un visitante **agregue productos sin cuenta**, y al iniciar sesión/registrarse **no pierda el carrito**.

### 1.1 Frontend: identidad del carrito (session_id estable)
El hook `useCart` define un “usuario de carrito” (`CartUser`) que puede ser:

- **Autenticado**: `{ id_usuario }`
- **Anónimo**: `{ session_id }`

Puntos clave del diseño:
- Se genera un `session_id` UUID v4 **estable** (guardado en store) para que el carrito no “cambie” entre renders.
- Ese `session_id` se persiste con `zustand/persist` en localStorage, en `revital_ecommerce/frontend/stores/cart-store.ts`.

Dónde ocurre:
- `revital_ecommerce/frontend/hooks/use-cart.ts`
  - Construye `currentCartUser` con `useMemo`.
  - Si no hay `authUser` y no hay `cartUser.session_id`, genera uno y lo persiste.

Dependencias usadas:
- `zustand` (persistencia local)
- `@tanstack/react-query` (para que el carrito remoto se cachee por key)

### 1.2 Backend: obtener/crear carrito
Frontend llama:
- `POST /carrito-usuario` con `{ id_usuario }` o `{ session_id }`

Backend resuelve:
- `routers/cart_product_router.py` → `cart_product_service.get_cart_user(...)`
- `services/cart_product_service.py` → ejecuta función SQL:
  - `SELECT fun_obtener_carrito_usuario(:id_usuario, :session_id)`

**Función SQL**: `fun_obtener_carrito_usuario`
- Archivo: `revital_ecommerce/db/Functions/tab_carritos/fun_obtener_carrito_usuario.sql`
- Qué hace:
  - Si hay `id_usuario`: busca el carrito más reciente del usuario; si no existe, lo crea.
  - Si hay `session_id`: busca el carrito anónimo más reciente (`id_usuario IS NULL`); si no existe, lo crea.
  - Para auditoría, si es anónimo usa `ABS(hashtext(session_id))` como `usr_insert`.

### 1.3 Migración automática en login
Cuando el usuario pasa de anónimo a autenticado, `useCart` detecta:
- `authUser.id_usuario` existe
- y `cartUser.session_id` existe
- y aún no se seteo `cartUser.id_usuario`

Entonces dispara:
- `POST /migrar` con `{ id_carrito }` (el carrito anónimo actual)

Backend:
- `cart_product_router.py` → `cart_product_service.migrate_cart_anonymous(...)`
- Ejecuta función SQL:
  - `fun_migrar_carrito_anonimo_a_usuario(id_carrito_anonimo, id_usuario_destino, usr_operacion)`

**Función SQL**: `fun_migrar_carrito_anonimo_a_usuario`
- Archivo: `revital_ecommerce/db/Functions/tab_carrito_productos/fun_migrar_carrito_anonimo_a_usuario.sql`
- Qué hace (paso a paso):
  1. Verifica que el carrito origen sea realmente **anónimo** (`id_usuario IS NULL`).  
     Si ya pertenece al usuario, retorna “ok” y **no elimina** (evita romper pagos/checkout en curso).
  2. Obtiene (o crea) el carrito destino del usuario con `fun_obtener_carrito_usuario(p_id_usuario, NULL)`.
  3. Itera items del carrito anónimo (`tab_carrito_productos`) y los inserta en el carrito del usuario:
     - Actualiza `precio_unitario_carrito` desde `tab_product_variant_combinations.price` (si está activo).
     - `ON CONFLICT (id_carrito, variant_id)` suma cantidades (merge).
     - Copia `opciones_elegidas`.
  4. Elimina los items del carrito anónimo y el carrito anónimo.

**Resultado funcional**: el usuario logueado queda con un carrito consolidado, y el anónimo se limpia.

---

## Flujo 2) Carrito completo: agregar → modificar → totalizar → checkout

### 2.1 Agregar al carrito (incluye anónimo)
Frontend:
- `cart.service.ts` expone `addToCart(product)` que llama:
  - `POST /carrito-productos`
  - si hay `session_id`, lo manda por **query param** (para conservar contexto anónimo).

Backend (router):
- `create_cart_product` en `routers/cart_product_router.py`
  - Prioriza `current_user` si está autenticado.
  - Si no hay user, usa `session_id` recibido por query.
  - Normaliza y delega al service.

Backend (service):
- `services/cart_product_service.py:create_cart_product`
  - Resuelve `variant_id`:
    - Si viene `variant_id`, lo usa.
    - Si viene solo `id_producto`, toma la primera variante activa (`tab_product_variant_combinations`).
  - Llama la función SQL:
    - `fun_agregar_producto_carrito(id_usuario, session_id, variant_id, cantidad, opciones_elegidas, usr)`

**Función SQL**: `fun_agregar_producto_carrito`
- Archivo: `revital_ecommerce/db/Functions/tab_carrito_productos/fun_agregar_producto_carrito.sql`
- Qué hace:
  1. Valida que exista `id_usuario` o `session_id`.
  2. Calcula `v_usr_final` (audit): user real o hash del session.
  3. Obtiene `price` y `stock` de la variante (`tab_product_variant_combinations`).
  4. Obtiene/crea `id_carrito` con `fun_obtener_carrito_usuario`.
  5. Si el item ya existe, valida stock sobre `(cantidad_actual + nueva_cantidad)`.
  6. Inserta o actualiza:
     - `ON CONFLICT (id_carrito, variant_id)` suma cantidad y mantiene `opciones_elegidas`.
  7. Actualiza `fec_update` en `tab_carritos`.

### 2.2 Cambiar cantidad
Frontend:
- `PUT /carrito-productos/{id_carrito_producto}` con `{ cantidad }`

Backend:
- `cart_product_service.update_cart_product_quantity`
  - **valida stock real**: JOIN `tab_carrito_productos` con `tab_product_variant_combinations.stock`
  - evita cantidad <= 0
  - actualiza `tab_carrito_productos.cantidad`

### 2.3 Eliminar item
Frontend:
- `DELETE /carrito-productos/{id_carrito_producto}` (moderno, por línea)

Backend:
- `delete_cart_product_by_id` elimina exactamente esa fila en `tab_carrito_productos`.

Legacy (compatibilidad):
- Existe un delete por ruta compuesta que termina resolviendo `variant_id` y llama:
  - `fun_eliminar_producto_carrito(...)`

**Función SQL**: `fun_eliminar_producto_carrito`
- Archivo: `revital_ecommerce/db/Functions/tab_carrito_productos/fun_eliminar_producto_carrito.sql`
- Qué hace:
  - Obtiene carrito con `fun_obtener_carrito_usuario`.
  - Busca `cantidad_actual`.
  - Si `p_cantidad` es null o >= actual, elimina la fila; si no, reduce cantidad.
  - Actualiza `fec_update` del carrito.

---

## Flujo 3) Cálculo de totales con descuentos y canje de puntos

### 3.1 Frontend: cálculo de total (react-query)
`useCart` mantiene una query para totales:
- Llama a `POST /calcular-total` con:
  - `{ id_usuario }` o `{ session_id }`
  - `id_canje_aplicar` (si el usuario seleccionó un canje)

Esto permite:
- recalcular al cambiar items,
- recalcular al seleccionar/quitar canje,
- mantener UI en sync con fuente de verdad de backend.

### 3.2 Backend: fuente de verdad = función SQL
Backend:
- `services/cart_product_service.py:calculate_total_cart`
  - ejecuta:
    - `SELECT fun_calcular_total_carrito(:id_usuario, :session_id, :id_canje_aplicar)`
  - retorna el JSON (si ya viene en contrato completo).

**Función SQL**: `fun_calcular_total_carrito`
- Archivo: `revital_ecommerce/db/Functions/tab_carritos/fun_calcular_total_carrito.sql`
- Qué hace (resumen fiel al código):

**A) Si el usuario es anónimo (`p_id_usuario IS NULL`)**
- Obtiene carrito con `fun_obtener_carrito_usuario(NULL, session_id)`
- Suma subtotal de carrito
- Retorna JSON sin descuentos, con mensajes:
  - “Regístrate para acceder a descuentos y puntos”

**B) Si el usuario está logueado**
1. Obtiene `id_carrito` con `fun_obtener_carrito_usuario(id_usuario, session_id)`
2. Calcula `v_total_productos = SUM(cantidad * precio_unitario_carrito)`
3. Si carrito vacío, retorna “Carrito vacío”
4. Detecta primera compra:
   - `NOT EXISTS (SELECT 1 FROM tab_ordenes WHERE id_usuario = p_id_usuario)`
5. Aplica **TODOS** los descuentos automáticos activos:
   - Filtra `tab_descuentos` con:
     - activo, fechas vigentes
     - `ind_canjeable_puntos = FALSE`
     - `requiere_codigo = FALSE`
     - y valida reglas extra con `fun_validar_descuento_aplicable(...)`
   - Calcula el descuento por:
     - total pedido, producto específico, categoría, marca (según `aplica_a`)
6. Aplica **1 canje** si llega `p_id_canje_aplicar`:
   - valida ownership del canje, no usado, no expirado
   - calcula descuento con lógica similar (según aplica_a)
7. Suma descuentos (auto + canje), clamp:
   - `v_total_descuentos := LEAST(v_total_descuentos, v_total_productos)`
8. Calcula puntos a ganar:
   - `fun_calcular_puntos_por_compra(v_total_productos)` (nota: sobre **valor antes de descuentos**)
9. Retorna JSON completo:
   - `total_final`, `total_descuentos`, breakdown de descuentos, `puntos_a_ganar`, mensajes UX.

**Resultado**: el frontend no “inventa” descuentos; solo renderiza el JSON de BD.

---

## Flujo 4) Checkout y pago: de carrito a orden pagada

Tienes dos caminos de pago en el backend:

1) **Checkout con Wompi Widget** (recomendado en tu implementación actual): crea la orden solo con pago APPROVED.  
2) **Pago directo con métodos guardados** (router `order_router`), también evita crear orden si el pago no aprueba en ciertos endpoints.

### 4.1 Camino A (principal): Wompi Checkout Widget (`/api/payments/*`)

#### A1) Crear sesión de checkout (sin orden)
Frontend (server-side proxy Next):
- `POST /api/payments/create-checkout`
  - (proxy hacia backend `POST /api/payments/create-checkout`)

Backend:
- `routers/payment_widget_router.py:create_checkout_session_endpoint`
  1. Valida que `cart_id` pertenezca al usuario.
  2. Calcula total con `cart_product_service.calculate_total_cart` (que llama `fun_calcular_total_carrito`).
  3. Genera referencia embebida:
     - `generate_checkout_reference_from_cart(cart_id, id_direccion, id_canje, codigo_descuento?)`
     - Formato: `revital_cart_{cart_id}_{id_direccion}_{id_canje}_{nonce}[.codigo_desc]`
  4. Genera firma integridad:
     - `generate_integrity_signature(reference, amount_in_cents, currency, integrity_secret)`
  5. Devuelve: `reference`, `amount_in_cents`, `public_key`, `integrity_signature`

Dependencias:
- `httpx` NO se usa aquí (aún), solo cálculo/firmas.

#### A2) Abrir widget en frontend, adjuntar `transaction_id`
Frontend:
- Abre widget con config del backend.
- Tras obtener `transaction_id` del widget:
  - `POST /api/payments/attach-transaction` (proxy a backend)

Backend:
- `attach_transaction` → `attach_transaction_id(...)`
- Actualiza `tab_pagos`:
  - `provider_transaction_id`
  - `status` pasa CREATED → PENDING (si aplicaba)

Tablas:
- `tab_pagos`

#### A3) Polling / status y consolidación
Frontend:
- puede llamar `GET /api/payments/poll?reference=...`
- o `GET /api/payments/status?reference=...`

Backend:
- consulta Wompi con `poll_transaction_status` o `fetch_transaction_by_id`
  - usa `httpx` + circuit breaker (`run_with_circuit_breaker`)
- si llega a estado final, persiste:
  - `update_payment_status(...)`:
    - actualiza `tab_pagos`
    - y si APPROVED marca orden pagada (si ya existe)

#### A4) Confirm-checkout (respaldo si el webhook no llegó)
Frontend (payment-result):
- si tiene `transaction_id`, llama:
  - `POST /api/payments/confirm-checkout`

Backend:
- `confirm_checkout`:
  1. consulta Wompi por `transaction_id`
  2. valida que `reference` coincida y status == APPROVED
  3. crea la orden con `create_order_from_checkout_reference(...)`

**create_order_from_checkout_reference (service)**
- Parsea referencia `revital_cart_*` con:
  - `parse_checkout_reference` → `(cart_id, id_direccion, id_canje?, codigo_descuento?)`
- Si no es APPROVED → no crea orden.
- Si APPROVED:
  1. valida que el carrito exista y tenga `id_usuario`
  2. lock transaccional por referencia (`pg_advisory_xact_lock`) para evitar duplicados (webhook vs confirm)
  3. crea orden con `order_service.create_order(..., ind_estado=1)`
  4. actualiza a pagada `ind_estado=2` con `order_service.update_order_payment_info(...)`
  5. registra pago `APPROVED` en `tab_pagos` (si aplica)

**Efecto clave**: al pasar orden a estado 2, entran triggers de BD:
- stock (`trg_actualizar_stock_orden_pagada` → `fun_actualizar_stock_automatico`)
- puntos (`trg_acumular_puntos_orden` → `fun_acumular_puntos_compra`)
- (y según tu schema, limpieza de carrito pagado)

---

## Flujo 5) Sistema de puntos: ganar, canjear y auditar

### 5.1 Ganar puntos (automático al pagar)
No se hace en frontend ni en backend “a mano”: se hace en **BD por trigger**.

Trigger:
- `trg_acumular_puntos_orden` (`revital_ecommerce/db/triggers/trg_acumular_puntos_orden.sql`)

Cuándo dispara:
- al insertar o actualizar una orden a `ind_estado = 2` (pagada)
- evita doble acumulación si `OLD.ind_estado` ya era 2

Qué ejecuta:
- `fun_acumular_puntos_compra(NEW.id_usuario, NEW.id_orden, NEW.val_total_productos, usr)`

**Función SQL**: `fun_acumular_puntos_compra`
- Archivo: `revital_ecommerce/db/Functions/tab_puntos_usuario/fun_acumular_puntos_por_compra.sql`
- Qué hace:
  1. Valida inputs (usuario, orden, valor positivo, usr auditoría)
  2. Evita duplicados: si ya existe movimiento tipo 1 para esa orden, no acumula
  3. Calcula puntos con `fun_calcular_puntos_por_compra(p_val_total_pedido)`
     - en tu lógica, le pasas `val_total_productos` (antes de descuentos)
  4. Crea o actualiza `tab_puntos_usuario` (saldo disponible, totales)
  5. Inserta auditoría en `tab_movimientos_puntos` (tipo 1 acumulación)
  6. Retorna JSON con saldos anterior/nuevo y puntos otorgados

### 5.2 Canjear puntos por descuento
Se hace en BD con una función que:
- descuenta puntos
- crea el canje
- registra movimiento
- (y opcionalmente lo marca “utilizado” si lo aplicó automáticamente)

**Función SQL**: `fun_canjear_puntos_descuento`
- Archivo: `revital_ecommerce/db/Functions/tab_canjes_puntos_descuentos/fun_canjear_puntos_descuento.sql`
- Qué hace:
  1. valida que el descuento existe y es canjeable
  2. valida vigencia
  3. asegura registro `tab_puntos_usuario`
  4. valida puntos suficientes
  5. descuenta puntos (update de `tab_puntos_usuario`)
  6. crea canje en `tab_canjes_puntos_descuentos` con expiración (30 días)
  7. inserta movimiento en `tab_movimientos_puntos` (tipo 2 canje)
  8. busca carrito activo y, si aplica, calcula total con:
     - `fun_calcular_total_carrito(p_id_usuario, NULL, v_id_canje)`
     - si detecta descuento aplicado, marca el canje como `ind_utilizado = TRUE`

### 5.3 Mostrar resumen de puntos
**Función SQL**: `fun_obtener_resumen_puntos_usuario`
- Archivo: `revital_ecommerce/db/Functions/tab_puntos_usuario/fun_obtener_resumen_puntos_usuario.sql`
- Qué hace:
  - obtiene saldos del usuario, cuenta canjes disponibles no vencidos
  - toma config activa de `tab_config_puntos_empresa.pesos_por_punto`
  - retorna JSON consolidado

**Nota técnica**: en el SQL actual hay una referencia a `p_usr_operacion` en el bloque “crear registro si no existe” sin estar en parámetros; revisa esa función porque podría fallar si entra por el camino “NOT FOUND”.

---

## Flujo 6) Qué pasa exactamente cuando una orden queda pagada (estado 2)

La transición a `ind_estado=2` es el “punto de no retorno”:

1) **Stock**: trigger `trg_actualizar_stock_orden_pagada` llama:
- `fun_actualizar_stock_automatico`
- Archivo: `revital_ecommerce/db/Functions/tab_productos/fun_actualizar_stock_automatico.sql`
- Cómo funciona:
  - solo actúa si `NEW.ind_estado IN (2,3)` y evita doble descuento si ya estaba en 2/3
  - recorre `tab_orden_productos` por `variant_id`
  - valida stock suficiente
  - reduce stock en `tab_product_variant_combinations`
  - inserta movimiento en `tab_movimientos_inventario` (`salida_venta`)

2) **Puntos**: trigger `trg_acumular_puntos_orden` (explicado arriba)

3) **Carrito**: en tu backend `order_service.update_order_payment_info` menciona `trg_limpiar_carrito_pagado`.  
En este análisis no abrí ese archivo de trigger, pero tu diseño implica que al pagar:
- se vacía el carrito
- para que el usuario no vea los ítems “comprados” como si siguieran pendientes

---

## Checklist de “dónde mirar” cuando algo falla en estos flujos

- **Carrito anónimo que “se pierde” al login**
  - Front: `useCart` y `cart-store` (`session_id` persistido)
  - Back: `/migrar` + `fun_migrar_carrito_anonimo_a_usuario`

- **Totales/Descuentos no coinciden**
  - BD: `fun_calcular_total_carrito` (reglas reales)
  - Validación extra: `fun_validar_descuento_aplicable`

- **Pago aprobado pero no hay orden**
  - Backend: `/payments/confirm-checkout` y `create_order_from_checkout_reference`
  - BD: que el carrito `revital_cart_*` exista y tenga `id_usuario`

- **Orden pagada pero stock no cambia**
  - BD: trigger `trg_actualizar_stock_orden_pagada` y función `fun_actualizar_stock_automatico`
  - Asegurar que el estado realmente cambió de !=2 a 2 (si ya estaba en 2, triggers no se ejecutan)

- **Puntos no aparecen**
  - BD: `trg_acumular_puntos_orden` + `fun_acumular_puntos_compra`
  - Revisar que `val_total_productos` tenga el valor esperado (base de cálculo)

