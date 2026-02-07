# Configuración JWT para Revital API

## Instalación de Dependencias

Antes de usar el sistema JWT, instala las dependencias necesarias:

```bash
pip install python-jose[cryptography] passlib[bcrypt]
```

## Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env`:

```env
# Configuración de la base de datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_base_datos

# Configuración de la aplicación
APP_NAME=Revital

# Configuración de seguridad JWT
SECRET_KEY=tu_clave_secreta_muy_segura_aqui_cambiala_en_produccion
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256
REFRESH_TOKEN_EXPIRE_DAYS=7

# Configuración de la API
API_STR=/api
PROJECT_NAME=Revital API
```

## Endpoints de Autenticación

### 1. Registro de Usuario
```http
POST /api/register
Content-Type: application/json

{
    "nom_usuario": "Juan",
    "ape_usuario": "Pérez",
    "email_usuario": "juan@ejemplo.com",
    "password_usuario": "contraseña123",
    "des_direccion": "Calle 123",
    "ind_genero": true,
    "cel_usuario": "1234567890",
    "fec_nacimiento": "1990-01-01"
}
```

**Respuesta:**
```json
{
    "id_usuario": 1234567890123,
    "email_usuario": "juan@ejemplo.com",
    "nom_usuario": "Juan",
    "ape_usuario": "Pérez",
    "id_rol": 2
}
```

### 2. Login
```http
POST /api/login
Content-Type: application/json

{
    "email": "usuario@ejemplo.com",
    "password": "contraseña123"
}
```

**Respuesta:**
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer"
}
```

### 3. Obtener información del usuario actual
```http
GET /api/me
Authorization: Bearer <access_token>
```

### 4. Refrescar token
```http
POST /api/refresh
Content-Type: application/json

{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 5. Cambiar contraseña
```http
POST /api/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "current_password": "contraseña_actual",
    "new_password": "nueva_contraseña"
}
```

### 6. Verificar token
```http
GET /api/verify-token
Authorization: Bearer <access_token>
```

### 7. Logout
```http
POST /api/logout
Authorization: Bearer <access_token>
```

## Uso en Endpoints Protegidos

### Proteger un endpoint con autenticación:

```python
from fastapi import Depends
from core.dependencies import get_current_user
from schemas.auth_schema import UserInToken

@router.get("/endpoint-protegido")
async def endpoint_protegido(
    current_user: UserInToken = Depends(get_current_user)
):
    return {"mensaje": f"Hola {current_user.nom_usuario}!"}
```

### Proteger con roles específicos:

```python
from core.dependencies import require_admin, require_role

@router.get("/admin-only")
async def admin_only(
    current_user: UserInToken = Depends(require_admin())
):
    return {"mensaje": "Solo administradores pueden ver esto"}

@router.get("/role-specific")
async def role_specific(
    current_user: UserInToken = Depends(require_role(2))  # Rol ID = 2
):
    return {"mensaje": "Solo usuarios con rol 2 pueden ver esto"}
```

### Autenticación opcional:

```python
from core.dependencies import get_current_user_optional

@router.get("/endpoint-opcional")
async def endpoint_opcional(
    current_user: Optional[UserInToken] = Depends(get_current_user_optional)
):
    if current_user:
        return {"mensaje": f"Hola {current_user.nom_usuario}!"}
    else:
        return {"mensaje": "Hola usuario anónimo!"}
```

## Estructura de Tokens

### Access Token
- **Duración:** 30 minutos (configurable)
- **Uso:** Autenticación en endpoints protegidos
- **Contenido:** ID de usuario, email, tipo de token, expiración

### Refresh Token
- **Duración:** 7 días (configurable)
- **Uso:** Generar nuevos access tokens
- **Contenido:** ID de usuario, email, tipo de token, expiración

## Seguridad

1. **Contraseñas:** Se hashean usando bcrypt
2. **Tokens:** Se firman con HS256 y la SECRET_KEY
3. **Expiración:** Los tokens tienen tiempo de vida limitado
4. **Validación:** Se verifica la integridad y expiración en cada request

## Manejo de Errores

- **401 Unauthorized:** Token inválido, expirado o faltante
- **403 Forbidden:** Usuario sin permisos suficientes
- **400 Bad Request:** Datos de login incorrectos

## Cambios Importantes

### ✅ Endpoints Actualizados con Hash de Contraseñas

- **`POST /api/users`**: Ahora hashea automáticamente las contraseñas antes de guardarlas
- **`PUT /api/users/{id}`**: Hashea la contraseña si se proporciona en la actualización
- **`POST /api/register`**: Nuevo endpoint específico para registro público con hash automático

## Próximos Pasos

1. **✅ Contraseñas hasheadas:** Ya implementado en todos los endpoints
2. **Implementar blacklist de tokens:** Para logout real (opcional)
3. **Agregar rate limiting:** Para prevenir ataques de fuerza bruta
4. **Implementar reset de contraseña:** Con tokens temporales por email
5. **Validaciones adicionales:** Fuerza de contraseña, formato de email, etc. 