# Especificación de Requisitos de Software - Revital

**Versión:** [VERSION]  
**Fecha:** [FECHA]

---

# 1. Introducción

## 1.1 Propósito

Este documento es la Especificación de Requisitos de Software (SRS) del producto **Revital**, versión [VERSION], y define de forma completa y verificable los requisitos funcionales y no funcionales del sistema. El propósito del documento es:

- Servir como contrato técnico entre los stakeholders y el equipo de desarrollo.
- Proporcionar la base para el diseño, la implementación y las pruebas del software.
- Permitir la trazabilidad entre requisitos, diseño y casos de prueba.
- Facilitar la validación y la aceptación del producto.

**Audiencia prevista:** Equipo de desarrollo, aseguramiento de calidad, gestores de proyecto y stakeholders técnicos con capacidad de validar el cumplimiento de los requisitos.

## 1.2 Alcance

**Nombre del producto:** Revital — Plataforma SaaS de e-commerce por instancias.

**Descripción breve:** Revital es una plataforma SaaS de comercio electrónico en la que cada cliente recibe una **instancia aislada** del software: aplicación de e-commerce dedicada, base de datos PostgreSQL propia e infraestructura de despliegue independiente. La plataforma consta de dos aplicaciones diferenciadas:

| Aplicación | Propósito | Alcance del SRS |
|------------|-----------|------------------|
| **revital_ecommerce** | Aplicación de e-commerce desplegada una vez por cada cliente SaaS (catálogo, carrito, órdenes, pagos, puntos, inventario, emails, analytics). | Incluido |
| **revital_panel** | Aplicación central de gestión SaaS: landing de marketing, registro, gestión de instancias, clientes, planes, suscripciones, facturación, dominios y uso de recursos. | Incluido |

**Dentro del alcance de este SRS:**

- Requisitos funcionales y no funcionales de revital_ecommerce (backend FastAPI, frontend Next.js 15, base de datos PostgreSQL por instancia).
- Requisitos funcionales y no funcionales de revital_panel (backend FastAPI, frontend Next.js 15, base de datos PostgreSQL central).
- Interacción entre ambas aplicaciones en el flujo de registro, creación de instancias y gestión de suscripciones.
- Restricciones técnicas, de seguridad y operativas derivadas del modelo de instancias aisladas.

**Fuera del alcance de este SRS:**

- Detalle de la infraestructura de despliegue (Docker, Traefik, VPS) y procedimientos de operación.
- Requisitos de negocio de comercialización o marketing no implementados en el software.
- Herramientas de desarrollo, CI/CD y configuración de entornos de desarrollo.

## 1.3 Definiciones, siglas y abreviaturas

| Término | Definición |
|---------|------------|
| **SaaS** | Software as a Service. Modelo de entrega en el que el software se ofrece como servicio bajo suscripción. |
| **Instancia** | Despliegue completo e independiente de revital_ecommerce para un único cliente, con base de datos y configuración propias. |
| **JWT** | JSON Web Token. Mecanismo de autenticación y autorización utilizado en los backends. |
| **API** | Application Programming Interface. Conjunto de endpoints REST expuestos por los backends FastAPI. |
| **RF** | Requisito Funcional. Identificador numérico de requisitos funcionales (ej.: RF-01). |
| **RNF** | Requisito No Funcional. Identificador numérico de requisitos no funcionales (ej.: RNF-01). |
| **SRS** | Software Requirements Specification. Este documento. |
| **BD** | Base de datos. |
| **ORM** | Object-Relational Mapping (SQLAlchemy en este proyecto). |

## 1.4 Referencias

| Identificador | Documento o recurso |
|---------------|---------------------|
| IEEE 830-1998 | IEEE Recommended Practice for Software Requirements Specifications. |
| [README] | README.md del repositorio Revital — descripción del proyecto, estado actual y arquitectura. |
| [AGENTS] | AGENTS.md — guía de componentes y convenciones del repositorio. |
| [DOCS] | Carpeta docs/ — documentación técnica (arquitectura, integraciones, guías de implementación). |

## 1.5 Visión general del documento

