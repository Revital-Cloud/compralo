# Revital Frontend - Interfaz SaaS de E-Commerce 🎨

**Aplicación Next.js 16 para instancias de cliente personalizadas**

El frontend de Revital está construido con Next.js 16+ y diseñado para ofrecer una experiencia completamente personalizada para cada cliente SaaS. Cada instancia puede tener su propio branding, dominio y configuración específica.

**Requisitos y trazabilidad:** La especificación de requisitos de software (SRS) de revital_ecommerce, según IEEE 830-1998, está en [revital_ecommerce/docs/SRS_REVITAL_ECOMMERCE_IEEE830.md](../docs/SRS_REVITAL_ECOMMERCE_IEEE830.md). Los requisitos funcionales (RF-xx) y no funcionales (RNF-xx) definidos allí son la referencia para diseño, implementación y pruebas.

## 🎯 Características SaaS del Frontend

### ✅ Funcionalidades Implementadas

#### Sistema de Autenticación
- **Login/Registro** con validación completa
- **Protección de rutas** por roles (Admin, Employee, Customer)
- **Gestión de sesiones** con JWT
- **Recuperación de contraseña** integrada

#### Catálogo de Productos Avanzado
- **Sistema de filtros** con búsqueda en tiempo real
- **Filtros jerárquicos** (Categorías → Líneas → Sublíneas)
- **Búsqueda por nombre** con autocompletado
- **Filtros por precio, marca, proveedor**
- **Paginación** y ordenamiento dinámico
- **Estados vacíos** mejorados con ilustraciones

#### Sistema de Carrito Funcional
- **Carrito persistente** con Zustand
- **Integración completa** con backend
- **Cálculos automáticos** de totales
- **Validación de stock** en tiempo real
- **Migración automática** de carrito anónimo a usuario

#### Dashboard Administrativo
- **Gestión de productos** con CRUD completo
- **Gestión de categorías, líneas y sublíneas**
- **Gestión de marcas y proveedores**
- **Gestión de usuarios** con roles
- **Tablas interactivas** con TanStack Table
- **Formularios validados** con React Hook Form

#### Interfaz de Usuario Moderna
- **Diseño responsive** con Tailwind CSS
- **Modo oscuro** implementado
- **Componentes shadcn/ui** (56+ componentes)
- **Sistema de cookies** con compliance GDPR
- **Estados de carga** y manejo de errores
- **Animaciones** con Framer Motion

### White-Label Completo
- **Branding personalizado** - Logo, colores, tipografías por cliente
- **Dominio propio** - Cada cliente tiene su URL personalizada
- **Personalización total** - CSS y JavaScript específicos por instancia
- **Sin marca Revital** - Experiencia completamente del cliente
- **Configuración por sector** - Templates específicos por industria

### Multi-Plan Adaptativo
- **Starter**: Interfaz básica con funciones esenciales
- **Business**: Dashboard avanzado con analytics
- **Enterprise**: Personalización completa + integraciones

## 🛠️ Stack Tecnológico

### Core Framework
- **Next.js 16+** - Framework React con App Router
- **TypeScript** - Tipado estático completo
- **React 19** - UI
- **Tailwind CSS 4** - Styling utilitario responsive

### UI/UX
- **shadcn/ui** - Componentes accesibles y modernos
- **Radix UI** - Primitivos headless de alta calidad
- **Lucide React** - Iconografía consistente
- **Framer Motion** - Animaciones fluidas
- **React Hook Form** - Gestión de formularios

### Estado y Datos
- **@tanstack/react-query** - Gestión de estado del servidor
- **Zustand** - Estado global del cliente
- **React Context** - Estado de configuración por instancia

### Desarrollo
- **ESLint** - Linting con reglas personalizadas
- **Prettier** - Formateo de código
- **Husky** - Git hooks para calidad
- **TypeScript** - Verificación de tipos

## 📁 Estructura del Proyecto

