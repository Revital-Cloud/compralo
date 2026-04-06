# Conceptos clave (explicados fácil) — Revital E‑commerce

Este documento explica conceptos comunes (middleware, JWT, tokens, triggers, cookies, etc.) **con ejemplos reales de tu proyecto**, pero con un lenguaje más sencillo.

---

## 1) ¿Qué es una API?

Piensa en la **API** como el “mostrador” del sistema: es donde el frontend pide cosas y el backend responde.

En tu proyecto, la API vive en:
- `revital_ecommerce/backend/app/main.py` (donde se registran los routers)
- `revital_ecommerce/backend/app/routers/*` (rutas como `/login`, `/carrito-productos`, `/payments/*`)

---

## 2) ¿Qué es un Middleware?

Un **middleware** es como un **filtro** o un **guardia** que se pone **antes** de que la request llegue al endpoint.

Sirve para:
- dejar pasar o bloquear
- agregar seguridad
- poner headers
- validar cosas comunes para toda la app

### Ejemplo en tu backend: `AuthMiddleware`
Archivo: `revital_ecommerce/backend/app/middlewares/auth_middleware.py`

Qué hace (en simple):
- Mira la ruta que estás llamando (`/api/...`).
- Decide si esa ruta necesita sesión o permisos de admin.
- Si necesita sesión: revisa el header `Authorization: Bearer <token>`.
- Si el token es válido: adjunta el usuario a `request.state.current_user`.
- Si no: responde 401/403.

Detalle importante de tu diseño:
- Las rutas de **carrito** se dejan públicas para anónimos:
  - En `AuthMiddleware` se ve explícito que si la ruta contiene `/carrito` o `/calcular-total`, **no exige token**.

### Ejemplo en tu backend: `SecurityMiddleware`
Archivo: `revital_ecommerce/backend/app/middlewares/security_middleware.py`

