# MANUAL TECNICO
**Compralo e-commerce**

Kevin Daniel Bermúdez Calderón
Alejandro Hernández Lara
Jhoan Camilo Suárez Mora

**SERVICIO NACIONAL DE APRENDIZAJE S.E.N.A.**
**CENTRO DE SERVICIOS EMPRESARIALES Y TURÍSTICOS**
**REGIONAL SANTANDER**
**BUCARAMANGA**

---


- [INTRODUCCIÓN](#introducción)
- [Descripción de la problemática](#descripción-de-la-problemática)
- [OBJETIVOS](#objetivos)
- [OBJETIVO GENERAL DEL SISTEMA](#objetivo-general-del-sistema)
- [OBJETIVOS ESPECÍFICOS](#objetivos-específicos)
- [Información del Proyecto](#información-del-proyecto)
- [Justificación del proyecto o software](#justificación-del-proyecto-o-software)
- [CONTENIDO TÉCNICO](#contenido-técnico)
  - [2.1. DESCRIPCIÓN DE LOS PROCESOS](#21-descripción-de-los-procesos)
  - [2.2. DIAGRAMAS UML](#22-diagramas-uml)
  - [2.3. DESCRIPCIÓN DE CAMPOS REQUERIDOS POR PANTALLA](#23-descripción-de-campos-requeridos-por-pantalla)
  - [2.4. PLATAFORMA DE USUARIO](#24-plataforma-de-usuario)
  - [2.5. CASOS DE EXPERIENCIA](#25-casos-de-experiencia)
- [CONTENIDO DEL FUNCIONAMIENTO](#contenido-del-funcionamiento)
  - [3.1. MODELO LÓGICO DE DATOS, DIAGRAMA ENTIDAD-RELACIÓN Y PROCESOS](#31-modelo-lógico-de-datos-diagrama-entidad-relación-y-procesos)
  - [3.2. Interfaz Gráfica y Funcionalidad](#32-interfaz-gráfica-y-funcionalidad)
  - [3.3. Interfaz de usabilidad y accesibilidad](#33-interfaz-de-usabilidad-y-accesibilidad)
  - [3.4 Planificación y Control del Proyecto](#34-planificación-y-control-del-proyecto)
- [CONTENIDO DE PRUEBAS UNITARIAS](#contenido-de-pruebas-unitarias)
- [PREDISEÑOS DEL SOFTWARE](#prediseños-del-software)
- [Gestor de información final DEL PROYECTO](#gestor-de-información-final-del-proyecto)
- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Objetivos Cumplidos](#objetivos-cumplidos)
- [Entregables Principales del Desarrollo](#entregables-principales-del-desarrollo)
  - [Módulo de Gestión Académica](#módulo-de-gestión-académica)
  - [Portal Estudiantil Web/Móvil](#portal-estudiantil-webmóvil)
  - [Módulo Financiero](#módulo-financiero)
- [PRUEBAS FUNCIONALES DEL SOFTWARE](#pruebas-funcionales-del-software)
- [Testing summary](#testing-summary)
- [Description of testing information fields](#description-of-testing-information-fields)
- [Test case #1: Generación de BPIN proyecto form. Oficial](#test-case-1-generación-de-bpin-proyecto-form-oficial)
- [Test case #2](#test-case-2)
- [Test case #3](#test-case-3)
- [Test case #4](#test-case-4)
- [Test case #5](#test-case-5)
  - [1. Agujeros de seguridad internos](#1-agujeros-de-seguridad-internos)
  - [2. Vías en los procesos de codificación](#2-vías-en-los-procesos-de-codificación)
  - [3. Resultados esperados](#3-resultados-esperados)
  - [4. Declaraciones, objetos y funciones](#4-declaraciones-objetos-y-funciones)
  - [5. Funcionalidad de los bucles condicionales](#5-funcionalidad-de-los-bucles-condicionales)
- [SCRIPTS DE INSTALACIÓN Y DESPLIEGUE Y VINCULACIÓN DE OTROS COMPONENTES](#scripts-de-instalación-y-despliegue-y-vinculación-de-otros-componentes)
- [Scripts de instalación](#scripts-de-instalación)
- [Diagrama de despliegue](#diagrama-de-despliegue)
- [Diagrama de componentes](#diagrama-de-componentes)


## Introducción
Compralo es una instancia de comercio electrónico construida sobre la plataforma Revital.  
Combina un **backend FastAPI** y una **base de datos PostgreSQL** con un **frontend Next.js 15/React 19** para ofrecer una tienda en línea completa: catálogo, filtros avanzados, carrito de compras, gestión de pedidos y panel administrativo.

Este manual técnico describe la arquitectura de Compralo, sus componentes principales, el modelo de datos, los procesos de negocio y los procedimientos de despliegue.  
El objetivo es que cualquier desarrollador o equipo de soporte pueda **instalar, mantener, extender y diagnosticar** el sistema sin depender del equipo original.

## Descripción de la problemática
Los comercios pequeños y medianos de la región dependen en gran medida de la venta física en tienda y de canales informales (llamadas, redes sociales, mensajería instantánea).  
Esto genera problemas recurrentes:

- Dificultad para **mostrar el catálogo completo** y mantener precios e inventario actualizados.
- Procesos manuales de toma de pedidos, que provocan **errores en existencias, precios y datos de clientes**.
- Ausencia de un canal de venta digital unificado, lo que limita el alcance a clientes que prefieren comprar en línea.
- Falta de información consolidada sobre ventas, productos más demandados y comportamiento de los clientes.

Compralo nace como una solución lista para usar que digitaliza estos procesos y los centraliza en una única plataforma web.

## OBJETIVOS

### OBJETIVO GENERAL DEL SISTEMA
Desarrollar una **plataforma de comercio electrónico basada en instancias aisladas** que permita a comercios independientes publicar su catálogo, gestionar inventario y procesar pedidos y pagos de forma segura, manteniendo una experiencia de compra moderna para el cliente final.

### OBJETIVOS ESPECÍFICOS

- Implementar un **catálogo de productos** con categorías jerárquicas (categoría → línea → sublínea) y filtros avanzados por precio, marca, proveedor y atributos dinámicos.
- Proveer un **sistema de variantes** (color, talla, almacenamiento, RAM, etc.) con manejo de stock y precios por combinación.
- Desarrollar un **panel administrativo** para gestionar productos, categorías, marcas, proveedores, usuarios y descuentos.
- Integrar un **sistema de autenticación** con roles (Administrador, Empleado, Cliente) y protección de rutas tanto en backend como en frontend.
- Incorporar integración con **pasarela de pagos (Wompi)** y envío de **correos transaccionales** mediante Resend.
- Garantizar que la solución sea **multi‑instancia**, de forma que cada cliente tenga su propia base de datos y configuración aislada.

### Información del Proyecto

- **Nombre del proyecto:** Compralo – Instancia de Revital E‑Commerce  
- **Tipo de solución:** Plataforma web de comercio electrónico (backend + frontend)  
- **Alcance técnico:**  
  - Backend FastAPI (`revital_ecommerce/backend/`)  
  - Frontend Next.js 15 (`revital_ecommerce/frontend/`)  
  - Base de datos PostgreSQL (`revital_ecommerce/db/`)  
- **Equipo de desarrollo:**  
  - Kevin Daniel Bermúdez Calderón  
  - Alejandro Hernández Lara  
  - Jhoan Camilo Suárez Mora  
- **Entidad formadora:** Servicio Nacional de Aprendizaje – SENA, Centro de Servicios Empresariales y Turísticos – Regional Santander.  

### Justificación del proyecto o software

El auge del comercio electrónico ha generado una brecha entre grandes plataformas y comercios locales que no cuentan con equipos técnicos ni presupuestos altos para construir su propia solución desde cero.  
Compralo reduce esta barrera ofreciendo una **instancia de e‑commerce lista para desplegar**, con funcionalidades profesionales pero coste de implementación reducido.

El proyecto se justifica porque:

- Permite a los comercios **digitalizar su catálogo** y vender en línea sin tener que desarrollar software propio.
- Centraliza la información de productos, clientes y pedidos, facilitando decisiones basadas en datos.
- Aporta una base tecnológica reutilizable (Revital) que puede replicarse para múltiples comercios con configuración específica.

### Metodología de gestión

El desarrollo de Compralo se realizó siguiendo un enfoque **iterativo e incremental**, inspirado en Scrum:

- Organización del trabajo en **sprints cortos** (1–2 semanas).
- Uso de **issues y pull requests** en Git/GitHub para gestionar tareas, bugs y nuevas funcionalidades.
- Revisión de código entre pares para mantener la calidad y coherencia del estilo.
- Documentación técnica en Markdown dentro del propio repositorio (`Docs/`, `README.md`, SRS y guías de arquitectura).

Este enfoque permitió ir liberando versiones funcionales (MVP de catálogo, carrito, panel admin, etc.) y refinar el sistema a partir de pruebas y retroalimentación.

### Estructura organizacional del software

Aunque el equipo es reducido, el proyecto se organiza por **módulos técnicos** más que por roles tradicionales:

- **Backend E‑Commerce (`revital_ecommerce/backend`)**  
  - Módulos por dominio: autenticación, productos, categorías, carrito, órdenes, pagos, descuentos, inventario, comentarios, proveedores, marcas, direcciones, puntos de fidelidad.  
  - Cada módulo se estructura en **routers** (endpoints), **schemas** (validación de datos) y **services** (lógica de negocio).

- **Frontend E‑Commerce (`revital_ecommerce/frontend`)**  
  - Rutas agrupadas por contexto: `(shop)` (tienda pública), `(dashboard)` (panel admin), `(auth)` (autenticación).  
  - Componentes reutilizables en `components/`, hooks en `hooks/`, servicios de API en `services/` y tipos en `types/`.

- **Base de datos (`revital_ecommerce/db`)**  
  - Esquema SQL central (`db_revital.sql`) más funciones, triggers y vistas separadas por módulo.

Esta organización facilita que nuevos colaboradores puedan localizar rápidamente la lógica relacionada con un proceso concreto (por ejemplo, “carrito” o “descuentos”) y entender cómo viajan los datos desde la base de datos hasta la interfaz de usuario.


## CONTENIDO TECNICO
Esta sección describe la arquitectura técnica de Compralo, los procesos clave que implementa, los modelos de datos principales y las características de la interfaz de usuario desde una perspectiva de ingeniería.

### 2.1. DESCRIPCION DE LOS PROCESOS

Compralo automatiza los procesos principales de un flujo de comercio electrónico:

#### Proceso de exploración y búsqueda de productos

1. El usuario accede a la tienda (`/(shop)/products`).
2. El frontend consulta al backend los productos paginados y las opciones de filtro (`/products/filter/options` y `/products/filter`).
3. El usuario filtra por categoría, precio, marca, proveedor y atributos (color, almacenamiento, RAM, etc.).  
   Los filtros se aplican en el backend mediante funciones SQL (`fun_filter_products`) que calculan precio mínimo, stock total e imagen principal desde las combinaciones de variantes.

#### Proceso de compra (checkout simplificado)

1. El usuario autenticado o invitado agrega productos al carrito; cada ítem referencia una **combinación de variante** (`tab_product_variant_combinations.id`).
2. El backend valida stock y precio en tiempo real al agregar o actualizar cantidades.
3. En el checkout se confirman dirección de envío y método de pago.
4. El backend crea una orden, reserva stock, inicia el proceso de pago con Wompi y registra la transacción.
5. Una vez confirmado el pago, la orden pasa a estado “Pagada” y se envían notificaciones por correo.

#### Proceso de administración de catálogo

1. Un usuario con rol **Admin** ingresa al panel (`/(dashboard)/admin`).
2. Desde los módulos de productos, categorías, marcas y proveedores realiza altas, bajas y modificaciones.
3. El backend expone endpoints específicos (`/products-admin`, `/categories`, `/brands`, `/providers`) que usan servicios como `product_service.py` y `category_service.py`.
4. Los cambios impactan directamente el árbol de categorías (`tab_categories`), el catálogo de productos (`tab_products`) y las variantes relacionadas.

### 2.2. DIAGRAMAS UML

A nivel UML, Compralo puede describirse con los siguientes diagramas (mantenidos en la documentación técnica del proyecto):

- **Diagrama de casos de uso (alto nivel)**  
  - Actores principales: **Cliente**, **Administrador**, **Empleado**.  
  - Casos de uso clave: navegar catálogo, gestionar carrito, realizar pedido, gestionar productos, gestionar descuentos, ver reportes.

- **Diagrama de clases (modelo de dominio simplificado)**  
  - Entidades: `Usuario`, `Rol`, `Producto`, `Categoria`, `Marca`, `Proveedor`, `VariantGroup`, `VariantCombination`, `Carrito`, `Orden`, `Pago`, `Descuento`, `MovimientoInventario`, `Comentario`.  
  - Relaciones: usuario‑rol (N:M), producto‑categoría (N:1), producto‑variant_group (1:N), variant_group‑variant_combination (1:N), orden‑detalle (1:N), orden‑pago (1:1).

- **Diagramas de secuencia**  
  - Flujo de checkout (cliente → frontend → backend → Wompi → backend → cliente).  
  - Flujo de creación de producto compuesto (admin → frontend → backend → funciones SQL de inserción de producto, grupos de variante, combinaciones e imágenes).

Estos diagramas se derivan del esquema de base de datos en `revital_ecommerce/db/db_revital.sql` y de los servicios definidos en `revital_ecommerce/backend/app/services/`.

### 2.3. DESCRIPCIÓN DE CAMPOS REQUERIDOS POR PANTALLA

A continuación se resumen los campos principales de algunos formularios clave.  
Las pantallas completas se encuentran en el frontend (`revital_ecommerce/frontend/app` y `components/`).

#### Formulario de registro de usuario

| Campo      | Tipo    | Requerido | Validación                                     | Descripción                               |
|-----------|---------|-----------|-----------------------------------------------|-------------------------------------------|
| Nombre    | Texto   | Sí        | Máx. 80 caracteres                            | Nombre completo del cliente               |
| Email     | Email   | Sí        | Formato de correo válido, único en el sistema | Identificador de acceso                   |
| Contraseña| Password| Sí        | Mín. 8 caracteres, combinación segura         | Credencial de autenticación               |
| Teléfono  | Texto   | No        | 7–15 dígitos                                  | Teléfono de contacto                      |

#### Formulario de dirección de envío

| Campo        | Tipo  | Requerido | Validación               | Descripción                         |
|-------------|-------|-----------|---------------------------|-------------------------------------|
| País        | Lista | Sí        | Valor permitido           | País de envío                       |
| Ciudad      | Texto | Sí        | Máx. 80 caracteres        | Ciudad o municipio                  |
| Dirección   | Texto | Sí        | Máx. 200 caracteres       | Dirección física del destinatario   |
| Código Postal| Texto| No        | Formato local             | Código postal, si aplica            |

#### Formulario de producto (panel admin)

| Campo             | Tipo       | Requerido | Validación                      | Descripción                                      |
|------------------|------------|-----------|----------------------------------|--------------------------------------------------|
| Nombre           | Texto      | Sí        | Máx. 150 caracteres             | Nombre comercial del producto                    |
| Descripción      | Texto largo| Sí        | Máx. 2000 caracteres            | Descripción detallada                            |
| Categoría        | Lista      | Sí        | Debe ser categoría hoja         | Nodo final del árbol de categorías              |
| Marca            | Lista      | No        | Marca existente                  | Relación con `tab_marcas`                        |
| Proveedor        | Lista      | No        | Proveedor existente              | Relación con `tab_proveedores`                   |
| Atributos por variante | Dinámico | Depende de categoría | Definidos en `tab_category_attributes` | Atributos como color, talla, almacenamiento, etc. |
| Imágenes         | Archivos   | No        | Máx. 10 imágenes, tamaño razonable| Galería por grupo de variante (color)           |

Los formularios del panel usan **React Hook Form** y validaciones adicionales en el backend mediante esquemas Pydantic (`product_schema.py`, `user_schema.py`, `address_schema.py`, entre otros).

### 2.4. PLATAFORMA DE USUARIO

Compralo es una **aplicación 100% web**, por lo que no requiere instalación en el equipo del usuario final.

- **Hardware mínimo recomendado (usuario final):**
  - PC o portátil con 4 GB de RAM y procesador equivalente a Intel i3.
  - Resolución mínima 1280x720.
  - Conexión estable a Internet ≥ 5 Mbps.

- **Software (usuario final):**
  - Navegador moderno actualizado: Chrome, Edge, Firefox o Safari en versiones recientes.
  - JavaScript y cookies habilitados (requeridos para autenticación y carrito).

- **Dispositivos soportados:**
  - Escritorio: Windows, macOS, Linux con navegador compatible.
  - Móvil y tablet: iOS y Android mediante diseño responsive (Tailwind CSS).

Para el **equipo técnico** que despliega la instancia se requiere:

- Docker (opcional pero recomendado) o entorno Python 3.13+ para el backend.
- Node.js y pnpm para el frontend.
- Servidor PostgreSQL 15+.

### 2.5. CASOS DE EXPERIENCIA

Los siguientes casos de experiencia resumen escenarios reales de uso de Compralo:

- **Como cliente**, quiero filtrar productos por marca, categoría, color y rango de precios para encontrar rápidamente lo que necesito sin recorrer todo el catálogo.
- **Como administrador**, quiero crear productos con múltiples variantes (color, talla, almacenamiento) para gestionar el stock de cada combinación por separado.
- **Como empleado**, quiero actualizar el estado de las órdenes (pendiente, pagada, enviada, cancelada) para mantener informado al cliente y al área logística.

Estas historias de usuario se gestionan como requisitos funcionales y se trazan con los módulos correspondientes del backend y frontend (por ejemplo, filtros de productos, gestión de variantes, módulo de órdenes).

### 3. Interfaz y Experiencia de Navegación

Para asegurar que el usuario pueda operar el sistema de forma intuitiva, el manual debe incluir:

#### Mapa de Navegación: 
Una representación gráfica que muestra la interconexión entre pantallas, menús y submenús para saber cómo llegar a cada parte de la aplicación.

#### Descripción de Campos por Pantalla: 
Explicación detallada de cada campo utilizado en los formularios, incluyendo capturas de pantalla de la interfaz real.

#### Descripción Gráfica: 
Una sección donde el mapa de navegación se presenta ya con las imágenes de las pantallas respectivas para facilitar la comprensión visual.

**Documenta el diseño de la interfaz de usuario, los patrones de navegación, la experiencia del usuario (UX) y cómo los usuarios interactúan con el sistema para completar sus tareas.**

**Ejemplo: La interfaz de Compralo utiliza un diseño de tarjetas (card layout) para mostrar productos, con navegación principal en la parte superior incluyendo: Inicio, Categorías, Carrito, Mi Cuenta. El flujo de compra se completa en 3 pasos: 1) Selección de productos, 2) Información de envío, 3) Pago y confirmación.**

### 4. Pruebas y Aceptación fase 1 (1Pruebas unitarias)

La experiencia del usuario final se valida mediante criterios de aceptación:

Los requerimientos definen los casos de prueba y sus parámetros de aprobación para asegurar que la funcionalidad entregada satisface las expectativas del usuario.

El manual debe describir la funcionalidad desde la perspectiva del usuario y los atributos de calidad definidos.

**Documenta las pruebas realizadas para validar que cada componente del sistema funciona correctamente de forma individual. Las pruebas unitarias verifican funciones, métodos y clases de manera aislada.**

**Ejemplo:** Se implementaron 347 pruebas unitarias usando Jest para el backend (Node.js) con cobertura del 89%. Pruebas incluyen: validación de datos de entrada, cálculo de precios con descuentos, generación de números de orden únicos, encriptación de contraseñas, y lógica de inventario.

## CONTENIDO DEL FUNCIONAMIENTO
**Esta sección describe en detalle cómo funciona el sistema internamente, incluyendo la arquitectura de datos, los procesos técnicos, la lógica de negocio implementada y los flujos de información entre componentes.**

**Ejemplo: Compralo funciona con una arquitectura de tres capas: Capa de presentación (React.js), Capa de lógica de negocio (FastAPI), Capa de datos (PostgreSQL). Cuando un usuario realiza una compra, el sistema verifica inventario, calcula totales, reserva productos, procesa el pago y envía notificaciones por email.**

### 3.1. MODELO LÓGICO DE DATOS, DIAGRAMA ENTIDAD-RELACIÓN Y PROCESOS

El modelo de datos de Compralo está definido en `revital_ecommerce/db/db_revital.sql` y se basa en un enfoque relacional con PostgreSQL.

#### Entidades principales (resumen)

- **tab_users / tab_roles / tab_user_roles**  
  Gestión de usuarios, roles y asignaciones (Admin, Employee, Customer).

- **tab_products**  
  Cabecera del producto (nombre, descripción, categoría, marca, proveedor, estado).

- **tab_categories**  
  Árbol de categorías con `parent_id`, usado tanto para categorías, líneas y sublíneas.

- **tab_marcas / tab_proveedores**  
  Catálogo de marcas y proveedores.

- **tab_product_variant_groups / tab_product_variant_combinations / tab_product_variant_images**  
  - `tab_product_variant_groups`: agrupa variantes por atributo dominante (p.ej. color).  
  - `tab_product_variant_combinations`: cada combinación vendible con SKU, precio, stock y atributos dinámicos en JSONB.  
  - `tab_product_variant_images`: galería de imágenes por grupo de variante.

- **tab_cart / tab_carrito_productos**  
  Carritos activos por usuario y sus ítems, cada uno ligado a una combinación de variante.

- **tab_ordenes / tab_orden_productos / tab_pagos**  
  Órdenes de compra, detalles de productos por orden y registros de pagos asociados (con referencia a Wompi u otros).

- **tab_descuentos / tab_cupones / tab_puntos**  
  Gestión de descuentos promocionales, cupones y puntos de fidelidad.

- **tab_movimientos_inventario**  
  Registro histórico de entradas, salidas y ajustes de stock por variante.

#### Relaciones clave

- Un **producto** pertenece a una **categoría** (`tab_products.category_id → tab_categories.id`).
- Un producto tiene **muchos grupos de variante** (1:N) y cada grupo tiene **muchas combinaciones** (1:N).
- Cada ítem de carrito y de orden referencia exactamente una **combinación de variante**.
- Una orden tiene uno o más detalles de producto (1:N) y usualmente un pago asociado (1:1).

Los procesos de negocio descritos en la sección 2.1 se implementan sobre este modelo mediante funciones SQL (`fun_filter_products`, `fun_insert_producto`, `fun_insert_variant_group`, `fun_insert_variant_combination`, etc.) y servicios de backend que orquestan la lógica.

### 3.2. Interfaz Gráfica y Funcionalidad

La interfaz de Compralo está desarrollada en **Next.js 15**, con React y Tailwind CSS. Se organiza en dos grandes áreas:

- **Tienda pública (`/(shop)`)**  
  - Página principal con productos destacados.  
  - Catálogo con filtros avanzados y paginación.  
  - Página de detalle de producto con galería de imágenes, selección de variantes y reseñas (en desarrollo).  
  - Carrito de compras accesible desde el header.

- **Panel administrativo (`/(dashboard)/admin`)**  
  - Dashboard de resumen.  
  - Módulos para productos, categorías, marcas, proveedores, usuarios y descuentos.  
  - Formularios con validación y tablas interactivas para listar y buscar registros.

Componentes clave:

- **Header:** logo de la tienda, buscador, acceso a cuenta y carrito.  
- **Sidebar de filtros:** árbol de categorías, filtros de precio, marca, proveedor y atributos.  
- **Tarjetas de producto:** muestran imagen, nombre, rango de precios y porcentaje de descuento.  
- **Detalle de producto:** galería basada en grupos de variante (color), información técnica y selector de variantes.  
- **Carrito:** listado de productos con actualización de cantidades y resumen de totales en tiempo real.

### 3.3. Interfaz de usabilidad y accesibilidad

La interfaz se diseñó siguiendo principios básicos de **usabilidad** y **accesibilidad**:

#### Usabilidad: La eficiencia del "Cómo"
La usabilidad se enfoca en que el producto sea fácil de aprender, eficiente de usar y difícil de olvidar. Se mide tradicionalmente bajo estos 5 pilares:
Facilidad de aprendizaje: ¿Qué tan rápido puede un usuario nuevo navegar la interfaz?
Eficiencia: Una vez aprendido, ¿qué tan rápido realizan las tareas?
Memorabilidad: Si el usuario regresa tras un tiempo, ¿recuerda cómo usarlo?
Prevención de errores: ¿La interfaz ayuda a evitar errores o permite recuperarse de ellos fácilmente?
Satisfacción: ¿Es agradable la experiencia visual e interactiva?

**Principios de usabilidad:**
- Navegación intuitiva con máximo 3 clics para cualquier acción
- Feedback visual inmediato para todas las acciones
- Mensajes de error claros y constructivos
- Consistencia en diseño y comportamiento

#### Accesibilidad: El derecho al "Quién"
La accesibilidad garantiza que las personas con discapacidades (visuales, auditivas, motoras o cognitivas) puedan percibir, entender y navegar la interfaz.
Se rige por los principios POUR del estándar WCAG:
- Perceptible: La información no puede ser invisible a todos los sentidos (ej. texto alternativo para imágenes).
- Operable: La interfaz no puede requerir interacciones que el usuario no pueda realizar (ej. navegación solo con teclado).
- Comprensible: El contenido y la operación deben ser claros (ej. mensajes de error que expliquen el problema).
- Robusto: El contenido debe ser compatible con diversas tecnologías asistivas (ej. lectores de pantalla).

Se puede revisar con la herramienta "Ally"

**Accesibilidad:**
- Textos alternativos para todas las imágenes
- Navegación por teclado completa
- Contraste de colores WCAG AA
- Etiquetas ARIA para lectores de pantalla
- Soporte para zoom hasta 200%

### 3.4 Planificación y Control del Proyecto

El proyecto se planificó en fases iterativas, priorizando primero el **núcleo de e‑commerce** y luego funcionalidades adicionales:

1. **Fase 1 – Diseño de arquitectura y base de datos**  
   - Definición de modelo de categorías único (`tab_categories`).  
   - Modelo de variantes basado en grupos y combinaciones.  

2. **Fase 2 – Backend core**  
   - Autenticación, gestión de usuarios y roles.  
   - Módulos de productos, categorías, marcas, proveedores y carrito.  

3. **Fase 3 – Frontend tienda y panel admin**  
   - Catálogo, detalle de producto, carrito, login/registro.  
   - Panel administrativo para catálogo e inventario.

4. **Fase 4 – Descuentos, puntos y pagos**  
   - Sistema de descuentos y fidelización.  
   - Integración con Wompi y envío de correos con Resend.

5. **Fase 5 – Optimización y documentación**  
   - Mejoras de rendimiento en filtros y consultas SQL.  
   - Documentación técnica (SRS, guías de arquitectura, este manual).

El control del proyecto se realiza mediante:

- Uso de **Git y GitHub** para control de versiones.  
- Convenciones de commits (`feat`, `fix`, `refactor`, etc.).  
- Issues y milestones para agrupar funcionalidades en releases.


- Definición de Hitos y Objetivos
**Los hitos son puntos de control significativos en el cronograma del proyecto que marcan la finalización de fases importantes o la entrega de componentes clave, sirviendo como puntos de validación del progreso.**

**Ejemplo: Hito 1 - Aprobación del proyecto (Sem 4), Hito 2 - Arquitectura aprobada (Sem 10), Hito 3 - MVP funcional con checkout básico (Sem 22), Hito 4 - Integración de pagos completada (Sem 30), Hito 5 - Beta testing finalizado (Sem 42), Hito 6 - Go-live en producción (Sem 46).**

- Implementación diagramas de GANT
**Se adjunta el diagrama de gant**

- Nivel Operativo (Vista Detallada - Desglose de Desarrollo)
**El nivel operativo desglosa las fases del proyecto en tareas específicas y detalladas, mostrando actividades individuales, duraciones precisas, dependencias entre tareas y recursos asignados a cada una.**

**Ejemplo: Sprint 1 (2 sem) se divide en: Diseño de base de datos (3 días, DB Architect), Implementación API de productos (5 días, 2 Backend Devs), Componentes UI catálogo (5 días, 2 Frontend Devs), Pruebas unitarias (2 días, QA), Code review y merge (1 día, todo el equipo).**

| ID | Actividad/Tarea | Duración | Dependencia | Recursos Asignados | Tipo de Actividad |
| --- | --- | --- | --- | --- | --- |
| 3 | Desarrollo (Total) | 36 semanas | 2.2 | Equipo de Desarrollo | |
| 3.1 | Sprints de Desarrollo | 36 semanas (18 x 2 sem.) | N/A | Asignación específica por sprint | Iterativo |
| 3.1.1 | Sprint 1 (Funcionalidad base A) | 2 semanas | N/A | Dev 1, Dev 2, QA | |
| ... | ... 16 Sprints intermedios ... | | | | |
| 3.1.18 | Sprint 18 (Cierre funcional) | 2 semanas | 3.1.17 | Dev N, QA | |
| 3.2 | Capacitación (Paralela) | 12 semanas | 3.1.6 | Equipo de Capacitación | Paralela |
| 3.3 | Pruebas Integrales (Paralela) | 8 semanas | 3.1.10 | QA, Usuarios Clave | Paralela |
| 3.4 | Documentación Técnica (Paralela) | 30 semanas | 2.1 | Analista, Redactor | Paralela |

## CONTENIDO DE PRUEBAS UNITARIAS

MATRIZ DE PRUEBAS SOBRE INFRAESTRUCTURA", es un documento de planificación y ejecución de pruebas centrado específicamente en la infraestructura tecnológica (Centros de Procesamiento de Datos - CPD, CAPD, redes, servidores, seguridad física y lógica) de una plataforma de TI corporativa

Su objetivo principal es verificar el cumplimiento de estándares de seguridad, redundancia, disponibilidad y legalidad, que son críticos para entes de control y la certificación en normas como ISO de seguridad.

Las pruebas unitarias verifican que cada componente individual del software funcione correctamente de forma aislada.

**Framework de pruebas:** Jest (JavaScript), PyTest (Python)

**Ejemplo de prueba unitaria:**

```javascript
describe('Carrito de compras', () => {
  test('Debe agregar producto al carrito', () => {
    const carrito = new Carrito();
    const producto = { id: 1, nombre: 'Libro', precio: 20 };
    carrito.agregarProducto(producto, 2);
    expect(carrito.total()).toBe(40);
    expect(carrito.cantidadItems()).toBe(1);
  });

  test('Debe calcular descuento correctamente', () => {
    const carrito = new Carrito();
    carrito.agregarProducto({ id: 1, precio: 100 }, 1);
    carrito.aplicarDescuento(10); // 10%
    expect(carrito.total()).toBe(90);
  });
});
```

**Cobertura de código objetivo:** >80%

---

### Conjunto Comprehensivo de Métricas

| Categoría | KPI | Objetivo | Frecuencia | Responsable |
| :--- | :--- | :--- | :--- | :--- |
| **KPIs de Producto/Técnicos** | Calidad Código | <5% deuda técnica | Semanal | Líder Técnico |
| | Cobertura Testing | >80% código | Por sprint | QA Lead |
| | Performance | <2s respuesta crítica | Mensual | Dev Senior |
| | Disponibilidad | >99.5% staging | Diario | DevOps |
| --- | --- | --- | --- | --- |
| **KPIs de Proceso** | Velocidad Equipo | 35±5 story points | Por sprint | Facilitadora |
| | Precisión Estimaciones | 85% dentro ±15% | Mensual | Gerente |
| | Lead Time Features | <3 sprints promedio | Mensual | Product Owner |
| | Defect Escape Rate | <5% a producción | Por release | QA Lead |
| --- | --- | --- | --- | --- |
| **KPIs de Impacto** | Adopción Usuarios | >85% activos mensual | Mensual | Gerente |
| | Satisfacción Usuarios | >4/5 puntos | Trimestral | UX Specialist |
| | Eficiencia Procesos | 50% reducción tiempo | Post-implementación | Product Owner |
| | ROI Operacional | >40% año 1 | Anual | Finanzas |

### Herramientas de Monitoreo
**Inserta aquí las herramienas que se utilizaron para monitorear el proyecto**

### Evaluación de pruebas y resultados basados en los requerimientos
| Categoria | Requerimiento No Funcional |
| --- | --- |
| Seguridad | El sistema debe garantizar la seguridad de los datos mediante la encriptación y control de acceso basado en roles y privilegios9. |
| Usabilidad | El sistema debe seguir un diseño coherente y consistente en términos de interfaz de usuario, disposición de controles, navegación y comportamiento general10. |
| Rendimiento | El software debe responder de manera rápida a las acciones del usuario, evitando demoras significativas11. |
| Capacidad | Debe ser capaz de manejar un alto volumen de descargas e inserciones sin degradar su rendimiento12. |
| Disponibilidad | La base de datos y el sistema deben estar disponibles en todo momento para los usuarios autorizados13. |
| Escalabilidad | Debe ser capaz de escalar para adaptarse al crecimiento futuro de la cantidad de datos y usuarios, sin afectar su rendimiento14. |
| Confiabilidad | La base de datos debe ser confiable y debe implementar mecanismos de respaldo y recuperación en caso de fallas15. |

### Matriz de Trazabilidad de Requisitos

| ID Requisito | Objetivo Relacionado | Módulo | Prioridad |
| --- | --- | --- | --- |
| REQ-001 | Procesar matrículas en 1 día (Reducir tiempo matrículas) | Matrículas | Alta |
| REQ-002 | Validación automática datos (Reducir errores a 2%) | Todos | Alta |

## PREDISEÑOS DEL SOFTWARE

Se inicia el diseño prototipado del proyecto teniendo en cuenta las especificaciones y requerimientos funcionales y no funcionales, los roles, y el control y permisos de la aplicación

### Pantallazos del software en su primera fase
**Se adjuntan pantallazos del mockup del software**

### Pantallazos del software en su fase final
**Se adjuntan pantallazos del sofrtware en su estado actual**

## Gestor de informacion final DEL PROYECTO
El gestor de información final consolida toda la documentación y entregables del proyecto.

**Repositorio de documentación:**
- Código fuente (GitHub)
- Documentación técnica (Confluence)
- Manuales de usuario (Google Docs)
- Videos tutoriales (YouTube privado)
- Diagramas (Lucidchart)

## Resumen Ejecutivo
Compralo es una plataforma de comercio electrónico desarrollada exitosamente que permite a comerciantes locales digitalizar sus negocios y vender productos en línea. El sistema cuenta con funcionalidades completas de catálogo, carrito, checkout, procesamiento de pagos y gestión de pedidos.

**Métricas de éxito:**
- Tiempo de desarrollo: 6 meses (según lo planificado)
- Presupuesto: Dentro del rango asignado
- Funcionalidades implementadas: 95% de las especificadas
- Satisfacción del cliente: 4.5/5

## Objetivos Cumplidos
- Sistema de gestión de inventario en tiempo real
- Integración con pasarelas de pago (PayPal, Stripe, epay, PayU, Redeban)
- Interfaz responsive y accesible
- Seguridad con cifrado SSL/TLS
- Sistema de notificaciones automatizado
- Panel de administración completo
- Optimización para SEO
- Cumplimiento de WCAG 2.1 AA

## Entregables Principales del Desarrollo:
**Modulos principales que maneja el software: dasdhboard, admin, login, ecommerce, etc.**

## PRUEBAS FUNCIONALES DEL SOFTWARE
Las pruebas funcionales verifican que el software cumple con los requisitos funcionales especificados.

**Tipos de pruebas funcionales:**
- Pruebas de integración
- Pruebas de sistema
- Pruebas de aceptación de usuario (UAT)
- Pruebas de regresión

## Pruebas caja blanca
**Las pruebas de caja blanca (white-box testing) son técnicas de testing donde el evaluador tiene conocimiento completo del código fuente y estructura interna del sistema. Se prueban rutas de código, lógica, condiciones y flujos internos.**

**Ejemplo en Compralo: Se realizan pruebas de caja blanca para verificar la lógica de descuentos (si precio > 100 aplicar 10% descuento), validar todas las ramas del código de validación de tarjetas, probar manejo de excepciones en transacciones, verificar que queries SQL estén optimizados y que no haya code smells o vulnerabilidades.**

Las pruebas de caja blanca se utilizan para comprobar características del código que no pueden verificarse mediante métodos de prueba de caja negra. Esto puede significar probar cómo funciona el propio código, lo que permite a los desarrolladores comprender la causa y el efecto de distintos aspectos del código.

### Agujeros de seguridad internos
**Esta prueba verifica que el código no contenga vulnerabilidades de seguridad que puedan ser explotadas, como inyecciones SQL, XSS, CSRF, exposición de datos sensibles o fallas de autenticación y autorización.**

**Ejemplo: En Compralo se verifica que todas las consultas usen prepared statements para prevenir SQL injection, que las contraseñas estén hasheadas con bcrypt, que los tokens JWT tengan expiración adecuada, que las API keys no estén hardcodeadas en el código, y que los permisos de usuario se validen en cada endpoint.**

**Ejemplo:** Se detectó que el sistema no validaba correctamente inputs en el campo de búsqueda, permitiendo potenciales ataques de SQL injection. Se implementó sanitización de inputs y uso de prepared statements.

**Vulnerabilidades detectadas y corregidas:**
- SQL Injection en módulo de búsqueda
- XSS en comentarios de productos
- Exposición de tokens de sesión en logs
- Falta de rate limiting en API

### 2. Vías en los procesos de codificación
**Pruebas que verifican que todas las rutas posibles del código (branches, loops, condiciones) funcionen correctamente y que no exista código muerto, innecesario o que genere resultados inesperados.**

**Ejemplo: Se prueba el flujo de checkout - si usuario está logueado → ir a envío, si no → redirigir a login. Si carrito vacío → mostrar mensaje, si tiene productos → calcular total. Se verifica que cada branch se ejecute correctamente y que no haya código que nunca se alcance.**

### 3. Resultados esperados
Las pruebas de caja blanca también pueden comprobar los resultados esperados del código del mismo modo que las pruebas de caja negra, aunque los evaluadores lo hacen teniendo en cuenta el código en lugar de utilizar la aplicación como podrían hacer en las pruebas de caja negra. Los desarrolladores comprueban los resultados esperados verificando las entradas una a una y comprobando que el resultado se ajusta a las expectativas.

**Validación de que cada función o método del código retorne los valores correctos para diferentes entradas, verificando que la lógica interna produzca los outputs esperados según las especificaciones.**

**Ejemplo: Función calcularTotal(productos) - Input: [{precio: 100, cantidad: 2}, {precio: 50, cantidad: 1}] → Output esperado: 250. Se verifica con múltiples casos: carrito vacío → 0, productos con descuento, productos con impuestos, validación de números negativos.**


### 4. Declaraciones, objetos y funciones
Mediante la aplicación de técnicas de prueba de caja blanca, los desarrolladores de software pueden garantizar que las sentencias, objetos y funciones del código se comportan de forma lógica y producen los resultados esperados.

**Pruebas que verifican que todas las declaraciones de variables, creación de objetos e invocación de funciones se comporten según lo diseñado, retornando tipos de datos correctos y manejando errores apropiadamente.**

**Ejemplo: Se prueba que la clase Producto instancie correctamente con todos sus atributos, que el método agregarAlCarrito() actualice el estado, que las promesas de API se resuelvan o rechacen correctamente, que los tipos TypeScript/JavaScript sean consistentes.**

### 5. Funcionalidad de los bucles condicionales
Las pruebas de caja blanca también pueden utilizarse para comprobar la funcionalidad de los bucles condicionales, incluidos los bucles simples, concatenados y anidados. Los desarrolladores comprobarán si estos bucles son eficientes, si cumplen los requisitos de la lógica condicional y si manejan correctamente las variables locales y globales.

**Verificación de que todos los loops (for, while, do-while) y condicionales (if-else, switch) funcionen correctamente, manejen casos edge, no generen loops infinitos y procesen variables correctamente.**

**Ejemplo: Loop que recorre productos del carrito para calcular total - Se prueba con: 0 productos (no debe ejecutarse), 1 producto, 100 productos (performance), productos con valores null o undefined, verificar que no modifique array original si no debe hacerlo.**

Se verifican bucles y condiciones para asegurar que funcionen correctamente en todos los escenarios.

**Ejemplo:** En el procesamiento de pedidos, se verifica que el bucle que itera sobre items del carrito:
- Maneje correctamente carrito vacío
- Procese correctamente 1 item
- Procese correctamente múltiples items
- No entre en bucle infinito
- Actualice correctamente totales en cada iteración

## SCRIPTS DE INSTALACION – DESPLIEGUE Y VINCULACIPON DE OTROS COMPONENTES
**Proporciona los scripts, comandos y procedimientos necesarios para instalar, configurar y desplegar el sistema en diferentes ambientes (desarrollo, pruebas, producción). Incluye diagramas de despliegue y componentes.**

**Ejemplo: Scripts de instalación incluyen: setup.sh para configurar el entorno, migrate.sql para crear la base de datos, docker-compose.yml para levantar todos los servicios. Despliegue en AWS usando EC2 para el backend, RDS para PostgreSQL, S3 para almacenamiento de imágenes, CloudFront como CDN. CI/CD con GitHub Actions.**

### Scripts de instalación
<Scripts de instalación del sistema>

**Los scripts de instalación son archivos ejecutables que automatizan el proceso de configuración inicial del sistema, instalando dependencias, configurando variables de entorno y preparando el entorno para ejecutar la aplicación.**


## Diagrama de despliegue
<Diagrama de despliege del sistema>

**El diagrama de despliegue muestra la arquitectura física del sistema, incluyendo servidores, contenedores, bases de datos, servicios cloud y cómo están conectados entre sí a nivel de infraestructura.**

## Diagrama de componentes
<Diagrama de componentes del sistema>

**El diagrama de componentes ilustra la organización y dependencias entre los módulos de software del sistema, mostrando cómo se comunican los diferentes componentes a través de interfaces definidas.**

## FIN DEL DOCUMENTO

Este manual técnico proporciona la documentación completa del sistema Compralo E-commerce, incluyendo su arquitectura, procesos, pruebas y despliegue.

**Versión del documento:** 1.0  
**Fecha de última actualización:** 13 de febrero de 2026  
**Autores:** Kevin Daniel Bermúdez Calderón, Alejandro Hernández Lara, Jhoan Camilo Suárez Mora