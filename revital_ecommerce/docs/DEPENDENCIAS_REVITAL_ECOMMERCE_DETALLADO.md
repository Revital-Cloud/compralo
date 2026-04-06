# Dependencias de `revital_ecommerce` (versión detallada)

Este documento amplía `DEPENDENCIAS_REVITAL_ECOMMERCE.md` con un análisis más específico del **uso real en el código**.

Fuentes:
- Backend: `revital_ecommerce/backend/requirements.txt`
- Frontend: `revital_ecommerce/frontend/package.json` (`dependencies` y `devDependencies`)

Notas importantes:
- Este documento describe **dependencias directas** declaradas por el proyecto.
- Si una librería **no aparece importada** en el código, se marca como **“uso directo no detectado”**. En esos casos puede ser:
  - una dependencia **transitiva** (necesaria aunque no la importes),
  - un paquete **planeado** para features futuras,
  - o una dependencia **candidata a eliminar**.
- “Uso en tu proyecto” referencia rutas de archivos reales (cuando aplica).

---

## 1) Backend (`requirements.txt`)

### 1.1 API, framework y servidor

#### `fastapi==0.135.1`
- **Qué es**: framework Python para construir APIs (ASGI) con tipado, validación y OpenAPI.
- **Para qué sirve**: declarar routers/endpoints, dependencias y validación automática de request/response.
- **Problema que resuelve**: reduce boilerplate al exponer API REST consistente y documentada.
- **Uso en tu proyecto**:
  - Inicialización del servidor y middlewares/routers en `revital_ecommerce/backend/app/main.py`.
  - Se usa también en utilidades core (ej. manejo de errores, JWT, rate limiting).

#### `starlette==0.49.1`
- **Qué es**: toolkit ASGI (HTTP, middleware, responses) sobre el que FastAPI está construido.
- **Para qué sirve**: proveer middlewares y tipos base (requests/responses/excepciones).
- **Problema que resuelve**: infraestructura HTTP/ASGI robusta y compatible.
- **Uso en tu proyecto**:
  - Middlewares como `GZipMiddleware`, `TrustedHostMiddleware` en `revital_ecommerce/backend/app/main.py`.
  - Excepciones Starlette para sanitización de errores en `revital_ecommerce/backend/app/main.py`.

#### `uvicorn==0.34.2`
- **Qué es**: servidor ASGI.
- **Para qué sirve**: ejecutar la app FastAPI (dev/prod).
- **Problema que resuelve**: proceso HTTP/ASGI de alto rendimiento para servir tu API.
- **Uso en tu proyecto**:
  - No se importa en el código; se usa para **arranque** (documentado) en `revital_ecommerce/backend/README.md`.

#### `fastapi-cli==0.0.7`
- **Qué es**: CLI oficial de FastAPI.
- **Para qué sirve**: comandos de desarrollo (por ejemplo `fastapi dev`).
- **Problema que resuelve**: simplifica el “run” en desarrollo con auto-reload y convenciones.
- **Uso en tu proyecto**:
  - No suele importarse en código; se usa desde consola (ver guías/README del backend).
  - **Nota**: aunque no se importe, es válido mantenerlo si tu workflow usa `fastapi dev`.

#### `anyio==4.9.0`
- **Qué es**: capa de concurrencia async (abstracción sobre asyncio/trio).
- **Para qué sirve**: permite que Starlette/FastAPI soporten async de manera portable.
- **Problema que resuelve**: primitivas async consistentes para la pila ASGI.
- **Uso en tu proyecto**: **uso directo no detectado** (normal: suele ser transitive de FastAPI/Starlette).

#### `h11==0.16.0`
- **Qué es**: implementación HTTP/1.1 en Python.
- **Para qué sirve**: manejo de conexiones HTTP dentro del stack ASGI (servidor).
- **Problema que resuelve**: parsing/protocolo HTTP.
- **Uso en tu proyecto**: **uso directo no detectado** (típicamente transitive).

