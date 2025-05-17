# Synkro Backend API

API RESTful desarrollada con FastAPI para el proyecto de e-commerce Synkro.

## Estructura del Proyecto

```
Backend/
├── app/
│   ├── core/             # Configuración centralizada
│   │   ├── config.py     # Gestión de variables de entorno
│   │   └── database.py   # Configuración de la base de datos
│   ├── middlewares/      # Middlewares personalizados
│   ├── models/           # Modelos de SQLAlchemy (tablas de BD)
│   ├── routers/          # Definición de rutas API
│   ├── schemas/          # Esquemas Pydantic para validación
│   ├── services/         # Lógica de negocio
│   └── utils/            # Funciones de utilidad
├── main.py               # Punto de entrada de la aplicación
└── requirements.txt      # Dependencias del proyecto
```

## Requisitos

- Python 3.9+
- Base de datos PostgreSQL

## Instalación

1. Clonar el repositorio.
2. Crear un entorno virtual:
   ```
   cd Backend
   python -m venv venv
   ```
3. Activar el entorno virtual:
   ```
   # Windows
   .\venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```
4. Instalar dependencias:
   ```
   pip install -r requirements.txt
   ```

## Configuración

Crear un archivo `.env` en la carpeta `Backend` con las siguientes variables:

```
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/synkro_db
SECRET_KEY=your_secret_key_here
DEBUG=True
```

## Ejecución

Para iniciar el servidor de desarrollo:

```
# Método 1: Usando fastapi CLI (recomendado para la versión actual)
fastapi dev main.py

# Método 2: Usando uvicorn directamente
# Windows
.\venv\Scripts\uvicorn app.main:app --reload

# Linux/Mac
uvicorn app.main:app --reload
```

El servidor estará disponible en: http://127.0.0.1:8000

La documentación automática estará disponible en:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Arquitectura

El backend implementa una arquitectura inspirada en los principios de **Clean Architecture**, adaptada para el ecosistema de FastAPI. Esta arquitectura en capas promueve la separación de responsabilidades (Separation of Concerns) y la modularidad:

1. **Routers (Controllers/API Layer)**: Definen los endpoints HTTP y sus operaciones, manejan las peticiones y respuestas.
   - Responsabilidad: Gestionar la interfaz pública de la API.
   - Tecnología: Dependen directamente de FastAPI.

2. **Schemas (DTO Layer)**: Representan Data Transfer Objects que validan los datos de entrada y salida.
   - Responsabilidad: Validación, serialización/deserialización.
   - Tecnología: Implementados con Pydantic, fuertemente integrado con FastAPI.

3. **Services (Business Logic Layer)**: Contienen la lógica de negocio de la aplicación.
   - Responsabilidad: Orquestar las operaciones, implementar reglas de negocio.
   - **Grado de independencia**: Esta capa es la más independiente de infraestructura, aunque recibe objetos Pydantic y puede trabajar con modelos SQLAlchemy.

4. **Models (Data Access Layer)**: Representan las entidades y su persistencia.
   - Responsabilidad: Definir la estructura de datos y el acceso a base de datos.
   - Tecnología: Dependen directamente de SQLAlchemy ORM.

### Nota sobre la Independencia de Infraestructura

Si bien la arquitectura se inspira en los principios de Clean Architecture, nuestra implementación actual está acoplada a tecnologías específicas:

- Los modelos dependen de SQLAlchemy.
- Los routers dependen de FastAPI.
- Los esquemas dependen de Pydantic.

Para lograr una verdadera independencia de infraestructura según Clean Architecture, necesitaríamos:
- Definir interfaces abstractas (protocolos) para el acceso a datos
- Separar los modelos de dominio de los modelos de persistencia
- Implementar inversión de dependencias más estricta

En la implementación actual, priorizamos la productividad y las convenciones del ecosistema de FastAPI sobre la pureza arquitectónica, lo que representa un compromiso práctico para proyectos de tamaño mediano.

### Beneficios de la Arquitectura Actual

Aunque no es una Clean Architecture pura, nuestra estructura ofrece beneficios importantes:
- **Mantenibilidad**: Separación clara de responsabilidades
- **Testabilidad**: La lógica de negocio en la capa de servicios es relativamente fácil de probar
- **Escalabilidad**: Organización modular que permite crecimiento ordenado
- **Claridad**: Estructura del proyecto intuitiva y familiar para desarrolladores de FastAPI

## Convenciones

- **Nombres de archivos**: snake_case (ej: `user_router.py`)
- **Nombres de clases**: PascalCase (ej: `UserModel`, `ProductSchema`)
- **Nombres de funciones**: snake_case (ej: `get_user_by_id()`)
- **Variables**: snake_case (ej: `user_id`, `product_count`) 