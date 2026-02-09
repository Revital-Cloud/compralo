# Especificación de Requisitos de Software — revital_ecommerce

**Versión:** [VERSION]  
**Fecha:** [FECHA]

Este documento es la Especificación de Requisitos de Software (SRS) de la aplicación **revital_ecommerce**, componente de la plataforma Revital. Sigue la estructura IEEE 830-1998 y define requisitos funcionales y no funcionales verificables únicamente para esta aplicación.

---

# 1. Introducción

## 1.1 Propósito

Este documento define de forma completa y verificable los requisitos funcionales y no funcionales de **revital_ecommerce**. El propósito del documento es:

- Servir como contrato técnico para el diseño, implementación y pruebas de revital_ecommerce.
- Permitir la trazabilidad entre requisitos (RF/RNF), diseño, código y casos de prueba.
- Facilitar la validación y aceptación del producto por instancia.

**Audiencia prevista:** Equipo de desarrollo, aseguramiento de calidad y stakeholders técnicos con capacidad de validar el cumplimiento de los requisitos de revital_ecommerce.

## 1.2 Alcance

**Nombre del producto:** revital_ecommerce — Aplicación de e-commerce por instancia.

**Descripción breve:** revital_ecommerce es la aplicación de comercio electrónico desplegada **una vez por cada cliente SaaS**. Cada instancia es independiente: base de datos PostgreSQL propia, backend FastAPI y frontend Next.js 15 dedicados, configuración y dominio propios.

**Dentro del alcance de este SRS:**

- Requisitos funcionales y no funcionales del backend (FastAPI, Python 3.13+, PostgreSQL por instancia).
- Requisitos funcionales y no funcionales del frontend (Next.js 15, React 19, TypeScript).
- Esquema y uso de la base de datos por instancia (db_revital.sql, funciones almacenadas, triggers, vistas).
- Integraciones con sistemas externos utilizadas por revital_ecommerce (Wompi, Resend, Cloudinary opcional).

**Fuera del alcance de este SRS:**

- Requisitos de revital_panel (gestión SaaS, instancias, planes, facturación).
- Infraestructura de despliegue (Docker, Traefik, VPS) y procedimientos de operación.
- Herramientas de desarrollo, CI/CD y configuración de entornos de desarrollo.

## 1.3 Definiciones, siglas y abreviaturas

| Término | Definición |
|---------|------------|
| **API** | Application Programming Interface. Endpoints REST expuestos por el backend FastAPI. |
| **BD** | Base de datos. |
| **JWT** | JSON Web Token. Mecanismo de autenticación utilizado en el backend. |
| **ORM** | Object-Relational Mapping (SQLAlchemy en este proyecto). |
| **RF** | Requisito Funcional. Identificador numérico (ej.: RF-01). |
| **RNF** | Requisito No Funcional. Identificador numérico (ej.: RNF-01). |
| **SRS** | Software Requirements Specification. Este documento. |
| **session_id** | Identificador UUID v4 que identifica el carrito de un usuario anónimo; persistido en el cliente. |

## 1.4 Referencias

| Identificador | Documento o recurso |
|---------------|---------------------|
| IEEE 830-1998 | IEEE Recommended Practice for Software Requirements Specifications. |
| [SRS Revital] | docs/SRS_REVITAL_IEEE830.md — SRS de la plataforma Revital (alcance global). |
| [README backend] | revital_ecommerce/backend/README.md. |
| [README frontend] | revital_ecommerce/frontend/README.md. |
| [Arquitectura] | docs/REVITAL_ARQUITECTURA_Y_INTEGRACIONES.md. |
| [DB docs] | revital_ecommerce/db/docs/ — documentación del esquema y funciones. |

## 1.5 Visión general del documento

- **Sección 2 — Descripción general:** Perspectiva del producto, funciones de alto nivel, características de los usuarios, restricciones, supuestos y dependencias (solo revital_ecommerce).
- **Sección 3 — Requisitos específicos:** Requisitos funcionales (RF) y no funcionales (RNF) detallados, con entradas, procesos y salidas donde corresponda.
- **Sección 4 — Gestión de pruebas:** Criterios de aceptación y relación entre requisitos y pruebas.