El resto del documento se estructura como sigue:

- **Sección 2 — Descripción general:** Perspectiva del producto, funciones de alto nivel, características de los usuarios, restricciones, supuestos y dependencias.
- **Sección 3 — Requisitos específicos:** Requisitos funcionales (RF) y no funcionales (RNF) detallados, con entradas, procesos y salidas donde corresponda; priorización y trazabilidad.
- **Sección 4 — Gestión de pruebas:** Criterios de aceptación y relación entre requisitos y pruebas.

Los requisitos se numeran de forma única (RF-01, RF-02, …; RNF-01, RNF-02, …) para permitir trazabilidad con diseño, código y casos de prueba.

---

# 2. Descripción General

## 2.1 Perspectiva del producto

Revital es una plataforma SaaS de e-commerce que opera bajo un modelo de **instancias completamente aisladas**. El sistema consta de dos aplicaciones independientes que interactúan de forma coordinada:

- **revital_ecommerce**: Aplicación de e-commerce desplegada una vez por cada cliente SaaS. Cada instancia opera de forma independiente con su propia base de datos PostgreSQL, configuración y dominio.

- **revital_panel**: Aplicación central de gestión SaaS que permite a Revital administrar todas las instancias de clientes, suscripciones, facturación y el proceso de onboarding.

### Relación con sistemas externos

El sistema interactúa con los siguientes servicios externos mediante APIs REST:

| Sistema externo | Propósito | Aplicación que lo utiliza | Tipo de integración |
|-----------------|-----------|---------------------------|---------------------|
| **Wompi** | Procesamiento de pagos con tarjetas de crédito/débito | revital_ecommerce | API REST + Webhooks |
| **Resend** | Envío de emails transaccionales (confirmaciones, notificaciones) | revital_ecommerce | API REST |
| **Cloudinary** | Almacenamiento y transformación de imágenes de productos | revital_ecommerce | API REST (opcional) |

### Arquitectura de instancias aisladas

Cada cliente SaaS recibe un despliegue completo e independiente de revital_ecommerce que incluye:

- **Base de datos PostgreSQL dedicada**: Esquema completo con 30+ tablas, funciones almacenadas, triggers y vistas materializadas.
- **Backend FastAPI independiente**: API REST con 24+ routers, configuración propia mediante variables de entorno.
- **Frontend Next.js 15 independiente**: Interfaz de tienda y dashboard administrativo con configuración específica del cliente.
- **Dominio personalizado**: Cada instancia puede operar bajo su propio dominio (ej: tienda-cliente.com).
- **Credenciales únicas**: JWT secrets, tokens de servicios externos (Wompi, Resend) y configuraciones específicas por cliente.

**Nota**: revital_panel almacena únicamente metadatos sobre las instancias (configuración, planes, suscripciones) en una base de datos PostgreSQL centralizada. No accede a los datos de e-commerce de los clientes.

## 2.2 Funciones del producto

### Funciones de revital_ecommerce

Las funciones principales de revital_ecommerce se agrupan en los siguientes módulos:

#### Autenticación y autorización
- Registro de usuarios con validación de datos.
- Inicio de sesión con JWT (access token y refresh token).
- Gestión de roles: Admin (id_rol: 1), Employee (id_rol: 2), Customer (id_rol: 3).
- Middleware de autenticación y autorización por roles.
- Recuperación de contraseña mediante email.

#### Gestión de catálogo de productos
- CRUD completo de productos (crear, leer, actualizar, eliminar).
- Sistema de filtros avanzados con función de base de datos optimizada.
- Búsqueda en tiempo real con autocompletado.
- Gestión de imágenes de productos (subida, transformación, optimización).
- Gestión de atributos y variantes de productos.
- Sistema de categorías jerárquico de tres niveles: Categorías → Líneas → Sublíneas.
- Gestión de marcas y proveedores.

#### Gestión de carrito de compras
- Carrito persistente para usuarios anónimos (identificado por session_id UUID v4).
- Carrito persistente para usuarios autenticados (identificado por id_usuario).
- Migración automática de carrito anónimo a usuario autenticado.
- Cálculo automático de totales, descuentos e impuestos.
- Validación de stock en tiempo real.
- Límites configurables por plan de suscripción.

