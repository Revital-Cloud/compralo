# Revital - Plataforma SaaS de E-Commerce 🚀

**Solución integral de e-commerce con instancias dedicadas para empresas**

Revital es una plataforma SaaS de comercio electrónico diseñada para venderse a múltiples empresas como **instancias completamente separadas**. Cada cliente obtiene su propia copia completa del software, su propia base de datos y su propio deployment aislado.

## 🎯 Estado Actual del Proyecto

**Versión**: V1.0 - Funcionalidades Core Implementadas  
**Estado**: En desarrollo activo (V1 funcional en clientes piloto)  
**Última actualización**: Febrero 2026

### ✅ Funcionalidades Implementadas

#### 🛍️ revital_ecommerce (Aplicación E-Commerce por Instancia)

**Backend (FastAPI)**:
- ✅ **Autenticación JWT** completa con roles (Admin, Employee, Customer)
- ✅ **Gestión de productos** con filtros avanzados y búsqueda (24+ endpoints)
- ✅ **Sistema de carrito** con persistencia y cálculos automáticos
- ✅ **Gestión de órdenes** y pagos integrados
- ✅ **Sistema de categorías** jerárquico (Categorías → Líneas → Sublíneas)
- ✅ **Gestión de marcas y proveedores**
- ✅ **Sistema de descuentos** y puntos de fidelidad
- ✅ **Gestión de usuarios** con perfiles completos
- ✅ **Sistema de direcciones** para envíos
- ✅ **Integración con Wompi** para pagos
- ✅ **Sistema de emails** con Resend (templates HTML)
- ✅ **API de inventario** y movimientos de stock
- ✅ **Middleware de autenticación** y autorización por roles
- ✅ **Analytics y dashboards** con KPIs

**Frontend (Next.js 16)**:
- ✅ **Interfaz de tienda** completa con catálogo de productos
- ✅ **Sistema de filtros** avanzado con búsqueda en tiempo real
- ✅ **Carrito de compras** funcional con persistencia
- ✅ **Dashboard administrativo** para gestión de productos
- ✅ **Sistema de autenticación** con login/registro
- ✅ **Gestión de categorías, líneas y sublíneas**
- ✅ **Gestión de marcas y proveedores**
- ✅ **Sistema de favoritos** para usuarios
- ✅ **Interfaz responsive** con modo oscuro
- ✅ **Sistema de cookies** con compliance GDPR
- ✅ **Estados vacíos** mejorados con ilustraciones
- ✅ **Integración completa** con backend API

**Base de Datos**:
- ✅ Esquema completo con 30+ tablas
- ✅ Funciones almacenadas por módulo
- ✅ Triggers automáticos
- ✅ Vistas materializadas para analytics

#### 🎛️ revital_panel (Panel de Control SaaS)

**Backend (FastAPI)**:
- ✅ **Autenticación JWT** para usuarios SaaS
- ✅ **Gestión de instancias** (crear, configurar, monitorear)
- ✅ **Gestión de clientes** (empresas que contratan Revital)
- ✅ **Gestión de planes** de suscripción (Starter, Business, Enterprise)
- ✅ **Gestión de suscripciones** activas
- ✅ **Sistema de facturación** y pagos recurrentes
- ✅ **Gestión de deployments** (configuración de infraestructura)
- ✅ **Gestión de dominios** personalizados
- ✅ **Monitoreo de uso de recursos** por instancia
- ✅ **Historial de planes** (cambios de plan)
- ✅ **Rate limiting** y seguridad

**Frontend (Next.js 16)**:
- ✅ **Landing page** de marketing con secciones:
  - Hero section con CTA
  - Sección de características
  - Comparación de planes
  - FAQ
  - Contacto
- ✅ **Panel de control** para clientes SaaS:
  - Dashboard con overview de instancia
  - Gestión de suscripción y plan
  - Facturación y pagos
  - Configuración de dominio
  - Monitoreo de recursos
  - Configuración de cuenta y seguridad
