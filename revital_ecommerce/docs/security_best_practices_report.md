# Informe de seguridad – revital_ecommerce

**Fecha:** 2025-02-20  
**Alcance:** Backend (FastAPI) y frontend (Next.js 15 / React 19) del componente `revital_ecommerce`.  
**Referencias:** security-best-practices (FastAPI, React, Next.js), **frontend-security-coder**, **backend-security-coder**.

---

## 1. Metodología: Caja negra y caja blanca

El informe se basa en dos enfoques complementarios de pruebas de seguridad:

| Enfoque | Descripción | Qué se evalúa |
|--------|-------------|----------------|
| **Caja negra** | Pruebas sin acceso al código fuente. Perspectiva de atacante externo o auditor que solo ve entradas/salidas. | APIs (requests/responses), headers HTTP, comportamiento ante inputs maliciosos, rate limits, exposición de docs, CORS, tokens en cliente (DevTools), redirecciones, formularios. |
| **Caja blanca** | Revisión del código fuente y configuración. Conocimiento completo de flujos, validaciones y almacenamiento. | Validación de entrada, sanitización, almacenamiento de tokens, uso de DOMPurify/innerHTML, gestión de secretos (NEXT_PUBLIC_*), queries SQL, JWT, logging, middlewares. |

- **Frontend (frontend-security-coder):** XSS, DOM seguro, CSP, almacenamiento de sesión, sanitización de salida, redirecciones, clickjacking, integración con terceros (Wompi).
- **Backend (backend-security-coder):** Validación de entrada, autenticación/autorización, rate limiting, headers, cookies, JWT, consultas parametrizadas, manejo de errores y logs.

Cada hallazgo indica si fue identificado mediante **caja negra** (B), **caja blanca** (W) o ambas (B+W), y se proponen **pruebas de verificación** en ambos enfoques.

---

## 2. Resumen ejecutivo

Se realizó un barrido de seguridad sobre **revital_ecommerce** (backend FastAPI y frontend Next.js) aplicando pruebas de **caja negra** (interfaz, API, headers, cliente) y **caja blanca** (código y configuración). El backend tiene una base sólida: JWT con algoritmo fijo, Argon2 para contraseñas, CORS con allowlist, docs deshabilitadas en producción, webhook de Wompi verificado con cuerpo raw, rate limiting parcial y middleware de seguridad con headers y CSP. Las principales mejoras recomendadas son: **no almacenar tokens de sesión en localStorage** (riesgo ante XSS), **sanitizar HTML** donde se usa `dangerouslySetInnerHTML`, **revisar NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET**, **TrustedHostMiddleware** en producción, **rate limiting en auth** y **lista explícita de algoritmos JWT**.

---

## 3. Hallazgos por severidad

### Críticos

*(Ninguno que requiera acción inmediata sin contexto adicional.)*

---

### Altos

#### SEC-001: Tokens de autenticación en localStorage (Frontend)

| Atributo | Detalle |
|----------|---------|
| **Metodología** | Caja blanca (W); caja negra (B) para verificar exposición en cliente. |
| **Skill** | frontend-security-coder (Authentication and Session Management, Token storage). |
| **Regla** | REACT-AUTH-001. |
| **Ubicación** | `revital_ecommerce/frontend/utils/apiWrapper.ts`, líneas 213–248. |
| **Evidencia** | `localStorage.getItem('access_token')`, `localStorage.setItem('access_token', ...)`, idem para `refresh_token`. |

- **Impacto:** Ante XSS, un atacante puede robar tokens y suplantar al usuario. localStorage es accesible desde cualquier script en la página.
- **Recomendación:** Cookies HTTPOnly para sesión o, alternativamente, access token en memoria con vida corta y refresh en cookie HTTPOnly.
- **Mitigación a corto plazo:** CSP estricto y sanitización de todas las salidas HTML.

**Pruebas de verificación**

- **Caja negra (B):** Tras login, en DevTools → Application → Local Storage comprobar que existen `access_token` y `refresh_token`. Ejecutar en consola `localStorage.getItem('access_token')` y confirmar que el token es legible (demuestra exposición a XSS).
- **Caja blanca (W):** Buscar `localStorage`/`sessionStorage` en frontend; revisar que ningún token de sesión se persista en storage; comprobar que apiWrapper solo use storage para tokens (y documentar migración a cookies/memoria).

---

#### SEC-002: dangerouslySetInnerHTML con contenido de API/CMS (Frontend)

