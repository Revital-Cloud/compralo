# Especificación de Requisitos de Software — synkro_ecommerce

**Versión:** [VERSION]  
**Fecha:** [FECHA]

Este documento es la Especificación de Requisitos de Software (SRS) de la aplicación **synkro_ecommerce**, componente de la plataforma Synkro. Proporciona una vista general del producto, objetivo, alcance, definiciones, referencias, descripción general, requisitos específicos (funcionales y no funcionales) y gestión de pruebas.

---

# 1. Introducción

La introducción proporciona el objetivo de la SRS, el alcance, las definiciones y acrónimos, las referencias, el personal involucrado y un resumen de la organización del documento.

## 1.1 Propósito

- **Propósito del documento:** Definir de forma completa y verificable los requisitos funcionales y no funcionales de **synkro_ecommerce**; servir como contrato técnico para el diseño, implementación y pruebas; permitir la trazabilidad entre requisitos (RF/RNF), diseño, código y casos de prueba; facilitar la validación y aceptación del producto por instancia.
- **Audiencia a la que va dirigido:** Equipo de desarrollo, aseguramiento de calidad, gestores de proyecto y stakeholders técnicos con capacidad de validar el cumplimiento de los requisitos de synkro_ecommerce.

## 1.2 Alcance

- **Identificación del producto:** synkro_ecommerce — Aplicación de e-commerce por instancia.
- **Descripción breve:** synkro_ecommerce es la aplicación de comercio electrónico desplegada **una vez por cada cliente SaaS**. Cada instancia es independiente: base de datos PostgreSQL propia, backend FastAPI y frontend Next.js 15 dedicados, configuración y dominio propios.
- **Consistencia con documentos de mayor nivel:** Este SRS es coherente con [SRS Synkro] (docs/SRS_SYNKRO_IEEE830.md), que define el alcance global de la plataforma Synkro.

**Dentro del alcance de este SRS:**

- Requisitos funcionales y no funcionales del backend (FastAPI, Python 3.13+, PostgreSQL por instancia).
- Requisitos funcionales y no funcionales del frontend (Next.js 15, React 19, TypeScript).
- Esquema y uso de la base de datos por instancia (db_synkro.sql, funciones almacenadas, triggers, vistas).
- Integraciones con sistemas externos (Wompi, Resend, Cloudinary opcional).

**Fuera del alcance de este SRS:**

- Requisitos de synkro_panel (gestión SaaS, instancias, planes, facturación).
- Detalle de la infraestructura de despliegue (VPS, servidor propio, PaaS como Railway/Vercel, etc.) y procedimientos de operación. *Nota: el proyecto no utiliza Docker ni Traefik en el stack actual.*
- Herramientas de desarrollo, CI/CD y configuración de entornos de desarrollo.

## 1.3 Personal involucrado

Relación de personas involucradas en el desarrollo del sistema, con información de contacto. Útil para que el gestor del proyecto pueda localizar a los participantes y recabar información para requisitos, validaciones y seguimiento.

| Nombre | Rol | Categoría profesional | Responsabilidades | Información de contacto | Aprobación |
|--------|-----|------------------------|-------------------|--------------------------|------------|
| [Inserte nombre] | [Inserte rol] | [Inserte categoría] | [Inserte responsabilidades] | [Inserte contacto] | [Inserte aprobación] |

*Completar con los datos del equipo del proyecto.*

## 1.4 Definiciones, acrónimos y abreviaturas

Definición de todos los términos, abreviaturas y acrónimos necesarios para interpretar este documento.

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

## 1.5 Referencias

Relación de documentos relacionados en la especificación, con título, referencia, ruta, fecha y organización/autor.

| Referencia | Título | Ruta | Fecha | Autor |
|------------|--------|------|-------|-------|
| IEEE 830-1998 | IEEE Recommended Practice for Software Requirements Specifications | — | 1998 | IEEE |
| [SRS Synkro] | SRS de la plataforma Synkro | docs/SRS_SYNKRO_IEEE830.md | [FECHA] | Proyecto Synkro |
| [README backend] | README backend e-commerce | synkro_ecommerce/backend/README.md | — | Proyecto Synkro |
| [README frontend] | README frontend e-commerce | synkro_ecommerce/frontend/README.md | — | Proyecto Synkro |
| [Arquitectura] | Arquitectura e integraciones | docs/SYNKRO_ARQUITECTURA_Y_INTEGRACIONES.md | — | Proyecto Synkro |
| [DB docs] | Documentación del esquema y funciones | synkro_ecommerce/db/docs/ | — | Proyecto Synkro |