- ✅ **Sistema de autenticación** (login/registro)
- ✅ **Interfaz responsive** con modo oscuro
- ✅ **Componentes UI** con shadcn/ui

**Base de Datos**:
- ✅ Esquema completo para gestión SaaS
- ✅ Funciones almacenadas por módulo
- ✅ Triggers de auditoría

### 🚧 En Desarrollo

#### revital_ecommerce:
- ⏳ **Optimización de experiencia de checkout** (copias, pasos y estados vacíos)
- ⏳ **Ampliación de analytics** con más métricas de negocio

#### revital_panel:
- ⏳ **Panel administrativo** completo para Revital (gestión de todas las instancias)
- ⏳ **Automatización de deployments** (integración con Docker/CI-CD)
- ⏳ **Sistema de alertas** por uso de recursos
- ⏳ **Integración con pasarelas de pago** para facturación automática
- ⏳ **Dashboard de analytics** de la plataforma SaaS completa

## 🏢 Modelo de Negocio SaaS

### Arquitectura de Deployment Aislado

- **Cada cliente = Una instancia completa independiente**
- **Base de datos dedicada por cliente**
- **Infraestructura separada (Docker containers o VPS)**
- **Personalización total por cliente**
- **Máximo aislamiento y compliance**

### Planes de Suscripción

- **Starter**: $29.99/mes - Hasta 100 productos, 3 usuarios
- **Business**: $79.99/mes - Hasta 1,000 productos, 10 usuarios, analytics avanzados
- **Enterprise**: $199.99/mes - Productos ilimitados, usuarios ilimitados, integraciones personalizadas

## 🛠️ Stack Tecnológico

### Backend

- **FastAPI** - API REST de alto rendimiento
- **Python 3.13+** - Lenguaje principal
- **PostgreSQL** - Base de datos dedicada por cliente
- **JWT** - Autenticación sin tenant complexity
- **Pydantic** - Validación de datos
- **SQLAlchemy** - ORM

### Frontend

- **Next.js 16+** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Styling utilitario
- **shadcn/ui** - Componentes UI
- **Framer Motion** - Animaciones
- **React Query** - Gestión de estado del servidor

### Integraciones

- **Wompi** - Procesamiento de pagos (configuración por cliente)
- **Resend** - Emails transaccionales con branding personalizado

## 📁 Estructura del Proyecto

