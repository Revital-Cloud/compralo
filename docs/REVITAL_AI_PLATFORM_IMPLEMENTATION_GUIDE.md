# 🚀 Revital AI Platform - Guía de Implementación Completa

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Decisiones Técnicas Clave](#decisiones-técnicas-clave)
4. [Preparación del Backend de Compralo](#preparación-del-backend-de-compralo)
5. [Implementación por Fases](#implementación-por-fases)
6. [Especificaciones Técnicas Detalladas](#especificaciones-técnicas-detalladas)
7. [Deployment e Infraestructura](#deployment-e-infraestructura)
8. [Próximos Pasos](#próximos-pasos)

---

## 🎯 Visión General

### ¿Qué es Revital AI Platform?

Revital es una **plataforma SaaS** que permite a usuarios crear tiendas de ecommerce completas mediante **descripciones en lenguaje natural procesadas por IA**. 

### Flujo de Usuario

```
Usuario escribe: "Quiero una tienda de ropa deportiva moderna..."
    ↓
IA (Claude 3.5) genera configuración JSON completa
    ↓
Sistema crea:
  ✅ Frontend personalizado (Next.js)
  ✅ Backend API (FastAPI)
  ✅ Base de datos PostgreSQL
  ✅ Deploy en subdominio (tienda123.revital.com)
    ↓
Usuario refina con editor visual
    ↓
Tienda lista para vender
```

### Características Principales

- ✨ **Generación con IA**: Describe tu tienda y la IA la crea
- 🎨 **Editor Visual**: Personaliza colores, layout, componentes
- 🏪 **Tiendas Completas**: Frontend + Backend + DB por tienda
- 🌐 **Subdominios Dinámicos**: Cada tienda en su propio subdominio
- 📦 **Sistema Base Probado**: Usa Compralo como template (sistema robusto ya funcional)

---

## 🏗️ Arquitectura del Sistema

### Diagrama de 3 Capas

```
┌─────────────────────────────────────────────────────────┐
│  REVITAL (revital.com)                                    │
│  Panel de Control + Generador IA                        │
│                                                          │
│  Frontend: Next.js + Store Builder UI                   │
│  Backend: FastAPI + LLM Integration                     │
│  Database: PostgreSQL (gestión de tiendas)             │
│                                                          │
│  Funciones:                                             │
│  • Autenticación de clientes                            │
│  • Generación de tiendas vía IA                        │
│  • Editor visual                                        │
│  • Deploy automation                                    │
│  • Billing y suscripciones                             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Git Submodule (Template Base)
                   ▼
┌─────────────────────────────────────────────────────────┐
│  COMPRALO (github.com/tu-org/compralo)                  │
│  Template Base + Librería de Componentes                │
│                                                          │
│  Contenido:                                             │
│  • Componentes reutilizables (Header, Hero, Footer)    │
│  • Componentes dinámicos (DynamicHero, etc.)           │
│  • Sistema de diseño (Tailwind + shadcn/ui)            │
│  • Hooks y servicios (useCart, useAuth, etc.)          │
│  • Backend FastAPI completo (CRUD, auth, payments)     │
│  • Schema de base de datos PostgreSQL                  │
│  • Templates configurables (.template.tsx)             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Genera Instancias
                   ▼
┌─────────────────────────────────────────────────────────┐
│  TIENDAS GENERADAS                                      │
│                                                          │
│  store-1.revital.com (Ropa Deportiva)                   │
│  ├── Frontend personalizado                             │
│  ├── Backend independiente                              │
│  └── PostgreSQL database                                │
│                                                          │
│  store-2.revital.com (Electrónica)                      │
│  ├── Frontend personalizado                             │
│  ├── Backend independiente                              │
│  └── PostgreSQL database                                │
│                                                          │
│  cliente-xyz.com (Dominio personalizado)               │
│  ├── Frontend personalizado                             │
│  ├── Backend independiente                              │
│  └── PostgreSQL database                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Decisiones Técnicas Clave

### 1. ¿Git Submodule o NPM Package?

**Decisión: Git Submodule** ✅

**Razones:**
- ✅ **Sin costos**: No necesitas npm registry privado ($7/mes)
- ✅ **Versionado Git nativo**: Control total con tags y branches
- ✅ **Actualización fácil**: `git submodule update --remote`
- ✅ **Path futuro a NPM**: Puedes migrar cuando crezcas
- ✅ **Desarrollo en paralelo**: Mejoras en Compralo se propagan

**Implementación:**
```bash
# En el repo de Revital
cd revital-platform
git submodule add https://github.com/tu-org/compralo.git compralo-template
git submodule update --init --recursive

# Para actualizar componentes de Compralo
git submodule update --remote compralo-template
git commit -m "Update Compralo template to latest version"
```

### 2. Backend: ¿Modificar Compralo o Mantenerlo?

**Decisión: Mantener backend de Compralo SIN cambios mayores** ✅

**Por qué:**
- ✅ El backend actual ya es robusto y completo
- ✅ Tiene todas las features necesarias (auth, CRUD, payments, points)
- ✅ Cada tienda generada es una copia independiente
- ✅ Mantenimiento centralizado

**Cambios MÍNIMOS necesarios en Compralo:**

#### Archivo: `backend/app/core/config.py`

```python
# AGREGAR estas variables opcionales

class Settings(BaseSettings):
    # ... configuración actual (sin tocar) ...
    
    # NUEVO: Variables para tiendas generadas
    STORE_ID: Optional[int] = None  # ID único de la tienda
    STORE_NAME: Optional[str] = None  # Nombre de la tienda
    IS_GENERATED_STORE: bool = False  # True si es instancia generada
    
    # OPCIONAL: Features toggleables
    ENABLE_POINTS_SYSTEM: bool = True
    ENABLE_DISCOUNTS: bool = True
    ENABLE_WOMPI_PAYMENTS: bool = True
    ENABLE_FAVORITES: bool = True
```

#### Crear carpeta: `templates/backend-template/`

```
compralo/
├── backend/  (código actual, sin tocar)
└── templates/
    └── backend-template/
        ├── .env.template  (plantilla con placeholders)
        ├── Dockerfile.template
        └── README.md
```

**Contenido de `.env.template`:**
```bash
# Generado automáticamente por Revital
# Variables específicas de la tienda

# Identificación
STORE_ID={{STORE_ID}}
STORE_NAME={{STORE_NAME}}
IS_GENERATED_STORE=true

# Base de datos (única por tienda)
DATABASE_URL=postgresql://store_user:{{DB_PASSWORD}}@db_store_{{STORE_ID}}:5432/store_{{STORE_ID}}

# Seguridad (clave única por tienda)
SECRET_KEY={{SECRET_KEY}}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Información de la tienda
COMPANY_NAME={{COMPANY_NAME}}
APP_NAME={{APP_NAME}}
COMPANY_TAGLINE={{COMPANY_TAGLINE}}
SUPPORT_EMAIL={{SUPPORT_EMAIL}}

# Cloudinary (carpeta específica por tienda)
CLOUDINARY_CLOUD_NAME={{CLOUDINARY_CLOUD_NAME}}
CLOUDINARY_API_KEY={{CLOUDINARY_API_KEY}}
CLOUDINARY_API_SECRET={{CLOUDINARY_API_SECRET}}

# URLs
FRONTEND_URL=https://store-{{STORE_ID}}.revital.com
VERIFY_EMAIL_URL=https://store-{{STORE_ID}}.revital.com/auth/verify-email
RESET_PASSWORD_URL=https://store-{{STORE_ID}}.revital.com/auth/reset-password

# Resend (emails)
RESEND_API_KEY={{RESEND_API_KEY}}
RESEND_FROM_EMAIL={{RESEND_FROM_EMAIL}}
RESEND_FROM_NAME={{RESEND_FROM_NAME}}

# Wompi (pagos)
WOMPI_PUBLIC_KEY={{WOMPI_PUBLIC_KEY}}
WOMPI_PRIVATE_KEY={{WOMPI_PRIVATE_KEY}}
WOMPI_EVENTS_SECRET={{WOMPI_EVENTS_SECRET}}
WOMPI_INTEGRITY_SECRET={{WOMPI_INTEGRITY_SECRET}}
WOMPI_ENVIRONMENT=production

# Features opcionales
ENABLE_POINTS_SYSTEM=true
ENABLE_DISCOUNTS=true
ENABLE_WOMPI_PAYMENTS=true
ENABLE_FAVORITES=true
```

### 3. Estrategia de Bases de Datos

**Decisión: Una base de datos PostgreSQL independiente por tienda** ✅

**Ventajas:**
- ✅ **Aislamiento completo**: Datos de tiendas no se mezclan
- ✅ **Escalabilidad**: Cada DB puede estar en servidor diferente
- ✅ **Seguridad**: Breach en una tienda no afecta otras
- ✅ **Backups independientes**: Restauración selectiva
- ✅ **Migración fácil**: Puedes mover tienda completa a otro servidor

**Alternativa descartada**: Schemas separados en una DB
- ❌ Punto único de fallo
- ❌ Difícil escalar horizontalmente
- ❌ Complejidad en queries multi-tenant

### 4. LLM: ¿Claude o GPT-4?

**Decisión: Claude 3.5 Sonnet (Anthropic)** ✅

**Razones:**
- ✅ Mejor para JSON estructurado
- ✅ Ventana de contexto grande (200K tokens)
- ✅ Más económico que GPT-4 (~$3/1M tokens vs ~$10/1M)
- ✅ Menos alucinaciones
- ✅ Mejor seguimiento de instrucciones

**Costo estimado por tienda generada**: $0.50 - $2.00

### 5. Deploy Strategy

**Decisión: Docker Compose + Nginx** (MVP) ✅

**Para MVP:**
- Docker Compose por cada tienda
- Nginx como reverse proxy para subdominios
- PostgreSQL en contenedor por tienda

**Para Producción (futuro):**
- Frontend: Vercel
- Backend: Railway / Fly.io
- DB: Supabase / Railway PostgreSQL
- CDN: Cloudflare

---

## 🔧 Preparación del Backend de Compralo

### ¿Qué hacer en el proyecto Compralo?

**IMPORTANTE**: Compralo NO necesita cambios mayores. Solo prepararlo para ser "copiable".

### Paso 1: Agregar Variable `STORE_ID` (Opcional)

**Archivo**: `backend/app/core/config.py`

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # ... todas las variables actuales (sin tocar) ...
    
    # NUEVO: Para identificar instancias generadas
    STORE_ID: Optional[int] = None
    STORE_NAME: Optional[str] = None
    IS_GENERATED_STORE: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### Paso 2: Crear Templates del Backend

**Crear carpeta**: `templates/backend-template/`

```bash
compralo/
└── templates/
    └── backend-template/
        ├── .env.template  (con placeholders {{VAR}})
        ├── Dockerfile.template
        ├── docker-compose.template.yml
        └── README.md
```

### Paso 3: Documentar Uso del Backend

**Archivo**: `templates/backend-template/README.md`

```markdown
# Backend Template - Compralo

Este backend está diseñado para ser copiado y configurado automáticamente por Revital.

## Uso

Revital copiará toda la carpeta `backend/` y generará un `.env` personalizado con:
- Database URL específica
- Secret keys únicas
- Configuración de la tienda

## Variables Requeridas

Ver `.env.template` para la lista completa.

## No requiere modificaciones

El código fuente permanece idéntico, solo cambian las variables de entorno.
```

### Paso 4: Crear Componentes Dinámicos en Frontend

**Crear carpeta**: `frontend/components/dynamic/`

Estos componentes aceptan configuración JSON y renderizan dinámicamente.

**Ejemplo**: `frontend/components/dynamic/DynamicHero.tsx`

```typescript
interface HeroConfig {
  layout: "carousel" | "static" | "video"
  title: string
  subtitle: string
  cta_text?: string
  cta_link?: string
  background_color?: string
  text_color?: string
  images?: string[]
}

export function DynamicHero({ config }: { config: HeroConfig }) {
  return (
    <section
      className="relative h-[600px] flex items-center justify-center"
      style={{
        backgroundColor: config.background_color || "#000",
        color: config.text_color || "#fff"
      }}
    >
      {config.layout === "carousel" && (
        <HeroCarousel images={config.images || []} />
      )}
      
      <div className="relative z-10 text-center max-w-4xl px-4">
        <h1 className="text-6xl font-bold mb-4">
          {config.title}
        </h1>
        <p className="text-xl mb-8">
          {config.subtitle}
        </p>
        {config.cta_text && (
          <Button size="lg" asChild>
            <a href={config.cta_link || "/products"}>
              {config.cta_text}
            </a>
          </Button>
        )}
      </div>
    </section>
  )
}
```

**Componentes a crear:**
- `DynamicHero.tsx`
- `DynamicCategories.tsx`
- `DynamicProducts.tsx`
- `DynamicTestimonials.tsx`
- `DynamicNewsletter.tsx`
- `DynamicFooter.tsx`

**Exportar todos**: `frontend/components/dynamic/index.ts`

```typescript
export { DynamicHero } from "./DynamicHero"
export { DynamicCategories } from "./DynamicCategories"
export { DynamicProducts } from "./DynamicProducts"
export { DynamicTestimonials } from "./DynamicTestimonials"
export { DynamicNewsletter } from "./DynamicNewsletter"
export { DynamicFooter } from "./DynamicFooter"
```

---

## 📅 Implementación por Fases

### FASE 1: Backend de Revital (Semana 1-2)

#### Estructura del Proyecto

```
revital-platform/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── dependencies.py
│   │   ├── services/
│   │   │   ├── llm_store_design_service.py
│   │   │   ├── ai_store_generator_service.py
│   │   │   ├── template_generator_service.py
│   │   │   └── infrastructure_service.py
│   │   ├── routers/
│   │   │   ├── auth_router.py
│   │   │   └── ai_stores_router.py
│   │   ├── schemas/
│   │   │   └── ai_store_schemas.py
│   │   └── models/
│   │       └── store.py
│   ├── requirements.txt
│   ├── .env
│   └── main.py
├── compralo-template/  (git submodule)
└── generated-stores/   (tiendas generadas)
    ├── store-1/
    ├── store-2/
    └── store-3/
```

#### 1.1 Base de Datos de Revital

**Tabla principal**: `tab_tiendas_generadas`

```sql
-- Migración: 001_create_stores_table.sql

CREATE TABLE tab_tiendas_generadas (
    id_tienda SERIAL PRIMARY KEY,
    id_usuario_creador INTEGER NOT NULL,
    
    -- Información básica
    nombre_tienda VARCHAR(255) NOT NULL,
    descripcion TEXT,
    
    -- Dominios
    subdominio VARCHAR(100) UNIQUE NOT NULL,
    dominio_personalizado VARCHAR(255) UNIQUE,
    
    -- Generación
    prompt_generacion TEXT NOT NULL,
    config_json JSONB NOT NULL,
    
    -- Estado
    estado VARCHAR(50) DEFAULT 'generando',
    -- Estados posibles: generando, activa, error, pausada, eliminada
    
    -- URLs
    frontend_url TEXT NOT NULL,
    backend_url TEXT NOT NULL,
    database_url TEXT NOT NULL,
    
    -- Recursos
    cloudinary_folder VARCHAR(255),
    
    -- Billing
    plan VARCHAR(50) DEFAULT 'free',
    -- Planes: free, starter, business, enterprise
    
    -- Timestamps
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP,
    ultima_deployment TIMESTAMP,
    
    -- Control
    activa BOOLEAN DEFAULT true
);

-- Índices para performance
CREATE INDEX idx_tiendas_usuario ON tab_tiendas_generadas(id_usuario_creador);
CREATE INDEX idx_tiendas_subdominio ON tab_tiendas_generadas(subdominio);
CREATE INDEX idx_tiendas_estado ON tab_tiendas_generadas(estado);
CREATE INDEX idx_tiendas_activa ON tab_tiendas_generadas(activa);

-- Tabla de logs de deployment
CREATE TABLE tab_deployment_logs (
    id_log SERIAL PRIMARY KEY,
    id_tienda INTEGER REFERENCES tab_tiendas_generadas(id_tienda),
    tipo VARCHAR(50) NOT NULL,  -- deploy, redeploy, update, error
    mensaje TEXT,
    detalles JSONB,
    fecha TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_tienda ON tab_deployment_logs(id_tienda);
```

#### 1.2 Servicio LLM (Claude 3.5 Sonnet)

**Archivo**: `backend/app/services/llm_store_design_service.py`

```python
"""
Servicio de generación de configuración de tiendas usando Claude 3.5 Sonnet
"""

import anthropic
from typing import Dict
import json
from core.config import settings

class LLMStoreDesignService:
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=settings.ANTHROPIC_API_KEY
        )
    
    async def generate_store_config(self, prompt: str) -> Dict:
        """
        Genera configuración completa de tienda desde un prompt en lenguaje natural.
        
        Args:
            prompt: Descripción de la tienda en lenguaje natural
            
        Returns:
            Dict con configuración completa de la tienda
        """
        
        system_prompt = self._build_system_prompt()
        
        message = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            temperature=0.7,
            system=system_prompt,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        # Parsear respuesta JSON
        config = json.loads(message.content[0].text)
        
        # Validar configuración
        self._validate_config(config)
        
        return config
    
    def _build_system_prompt(self) -> str:
        """
        Construye el prompt del sistema con instrucciones detalladas
        """
        return """
Eres un experto en diseño y arquitectura de tiendas ecommerce.

Tu tarea es generar una configuración JSON completa para una tienda online basada en la descripción del usuario.

## Estructura del JSON de Respuesta

```json
{
  "store_info": {
    "name": "Nombre de la Tienda",
    "description": "Descripción breve",
    "business_category": "fashion|electronics|food|sports|beauty|home|other",
    "target_audience": "Audiencia objetivo"
  },
  "theme": {
    "primary_color": "#HEX",
    "secondary_color": "#HEX",
    "accent_color": "#HEX",
    "font_family": "Inter|Poppins|Roboto|Montserrat",
    "style": "modern|minimal|bold|elegant|playful"
  },
  "layout": {
    "header_style": "fixed|static|transparent",
    "show_search": true,
    "show_categories_menu": true,
    "hero_type": "carousel|static|video",
    "featured_sections": ["categories", "products", "testimonials", "newsletter"]
  },
  "pages": [
    {
      "route": "/",
      "name": "Home",
      "components": [
        {
          "type": "hero",
          "config": {
            "layout": "carousel",
            "title": "Título principal",
            "subtitle": "Subtítulo",
            "cta_text": "Texto del botón",
            "cta_link": "/products",
            "background_color": "#000000",
            "text_color": "#FFFFFF",
            "images": ["url1", "url2"]
          }
        },
        {
          "type": "featured_categories",
          "config": {
            "layout": "grid",
            "columns": 3,
            "show_images": true
          }
        },
        {
          "type": "featured_products",
          "config": {
            "layout": "carousel",
            "limit": 8,
            "filter": "featured"
          }
        },
        {
          "type": "testimonials",
          "config": {
            "layout": "carousel",
            "show_ratings": true
          }
        }
      ]
    }
  ],
  "initial_data": {
    "categories": [
      {
        "name": "Categoría 1",
        "description": "Descripción",
        "image": "URL placeholder"
      }
    ],
    "products": [
      {
        "name": "Producto Ejemplo",
        "description": "Descripción del producto",
        "price": 99.99,
        "stock": 100,
        "category": "Categoría 1",
        "image": "URL placeholder"
      }
    ]
  }
}
```

## Instrucciones

1. **Analiza el prompt del usuario** y extrae:
   - Tipo de negocio
   - Audiencia objetivo
   - Estilo visual preferido
   - Características especiales

2. **Genera un tema visual coherente**:
   - Colores apropiados para el tipo de negocio
   - Fuente legible y moderna
   - Estilo que coincida con la marca

3. **Diseña la estructura de páginas**:
   - Página home con componentes relevantes
   - Orden lógico de secciones
   - Call-to-actions estratégicos

4. **Crea datos iniciales**:
   - 3-5 categorías relevantes
   - 5-10 productos de ejemplo realistas
   - Descripciones detalladas

5. **Mantén coherencia**:
   - Colores complementarios
   - Estilo consistente
   - Nombres realistas

## Reglas Importantes

- Responde SOLO con JSON válido, sin comentarios ni explicaciones
- Usa colores hexadecimales válidos
- Todos los precios deben ser números decimales positivos
- Las URLs de imágenes pueden ser placeholders (ej: "https://via.placeholder.com/400")
- Sé creativo pero realista
- Adapta el tono al tipo de negocio

## Ejemplos de Negocio → Colores

- Deportes: Azul (#2563EB), Verde (#10B981), Naranja (#F97316)
- Moda: Negro (#000000), Rosa (#EC4899), Beige (#D4AF37)
- Tecnología: Azul oscuro (#1E293B), Cyan (#06B6D4), Púrpura (#8B5CF6)
- Alimentación: Rojo (#EF4444), Verde (#22C55E), Naranja (#FB923C)
- Belleza: Rosa (#F472B6), Lavanda (#C084FC), Dorado (#FBBF24)
"""
    
    def _validate_config(self, config: Dict) -> None:
        """
        Valida que la configuración tenga todos los campos requeridos
        """
        required_keys = ["store_info", "theme", "layout", "pages", "initial_data"]
        
        for key in required_keys:
            if key not in config:
                raise ValueError(f"Configuración inválida: falta el campo '{key}'")
        
        # Validar store_info
        if "name" not in config["store_info"]:
            raise ValueError("store_info debe tener 'name'")
        
        # Validar theme
        theme_keys = ["primary_color", "secondary_color", "font_family"]
        for key in theme_keys:
            if key not in config["theme"]:
                raise ValueError(f"theme debe tener '{key}'")
        
        print(f"✅ Configuración válida para: {config['store_info']['name']}")
```

#### 1.3 Template Generator Service

**Archivo**: `backend/app/services/template_generator_service.py`

```python
"""
Servicio que genera archivos físicos de las tiendas desde el template de Compralo
"""

import shutil
import os
from pathlib import Path
import json
import secrets
from typing import Dict

class TemplateGeneratorService:
    def __init__(self):
        self.base_template = Path("compralo-template")
        self.generated_stores = Path("generated-stores")
        self.generated_stores.mkdir(exist_ok=True)
    
    def generate_complete_store(self, store_id: int, config: Dict) -> Dict:
        """
        Genera una tienda completa: frontend + backend + docker-compose
        
        Returns:
            Dict con paths de los archivos generados
        """
        store_path = self.generated_stores / f"store-{store_id}"
        store_path.mkdir(exist_ok=True)
        
        # 1. Generar frontend
        self.generate_frontend(store_id, config)
        
        # 2. Generar backend
        self.generate_backend(store_id, config)
        
        # 3. Generar docker-compose
        self.generate_docker_compose(store_id, config)
        
        return {
            "store_path": str(store_path),
            "frontend_path": str(store_path / "frontend"),
            "backend_path": str(store_path / "backend"),
            "docker_compose_path": str(store_path / "docker-compose.yml")
        }
    
    def generate_frontend(self, store_id: int, config: Dict):
        """
        Genera el frontend de la tienda desde Compralo template
        """
        store_path = self.generated_stores / f"store-{store_id}"
        frontend_path = store_path / "frontend"
        
        # 1. Copiar estructura completa de frontend desde submodule
        if (self.base_template / "frontend").exists():
            shutil.copytree(
                self.base_template / "frontend",
                frontend_path,
                dirs_exist_ok=True,
                ignore=shutil.ignore_patterns(
                    'node_modules',
                    '.next',
                    '.env.local',
                    '__pycache__',
                    '*.pyc'
                )
            )
        
        # 2. Generar app/page.tsx dinámico
        self._generate_page_tsx(frontend_path, config)
        
        # 3. Generar layout.tsx con metadata personalizada
        self._generate_layout_tsx(frontend_path, config)
        
        # 4. Generar tailwind.config.ts con colores personalizados
        self._generate_tailwind_config(frontend_path, config)
        
        # 5. Generar .env.local
        self._generate_frontend_env(frontend_path, store_id, config)
        
        print(f"✅ Frontend generado para store-{store_id}")
    
    def generate_backend(self, store_id: int, config: Dict):
        """
        Copia el backend completo de Compralo y genera .env personalizado
        """
        store_path = self.generated_stores / f"store-{store_id}"
        backend_path = store_path / "backend"
        
        # 1. Copiar backend completo desde submodule
        if (self.base_template / "backend").exists():
            shutil.copytree(
                self.base_template / "backend",
                backend_path,
                dirs_exist_ok=True,
                ignore=shutil.ignore_patterns(
                    '__pycache__',
                    '*.pyc',
                    'venv',
                    '.env'
                )
            )
        
        # 2. Generar .env personalizado
        self._generate_backend_env(backend_path, store_id, config)
        
        print(f"✅ Backend generado para store-{store_id}")
    
    def generate_docker_compose(self, store_id: int, config: Dict):
        """
        Genera docker-compose.yml para la tienda
        """
        store_path = self.generated_stores / f"store-{store_id}"
        
        db_password = secrets.token_urlsafe(16)
        frontend_port = 3000 + store_id
        backend_port = 8000 + store_id
        
        docker_compose_content = f"""version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "{frontend_port}:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:{backend_port}
      - NEXT_PUBLIC_STORE_ID={store_id}
      - NEXT_PUBLIC_STORE_NAME={config['store_info']['name']}
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - store-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "{backend_port}:8000"
    environment:
      - DATABASE_URL=postgresql://store_user:{db_password}@db:5432/store_{store_id}
      - STORE_ID={store_id}
      - STORE_NAME={config['store_info']['name']}
    env_file:
      - ./backend/.env
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - store-network

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=store_{store_id}
      - POSTGRES_USER=store_user
      - POSTGRES_PASSWORD={db_password}
    volumes:
      - db_data_{store_id}:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U store_user -d store_{store_id}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - store-network

volumes:
  db_data_{store_id}:

networks:
  store-network:
    driver: bridge
"""
        
        (store_path / "docker-compose.yml").write_text(docker_compose_content)
        print(f"✅ Docker Compose generado para store-{store_id}")
    
    def _generate_page_tsx(self, frontend_path: Path, config: Dict):
        """
        Genera app/page.tsx dinámico basado en config.pages[0]
        """
        page_config = config["pages"][0]
        
        imports = []
        components = []
        
        for comp in page_config["components"]:
            comp_type = comp["type"]
            comp_name = self._get_component_name(comp_type)
            
            imports.append(f'import {{ {comp_name} }} from "@/components/dynamic/{comp_name}"')
            
            # Serializar config a string JSON
            config_str = json.dumps(comp["config"]).replace('"', '\\"')
            components.append(f'<{comp_name} config={{JSON.parse("{config_str}")}} />')
        
        page_content = f"""// Generado automáticamente por Revital AI Platform
{chr(10).join(imports)}

export default function HomePage() {{
  return (
    <div className="min-h-screen">
{chr(10).join(f"      {comp}" for comp in components)}
    </div>
  )
}}
"""
        
        app_dir = frontend_path / "app"
        app_dir.mkdir(exist_ok=True)
        (app_dir / "page.tsx").write_text(page_content)
    
    def _generate_layout_tsx(self, frontend_path: Path, config: Dict):
        """
        Genera app/layout.tsx con metadata personalizada
        """
        store_info = config["store_info"]
        
        layout_content = f"""import type {{ Metadata }} from "next";
import {{ Geist, Geist_Mono }} from "next/font/google";
import "./globals.css";
import {{ Toaster }} from "@/components/ui/sonner"
import {{ ThemeProvider }} from "@/providers/theme-provider"
import {{ AuthProvider }} from "@/providers/auth-provider"

const geistSans = Geist({{
  variable: "--font-geist-sans",
  subsets: ["latin"],
}});

const geistMono = Geist_Mono({{
  variable: "--font-geist-mono",
  subsets: ["latin"],
}});

export const metadata: Metadata = {{
  title: "{store_info['name']}",
  description: "{store_info.get('description', store_info['name'])}",
}};

export default function RootLayout({{
  children,
}}: Readonly<{{
  children: React.ReactNode;
}}>) {{
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={{`${{geistSans.variable}} ${{geistMono.variable}} antialiased`}}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {{children}}
            <Toaster richColors />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}}
"""
        
        app_dir = frontend_path / "app"
        (app_dir / "layout.tsx").write_text(layout_content)
    
    def _generate_tailwind_config(self, frontend_path: Path, config: Dict):
        """
        Genera tailwind.config.ts con colores personalizados del tema
        """
        theme = config["theme"]
        
        tailwind_config = f"""import type {{ Config }} from "tailwindcss";

const config: Config = {{
  content: [
    "./pages/**/*.{{js,ts,jsx,tsx,mdx}}",
    "./components/**/*.{{js,ts,jsx,tsx,mdx}}",
    "./app/**/*.{{js,ts,jsx,tsx,mdx}}",
  ],
  theme: {{
    extend: {{
      colors: {{
        primary: "{theme['primary_color']}",
        secondary: "{theme['secondary_color']}",
        accent: "{theme.get('accent_color', '#10B981')}",
      }},
      fontFamily: {{
        sans: ["{theme['font_family']}", "system-ui", "sans-serif"],
      }},
    }},
  }},
  plugins: [require("tailwindcss-animate")],
}};

export default config;
"""
        
        (frontend_path / "tailwind.config.ts").write_text(tailwind_config)
    
    def _generate_frontend_env(self, frontend_path: Path, store_id: int, config: Dict):
        """
        Genera .env.local para el frontend
        """
        backend_port = 8000 + store_id
        
        env_content = f"""# Generado automáticamente por Revital
NEXT_PUBLIC_API_URL=http://localhost:{backend_port}
NEXT_PUBLIC_STORE_ID={store_id}
NEXT_PUBLIC_STORE_NAME={config['store_info']['name']}
"""
        
        (frontend_path / ".env.local").write_text(env_content)
    
    def _generate_backend_env(self, backend_path: Path, store_id: int, config: Dict):
        """
        Genera .env para el backend con todas las variables necesarias
        """
        store_info = config["store_info"]
        secret_key = secrets.token_urlsafe(32)
        db_password = secrets.token_urlsafe(16)
        
        env_content = f"""# Generado automáticamente por Revital AI Platform
# Tienda: {store_info['name']}
# Store ID: {store_id}

# Identificación
STORE_ID={store_id}
STORE_NAME={store_info['name']}
IS_GENERATED_STORE=true

# Base de datos
DATABASE_URL=postgresql://store_user:{db_password}@db:5432/store_{store_id}

# Seguridad
SECRET_KEY={secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Información de la empresa
COMPANY_NAME={store_info['name']}
APP_NAME={store_info['name']}
COMPANY_TAGLINE={store_info.get('description', '')}
SUPPORT_EMAIL=support@store-{store_id}.revital.com

# Cloudinary (configurar con credenciales reales)
CLOUDINARY_CLOUD_NAME=revital-stores
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_SECRET

# URLs
FRONTEND_URL=https://store-{store_id}.revital.com
VERIFY_EMAIL_URL=https://store-{store_id}.revital.com/auth/verify-email
RESET_PASSWORD_URL=https://store-{store_id}.revital.com/auth/reset-password

# Resend (emails)
RESEND_API_KEY=YOUR_RESEND_KEY
RESEND_FROM_EMAIL=noreply@store-{store_id}.revital.com
RESEND_FROM_NAME={store_info['name']}

# Wompi (pagos)
WOMPI_PUBLIC_KEY=YOUR_WOMPI_PUBLIC_KEY
WOMPI_PRIVATE_KEY=YOUR_WOMPI_PRIVATE_KEY
WOMPI_EVENTS_SECRET=YOUR_WOMPI_EVENTS_SECRET
WOMPI_INTEGRITY_SECRET=YOUR_WOMPI_INTEGRITY_SECRET
WOMPI_ENVIRONMENT=sandbox

# Features
ENABLE_POINTS_SYSTEM=true
ENABLE_DISCOUNTS=true
ENABLE_WOMPI_PAYMENTS=true
ENABLE_FAVORITES=true
"""
        
        (backend_path / ".env").write_text(env_content)
    
    def _get_component_name(self, comp_type: str) -> str:
        """
        Convierte tipo de componente a nombre de componente React
        """
        mapping = {
            "hero": "DynamicHero",
            "featured_categories": "DynamicCategories",
            "featured_products": "DynamicProducts",
            "testimonials": "DynamicTestimonials",
            "newsletter": "DynamicNewsletter"
        }
        return mapping.get(comp_type, "DynamicHero")
```

#### 1.4 API Endpoints

**Archivo**: `backend/app/routers/ai_stores_router.py`

```python
"""
Router para gestión de tiendas generadas con IA
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.dependencies import get_current_user
from schemas.ai_store_schemas import (
    StoreGenerateRequest,
    StoreResponse,
    StoreStatusResponse,
    StoreConfigUpdate
)
from services.llm_store_design_service import LLMStoreDesignService
from services.template_generator_service import TemplateGeneratorService
from services.infrastructure_service import InfrastructureService
from models.store import Store

router = APIRouter(prefix="/api/ai-stores", tags=["AI Stores"])

@router.post("/generate", response_model=StoreResponse)
async def generate_store(
    request: StoreGenerateRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Genera una nueva tienda desde un prompt en lenguaje natural.
    
    El proceso es:
    1. LLM genera configuración JSON
    2. Se crea registro en DB
    3. Background task genera archivos y despliega
    """
    
    # 1. Generar configuración con LLM
    llm_service = LLMStoreDesignService()
    try:
        config = await llm_service.generate_store_config(request.prompt)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generando configuración: {str(e)}"
        )
    
    # 2. Generar subdominio único
    subdominio = generate_unique_subdomain(config['store_info']['name'], db)
    
    # 3. Crear registro en base de datos
    store = Store(
        id_usuario_creador=current_user.id_usuario,
        nombre_tienda=config['store_info']['name'],
        descripcion=config['store_info'].get('description'),
        subdominio=subdominio,
        prompt_generacion=request.prompt,
        config_json=config,
        estado='generando',
        frontend_url=f"https://{subdominio}.revital.com",
        backend_url=f"https://api-{subdominio}.revital.com",
        database_url=f"postgresql://user:pass@localhost/store_{subdominio}"
    )
    
    db.add(store)
    db.commit()
    db.refresh(store)
    
    # 4. Iniciar generación asíncrona
    background_tasks.add_task(
        generate_and_deploy_store,
        store.id_tienda,
        config,
        db
    )
    
    return StoreResponse(
        id_tienda=store.id_tienda,
        nombre_tienda=store.nombre_tienda,
        subdominio=store.subdominio,
        estado=store.estado,
        frontend_url=store.frontend_url,
        mensaje="Tienda en proceso de generación. Esto puede tomar 2-3 minutos."
    )

@router.get("/my-stores", response_model=List[StoreResponse])
async def list_my_stores(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista todas las tiendas del usuario autenticado
    """
    stores = db.query(Store).filter(
        Store.id_usuario_creador == current_user.id_usuario,
        Store.activa == True
    ).order_by(Store.fecha_creacion.desc()).all()
    
    return [
        StoreResponse(
            id_tienda=store.id_tienda,
            nombre_tienda=store.nombre_tienda,
            subdominio=store.subdominio,
            estado=store.estado,
            frontend_url=store.frontend_url
        )
        for store in stores
    ]

@router.get("/{store_id}/status", response_model=StoreStatusResponse)
async def get_store_status(
    store_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene el estado actual de una tienda
    """
    store = db.query(Store).filter(
        Store.id_tienda == store_id,
        Store.id_usuario_creador == current_user.id_usuario
    ).first()
    
    if not store:
        raise HTTPException(404, "Tienda no encontrada")
    
    return StoreStatusResponse(
        id_tienda=store.id_tienda,
        estado=store.estado,
        frontend_url=store.frontend_url,
        backend_url=store.backend_url,
        config=store.config_json,
        fecha_creacion=store.fecha_creacion,
        ultima_actualizacion=store.fecha_actualizacion
    )

@router.put("/{store_id}/config")
async def update_store_config(
    store_id: int,
    config_update: StoreConfigUpdate,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza la configuración de una tienda (desde el editor visual)
    """
    store = get_store_or_404(db, store_id, current_user.id_usuario)
    
    # Actualizar config
    store.config_json = config_update.config
    store.estado = "actualizando"
    store.fecha_actualizacion = datetime.now()
    db.commit()
    
    # Redeploy asíncrono
    background_tasks.add_task(
        redeploy_store,
        store_id,
        config_update.config,
        db
    )
    
    return {"message": "Configuración actualizada. Redeployando..."}

@router.delete("/{store_id}")
async def delete_store(
    store_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina una tienda y todos sus recursos
    """
    store = get_store_or_404(db, store_id, current_user.id_usuario)
    
    # Eliminar archivos físicos
    cleanup_store_files(store_id)
    
    # Parar contenedores Docker
    stop_store_containers(store_id)
    
    # Eliminar base de datos
    drop_store_database(store.database_url)
    
    # Marcar como inactiva
    store.activa = False
    store.estado = "eliminada"
    db.commit()
    
    return {"message": "Tienda eliminada correctamente"}

# Helper functions

async def generate_and_deploy_store(store_id: int, config: dict, db: Session):
    """
    Background task que genera archivos y despliega la tienda
    """
    try:
        # 1. Generar archivos
        template_service = TemplateGeneratorService()
        paths = template_service.generate_complete_store(store_id, config)
        
        # 2. Poblar base de datos inicial
        populate_initial_data(store_id, config)
        
        # 3. Deploy con Docker
        infra_service = InfrastructureService()
        urls = await infra_service.deploy_store(store_id, paths)
        
        # 4. Actualizar estado
        store = db.query(Store).filter(Store.id_tienda == store_id).first()
        store.estado = "activa"
        store.frontend_url = urls['frontend_url']
        store.backend_url = urls['backend_url']
        store.ultima_deployment = datetime.now()
        db.commit()
        
        print(f"✅ Tienda {store_id} desplegada exitosamente")
        
    except Exception as e:
        print(f"❌ Error generando tienda {store_id}: {str(e)}")
        
        # Marcar como error
        store = db.query(Store).filter(Store.id_tienda == store_id).first()
        store.estado = "error"
        db.commit()

def generate_unique_subdomain(store_name: str, db: Session) -> str:
    """
    Genera un subdominio único basado en el nombre de la tienda
    """
    import re
    import random
    
    # Limpiar nombre (solo letras y números)
    base = re.sub(r'[^a-z0-9]', '', store_name.lower())
    base = base[:20]  # Máximo 20 caracteres
    
    # Verificar si existe
    subdomain = base
    counter = 1
    
    while db.query(Store).filter(Store.subdominio == subdomain).first():
        subdomain = f"{base}{counter}"
        counter += 1
    
    return subdomain

def get_store_or_404(db: Session, store_id: int, user_id: int) -> Store:
    """
    Obtiene una tienda o lanza 404
    """
    store = db.query(Store).filter(
        Store.id_tienda == store_id,
        Store.id_usuario_creador == user_id
    ).first()
    
    if not store:
        raise HTTPException(404, "Tienda no encontrada")
    
    return store
```

---

### FASE 2: Frontend de Revital (Semana 2-3)

#### Estructura de carpetas

```
revital-platform/frontend/
├── app/
│   ├── (landing)/
│   │   └── page.tsx (landing actual)
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx (dashboard principal)
│   │   └── stores/
│   │       ├── page.tsx (lista de tiendas)
│   │       ├── create/
│   │       │   └── page.tsx (formulario de prompt)
│   │       └── [storeId]/
│   │           ├── page.tsx (detalle de tienda)
│   │           └── editor/
│   │               └── page.tsx (editor visual)
│   └── layout.tsx
├── components/
│   └── store-builder/
│       ├── PromptInput.tsx
│       ├── StoreCard.tsx
│       ├── StoresList.tsx
│       ├── StoreBuilderEditor.tsx
│       ├── PreviewFrame.tsx
│       ├── ThemeEditor.tsx
│       ├── LayoutEditor.tsx
│       └── ComponentsLibrary.tsx
└── services/
    └── ai-store-service.ts
```

#### 2.1 Página de Creación de Tienda

Ver código en el plan principal (sección FASE 2.2)

#### 2.2 Editor Visual

Ver código en el plan principal (sección FASE 2.3)

---

### FASE 3: Preparar Compralo (Semana 3-4)

Esta fase se ejecuta en el **repositorio de Compralo**.

#### Tareas a realizar:

1. ✅ Agregar `STORE_ID` opcional en `backend/app/core/config.py`
2. ✅ Crear carpeta `templates/backend-template/` con `.env.template`
3. ✅ Crear componentes dinámicos en `frontend/components/dynamic/`
4. ✅ Documentar API de componentes

Ver detalles completos en la sección "Preparación del Backend de Compralo"

---

### FASE 4: Integración y Deploy (Semana 4-5)

#### 4.1 Agregar Compralo como Submodule

```bash
# En el repositorio de Revital
cd revital-platform
git submodule add https://github.com/tu-org/compralo.git compralo-template
git submodule update --init --recursive
git commit -m "Add Compralo as submodule template"
git push
```

#### 4.2 Deploy con Docker Compose

Ver implementación completa en el plan principal (sección FASE 4)

#### 4.3 Configurar Nginx

Ver configuración de Nginx en el plan principal

---

## 🚀 Deployment e Infraestructura

### Opción 1: Docker Compose (MVP)

Cada tienda tiene su propio `docker-compose.yml` con:
- Frontend (Next.js)
- Backend (FastAPI)
- Database (PostgreSQL)

**Ventajas:**
- ✅ Simple de configurar
- ✅ Todo en un servidor
- ✅ Fácil debugging

**Desventajas:**
- ❌ Limitado a un servidor
- ❌ Difícil escalar horizontalmente

### Opción 2: Serverless (Producción)

- **Frontend**: Vercel (deploy automático)
- **Backend**: Railway / Fly.io
- **Database**: Supabase / Railway PostgreSQL
- **CDN**: Cloudflare

**Ventajas:**
- ✅ Escalabilidad automática
- ✅ Distributed
- ✅ Alta disponibilidad

**Desventajas:**
- ❌ Más complejo
- ❌ Costos por tienda

---

## 📊 Tecnologías Confirmadas

| Componente | Tecnología | Justificación |
|------------|-----------|---------------|
| **LLM** | Claude 3.5 Sonnet | Mejor para JSON estructurado, más económico |
| **Backend** | FastAPI + PostgreSQL | Ya funcional en Compralo, robusto |
| **Frontend** | Next.js 16 + Tailwind | Mismo stack de Compralo, coherencia |
| **UI Components** | shadcn/ui | Ya usado en Compralo |
| **Deploy (MVP)** | Docker Compose + Nginx | Simple, todo-en-uno |
| **Deploy (Prod)** | Vercel + Railway | Escalable, managed |
| **DB Strategy** | 1 PostgreSQL por tienda | Aislamiento completo |
| **Subdominios** | Nginx proxy / Cloudflare | Routing dinámico |

---

## 📝 Próximos Pasos

### Inmediato (Esta semana)

1. ✅ **Preparar Compralo**:
   - Agregar `STORE_ID` en config
   - Crear componentes dinámicos básicos
   - Crear `.env.template`

2. ✅ **Setup de Revital**:
   - Estructura de backend FastAPI
   - Base de datos con tabla `tab_tiendas_generadas`
   - Obtener API key de Anthropic

### Siguiente (Semana 1-2)

3. ✅ **Backend de Revital**:
   - Implementar `LLMStoreDesignService`
   - Implementar `TemplateGeneratorService`
   - Crear endpoints API

### Luego (Semana 2-3)

4. ✅ **Frontend de Revital**:
   - Dashboard principal
   - Formulario de creación
   - Lista de tiendas
   - Editor visual (básico)

### Finalmente (Semana 3-4)

5. ✅ **Integración y Testing**:
   - Agregar Compralo como submodule
   - Probar generación completa end-to-end
   - Deploy de tienda de prueba
   - Ajustar configuración de Nginx

---

## 🎯 Métricas de Éxito

### MVP (4 semanas)

- [ ] Usuario puede escribir prompt y generar tienda
- [ ] Tienda generada es accesible en subdominio
- [ ] Frontend tiene diseño personalizado según prompt
- [ ] Backend funciona con autenticación y CRUD
- [ ] Base de datos poblada con datos de ejemplo

### V1.0 (8 semanas)

- [ ] Editor visual funcional
- [ ] Actualización en tiempo real
- [ ] Deploy automático
- [ ] Sistema de subdominios robusto
- [ ] Documentación completa

### V2.0 (Futuro)

- [ ] Dominios personalizados
- [ ] Sistema de billing
- [ ] Templates predefinidos
- [ ] Marketplace de componentes
- [ ] Whitelabel completo

---

## 📚 Referencias y Recursos

### Documentación Clave

- [Claude API Docs](https://docs.anthropic.com)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Proxy](https://nginx.org/en/docs/)

### Repositorios

- **Revital Platform**: `github.com/tu-org/revital-platform`
- **Compralo Template**: `github.com/tu-org/compralo`

### Contacto

Para dudas sobre implementación, contactar al equipo de desarrollo.

---

**Documento creado**: 23 de Octubre, 2025  
**Versión**: 1.0  
**Autor**: Equipo Revital  
**Estado**: En Planificación