| Atributo | Detalle |
|----------|---------|
| **Metodología** | Caja blanca (W); caja negra (B) para inyectar payloads vía API/admin. |
| **Skill** | frontend-security-coder (Output Handling and XSS Prevention, Dynamic content sanitization). |
| **Regla** | REACT-XSS-001. |
| **Ubicación** | `revital_ecommerce/frontend/components/layout/shop/top-info-bar.tsx` L55; `app/(dashboard)/admin/info-bar/page.tsx` L196–197. |

- **Evidencia:** `dangerouslySetInnerHTML={{ __html: barData.des_mensaje }}` y `__html: formData.des_mensaje || '...'`. Contenido desde API o formulario admin.
- **Impacto:** XSS almacenado/reflejado: robo de tokens, redirección, suplantación.
- **Recomendación:** Sanitizar con DOMPurify antes de asignar a `__html`, con allowlist de etiquetas/atributos (p. ej. `['strong','em','a','br']`, `['href']`).

**Pruebas de verificación**

- **Caja negra (B):** Como admin, crear/editar barra informativa con mensaje `<script>alert(1)</script>` o `<img src=x onerror=alert(1)>`. Cargar la tienda y comprobar si se ejecuta script. Tras implementar sanitización, el payload debe mostrarse como texto o ser eliminado.
- **Caja blanca (W):** Buscar `dangerouslySetInnerHTML` y `__html` en el frontend; verificar que todo contenido dinámico pase por DOMPurify (o similar) con configuración restrictiva; no confiar solo en “contenido de admin”.

---

#### SEC-003: NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET expuesto en el cliente

| Atributo | Detalle |
|----------|---------|
| **Metodología** | Caja blanca (W); caja negra (B) inspeccionando bundle o variables en runtime. |
| **Skill** | frontend-security-coder (Third-Party Integration Security, Payment integration). |
| **Regla** | NEXT-SECRETS-001 / REACT-CONFIG-001. |
| **Ubicación** | `revital_ecommerce/frontend/services/wompi-widget.service.ts` (múltiples `process.env.NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET`). |

- **Evidencia:** Variable con prefijo `NEXT_PUBLIC_` incluida en el bundle del cliente y por tanto pública.
- **Impacto:** Si el “integrity secret” es solo para servidor, su exposición puede permitir falsificar o bypassear comprobaciones. Si Wompi lo considera público para el widget, el riesgo es menor pero debe documentarse.
- **Recomendación:** Confirmar con documentación de Wompi. Si es solo servidor: quitar `NEXT_PUBLIC_` y servir la config del widget desde un endpoint del backend. Si es público por diseño: documentar en el proyecto.

**Pruebas de verificación**

- **Caja negra (B):** En build de producción, buscar en el JS ofuscado cadenas que coincidan con el valor de `NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET` o inspeccionar `window`/objetos de config en runtime (si se exponen).
- **Caja blanca (W):** Revisar todas las `NEXT_PUBLIC_*`; ninguna debe ser un secreto server-side. Para Wompi, comprobar si la doc exige el integrity secret en cliente o solo en backend.

---

### Medios

#### SEC-004: TrustedHostMiddleware no configurado (Backend)

| Atributo | Detalle |
|----------|---------|
| **Metodología** | Caja blanca (W); caja negra (B) enviando requests con `Host` malicioso. |
| **Skill** | backend-security-coder (HTTP Security Headers, Secure API design). |
| **Regla** | FASTAPI-HOST-001. |
| **Ubicación** | `revital_ecommerce/backend/app/main.py`. No se registra `TrustedHostMiddleware`. |

- **Impacto:** Sin validación de `Host`, URLs generadas desde el request (reset password, emails, callbacks) podrían apuntar a dominios controlados por un atacante.
- **Recomendación:** En producción añadir `TrustedHostMiddleware(allowed_hosts=[...])`. Asegurar que emails y callbacks usen `settings.FRONTEND_URL` (o base configurada), no `request.base_url`.

**Pruebas de verificación**

- **Caja negra (B):** Enviar request a login o reset password con header `Host: evil.com` y comprobar si en la respuesta o el email aparece alguna URL con `evil.com`. Tras implementar TrustedHostMiddleware, el servidor debe rechazar o ignorar Host no permitido.
- **Caja blanca (W):** Buscar usos de `request.base_url`, `request.headers.get("host")`, `x-forwarded-host`; deben usarse solo tras validación o no usarse para URLs sensibles; URLs en emails deben venir de `settings`.

---

#### SEC-005: Algoritmo JWT en lista explícita (Backend)

| Atributo | Detalle |
|----------|---------|
| **Metodología** | Caja blanca (W). |
| **Skill** | backend-security-coder (Authentication and Authorization, JWT implementation). |
| **Regla** | FASTAPI-AUTH-004. |
| **Ubicación** | `revital_ecommerce/backend/app/core/jwt_utils.py`, L72: `jwt.decode(..., algorithms=[settings.ALGORITHM])`. |