```
revital/                          # Repositorio GitHub (solo código fuente)
├── revital_ecommerce/            # 🛍️ APLICACIÓN E-COMMERCE (por instancia cliente)
│   ├── backend/                 # FastAPI - API REST de e-commerce
│   │   ├── app/
│   │   │   ├── core/            # Configuración (DB, JWT, dependencias)
│   │   │   ├── middlewares/     # Auth, roles, seguridad
│   │   │   ├── routers/         # 24+ endpoints (productos, carrito, órdenes, pagos, etc.)
│   │   │   ├── schemas/         # Validación Pydantic
│   │   │   ├── services/        # Lógica de negocio
│   │   │   ├── templates/       # Templates de emails (Resend)
│   │   │   └── main.py          # Punto de entrada FastAPI
│   │   ├── requirements.txt
│   │   └── README.md
│   ├── frontend/                # Next.js 16 - Tienda del cliente
│   │   ├── app/
│   │   │   ├── (auth)/          # Login, registro, recuperación contraseña
│   │   │   ├── (shop)/          # Catálogo, productos, carrito, checkout
│   │   │   └── (dashboard)/     # Panel admin (productos, órdenes, analytics)
│   │   ├── components/          # Componentes React reutilizables
│   │   │   └── ui/              # Componentes shadcn/ui
│   │   ├── hooks/               # Custom hooks React
│   │   ├── services/            # Servicios API (productos, carrito, etc.)
│   │   ├── stores/              # Estado global (Zustand)
│   │   ├── types/               # Tipos TypeScript
│   │   ├── utils/               # Utilidades (API wrapper, helpers)
│   │   ├── lib/                 # Configuración (theme, menu, footer)
│   │   ├── providers/           # Providers (auth, query, theme)
│   │   ├── public/              # Assets estáticos
│   │   ├── package.json
│   │   └── README.md
│   └── db/                      # Base de datos PostgreSQL
│       ├── db_revital.sql        # Esquema completo
│       ├── Functions/           # Funciones almacenadas por tabla
│       ├── triggers/            # Triggers de BD
│       └── views/               # Vistas materializadas
│
├── revital_panel/                # 🎛️ PANEL DE CONTROL SAAS (gestión de instancias)
│   ├── backend/                 # FastAPI - API gestión SaaS
│   │   ├── app/
│   │   │   ├── core/            # Configuración (DB, JWT, rate limiting)
│   │   │   ├── middlewares/     # Auth, roles, seguridad
│   │   │   ├── routers/         # Endpoints SaaS (instancias, clientes, planes, facturación)
│   │   │   ├── schemas/         # Validación Pydantic
│   │   │   ├── services/        # Lógica de negocio SaaS
│   │   │   └── main.py          # Punto de entrada FastAPI
│   │   ├── requirements.txt
│   │   └── README.md
│   ├── frontend/                # Next.js 16 - Landing + Panel SaaS
│   │   ├── app/
│   │   │   ├── page.tsx         # Landing page (marketing)
│   │   │   ├── login/           # Login para clientes SaaS
│   │   │   ├── register/        # Registro de nuevos clientes
│   │   │   └── (dashboard)/     # Panel de control SaaS
│   │   │       ├── dashboard/   # Overview de instancias
│   │   │       ├── instance/    # Gestión de instancias
│   │   │       ├── subscription/# Gestión de suscripciones
│   │   │       ├── billing/     # Facturación y pagos
│   │   │       ├── resources/   # Uso de recursos
│   │   │       └── settings/    # Configuración de cuenta
│   │   ├── components/
│   │   │   ├── ui/              # Componentes shadcn/ui
│   │   │   ├── dashboard/       # Componentes del dashboard
│   │   │   ├── layout/          # Layout components (sidebar, header)
│   │   │   └── auth/            # Componentes de autenticación
│   │   ├── hooks/               # Custom hooks React
│   │   ├── services/            # Servicios API (instancias, clientes, etc.)
│   │   ├── types/               # Tipos TypeScript
│   │   ├── utils/               # Utilidades
│   │   ├── providers/           # Providers (query)
│   │   ├── public/              # Assets estáticos (logos, imágenes)
│   │   ├── package.json
│   │   └── README.md
│   └── db/                      # Base de datos PostgreSQL SaaS
│       ├── db_revitalsaas.sql    # Esquema completo
│       ├── Functions/            # Funciones almacenadas por tabla
│       └── triggers/            # Triggers de BD
│
├── docs/                         # Documentación del proyecto
└── README.md                     # Este archivo
```

### 🎯 Explicación de Cada Aplicación

#### 🛍️ **revital_ecommerce** - Aplicación de E-Commerce (por Instancia Cliente)

**Propósito**: Esta es la aplicación que se despliega **una vez por cada cliente SaaS**. Cada cliente tiene su propia instancia completa e independiente.

**Backend (`revital_ecommerce/backend`)**:
- **FastAPI** con 24+ routers que manejan toda la lógica de e-commerce
- **Funcionalidades principales**:
  - Autenticación JWT (Admin, Employee, Customer)
  - Gestión de productos, categorías, líneas, sublíneas
  - Sistema de carrito y órdenes
  - Integración con Wompi para pagos
  - Sistema de puntos y descuentos
  - Gestión de inventario y movimientos de stock
  - Emails transaccionales con Resend
  - Analytics y dashboards
  - Asistente de administración con IA (Groq) para resúmenes, analytics y acciones guiadas (`/api/admin/ai/*`)
