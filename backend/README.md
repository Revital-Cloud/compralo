# Synkro Backend - API SaaS de E-Commerce 🚀

**API RESTful de alto rendimiento para deployment de instancias aisladas**

El backend de Synkro está diseñado para funcionar como una API independiente por cada cliente SaaS. Cada instancia tiene su propia base de datos PostgreSQL y configuración específica, eliminando la complejidad multi-tenant tradicional.

## 🏗️ Arquitectura SaaS Simplificada

### Deployment Aislado por Cliente
- **Sin tenant_id**: Cada instancia maneja un solo cliente
- **Base de datos dedicada**: PostgreSQL exclusiva por instancia
- **Configuración específica**: Variables de entorno por cliente
- **JWT independiente**: Secrets únicos por instancia
- **Desarrollo simplificado**: Sin lógica multi-tenant

### Características por Instancia
- **Autenticación JWT** sin complejidad tenant
- **Roles simples**: Admin, Employee, Customer
- **API personalizable** por plan de suscripción
- **Límites configurables** según el plan del cliente
- **Integraciones específicas** (Mercado Pago, emails)

## 📁 Estructura del Proyecto

```
backend/
├── app/
│   ├── core/                   # Configuración centralizada
│   │   ├── config.py          # Variables de entorno y configuración
│   │   ├── database.py        # Conexión PostgreSQL dedicada
│   │   └── security.py        # JWT y autenticación
│   │
│   ├── middlewares/            # Middlewares personalizados
│   │   ├── cors.py            # Configuración CORS
│   │   ├── error_handling.py  # Manejo de errores
│   │   └── rate_limiting.py   # Rate limiting por plan
│   │
│   ├── models/                 # Modelos SQLAlchemy
│   │   ├── users.py           # Usuarios, roles, autenticación
│   │   ├── products.py        # Productos, categorías, inventario
│   │   ├── orders.py          # Pedidos, pagos, envíos
│   │   └── business.py        # Configuración de negocio
│   │
│   ├── routers/                # Endpoints de la API
│   │   ├── auth.py            # Autenticación y registro
│   │   ├── users.py           # Gestión de usuarios
│   │   ├── products.py        # CRUD de productos
│   │   ├── orders.py          # Gestión de pedidos
│   │   ├── payments.py        # Integración con Mercado Pago
│   │   └── analytics.py       # Métricas y reportes
│   │
│   ├── schemas/                # Validación Pydantic
│   │   ├── auth.py            # Esquemas de autenticación
│   │   ├── users.py           # Validación de usuarios
│   │   ├── products.py        # Validación de productos
│   │   └── orders.py          # Validación de pedidos
│   │
│   ├── services/               # Lógica de negocio
│   │   ├── auth_service.py    # Lógica de autenticación
│   │   ├── product_service.py # Lógica de productos
│   │   ├── order_service.py   # Procesamiento de pedidos
│   │   ├── payment_service.py # Integración de pagos
│   │   └── email_service.py   # Emails con Resend
│   │
│   ├── utils/                  # Utilidades
│   │   ├── dependencies.py    # Dependencias de FastAPI
│   │   ├── exceptions.py      # Excepciones personalizadas
│   │   └── helpers.py         # Funciones auxiliares
│   │
│   └── main.py                # Punto de entrada FastAPI
│
├── migrations/                 # Migraciones de BD (Alembic)
├── requirements.txt            # Dependencias Python
├── .env.example               # Plantilla de configuración
└── README.md                  # Este archivo
```

## 🛠️ Stack Tecnológico

### Framework y Core
- **FastAPI 0.104+** - Framework web moderno y rápido
- **Python 3.13+** - Lenguaje principal
- **Uvicorn** - Servidor ASGI de alto rendimiento
- **Pydantic V2** - Validación de datos y serialización

### Base de Datos
- **PostgreSQL 15+** - Base de datos relacional dedicada
- **SQLAlchemy 2.0+** - ORM con soporte async
- **Alembic** - Migraciones de base de datos
- **asyncpg** - Driver PostgreSQL asíncrono