#### `httptools==0.6.4`
- **Qué es**: parser HTTP de alto rendimiento (bindings).
- **Para qué sirve**: acelerar parsing de requests en servidores ASGI.
- **Problema que resuelve**: performance de IO en requests.
- **Uso en tu proyecto**: **uso directo no detectado** (típicamente transitive de `uvicorn`).

#### `watchfiles==1.0.5`
- **Qué es**: watcher de archivos.
- **Para qué sirve**: hot reload en desarrollo.
- **Problema que resuelve**: recarga automática al cambiar código.
- **Uso en tu proyecto**: **uso directo no detectado** (típicamente transitive del modo reload).

#### `websockets==15.0.1`
- **Qué es**: soporte WebSocket para Python/ASGI.
- **Para qué sirve**: habilitar endpoints WS cuando el servidor lo necesita.
- **Problema que resuelve**: comunicación bidireccional en tiempo real.
- **Uso en tu proyecto**: **uso directo no detectado** (se mantiene si planeas tiempo real o por transitive del stack).

---

### 1.2 Validación, configuración y tipos

#### `pydantic==2.11.4`
- **Qué es**: librería de validación/serialización basada en type hints.
- **Para qué sirve**: definir schemas de entrada/salida (DTOs) y garantizar contratos.
- **Problema que resuelve**: evita payloads inválidos y centraliza validación.
- **Uso en tu proyecto**:
  - Schemas en `revital_ecommerce/backend/app/schemas/*` (ej. `auth_schema.py`, `order_schema.py`, etc.).
  - Routers consumen estos schemas (ej. `revital_ecommerce/backend/app/routers/*`).

#### `pydantic_core==2.33.2`
- **Qué es**: motor interno (alto rendimiento) de Pydantic v2.
- **Para qué sirve**: acelerar parse/validate.
- **Problema que resuelve**: performance de validación.
- **Uso en tu proyecto**: **uso directo no detectado** (normal: motor interno).

#### `pydantic-settings==2.9.1`
- **Qué es**: extensión de Pydantic para settings/env vars tipadas.
- **Para qué sirve**: centralizar config (`DATABASE_URL`, secrets, URLs, etc.).
- **Problema que resuelve**: configuración confiable por entorno/instancia.
- **Uso en tu proyecto**:
  - `revital_ecommerce/backend/app/core/config.py` (settings, `is_production()`).

#### `python-dotenv==1.1.0`
- **Qué es**: loader de archivos `.env`.
- **Para qué sirve**: facilitar desarrollo local sin depender de variables del sistema.
- **Problema que resuelve**: ergonomía de configuración.
- **Uso en tu proyecto**:
  - Scripts en `revital_ecommerce/backend/scripts/*` (p.ej. mantenimiento).

#### `typing_extensions==4.13.2`, `typing-inspection==0.4.2`, `annotated-types==0.7.0`
- **Qué son**: librerías de soporte a tipado/inspección requeridas por Pydantic y tooling moderno.
- **Para qué sirven**: compatibilidad y performance del sistema de tipos.
- **Problema que resuelven**: enable de features y compatibilidad inter-versiones.
- **Uso en tu proyecto**: **uso directo no detectado** (normal: transitivo).

---

### 1.3 Base de datos y ORM

#### `SQLAlchemy==2.0.41`
- **Qué es**: ORM/Toolkit SQL.
- **Para qué sirve**: sesiones, transacciones, consultas, mapeos.
- **Problema que resuelve**: acceso a BD mantenible sin SQL “pegado” por toda la app.
- **Uso en tu proyecto**:
  - Base de BD y sesiones en `revital_ecommerce/backend/app/core/database.py`.
  - Uso extendido en servicios (`revital_ecommerce/backend/app/services/*`) y en middlewares/deps.

#### `sqlmodel==0.0.24`
- **Qué es**: ORM “thin layer” sobre SQLAlchemy + Pydantic.
- **Para qué sirve**: modelos tipados que encajan con Pydantic.
- **Problema que resuelve**: reduce boilerplate de modelos/DTO.
- **Uso en tu proyecto**: **uso directo no detectado** en `revital_ecommerce/backend/app/*`.
  - **Recomendación**: si no lo usas, es candidato a eliminar o a adoptar de forma consistente (evitar mezcla innecesaria).

