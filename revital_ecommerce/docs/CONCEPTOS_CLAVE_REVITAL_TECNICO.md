# Conceptos clave (versión técnica) — Revital E-commerce

Este documento describe conceptos de arquitectura, seguridad y persistencia usados en `revital_ecommerce`, con foco en cómo se implementan a nivel de backend, frontend y base de datos.

---

## 1) API (Application Programming Interface)

La API HTTP expone el contrato entre cliente (frontend) y servidor (backend) mediante endpoints REST.

En este proyecto:
- Bootstrap de aplicación y registro de routers: `revital_ecommerce/backend/app/main.py`
- Endpoints por dominio: `revital_ecommerce/backend/app/routers/*`
  (ej. autenticación, carrito, pagos, órdenes)

La API define:
- superficie de acceso (`/api/...`)
- modelos de entrada/salida
- códigos de estado HTTP
- políticas de autenticación/autorización

---

## 2) Middleware

Un middleware intercepta el ciclo `request -> response` antes de llegar al handler final (endpoint), permitiendo aplicar preocupaciones transversales.

### 2.1 `AuthMiddleware`
Archivo: `revital_ecommerce/backend/app/middlewares/auth_middleware.py`

Responsabilidades:
- inspección de ruta para determinar requisitos de seguridad
- extracción de credenciales `Authorization: Bearer <JWT>`
- validación de token + resolución de usuario
- inyección de contexto de seguridad en `request.state.current_user`
- respuesta temprana con `401 Unauthorized` o `403 Forbidden` cuando aplica

Decisión de diseño relevante:
- rutas asociadas a carrito/cálculo (`/carrito`, `/calcular-total`) admiten acceso anónimo para soportar flujo guest checkout.

### 2.2 `SecurityMiddleware`
Archivo: `revital_ecommerce/backend/app/middlewares/security_middleware.py`

Aplica hardening por cabeceras:
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- políticas CSP dinámicas por entorno

En desarrollo se relaja CSP en rutas de documentación (`/docs`) para compatibilidad con Swagger/OpenAPI UI; en producción se endurece para reducir superficie XSS y carga de recursos no confiables.

---

## 3) Autenticación vs Autorización

- **Autenticación (AuthN)**: prueba de identidad (quién es el sujeto).
- **Autorización (AuthZ)**: validación de permisos/roles sobre recursos y acciones.

Implementación:
- AuthN centralizada en `AuthMiddleware` + servicios de auth.
- AuthZ por rol para rutas administrativas y validaciones de ownership adicionales en routers/servicios.

---

## 4) Tokens de sesión: Access y Refresh

Arquitectura de sesión basada en tokens de corta y larga vida:

- **Access token (JWT corto)**
  se envía en cada request protegida.
- **Refresh token (JWT largo)**
  se usa para emitir nuevo access token sin requerir login interactivo.

En `auth_router.py`:
- `/login` emite `access_token` en body
- refresh se persiste como cookie HTTPOnly
- `/refresh` rota/renueva tokens según política vigente

---

## 5) JWT (JSON Web Token)

JWT encapsula claims firmados criptográficamente (integridad/autenticidad), típicamente con `exp` para expiración.

Ubicación:
- `revital_ecommerce/backend/app/core/jwt_utils.py`

Funciones clave:
- `create_access_token(...)`
- `create_refresh_token(...)`
- `verify_token(...)`

El middleware/servicios confían en `verify_token` para:
- validar firma
- validar expiración
- extraer identidad/claims operativos

---

## 6) Esquema `Authorization: Bearer`

Bearer token transportado en header HTTP estándar:

`Authorization: Bearer <access_token>`

Frontend:
- `revital_ecommerce/frontend/utils/apiWrapper.ts`
- interceptor de request añade header a rutas privadas
- se excluyen rutas públicas explícitas

---

## 7) Cookies y atributo HTTPOnly

Cookie = mecanismo de almacenamiento/adjunto automático por el navegador sujeto a dominio/path/samesite/secure.

Uso en el proyecto:
- refresh token en cookie `HTTPOnly`, `SameSite=Lax`, `path=/api`, `secure` condicionado a entorno.

Implementación:
- set cookie: `auth_router.py` (`_token_response(...)`)
- clear cookie: endpoint `/logout`

### `withCredentials: true`
En `apiWrapper.ts`, habilita envío de cookies en escenarios cross-origin/cross-port controlados por CORS; es crítico para que `/refresh` reciba la cookie de refresh.

---

## 8) Refresh flow (renovación transparente)

Secuencia:
1. Login exitoso -> access token + refresh cookie.
2. Access token expira.
3. Request protegida retorna `401`.
4. Interceptor dispara `refreshToken()`.
5. `/refresh` valida refresh cookie y emite nuevo access.
6. Se reintenta request original con token actualizado.

Archivos:
- frontend: `frontend/utils/apiWrapper.ts`, `frontend/services/auth.service.ts`
- backend: `backend/app/routers/auth_router.py`

Decisión de seguridad:
- access token en memoria (no `localStorage`) para minimizar exfiltración por XSS persistente; a cambio, tras reload se requiere recuperación vía `/refresh`.

---

## 9) `sessionStorage` vs `localStorage`