### Autenticación y Seguridad
- **JWT (PyJWT)** - Tokens de autenticación
- **bcrypt** - Hashing de contraseñas
- **python-multipart** - Manejo de formularios
- **CORS** - Configuración de orígenes permitidos

### Integraciones SaaS
- **Mercado Pago SDK** - Procesamiento de pagos por cliente
- **Resend** - Emails transaccionales con branding
- **Redis** (opcional) - Cache por instancia

## 🚀 Instalación y Configuración

### Prerrequisitos
```bash
# Versiones requeridas
Python 3.13+
PostgreSQL 15+
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

### 2. Configurar Base de Datos
```sql
-- Crear base de datos dedicada para esta instancia
CREATE DATABASE cliente_empresa_db;
CREATE USER cliente_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE cliente_empresa_db TO cliente_user;
```

### 3. Variables de Entorno
```bash
# Copiar plantilla de configuración
cp .env.example .env
```

```env
# .env - Configuración específica de esta instancia de cliente

# Identificación del cliente
CLIENT_NAME=empresa_abc
CLIENT_DOMAIN=empresa-abc.com
INSTANCE_ID=abc_001

# Base de datos dedicada
DATABASE_URL=postgresql://cliente_user:secure_password@localhost:5432/cliente_empresa_db

# JWT específico para esta instancia
JWT_SECRET_KEY=unique_jwt_secret_for_this_client_instance_abc123
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Plan de suscripción y límites
SUBSCRIPTION_PLAN=business
MAX_PRODUCTS=1000
MAX_USERS=10
FEATURES_ENABLED=analytics,inventory,marketing

# Integración Mercado Pago (por cliente)
MERCADOPAGO_ACCESS_TOKEN=TEST-client_specific_access_token
MERCADOPAGO_PUBLIC_KEY=TEST-client_specific_public_key
MERCADOPAGO_WEBHOOK_SECRET=client_webhook_secret

# Email con branding del cliente
RESEND_API_KEY=re_client_specific_key
FROM_EMAIL=noreply@empresa-abc.com
FROM_NAME="Empresa ABC Store"

# Personalización del cliente
BRAND_PRIMARY_COLOR=#1a56db
BRAND_SECONDARY_COLOR=#64748b
COMPANY_LOGO_URL=/assets/empresa-abc-logo.png
SUPPORT_EMAIL=soporte@empresa-abc.com

# Performance settings
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
REDIS_URL=redis://localhost:6379/0
```

### 4. Ejecutar Migraciones
```bash
# Crear tablas en la base de datos dedicada
alembic upgrade head
```

### 5. Iniciar Servidor de Desarrollo
```bash
# Método recomendado (FastAPI CLI)
fastapi dev app/main.py

# Método alternativo (Uvicorn)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🔐 Sistema de Autenticación Simplificado

### Roles por Instancia (Sin Tenant Complexity)
```python
# Sin tenant_id - toda la instancia pertenece al cliente
class UserRole(IntEnum):
    ADMIN = 1      # Administrador de la empresa (dueño de la instancia)
    EMPLOYEE = 2   # Empleado de la empresa
    CUSTOMER = 3   # Cliente/comprador final

# Ejemplo de endpoint sin lógica multi-tenant
@router.post("/products")
async def create_product(
    product_data: ProductCreate,
    current_user: UserInToken = Depends(require_admin()),
    db: Session = Depends(get_db)  # DB única de esta instancia
):
    # Desarrollo normal sin tenant_id
    return await product_service.create_product(db, product_data)
```

### JWT Específico por Instancia
```python
# Cada instancia tiene su propio JWT secret
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # JWT secret único para esta instancia del cliente
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt
```

## 🏛️ Arquitectura Clean Architecture Adaptada

### Capas de la Aplicación

