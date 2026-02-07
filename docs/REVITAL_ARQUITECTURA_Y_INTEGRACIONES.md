## 1) Arquitectura, metodología, modelo y estructura

- Arquitectura en capas: `Routers → Services → DB`. Los `routers` validan y enrutan, los `services` orquestan lógica de negocio, y el acceso a datos se realiza con SQLAlchemy y funciones almacenadas en PostgreSQL para operaciones críticas (órdenes, descuentos, carrito).
- Backend: FastAPI (`backend/app`). Núcleos en `core/` (`config`, `database`, `dependencies`, `jwt_utils`), middlewares en `middlewares/`, esquemas Pydantic en `schemas/`, lógica en `services/`, endpoints en `routers/`, plantillas de email en `templates/emails`.
- Frontend: Next.js + React + TypeScript. Capa de `utils/apiWrapper.ts` (Axios + interceptores + refresh), `services/*` por dominio, y `hooks/*` con React Query para cache y mutaciones. Componentes organizados por áreas (`components/layout`, `components/product`, etc.).
- Gestión de estado: Zustand para estado global del carrito con persistencia en localStorage, React Query para cache de servidor y sincronización.
- Metodología: separación de responsabilidades, validación con Pydantic, dependencias de seguridad en `core/dependencies.py`, middlewares para protecciones globales (CORS, auth por prefijos, control por roles). Modelo SaaS por instancia: configuración vía `.env` sin multi-tenant lógico; cada despliegue tiene su propia base de datos y llaves de terceros.

Estructura relevante (resumen):

```
backend/app/
  core/ (config, db, jwt, deps)
  middlewares/ (auth, roles)
  routers/ (REST por recurso)
  schemas/ (Pydantic)
  services/ (negocio: auth, orders, cart, payments, cloudinary, email)
  templates/emails/ (Jinja2)
frontend/
  utils/apiWrapper.ts (Axios + JWT + refresh)
  services/* (HTTP por dominio)
  hooks/* (React Query)
  components/* (UI/UX)
```

## 2) Frameworks, APIs y microservicios usados y para qué sirven

- FastAPI (backend): framework ASGI para endpoints REST, validación automática, docs, dependencias.
- SQLAlchemy: ORM y manejo de sesiones. Apoya ejecución de SQL plano y funciones almacenadas.
- Pydantic: validación/serialización de datos en `schemas`.
- pwdlib (Argon2): hash y verificación de contraseñas en `core/jwt_utils.py`.
- python-jose: creación/verificación de JWT (access/refresh y tokens específicos).
- Jinja2 + Resend: render de plantillas HTML y envío de emails transaccionales.
- Cloudinary: almacenamiento/transformación de imágenes de productos.
- Wompi: tokenización de tarjetas (frontend), creación de `payment_source` y transacciones (backend), webhooks.
- Frontend: Next.js (React), Axios (HTTP), TanStack React Query (cache de servidor), Zod/RHF (formularios), TailwindCSS (estilos).

## 3) Conexiones: base de datos, FastAPI, Cloudinary y Wompi

- Base de datos (PostgreSQL): URL desde `core/config.py` (`settings.DATABASE_URL`). `core/database.py` crea `engine`, `SessionLocal` y dependencia `get_db()` que abre/cierra sesión por request. Servicios ejecutan SQL y llaman funciones almacenadas para operaciones atómicas (crear orden, migrar carrito, calcular total, CRUD de métodos de pago).
- FastAPI: `app/main.py` instancia la app, registra middlewares (CORS, auth/roles), e incluye `routers/*`. Dependencias de seguridad en `core/dependencies.py` resuelven el usuario actual y roles por endpoint.
- Cloudinary: credenciales en `.env` (`CLOUDINARY_*`). Servicio `services/cloudinary_service.py` sube imágenes con validaciones, transforma a WebP, redimensiona y optimiza. Integrado desde `product_service` para setear `img_producto` al crear/actualizar.
- Wompi: variables (`WOMPI_ENVIRONMENT`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`). `services/wompi_service.py` centraliza llamadas (acceptance token, payment_source, transactions). `payment_service.py` orquesta guardar método de pago y gestionar lista/default/eliminación; `order_router` paga órdenes. Webhook verifica firma HMAC y sincroniza estados.

## 4) Hasheo y encriptamiento de contraseñas

- Algoritmo: Argon2 mediante `pwdlib.PasswordHash.recommended()` configurado en `backend/app/core/jwt_utils.py`.
- Argon2: estándar moderno (ganador del PHC), de tipo memory-hard (Argon2id),
  resistente a ataques paralelos en GPU/ASIC/FPGA y con parámetros de
  memoria/tiempo paralelismo ajustables; recomendado para hasheo de contraseñas.
- Hash: `get_password_hash(password)` genera hash Argon2 almacenado en BD; nunca se guarda texto plano.
- Verificación: `verify_password(plain, hashed)` compara aplicando Argon2 nuevamente sin exponer la contraseña.
- Tokens JWT: `create_access_token` y `create_refresh_token` firman con `SECRET_KEY` y `ALGORITHM` configurados. `verify_token` valida firma, expiración y `type`.

Referencias de implementación:

```90:114:backend/app/core/jwt_utils.py
def get_password_hash(password: str) -> str:
    return pwd_hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_hasher.verify(plain_password, hashed_password)
```

## 5) session_id y migración de carrito anónimo → usuario registrado

- Identidades de carrito:
  - Anónimo: identificado por `session_id` generado con UUID v4 en el frontend (almacenado en localStorage con Zustand persist). La API acepta `session_id` para operar el carrito.
  - Autenticado: identificado por `id_usuario` del token JWT.
- Servicios de carrito (`cart_product_service.py`):
  - Crear/eliminar productos, obtener carrito y detalle, calcular totales, todo sobre usuario o `session_id`.
  - Migración: `migrate_cart_anonymous(db, migrate_data, usr_insert)` invoca la función `fun_migrar_carrito_anonimo_a_usuario` en la BD para mover líneas del carrito del `session_id` al carrito del usuario:
    - Busca carrito por `id_carrito` anónimo y carrito del `id_usuario` (crea si no existe).
    - Fusiona ítems (suma cantidades si coincide producto).
    - Elimina el carrito anónimo.
    - Transacción única para consistencia.
- Endpoints de migración:
  - `POST /migrar`: Migra carrito anónimo a usuario autenticado usando id_carrito.
  - `POST /carrito-usuario`: Obtiene o crea carrito para usuario/sesión.
  - `POST /carrito-productos-detalle`: Obtiene productos del carrito con detalles completos.
  - `POST /calcular-total`: Calcula totales con descuentos y validaciones.
- Momento de migración:
  - Al registrarse o iniciar sesión exitosamente, el frontend detecta automáticamente el cambio de estado y ejecuta la migración.
  - El hook `use-cart` maneja la migración automática con React Query mutations.

Notas prácticas en frontend:

- Conservar `session_id` mientras se navega anónimo usando Zustand persist.
- Tras login/registro, migración automática con validación de límites del carrito.
- Invalidar cache de React Query para reflejar los ítems bajo la cuenta.

Cómo se genera el `session_id`:

- Requisito: Debe ser único, opaco y no predecible. Un UUID v4 es suficiente para identificar sesiones anónimas de carrito.

Frontend (TypeScript) - Implementación actual:

```typescript
// En cart.service.ts
export function generateSessionId(): string {
  return crypto.randomUUID(); // UUID v4 nativo del navegador
}

// En cart-store.ts con Zustand persist
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // ... estado del carrito
    }),
    {
      name: "revital-cart-storage",
      storage: createJSONStorage(() => localStorage),
      // Migración para convertir session_id numérico a UUID v4
      migrate: (persistedState: any, version: number) => {
        if (persistedState.cartUser && persistedState.cartUser.session_id) {
          persistedState.cartUser = migrateSessionId(persistedState.cartUser);
        }
        return persistedState;
      },
      version: 1,
    }
  )
);
```

Backend (Python) — función de utilidad:

```python
import uuid

