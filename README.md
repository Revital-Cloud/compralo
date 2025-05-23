# Synkro E-Commerce Platform

Plataforma completa de comercio electrónico con backend en FastAPI y frontend moderno.

## Descripción

Synkro es una plataforma de e-commerce moderna y escalable, diseñada para ofrecer una experiencia de compra fluida y una administración eficiente. El proyecto está dividido en dos partes principales:

- **Backend**: API RESTful desarrollada con FastAPI y Python 3.13+
- **Frontend**: Interfaz de usuario moderna desarrollada con tecnologías web actuales

## Estructura del Proyecto

```
synkro/
├── Backend/              # API con FastAPI
│   ├── app/
│   │   ├── core/         # Configuración
│   │   ├── models/       # Modelos de datos (SQLAlchemy)
│   │   ├── routers/      # Rutas de la API
│   │   ├── schemas/      # Esquemas de validación (Pydantic)
│   │   └── services/     # Lógica de negocio
│   └── ...               # Más detalles en Backend/README.md
│
└── Frontend/             # Interfaz de usuario
    ├── app/
    ├── public/
    └── ...               # Más detalles en Frontend/README.md
```

## Requisitos

### Backend
- Python 3.9+
- PostgreSQL
- Dependencias listadas en `Backend/requirements.txt`

### Frontend
- Node.js 16+
- npm o yarn

## Instalación Rápida

1. **Clonar el repositorio**:
   ```
   git clone https://github.com/usuario/synkro.git
   cd synkro
   ```
   
   ```
   git clone https://TU_USUARIO@github.com/KevinBermudezC/synkro.git
   -Para autenticación de dos pasos con token de github
   ```

2. **Configurar el Backend**:
   ```
   cd Backend
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   ```

3. **Configurar el Frontend**:
   ```
   cd ../Frontend
   npm install
   ```

## Ejecución

### Backend
```
cd Backend
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Método recomendado con la versión actual
fastapi dev main.py

# Método alternativo
.\venv\Scripts\uvicorn app.main:app --reload  # Windows
uvicorn app.main:app --reload  # Linux/Mac
```

### Frontend
```
cd Frontend
npm run dev
```

## Características

- **API RESTful**: Endpoints bien definidos y documentados con Swagger UI
- **Base de datos relacional**: Modelos optimizados con SQLAlchemy
- **Autenticación y autorización**: Sistema seguro basado en JWT
- **Interfaz moderna**: Experiencia de usuario optimizada
- **Panel de administración**: Gestión completa de productos, pedidos y clientes

## Documentación

- **API**: Disponible en http://localhost:8000/docs una vez que el servidor backend está en ejecución
- **Backend**: Ver `Backend/README.md` para información detallada
- **Frontend**: Ver `Frontend/README.md` para información detallada

## Contribuir

1. Haz un fork del proyecto
2. Crea una rama para tu funcionalidad (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Sube tu rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo `LICENSE` para más detalles. 