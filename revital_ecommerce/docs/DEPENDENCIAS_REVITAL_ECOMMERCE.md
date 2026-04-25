# Dependencias de `revital_ecommerce`

Este documento resume las dependencias directas del proyecto y explica, de forma práctica, para qué sirve cada una y cómo aporta al e-commerce.

Fuentes:
- `revital_ecommerce/backend/requirements.txt`
- `revital_ecommerce/frontend/package.json` (`dependencies` y `devDependencies`)

## Alcance

- Incluye solo dependencias **directas** declaradas por el proyecto.
- No incluye dependencias transitivas.
- Se organiza por contexto: backend, frontend runtime y frontend desarrollo.

---

## 1) Backend (`requirements.txt`)

### API, framework y servidor

- `fastapi==0.135.1`: framework principal para construir la API REST. En Revital define routers, validación de entrada/salida y documentación OpenAPI.
- `starlette==0.49.1`: base ASGI sobre la que corre FastAPI. Aporta middleware, requests/responses y utilidades HTTP usadas indirectamente en toda la API.
- `uvicorn==0.34.2`: servidor ASGI para ejecutar FastAPI en desarrollo y producción. Es el proceso que sirve `app/main.py`.
- `fastapi-cli==0.0.7`: utilidades CLI oficiales de FastAPI. En Revital habilita comandos como `fastapi dev` para desarrollo local.
- `anyio==4.9.0`: capa de concurrencia async usada por FastAPI/Starlette. Soporta operaciones no bloqueantes en endpoints y servicios.
- `h11==0.16.0`: implementación HTTP/1.1 mínima. Se usa por la pila ASGI para manejar conexiones HTTP.
- `httptools==0.6.4`: parser HTTP de alto rendimiento. Mejora procesamiento de solicitudes en el servidor.
- `watchfiles==1.0.5`: observación de archivos para hot-reload. Permite recarga automática en desarrollo.
- `websockets==15.0.1`: soporte de websockets en la pila ASGI. Útil si se amplían flujos en tiempo real.

### Validación, configuración y tipos

- `pydantic==2.11.4`: validación y serialización de modelos. Es la base de los `schemas` de entrada/salida del backend.
- `pydantic_core==2.33.2`: motor interno de Pydantic. Acelera parseo/validación de payloads.
- `pydantic-settings==2.9.1`: lectura tipada de variables de entorno. En Revital centraliza configuración por instancia.
- `python-dotenv==1.1.0`: carga variables desde `.env*`. Facilita configuración local (`development/production`).
- `typing_extensions==4.13.2`: compatibilidad para features de tipado nuevas. Mejora anotaciones en código Python.
- `typing-inspection==0.4.2`: introspección de tipos. Utilizado por librerías de validación/configuración.
- `annotated-types==0.7.0`: soporte adicional para tipos anotados de Pydantic.

### Base de datos y ORM

- `SQLAlchemy==2.0.41`: ORM principal para persistencia. En Revital modela entidades y consultas de negocio.
- `sqlmodel==0.0.24`: capa declarativa sobre SQLAlchemy/Pydantic. Facilita modelos tipados y consistentes.
- `psycopg2-binary==2.9.10`: driver PostgreSQL para Python. Conecta la API con la BD dedicada de cada instancia.
- `greenlet==3.2.2`: soporte de concurrencia interna de SQLAlchemy.

### Seguridad y autenticación

- `PyJWT[crypto]==2.10.1`: creación/validación de JWT. Implementa autenticación por token y control de sesión.
- `cryptography==45.0.3`: primitives criptográficas para JWT y seguridad general.
- `argon2-cffi==23.1.0`: hash seguro de contraseñas con Argon2. Protege credenciales de usuarios.
- `argon2-cffi-bindings==21.2.0`: bindings nativos para Argon2.
- `pwdlib==0.2.1`: utilidades de password hashing/verificación. Complementa flujo de auth.
- `python-multipart==0.0.22`: manejo de formularios `multipart/form-data`. Útil en uploads y formularios complejos.
- `email_validator==2.2.0`: validación robusta de correos en schemas de usuario.
- `dnspython==2.7.0`: verificación DNS usada por validación de emails.
- `rsa==4.9.1`, `pyasn1==0.6.3`, `cffi==1.17.1`, `pycparser==2.22`: dependencias de soporte para capa criptográfica.

### HTTP cliente e integraciones externas

- `httpx==0.27.0`: cliente HTTP moderno async/sync. Sirve para integraciones con APIs externas.
- `httpcore==1.0.9`: núcleo de transporte de `httpx`.
- `requests==2.32.4`: cliente HTTP clásico sync. Puede usarse en flujos no async o legados.
- `urllib3==2.6.3`, `certifi==2025.4.26`, `idna==3.10`, `charset-normalizer==3.4.2`: soporte de red/SSL/encoding para clientes HTTP.
- `mercadopago==2.3.0`: SDK de pagos (y README menciona uso de Wompi por cliente). Cubre operaciones de cobro/transacción.
- `resend==2.10.0`: API para emails transaccionales. En Revital se usa para notificaciones y correos de flujo comercial.
- `groq==0.14.0`: cliente LLM para endpoints de asistente admin (`/api/admin/ai/*`).
- `cloudinary==1.44.1`: gestión de assets multimedia en nube (opcional en despliegues que lo requieran).

