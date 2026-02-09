# 🎯 **GUIÓN PARA EXPOSICIÓN: BACKEND REVITAL E-COMMERCE**

---

## 📋 **INTRODUCCIÓN (2-3 minutos)**

### **Presentación del Proyecto**
> "Buenos días/tardes. Hoy les voy a presentar el backend que hemos desarrollado para Revital, una plataforma SaaS de e-commerce. Este backend está diseñado para ser **escalable, seguro y modular**, utilizando tecnologías modernas como **FastAPI, JWT y PostgreSQL**."

### **Objetivo de la Exposición**
> "En los próximos minutos vamos a recorrer:
> 1. La **arquitectura general** del sistema
> 2. El **sistema de seguridad y encriptación**
> 3. La **lógica de negocio por módulos**
> 4. Los **flujos principales** de autenticación"

---

## 🏗️ **ARQUITECTURA GENERAL (3-4 minutos)**

### **Estructura del Proyecto**
> "Hemos organizado el backend siguiendo el **patrón de arquitectura por capas**:"

```
backend/
├── core/        → Configuración y utilidades centrales
├── routers/     → Endpoints de la API (capa de presentación)
├── services/    → Lógica de negocio (capa de aplicación)
├── schemas/     → Validación de datos con Pydantic
├── middlewares/ → Interceptores de seguridad
└── templates/   → Plantillas de emails
```

### **Tecnologías Principales**
> "Las tecnologías que elegimos son:
> - **FastAPI**: Por su rendimiento y documentación automática
> - **SQLAlchemy**: Como ORM para manejo de base de datos
> - **Pydantic**: Para validación automática de datos
> - **JWT**: Para autenticación stateless
> - **BCrypt**: Para encriptación segura de contraseñas
> - **Resend**: Para el sistema de emails transaccionales"

### **Flujo General de Request**
> "Cada petición sigue este flujo:"
```
Cliente → Middleware → Router → Service → Database → Response
   ↓         ↓          ↓        ↓         ↓         ↑
Validación → Auth → Endpoint → Lógica → SQL → Transformación
```

---

## 🗄️ **CONFIGURACIÓN DE BASE DE DATOS (3-4 minutos)**

### **Arquitectura de Datos**
> "Para la persistencia utilizamos **PostgreSQL con SQLAlchemy** como ORM, siguiendo el patrón de **deployment aislado** para cada cliente:"

```python
# core/database.py - Configuración principal
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Motor de base de datos - conecta directamente con PostgreSQL
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

### **Gestión de Sesiones**
> "Implementamos un **generador de sesiones** que garantiza el manejo seguro de conexiones:"

```python
def get_db():
    """Dependency injection para sesiones de DB"""
    db = SessionLocal()
    try:
        yield db  # Proporciona la sesión al endpoint
    finally:
        db.close()  # Cierre automático - evita memory leaks
```

### **Ventajas de Nuestra Configuración de DB**

**Pool de Conexiones:**
> "- SQLAlchemy maneja automáticamente un **pool de conexiones reutilizables**
> - Optimiza el rendimiento evitando crear/cerrar conexiones constantemente
> - Configuración automática según la carga del sistema"

**Transacciones Seguras:**
> "- `autocommit=False`: Control manual de transacciones
> - `autoflush=False`: Optimización de performance  
> - Rollback automático en caso de errores"

**Deployment Aislado por Cliente:**
```python
# Cada cliente SaaS tiene su propia instancia de DB
# Cliente A: postgresql://user:pass@host:5432/cliente_a_db
# Cliente B: postgresql://user:pass@host:5432/cliente_b_db
# Sin complejidad de tenant_id - desarrollo simplificado
```

### **Uso en Endpoints**
> "Cada router utiliza **dependency injection** para obtener la sesión:"

```python
@router.get("/products")
async def get_products(
    db: Session = Depends(get_db)  # ⭐ Inyección automática
):
    # db es una sesión activa y segura
    products = db.query(Product).all()
    return products
    # db.close() se ejecuta automáticamente