Qué hace (en simple):
- añade “cascos y cinturón” a cada respuesta, con headers como:
  - `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, etc.
- configura **CSP** (Content Security Policy), que es como una “lista de reglas” de qué scripts/estilos se permiten.
- en rutas `/docs` y similares, relaja la CSP para que Swagger funcione en dev.

---

## 3) ¿Qué es autenticación vs autorización?

- **Autenticación**: “¿Quién eres?”
  - Ej: “Soy el usuario 123”
- **Autorización**: “¿Qué puedes hacer?”
  - Ej: “Soy admin, puedo crear productos”

En tu backend esto se ve en:
- `AuthMiddleware` (verifica token y rol para rutas admin)
- `routers/*` (algunas rutas también vuelven a validar ownership)

---

## 4) ¿Qué es un Token? (y por qué existen)

Un **token** es un “pase” que demuestra que ya hiciste login.

En tu proyecto usas 2 tokens:
- **Access token**: dura poco. Se usa para llamar endpoints protegidos.
- **Refresh token**: dura más. Sirve para pedir un access token nuevo cuando el access expira.

Esto lo conectas así:
- `revital_ecommerce/backend/app/routers/auth_router.py`
  - `/login` y `/refresh` devuelven `access_token` en el body.
  - el `refresh_token` se guarda como **cookie HTTPOnly**.

---

## 5) ¿Qué es JWT?

JWT (JSON Web Token) es un tipo de token que por dentro es un texto con información y una firma.

Lo importante para entenderlo:
- El backend lo **firma** con un secreto.
- Si alguien lo cambia, la firma ya no coincide y se detecta.
- El token tiene caducidad (`exp`).

Dónde se crea/verifica en tu proyecto:
- `revital_ecommerce/backend/app/core/jwt_utils.py`
  - `create_access_token(...)`
  - `create_refresh_token(...)`
  - `verify_token(...)`

Cómo lo usa el middleware:
- `AuthMiddleware` exige `Authorization: Bearer <token>`
- llama a `auth_service.get_current_user(db, token)` (ese service termina validando el JWT)

---

## 6) ¿Qué es “Bearer” en `Authorization`?

Cuando el frontend llama al backend, manda el access token así:

`Authorization: Bearer <access_token>`

“Bearer” básicamente significa: “aquí va el token; si lo tienes, puedes entrar”.

En tu frontend esto se arma en:
- `revital_ecommerce/frontend/utils/apiWrapper.ts`
  - interceptor de request: si la ruta no es pública, agrega `Authorization = Bearer ...`.

---

## 7) ¿Qué son Cookies? (y por qué algunas son HTTPOnly)

Una **cookie** es un “dato pequeño” que el navegador guarda y envía automáticamente al backend en cada request (según dominio/path).

Tu caso:
- Guardas el **refresh token** como cookie **HTTPOnly**.

### ¿Qué significa HTTPOnly?
Que **JavaScript NO puede leerla**.

Eso ayuda a seguridad:
- si alguien logra inyectar JS (XSS), no puede robar el refresh token fácilmente.

Dónde se setea en tu backend:
- `revital_ecommerce/backend/app/routers/auth_router.py`
  - `_token_response(...)` hace:
    - `response.set_cookie(..., httponly=True, samesite="lax", secure=is_production(), path="/api")`

Dónde se elimina:
- `/logout` hace `response.delete_cookie(...)`.

### ¿Qué significa `withCredentials: true`?
En tu frontend (`apiWrapper.ts`) tienes:
- `withCredentials: true`

Eso permite que el navegador **mande cookies** al backend en requests cross-site/cross-port cuando aplica (por ejemplo para `/refresh`).

---

## 8) ¿Qué es “Refresh token flow” (renovar sesión)?

Traducción simple:
1) El usuario hace login → recibe access token + refresh token (cookie).
2) El usuario navega y el access token se vence.
3) El frontend intenta una request, recibe 401.
4) El frontend llama `/refresh` (sin pedirle nada al usuario).
5) Si el refresh cookie es válida → backend devuelve nuevo access token.
6) El frontend reintenta la request original.

En tu proyecto:
- Front: `revital_ecommerce/frontend/utils/apiWrapper.ts`
  - interceptor de response: si llega 401, intenta `refreshToken()` desde `services/auth.service.ts`.
- Backend: `revital_ecommerce/backend/app/routers/auth_router.py`
  - `/refresh` lee `request.cookies["refresh_token"]` y genera tokens nuevos.

Decisión importante tuya:
- access token se guarda **solo en memoria** (no localStorage).
  - Esto reduce el impacto de XSS, pero significa que al recargar la página se “pierde” y debes restaurar con `/refresh`.

---

## 9) sessionStorage vs localStorage (en simple)

- **localStorage**: persiste aunque cierres el navegador.
- **sessionStorage**: se borra al cerrar la pestaña (en general), y está pensado para datos temporales.

En tu proyecto:
- Carrito: se persiste con Zustand en **localStorage**:
  - `revital_ecommerce/frontend/stores/cart-store.ts` (`persist(...)`)
- Pago/redirect: guardas temporalmente el token para volver del redirect:
  - `revital_ecommerce/frontend/utils/apiWrapper.ts` usa `sessionStorage` para `PAYMENT_CALLBACK_TOKEN_KEY`.

---

## 10) ¿Qué es un Trigger en base de datos?

Un **trigger** es una regla de la base de datos que dice:
> “Cuando pase X en una tabla, ejecuta automáticamente esta función”.

Esto es útil cuando quieres que ciertas cosas ocurran **siempre**, aunque cambie el backend.

En tu proyecto los triggers hacen que, al pagar una orden:
- se descuente stock
- se acumulen puntos
- se limpie el carrito

Dónde se definen:
- `revital_ecommerce/db/triggers/triggers.sql`

Ejemplos:
- `trg_orden_acumular_puntos` (cuando `NEW.ind_estado = 2`) → ejecuta `trg_acumular_puntos_orden()`
- `trg_actualizar_stock_orden_pagada` (cuando `NEW.ind_estado = 2`) → ejecuta `fun_actualizar_stock_automatico()`
- `trg_limpiar_carrito_pagado` (solo en UPDATE, cuando cambia a 2) → ejecuta `fun_limpiar_carrito_pagado()`

La idea: **el backend solo cambia el estado de la orden a “pagada”** y la base de datos hace el resto.

---

## 11) ¿Qué es una “función” en la DB? (PL/pgSQL)

Son funciones que viven dentro de Postgres y pueden:
- leer tablas
- escribir tablas
- aplicar reglas de negocio
- devolver JSON

En tu sistema, muchas reglas del carrito y descuentos están en funciones DB:
- `fun_calcular_total_carrito` (calcula totales + descuentos + puntos a ganar)
- `fun_agregar_producto_carrito` (agrega variante al carrito y valida stock)
- `fun_migrar_carrito_anonimo_a_usuario` (migra carrito)

Ventaja:
- el cálculo es consistente sin depender del frontend.

---

## 12) ¿Qué es CORS? (cuando el navegador bloquea requests)

CORS es una regla del navegador: si tu frontend está en un dominio/puerto y el backend en otro, el navegador no deja llamar si el backend no lo permite.

En tu proyecto, CORS se configura en:
- `revital_ecommerce/backend/app/main.py` (con `CORSMiddleware`)

---

## 13) ¿Qué es CSP? (Content Security Policy)

CSP es como una “lista de permisos” para el navegador:
- de dónde se pueden cargar scripts
- si se permiten inline scripts
- de dónde se pueden cargar imágenes, etc.

En tu proyecto se setea en:
- `revital_ecommerce/backend/app/middlewares/security_middleware.py`

En desarrollo es más flexible (para que herramientas como Swagger funcionen) y en producción es más estricta.

---

## 14) ¿Qué es Rate limiting?

Rate limiting es “poner un límite” de requests por tiempo para evitar abuso (bots, fuerza bruta, etc).

En tu proyecto se ve en:
- `revital_ecommerce/backend/app/routers/auth_router.py`
  - por ejemplo `@limiter.limit("20/hour")` en `/login`

Y el frontend sabe interpretar 429:
- `revital_ecommerce/frontend/utils/apiWrapper.ts` tiene `getRateLimitMessage(...)`.

---

## 15) ¿Qué es un Webhook?

Un **webhook** es como un “mensaje automático” que un servicio externo le manda a tu backend para avisarle que **algo cambió**.

Ejemplo muy común:
- Tú pagas en una pasarela (Wompi).
- Wompi procesa el pago.
- Cuando termina, Wompi le manda una notificación a tu backend diciendo:
  - “Este pago quedó APPROVED” (aprobado) o “DECLINED” (rechazado), etc.

### ¿Por qué usar webhook?
Porque el backend no debería “adivinar” si el pago se aprobó.

Con webhook, el backend se entera directamente desde la fuente (Wompi) y puede:
- marcar la orden como pagada,
- descontar stock (vía triggers),
- acumular puntos (vía triggers),
- mandar email de confirmación.

### Webhook en tu proyecto (Wompi)
En tu backend tienes un endpoint dedicado:
- `POST /payment/webhook`

Archivo:
- `revital_ecommerce/backend/app/routers/payment_router.py`

Qué hace (explicado fácil):
- Recibe el “evento” de Wompi (el JSON del webhook).
- **Verifica la firma** (para asegurarse de que no sea alguien falso enviando mensajes).
- Extrae:
  - `status` de la transacción
  - `reference` y/o `transaction_id`
- Si es un checkout con referencia tipo `revital_cart_*`:
  - **solo crea la orden cuando el status es `APPROVED`**
  - usa `create_order_from_checkout_reference(...)` (del flujo de checkout widget).
- Si es un pago normal con `reference`:
  - busca el pago en `tab_pagos`
  - actualiza el estado y, si está `APPROVED`, marca la orden como pagada

### ¿Qué pasa si el webhook falla o se demora?
Tu proyecto tiene un “plan B”:
- `POST /payments/confirm-checkout`

Archivo:
- `revital_ecommerce/backend/app/routers/payment_widget_router.py`

Ese endpoint hace lo mismo pero “a pedido”:
- el frontend le envía `transaction_id`
- el backend consulta a Wompi y, si está `APPROVED`, crea la orden.

En resumen:
- **Webhook** = Wompi te avisa “solo”.
- **confirm-checkout** = tú preguntas “por si acaso” cuando el aviso no llegó.

---

## 16) Contraseñas: no las “encriptamos”, las hasheamos (Argon2)

### Palabras clave (en simple)

- **Encriptar** (en el sentido coloquial) suele sonar a “guardar secreto”. En seguridad, lo correcto para contraseñas es **no guardar la contraseña**, sino un **hash irreversible**: un resumen que permite **comprobar** si lo que escribió el usuario coincide, pero **no** recuperar el texto original.
- **Argon2** es un algoritmo moderno pensado solo para esto: **derivar un hash de contraseña** de forma costosa para un atacante (memoria + tiempo), para frenar ataques de fuerza bruta y diccionario. Ganó el *Password Hashing Competition* y hoy es una opción muy recomendada frente a esquemas más viejos.
- En tu backend usas la variante **Argon2id** (lo indica el prefijo `$argon2id$` en el string guardado): combina resistencia a ataques por canal lateral y por tiempo/memoria.

### Dónde está implementado en tu proyecto

Todo el manejo de hash/verificación vive en:

- `revital_ecommerce/backend/app/core/jwt_utils.py`

Ahí se crea un hasher global y dos funciones públicas:

```python
from pwdlib import PasswordHash

pwd_hasher = PasswordHash.recommended()

def get_password_hash(password: str) -> str:
    return pwd_hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_hasher.verify(plain_password, hashed_password)
```

- **`PasswordHash.recommended()`** (librería `pwdlib`) delega en **Argon2** con parámetros por defecto del ecosistema (incluyen **sal aleatoria por contraseña** y un **coste** de cómputo/memoria razonable). No hace falta fijar “bits” a mano en tu código: el string que se guarda en BD ya trae codificados tipo de algoritmo, parámetros y sal (formato estándar PHC `$argon2id$...`).
- **“Bits”**: lo habitual es hablar del **tamaño del hash de salida** y de la **sal** en bytes (p. ej. 32 bytes ≈ 256 bits de salida de hash), pero en tu proyecto eso lo resuelve la librería; tú solo llamas a `hash` / `verify`.

### Flujo en tu aplicación

1. **Guardar** (registro o cambio de contraseña): se llama a `get_password_hash(...)` y el resultado (string largo que empieza por `$argon2id$`) es lo que se persiste en el campo `password_usuario` vía los servicios/routers, por ejemplo:
   - Registro: `revital_ecommerce/backend/app/routers/user_router.py` — antes de `create_users`, se hace `hashed_password = get_password_hash(user.password_usuario)` y se sustituye `user.password_usuario`.
   - Actualización de usuario con nueva contraseña: mismo archivo, en `PUT /users/{id_usuario}`, si viene `password_usuario` se reemplaza por `get_password_hash(...)`.
   - Cambio de contraseña autenticado y reset: `revital_ecommerce/backend/app/services/auth_service.py` y `auth_router.py` usan `get_password_hash` tras validar la contraseña actual o el token de reset.

2. **Comprobar** (login): `revital_ecommerce/backend/app/services/auth_service.py` — en `authenticate_user` se obtiene el usuario por email y se hace `verify_password(password, user.password_usuario)`. Si no coincide, el login falla sin revelar si el error fue el email o la contraseña (mensaje genérico en el router).

En resumen: **la contraseña en claro solo existe en memoria durante la petición**; en base de datos solo está el **hash Argon2**, y el login **nunca compara texto plano con texto plano**, solo `verify` contra el hash guardado.

---

## 17) Glosario corto (para que quede a mano)

- **Middleware**: filtro antes de llegar a la ruta.
- **JWT**: token firmado con caducidad.
- **Access token**: “pase rápido” (corto).
- **Refresh token**: “llave para renovar” (largo), en cookie HTTPOnly.
- **Cookie**: dato que el navegador manda automáticamente.
- **HTTPOnly cookie**: cookie que JS no puede leer (más seguro).
- **Trigger**: “cuando pase algo en la tabla, ejecuta esto”.
- **CORS**: permiso del backend para que el navegador deje llamar desde otro origen.
- **CSP**: reglas de seguridad del navegador sobre scripts/estilos/orígenes.
- **sessionStorage/localStorage**: memoria temporal vs persistente en el navegador.
- **Webhook**: mensaje automático que te manda un servicio externo (ej. Wompi) para avisar un evento (pago aprobado/rechazado).
- **Hash de contraseña (Argon2)**: resumen irreversible guardado en BD; `pwdlib` + `get_password_hash` / `verify_password` en `jwt_utils.py`.

