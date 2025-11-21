# Synkro Backend

Backend API para la plataforma Synkro.

## Estructura del Proyecto

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
│   ├── schemas/                # Validación Pydantic
│   ├── services/               # Lógica de negocio
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

```

### 3. Iniciar Servidor de Desarrollo

```bash
# Método recomendado (FastAPI CLI)
fastapi dev app/main.py

# Método alternativo (Uvicorn)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Verificar Instalación

```bash
# Verificar que el servidor esté funcionando
curl http://localhost:8000/

# Verificar documentación de la API
# Abrir en navegador: http://localhost:8000/docs
```

## 📚 Documentación de la API

### Swagger UI Automático

- **Desarrollo**: http://localhost:8000/docs
- **Producción**: https://api.synkro.com/docs

### ReDoc

- **Desarrollo**: http://localhost:8000/redoc

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

---

**Synkro Backend** - API escalable y moderna 🚀