#### `psycopg2-binary==2.9.10`
- **Qué es**: driver PostgreSQL.
- **Para qué sirve**: conexión real al motor Postgres.
- **Problema que resuelve**: ejecutar queries y transacciones en Postgres.
- **Uso en tu proyecto**:
  - Uso directo en algunos servicios, por ejemplo:
    - `revital_ecommerce/backend/app/services/product_service.py`
    - `revital_ecommerce/backend/app/services/cart_product_service.py`

#### `greenlet==3.2.2`
- **Qué es**: soporte interno de concurrencia (necesario para ciertas operaciones de SQLAlchemy).
- **Para qué sirve**: facilita patterns internos del ORM.
- **Problema que resuelve**: compatibilidad/performance del stack ORM.
- **Uso en tu proyecto**: **uso directo no detectado** (normal: transitive).

---

### 1.4 Seguridad y autenticación

#### `PyJWT[crypto]==2.10.1`
- **Qué es**: librería JWT para codificar/decodificar tokens.
- **Para qué sirve**: crear access/refresh tokens, validar expiración y claims.
- **Problema que resuelve**: autenticación stateless y control de sesión.
- **Uso en tu proyecto**:
  - `revital_ecommerce/backend/app/core/jwt_utils.py` (crear/verificar tokens).

#### `cryptography==45.0.3`
- **Qué es**: primitives criptográficas (firmas, hashing, etc.).
- **Para qué sirve**: soporte crypto para JWT y otras integraciones seguras.
- **Problema que resuelve**: base criptográfica confiable.
- **Uso en tu proyecto**: **uso directo no detectado** (habitual: dependencia del ecosistema JWT/seguridad).

#### `pwdlib==0.2.1`
- **Qué es**: utilidades para hash/verificación de passwords.
- **Para qué sirve**: implementar hashing moderno (Argon2 recomendado).
- **Problema que resuelve**: almacenamiento seguro de contraseñas.
- **Uso en tu proyecto**:
  - `revital_ecommerce/backend/app/core/jwt_utils.py` (`PasswordHash.recommended()` y verify/hash).

#### `argon2-cffi==23.1.0` + `argon2-cffi-bindings==21.2.0`
- **Qué es**: implementación de Argon2 (con bindings nativos).
- **Para qué sirve**: hashing fuerte de contraseñas.
- **Problema que resuelve**: resistencia a cracking y ataques offline.
- **Uso en tu proyecto**: **uso directo no detectado** (probable: usado indirectamente por `pwdlib`).

#### `python-multipart==0.0.22`
- **Qué es**: parser `multipart/form-data`.
- **Para qué sirve**: soportar uploads/form-data en endpoints.
- **Problema que resuelve**: manejo de archivos/formularios complejos en FastAPI.
- **Uso en tu proyecto**: **uso directo no detectado** en `app/*` (puede activarse si agregas endpoints con `UploadFile`).

#### `email_validator==2.2.0` + `dnspython==2.7.0`
- **Qué es**: validación robusta de emails (incluye checks que pueden requerir DNS).
- **Para qué sirve**: validar correos con reglas más completas que regex.
- **Problema que resuelve**: evitar emails inválidos desde el origen.
- **Uso en tu proyecto**: **uso directo no detectado** (puede estar integrado desde Pydantic `EmailStr`/validators si los usas en schemas).

#### `rsa==4.9.1`, `pyasn1==0.6.3`, `cffi==1.17.1`, `pycparser==2.22`
- **Qué son**: dependencias de bajo nivel para crypto/bindings.
- **Uso en tu proyecto**: **uso directo no detectado** (transitivas).

---

### 1.5 HTTP cliente e integraciones externas

#### `httpx==0.27.0`
- **Qué es**: cliente HTTP moderno con soporte async.
- **Para qué sirve**: integraciones externas (pagos, captcha, etc.) sin bloquear.
- **Problema que resuelve**: IO externo eficiente y manejable.
- **Uso en tu proyecto**:
  - Turnstile en `revital_ecommerce/backend/app/core/turnstile.py`.
  - Wompi en `revital_ecommerce/backend/app/services/wompi_service.py`.

