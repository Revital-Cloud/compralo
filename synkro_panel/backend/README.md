# Synkro Backend - API de Gestión SaaS 🚀

**API para gestión centralizada de instancias de clientes**

El backend de Synkro está diseñado para gestionar el panel de control SaaS que permite crear, configurar y administrar las instancias aisladas de clientes. Este backend maneja la lógica de negocio de la plataforma SaaS, no la lógica de e-commerce individual.

## 🎯 Propósito

Este backend gestiona:
- **Creación y configuración de instancias** de clientes
- **Gestión de planes de suscripción** (Starter, Business, Enterprise)
- **Panel de control SaaS** para administradores de Synkro
- **Billing y facturación** de clientes
- **Monitoreo y analytics** de todas las instancias
- **Gestión de usuarios** del panel SaaS

> **Nota**: Este backend es diferente al backend de e-commerce (`synkro_ecommerce/backend`). Este maneja la plataforma SaaS, mientras que el otro maneja la lógica de cada tienda individual.

## 🏗️ Estructura del Proyecto

```
backend/
├── app/
│   ├── core/                   # Configuración centralizada
│   │   ├── config.py          # Variables de entorno y configuración
│   │   ├── database.py        # Conexión a base de datos
│   │   ├── dependencies.py    # Dependencias de FastAPI
│   │   ├── jwt_utils.py       # Utilidades JWT
│   │   └── token_blacklist.py # Gestión de tokens invalidados
│   │
│   ├── middlewares/            # Middlewares personalizados
│   │   ├── auth_middleware.py # Middleware de autenticación
│   │   ├── role_middleware.py # Middleware de roles
│   │   └── security_middleware.py # Middleware de seguridad
│   │
│   ├── routers/                # Endpoints de la API
│   │   ├── instances/         # Gestión de instancias de clientes
│   │   ├── subscriptions/     # Gestión de suscripciones
│   │   ├── billing/           # Facturación y pagos
│   │   └── analytics/         # Analytics de la plataforma
│   │
│   ├── schemas/                # Validación Pydantic
│   ├── services/               # Lógica de negocio
│   │   ├── instance_service.py # Lógica de instancias
│   │   ├── deployment_service.py # Lógica de deployment
│   │   └── billing_service.py # Lógica de facturación
│   │
│   └── main.py                # Punto de entrada FastAPI
│
├── requirements.txt            # Dependencias Python
├── .gitignore                 # Archivos ignorados por git
└── README.md                  # Este archivo
```

## 🛠️ Stack Tecnológico

- **FastAPI** - Framework web moderno y rápido
- **Python 3.13+** - Lenguaje principal
- **Uvicorn** - Servidor ASGI de alto rendimiento
- **Pydantic V2** - Validación de datos y serialización
- **SQLAlchemy 2.0+** - ORM con soporte async
- **JWT (PyJWT)** - Tokens de autenticación
- **argon2-cffi** - Hashing de contraseñas seguro

## 🚀 Instalación y Configuración

### Prerrequisitos

```bash
Python 3.13+
PostgreSQL 15+ (opcional, según necesidades)
Git
```

### 1. Preparar Entorno

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 2. Variables de Entorno

Crear un archivo `.env` en la raíz del backend con las siguientes variables:

```env
# Base de datos de gestión SaaS
DATABASE_URL=postgresql://user:password@localhost:5432/synkro_saas

# JWT para autenticación del panel SaaS
JWT_SECRET_KEY=your_super_secret_jwt_key_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuración de la plataforma
PLATFORM_NAME=Synkro
PLATFORM_DOMAIN=synkro.com

# Integraciones
STRIPE_SECRET_KEY=sk_test_...  # Para billing
RESEND_API_KEY=re_...          # Para emails transaccionales

# Docker/Deployment
DOCKER_REGISTRY=registry.synkro.com
DEPLOYMENT_NAMESPACE=synkro-instances
```

### 3. Iniciar Servidor de Desarrollo

```bash
# Método recomendado (Script con PYTHONPATH configurado)
./run_dev.sh

# Método alternativo (FastAPI CLI con PYTHONPATH)
PYTHONPATH=./app fastapi dev app/main.py --port 8001

# Método alternativo (Uvicorn)
PYTHONPATH=./app uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**Nota importante**: El proyecto requiere que el directorio `app/` esté en el PYTHONPATH para que las importaciones funcionen correctamente. El script `run_dev.sh` configura esto automáticamente.

### 4. Verificar Instalación

```bash
# Verificar que el servidor esté funcionando
curl http://localhost:8000/

# Verificar documentación de la API
# Abrir en navegador: http://localhost:8000/docs
```

## 🚧 Estado del Proyecto

Este backend está en **desarrollo activo**. Las funcionalidades principales incluyen:

### ✅ Planificado
- [ ] API de gestión de instancias
- [ ] Sistema de suscripciones y planes
- [ ] Integración con sistemas de billing
- [ ] Panel de control para administradores
- [ ] Deployment automatizado de instancias
- [ ] Monitoreo y analytics de instancias

### 🔄 En Desarrollo
- Estructura base del proyecto
- Configuración de base de datos
- Sistema de autenticación

## 📚 API Documentation

### Main resources (v1, English routes)

- `/api/auth` – Authentication (login, register, refresh, password reset)
- `/api/clients` – Client accounts and \"my profile\" endpoints
- `/api/plans` – Subscription plans catalog
- `/api/subscriptions` – Client subscriptions and plan changes
- `/api/instances` – E‑commerce instances management
- `/api/billing` – Invoices and billing data
- `/api/domains` – Domains attached to instances
- `/api/resource-usage` – Resource usage metrics and alerts
- `/api/plan-history` – Plan change history
- `/api/admin/users` – Synkro admin users
- `/api/admin/metrics` – Admin dashboard metrics

### Swagger UI

- **Development**: http://localhost:8001/docs (different port than e-commerce)
- **Production**: https://api.synkro.com/docs

### ReDoc

- **Development**: http://localhost:8001/redoc

## 🔧 Comandos Útiles

### Desarrollo

```bash
# Ejecutar servidor con hot reload
fastapi dev app/main.py

# Ejecutar con uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Verificar Configuración

```bash
# Verificar variables de entorno
python -c "from app.core.config import settings; print(settings.dict())"
```

## 🔄 Diferencias con Backend de E-commerce

| Aspecto | Backend Synkro (Este) | Backend E-commerce |
|---------|----------------------|-------------------|
| **Propósito** | Gestión de la plataforma SaaS | Lógica de cada tienda individual |
| **Usuarios** | Administradores de Synkro | Clientes, empleados, compradores |
| **Base de Datos** | Base de datos central de gestión | Base de datos por instancia de cliente |
| **Endpoints** | `/api/instances`, `/api/subscriptions` | `/api/products`, `/api/orders` |
| **Deployment** | Una instancia central | Una instancia por cliente |

## 🤝 Contribución

Este backend está en desarrollo activo. Para contribuir:

1. Revisa la arquitectura del monorepo en el README principal
2. Asegúrate de mantener la separación con el backend de e-commerce
3. Sigue las convenciones de código establecidas

---

**Synkro Backend** - API de gestión SaaS escalable y moderna 🚀