- **Base de datos**: PostgreSQL dedicada por cliente (`db_revital.sql`)

**Frontend (`revital_ecommerce/frontend`)**:
- **Next.js 16** con App Router
- **Interfaz de tienda** completa para clientes finales:
  - Catálogo de productos con filtros avanzados
  - Carrito de compras con persistencia
  - Proceso de checkout
  - Perfil de usuario y órdenes
  - Sistema de favoritos
- **Dashboard administrativo** para gestionar:
  - Productos, categorías, marcas, proveedores
  - Órdenes y pagos
  - Usuarios y roles
  - Analytics y KPIs

**Cuándo se usa**: Cada vez que un cliente SaaS necesita su propia tienda online. Se despliega como una instancia completamente aislada con su propia BD y configuración.

---

#### 🎛️ **revital_panel** - Panel de Control SaaS (Gestión Centralizada)

**Propósito**: Esta es la aplicación que permite a **Revital (la empresa)** gestionar todas las instancias de clientes, suscripciones, facturación y el proceso de onboarding de nuevos clientes.

**Backend (`revital_panel/backend`)**:
- **FastAPI** para gestión SaaS centralizada
- **Funcionalidades principales**:
  - Gestión de **instancias** de clientes (crear, configurar, monitorear)
  - Gestión de **clientes** (empresas que contratan Revital)
  - Gestión de **planes** de suscripción (Starter, Business, Enterprise)
  - Gestión de **suscripciones** activas
  - **Facturación** y pagos recurrentes
  - **Deployments** (configuración de infraestructura por cliente)
  - **Dominios** personalizados por cliente
  - **Uso de recursos** (monitoreo de consumo)
  - **Historial de planes** (cambios de plan)
- **Base de datos**: PostgreSQL centralizada (`db_revitalsaas.sql`) que almacena metadatos de todas las instancias

**Frontend (`revital_panel/frontend`)**:
- **Next.js 16** con App Router
- **Landing page** de marketing para atraer nuevos clientes
- **Panel de control** para clientes SaaS que incluye:
  - Dashboard con overview de su instancia
  - Gestión de su suscripción y plan
  - Facturación y pagos
  - Configuración de dominio personalizado
  - Monitoreo de uso de recursos
  - Configuración de cuenta y seguridad
- **Panel administrativo** (futuro) para que Revital gestione todas las instancias

**Cuándo se usa**: 
- **Landing page**: Para marketing y captación de nuevos clientes
- **Panel de cliente**: Cuando un cliente SaaS necesita gestionar su instancia, cambiar de plan, ver facturación, etc.
- **Panel admin**: Para que Revital gestione todas las instancias de forma centralizada

---

### 🔄 Relación entre las Aplicaciones

```
┌───────────────────────────────────────────────────────────┐
│                    revital_panel                           │
│  (Gestión SaaS - Una sola instancia para Revital)          │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Cliente A   │  │  Cliente B   │  │  Cliente C   │     │
│  │  Plan: Pro   │  │  Plan: Basic │  │  Plan: Pro   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ revital_ecommerce│ │ revital_ecommerce│ │ revital_ecommerce│
│  (Instancia A)  │ │  (Instancia B)  │ │  (Instancia C)  │
│                 │ │                 │ │                 │
│ • BD propia     │ │ • BD propia     │ │ • BD propia     │
│ • Dominio:      │ │ • Dominio:      │ │ • Dominio:      │
│   tienda-a.com  │ │   tienda-b.com  │ │   tienda-c.com  │
│ • Config única  │ │ • Config única  │ │ • Config única  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Flujo típico**:
1. Un cliente potencial visita la **landing page** (`revital_panel`)
2. Se registra y elige un plan en **revital_panel**
3. Se crea una nueva **instancia** en `revital_panel/backend`
4. Se despliega automáticamente una nueva instancia de **revital_ecommerce** para ese cliente
5. El cliente gestiona su tienda desde **revital_ecommerce**
6. El cliente gestiona su suscripción desde **revital_panel**

---

## 🚀 Inicio Rápido (Desarrollo)

### Prerrequisitos

- **Python 3.13+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **pnpm** (gestor de paquetes para frontends)
- **Git**

### 1. Clonar el Repositorio

```bash
# El repositorio contiene solo el código fuente
git clone https://github.com/KevinBermudezC/revital.git
cd revital
```

### 1.1. Configurar AI Skills (Opcional pero Recomendado)

Si usas un asistente de IA para desarrollo (Cursor, Claude Code, GitHub Copilot, etc.), configura los skills del proyecto:

```bash
# Auto-detecta los asistentes instalados (recomendado)
./.agents/setup.sh

