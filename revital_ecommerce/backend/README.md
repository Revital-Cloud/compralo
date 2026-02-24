# Revital Backend - API SaaS de E-Commerce 🚀
 
**API RESTful de alto rendimiento para deployment de instancias aisladas**

El backend de Revital está diseñado para funcionar como una API independiente por cada cliente SaaS. Cada instancia tiene su propia base de datos PostgreSQL y configuración específica, eliminando la complejidad multi-tenant tradicional.

**Requisitos y trazabilidad:** La especificación de requisitos de software (SRS) de revital_ecommerce, según IEEE 830-1998, está en [revital_ecommerce/docs/SRS_REVITAL_ECOMMERCE_IEEE830.md](../docs/SRS_REVITAL_ECOMMERCE_IEEE830.md). Los requisitos funcionales (RF-xx) y no funcionales (RNF-xx) definidos allí son la referencia para diseño, implementación y pruebas.

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
- **Integraciones específicas** (Wompi, emails)

## 📁 Estructura del Proyecto

```
backend/
├── app/
│   ├── core/                   # Configuración centralizada
│   │   ├── config.py          # Variables de entorno y configuración
│   │   ├── database.py        # Conexión PostgreSQL dedicada
│   │   ├── dependencies.py    # Dependencias de FastAPI
│   │   └── jwt_utils.py       # Utilidades JWT
│   │
│   ├── middlewares/            # Middlewares personalizados
│   │   ├── auth_middleware.py # Middleware de autenticación
│   │   └── role_middleware.py # Middleware de roles
│   │
│   ├── routers/                # Endpoints de la API (24 routers)
│   │   ├── auth_router.py     # Autenticación y registro
│   │   ├── user_router.py     # Gestión de usuarios
│   │   ├── product_router.py  # CRUD de productos con filtros
│   │   ├── category_router.py # Gestión de categorías
│   │   ├── lines_routers.py   # Gestión de líneas
│   │   ├── subline_router.py  # Gestión de sublíneas
│   │   ├── brand_router.py    # Gestión de marcas
│   │   ├── provider_router.py # Gestión de proveedores
│   │   ├── cart_product_router.py # Sistema de carrito
│   │   ├── order_router.py    # Gestión de pedidos
│   │   ├── payment_router.py  # Integración con Wompi
│   │   ├── address_router.py  # Gestión de direcciones
│   │   ├── favorites_router.py # Sistema de favoritos
│   │   ├── discount_router.py # Sistema de descuentos
│   │   ├── points_router.py   # Sistema de puntos
│   │   ├── email_router.py    # Emails con Resend
│   │   ├── cms_router.py      # Gestión de contenido
│   │   ├── comentary_router.py # Sistema de comentarios
│   │   ├── exchange_router.py # Sistema de canjes
│   │   ├── movements_inventory_router.py # Movimientos de inventario
│   │   └── order_buy_provider_router.py # Órdenes a proveedores
│   │
│   ├── schemas/                # Validación Pydantic (24 schemas)
│   │   ├── auth_schema.py     # Esquemas de autenticación
│   │   ├── user_schema.py     # Validación de usuarios
│   │   ├── product_schema.py  # Validación de productos
│   │   ├── category_schema.py # Validación de categorías
│   │   ├── cart_schema.py     # Validación de carrito
│   │   ├── order_schema.py    # Validación de pedidos
│   │   └── ...                # Más schemas específicos
│   │
│   ├── services/               # Lógica de negocio (27 servicios)
│   │   ├── auth_service.py    # Lógica de autenticación
│   │   ├── product_service.py # Lógica de productos
│   │   ├── cart_service.py    # Lógica de carrito
│   │   ├── order_service.py   # Procesamiento de pedidos
│   │   ├── payment_service.py # Integración de pagos
│   │   ├── email_service.py   # Emails con Resend
│   │   └── ...                # Más servicios específicos
│   │
│   ├── templates/              # Plantillas de email
│   │   └── emails/            # Templates HTML para emails
│   │
│   ├── Docs/                   # Documentación técnica
│   │   ├── DOCUMENTATION.md   # Documentación general
│   │   ├── JWT_SETUP.md       # Configuración JWT
│   │   ├── RESEND_IMPLEMENTATION.md # Integración Resend
│   │   └── ...                # Más documentación
│   │
│   └── main.py                # Punto de entrada FastAPI
│
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

### Autenticación y Seguridad

- **JWT (PyJWT)** - Tokens de autenticación
- **argon2-cffi** - Hashing de contraseñas seguro
- **python-multipart** - Manejo de formularios
- **CORS** - Configuración de orígenes permitidos

### Integraciones SaaS

- **Wompi SDK** - Procesamiento de pagos por cliente
- **Resend** - Emails transaccionales con branding
- **Groq (LLM)** - Asistente de administración conectado al panel (`/api/admin/ai/*`)
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
# Navega al backend del e-commerce:
cd revital_ecommerce/backend

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

El backend carga primero `.env` y luego el archivo del entorno actual (`.env.development` o `.env.production`) según la variable **ENVIRONMENT** (por defecto: `development`).

```bash
# Copiar plantillas
cp .env.example .env
cp .env.development.example .env.development   # para desarrollo
cp .env.production.example .env.production    # para producción
```

- **Desarrollo:** no hace falta exportar nada; se usa `.env.development` por defecto.
- **Producción:** en el servidor, exporta `ENVIRONMENT=production` para que se cargue `.env.production`.

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

# Integración Wompi (por cliente)
WOMPI_ACCESS_TOKEN=TEST-client_specific_access_token
WOMPI_PUBLIC_KEY=TEST-client_specific_public_key
WOMPI_WEBHOOK_SECRET=client_webhook_secret

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

### 4. Iniciar Servidor de Desarrollo

```bash
# Desde revital_ecommerce/backend/
# Método recomendado (FastAPI CLI)
# Nota: usa --host 0.0.0.0 para que sea accesible por IP (LAN) y no solo por localhost
fastapi dev app/main.py --host 0.0.0.0 --port 8000

# Método alternativo (Uvicorn)
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Verificar Instalación

```bash
# Verificar que el servidor esté funcionando
curl http://localhost:8000/

# Si quieres probar desde otro dispositivo en la misma red:
# curl http://TU_IP_LOCAL:8000/

# Verificar documentación de la API
# Abrir en navegador: http://localhost:8000/docs
```

### 6. Endpoints Principales Disponibles

- **Autenticación**: `/api/auth/*`
- **Productos**: `/api/products/*`
- **Carrito**: `/api/cart/*`
- **Órdenes**: `/api/orders/*`
- **Usuarios**: `/api/users/*`
- **Categorías**: `/api/categories/*`
- **Marcas**: `/api/brands/*`
- **Proveedores**: `/api/providers/*`
- **Pagos**: `/api/payments/*`

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

## 🎯 Características SaaS Implementadas

### Sistema de Autenticación Completo

- **JWT Tokens** con refresh automático
- **Roles jerárquicos**: Admin, Employee, Customer
- **Middleware de autenticación** automático
- **Protección de rutas** por rol
- **Sistema de permisos** granular

### Gestión de Productos Avanzada

- **CRUD completo** de productos
- **Sistema de filtros** con función de base de datos optimizada
- **Búsqueda en tiempo real** con autocompletado
- **Gestión de inventario** con movimientos
- **Sistema de categorías** jerárquico (3 niveles)
- **Gestión de marcas y proveedores**

### Sistema de Carrito Funcional

- **Carrito persistente** para usuarios anónimos y registrados
- **Cálculos automáticos** de totales, descuentos e impuestos
- **Migración automática** de carrito anónimo a usuario
- **Validación de stock** en tiempo real
- **Sistema de puntos** de fidelidad

### Gestión de Órdenes y Pagos

- **Procesamiento de órdenes** completo
- **Integración con Wompi** para pagos
- **Sistema de direcciones** para envíos
- **Tracking de órdenes** en tiempo real
- **Gestión de proveedores** y compras

### Sistema de Descuentos y Fidelidad

- **Descuentos por producto** y categoría
- **Sistema de puntos** acumulables
- **Canjes de puntos** por productos
- **Descuentos por usuario** personalizados
- **Cupones de descuento** con validación

### Integraciones Externas

- **Resend** para emails transaccionales
- **Wompi** para procesamiento de pagos
- **Groq** para el asistente de administración que:
  - Resume el estado de la tienda (ventas, órdenes, productos, alertas de stock)
  - Responde preguntas de analytics (categorías top, conversión, regiones, horas pico, demografía)
  - Sugiere y ejecuta acciones administrativas tras confirmación (crear marcas, proveedores, descuentos, actualizar barra superior)
- **Sistema de templates** de email personalizables
- **Cloudinary** para gestión de imágenes (opcional)

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
            "wompi": "configured" if WOMPI_ACCESS_TOKEN else "not_configured"
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
fastapi dev app/main.py --host 0.0.0.0 --port 8000

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

**Backend Revital** - API escalable para instancias SaaS aisladas 🛍️⚡