1. **Routers (API Layer)**
   - Endpoints HTTP específicos para esta instancia
   - Validación de entrada con Pydantic
   - Manejo de respuestas HTTP
   - Sin lógica de tenant - toda la API es del cliente

2. **Services (Business Logic)**
   - Lógica de negocio específica del e-commerce
   - Orquestación de operaciones
   - Aplicación de reglas de negocio
   - **Independiente de infraestructura**

3. **Models (Data Layer)**
   - Entidades SQLAlchemy para esta instancia
   - Relaciones entre modelos sin tenant_id
   - Mapeo objeto-relacional

4. **Schemas (Validation Layer)**
   - DTOs con Pydantic para validación
   - Serialización/deserialización
   - Documentación automática

### Ejemplo de Implementación Limpia
```python
# Router (API Layer)
@router.get("/products")
async def get_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(get_current_user)
):
    # Delegación a la capa de servicio
    return await product_service.get_products(db, skip=skip, limit=limit)

# Service (Business Logic)
async def get_products(db: Session, skip: int = 0, limit: int = 100):
    # Lógica de negocio sin tenant complexity
    products = db.query(Product).offset(skip).limit(limit).all()
    return products

# Model (Data Layer)
class Product(Base):
    __tablename__ = "products"
    
    id_producto = Column(DECIMAL, primary_key=True)
    nom_producto = Column(String(255), nullable=False)
    val_precio = Column(DECIMAL(10, 2), nullable=False)
    stock_cantidad = Column(Integer, default=0)
    # Sin tenant_id - toda la tabla pertenece a este cliente
```

## 🎯 Características SaaS por Instancia

### Límites Configurables por Plan
```python
# Middleware de límites basado en el plan del cliente
class SubscriptionLimitMiddleware:
    def __init__(self, max_products: int, max_users: int):
        self.max_products = max_products
        self.max_users = max_users
    
    async def check_product_limit(self, db: Session):
        current_count = db.query(Product).count()
        if current_count >= self.max_products:
            raise HTTPException(
                status_code=402,
                detail=f"Límite de productos alcanzado ({self.max_products}). Actualiza tu plan."
            )
```

### Personalización por Sector
```python
# Configuración específica por tipo de negocio
BUSINESS_CONFIG = {
    "fashion": {
        "product_attributes": ["talla", "color", "material", "genero"],
        "categories": ["ropa", "calzado", "accesorios"],
        "payment_methods": ["mercadopago", "transferencia"]
    },
    "electronics": {
        "product_attributes": ["marca", "modelo", "garantia"],
        "categories": ["smartphones", "computadoras", "audio"],
        "payment_methods": ["mercadopago", "cuotas"]
    }
}
```

### API de Integraciones
```python
# API pública para integraciones del cliente
@router.get("/api/v1/products")
async def public_api_products(
    api_key: str = Depends(validate_api_key),  # API key único del cliente
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db)
):
    # API específica para este cliente - sin tenant_id
    products = await product_service.get_products_for_api(db, limit=limit)
    return {"products": products, "client": CLIENT_NAME}
```

## 🚀 Deployment de Instancia

### Docker para Cliente Específico
```dockerfile
# Dockerfile para instancia del cliente
FROM python:3.13-slim

WORKDIR /app

# Instalar dependencias específicas
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY app/ ./app/

# Variables de entorno del cliente se pasan en docker-compose
ENV PYTHONPATH=/app

# Exponer puerto específico de la instancia
EXPOSE 8000

# Comando de inicio
CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
```

### Health Checks Específicos
```python
# Health check personalizado por instancia
@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Verificar conexión a BD dedicada
        db.execute(text("SELECT 1"))
        
        # Verificar configuración específica del cliente
        config_status = {
            "client": CLIENT_NAME,
            "database": "connected",
            "plan": SUBSCRIPTION_PLAN,
            "features": FEATURES_ENABLED.split(","),
            "mercadopago": "configured" if MERCADOPAGO_ACCESS_TOKEN else "not_configured"
        }
        
        return {"status": "healthy", "instance": config_status}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Instance unhealthy: {str(e)}")
```