# O especifica manualmente
./.agents/setup.sh --cursor --claude

# O configura todos los asistentes
./.agents/setup.sh --all
```

**Nota importante**: Cada colaborador debe ejecutar este script en su máquina local. Los symlinks generados son específicos de cada desarrollador y no se versionan en git.

El script **detecta automáticamente** qué asistentes de IA tienes instalados y los configura. Después de ejecutar el setup, **reinicia tu asistente de IA** para que cargue los skills.

Los skills proporcionan contexto específico del proyecto a los asistentes de IA, mejorando la calidad del código generado y asegurando que siga los patrones y convenciones de Revital.

Para más información, consulta [AGENTS.md](./AGENTS.md) y [.agents/README.md](./.agents/README.md).

---

## 🛍️ Configuración de revital_ecommerce (E-Commerce)

### 2.1. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb revital_ecommerce

# Importar esquema
psql revital_ecommerce < revital_ecommerce/db/db_revital.sql

# (Opcional) Importar funciones almacenadas
# psql revital_ecommerce < revital_ecommerce/db/Functions/[archivo].sql
```

### 2.2. Configurar Backend

```bash
cd revital_ecommerce/backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Linux/Mac:
source venv/bin/activate
# Windows:
# .\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración de BD:
# DATABASE_URL=postgresql://usuario:password@localhost:5432/revital_ecommerce
# JWT_SECRET=tu_secret_key_aqui
# WOMPI_ACCESS_TOKEN=tu_token_wompi
# RESEND_API_KEY=tu_key_resend
```

### 2.3. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2.4. Ejecutar revital_ecommerce

```bash
# Terminal 1 - Backend
cd revital_ecommerce/backend
source venv/bin/activate  # Linux/Mac
fastapi dev app/main.py

# Terminal 2 - Frontend
cd revital_ecommerce/frontend
pnpm dev
```

**URLs**:
- Frontend: http://localhost:3001
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🎛️ Configuración de revital_panel (Panel SaaS)

### 3.1. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb revital_saas

# Importar esquema
psql revital_saas < revital_panel/db/db_revitalsaas.sql

# (Opcional) Importar funciones almacenadas
# psql revital_saas < revital_panel/db/Functions/[archivo].sql
```

### 3.2. Configurar Backend

```bash
cd revital_panel/backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
source venv/bin/activate  # Linux/Mac
# .\venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración de BD:
# DATABASE_URL=postgresql://usuario:password@localhost:5432/revital_saas
# JWT_SECRET=tu_secret_key_aqui
```

### 3.3. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con:
# NEXT_PUBLIC_API_URL=http://localhost:8001
```

### 3.4. Ejecutar revital_panel

```bash
# Terminal 3 - Backend
cd revital_panel/backend
source venv/bin/activate
fastapi dev app/main.py

# Terminal 4 - Frontend
cd revital_panel/frontend
pnpm dev
```

**URLs**:
- Frontend (Landing + Panel): http://localhost:4001
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

---

## 👤 Accesos por Defecto

