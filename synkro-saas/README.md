# Synkro - Plataforma SaaS de E-Commerce 🚀

**Solución integral de e-commerce con instancias dedicadas para empresas**

Synkro es una plataforma SaaS de comercio electrónico diseñada para venderse a múltiples empresas como **instancias completamente separadas**. Cada cliente obtiene su propia copia completa del software, su propia base de datos y su propio deployment aislado.

## 🎯 Estado Actual del Proyecto

**Versión**: V1.0 - Funcionalidades Core Implementadas  
**Progreso**: 85% completado  
**Última actualización**: Septiembre 2025

### ✅ Funcionalidades Implementadas

#### Backend (FastAPI)
- **Autenticación JWT** completa con roles (Admin, Employee, Customer)
- **Gestión de productos** con filtros avanzados y búsqueda
- **Sistema de carrito** con persistencia y cálculos automáticos
- **Gestión de órdenes** y pagos integrados
- **Sistema de categorías** jerárquico (Categorías → Líneas → Sublíneas)
- **Gestión de marcas y proveedores**
- **Sistema de descuentos** y puntos de fidelidad
- **Gestión de usuarios** con perfiles completos
- **Sistema de direcciones** para envíos
- **Integración con Wompi** para pagos
- **Sistema de emails** con Resend
- **API de inventario** y movimientos de stock
- **Middleware de autenticación** y autorización por roles

#### Frontend (Next.js 15)
- **Interfaz de tienda** completa con catálogo de productos
- **Sistema de filtros** avanzado con búsqueda en tiempo real
- **Carrito de compras** funcional con persistencia
- **Dashboard administrativo** para gestión de productos
- **Sistema de autenticación** con login/registro
- **Gestión de categorías, líneas y sublíneas**
- **Gestión de marcas y proveedores**
- **Sistema de favoritos** para usuarios
- **Interfaz responsive** con modo oscuro
- **Sistema de cookies** con compliance GDPR
- **Estados vacíos** mejorados con ilustraciones
- **Integración completa** con backend API

### 🚧 En Desarrollo
- **Proceso de checkout** completo
- **Gestión de órdenes** del lado del usuario
- **Dashboard de analytics** avanzado
- **Sistema de notificaciones**

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

- **Next.js 15+** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Styling utilitario
- **shadcn/ui** - Componentes UI
- **Framer Motion** - Animaciones
- **React Query** - Gestión de estado del servidor

### Integraciones

- **Wompi** - Procesamiento de pagos (configuración por cliente)
- **Resend** - Emails transaccionales con branding personalizado
- **Docker** - Containerización para deployment de instancias

## 📁 Estructura del Proyecto

```
synkro/
├── backend/                    # API con FastAPI
│   ├── app/
│   │   ├── core/              # Configuración
│   │   ├── models/            # Modelos SQLAlchemy
│   │   ├── routers/           # Endpoints API
│   │   ├── schemas/           # Validación Pydantic
│   │   ├── services/          # Lógica de negocio
│   │   └── main.py           # Punto de entrada
│   ├── requirements.txt       # Dependencias Python
│   └── README.md             # Documentación del backend
│
├── frontend/                   # Interfaz Next.js
│   ├── app/                   # App Router (Next.js 15+)
│   ├── components/            # Componentes reutilizables
│   ├── lib/                   # Utilidades y configuración
│   ├── public/                # Assets estáticos
│   ├── package.json           # Dependencias Node.js
│   └── README.md             # Documentación del frontend
│
└── README.md                  # Este archivo
```

## 🚀 Inicio Rápido (Desarrollo)

### Prerrequisitos

- **Python 3.13+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **Git**

### 1. Clonar el Repositorio

```bash
git clone https://github.com/KevinBermudezC/synkro.git
cd synkro
```

### 2. Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración de BD

# Ejecutar migraciones (si es necesario)
# alembic upgrade head
```

### 3. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con la URL de tu backend
```

### 4. Ejecutar en Desarrollo

```bash
# Terminal 1 - Backend
cd backend
fastapi dev app/main.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 5. Accesos por Defecto

#### Usuarios de Prueba
- **Admin**: admin@synkro.com / admin123
- **Employee**: empleado@synkro.com / empleado123
- **Customer**: cliente@synkro.com / cliente123

#### Funcionalidades Disponibles
- **Tienda**: Navegación completa de productos con filtros
- **Carrito**: Agregar/eliminar productos, persistencia
- **Admin**: Gestión completa de productos, categorías, marcas
- **Autenticación**: Login/registro con JWT

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

### Ejemplo de Deployment por Cliente

```yaml
# docker-compose.yml para cliente "empresa-abc"
version: "3.8"
services:
  backend:
    image: synkro-backend:latest
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/empresa_abc_db
      - CLIENT_NAME=empresa_abc
      - JWT_SECRET=unique_secret_for_empresa_abc
      - WOMPI_ACCESS_TOKEN=client_specific_token

  frontend:
    image: synkro-frontend:latest
    environment:
      - NEXT_PUBLIC_API_URL=https://api.empresa-abc.com
      - NEXT_PUBLIC_BRAND_COLOR=#1a56db

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=empresa_abc_db
    volumes:
      - ./empresa_abc_data:/var/lib/postgresql/data
```

## 🎯 Características SaaS

### Por Cliente (Instancia Dedicada)

- ✅ **Aislamiento total** - Infraestructura completamente separada
- ✅ **Base de datos dedicada** - Sin sharing entre clientes
- ✅ **Personalización completa** - Branding, dominio, features
- ✅ **Compliance máximo** - GDPR, CCPA, regulaciones locales
- ✅ **Performance dedicada** - Recursos no compartidos
- ✅ **API personalizada** - Endpoints con credenciales únicas
- ✅ **White-label total** - Sin marca Synkro visible

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

- **[Backend API](./backend/README.md)** - Documentación detallada del backend
- **[Frontend](./frontend/README.md)** - Guía del frontend y componentes
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

**Synkro** - Transformando el e-commerce con soluciones SaaS de deployment aislado 🛍️✨