```

### **Esquema de Base de Datos**
> "Diseñamos un esquema **normalizado y escalable**:"

```sql
-- Estructura principal de tablas
tab_usuarios (id_usuario, email, password_hash, id_rol)
tab_productos (id_producto, nom_producto, val_precio, stock_cantidad)  
tab_categorias (id_categoria, nom_categoria, desc_categoria)
tab_marcas (id_marca, nom_marca, desc_marca)
tab_favoritos (id_favorito, id_usuario, id_producto) -- Relación N:M
```

---

## 🔐 **SISTEMA DE SEGURIDAD Y ENCRIPTACIÓN (5-6 minutos)**

### **Encriptación de Contraseñas**
> "Para las contraseñas utilizamos **BCrypt**, que es considerado el estándar de la industria:"

```python
# Ejemplo de encriptación
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)  # Salt automático + hash
```

> "**¿Por qué BCrypt?**
> - Genera un **salt único** para cada contraseña
> - Es **computacionalmente costoso**, lo que lo hace resistente a ataques de fuerza bruta
> - Es **irreversible** - no se puede 'desencriptar', solo verificar"

### **Sistema JWT (JSON Web Tokens)**
> "Implementamos **cuatro tipos de tokens diferentes**:"

```
1. Access Token  → Vida corta (15-30 min) - Para operaciones
2. Refresh Token → Vida larga (7 días) - Para renovar access
3. Verification Token → 24 horas - Para verificar email
4. Reset Token → 1 hora - Para cambio de contraseña
```

> "**Estructura de un JWT:**"
```
Header.Payload.Signature

Header: {"alg": "HS256", "typ": "JWT"}
Payload: {"sub": "user_id", "email": "user@email.com", "exp": timestamp}
Signature: HMACSHA256(encoded_header + encoded_payload, secret_key)
```

> "La **clave secreta** está protegida en variables de entorno y cada token incluye **tiempo de expiración** y **tipo específico** para mayor seguridad."

### **Middleware Inteligente de Autenticación**
> "Desarrollamos un middleware que **categoriza automáticamente** las rutas:"

```python
RUTAS PÚBLICAS (sin autenticación):
- GET: Catálogo de productos, marcas, categorías
- POST: Login, registro, verificación de email

RUTAS PRIVADAS (con autenticación):
- GET: Información personal (/me, /favoritos)
- POST/PUT/DELETE: Operaciones administrativas
```

### **Control de Acceso por Roles**
> "Implementamos un sistema granular de permisos:"

```
Rol 1 (Administrador): Acceso completo al sistema
Rol 2 (Usuario): Acceso limitado a funciones de cliente

Ejemplo:
- Productos GET: Todos pueden ver
- Productos POST/PUT/DELETE: Solo administradores
- Favoritos: Solo el propietario de la cuenta
```

---

## 📱 **LÓGICA DE NEGOCIO POR MÓDULOS (6-8 minutos)**

### **Patrón Arquitectónico**
> "Cada módulo sigue el mismo patrón de **separación de responsabilidades**:"

```
Router (HTTP) → Service (Lógica) → Database (Persistencia)
     ↑              ↑                    ↑
Schema (Validación) → Middleware (Seguridad) → SQL Functions
```

### **1. Módulo de Productos**
> "Este es nuestro módulo principal del e-commerce:"

**Funcionalidades Públicas:**
```python
GET /api/products           # Catálogo público - Sin autenticación
GET /api/products/{id}      # Detalle de producto - Sin autenticación
```

**Funcionalidades Administrativas:**
```python
POST /api/products          # Crear producto - Solo admin
PUT /api/products/{id}      # Actualizar producto - Solo admin  
PUT /api/products/{id}/deactivate # Desactivar - Solo admin
```

> "La **lógica de negocio** incluye validación de datos, manejo de especificaciones en JSON, control de stock y gestión de imágenes."

### **2. Módulo de Usuarios**
> "Maneja tres tipos de operaciones diferentes:"

```python
# Registro público
POST /api/users             # Cualquiera puede registrarse

# Gestión administrativa  
GET /api/users              # Solo admin ve lista de usuarios
PUT /api/users/{id}         # Solo admin actualiza usuarios
DELETE /api/users/{id}      # Solo admin elimina usuarios