- `localStorage`: persistencia estable entre reinicios del navegador.
- `sessionStorage`: alcance por pestaña/sesión de navegación.

Aplicación concreta:
- estado de carrito persistido con Zustand + `persist` en `localStorage`: `frontend/stores/cart-store.ts`
- token temporal de callback de pago en `sessionStorage`: `frontend/utils/apiWrapper.ts` (`PAYMENT_CALLBACK_TOKEN_KEY`)

---

## 10) Triggers de base de datos

Trigger = lógica reactiva ejecutada por Postgres ante eventos `INSERT/UPDATE/DELETE` bajo condiciones declarativas.

Archivo:
- `revital_ecommerce/db/triggers/triggers.sql`

Automatizaciones al marcar orden pagada (`ind_estado = 2`):
- acumulación de puntos (`trg_orden_acumular_puntos`)
- actualización automática de inventario (`trg_actualizar_stock_orden_pagada`)
- limpieza de carrito en transición de estado (`trg_limpiar_carrito_pagado`)

Patrón arquitectónico:
- backend cambia estado de orden
- DB garantiza side-effects críticos transaccionalmente

---

## 11) Funciones de negocio en Postgres (PL/pgSQL)

Las funciones encapsulan reglas de dominio cercanas a los datos:
- cálculos determinísticos de total/descuentos/puntos
- validaciones de stock
- migración de carrito anónimo a usuario autenticado

Ejemplos:
- `fun_calcular_total_carrito`
- `fun_agregar_producto_carrito`
- `fun_migrar_carrito_anonimo_a_usuario`

Beneficio:
- consistencia de negocio independiente del cliente y menor duplicación lógica en frontend/backend.

---

## 12) CORS (Cross-Origin Resource Sharing)

CORS controla qué orígenes pueden invocar la API desde navegador.

Configuración:
- `revital_ecommerce/backend/app/main.py` con `CORSMiddleware`

Si CORS no autoriza origen/método/headers/credentials, el navegador bloquea la llamada aunque el backend exista y responda.

---

## 13) CSP (Content Security Policy)

CSP restringe fuentes permitidas de scripts, estilos, imágenes, frames, etc.

Configuración:
- `backend/app/middlewares/security_middleware.py`

Estrategia:
- política más permisiva en desarrollo (tooling/docs)
- política estricta en producción para reducir riesgo de XSS y cargas maliciosas.

---

## 14) Rate limiting

Control de cuota por ventana temporal para evitar abuso, credential stuffing y degradación del servicio.

Implementación:
- decorators tipo `@limiter.limit("20/hour")` en rutas sensibles (`/login`)
- frontend interpreta `429 Too Many Requests` y muestra mensaje contextual (`getRateLimitMessage` en `apiWrapper.ts`)

---

## 15) Webhook de pagos (Wompi)

Webhook = callback server-to-server emitido por proveedor externo para notificar eventos asíncronos.

Endpoint:
- `POST /payment/webhook`
- `backend/app/routers/payment_router.py`

Flujo técnico:
- recepción de payload de evento
- verificación de firma (autenticidad + integridad)
- extracción de `status`, `reference`, `transaction_id`
- orquestación de actualización de pago/orden:
  - checkout reference `revital_cart_*`: creación de orden sólo si `APPROVED`
  - pago estándar: actualización en `tab_pagos` y transición de orden si aplica

Fallback idempotente:
- `POST /payments/confirm-checkout`
- `backend/app/routers/payment_widget_router.py`
- consulta activa a Wompi por `transaction_id` cuando webhook no llega o llega tarde

---

## 16) Contraseñas: hashing Argon2id (no cifrado reversible)

Buenas prácticas:
- no se almacena contraseña en claro
- se almacena hash irreversible con sal y parámetros embebidos (formato PHC)

Implementación:
- `backend/app/core/jwt_utils.py`
- `pwdlib.PasswordHash.recommended()` -> Argon2id recomendado

Funciones:
- `get_password_hash(password)`
- `verify_password(plain, hashed)`

Puntos técnicos:
- el hash contiene algoritmo, parámetros y sal (`$argon2id$...`)
- verificación por derivación + comparación segura
- contraseña en texto claro vive sólo en memoria durante request

Uso en flujos:
- registro/actualización de usuario: hash antes de persistir (`user_router.py`)
- login: verificación en `auth_service.py` (`authenticate_user`)
- cambio/reset de contraseña: rehash con nuevo secreto tras validaciones de flujo

---

## 17) Glosario técnico rápido

- **Middleware**: capa de interceptación transversal del pipeline HTTP.
- **JWT**: token autocontenido firmado con claims y expiración.
- **Access token**: credencial de acceso de corta vigencia.
- **Refresh token**: credencial de renovación de sesión de larga vigencia.
- **HTTPOnly cookie**: cookie no accesible por JavaScript del cliente.
- **Trigger**: ejecución automática en DB ante eventos de tabla.
- **CORS**: política de autorización de requests entre orígenes.
- **CSP**: política de fuentes permitidas por navegador.
- **Webhook**: notificación asíncrona server-to-server.
- **Argon2id hash**: derivación robusta de contraseñas resistente a fuerza bruta.