## 1.6 Resumen

- **Descripción del contenido del resto del documento:** La Sección 2 describe la perspectiva del producto, funcionalidad, características de los usuarios, restricciones, supuestos, dependencias y evolución previsible. La Sección 3 detalla los requisitos comunes de interfaces (usuario, hardware, software, comunicación), los requisitos funcionales (RF-01 a RF-32), los requisitos no funcionales (rendimiento, seguridad, fiabilidad, disponibilidad, mantenibilidad, portabilidad) y otros requisitos. La Sección 4 contiene apéndices. La Sección 5 describe la gestión de pruebas (pruebas de base de datos, interfaz de usuario y seguridad).
- **Organización del documento:** Los requisitos se numeran de forma única (RF-01, RF-02, …; RNF-01, RNF-02, …) para permitir trazabilidad con diseño, código y casos de prueba.

---

# 2. Descripción General

## 2.1 Perspectiva del producto

synkro_ecommerce es **parte de un sistema mayor** (la plataforma Synkro). Es el componente de e-commerce desplegado una vez por cada cliente SaaS; synkro_panel es el sistema central que gestiona instancias, planes y facturación. A continuación se describe el producto y sus conexiones.

synkro_ecommerce es un sistema autocontenido por instancia: backend (FastAPI), frontend (Next.js 15) y base de datos PostgreSQL. No comparte datos ni procesos con otras instancias ni con synkro_panel. La configuración se realiza mediante variables de entorno y credenciales por instancia.

### Relación con sistemas externos

| Sistema externo | Propósito | Tipo de integración |
|-----------------|-----------|----------------------|
| **Wompi** | Procesamiento de pagos (tarjetas). | API REST + Webhooks (firma HMAC). |
| **Resend** | Envío de emails transaccionales. | API REST. |
| **Cloudinary** | Almacenamiento y transformación de imágenes de productos. | API REST (opcional). |

### Componentes internos

- **Backend:** `app/core`, `app/routers`, `app/services`, `app/schemas`, `app/middlewares`, `app/templates/emails`.
- **Frontend:** `app/(auth)`, `app/(shop)`, `app/(dashboard)/admin`, `components/`, `services/`, `hooks/`, `stores/`.
- **Base de datos:** `db_synkro.sql`, `Functions/`, `triggers/`, `views/`.

## 2.2 Funcionalidad del producto

Resumen de las funcionalidades principales que el producto debe realizar, sin entrar en detalle. El detalle verificable está en la Sección 3 (Requisitos específicos). Las funcionalidades están organizadas para que el cliente o cualquier interlocutor pueda entenderlas.

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

## 2.3 Características de los usuarios

Descripción de los usuarios del producto, incluyendo nivel educacional, experiencia y experiencia técnica.

| Tipo de usuario | Formación | Habilidades | Actividades |
|-----------------|-----------|-------------|-------------|
| Administrador | Conocimientos básicos de e-commerce y gestión de inventario. | Uso de interfaces web administrativas. | Gestión completa de la tienda: productos, órdenes, usuarios, analytics. Rol: Admin (id_rol: 1). |
| Empleado | Conocimientos básicos de gestión de productos y órdenes. | Uso básico de interfaces administrativas. | Gestión de productos y órdenes bajo supervisión. Rol: Employee (id_rol: 2). |
| Cliente | Conocimientos básicos de navegación web y compras online. | Navegación web, uso de carrito y checkout. | Navegación, carrito, checkout, perfil, historial de órdenes. Rol: Customer (id_rol: 3). |
| Usuario anónimo | Navegación web. | Navegación web. | Navegación y carrito sin cuenta; identificado por session_id. |

## 2.4 Restricciones

Descripción de las limitaciones a tener en cuenta al diseñar y desarrollar el sistema: metodologías, lenguajes, normas, hardware, sistema operativo, etc.

