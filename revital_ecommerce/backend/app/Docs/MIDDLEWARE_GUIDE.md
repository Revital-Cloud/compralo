# Guía de Middlewares de Autenticación y Autorización

Esta guía explica cómo implementar y usar middlewares para proteger rutas en la API de Revital.

## Tipos de Protección Implementados

### 1. Middlewares Globales
Los middlewares globales se ejecutan en todas las solicitudes HTTP y verifican automáticamente la autenticación según las rutas configuradas.

### 2. Dependencias de FastAPI
Las dependencias se aplican a endpoints específicos y proporcionan un control más granular.

## Middlewares Disponibles

### 1. AuthMiddleware (`middlewares/auth_middleware.py`)

Middleware general que protege rutas específicas basándose en listas configurables.

```python
from middlewares.auth_middleware import AuthMiddleware

# Configuración
auth_middleware = AuthMiddleware(
    protected_paths=["/api/auth/me", "/api/auth/change-password"],
    admin_only_paths=["/api/admin"]
)

# Implementación en main.py
app.middleware("http")(auth_middleware)
```

### 2. ProductMiddleware (`middlewares/auth_middleware.py`)

Middleware específico para operaciones de productos que solo permite a administradores crear, actualizar y eliminar productos.

```python
from middlewares.auth_middleware import product_middleware

# Implementación en main.py
app.middleware("http")(product_middleware)
```

### 3. RoleBasedAccessMiddleware (`middlewares/role_middleware.py`)

Middleware avanzado que controla el acceso basado en roles para diferentes rutas y métodos HTTP.

```python
from middlewares.role_middleware import role_based_middleware

# Configuración personalizada
custom_permissions = {
    "/api/products": {
        "POST": [1],      # Solo administradores
        "PUT": [1],       # Solo administradores
        "DELETE": [1],    # Solo administradores
        "GET": [1, 2]     # Administradores y usuarios
    }
}

role_middleware = RoleBasedAccessMiddleware(custom_permissions)
app.middleware("http")(role_middleware)
```

### 4. AdminOnlyMiddleware (`middlewares/role_middleware.py`)

Middleware simple que solo permite acceso a administradores en rutas específicas.

```python
from middlewares.role_middleware import admin_only_middleware

app.middleware("http")(admin_only_middleware)
```

## Dependencias de FastAPI

### Dependencias Disponibles (`core/dependencies.py`)

```python
from core.dependencies import (
    get_current_user,           # Usuario autenticado requerido
    get_current_user_optional,  # Usuario autenticado opcional
    require_admin,              # Solo administradores
    require_role,               # Rol específico
    require_user_or_admin       # Propietario o administrador
)
```

### Uso en Endpoints

#### Proteger con Autenticación Básica
```python
@router.get("/protected")
async def protected_endpoint(
    current_user: UserInToken = Depends(get_current_user)
):
    return {"message": f"Hola {current_user.email_usuario}"}
```

#### Proteger Solo para Administradores
```python
@router.post("/admin-only")
async def admin_endpoint(
    current_user: UserInToken = Depends(require_admin())
):
    return {"message": "Solo administradores pueden acceder"}
```

#### Proteger con Rol Específico
```python
@router.put("/role-specific")
async def role_endpoint(
    current_user: UserInToken = Depends(require_role(2))  # Solo usuarios normales
):
    return {"message": "Solo usuarios con rol 2 pueden acceder"}
```

## Implementación en Productos

### Ejemplo: Endpoint de Crear Producto

```python
@router.post("/products", response_model=ResponseMessage)
async def create_product(
    nom_producto: str = Form(...),
    val_precio: Decimal = Form(...),
    # ... otros campos ...
    current_user: UserInToken = Depends(require_admin()),  # ← Protección aquí
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo producto (Solo Administradores).
    
    **Requiere autenticación de administrador.**
    """
    # Lógica del endpoint...
```

## Configuración en main.py

```python
from fastapi import FastAPI
from middlewares.auth_middleware import product_middleware
from middlewares.role_middleware import admin_only_middleware

app = FastAPI()

# Agregar middlewares (se ejecutan en orden inverso)
app.middleware("http")(admin_only_middleware)
app.middleware("http")(product_middleware)

# Los middlewares se ejecutan antes que las dependencias
```

## Orden de Ejecución

1. **Middlewares** (en orden inverso al que se agregaron)
2. **Dependencias de FastAPI**
3. **Función del endpoint**

## Ventajas de Cada Enfoque

### Middlewares
- ✅ Protección automática de rutas
- ✅ Configuración centralizada
- ✅ Menos código repetitivo
- ❌ Menos flexibilidad por endpoint

### Dependencias
- ✅ Control granular por endpoint
- ✅ Fácil de entender y mantener
- ✅ Mejor para casos específicos
- ❌ Más código repetitivo

## Recomendaciones

### Para Protección General
Usa middlewares para proteger grupos de rutas:
```python
# Proteger todas las rutas de productos para escritura
app.middleware("http")(product_middleware)
```

### Para Casos Específicos
Usa dependencias para control granular:
```python
# Solo este endpoint necesita verificación especial
@router.post("/special")
async def special_endpoint(
    user: UserInToken = Depends(require_admin())
):
    pass
```

## Manejo de Errores

Los middlewares y dependencias lanzan automáticamente:

- **401 Unauthorized**: Token faltante o inválido
- **403 Forbidden**: Usuario sin permisos suficientes
- **500 Internal Server Error**: Error interno del servidor

## Headers Requeridos

Para endpoints protegidos, incluir en las solicitudes:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Ejemplo de Uso Completo

```python
# 1. Configurar middleware en main.py
app.middleware("http")(admin_only_middleware)

# 2. Proteger endpoint específico
@router.post("/products")
async def create_product(
    data: ProductCreate,
    current_user: UserInToken = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    # Solo administradores pueden crear productos
    return product_service.create_product(db, data)

# 3. Endpoint público (sin protección)
@router.get("/products")
async def get_products(db: Session = Depends(get_db)):
    # Cualquiera puede ver productos
    return product_service.get_products(db)
```

## Logs y Monitoreo

Los middlewares registran automáticamente:
- Accesos exitosos con información del usuario
- Intentos de acceso no autorizados
- Errores de autenticación

```python
# Los logs aparecen como:
# INFO: Usuario admin@ejemplo.com (rol 1) accedió a POST /api/products
# ERROR: Error en middleware de autenticación: Token inválido
```

## Testing

Para probar endpoints protegidos:

```python
# 1. Obtener token
response = client.post("/api/login", json={
    "email": "admin@ejemplo.com",
    "password": "password123"
})
token = response.json()["access_token"]

# 2. Usar token en solicitudes
headers = {"Authorization": f"Bearer {token}"}
response = client.post("/api/products", headers=headers, data=product_data)
``` 