### Plantillas, CLI y observabilidad operativa

- `Jinja2==3.1.6` y `MarkupSafe==3.0.2`: motor de plantillas HTML para emails.
- `click==8.1.8`, `typer==0.15.4`, `shellingham==1.5.4`, `colorama==0.4.6`: utilidades CLI para comandos de desarrollo.
- `rich==14.0.0`, `rich-toolkit==0.14.6`, `Pygments==2.19.1`, `markdown-it-py==3.0.0`, `mdurl==0.1.2`: renderizado/estilo de salida de consola y docs.
- `PyYAML==6.0.2`: parsing de YAML cuando se requiere configuración/documentación.
- `sniffio==1.3.1`, `six==1.17.0`: utilidades de compatibilidad internas.
- `slowapi==0.1.9`: rate limiting en endpoints para protección básica ante abuso.

---

## 2) Frontend runtime (`dependencies`)

### Núcleo de aplicación y plataforma

- `next@^16.2.1`: framework principal del frontend (App Router). Define routing, rendering y estructura de la tienda/dashboard.
- `react@^19.2.4` y `react-dom@^19.2.4`: base de componentes y renderizado. Todo UI/estado del cliente corre sobre este stack.
- `typescript` está en dev, pero el tipado se usa en todo el runtime de la app para mayor seguridad.

### Data fetching, estado y API

- `@tanstack/react-query@^5.91.2`: cache y sincronización de estado servidor. En Revital centraliza llamadas al backend y revalidación.
- `@tanstack/react-query-devtools@^5.91.3`: inspección de queries durante desarrollo.
- `axios@^1.13.6`: cliente HTTP para servicios API (`services/*` y wrappers).
- `zustand@^5.0.12`: estado global ligero. Se usa en casos como carrito persistente.

### Formularios, validación e interacción

- `react-hook-form@^7.71.2`: manejo de formularios performante. Clave para flujos de login, registro y CRUD admin.
- `@hookform/resolvers@^5.2.2`: integra validación de esquemas (como Zod) con React Hook Form.
- `zod@^4.3.6`: validación tipada en frontend para inputs y contratos UI.
- `input-otp@^1.4.2`: componentes/input para códigos OTP.

### UI base y sistema de componentes

- `@radix-ui/react-accordion@^1.2.12`: acordeones accesibles para secciones colapsables.
- `@radix-ui/react-alert-dialog@^1.1.15`: diálogos de confirmación para acciones críticas.
- `@radix-ui/react-aspect-ratio@^1.1.8`: ratio fijo para imágenes/medios.
- `@radix-ui/react-checkbox@^1.3.3`: checkboxes accesibles en formularios/filtros.
- `@radix-ui/react-collapsible@^1.1.12`: contenedores expandibles.
- `@radix-ui/react-context-menu@^2.2.16`: menús contextuales.
- `@radix-ui/react-dialog@^1.1.15`: modales para formularios y acciones.
- `@radix-ui/react-hover-card@^1.1.15`: tarjetas informativas al hover.
- `@radix-ui/react-label@^2.1.8`: labels semánticos accesibles.
- `@radix-ui/react-menubar@^1.1.16`: barra/menú de acciones.
- `@radix-ui/react-navigation-menu@^1.2.14`: navegación compuesta.
- `@radix-ui/react-progress@^1.1.8`: barras de progreso.
- `@radix-ui/react-radio-group@^1.3.8`: radios accesibles.
- `@radix-ui/react-scroll-area@^1.2.10`: áreas con scroll custom.
- `@radix-ui/react-select@^2.2.6`: selects accesibles para filtros y forms.
- `@radix-ui/react-separator@^1.1.8`: separadores visuales.
- `@radix-ui/react-slider@^1.3.6`: sliders (ej. rangos de precio).
- `@radix-ui/react-slot@^1.2.4`: composición flexible de componentes.
- `@radix-ui/react-switch@^1.2.6`: toggles on/off.
- `@radix-ui/react-tabs@^1.1.13`: tabs para vistas admin/tienda.
- `@radix-ui/react-tooltip@^1.2.8`: tooltips accesibles.
- `radix-ui@^1.4.3`: paquete adicional del ecosistema Radix.
- `class-variance-authority@^0.7.1`, `clsx@^2.1.1`, `tailwind-merge@^3.5.0`: utilidades de composición de clases para diseño consistente.
- `lucide-react@^0.577.0` y `@tabler/icons-react@^3.40.0`: bibliotecas de iconos UI.
- `cmdk@^1.1.1`: comandos/búsqueda tipo command palette.
- `vaul@^1.1.2`: drawers/sheets para UX móvil.
- `sonner@^2.0.7`: notificaciones toast.
- `next-themes@^0.4.6`: gestión de dark/light mode.
- `react-aria-components@^1.16.0`: componentes accesibles avanzados basados en ARIA.
- `@heroui/image@^2.2.19`, `@heroui/system@^2.4.28`, `@heroui/theme@^2.4.26`: piezas del sistema HeroUI para componentes/teming.