def generate_session_id() -> str:
    return str(uuid.uuid4())
```

Buenas prácticas del `session_id`:

- Generado con `crypto.randomUUID()` (UUID v4 nativo del navegador).
- Persistido automáticamente con Zustand persist en localStorage.
- Migración automática de session_id numérico a UUID v4 para compatibilidad.
- No requiere protección de HttpOnly porque no es credencial de autenticación.
- Enviado en cada llamada de carrito cuando el usuario no está autenticado.
- Migración automática al autenticarse con validación de límites.

## 9) Conceptos técnicos: UUID v4 y Zustand

### UUID v4 (Universally Unique Identifier versión 4)

- **Qué es**: Un identificador único de 128 bits generado usando números aleatorios o pseudoaleatorios.
- **Formato**: 8-4-4-4-12 caracteres hexadecimales (ej: `550e8400-e29b-41d4-a716-446655440000`).
- **Características**:
  - **Único**: Prácticamente imposible de duplicar (2^122 posibilidades).
  - **Opaque**: No contiene información sobre el objeto que identifica.
  - **No predecible**: No se puede adivinar el siguiente UUID.
- **Uso en Revital**: Identificar sesiones anónimas de carrito de forma segura.
- **Implementación**: `crypto.randomUUID()` (nativo del navegador) o `uuid.v4()` (librería).

### Zustand

- **Qué es**: Una librería de gestión de estado para React, minimalista y sin boilerplate.
- **Características**:
  - **Ligero**: ~2.5KB gzipped vs Redux (~47KB).
  - **Sin providers**: No requiere Context API ni providers anidados.
  - **TypeScript nativo**: Excelente soporte para TypeScript.
  - **Persistencia**: Middleware para guardar estado en localStorage/sessionStorage.
- **Uso en Revital**:
  - Estado global del carrito con persistencia automática.
  - Migración de datos entre versiones.
  - Optimistic updates para mejor UX.
- **Ventajas sobre Redux**:
  - Menos código boilerplate.
  - Mejor performance (menos re-renders).
  - API más simple y directa.

En el contexto de Revital:
En tu proyecto, Zustand se usa para manejar el carrito de compras. Por ejemplo:
Cuando un usuario agrega un producto al carrito, esa información se guarda en el store de Zustand
Si el usuario navega a otra página y regresa, el carrito sigue ahí
Si el usuario cierra el navegador y vuelve más tarde, el carrito se mantiene (gracias a la persistencia)
Todos los componentes que muestran información del carrito (como el ícono con el número de productos) se actualizan automáticamente
Ventajas principales:
Simplicidad: Menos código que escribir
Performance: Solo se re-renderizan los componentes que realmente necesitan actualizarse
TypeScript: Funciona perfectamente con TypeScript sin configuración extra
Flexibilidad: Puedes usarlo tanto para estado simple como complejo
En resumen, Zustand es como tener una "caja fuerte" donde guardas toda la información importante de tu aplicación, y cualquier componente puede ir a buscar o guardar datos ahí cuando los necesite.

---

Este documento resume la arquitectura real del repo y las integraciones implementadas (DB, FastAPI, Cloudinary, Wompi, JWT/Argon2, carrito y migración por `session_id`).