#### `httpcore==1.0.9`
- **Qué es**: capa de transporte usada por `httpx`.
- **Uso en tu proyecto**: **uso directo no detectado** (transitive).

#### `requests==2.32.4` + (`urllib3`, `certifi`, `idna`, `charset-normalizer`)
- **Qué es**: cliente HTTP sync (requests) + dependencias de red/SSL/encoding.
- **Para qué sirve**: integraciones HTTP en modo sync o legadas.
- **Problema que resuelve**: llamadas HTTP simples.
- **Uso en tu proyecto**: **uso directo no detectado** en `app/*` (candidato a eliminar si no hay scripts/servicios sync que lo usen).

#### `resend==2.10.0`
- **Qué es**: SDK para enviar emails via Resend.
- **Para qué sirve**: emails transaccionales (verificación, pedidos, notificaciones).
- **Problema que resuelve**: envío confiable de email con API moderna.
- **Uso en tu proyecto**:
  - `revital_ecommerce/backend/app/services/email_service.py` (envío real).

#### `groq==0.14.0`
- **Qué es**: SDK para consumir modelos LLM desde Groq.
- **Para qué sirve**: endpoints de asistente admin y features IA.
- **Problema que resuelve**: integrar IA sin construir infraestructura LLM propia.
- **Uso en tu proyecto**:
  - `revital_ecommerce/backend/app/services/groq_service.py` (cliente/llamadas).

#### `cloudinary==1.44.1`
- **Qué es**: SDK de Cloudinary.
- **Para qué sirve**: upload y gestión de imágenes en nube.
- **Problema que resuelve**: storage/transformaciones de media offload del servidor.
- **Uso en tu proyecto**:
  - `revital_ecommerce/backend/app/services/cloudinary_service.py` (config + upload/destroy/resource).
  - Orquestación desde productos:
    - `revital_ecommerce/backend/app/services/product_service.py`
    - `revital_ecommerce/backend/app/routers/product_router.py`

#### `mercadopago==2.3.0`
- **Qué es**: SDK de Mercado Pago.
- **Para qué sirve**: integración de pagos alternativa.
- **Problema que resuelve**: cobros/transacciones en ecosistema Mercado Pago.
- **Uso en tu proyecto**: **uso directo no detectado** en `revital_ecommerce/backend/app/*`.
  - En documentación se menciona como “posible futuro” (`app/Docs/DOCUMENTATION.md`).
  - **Candidato a eliminar** si no está en roadmap inmediato.

---

### 1.6 Plantillas, CLI y observabilidad operativa

#### `Jinja2==3.1.6` + `MarkupSafe==3.0.2`
- **Qué es**: motor de plantillas HTML + safe escaping.
- **Para qué sirve**: render de templates para emails.
- **Problema que resuelve**: separar HTML de lógica Python y prevenir inyección.
- **Uso en tu proyecto**:
  - `revital_ecommerce/backend/app/services/email_templates.py`.

#### `click==8.1.8`, `typer==0.15.4`, `shellingham==1.5.4`, `colorama==0.4.6`
- **Qué es**: tooling CLI (Typer usa Click).
- **Para qué sirve**: comandos/CLI de herramientas internas o dependencias.
- **Uso en tu proyecto**: **uso directo no detectado** (a menudo transitivo del tooling/CLI).

#### `rich==14.0.0`, `rich-toolkit==0.14.6`, `Pygments==2.19.1`, `markdown-it-py==3.0.0`, `mdurl==0.1.2`
- **Qué es**: render “bonito” de consola (tables, colores, markdown).
- **Para qué sirve**: mejorar UX de CLI/herramientas.
- **Uso en tu proyecto**: **uso directo no detectado** (transitive; si no usas CLI, puede sobrar).

#### `PyYAML==6.0.2`
- **Qué es**: parsing YAML.
- **Uso en tu proyecto**: **uso directo no detectado**.

#### `sniffio==1.3.1`, `six==1.17.0`
- **Qué es**: utilidades de compatibilidad/async detection.
- **Uso en tu proyecto**: **uso directo no detectado** (transitivas).