- **Técnicas:** Stack fijo (FastAPI, Python 3.13+, Next.js 15, React 19, PostgreSQL 15+). Autenticación JWT y hash Argon2. Integraciones Wompi y Resend según diseño actual.
- **Legales:** Cumplimiento GDPR (cookies, datos personales). PCI-DSS vía Wompi (no almacenar datos de tarjetas).
- **Operativas:** Una BD PostgreSQL por instancia; configuración por variables de entorno; despliegue independiente por instancia.

## 2.5 Supuestos y dependencias

- **Supuestos:** Los usuarios finales usan navegadores modernos con JavaScript; Wompi y Resend están disponibles; la instancia dispone de recursos suficientes según su uso; el sistema operativo y el hardware requerido están disponibles para el despliegue.
- **Dependencias:** PostgreSQL 15+, Python 3.13+, Node.js 18+; APIs de Wompi y Resend; opcionalmente Cloudinary. Bibliotecas: FastAPI, SQLAlchemy, Pydantic, python-jose, pwdlib (Argon2), Next.js, React, TanStack React Query, Zustand, Axios. Si alguna dependencia (p. ej. versión de API de Wompi) cambia, la SRS y el diseño deben revisarse.

## 2.6 Evolución previsible del sistema

Identificación de futuras mejoras que podrán analizarse e implementarse en un futuro:

- **Checkout completo:** Flujo de checkout end-to-end con confirmación de pago y estados de orden del lado del usuario.
- **Dashboard de analytics avanzado:** Más métricas, gráficos y exportación de reportes.
- **Notificaciones en tiempo real:** WebSockets o Server-Sent Events para actualizaciones de estado de órdenes y stock.
- **Sistema de reviews y comentarios:** Valoraciones y comentarios de productos por clientes.
- **CMS:** Gestión de contenido (páginas estáticas, banners) si se requiere.
- **Órdenes de compra a proveedores:** Módulo de compras para administradores.
- **Integración con más pasarelas de pago:** Soporte opcional para otras pasarelas además de Wompi.
- **App móvil o PWA:** Experiencia móvil nativa o Progressive Web App.

---

# 3. Requisitos específicos

Esta es la sección más extensa e importante del documento. Contiene la lista detallada y completa de requisitos que debe cumplir el sistema. Los requisitos se disponen en forma de listas numeradas (RF-01, RF-02, …; RNF-01, RNF-02, …) para identificación, seguimiento, trazabilidad y validación.

Para cada requisito funcional se indica: número, nombre, tipo (Requisito/Restricción), fuente, prioridad (Alta/Esencial, Media/Deseado, Baja/Opcional) y descripción (entrada, proceso, salida).

## 3.1 Requisitos comunes de los interfaces

Descripción de las entradas y salidas del sistema y de los interfaces con usuario, hardware, software y comunicación.

### 3.1.1 Interfaces de usuario

- **Estilo:** Interfaz web responsive con diseño coherente (Tailwind CSS, shadcn/ui). Modo claro/oscuro.
- **Tienda (público):** Catálogo de productos, filtros, búsqueda, carrito, checkout, perfil de usuario, favoritos, historial de órdenes. Navegación intuitiva y mensajes de error comprensibles.
- **Dashboard administrativo:** Gestión de productos, categorías/líneas/sublíneas, marcas, proveedores, órdenes, inventario, descuentos, puntos, usuarios, direcciones. Tablas con paginación, formularios con validación en cliente y servidor.
- **Autenticación:** Pantallas de login, registro, recuperación y restablecimiento de contraseña. Mensajes claros ante credenciales inválidas o token expirado.
- **Estados de carga y error:** Indicadores de carga y mensajes de error ante fallos de red o respuestas 4xx/5xx.

### 3.1.2 Interfaces de hardware

- No se especifican requisitos de hardware propios del producto. El sistema se ejecuta en servidores estándar (VPS, PaaS) con PostgreSQL, Python y Node.js. La configuración de hardware queda fuera del alcance de este SRS.

### 3.1.3 Interfaces de software