# Perfil personal
GET /api/me                 # Usuario ve su información
PUT /api/me                 # Usuario actualiza su perfil
```

### **3. Módulo de Favoritos**
> "Funcionalidad completamente **personal** - cada usuario solo puede ver y gestionar sus propios favoritos:"

```python
GET /api/favorites          # Mis favoritos
POST /api/favorites         # Agregar a mis favoritos
DELETE /api/favorites/{id}  # Eliminar de mis favoritos
```

### **4. Módulos de Catálogo**
> "Marcas, Categorías, Líneas y Sublíneas siguen el **mismo patrón**:"

```python
Lectura: PÚBLICA - Todos pueden ver el catálogo
Escritura: ADMINISTRATIVA - Solo admins pueden gestionar
```

### **5. Módulo de Emails**
> "Sistema transaccional completo con **cuatro categorías**:"

```python
1. Autenticación: Bienvenida, verificación, reset de contraseña
2. Transaccionales: Confirmaciones de pedido, estados de envío  
3. Marketing: Newsletter, carrito abandonado, recomendaciones
4. Administrativos: Notificaciones a admins (nuevos pedidos, stock bajo)
```

---

## 🔄 **FLUJOS PRINCIPALES (4-5 minutos)**

### **Flujo de Registro de Usuario**
> "Veamos el proceso completo de registro:"

```
1. Usuario envía datos → Validación con Pydantic
2. Email único → Verificación en base de datos  
3. Contraseña → Hash con BCrypt + salt
4. Inserción en BD → Función SQL segura
5. Email de bienvenida → Template personalizado
6. Token de verificación → JWT con 24h de vida
```

### **Flujo de Autenticación**
> "El proceso de login es el siguiente:"

```
1. Usuario envía email/password
2. Buscar usuario en BD
3. Verificar contraseña con BCrypt
4. Generar Access Token (30 min)
5. Generar Refresh Token (7 días)
6. Retornar ambos tokens al cliente
```

### **Flujo de Operación Protegida**
> "Cuando un usuario hace una operación protegida:"

```
1. Middleware intercepta la request
2. Extrae token del header Authorization
3. Verifica firma y expiración del JWT
4. Busca usuario en base de datos
5. Verifica permisos según el rol
6. Permite o deniega el acceso
```

---

## 🎯 **CARACTERÍSTICAS DESTACADAS (2-3 minutos)**

### **Configuración SaaS Multi-tenant**
> "El sistema está diseñado para **múltiples clientes**:"

```python
# Cada instancia tiene su configuración personalizada
COMPANY_NAME: "Brillo Rosa"
APP_NAME: "Mi Tienda Online"  
FRONTEND_URL: "https://cliente.midominio.com"
SUPPORT_EMAIL: "soporte@cliente.com"
```

### **Ventajas de Nuestra Arquitectura**

**Seguridad:**
> "- Contraseñas hasheadas con BCrypt + salt automático
> - Tokens JWT firmados con expiración automática
> - Control granular de permisos por rol
> - Middleware de autenticación inteligente"

**Escalabilidad:**
> "- Autenticación stateless (sin sesiones en servidor)
> - Arquitectura modular fácilmente extensible
> - API RESTful estándar
> - Separación clara de responsabilidades"

**Mantenibilidad:**
> "- Código bien documentado y organizado
> - Schemas de validación automática
> - Manejo centralizado de errores
> - Logging estructurado para debugging"

---

## 🔮 **PRÓXIMOS PASOS Y CONCLUSIONES (1-2 minutos)**

### **Funcionalidades Futuras**
> "En las próximas iteraciones planeamos implementar:
> - Sistema de pedidos y pagos
> - Notificaciones push en tiempo real
> - Analytics y reportes administrativos
> - Sistema de reviews y calificaciones
> - Integración con servicios de logística"

### **Conclusión**
> "Hemos construido un backend **robusto, seguro y escalable** que:
> - Maneja la seguridad de forma profesional
> - Organiza el código de manera mantenible
> - Permite escalar fácilmente con nuevas funcionalidades
> - Proporciona una base sólida para el crecimiento del negocio"

### **Preguntas**
> "¿Hay alguna pregunta sobre la arquitectura, la seguridad o la lógica de negocio que hemos implementado?"

---

## 📝 **TIPS PARA LA EXPOSICIÓN**

1. **Tiempo total sugerido**: 20-25 minutos + 5-10 minutos de preguntas
2. **Mostrar código**: Prepara snippets específicos para mostrar en pantalla
3. **Diagramas**: Usa los diagramas de flujo para explicar visualmente
4. **Ejemplos prácticos**: Menciona casos de uso reales del e-commerce
5. **Enfoque en beneficios**: Siempre explica POR QUÉ elegiste cada tecnología
6. **Preparar preguntas frecuentes**: Sobre escalabilidad, seguridad, performance

---

## 🎨 **DIAGRAMAS DE APOYO**

### **Diagrama de Arquitectura**
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   Cliente   │───▶│  Middleware  │───▶│   Router    │───▶│   Service    │
│  (Frontend) │    │ (Seguridad)  │    │ (Endpoints) │    │  (Lógica)    │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                                                                    │
                                                                    ▼
                                                           ┌──────────────┐
                                                           │   Database   │
                                                           │ (PostgreSQL) │
                                                           └──────────────┘
```