Los requisitos se numeran de forma única (RF-01, RF-02, …; RNF-01, RNF-02, …) para permitir trazabilidad con diseño, código y casos de prueba.

---

# 2. Descripción General

## 2.1 Perspectiva del producto

revital_ecommerce es un sistema autocontenido por instancia: backend (FastAPI), frontend (Next.js 15) y base de datos PostgreSQL. No comparte datos ni procesos con otras instancias ni con revital_panel. La configuración se realiza mediante variables de entorno y credenciales por instancia.

### Relación con sistemas externos

| Sistema externo | Propósito | Tipo de integración |
|-----------------|-----------|----------------------|
| **Wompi** | Procesamiento de pagos (tarjetas). | API REST + Webhooks (firma HMAC). |
| **Resend** | Envío de emails transaccionales. | API REST. |
| **Cloudinary** | Almacenamiento y transformación de imágenes de productos. | API REST (opcional). |

### Componentes internos

- **Backend:** `app/core`, `app/routers`, `app/services`, `app/schemas`, `app/middlewares`, `app/templates/emails`.
- **Frontend:** `app/(auth)`, `app/(shop)`, `app/(dashboard)/admin`, `components/`, `services/`, `hooks/`, `stores/`.
- **Base de datos:** `db_revital.sql`, `Functions/`, `triggers/`, `views/`.

## 2.2 Funciones del producto

Agrupación de alto nivel de las funciones (el detalle verificable está en la Sección 3):

| Módulo | Descripción breve |
|--------|-------------------|
| Autenticación y autorización | Registro, login, JWT (access/refresh), roles (Admin, Employee, Customer), recuperación de contraseña, logout. |
| Catálogo de productos | CRUD productos, filtros, búsqueda, categorías/líneas/sublíneas, marcas, proveedores, imágenes. |
| Carrito | Carrito anónimo (session_id) y autenticado, migración anónimo→usuario, totales, validación de stock. |
| Órdenes | Creación desde carrito, estados, direcciones, historial por usuario, órdenes de compra a proveedores. |
| Pagos | Integración Wompi (tokenización, payment sources, transacciones, webhooks). |
| Inventario | Stock por producto, movimientos de inventario (entradas, salidas, ajustes). |
| Descuentos y puntos | Descuentos por producto/categoría/usuario, cupones, puntos acumulables, canjes. |
| Usuarios y direcciones | CRUD usuarios, perfiles, roles, direcciones de envío. |
| Favoritos | Alta/baja y listado de productos favoritos por usuario. |
| Emails | Envío transaccional (Resend): confirmación registro, órdenes, recuperación contraseña. |
| CMS | Gestión de contenido (si aplica). |
| Comentarios | Comentarios sobre productos (si aplica). |
| Dashboard y analytics | KPIs, estadísticas de ventas, analytics para administradores. |

## 2.3 Características del usuario

| Tipo de usuario | Descripción | Experiencia técnica | Roles/Permisos |
|-----------------|-------------|---------------------|----------------|
| Administrador | Gestión completa de la tienda (productos, órdenes, usuarios, analytics). | Uso de interfaces web administrativas. | Admin (id_rol: 1). |
| Empleado | Gestión de productos y órdenes bajo supervisión. | Uso básico de interfaces administrativas. | Employee (id_rol: 2). |
| Cliente | Navegación, carrito, checkout, perfil, historial de órdenes. | Navegación web y compras online. | Customer (id_rol: 3). |
| Usuario anónimo | Navegación y carrito sin cuenta. | Navegación web. | Sin rol; identificado por session_id. |

## 2.4 Restricciones