### Tablas, fechas, CSV y utilidades de datos

- `@tanstack/react-table@^8.21.3`: tablas potentes para dashboard (sorting, filtros, paginación).
- `date-fns@^4.1.0`: formateo y cálculo de fechas.
- `react-day-picker@^9.14.0`: calendario/selección de fechas.
- `papaparse@^5.5.3` y `@types/papaparse@^5.5.2`: parseo CSV para import/export.
- `react-csv@^2.2.2`: exportación CSV desde la UI.
- `file-saver@^2.0.5`: descarga de archivos en navegador.
- `react-dropzone@^15.0.0`: drag&drop de archivos.

### Seguridad/sanitización y media

- `dompurify@^3.3.3`: saneado de HTML para evitar XSS al renderizar contenido dinámico.
- `facehash@^0.1.0`: hashing/perceptual helper para imágenes o comparaciones visuales ligeras.

### Animación y experiencia de usuario

- `framer-motion@^12.38.0` y `motion@^12.38.0`: animaciones e interacciones fluidas.
- `driver.js@^1.4.0`: tours guiados onboarding en interfaz.

### AI/UI de respuestas enriquecidas

- `ai@^6.0.116`: SDK para capacidades AI en frontend/backend JS.
- `streamdown@^2.5.0`: render de contenido markdown/streaming en UI.
- `@streamdown/cjk@^1.0.3`, `@streamdown/code@^1.1.1`, `@streamdown/math@^1.0.2`, `@streamdown/mermaid@^1.0.2`: plugins para render avanzado (CJK, código, fórmulas, diagramas).

### Misceláneos runtime

- `react-icons@^5.6.0`: iconografía adicional para casos específicos.
- `@tailwindcss/line-clamp@^0.4.4`: utilidades para truncar texto en tarjetas/listados.

---

## 3) Frontend desarrollo (`devDependencies`)

### Linting y calidad

- `eslint@^9.39.1`: análisis estático principal de JavaScript/TypeScript.
- `eslint-config-next@^16.0.10`: reglas recomendadas para proyectos Next.js.
- `@typescript-eslint/eslint-plugin@^8.48.1` y `@typescript-eslint/parser@^8.48.1`: reglas y parser TS para ESLint.
- `@eslint/eslintrc@^3.3.5`: compatibilidad/configuración avanzada de ESLint.

### TypeScript y tipos

- `typescript@^5`: compilador y chequeo de tipos del frontend.
- `@types/node@^20.19.9`, `@types/react@^19`, `@types/react-dom@^19`: tipos para entorno Node/React.
- `@types/file-saver@^2.0.7`, `@types/estree@^1.0.8`: definiciones de tipos auxiliares.

### Tailwind y pipeline CSS

- `tailwindcss@^4.2.2`: motor utility-first de estilos.
- `@tailwindcss/postcss@^4`: integración de Tailwind en cadena PostCSS.
- `tailwindcss-animate@^1.0.7` y `tw-animate-css@^1.4.0`: utilidades de animación CSS sobre Tailwind.

---

## 4) Resumen por categorías (visión rápida)

- **Core backend**: FastAPI + SQLAlchemy + PostgreSQL + JWT.
- **Core frontend**: Next.js + React + TypeScript + Tailwind.
- **Estado/datos frontend**: React Query + Axios + Zustand.
- **Formularios**: React Hook Form + Zod.
- **UI**: Radix + utilidades de clases + iconos + Sonner.
- **Integraciones**: pagos, email, IA admin (Groq), carga/gestión de media.

---

## 5) Notas de mantenimiento

1. Al actualizar dependencias críticas (`fastapi`, `next`, `react`, `SQLAlchemy`, `zod`), validar primero en rama separada.
2. Mantener sincronizadas versiones de `eslint` y paquetes `@typescript-eslint`.
3. Revisar breaking changes en saltos mayores (`next`, `react`, `typescript`, `tailwindcss`).
4. Si se agrega una integración (pagos, email, AI, storage), documentar su paquete aquí con propósito y área de uso.
5. Ejecutar checks mínimos tras cambios:
   - Backend: arranque de API + ruta de health/docs
   - Frontend: `pnpm lint` + build local + pruebas de flujos críticos (auth, catálogo, carrito, admin)