#### Procesamiento de órdenes
- Creación de órdenes desde el carrito.
- Validación de stock y disponibilidad antes de confirmar orden.
- Gestión de estados de orden (pendiente, confirmada, en proceso, enviada, completada, cancelada).
- Tracking de órdenes en tiempo real.
- Historial de órdenes por usuario.
- Gestión de direcciones de envío.

#### Integración de pagos
- Tokenización de tarjetas mediante Wompi (frontend).
- Creación y gestión de métodos de pago guardados.
- Procesamiento de transacciones mediante Wompi API.
- Manejo de webhooks de Wompi para sincronización de estados.
- Validación de firmas HMAC en webhooks.

#### Gestión de inventario
- Control de stock por producto.
- Movimientos de inventario (entradas, salidas, ajustes).
- Alertas de stock bajo.
- Historial de movimientos de inventario.

#### Sistema de fidelidad y descuentos
- Acumulación de puntos por compras.
- Canje de puntos por productos o descuentos.
- Descuentos por producto, categoría o usuario.
- Cupones de descuento con validación de vigencia y límites de uso.
- Descuentos automáticos aplicables según reglas de negocio.

#### Gestión de usuarios y roles
- CRUD de usuarios con perfiles completos.
- Asignación y gestión de roles.
- Perfiles de usuario con información personal y preferencias.
- Sistema de favoritos de productos.

#### Analytics y reportes
- Dashboard administrativo con KPIs principales.
- Métricas de ventas, productos más vendidos, ingresos.
- Reportes de inventario y movimientos.
- Vistas materializadas para consultas optimizadas.

#### Emails transaccionales
- Envío de emails de confirmación de registro.
- Confirmación de órdenes y cambios de estado.
- Notificaciones de recuperación de contraseña.
- Emails personalizados con templates HTML (Jinja2).
- Integración con Resend para envío de emails.

### Funciones de revital_panel

Las funciones principales de revital_panel se agrupan en los siguientes módulos:

#### Landing page y marketing
- Página de inicio con hero section y call-to-action.
- Sección de características del producto.
- Comparación de planes de suscripción (Starter, Business, Enterprise).
- Página de preguntas frecuentes (FAQ).
- Formulario de contacto.

#### Registro y onboarding de clientes
- Registro de nuevos clientes (empresas).
- Validación de datos de empresa e identificación fiscal.
- Selección de plan de suscripción inicial.
- Configuración inicial de credenciales de acceso.

#### Gestión de instancias
- Creación de nuevas instancias de revital_ecommerce.
- Configuración de instancias (variables de entorno, credenciales).
- Monitoreo del estado de instancias (activa, inactiva, en mantenimiento).
- Gestión de deployments (configuración de infraestructura por cliente).

#### Gestión de planes y suscripciones
- CRUD de planes de suscripción (Starter, Business, Enterprise).
- Definición de límites por plan (productos, usuarios, recursos).
- Creación y activación de suscripciones.
- Cambio de planes de suscripción.
- Historial de cambios de plan por cliente.

#### Facturación y pagos
- Generación de facturas recurrentes según plan.
- Gestión de pagos recurrentes.
- Historial de facturación por cliente.
- Estados de facturación (pendiente, pagada, vencida, cancelada).

#### Gestión de dominios
- Asociación de dominios personalizados a instancias.
- Configuración de DNS y certificados SSL.
- Validación de propiedad de dominio.

#### Monitoreo y analytics de plataforma
- Tracking de uso de recursos por instancia (CPU, memoria, almacenamiento, requests).
- Dashboard de métricas de la plataforma completa.
- Alertas por uso excesivo de recursos.
- Reportes de uso por cliente y plan.

#### Gestión de usuarios del panel
- CRUD de administradores de Revital (admin_revital, soporte, ventas).
- Autenticación unificada para admins y clientes.
- Control de acceso basado en roles para operaciones administrativas.