- **Técnicas:** Stack fijo (FastAPI, Python 3.13+, Next.js 15, React 19, PostgreSQL 15+). Autenticación JWT y hash Argon2. Integraciones Wompi y Resend según diseño actual.
- **Legales:** Cumplimiento GDPR (cookies, datos personales). PCI-DSS vía Wompi (no almacenar datos de tarjetas).
- **Operativas:** Una BD PostgreSQL por instancia; configuración por variables de entorno; despliegue independiente por instancia.

## 2.5 Supuestos y dependencias

- **Supuestos:** Los usuarios finales usan navegadores modernos con JavaScript; Wompi y Resend están disponibles; la instancia dispone de recursos suficientes según su uso.
- **Dependencias:** PostgreSQL 15+, Python 3.13+, Node.js 18+; APIs de Wompi y Resend; opcionalmente Cloudinary. Bibliotecas: FastAPI, SQLAlchemy, Pydantic, python-jose, pwdlib (Argon2), Next.js, React, TanStack React Query, Zustand, Axios.

---

# 3. Requisitos específicos

## 3.1 Requisitos funcionales

### RF-01 — Registro de usuarios

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Email, contraseña, datos de perfil (nombre, apellido, etc.) según esquema de registro. |
| **Proceso** | Validación de datos (Pydantic); comprobación de email no duplicado; hash de contraseña (Argon2); persistencia en BD; envío de email de confirmación (Resend) si aplica. |
| **Salida** | Usuario creado; código HTTP 201; cuerpo con datos del usuario (sin contraseña) o mensaje de error verificable. |
| **Prioridad** | Alta. |

### RF-02 — Inicio de sesión (login)

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Email y contraseña. |
| **Proceso** | Validación de credenciales; verificación de contraseña con Argon2; generación de access token y refresh token (JWT); actualización de último acceso si aplica. |
| **Salida** | Access token, refresh token, tipo de token, tiempo de expiración; código 200; o 401 si credenciales inválidas. |
| **Prioridad** | Alta. |

### RF-03 — Refresh de token

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Refresh token válido (cuerpo o header). |
| **Proceso** | Verificación de firma y expiración del refresh token; generación de nuevo access token (y opcionalmente refresh token). |
| **Salida** | Nuevo access token (y refresh si aplica); 200; o 401 si token inválido o expirado. |
| **Prioridad** | Alta. |

### RF-04 — Recuperación de contraseña

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Email del usuario. |
| **Proceso** | Búsqueda de usuario por email; generación de token de restablecimiento (limitado en tiempo); envío de email con enlace (Resend). |
| **Salida** | Confirmación de envío de email (sin revelar si el email existe); 200. |
| **Prioridad** | Media. |

### RF-05 — Restablecimiento de contraseña

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Token de restablecimiento y nueva contraseña. |
| **Proceso** | Validación del token; actualización del hash de contraseña en BD; invalidación del token. |
| **Salida** | Confirmación de cambio; 200; o 400/401 si token inválido o expirado. |
| **Prioridad** | Media. |

### RF-06 — Obtención de usuario actual (me)

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Access token JWT válido en header. |
| **Proceso** | Decodificación y validación del token; lectura de usuario en BD. |
| **Salida** | Datos del usuario (id, email, rol, perfil) sin datos sensibles; 200; o 401 si no autenticado. |
| **Prioridad** | Alta. |

### RF-07 — Cierre de sesión (logout)

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Access token (para invalidación si existe blacklist). |
| **Proceso** | Invalidación del token en el cliente; opcionalmente registro en blacklist en servidor. |
| **Salida** | Confirmación; 200. |
| **Prioridad** | Media. |

### RF-08 — CRUD de productos

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Creación/actualización: datos del producto según schema (nombre, precio, stock, categoría, marca, etc.). Eliminación: id de producto. Lectura: id o parámetros de listado/filtro. |
| **Proceso** | Validación Pydantic; permisos (Admin/Employee para escritura); persistencia o borrado en BD; para listado, aplicación de filtros y paginación. |
| **Salida** | Producto(s) con código 200/201; o 404/400/403 según caso. |
| **Prioridad** | Alta. |