#### `slowapi==0.1.9`
- **Qué es**: rate limiting para Starlette/FastAPI.
- **Para qué sirve**: limitar requests por IP/route.
- **Problema que resuelve**: mitigación básica de abuso/bruteforce.
- **Uso en tu proyecto**:
  - `revital_ecommerce/backend/app/core/rate_limiter.py`
  - `revital_ecommerce/backend/app/main.py` (handler 429 + app.state.limiter + decorator `@limiter.limit`).

---

## 2) Frontend runtime (`dependencies`)

### 2.1 Núcleo de aplicación y plataforma

#### `next@^16.2.1`
- **Qué es**: framework React (App Router) para SSR/CSR, routing y build.
- **Para qué sirve**: estructura de rutas `app/*`, layouts, server/client components.
- **Problema que resuelve**: aplicación completa (tienda + dashboard) con performance y DX.
- **Uso en tu proyecto**:
  - Toda la app vive en `revital_ecommerce/frontend/app/*` y componentes `components/*`.

#### `react@^19.2.4`
- **Qué es**: librería base de UI por componentes.
- **Para qué sirve**: estado, hooks, composición UI.
- **Uso en tu proyecto**: omnipresente (componentes, páginas, hooks).

#### `react-dom@^19.2.4`
- **Qué es**: renderer React para DOM.
- **Para qué sirve**: render en browser/SSR.
- **Uso en tu proyecto**:
  - Normalmente no se importa en App Router; se usa implícitamente por Next.

---

### 2.2 Data fetching, estado y API

#### `@tanstack/react-query@^5.91.2`
- **Qué es**: capa de cache/revalidación y estado servidor.
- **Problema que resuelve**: fetch + caching + retry + invalidation sin boilerplate.
- **Uso en tu proyecto**:
  - En páginas admin y shop se usa para queries/mutations (ej. `app/(dashboard)/admin/*`).
  - Provider global: `revital_ecommerce/frontend/providers/query-provider.tsx`.

#### `@tanstack/react-query-devtools@^5.91.3`
- **Qué es**: UI de inspección de queries.
- **Uso en tu proyecto**:
  - Montado en `revital_ecommerce/frontend/providers/query-provider.tsx` solo en dev.

#### `axios@^1.13.6`
- **Qué es**: cliente HTTP con interceptores.
- **Problema que resuelve**: centralización de auth headers + refresh flow + timeouts.
- **Uso en tu proyecto**:
  - Wrapper central: `revital_ecommerce/frontend/utils/apiWrapper.ts`.
  - Servicios consumen el wrapper desde `revital_ecommerce/frontend/services/*`.

#### `zustand@^5.0.12`
- **Qué es**: estado global ligero con API simple.
- **Problema que resuelve**: evitar prop drilling y stores complejos.
- **Uso en tu proyecto**:
  - Carrito persistente: `revital_ecommerce/frontend/stores/cart-store.ts`.

---

### 2.3 Formularios, validación e interacción

#### `react-hook-form@^7.71.2`
- **Qué es**: librería de forms performante (sin re-render por cada input).
- **Problema que resuelve**: formularios complejos con validación y errores controlados.
- **Uso en tu proyecto**:
  - Auth forms (`components/forms/*`) y CRUD admin (`app/(dashboard)/admin/*`).
  - Ejemplo claro: `revital_ecommerce/frontend/components/forms/login-form.tsx`.

#### `@hookform/resolvers@^5.2.2`
- **Qué es**: adaptadores de validación (Zod/Yup/etc.) para React Hook Form.
- **Uso en tu proyecto**:
  - `zodResolver` en formularios (ej. `components/forms/login-form.tsx`).

#### `zod@^4.3.6`
- **Qué es**: validación declarativa con inferencia de tipos TS.
- **Problema que resuelve**: contratos de inputs estrictos y reutilizables.
- **Uso en tu proyecto**:
  - Schemas en forms (login, registro, settings) y validaciones en páginas.

#### `input-otp@^1.4.2`
- **Qué es**: componentes para OTP (código de verificación).
- **Uso en tu proyecto**:
  - `components/forms/verify-email-form.tsx`
  - `components/ui/input-otp.tsx`