## 2.3 Características del usuario

El sistema está diseñado para los siguientes tipos de usuarios:

| Tipo de usuario | Descripción | Experiencia técnica esperada | Aplicación | Roles/Permisos |
|-----------------|-------------|------------------------------|------------|----------------|
| **Administrador de tienda** | Usuario responsable de gestionar completamente una instancia de e-commerce (productos, órdenes, inventario, usuarios). | Conocimientos técnicos básicos de e-commerce y gestión de inventario. Familiaridad con interfaces web administrativas. | revital_ecommerce | Admin (id_rol: 1) - Acceso completo a todas las funcionalidades administrativas. |
| **Empleado de tienda** | Usuario con permisos limitados para gestionar productos y órdenes bajo supervisión del administrador. | Conocimientos básicos de gestión de productos y órdenes. | revital_ecommerce | Employee (id_rol: 2) - Acceso limitado a gestión de productos y órdenes, sin acceso a configuración del sistema. |
| **Cliente final** | Usuario que navega y realiza compras en la tienda online. | Conocimientos básicos de navegación web y compras online. | revital_ecommerce | Customer (id_rol: 3) - Acceso a catálogo, carrito, checkout, perfil y órdenes propias. |
| **Super administrador de Revital** | Usuario interno de Revital con acceso completo a la plataforma SaaS para gestionar todas las instancias. | Conocimientos técnicos avanzados de administración de sistemas SaaS, bases de datos y deployments. | revital_panel | admin_revital - Acceso completo a gestión de instancias, clientes, planes, facturación y usuarios del panel. |
| **Soporte técnico** | Usuario interno de Revital para brindar soporte a clientes y gestionar incidencias. | Conocimientos técnicos de troubleshooting y gestión de incidencias. | revital_panel | soporte - Acceso a visualización de instancias y clientes, sin permisos de facturación o cambios de plan. |
| **Ventas** | Usuario interno de Revital para gestionar clientes potenciales y suscripciones. | Conocimientos de gestión comercial y CRM. | revital_panel | ventas - Acceso a gestión de clientes y suscripciones, sin acceso a configuración técnica de instancias. |
| **Cliente SaaS** | Representante de empresa que contrata el servicio y gestiona su suscripción, facturación y configuración de dominio. | Conocimientos básicos de gestión de suscripciones y facturación online. | revital_panel | cliente - Acceso limitado a su propia información de suscripción, facturación, dominio y uso de recursos. |

**Nota sobre usuarios anónimos**: El sistema permite que usuarios no autenticados naveguen el catálogo y agreguen productos al carrito. Estos usuarios se identifican mediante un `session_id` (UUID v4) almacenado en el navegador. No se consideran un tipo de usuario con rol, sino una sesión temporal.

## 2.4 Restricciones

### Restricciones técnicas

#### Stack tecnológico fijo
- **Backend**: FastAPI con Python 3.13 o superior. No se admite migración a otros frameworks o versiones anteriores de Python.
- **Frontend**: Next.js 15 o superior con React 19 y TypeScript. No se admite migración a otros frameworks frontend.
- **Base de datos**: PostgreSQL 15 o superior. No se admite migración a otros sistemas de gestión de bases de datos.
- **ORM**: SQLAlchemy como capa de abstracción de base de datos. No se admite cambio a otros ORMs.

#### Modelo de arquitectura
- **Instancias aisladas**: El sistema debe operar bajo el modelo de instancias completamente aisladas. No se admite implementación de arquitectura multi-tenant con base de datos compartida.
- **Base de datos dedicada**: Cada instancia de revital_ecommerce debe tener su propia base de datos PostgreSQL. No se admite compartir bases de datos entre instancias.
- **Despliegue independiente**: Cada instancia requiere un despliegue independiente. No se admite despliegue compartido de múltiples instancias en un mismo proceso.