| Producto software | Propósito del interfaz | Definición del interfaz |
|-------------------|------------------------|-------------------------|
| **Wompi API** | Procesamiento de pagos (tokenización, payment sources, transacciones). | API REST; autenticación por API key; webhooks con firma HMAC. Payload JSON según documentación Wompi. |
| **Resend API** | Envío de emails transaccionales. | API REST; autenticación por API key. Contenido HTML (templates Jinja2) y destinatario. |
| **Cloudinary API** (opcional) | Almacenamiento y transformación de imágenes de productos. | API REST; subida y transformación de imágenes; URLs de recurso. |
| **PostgreSQL** | Persistencia de datos por instancia. | Conexión vía SQLAlchemy (ORM); esquema en db_synkro.sql; funciones almacenadas, triggers, vistas. |

### 3.1.4 Interfaces de comunicación

- **API REST (backend):** Endpoints JSON sobre HTTPS. Autenticación mediante JWT en header (Bearer). CORS configurado según origen del frontend.
- **Webhooks:** Recepción de webhooks de Wompi (firma HMAC); verificación de firma antes de procesar; respuesta 200 para confirmar recepción; idempotencia ante reintentos.
- **Cliente HTTP:** El backend utiliza cliente HTTP (requests o similar) para llamadas a Wompi, Resend y Cloudinary. Timeouts y reintentos según política del proyecto.

## 3.2 Requisitos funcionales

Para cada requisito se indica: **Número**, **Nombre**, **Tipo** (Requisito/Restricción), **Fuente del requisito**, **Prioridad** (Alta/Esencial, Media/Deseado, Baja/Opcional) y descripción (Entrada, Proceso, Salida).

### 3.2.1 RF-01 — Registro de usuarios

| Atributo | Valor |
|----------|--------|
| **Número de requisito** | RF-01 |
| **Nombre de requisito** | Registro de usuarios |
| **Tipo** | Requisito |
| **Fuente del requisito** | SRS Synkro, stakeholders |
| **Prioridad del requisito** | Alta/Esencial |

**Descripción:**

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Email, contraseña, datos de perfil (nombre, apellido, etc.) según esquema de registro. |
| **Proceso** | Validación de datos (Pydantic); comprobación de email no duplicado; hash de contraseña (Argon2); persistencia en BD; envío de email de confirmación (Resend) si aplica. |
| **Salida** | Usuario creado; código HTTP 201; cuerpo con datos del usuario (sin contraseña) o mensaje de error verificable. |

### 3.2.2 RF-02 — Inicio de sesión (login)

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Email y contraseña. |
| **Proceso** | Validación de credenciales; verificación de contraseña con Argon2; generación de access token y refresh token (JWT); actualización de último acceso si aplica. |
| **Salida** | Access token, refresh token, tipo de token, tiempo de expiración; código 200; o 401 si credenciales inválidas. |
| **Prioridad** | Alta. |

### 3.2.3 RF-03 — Refresh de token

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

### 3.2.5 RF-05 — Restablecimiento de contraseña

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Token de restablecimiento y nueva contraseña. |
| **Proceso** | Validación del token; actualización del hash de contraseña en BD; invalidación del token. |
| **Salida** | Confirmación de cambio; 200; o 400/401 si token inválido o expirado. |
| **Prioridad** | Media. |

### 3.2.6 RF-06 — Obtención de usuario actual (me)

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Access token JWT válido en header. |
| **Proceso** | Decodificación y validación del token; lectura de usuario en BD. |
| **Salida** | Datos del usuario (id, email, rol, perfil) sin datos sensibles; 200; o 401 si no autenticado. |
| **Prioridad** | Alta. |

### 3.2.7 RF-07 — Cierre de sesión (logout)

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Access token (para invalidación si existe blacklist). |
| **Proceso** | Invalidación del token en el cliente; opcionalmente registro en blacklist en servidor. |
| **Salida** | Confirmación; 200. |
| **Prioridad** | Media. |

### 3.2.8 RF-08 — CRUD de productos

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

### 3.2.10 RF-10 — Gestión de categorías, líneas y sublíneas

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

### 3.2.12 RF-12 — Carrito: obtener o crear

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

### 3.2.14 RF-14 — Carrito: actualizar cantidad o eliminar ítem

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

### 3.2.16 RF-16 — Carrito: calcular total

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