---

### 2.4 UI base y sistema de componentes

#### Familia `@radix-ui/react-*` (accordion, dialog, select, etc.)
- **Qué es**: primitives accesibles para componentes UI.
- **Problema que resuelve**: accesibilidad (focus, teclado, ARIA) + comportamientos complejos ya resueltos.
- **Uso en tu proyecto**:
  - Wrappers en `revital_ecommerce/frontend/components/ui/*` (ej. `accordion.tsx`, `alert-dialog.tsx`, `select.tsx`).
  - **Nota**: algunas entradas de `package.json` pueden estar declaradas aunque hoy no haya wrapper/import (si no se usan, son candidatas a eliminar).

#### `radix-ui@^1.4.3`
- **Qué es**: paquete del ecosistema Radix (agrega utilidades y/o composición).
- **Uso en tu proyecto**:
  - Se usa en varios wrappers `components/ui/*` (por ejemplo avatar/badge/dialog/form).

#### `class-variance-authority@^0.7.1`
- **Qué es**: utilitario para definir variantes tipadas de componentes (cva).
- **Problema que resuelve**: estilos consistentes en componentes UI reutilizables.
- **Uso en tu proyecto**:
  - Variantes en `revital_ecommerce/frontend/components/ui/*` (ej. `button`, `badge`, `alert`).

#### `clsx@^2.1.1`
- **Qué es**: merge condicional de strings/clases.
- **Uso en tu proyecto**:
  - Helpers `revital_ecommerce/frontend/components/ui/utils.ts` y `revital_ecommerce/frontend/lib/utils.ts`.

#### `tailwind-merge@^3.5.0`
- **Qué es**: merge inteligente de clases Tailwind (resuelve conflictos).
- **Uso en tu proyecto**:
  - `revital_ecommerce/frontend/components/ui/utils.ts` y `revital_ecommerce/frontend/lib/utils.ts`.

#### `lucide-react@^0.577.0`, `@tabler/icons-react@^3.40.0`
- **Qué es**: librerías de iconos React.
- **Problema que resuelve**: iconografía consistente y rápida.
- **Uso en tu proyecto**:
  - `lucide-react` se usa masivamente en páginas/components (auth/admin).
  - `@tabler/icons-react` se usa especialmente en dashboard admin (íconos de acciones/menús).

#### `cmdk@^1.1.1`
- **Qué es**: command palette UI (búsqueda/comandos).
- **Uso en tu proyecto**:
  - `revital_ecommerce/frontend/components/ui/command.tsx`.

#### `vaul@^1.1.2`
- **Qué es**: drawers/sheets (UX móvil) sobre primitives.
- **Uso en tu proyecto**:
  - `revital_ecommerce/frontend/components/ui/drawer.tsx`.

#### `sonner@^2.0.7`
- **Qué es**: sistema de toasts.
- **Uso en tu proyecto**:
  - Global: `revital_ecommerce/frontend/providers/query-provider.tsx` (errores).
  - Local: forms y admin pages (ej. `components/forms/login-form.tsx`).

#### `next-themes@^0.4.6`
- **Qué es**: gestión dark/light mode en Next.
- **Uso en tu proyecto**:
  - Componentes de layout shop (ej. header/nav/categories) en `components/layout/shop/*`.

#### `react-aria-components@^1.16.0`
- **Qué es**: componentes accesibles (ARIA-first) para UI avanzada.
- **Uso en tu proyecto**:
  - Color picker admin en `revital_ecommerce/frontend/components/admin/color-picker.tsx` y subcomponentes.

#### `@heroui/image`, `@heroui/system`, `@heroui/theme`
- **Qué es**: piezas del sistema HeroUI (UI + theming).
- **Uso en tu proyecto**: **uso directo no detectado** en el código actual.
  - **Recomendación**: si tu UI principal es Radix/shadcn-style, considera eliminar HeroUI para reducir superficie.

---

### 2.5 Tablas, fechas, CSV y utilidades de datos