#### Autenticación y seguridad
- **JWT obligatorio**: El sistema debe utilizar JWT (JSON Web Token) para autenticación. No se admite OAuth 2.0, SAML u otros protocolos de autenticación federada.
- **Argon2 para contraseñas**: Las contraseñas deben almacenarse con hash Argon2 mediante la librería pwdlib. No se admite uso de otros algoritmos de hash.
- **HTTPS obligatorio**: Todas las comunicaciones deben realizarse sobre HTTPS en producción. No se admite HTTP sin cifrado.

#### Integraciones externas
- **Wompi para pagos**: El procesamiento de pagos debe realizarse mediante la integración con Wompi. No se admite integración con otras pasarelas de pago sin modificación del código.
- **Resend para emails**: El envío de emails transaccionales debe realizarse mediante Resend. No se admite cambio a otros proveedores sin modificación del código.

#### Rendimiento y escalabilidad
- **Tiempo de respuesta de API**: Los endpoints de la API deben responder en menos de 500ms para el 95% de las peticiones bajo carga normal.
- **Concurrencia**: El sistema debe soportar al menos 100 peticiones concurrentes por instancia sin degradación significativa del rendimiento.
- **Escalabilidad horizontal**: El modelo de instancias aisladas permite escalado horizontal agregando nuevas instancias, pero cada instancia individual debe escalar verticalmente (más recursos por instancia).

### Restricciones legales y de cumplimiento

#### Protección de datos personales
- **GDPR**: El sistema debe cumplir con el Reglamento General de Protección de Datos (GDPR) de la Unión Europea. Esto incluye:
  - Consentimiento explícito para cookies y tracking.
  - Derecho al olvido (eliminación de datos personales).
  - Portabilidad de datos.
  - Notificación de brechas de seguridad.
- **Datos personales**: Los datos personales de usuarios (nombres, emails, direcciones, información de pago) deben almacenarse de forma segura y solo ser accesibles por personal autorizado.

#### Seguridad de pagos
- **PCI-DSS**: El sistema debe cumplir con los estándares PCI-DSS (Payment Card Industry Data Security Standard) nivel 1 mediante la integración con Wompi. El sistema no almacena datos de tarjetas de crédito; estos se tokenizan mediante Wompi.

#### Retención de datos
- **Facturación**: Los datos de facturación deben retenerse según la legislación fiscal aplicable (típicamente 5-7 años).
- **Auditoría**: Todas las operaciones críticas (creación de órdenes, cambios de inventario, modificaciones de usuarios) deben registrarse con timestamps y usuario responsable para auditoría.

### Restricciones operativas

#### Deployment y configuración
- **Despliegue por instancia**: Cada cliente requiere un despliegue separado de revital_ecommerce. No se puede compartir un único despliegue para múltiples clientes.
- **Configuración por cliente**: Cada instancia debe tener su propio archivo de configuración (variables de entorno) con credenciales únicas para servicios externos.
- **Dominios personalizados**: Cada instancia puede operar bajo su propio dominio, requiriendo configuración de DNS y certificados SSL por cliente.

#### Mantenimiento y actualizaciones
- **Actualizaciones coordinadas**: Las actualizaciones del código deben aplicarse a todas las instancias de forma coordinada, pero cada instancia puede tener su propia ventana de mantenimiento.
- **Backups independientes**: Cada instancia requiere su propio proceso de backup de base de datos. No se puede realizar backup centralizado de múltiples instancias.

#### Monitoreo y soporte
- **Monitoreo por instancia**: Cada instancia debe ser monitoreada de forma independiente. revital_panel puede agregar métricas de todas las instancias, pero el monitoreo detallado es por instancia.
- **Soporte técnico**: El soporte técnico debe poder acceder a instancias individuales sin afectar otras instancias.

## 2.5 Supuestos y dependencias

### Supuestos

#### Supuestos sobre los usuarios
- Los administradores de tienda tienen conocimientos básicos de gestión de e-commerce y pueden utilizar interfaces web administrativas sin capacitación extensiva.
- Los clientes finales tienen acceso a navegadores web modernos (Chrome, Firefox, Safari, Edge) con JavaScript habilitado.
- Los clientes SaaS tienen capacidad técnica básica para gestionar su suscripción, facturación y configuración de dominio mediante el panel web.