### 3.2.18 RF-18 — Consulta de órdenes del usuario

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Usuario autenticado; opcionalmente id_orden para detalle. |
| **Proceso** | Lectura de órdenes del usuario (y detalle si se solicita); permisos: solo propias órdenes para Customer; Admin/Employee según diseño. |
| **Salida** | Lista de órdenes o detalle de una orden; 200; o 404 si no existe o no autorizado. |
| **Prioridad** | Alta. |

### 3.2.19 RF-19 — Actualización de estado de orden (admin)

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

### 3.2.21 RF-21 — Integración Wompi: métodos de pago y transacciones

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

### 3.2.23 RF-23 — Movimientos de inventario

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | id_producto, tipo de movimiento (entrada/salida/ajuste), cantidad, referencia opcional. |
| **Proceso** | Validación; permisos Admin/Employee; actualización de stock; registro del movimiento. |
| **Salida** | Movimiento registrado y stock actualizado; 200/201; o 400 si cantidad inválida. |
| **Prioridad** | Alta. |

### 3.2.24 RF-24 — Descuentos: CRUD y aplicación

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | CRUD de descuentos (por producto, categoría, usuario, cupón); en checkout: cupón o identificación de descuento aplicable. |
| **Proceso** | Validación de vigencia y reglas; persistencia (admin); cálculo aplicado en carrito/orden. |
| **Salida** | Descuento(s) o importe descontado; códigos HTTP apropiados. |
| **Prioridad** | Alta. |

### 3.2.25 RF-25 — Puntos: acumulación y consulta

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

### 3.2.27 RF-27 — Favoritos: agregar y quitar

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

### 3.2.29 RF-29 — Envío de emails transaccionales

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Evento (registro, orden creada, estado de orden, recuperación de contraseña); datos del destinatario y del evento. |
| **Proceso** | Renderizado de plantilla (Jinja2); envío vía Resend; registro de envío o error si aplica. |
| **Salida** | Email enviado; respuesta Resend; no debe bloquear operación crítica si Resend falla (degradación controlada). |
| **Prioridad** | Alta. |

### 3.2.30 RF-30 — Dashboard y analytics (admin)

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Usuario Admin/Employee; parámetros de período o filtros si aplica. |
| **Proceso** | Cálculo o lectura de KPIs (ventas, órdenes, productos, ingresos); uso de vistas materializadas o consultas optimizadas si existen. |
| **Salida** | Datos de dashboard/analytics; 200; o 403 si no autorizado. |
| **Prioridad** | Media. |

### 3.2.31 RF-31 — Gestión de usuarios (admin)

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | CRUD de usuarios; asignación de rol (Admin, Employee, Customer). |
| **Proceso** | Solo Admin (o Admin/Employee según política); validación; persistencia; no permitir eliminación de último admin si aplica. |
| **Salida** | Usuario(s) o listado; códigos HTTP apropiados. |
| **Prioridad** | Alta. |

### 3.2.32 RF-32 — Protección de rutas por autenticación y rol

| Atributo | Descripción |
|----------|-------------|
| **Entrada** | Petición HTTP a ruta protegida; token JWT (o ausencia); rol del usuario. |
| **Proceso** | Middleware o dependencias: validar JWT; comprobar rol según política de la ruta (admin_only_paths, protected_paths). |
| **Salida** | Petición permitida (200 u otra respuesta del recurso) o 401/403 con mensaje verificable. |
| **Prioridad** | Alta. |

Los requisitos funcionales que dependan de CMS, comentarios u órdenes a proveedores se documentan de forma análoga (CRUD, entradas/salidas verificables) y se numeran en continuidad (RF-33, RF-34, …) si se desea trazabilidad exhaustiva.

## 3.3 Requisitos no funcionales

### 3.3.1 Requisitos de rendimiento

Especificación de los requisitos relacionados con la carga que debe soportar el sistema. Deben ser mesurables.

| Id. | Requisito | Criterio de verificación |
|-----|-----------|--------------------------|
| **RNF-01** | El 95% de las peticiones a la API deben completarse en menos de 500 ms bajo carga normal de la instancia. | Medición con herramienta de carga o APM; percentil P95 de latencia por endpoint o global. |
| **RNF-07** | El frontend debe ser utilizable en navegadores modernos (Chrome, Firefox, Safari, Edge) con JavaScript habilitado. | Pruebas manuales o automatizadas en dichos navegadores; sin dependencias de APIs obsoletas. |