### revital_ecommerce (Usuarios de la tienda)

- **Admin**: admin@revital.com / admin123
- **Employee**: empleado@revital.com / empleado123
- **Customer**: cliente@revital.com / cliente123

### revital_panel (Usuarios del panel SaaS)

- **Cliente SaaS**: (crear desde el registro en la landing page)
- **Admin Revital**: (configurar según necesidad)

---

## 📝 Notas de Desarrollo

- Cada aplicación funciona **independientemente** y puede ejecutarse por separado
- Los frontends usan **pnpm** como gestor de paquetes
- Los backends usan **FastAPI** con hot-reload en modo desarrollo
- Las bases de datos son **completamente separadas** (una para e-commerce, otra para SaaS)
- Para desarrollo local, puedes ejecutar solo `revital_ecommerce` si solo trabajas en la tienda
- Para desarrollo local, puedes ejecutar solo `revital_panel` si solo trabajas en el panel SaaS

## 🏗️ Deployment de Instancias de Cliente

### Proceso de Nueva Instancia

1. **Información del negocio** - Datos de la empresa cliente
2. **Selección de plan** - Starter, Business o Enterprise
3. **Configuración de pagos** - Setup de Wompi
4. **Creación de instancia** - Deploy de infraestructura dedicada
5. **Setup de base de datos** - PostgreSQL dedicada
6. **Personalización** - Branding y configuración específica
7. **Configuración de dominio** - Dominio personalizado del cliente
8. **Go-live** - Activación de la instancia

## 🎯 Características SaaS

### Por Cliente (Instancia Dedicada)

- ✅ **Aislamiento total** - Infraestructura completamente separada
- ✅ **Base de datos dedicada** - Sin sharing entre clientes
- ✅ **Personalización completa** - Branding, dominio, features
- ✅ **Compliance máximo** - GDPR, CCPA, regulaciones locales
- ✅ **Performance dedicada** - Recursos no compartidos
- ✅ **API personalizada** - Endpoints con credenciales únicas
- ✅ **White-label total** - Sin marca Revital visible

### Para Diferentes Sectores

- **Fashion** - Tallas, colores, materiales, géneros
- **Electronics** - Marcas, modelos, garantías, especificaciones
- **Home & Garden** - Dimensiones, materiales, instalación
- **General** - Configuración flexible para cualquier sector

### Gestión Centralizada

- **Panel de control** para todas las instancias
- **Deployment automatizado** de nuevos clientes
- **Updates distribuidos** a todas las instancias
- **Billing integration** por cliente activo
- **Support tracking** granular por cliente

## 📊 Ventajas del Deployment Aislado

### Técnicas

- **Máximo aislamiento** - Imposible cross-contamination
- **Desarrollo simplificado** - Sin complejidad multi-tenant
- **Escalado natural** - Horizontal por cliente
- **Backup granular** - Control total por cliente
- **Performance dedicada** - Sin contención de recursos

### Comerciales

- **Compliance total** - Cumplimiento de regulaciones estrictas
- **Personalización ilimitada** - Cada cliente puede modificar su instancia
- **Pricing premium** - Justificación para precios más altos
- **Retención alta** - Switching cost elevado
- **Expansión de cuenta** - Fácil upselling de recursos

## 📚 Documentación

- **[Backend E-commerce](./revital_ecommerce/backend/README.md)** - Documentación detallada del backend
- **[Frontend E-commerce](./revital_ecommerce/frontend/README.md)** - Guía del frontend y componentes
- **[Frontend Revital Panel](./revital_panel/frontend/README.md)** - Documentación de la landing page y panel
- **[Backend Revital Panel](./revital_panel/backend/README.md)** - Documentación del backend de gestión
- **API Interactive**: Swagger UI disponible en cada instancia en `/docs`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

**Revital** - Transformando el e-commerce con soluciones SaaS de deployment aislado 🛍️✨