#### Supuestos sobre la infraestructura
- Existe infraestructura de deployment disponible (Docker, servidores VPS o cloud) para desplegar instancias de revital_ecommerce.
- Cada instancia tendrá acceso a recursos computacionales suficientes (CPU, memoria, almacenamiento) según su plan de suscripción.
- Existe conectividad de red estable entre las instancias y los servicios externos (Wompi, Resend).

#### Supuestos sobre servicios externos
- Wompi estará disponible y operativo durante las horas de operación de las tiendas. El sistema debe manejar fallos temporales de Wompi de forma degradada.
- Resend estará disponible para el envío de emails transaccionales. El sistema debe manejar fallos temporales de Resend sin bloquear operaciones críticas.
- Los servicios externos mantendrán sus APIs estables o proporcionarán aviso previo de cambios que requieran actualización del código.

#### Supuestos sobre el negocio
- Los clientes SaaS contratarán planes de suscripción con límites claros (productos, usuarios, recursos) que el sistema debe hacer cumplir.
- El proceso de onboarding de nuevos clientes incluirá la configuración inicial de credenciales y servicios externos antes de activar la instancia.

### Dependencias

#### Dependencias de servicios externos

| Servicio | Versión/API | Propósito | Impacto de fallo |
|----------|-------------|-----------|------------------|
| **Wompi API** | API REST v1 | Procesamiento de pagos con tarjetas | Crítico: Las órdenes no pueden completarse sin procesamiento de pagos. El sistema debe manejar fallos degradando la funcionalidad de checkout. |
| **Resend API** | API REST v1 | Envío de emails transaccionales | Moderado: Los emails pueden retrasarse, pero las operaciones críticas (creación de órdenes) no deben bloquearse. |
| **Cloudinary API** | API REST (opcional) | Almacenamiento y transformación de imágenes | Bajo: El sistema puede funcionar sin Cloudinary utilizando almacenamiento local o alternativo. |

#### Dependencias de infraestructura

| Componente | Versión mínima | Propósito | Impacto de fallo |
|-----------|----------------|-----------|------------------|
| **PostgreSQL** | 15.0 | Base de datos relacional para almacenamiento persistente | Crítico: Sin base de datos, el sistema no puede operar. |
| **Python** | 3.13 | Runtime para backend FastAPI | Crítico: Sin Python, el backend no puede ejecutarse. |
| **Node.js** | 18.0 | Runtime para frontend Next.js | Crítico: Sin Node.js, el frontend no puede construirse ni ejecutarse. |

#### Dependencias de bibliotecas y frameworks

**Backend (Python)**:
- FastAPI: Framework web ASGI para API REST.
- SQLAlchemy: ORM para acceso a base de datos.
- Pydantic: Validación y serialización de datos.
- python-jose: Creación y verificación de tokens JWT.
- pwdlib: Hash de contraseñas con Argon2.
- Jinja2: Renderizado de templates de email.
- requests: Cliente HTTP para llamadas a APIs externas.

**Frontend (TypeScript/JavaScript)**:
- Next.js 15: Framework React con App Router.
- React 19: Biblioteca para construcción de interfaces de usuario.
- TypeScript: Lenguaje de programación con tipado estático.
- Axios: Cliente HTTP para llamadas a API.
- TanStack React Query: Gestión de estado del servidor y cache.
- Zustand: Gestión de estado global del cliente.
- Tailwind CSS: Framework de estilos utilitarios.
- shadcn/ui: Componentes UI reutilizables.

**Nota sobre dependencias opcionales**: Cloudinary es una dependencia opcional. El sistema puede funcionar sin Cloudinary utilizando almacenamiento local de imágenes o integración con otros servicios de almacenamiento.

#### Dependencias de herramientas de desarrollo (fuera del alcance del SRS)

Las siguientes herramientas se utilizan para desarrollo y deployment, pero no son requisitos del sistema en producción:
- Docker: Containerización para deployment (ver Sección 1.2 - Fuera del alcance).
- pnpm: Gestor de paquetes para frontend (alternativa a npm/yarn).
- Git: Control de versiones del código fuente.