### RF-09 — Filtros y búsqueda de productos

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Parámetros de filtro (categoría, línea, sublínea, marca, proveedor, rango de precio, texto de búsqueda), paginación, ordenamiento. |
| **Proceso** | Construcción de consulta (o llamada a función de BD); ejecución; devolución de lista paginada. |
| **Salida** | Lista de productos que cumplan filtros; total de registros; metadatos de paginación; 200. |
| **Prioridad** | Alta. |

### RF-10 — Gestión de categorías, líneas y sublíneas

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | CRUD de categorías; CRUD de líneas (asociadas a categoría); CRUD de sublíneas (asociadas a línea). |
| **Proceso** | Validación; permisos Admin/Employee para escritura; persistencia; integridad referencial. |
| **Salida** | Recurso(s) creado(s)/actualizado(s)/eliminado(s) o listado; códigos HTTP apropiados. |
| **Prioridad** | Alta. |

### RF-11 — Gestión de marcas y proveedores

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | CRUD de marcas; CRUD de proveedores. |
| **Proceso** | Validación; permisos Admin/Employee para escritura; persistencia. |
| **Salida** | Recurso(s) o listado; códigos HTTP apropiados. |
| **Prioridad** | Media. |

### RF-12 — Carrito: obtener o crear

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Usuario autenticado (id_usuario) o session_id (usuario anónimo). |
| **Proceso** | Búsqueda de carrito existente o creación; devolución de carrito con ítems. |
| **Salida** | Carrito con líneas (producto, cantidad, precios); 200. |
| **Prioridad** | Alta. |

### RF-13 — Carrito: agregar producto

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | id_producto, cantidad; usuario o session_id. |
| **Proceso** | Validación de existencia y stock del producto; actualización o creación de línea de carrito; validación de límites de carrito si existen. |
| **Salida** | Carrito actualizado; 200; o 400 si stock insuficiente o límite superado. |
| **Prioridad** | Alta. |

### RF-14 — Carrito: actualizar cantidad o eliminar ítem

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Identificador de línea de carrito; nueva cantidad o indicación de borrado; usuario o session_id. |
| **Proceso** | Validación de pertenencia del carrito; actualización de cantidad (y validación de stock) o eliminación de línea. |
| **Salida** | Carrito actualizado; 200; o 404/400 según caso. |
| **Prioridad** | Alta. |

### RF-15 — Carrito: migración anónimo a usuario

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | id_carrito (o session_id) del carrito anónimo; id_usuario autenticado. |
| **Proceso** | Fusión de líneas (misma producto: sumar cantidades); eliminación del carrito anónimo; transacción atómica (función almacenada o equivalente). |
| **Salida** | Carrito unificado del usuario; 200; o 400 si error de validación. |
| **Prioridad** | Alta. |

### RF-16 — Carrito: calcular total

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Carrito (usuario o session_id); opcionalmente cupón o reglas de descuento aplicables. |
| **Proceso** | Cálculo de subtotal, descuentos, impuestos (si aplica), total; validación de stock. |
| **Salida** | Desglose de totales; 200. |
| **Prioridad** | Alta. |

### RF-17 — Creación de orden desde carrito

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Usuario autenticado; dirección de envío; método de pago (si aplica); datos adicionales según flujo. |
| **Proceso** | Validación de stock y totales; creación de orden en estado coherente; descuento de stock (o reserva según diseño); vaciado o actualización del carrito; transacción atómica. |
| **Salida** | Orden creada con id y estado; 201; o 400 si validación falla (ej. stock insuficiente). |
| **Prioridad** | Alta. |

### RF-18 — Consulta de órdenes del usuario

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Usuario autenticado; opcionalmente id_orden para detalle. |
| **Proceso** | Lectura de órdenes del usuario (y detalle si se solicita); permisos: solo propias órdenes para Customer; Admin/Employee según diseño. |
| **Salida** | Lista de órdenes o detalle de una orden; 200; o 404 si no existe o no autorizado. |
| **Prioridad** | Alta. |