#### `@tanstack/react-table@^8.21.3`
- **Qué es**: motor headless de tablas.
- **Problema que resuelve**: sorting, filtros, paginación, columnas dinámicas sin UI acoplada.
- **Uso en tu proyecto**:
  - Dashboard admin (ej. páginas de categorías, órdenes, etc.) en `app/(dashboard)/admin/*`.

#### `date-fns@^4.1.0`
- **Qué es**: utilidades de fechas.
- **Uso en tu proyecto**:
  - `components/admin/orders/order-filters.tsx`
  - `utils/date-helpers.ts`

#### `react-day-picker@^9.14.0`
- **Qué es**: calendario/datepicker.
- **Uso en tu proyecto**:
  - `revital_ecommerce/frontend/components/ui/calendar.tsx`.

#### `papaparse@^5.5.3`, `react-csv@^2.2.2`, `file-saver@^2.0.5`, `@types/papaparse@^5.5.2`
- **Qué son**: parse/export CSV y descarga de archivos.
- **Uso en tu proyecto**: **uso directo no detectado** en el código actual.
  - **Recomendación**: si no estás importando/exportando CSV hoy, son candidatas a eliminar.

#### `react-dropzone@^15.0.0`
- **Qué es**: drag&drop de archivos.
- **Uso en tu proyecto**:
  - Upload de imágenes en admin:
    - `components/admin/products/product-image-upload.tsx`
    - `components/admin/products/unified-product-images-panel.tsx`
    - `components/admin/products/variant-image-upload.tsx`

---

### 2.6 Seguridad/sanitización y media

#### `dompurify@^3.3.3`
- **Qué es**: sanitizador HTML.
- **Problema que resuelve**: XSS cuando renderizas HTML/markdown no totalmente confiable.
- **Uso en tu proyecto**:
  - `revital_ecommerce/frontend/utils/sanitize.ts`.

#### `facehash@^0.1.0`
- **Qué es**: helper para hash/identidad basada en cara/imagen (según implementación).
- **Uso en tu proyecto**:
  - Avatar UI:
    - `revital_ecommerce/frontend/components/ui/avatar-selector.tsx`
    - `revital_ecommerce/frontend/components/ui/user-avatar.tsx`

---

### 2.7 Animación y experiencia de usuario

#### `framer-motion@^12.38.0`
- **Qué es**: animaciones declarativas React.
- **Problema que resuelve**: transiciones fluidas sin CSS manual complejo.
- **Uso en tu proyecto**:
  - Componentes de layout/marketing shop (ej. `components/layout/shop/featured-categories/featured-categories.tsx`).

#### `motion@^12.38.0`
- **Qué es**: paquete relacionado al ecosistema de motion.
- **Uso en tu proyecto**: **uso directo no detectado** (posible redundancia con `framer-motion`).
  - **Recomendación**: mantener solo uno si no hay razón clara.

#### `driver.js@^1.4.0`
- **Qué es**: tours guiados en UI.
- **Uso en tu proyecto**:
  - `revital_ecommerce/frontend/app/(dashboard)/admin/_tour/useAdminDriverTour.tsx`.

---

### 2.8 AI/UI de respuestas enriquecidas

#### `streamdown@^2.5.0`
- **Qué es**: render de contenido markdown/streaming para UI.
- **Problema que resuelve**: UI de chat/paneles que renderizan contenido enriquecido.
- **Uso en tu proyecto**:
  - Panel AI admin: `revital_ecommerce/frontend/components/admin/ai-chat-panel.tsx`.

#### `ai@^6.0.116`
- **Qué es**: SDK para capacidades AI (Vercel AI SDK u orientado a toolchains similares).
- **Uso en tu proyecto**: **uso directo no detectado** en el código actual del frontend.
  - **Nota**: si tu IA está del lado backend (Groq), este paquete puede sobrar.

#### `@streamdown/cjk`, `@streamdown/code`, `@streamdown/math`, `@streamdown/mermaid`
- **Qué es**: plugins para render avanzado de streamdown (CJK, code, math, diagramas).
- **Uso en tu proyecto**: **uso directo no detectado** hoy.
  - Si no renderizas mermaid/math/cjk, son candidatas a eliminar.

---