## 📊 Ventajas del Backend Aislado

### Para Desarrollo
- ✅ **Sin complejidad multi-tenant** en el código
- ✅ **Desarrollo como aplicación normal** sin tenant_id
- ✅ **Testing simplificado** con datos aislados
- ✅ **Debugging independiente** por cliente
- ✅ **Deploy independiente** sin afectar otros clientes

### Para Operations
- ✅ **Escalado granular** por cliente
- ✅ **Backup independiente** y restore específico
- ✅ **Monitoring dedicado** por instancia
- ✅ **Performance aislada** sin contención
- ✅ **Updates controlados** cliente por cliente

### Para Compliance
- ✅ **Aislamiento total** de datos entre clientes
- ✅ **Audit trail** específico por cliente
- ✅ **Compliance** con regulaciones estrictas (GDPR, CCPA)
- ✅ **Data sovereignty** por geografía del cliente

## 🔧 Comandos Útiles

### Desarrollo
```bash
# Ejecutar servidor con hot reload
fastapi dev app/main.py

# Ejecutar tests específicos de la instancia
pytest tests/ -v

# Verificar tipos con mypy
mypy app/

# Formatear código
black app/
isort app/
```

### Base de Datos
```bash
# Crear nueva migración
alembic revision --autogenerate -m "Add new feature"

# Aplicar migraciones
alembic upgrade head

# Revertir migración
alembic downgrade -1

# Ver historial de migraciones
alembic history
```

### Logs y Debugging
```bash
# Ver logs con detalles
uvicorn app.main:app --log-level debug

# Exportar variables de entorno desde .env
export $(cat .env | xargs)

# Verificar configuración
python -c "from app.core.config import settings; print(settings.dict())"
```

## 📚 Documentación de la API

### Swagger UI Automático
- **Desarrollo**: http://localhost:8000/docs
- **Producción**: https://api.cliente-empresa.com/docs

### ReDoc
- **Desarrollo**: http://localhost:8000/redoc
- **Producción**: https://api.cliente-empresa.com/redoc

### OpenAPI Schema
- **JSON**: http://localhost:8000/openapi.json

## 🧪 Testing

### Estructura de Tests
```bash
tests/
├── conftest.py              # Configuración de pytest
├── test_auth.py            # Tests de autenticación
├── test_products.py        # Tests de productos
├── test_orders.py          # Tests de pedidos
└── integration/            # Tests de integración
    ├── test_mercadopago.py # Tests de pagos
    └── test_email.py       # Tests de emails
```

### Ejecutar Tests
```bash
# Todos los tests
pytest

# Tests específicos
pytest tests/test_products.py -v

# Con coverage
pytest --cov=app tests/
```

## 🤝 Convenciones de Código

### Naming
- **Archivos**: `snake_case` (ej: `product_service.py`)
- **Clases**: `PascalCase` (ej: `ProductService`, `UserModel`)
- **Funciones**: `snake_case` (ej: `get_product_by_id()`)
- **Variables**: `snake_case` (ej: `user_id`, `product_count`)
- **Constantes**: `UPPER_CASE` (ej: `MAX_PRODUCTS`, `JWT_SECRET`)

### Estructura de Funciones
```python
async def create_product(
    db: Session,
    product_data: ProductCreate,
    current_user: UserInToken
) -> ProductResponse:
    """
    Crear un nuevo producto en esta instancia del cliente.
    
    Args:
        db: Sesión de base de datos dedicada
        product_data: Datos del producto validados
        current_user: Usuario autenticado de esta instancia
        
    Returns:
        ProductResponse: Producto creado con metadata
        
    Raises:
        HTTPException: Si se alcanza el límite de productos del plan
    """
    # Implementación aquí
```

---

**Backend Synkro** - API escalable para instancias SaaS aisladas 🛍️⚡ 