### RF-19 — Actualización de estado de orden (admin)

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | id_orden; nuevo estado (ej. confirmada, en proceso, enviada, completada, cancelada). |
| **Proceso** | Verificación de rol Admin/Employee; actualización de estado en BD; disparo de notificaciones (email) si aplica. |
| **Salida** | Orden actualizada; 200; o 403/404 según caso. |
| **Prioridad** | Alta. |

### RF-20 — Integración Wompi: acceptance token / widget

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Solicitud de token de aceptación para el widget de Wompi (y datos necesarios según API Wompi). |
| **Proceso** | Llamada a API Wompi para obtener acceptance token; devolución al frontend para incrustar widget. |
| **Salida** | Token o datos necesarios para el widget; 200; o código de error de Wompi. |
| **Prioridad** | Alta. |

### RF-21 — Integración Wompi: métodos de pago y transacciones

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Creación de payment source (token de tarjeta desde Wompi); creación de transacción asociada a orden. |
| **Proceso** | Llamadas a API Wompi; persistencia de referencia de pago y estado; actualización de estado de orden según resultado. |
| **Salida** | Payment source creado o transacción iniciada; estado de pago; 200/201; o error Wompi propagado. |
| **Prioridad** | Alta. |

### RF-22 — Webhook Wompi

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Payload del webhook; firma HMAC en header. |
| **Proceso** | Verificación de firma; actualización de estado de pago y de orden en BD; idempotencia ante reintentos. |
| **Salida** | 200 para confirmar recepción; 401 si firma inválida. |
| **Prioridad** | Alta. |

### RF-23 — Movimientos de inventario

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | id_producto, tipo de movimiento (entrada/salida/ajuste), cantidad, referencia opcional. |
| **Proceso** | Validación; permisos Admin/Employee; actualización de stock; registro del movimiento. |
| **Salida** | Movimiento registrado y stock actualizado; 200/201; o 400 si cantidad inválida. |
| **Prioridad** | Alta. |

### RF-24 — Descuentos: CRUD y aplicación

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | CRUD de descuentos (por producto, categoría, usuario, cupón); en checkout: cupón o identificación de descuento aplicable. |
| **Proceso** | Validación de vigencia y reglas; persistencia (admin); cálculo aplicado en carrito/orden. |
| **Salida** | Descuento(s) o importe descontado; códigos HTTP apropiados. |
| **Prioridad** | Alta. |

### RF-25 — Puntos: acumulación y consulta

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Triggers o reglas de acumulación (ej. por orden pagada); consulta por usuario. |
| **Proceso** | Acumulación según reglas de negocio (trigger o servicio); lectura de saldo por usuario. |
| **Salida** | Saldo de puntos del usuario; historial si aplica; 200. |
| **Prioridad** | Media. |

### RF-26 — Canje de puntos

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Usuario autenticado; producto o descuento a canjear; cantidad de puntos. |
| **Proceso** | Validación de saldo y reglas de canje; descuento de puntos; aplicación de beneficio (descuento/producto). |
| **Salida** | Canje realizado; 200; o 400 si saldo insuficiente o regla no cumplida. |
| **Prioridad** | Media. |

### RF-27 — Favoritos: agregar y quitar

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | id_producto; usuario autenticado. |
| **Proceso** | Alta o baja de relación usuario-producto favorito; persistencia. |
| **Salida** | Lista actualizada de favoritos o confirmación; 200. |
| **Prioridad** | Media. |

### RF-28 — Direcciones de envío

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | CRUD de direcciones asociadas al usuario (calle, ciudad, código postal, etc.). |
| **Proceso** | Validación; usuario solo puede gestionar sus propias direcciones; persistencia. |
| **Salida** | Dirección(es) creada(s)/actualizada(s)/eliminada(s) o listado; 200/201. |
| **Prioridad** | Alta. |

### RF-29 — Envío de emails transaccionales

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Evento (registro, orden creada, estado de orden, recuperación de contraseña); datos del destinatario y del evento. |
| **Proceso** | Renderizado de plantilla (Jinja2); envío vía Resend; registro de envío o error si aplica. |
| **Salida** | Email enviado; respuesta Resend; no debe bloquear operación crítica si Resend falla (degradación controlada). |
| **Prioridad** | Alta. |