### 3.3.2 Seguridad

Protección del software frente a accesos, usos y sabotajes maliciosos, y modificaciones o destrucciones accidentales o maliciosas.

| Id. | Requisito | Criterio de verificación |
|-----|-----------|--------------------------|
| **RNF-02** | Las contraseñas deben almacenarse con hash Argon2 (pwdlib). Los tokens de sesión deben ser JWT firmados con algoritmo y secret configurados. | Revisión de código (jwt_utils, modelos de usuario); no almacenamiento de contraseña en claro. |
| **RNF-03** | Todas las entradas de usuario y parámetros de API deben validarse con esquemas Pydantic antes de su uso en lógica o BD. | Revisión de routers y schemas; rechazo 422 con detalle de validación ante datos inválidos. |
| **RNF-04** | La API debe aplicar CORS y middleware de seguridad (cabeceras, saneamiento) según configuración del proyecto. | Revisión de main.py y SecurityMiddleware; pruebas de cabeceras en respuestas. |

### 3.3.3 Fiabilidad

Factores de fiabilidad necesarios del sistema (tiempo entre incidentes permisibles, total de incidentes permisible).

| Id. | Requisito | Criterio de verificación |
|-----|-----------|--------------------------|
| **RNF-06** | Operaciones que modifiquen carrito (migración), stock (orden, movimiento) u órdenes deben ejecutarse en transacciones atómicas (BD o servicio). | Revisión de servicios y funciones almacenadas; pruebas de rollback ante fallo. |
| **RNF-09** | El carrito anónimo debe identificarse mediante un session_id con formato UUID v4, generado en el cliente y persistido (ej. localStorage) de forma coherente con el backend. | Revisión de cart-store y endpoints de carrito; migración anónimo→usuario sin pérdida de ítems. |

### 3.3.4 Disponibilidad

Factores de disponibilidad exigidos al sistema (% de tiempo en que el software debe estar disponible).

| Id. | Requisito | Criterio de verificación |
|-----|-----------|--------------------------|
| **RNF-05** | La API debe responder a solicitudes de salud (ej. GET /) para comprobar que la instancia está en ejecución. | Petición GET al endpoint raíz; respuesta 200 en tiempo razonable. |

### 3.3.5 Mantenibilidad

Tipo de mantenimiento necesario, quién debe realizarlo y cuándo.

- **Mantenimiento correctivo:** Corrección de defectos; lo realiza el equipo de desarrollo.
- **Mantenimiento evolutivo:** Nuevas funcionalidades; lo realiza el equipo de desarrollo según priorización.
- **Mantenimiento de datos:** Backups de BD por instancia; responsabilidad del gestor de la instancia o del proveedor de hosting.
- **RNF-10:** Las operaciones críticas deben registrarse con timestamp y usuario responsable para auditoría; revisión de esquema de BD y lógica de servicios.

### 3.3.6 Portabilidad

Atributos del software para facilitar su traslado a otras plataformas u entornos.

- Stack independiente de infraestructura concreta: backend Python/FastAPI, frontend Next.js, BD PostgreSQL. No se utiliza Docker ni Traefik en el stack actual; el despliegue puede realizarse en VPS/servidor propio (venv, systemd, nginx) o en PaaS (Railway, Vercel, etc.).
- Configuración mediante variables de entorno; sin dependencias de sistema operativo o hardware específicos más allá de PostgreSQL, Python 3.13+ y Node.js 18+.

### 3.3.7 Frontend: manejo de errores y estados de carga

| Id. | Requisito | Criterio de verificación |
|-----|-----------|--------------------------|
| **RNF-08** | Las pantallas que consuman API deben mostrar estados de carga y mensajes de error comprensibles ante fallos de red o respuestas 4xx/5xx. | Revisión de hooks y componentes; pruebas simulando error de API. |

## 3.4 Otros requisitos