```
frontend/
├── app/                          # App Router (Next.js 16+)
│   ├── (auth)/                  # Grupo de rutas de autenticación
│   │   ├── login/               # Página de login
│   │   └── register/            # Página de registro
│   │
│   ├── (dashboard)/             # Grupo de rutas protegidas
│   │   ├── admin/               # Panel de administración
│   │   │   ├── page.tsx         # Dashboard principal
│   │   │   ├── products/        # Gestión de productos
│   │   │   ├── categories/      # Gestión de categorías
│   │   │   ├── lines/           # Gestión de líneas
│   │   │   ├── sublines/        # Gestión de sublíneas
│   │   │   ├── brands/          # Gestión de marcas
│   │   │   ├── providers/       # Gestión de proveedores
│   │   │   └── users/           # Gestión de usuarios
│   │   └── products/            # Gestión de productos (usuario)
│   │
│   ├── (shop)/                  # Tienda pública del cliente
│   │   ├── page.tsx            # Página principal de la tienda
│   │   ├── products/           # Catálogo de productos con filtros
│   │   ├── cart/               # Carrito de compras funcional
│   │   └── product/            # Páginas individuales de productos
│   │
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout principal
│   ├── loading.tsx              # Componente de carga global
│   ├── not-found.tsx            # Página 404
│   └── page.tsx                 # Página de inicio
│
├── components/                   # Componentes reutilizables (80+ componentes)
│   ├── ui/                      # Componentes base (shadcn/ui) - 56 componentes
│   │   ├── button.tsx           # Botón personalizable
│   │   ├── input.tsx            # Input con validación
│   │   ├── card.tsx             # Cards responsivos
│   │   ├── table.tsx            # Tablas con TanStack Table
│   │   ├── empty-state.tsx      # Estados vacíos mejorados
│   │   ├── cookie-banner.tsx    # Banner de cookies GDPR
│   │   └── ...                  # Más componentes UI
│   │
│   ├── admin/                   # Componentes de administración (12 componentes)
│   │   ├── product-form.tsx     # Formulario de productos
│   │   ├── category-form.tsx    # Formulario de categorías
│   │   ├── brand-form.tsx       # Formulario de marcas
│   │   ├── provider-form.tsx    # Formulario de proveedores
│   │   └── ...                  # Más formularios admin
│   │
│   ├── products-page/           # Componentes de catálogo (4 componentes)
│   │   ├── products-header.tsx  # Header con búsqueda y filtros
│   │   ├── products-filters.tsx # Panel de filtros avanzados
│   │   ├── products-display.tsx # Display de productos
│   │   └── products-pagination.tsx # Paginación
│   │
│   ├── product/                 # Componentes de producto (8 componentes)
│   │   ├── product-card.tsx     # Tarjeta de producto
│   │   ├── product-details.tsx  # Detalles del producto
│   │   ├── product-gallery.tsx  # Galería de imágenes
│   │   └── ...                  # Más componentes de producto
│   │
│   ├── cart/                    # Componentes de carrito (2 componentes)
│   │   ├── cart-item.tsx        # Item del carrito
│   │   └── cart-summary.tsx     # Resumen del carrito
│   │
│   ├── layout/                  # Componentes de layout (56 componentes)
│   │   ├── header.tsx           # Header principal
│   │   ├── footer.tsx           # Footer con branding
│   │   ├── navigation.tsx       # Navegación principal
│   │   ├── dashboard/           # Componentes del dashboard
│   │   └── ...                  # Más componentes de layout
│   │
│   ├── forms/                   # Formularios reutilizables (3 componentes)
│   │   ├── login-form.tsx       # Formulario de login
│   │   ├── register-form.tsx    # Formulario de registro
│   │   └── contact-form.tsx     # Formulario de contacto
│   │
│   ├── auth/                    # Componentes de autenticación
│   │   └── route-guard.tsx      # Protección de rutas
│   │
│   └── providers/               # Providers de contexto
│       ├── auth-provider.tsx    # Provider de autenticación
│       ├── query-provider.tsx   # Provider de React Query
│       └── theme-provider.tsx   # Provider de tema
│
├── hooks/                        # Custom hooks (20+ hooks)
│   ├── use-auth.ts              # Hook de autenticación
│   ├── use-cart.ts              # Hook del carrito
│   ├── use-products.ts          # Hook de productos
│   ├── use-categories.ts        # Hook de categorías
│   ├── use-brands.ts            # Hook de marcas
│   ├── use-providers.ts         # Hook de proveedores
│   ├── use-filter-products.ts   # Hook de filtros de productos
│   ├── use-cookies.ts           # Hook de gestión de cookies
│   ├── use-theme.ts             # Hook de tema
│   └── ...                      # Más hooks especializados
│
├── services/                     # Servicios de API (11 servicios)
│   ├── auth.service.ts          # Servicio de autenticación
│   ├── product.service.ts       # Servicio de productos
│   ├── cart.service.ts          # Servicio de carrito
│   ├── category.service.ts      # Servicio de categorías
│   ├── brand.service.ts         # Servicio de marcas
│   ├── provider.service.ts      # Servicio de proveedores
│   ├── user.service.ts          # Servicio de usuarios
│   ├── payment.service.ts       # Servicio de pagos
│   └── ...                      # Más servicios
│
├── types/                        # Definiciones de tipos (8 archivos)
│   ├── auth/                    # Tipos de autenticación
│   ├── product/                 # Tipos de productos
│   ├── cart/                    # Tipos de carrito
│   ├── category/                # Tipos de categorías
│   ├── payment/                 # Tipos de pagos
│   ├── user/                    # Tipos de usuario
│   ├── common/                  # Tipos comunes
│   └── index.ts                 # Exportaciones centralizadas
│
├── stores/                       # Estado global
│   └── cart-store.ts            # Store Zustand para carrito
│
├── utils/                        # Utilidades (9 archivos)
│   ├── apiWrapper.ts            # Wrapper de API con interceptores
│   ├── cart-helpers.ts          # Utilidades del carrito
│   ├── format-price.ts          # Formateo de precios
│   ├── image-helpers.ts         # Utilidades de imágenes
│   ├── product-helpers.ts       # Utilidades de productos
│   └── ...                      # Más utilidades
│
├── lib/                          # Configuración y utilidades
│   ├── config.ts                # Configuración de la app
│   ├── utils.ts                 # Utilidades generales
│   ├── theme-config.ts          # Configuración de temas
│   └── ...                      # Más configuraciones
│
├── schemas/                      # Esquemas de validación
│   ├── auth.schema.ts           # Esquemas de autenticación
│   └── user.schema.ts           # Esquemas de usuario
│
├── public/                       # Assets estáticos
│   ├── carrito.svg              # Iconos personalizados
│   ├── file.svg                 # Iconos de archivos
│   └── ...                      # Más assets
│
├── Docs/                         # Documentación técnica
│   ├── ARCHITECTURE_GUIDE.md    # Guía de arquitectura
│   ├── CART_INTEGRATION_GUIDE.md # Guía de integración del carrito
│   ├── COOKIE_SYSTEM.md         # Sistema de cookies
│   ├── DARK_MODE_IMPLEMENTATION.md # Modo oscuro
│   ├── PRODUCT_FILTERS_GUIDE.md # Guía de filtros
│   └── ...                      # Más documentación
│
├── .env.development.example     # Plantilla (dev)
├── .env.production.example      # Plantilla (prod)
├── next.config.ts               # Configuración de Next.js
├── tailwind.config.ts           # Configuración de Tailwind
├── tsconfig.json                # Configuración de TypeScript
├── components.json              # Configuración de shadcn/ui
└── package.json                 # Dependencias y scripts
```