- **Evidencia:** Se usa un único algoritmo. Buena práctica: lista explícita de algoritmos permitidos (evitar confusión con `alg=none` u otros).
- **Impacto:** Bajo si `ALGORITHM` está bien configurado; la lista explícita refuerza la postura ante configuraciones erróneas.
- **Recomendación:** Usar lista fija, p. ej. `algorithms=["HS256"]` si solo se usa HS256; no aceptar `"none"`.

**Pruebas de verificación**

- **Caja blanca (W):** Revisar todas las llamadas a `jwt.decode`; el parámetro `algorithms` debe ser una lista explícita y no incluir `"none"`. Revisar que `settings.ALGORITHM` no pueda ser inyectado o sobrescrito de forma insegura.

---

#### SEC-006: CSP con unsafe-inline / unsafe-eval en desarrollo (Backend)

| Atributo | Detalle |
|----------|---------|
| **Metodología** | Caja blanca (W); caja negra (B) revisando headers de respuesta. |
| **Skill** | backend-security-coder (HTTP Security Headers), frontend-security-coder (CSP). |
| **Regla** | FASTAPI-HEADERS-001 / REACT-CSP-001. |
| **Ubicación** | `revital_ecommerce/backend/app/middlewares/security_middleware.py`, L85–94. |

- **Evidencia:** En desarrollo se usan `'unsafe-inline'` y `'unsafe-eval'` en CSP para Swagger/docs.
- **Impacto:** Aceptable en desarrollo; en producción el frontend Next.js debe tener CSP propio sin relajar innecesariamente.
- **Recomendación:** Mantener backend como está; asegurar CSP en frontend en producción (headers o meta) sin `unsafe-inline`/`unsafe-eval` donde sea posible.

**Pruebas de verificación**

- **Caja negra (B):** En producción, inspeccionar headers de la API y del frontend; el frontend no debe depender de CSP de la API para su HTML; el frontend debe enviar su propio CSP.
- **Caja blanca (W):** Revisar que el CSP del backend en producción no incluya `unsafe-inline`/`unsafe-eval` para la API; revisar `next.config` o middleware del frontend para CSP en producción.

---

#### SEC-007: Rate limiting solo en registro (Backend)

| Atributo | Detalle |
|----------|---------|
| **Metodología** | Caja blanca (W); caja negra (B) realizando muchos intentos de login/reset. |
| **Skill** | backend-security-coder (API Security, Rate limiting). |
| **Regla** | FASTAPI-LIMITS-001. |
| **Ubicación** | `revital_ecommerce/backend/app/routers/user_router.py` tiene límite en registro; `auth_router` (login, refresh, reset, OTP) sin límites en la revisión. |

- **Impacto:** Login y reset password son objetivos de fuerza bruta y enumeración; sin rate limit aumenta el riesgo.
- **Recomendación:** Añadir rate limiting a login, refresh token, solicitud de reset de contraseña y verificación OTP (mismo `limiter` que en user_router).

**Pruebas de verificación**

- **Caja negra (B):** Enviar >20 requests/minuto a POST login o a endpoint de reset password; comprobar si se devuelve 429 o si se limita de otra forma. Tras implementar límites, repetir y verificar 429.
- **Caja blanca (W):** Revisar `auth_router` y endpoints de auth; cada uno debe tener `@limiter.limit(...)` o equivalente; documentar límites por endpoint.

---

### Bajos

#### SEC-008: Uso de datetime.utcnow() (Backend)

| Atributo | Detalle |
|----------|---------|
| **Metodología** | Caja blanca (W). |
| **Ubicación** | `revital_ecommerce/backend/app/core/jwt_utils.py`, create_verification_token y create_password_reset_token (L126, 151). |
| **Recomendación** | Sustituir por `datetime.now(timezone.utc)`. |

---

#### SEC-009: Logs con nivel INFO en desarrollo (Backend)

| Atributo | Detalle |
|----------|---------|
| **Metodología** | Caja blanca (W). |
| **Skill** | backend-security-coder (Logging and Monitoring, Log sanitization). |
| **Ubicación** | `revital_ecommerce/backend/app/main.py` L57; `auth_middleware.py` L146. |
| **Evidencia** | `logger.info(...)` con id_usuario y path. En producción el nivel es WARNING. |
| **Recomendación** | Evitar loguear identificadores de usuario en INFO; si es necesario, solo en desarrollo y no en sistemas compartidos. |

---

## 4. Resumen de controles bien implementados