- **Requisitos legales:** Cumplimiento GDPR (cookies, consentimiento, datos personales, derecho al olvido, portabilidad). PCI-DSS nivel 1 mediante integración con Wompi; el sistema no almacena datos de tarjetas; tokenización vía Wompi.
- **Requisitos culturales/idioma:** El frontend y los mensajes de error deben ser coherentes con la configuración de idioma de la instancia (i18n si aplica).
- **Retención de datos:** Datos de facturación y auditoría según legislación aplicable; operaciones críticas con timestamp y usuario responsable (RNF-10).

---

# 4. Apéndices

Pueden contener información relevante para la SRS que no forme parte estructural del documento:

- **Esquema de base de datos:** Referencia a synkro_ecommerce/db/docs/ y a db_synkro.sql para el detalle de tablas, funciones almacenadas, triggers y vistas.
- **Documentación de API:** Referencia a la documentación OpenAPI/Swagger generada por FastAPI (endpoints, schemas).
- **Glosario ampliado:** Términos de dominio (orden, carrito, línea de carrito, payment source, etc.) pueden ampliarse en un apéndice si se requiere.

---

# 5. Gestión de pruebas

Cada RF debe tener al menos un caso de prueba que verifique Entrada/Proceso/Salida. Cada RNF debe tener un criterio de verificación aplicable. Las pruebas de API se ejecutan contra el backend con BD de prueba; las pruebas E2E contra frontend y backend integrados cuando sea posible.

## 5.1 Pruebas realizadas a la base de datos

**Pruebas de completitud de datos:** Comprobar que todos los datos necesarios estén presentes y que no falte información crítica. Verificar que todos los registros, campos y atributos estén presentes y se rellenan con los valores adecuados.

**Pruebas de coherencia de los datos:** Garantizar que los datos de distintas tablas o sistemas sean coherentes y sigan las mismas reglas (integridad referencial, estados de orden, stock vs. movimientos de inventario).

**Prueba de precisión de datos:** Verificar que los datos representen con exactitud las entidades del mundo real (precios, cantidades, totales calculados correctamente).

**Pruebas de integridad de datos:** Garantizar que los datos permanezcan inalterados y mantengan coherencia y exactitud a lo largo del ciclo de vida (transacciones atómicas, no corrupción ante fallos).

**Pruebas de validación de datos:** Verificar que los datos introducidos cumplan las normas y requisitos predefinidos (esquemas Pydantic, restricciones de BD, formatos y rangos).

## 5.2 Pruebas de interfaz de usuario

1. **Pruebas visuales:** Verificar layout responsive en diferentes resoluciones; validar consistencia de colores, fuentes y espaciados; comprobar que imágenes y recursos se carguen correctamente.
2. **Pruebas funcionales:** Validar formularios (inputs, validaciones, mensajes de error); verificar navegación y enlaces; probar interacciones (clicks, hover, carrito, favoritos); validar comportamiento de modales, dropdowns, tooltips.
3. **Pruebas cross-browser:** Chrome, Firefox, Safari, Edge; versiones móviles.
4. **Pruebas de accesibilidad:** Herramientas como axe-core, WAVE, Lighthouse; validar navegación por teclado; verificar atributos ARIA.
5. **Pruebas de performance:** Lighthouse (Google), WebPageTest, GTmetrix.

## 5.3 Pruebas de seguridad

Buscar posibles errores de gestión de software basado en red, alineados con OWASP:

- Inyección (SQL, LDAP, NoSQL)
- Autenticación rota y gestión de sesiones
- Exposición de datos sensibles (PII, contraseñas)
- Entidades externas XML (XXE)
- Control de acceso roto (Broken Access Control)
- Configuración de seguridad incorrecta
- Cross-Site Scripting (XSS)
- Deserialización insegura
- Uso de componentes con vulnerabilidades conocidas

## 5.4 Relación requisitos — pruebas

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

## 5.5 Trazabilidad

- **Diseño:** Cada RF/RNF debe poder asociarse a módulos de diseño (routers, services, esquema BD).
- **Código:** Los identificadores RF-xx y RNF-xx pueden referenciarse en comentarios, issues o casos de prueba para mantener trazabilidad.
- **Pruebas:** Cada caso de prueba debe indicar el requisito que verifica (RF-xx o RNF-xx).

---

*Fin del documento. Los placeholders [VERSION] y [FECHA] deben reemplazarse al publicar la versión definitiva.*