## 🚀 Instalación y Configuración

### ⚙️ Gestor de Paquetes

Este proyecto utiliza **pnpm** como gestor de paquetes exclusivo. La configuración está garantizada mediante:

- `packageManager: "pnpm@10.28.0"` en `package.json`
- Archivo `.npmrc` con configuración de pnpm
- Scripts optimizados para pnpm

**No uses `npm` o `yarn`** - El proyecto está configurado para usar pnpm automáticamente.

### Prerrequisitos
```bash
# Versiones requeridas
Node.js 18+
pnpm 10.28.0 (gestor de paquetes requerido)
Git
```

### 1. Preparar Entorno

```bash
# Navegar al directorio del frontend
cd revital_ecommerce/frontend

# Instalar dependencias con pnpm
pnpm install
```

> **Nota:** Este proyecto usa `pnpm` como gestor de paquetes. Asegúrate de tener `pnpm@10.28.0` instalado. El archivo `.npmrc` y `packageManager` en `package.json` garantizan el uso correcto de pnpm.

### 2. Configurar Variables de Entorno
```bash
# Copiar plantilla de desarrollo (recomendado)
cp .env.development.example .env.development

# (Opcional) plantilla de producción para builds locales
# cp .env.production.example .env.production
```

```env
# Variables mínimas (ver `.env.development.example` para el set completo)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_xxxx
```

### 3. Iniciar Desarrollo

```bash
# Desde el directorio del frontend
cd revital_ecommerce/frontend

# Iniciar servidor de desarrollo
pnpm dev
```

La aplicación estará disponible en: **http://localhost:3001**

> **Nota:** El proyecto está configurado para usar `pnpm` automáticamente. Si intentas usar `npm` o `yarn`, recibirás una advertencia gracias a la configuración de `packageManager` en `package.json`.

## 🎨 Personalización por Cliente

El frontend está preparado para funcionar como **white-label** por instancia:

- Configuración por variables `NEXT_PUBLIC_*` (nombre de tienda, dominio, colores, logo, moneda, idioma).
- Soporta distintos **tipos de negocio** (`fashion`, `electronics`, `home_garden`, `general`) para ajustar atributos mostrados (talla, color, etc.).
- Permite **activar features por plan** (`analytics`, `inventory`, `marketing`, `advanced_ui`) para adaptar la UI según el plan contratado.

## 🔐 Autenticación y Planes

- Autenticación basada en JWT (roles: **admin**, **employee**, **customer**) integrada con el backend.
- Protección de rutas sensibles (dashboard, analytics, etc.) según rol y plan.

## 🧰 Scripts principales

```bash
pnpm dev        # Servidor de desarrollo
pnpm build      # Build de producción
pnpm start      # Servidor de producción
pnpm lint       # Lint
pnpm type-check # Verificación de tipos
```