- **Autenticación:** Bearer en header (no token en query); contraseñas con Argon2; JWT con exp y tipo de token.
- **CORS:** Allowlist de orígenes, sin `*` con credenciales.
- **Documentación:** `/docs`, `/redoc`, `/openapi.json` deshabilitados en producción.
- **Webhook Wompi:** Firma verificada con cuerpo raw; HMAC correcto.
- **Errores:** Respuestas 5xx genéricas en producción; excepciones de DB no expuestas.
- **Headers de seguridad:** X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP en middleware.
- **Límite de cuerpo:** 10 MB en SecurityMiddleware para POST/PUT/PATCH.
- **SQL:** Consultas con parámetros nombrados; sin concatenación de entrada de usuario en SQL.
- **Rate limiting:** Presente en registro; se recomienda extender a auth.

---

## 5. Checklist de pruebas sugeridas (Caja negra + Caja blanca)

### 5.1 Caja negra (Black box)

| # | Prueba | Cómo ejecutarla | Resultado esperado |
|---|--------|------------------|--------------------|
| B1 | Tokens en cliente | DevTools → Application → Local Storage tras login | Si hay access_token/refresh_token, considerar migrar a cookies/memoria. |
| B2 | XSS en barra informativa | Admin: crear mensaje con `<script>alert(1)</script>`; abrir tienda | Tras fix: no ejecución de script; contenido sanitizado o escapado. |
| B3 | Host malicioso | `curl -H "Host: evil.com" https://api.../api/auth/login` (y revisar respuestas/emails) | No generación de URLs con evil.com; con TrustedHostMiddleware, rechazo o respuesta controlada. |
| B4 | Rate limit en login | Muchos POST a /api/auth/login en poco tiempo | Con fix: 429 tras N intentos. |
| B5 | Docs en producción | GET /docs y /openapi.json con ENVIRONMENT=production | 404 o no expuesto. |
| B6 | CORS | Request desde origen no allowlist con credenciales | Request bloqueado por CORS. |
| B7 | Headers de seguridad | Inspeccionar respuestas de API y frontend | X-Frame-Options, X-Content-Type-Options, CSP (según corresponda). |

### 5.2 Caja blanca (White box)

| # | Prueba | Dónde mirar | Criterio |
|---|--------|-------------|----------|
| W1 | Almacenamiento de tokens | `apiWrapper.ts`, stores, hooks de auth | No localStorage/sessionStorage para access/refresh; preferir cookies HTTPOnly o memoria. |
| W2 | Sanitización antes de __html | Búsqueda de `dangerouslySetInnerHTML` y `__html` | Todo contenido dinámico sanitizado con DOMPurify (o similar) con allowlist. |
| W3 | Secretos en cliente | Búsqueda de `NEXT_PUBLIC_` | Ningún secreto server-side expuesto; Wompi integrity documentado o movido a backend. |
| W4 | Validación de Host | main.py, rutas que generan URLs (emails, redirects) | TrustedHostMiddleware en prod; uso de settings para base URL. |
| W5 | JWT algorithms | jwt_utils.py, `jwt.decode` | Lista explícita de algoritmos; sin `"none"`. |
| W6 | Rate limiting en auth | auth_router.py, user_router.py | Login, refresh, reset password, OTP con limiter. |
| W7 | Queries SQL | Servicios que usan `text()` o raw SQL | Solo parámetros nombrados; ninguna concatenación de entrada de usuario. |
| W8 | Logs sensibles | Cualquier `logger.info/debug` con datos de usuario | En prod no loguear tokens, IDs de usuario en claro en INFO; sanitización de logs. |

---

## 6. Próximos pasos sugeridos

1. **Prioridad alta:** Sanitizar con DOMPurify todo contenido asignado a `dangerouslySetInnerHTML` (top-info-bar e info-bar admin).  
2. **Prioridad alta:** Diseñar migración de tokens de localStorage a cookies HTTPOnly (o access en memoria + refresh en cookie) y actualizar apiWrapper y flujo de login/refresh.  
3. **Prioridad alta:** Aclarar con documentación de Wompi el rol de `WOMPI_INTEGRITY_SECRET`; si es solo servidor, mover config del widget al backend y quitar `NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET`.  
4. **Prioridad media:** Añadir TrustedHostMiddleware en producción y comprobar que todas las URLs generadas usen configuración (FRONTEND_URL, etc.).  
5. **Prioridad media:** Añadir rate limiting a login, refresh, reset password y verificación OTP.  
6. **Prioridad baja:** Reemplazar `datetime.utcnow()` por `datetime.now(timezone.utc)` y revisar logs que incluyan datos de usuario.

Si quieres, el siguiente paso puede ser implementar las correcciones de una en una (por ejemplo, primero sanitización HTML y luego diseño del cambio de tokens a cookies).