### RF-30 — Dashboard y analytics (admin)

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Usuario Admin/Employee; parámetros de período o filtros si aplica. |
| **Proceso** | Cálculo o lectura de KPIs (ventas, órdenes, productos, ingresos); uso de vistas materializadas o consultas optimizadas si existen. |
| **Salida** | Datos de dashboard/analytics; 200; o 403 si no autorizado. |
| **Prioridad** | Media. |

### RF-31 — Gestión de usuarios (admin)

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | CRUD de usuarios; asignación de rol (Admin, Employee, Customer). |
| **Proceso** | Solo Admin (o Admin/Employee según política); validación; persistencia; no permitir eliminación de último admin si aplica. |
| **Salida** | Usuario(s) o listado; códigos HTTP apropiados. |
| **Prioridad** | Alta. |

### RF-32 — Protección de rutas por autenticación y rol

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Petición HTTP a ruta protegida; token JWT (o ausencia); rol del usuario. |
| **Proceso** | Middleware o dependencias: validar JWT; comprobar rol según política de la ruta (admin_only_paths, protected_paths). |
| **Salida** | Petición permitida (200 u otra respuesta del recurso) o 401/403 con mensaje verificable. |
| **Prioridad** | Alta. |

Los requisitos funcionales que dependan de CMS, comentarios u órdenes a proveedores se documentan de forma análoga (CRUD, entradas/salidas verificables) y se numeran en continuidad (RF-33, RF-34, …) si se desea trazabilidad exhaustiva.

## 3.2 Requisitos no funcionales

### RNF-01 — Tiempo de respuesta de la API

| Atributo | Descripción |
|----------|-------------|
| **Requisito** | El 95% de las peticiones a la API deben completarse en menos de 500 ms bajo carga normal de la instancia. |
| **Criterio de verificación** | Medición con herramienta de carga o APM; percentil P95 de latencia por endpoint o global. |

### RNF-02 — Autenticación y almacenamiento de contraseñas

| Atributo | Descripción |
|----------|-------------|
| **Requisito** | Las contraseñas deben almacenarse con hash Argon2 (pwdlib). Los tokens de sesión deben ser JWT firmados con algoritmo y secret configurados. |
| **Criterio de verificación** | Revisión de código (jwt_utils, modelos de usuario); no almacenamiento de contraseña en claro. |

### RNF-03 — Validación de entradas

| Atributo | Descripción |
|----------|-------------|
| **Requisito** | Todas las entradas de usuario y parámetros de API deben validarse con esquemas Pydantic antes de su uso en lógica o BD. |
| **Criterio de verificación** | Revisión de routers y schemas; rechazo 422 con detalle de validación ante datos inválidos. |

### RNF-04 — CORS y seguridad de cabeceras

| Atributo | Descripción |
|----------|-------------|
| **Requisito** | La API debe aplicar CORS y middleware de seguridad (cabeceras, saneamiento) según configuración del proyecto. |
| **Criterio de verificación** | Revisión de main.py y SecurityMiddleware; pruebas de cabeceras en respuestas. |

### RNF-05 — Disponibilidad de la API

| Atributo | Descripción |
|----------|-------------|
| **Requisito** | La API debe responder a solicitudes de salud (ej. GET /) para comprobar que la instancia está en ejecución. |
| **Criterio de verificación** | Petición GET al endpoint raíz; respuesta 200 en tiempo razonable. |

### RNF-06 — Transaccionalidad en operaciones críticas

| Atributo | Descripción |
|----------|-------------|
| **Requisito** | Operaciones que modifiquen carrito (migración), stock (orden, movimiento) u órdenes deben ejecutarse en transacciones atómicas (BD o servicio). |
| **Criterio de verificación** | Revisión de servicios y funciones almacenadas; pruebas de rollback ante fallo. |

### RNF-07 — Frontend: compatibilidad de navegadores