### **Diagrama de Autenticación JWT**
```
┌─────────────┐                                ┌─────────────┐
│   Usuario   │ 1. Login (email/password)     │   Backend   │
│             │──────────────────────────────▶│             │
│             │                                │             │
│             │ 2. Access + Refresh Tokens    │             │
│             │◀──────────────────────────────│             │
│             │                                │             │
│             │ 3. Request + Access Token     │             │
│             │──────────────────────────────▶│             │
│             │                                │             │
│             │ 4. Response (if valid)        │             │
│             │◀──────────────────────────────│             │
└─────────────┘                                └─────────────┘
```

### **Matriz de Permisos**
```
┌─────────────┬─────────┬─────────┬─────────┬─────────┐
│   Módulo    │   GET   │  POST   │   PUT   │ DELETE  │
├─────────────┼─────────┼─────────┼─────────┼─────────┤
│ Productos   │ PÚBLICO │  ADMIN  │  ADMIN  │  ADMIN  │
│ Usuarios    │  ADMIN  │ PÚBLICO │  ADMIN  │  ADMIN  │
│ Favoritos   │  OWNER  │  OWNER  │    -    │  OWNER  │
│ Marcas      │ PÚBLICO │  ADMIN  │  ADMIN  │  ADMIN  │
│ Categorías  │ PÚBLICO │  ADMIN  │  ADMIN  │  ADMIN  │
└─────────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## 📚 **ANEXOS TÉCNICOS**

### **Tecnologías Utilizadas**

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| Framework | FastAPI | 0.104+ | API REST |
| Base de Datos | PostgreSQL | 15+ | Persistencia |
| ORM | SQLAlchemy | 2.0+ | Mapeo objeto-relacional |
| Validación | Pydantic | 2.0+ | Schemas y validación |
| Autenticación | JWT (PyJWT) | 2.8+ | Tokens de acceso |
| Encriptación | BCrypt | 4.0+ | Hash de contraseñas |
| Emails | Resend | 0.6+ | Emails transaccionales |
| CORS | FastAPI CORS | - | Cross-origin requests |

### **Estructura de Base de Datos**

```sql
-- Tablas principales
tab_usuarios      -- Gestión de usuarios
tab_productos     -- Catálogo de productos  
tab_favoritos     -- Favoritos de usuarios
tab_marcas        -- Marcas de productos
tab_categorias    -- Categorías de productos
tab_lineas        -- Líneas de productos
tab_sublineas     -- Sublíneas de productos
tab_proveedores   -- Proveedores
```

### **Variables de Entorno Requeridas**

```bash
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost/revital

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Emails
RESEND_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Your Company

# URLs del frontend
FRONTEND_URL=https://yourdomain.com
VERIFY_EMAIL_URL=https://yourdomain.com/verify
RESET_PASSWORD_URL=https://yourdomain.com/reset

# Configuración de la empresa
COMPANY_NAME=Your Company
APP_NAME=Your App
COMPANY_TAGLINE=Your Tagline
SUPPORT_EMAIL=support@yourdomain.com
``` 