## 🛒 Componentes de E-Commerce

### Tarjeta de Producto Personalizable
```typescript
// components/store/product-card.tsx
'use client';

import { useClientConfig } from '@/hooks/use-client-config';
import { useCart } from '@/hooks/use-cart';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    description: string;
    attributes?: Record<string, string>;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const config = useClientConfig();
  const { addToCart } = useCart();

  const formatPrice = (price: number) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY || 'USD';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img 
        src={product.image} 
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3">
          {product.description}
        </p>

        {/* Atributos específicos del sector */}
        {config.businessType === 'fashion' && product.attributes && (
          <div className="flex flex-wrap gap-2 mb-3">
            {product.attributes.talla && (
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                Talla: {product.attributes.talla}
              </span>
            )}
            {product.attributes.color && (
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                Color: {product.attributes.color}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          
          <button
            onClick={() => addToCart(product)}
            className="px-4 py-2 rounded-md text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: config.branding.primaryColor }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 📊 Analytics Condicionales por Plan

### Dashboard de Analytics
```typescript
// app/(dashboard)/analytics/page.tsx
'use client';

import { PlanGuard } from '@/components/auth/plan-guard';
import { useClientConfig } from '@/hooks/use-client-config';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const AnalyticsPage = () => {
  const config = useClientConfig();

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics/summary'),
    enabled: config.features.analytics,
  });

  return (
    <PlanGuard requiredPlan="business" requiredFeature="analytics">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Ventas Totales</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${analytics?.totalSales || 0}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Productos Vendidos</h3>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.productsSold || 0}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Nuevos Clientes</h3>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.newCustomers || 0}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Tasa de Conversión</h3>
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.conversionRate || 0}%
            </p>
          </div>
        </div>

        {/* Gráficos adicionales para plan Enterprise */}
        <PlanGuard requiredPlan="enterprise">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Analytics Avanzados</h3>
            {/* Componente de gráficos avanzados */}
          </div>
        </PlanGuard>
      </div>
    </PlanGuard>
  );
};

export default AnalyticsPage;
```

## 🎨 Estilos Dinámicos por Cliente

### Configuración de Tailwind Personalizada
```javascript
// tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores dinámicos basados en variables CSS
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### CSS Variables Dinámicas
```css
/* app/globals.css */
:root {
  /* Colores por defecto */
  --brand-primary: #1a56db;
  --brand-secondary: #64748b;
  --brand-accent: #f59e0b;
}

/* Aplicación de colores dinámicos */
.btn-primary {
  background-color: var(--brand-primary);
  color: white;
}

.btn-primary:hover {
  background-color: color-mix(in srgb, var(--brand-primary) 90%, black);
}

.border-brand {
  border-color: var(--brand-primary);
}

.text-brand {
  color: var(--brand-primary);
}
```

## 🚀 Build y Deployment

### Scripts de Package.json
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "build:analyze": "ANALYZE=true next build"
  }
}
```

### Build para Producción

```bash
# Desde el directorio del frontend
cd revital_ecommerce/frontend

# Build optimizado para producción
pnpm build

# Verificar tipos antes del build
pnpm type-check

# Lint y formateo
pnpm lint:fix
pnpm format

# Iniciar servidor de producción
pnpm start
```

## 📚 Comandos Útiles

### Desarrollo
```bash
# Servidor de desarrollo con hot reload
pnpm dev

# Verificación de tipos en tiempo real
pnpm type-check -- --watch

# Lint con corrección automática
pnpm lint:fix

# Formateo de código
pnpm format
```

### Testing (cuando se implemente)
```bash
# Ejecutar tests unitarios
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests de integración
pnpm test:integration

# Tests E2E
pnpm test:e2e
```

### Build y Análisis
```bash
# Build de producción
pnpm build

# Análisis del bundle
pnpm build:analyze

# Verificar build localmente
pnpm start
```

## 🎯 Ventajas del Frontend Aislado

### Para Desarrollo
- ✅ **Personalización total** por cliente sin complejidad
- ✅ **Desarrollo estándar** de Next.js sin multi-tenancy
- ✅ **Testing simplificado** con configuración específica
- ✅ **Debugging independiente** por instancia

### Para Clientes
- ✅ **Branding completo** - Logo, colores, dominio propio
- ✅ **Performance dedicada** - CDN y assets específicos
- ✅ **SEO personalizado** - Meta tags y estructurados por cliente
- ✅ **Experiencia nativa** - Sin indicios de ser SaaS

### Para Business
- ✅ **White-label total** - Sin marca Revital visible
- ✅ **Pricing premium** - Justificación para precios altos
- ✅ **Customización ilimitada** - CSS y JS específicos
- ✅ **Compliance total** - Datos y UI completamente aislados

---

**Frontend Revital** - Experiencias de e-commerce únicas para cada cliente 🛍️✨