### 2.9 Misceláneos runtime

#### `react-icons@^5.6.0`
- **Qué es**: pack de iconos múltiples (muchas familias).
- **Uso en tu proyecto**: **uso directo no detectado** (posible redundancia con lucide/tabler).

#### `@tailwindcss/line-clamp@^0.4.4`
- **Qué es**: plugin/utilidades para truncar texto (line clamp).
- **Uso en tu proyecto**: **uso directo no detectado** (en Tailwind v4 puede no ser necesario según config).

---

## 3) Frontend desarrollo (`devDependencies`)

### 3.1 Linting y calidad

#### `eslint@^9.39.1`
- **Qué es**: linter JS/TS.
- **Para qué sirve**: detectar bugs, code smells y mantener consistencia.
- **Uso en tu proyecto**:
  - Config en `revital_ecommerce/frontend/eslint.config.mjs`.

#### `eslint-config-next@^16.0.10`
- **Qué es**: reglas recomendadas para Next.js.
- **Uso en tu proyecto**:
  - Usado por el tooling de Next; además importas el plugin de Next en `eslint.config.mjs`.

#### `@typescript-eslint/eslint-plugin@^8.48.1`, `@typescript-eslint/parser@^8.48.1`
- **Qué es**: reglas y parser TS para ESLint.
- **Uso en tu proyecto**:
  - Integrado mediante config “flat” en `eslint.config.mjs`.

#### `@eslint/eslintrc@^3.3.5`
- **Qué es**: compatibilidad/config avanzada para ESLint.
- **Uso en tu proyecto**:
  - Indirecto por tooling; no necesariamente se importa.

**Nota técnica (importante)**:
- En `eslint.config.mjs` importas `@eslint/js` y `typescript-eslint`.
  - Si esos paquetes no están declarados explícitamente, depender de transitivas es frágil.

---

### 3.2 TypeScript y tipos

#### `typescript@^5`
- **Qué es**: compilador y typechecker.
- **Uso en tu proyecto**:
  - Config: `revital_ecommerce/frontend/tsconfig.json`.
  - Tipado a lo largo de `app/`, `components/`, `services/`, `types/`.

#### `@types/node`, `@types/react`, `@types/react-dom`
- **Qué es**: definiciones de tipos para Node/React.
- **Uso en tu proyecto**:
  - Tipado global y tooling de TS.

#### `@types/file-saver`, `@types/estree`
- **Qué es**: tipos auxiliares.
- **Uso en tu proyecto**:
  - **Uso directo no detectado** (probablemente sobran si no usas `file-saver` o tooling AST).

---

### 3.3 Tailwind y pipeline CSS

#### `tailwindcss@^4.2.2`
- **Qué es**: engine Tailwind.
- **Uso en tu proyecto**:
  - Config en `revital_ecommerce/frontend/tailwind.config.ts`.

#### `@tailwindcss/postcss@^4`
- **Qué es**: plugin para integrar Tailwind en PostCSS.
- **Uso en tu proyecto**:
  - Declarado en `revital_ecommerce/frontend/postcss.config.mjs` como plugin.

#### `tailwindcss-animate@^1.0.7`, `tw-animate-css@^1.4.0`
- **Qué es**: utilidades de animación.
- **Uso en tu proyecto**: **uso directo no detectado** (si no tienes clases/uso real, es candidato a eliminar).

---

## 4) Observaciones y recomendaciones rápidas (desde el uso real)

1. **Script roto en frontend**: en `package.json` existe `"verify-api": "node scripts/verify-api-connection.js"` pero no existe `scripts/verify-api-connection.js`.
2. **Librerías declaradas sin uso directo** (candidatas a limpieza): HeroUI (`@heroui/*`), `ai`, `motion`, plugins de `@streamdown/*`, CSV stack (`papaparse`, `react-csv`, `file-saver`) y `react-icons`.
3. **Backend**: `mercadopago` no aparece usado en `app/*` (solo en docs). Mantenerlo solo si está en roadmap.
4. **SQLModel**: está declarado pero no se ve uso directo; decide si adoptarlo o eliminarlo para evitar mezcla innecesaria.