| Atributo | Descripción |
|----------|-------------|
| **Requisito** | El frontend debe ser utilizable en navegadores modernos (Chrome, Firefox, Safari, Edge) con JavaScript habilitado. |
| **Criterio de verificación** | Pruebas manuales o automatizadas en dichos navegadores; sin dependencias de APIs obsoletas. |

### RNF-08 — Frontend: manejo de errores y estados de carga

| Atributo | Descripción |
|----------|-------------|
| **Requisito** | Las pantallas que consuman API deben mostrar estados de carga y mensajes de error comprensibles ante fallos de red o respuestas 4xx/5xx. |
| **Criterio de verificación** | Revisión de hooks y componentes; pruebas simulando error de API. |

### RNF-09 — Identificación de carrito anónimo

| Atributo | Descripción |
|----------|-------------|
| **Requisito** | El carrito anónimo debe identificarse mediante un session_id con formato UUID v4, generado en el cliente y persistido (ej. localStorage) de forma coherente con el backend. |
| **Criterio de verificación** | Revisión de cart-store y endpoints de carrito; migración anónimo→usuario sin pérdida de ítems. |

### RNF-10 — Trazabilidad y auditoría

| Atributo | Descripción |
|----------|-------------|
| **Requisito** | Las operaciones críticas (creación de orden, movimientos de inventario, cambios de estado) deben registrarse con timestamp y usuario responsable (usr_insert/usr_update o equivalente). |
| **Criterio de verificación** | Revisión de esquema de BD y lógica de servicios; existencia de campos de auditoría. |

---

# 4. Gestión de pruebas

## 4.1 Criterios de aceptación

- Cada RF debe tener al menos un caso de prueba que verifique el comportamiento descrito en Entrada/Proceso/Salida.
- Cada RNF debe tener un criterio de verificación aplicable (prueba de rendimiento, revisión de código, prueba de seguridad o usabilidad según corresponda).
- Las pruebas de API deben ejecutarse contra el backend con BD de prueba; las pruebas E2E contra frontend y backend integrados cuando sea posible.

## 4.2 Relación requisitos — pruebas

| Requisito | Tipo de prueba sugerida |
|-----------|-------------------------|
| RF-01 a RF-07 | Pruebas de API (registro, login, refresh, recuperación/restablecimiento, me, logout). |
| RF-08 a RF-11 | Pruebas de API CRUD (productos, categorías/líneas/sublíneas, marcas, proveedores). |
| RF-12 a RF-16 | Pruebas de API de carrito (crear, agregar, actualizar, migrar, total). |
| RF-17 a RF-19 | Pruebas de API de órdenes (crear, listar, actualizar estado). |
| RF-20 a RF-22 | Pruebas de integración con Wompi (mock o entorno de pruebas); webhook con firma válida/inválida. |
| RF-23 a RF-28 | Pruebas de API (inventario, descuentos, puntos, canjes, favoritos, direcciones). |
| RF-29 | Prueba de envío de email (mock Resend o bandeja de pruebas). |
| RF-30 a RF-32 | Pruebas de API con roles; dashboard; protección de rutas (401/403). |
| RNF-01 | Prueba de carga (ej. k6, Locust) y medición de P95. |
| RNF-02 a RNF-06, RNF-09, RNF-10 | Revisión de código y pruebas unitarias/integración según criterio. |
| RNF-07, RNF-08 | Pruebas manuales o E2E en navegadores; simulación de errores. |

## 4.3 Trazabilidad

- **Diseño:** Cada RF/RNF debe poder asociarse a módulos de diseño (routers, services, esquema BD).
- **Código:** Los identificadores RF-xx y RNF-xx pueden referenciarse en comentarios, issues o casos de prueba para mantener trazabilidad.
- **Pruebas:** Cada caso de prueba debe indicar el requisito que verifica (RF-xx o RNF-xx).

---

*Fin del documento. Los placeholders [VERSION] y [FECHA] deben reemplazarse al publicar la versión definitiva.*
