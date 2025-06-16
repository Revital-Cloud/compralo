# Synkro Frontend - Interfaz SaaS de E-Commerce 🎨

**Aplicación Next.js 15 para instancias de cliente personalizadas**

El frontend de Synkro está construido con Next.js 15+ y diseñado para ofrecer una experiencia completamente personalizada para cada cliente SaaS. Cada instancia puede tener su propio branding, dominio y configuración específica.

## 🎯 Características SaaS del Frontend

### White-Label Completo
- **Branding personalizado** - Logo, colores, tipografías por cliente
- **Dominio propio** - Cada cliente tiene su URL personalizada
- **Personalización total** - CSS y JavaScript específicos por instancia
- **Sin marca Synkro** - Experiencia completamente del cliente
- **Configuración por sector** - Templates específicos por industria

### Multi-Plan Adaptativo
- **Starter**: Interfaz básica con funciones esenciales
- **Business**: Dashboard avanzado con analytics
- **Enterprise**: Personalización completa + integraciones

## 🛠️ Stack Tecnológico

### Core Framework
- **Next.js 15+** - Framework React con App Router
- **TypeScript** - Tipado estático completo
- **React 18+** - Últimas características de React
- **Tailwind CSS 3** - Styling utilitario responsive

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
├── app/                          # App Router (Next.js 15+)
│   ├── (auth)/                  # Grupo de rutas de autenticación
│   │   ├── login/               # Página de login
│   │   └── register/            # Página de registro
│   │
│   ├── (dashboard)/             # Grupo de rutas protegidas
│   │   ├── admin/               # Panel de administración
│   │   ├── products/            # Gestión de productos
│   │   ├── orders/              # Gestión de pedidos
│   │   ├── customers/           # Gestión de clientes
│   │   └── analytics/           # Dashboard de analytics
│   │
│   ├── (store)/                 # Tienda pública del cliente
│   │   ├── page.tsx            # Página principal de la tienda
│   │   ├── products/           # Catálogo de productos
│   │   ├── cart/               # Carrito de compras
│   │   └── checkout/           # Proceso de checkout
│   │
│   ├── api/                     # API Routes (si necesarias)
│   ├── globals.css              # Estilos globales
│   ├── layout.tsx               # Layout principal
│   └── page.tsx                 # Página de inicio
│
├── components/                   # Componentes reutilizables
│   ├── ui/                      # Componentes base (shadcn/ui)
│   │   ├── button.tsx           # Botón personalizable
│   │   ├── input.tsx            # Input con validación
│   │   ├── card.tsx             # Cards responsivos
│   │   └── ...                  # Más componentes UI
│   │
│   ├── auth/                    # Componentes de autenticación
│   │   ├── login-form.tsx       # Formulario de login
│   │   ├── register-form.tsx    # Formulario de registro
│   │   └── auth-guard.tsx       # Protección de rutas
│   │
│   ├── admin/                   # Componentes de administración
│   │   ├── product-form.tsx     # Formulario de productos
│   │   ├── order-list.tsx       # Lista de pedidos
│   │   └── analytics-chart.tsx  # Gráficos de analytics
│   │
│   ├── store/                   # Componentes de la tienda
│   │   ├── product-card.tsx     # Tarjeta de producto
│   │   ├── cart-sidebar.tsx     # Sidebar del carrito
│   │   └── checkout-form.tsx    # Formulario de checkout
│   │
│   └── common/                  # Componentes comunes
│       ├── header.tsx           # Header personalizable
│       ├── footer.tsx           # Footer con branding
│       ├── loading.tsx          # Estados de carga
│       └── error-boundary.tsx   # Manejo de errores
│
├── lib/                          # Utilidades y configuración
│   ├── auth.tsx                 # Configuración de autenticación
│   ├── api.ts                   # Cliente API (fetch wrapper)
│   ├── utils.ts                 # Utilidades generales
│   ├── validations.ts           # Esquemas de validación
│   └── constants.ts             # Constantes de la aplicación
│
├── hooks/                        # Custom hooks
│   ├── use-auth.ts              # Hook de autenticación
│   ├── use-cart.ts              # Hook del carrito
│   ├── use-products.ts          # Hook de productos
│   └── use-orders.ts            # Hook de pedidos
│
├── types/                        # Definiciones de tipos
│   ├── auth.ts                  # Tipos de autenticación
│   ├── products.ts              # Tipos de productos
│   ├── orders.ts                # Tipos de pedidos
│   └── client-config.ts         # Configuración del cliente
│
├── public/                       # Assets estáticos personalizables
│   ├── logos/                   # Logos por cliente
│   ├── favicon/                 # Favicons personalizados
│   └── images/                  # Imágenes de la tienda
│
├── styles/                       # Estilos personalizados
│   ├── globals.css              # Estilos globales
│   └── client-themes/           # Temas por cliente
│       ├── empresa-abc.css      # Tema específico del cliente
│       └── default.css          # Tema por defecto
│
├── .env.local.example           # Plantilla de configuración
├── next.config.js               # Configuración de Next.js
├── tailwind.config.js           # Configuración de Tailwind
├── tsconfig.json                # Configuración de TypeScript
└── package.json                 # Dependencias y scripts
```

## 🚀 Instalación y Configuración

### Prerrequisitos
```bash
# Versiones requeridas
Node.js 18+
npm 9+ (o yarn/pnpm)
Git
```

### 1. Preparar Entorno
```bash
# Instalar dependencias
npm install

# O con yarn
yarn install

# O con pnpm
pnpm install
```

### 2. Configurar Variables de Entorno
```bash
# Copiar plantilla de configuración
cp .env.local.example .env.local
```

```env
# .env.local - Configuración específica de esta instancia de cliente

# API Backend de esta instancia
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_VERSION=v1

# Identificación del cliente
NEXT_PUBLIC_CLIENT_NAME=empresa_abc
NEXT_PUBLIC_CLIENT_DOMAIN=empresa-abc.com
NEXT_PUBLIC_INSTANCE_ID=abc_001

# Personalización del cliente
NEXT_PUBLIC_BRAND_NAME="Empresa ABC"
NEXT_PUBLIC_BRAND_PRIMARY_COLOR=#1a56db
NEXT_PUBLIC_BRAND_SECONDARY_COLOR=#64748b
NEXT_PUBLIC_BRAND_LOGO_URL=/logos/empresa-abc-logo.png
NEXT_PUBLIC_FAVICON_URL=/favicon/empresa-abc-favicon.ico

# Plan y características
NEXT_PUBLIC_SUBSCRIPTION_PLAN=business
NEXT_PUBLIC_MAX_PRODUCTS=1000
NEXT_PUBLIC_FEATURES_ENABLED=analytics,inventory,marketing,advanced_ui

# Configuración de negocio
NEXT_PUBLIC_BUSINESS_TYPE=fashion
NEXT_PUBLIC_CURRENCY=ARS
NEXT_PUBLIC_LANGUAGE=es

# Mercado Pago (público)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-client_specific_public_key

# Analytics y tracking (opcional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=GA-CLIENT-123
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=CLIENT-FB-PIXEL

# Configuración de producción
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_CUSTOM_DOMAIN=https://tienda.empresa-abc.com
```

### 3. Iniciar Desarrollo
```bash
# Servidor de desarrollo
npm run dev

# O con yarn
yarn dev

# O con pnpm
pnpm dev
```

La aplicación estará disponible en: http://localhost:3000

## 🎨 Personalización por Cliente

### Sistema de Temas Dinámicos
```typescript
// types/client-config.ts
export interface ClientConfig {
  name: string;
  domain: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logo: string;
    favicon: string;
    font: 'inter' | 'roboto' | 'poppins';
  };
  features: {
    analytics: boolean;
    inventory: boolean;
    marketing: boolean;
    multiLanguage: boolean;
    advancedUI: boolean;
  };
  businessType: 'fashion' | 'electronics' | 'home_garden' | 'general';
  plan: 'starter' | 'business' | 'enterprise';
}
```

### Hook de Configuración del Cliente
```typescript
// hooks/use-client-config.ts
export const useClientConfig = () => {
  const config: ClientConfig = {
    name: process.env.NEXT_PUBLIC_CLIENT_NAME || 'Default Store',
    domain: process.env.NEXT_PUBLIC_CLIENT_DOMAIN || 'localhost',
    branding: {
      primaryColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || '#1a56db',
      secondaryColor: process.env.NEXT_PUBLIC_BRAND_SECONDARY_COLOR || '#64748b',
      accentColor: process.env.NEXT_PUBLIC_BRAND_ACCENT_COLOR || '#f59e0b',
      logo: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || '/logos/default-logo.png',
      favicon: process.env.NEXT_PUBLIC_FAVICON_URL || '/favicon.ico',
      font: 'inter'
    },
    features: {
      analytics: process.env.NEXT_PUBLIC_FEATURES_ENABLED?.includes('analytics') || false,
      inventory: process.env.NEXT_PUBLIC_FEATURES_ENABLED?.includes('inventory') || false,
      marketing: process.env.NEXT_PUBLIC_FEATURES_ENABLED?.includes('marketing') || false,
      multiLanguage: process.env.NEXT_PUBLIC_FEATURES_ENABLED?.includes('multi_language') || false,
      advancedUI: process.env.NEXT_PUBLIC_FEATURES_ENABLED?.includes('advanced_ui') || false
    },
    businessType: (process.env.NEXT_PUBLIC_BUSINESS_TYPE as any) || 'general',
    plan: (process.env.NEXT_PUBLIC_SUBSCRIPTION_PLAN as any) || 'starter'
  };

  return config;
};
```

### Componente de Header Personalizable
```typescript
// components/common/header.tsx
'use client';

import { useClientConfig } from '@/hooks/use-client-config';
import { useAuth } from '@/hooks/use-auth';

export const Header = () => {
  const config = useClientConfig();
  const { user, logout } = useAuth();

  return (
    <header 
      className="border-b bg-white"
      style={{ borderColor: config.branding.primaryColor }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo personalizado del cliente */}
          <div className="flex items-center">
            <img 
              src={config.branding.logo} 
              alt={`${config.name} Logo`}
              className="h-8 w-auto"
            />
            <span 
              className="ml-2 text-xl font-bold"
              style={{ color: config.branding.primaryColor }}
            >
              {config.name}
            </span>
          </div>

          {/* Navegación adaptada por plan */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-900 hover:text-gray-700">
              Inicio
            </a>
            <a href="/products" className="text-gray-900 hover:text-gray-700">
              Productos
            </a>
            
            {/* Mostrar Analytics solo si está habilitado */}
            {config.features.analytics && user?.role === 'admin' && (
              <a href="/analytics" className="text-gray-900 hover:text-gray-700">
                Analytics
              </a>
            )}
          </nav>

          {/* Acciones de usuario */}
          <div className="flex items-center space-x-4">
            {user ? (
              <button 
                onClick={logout}
                className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Cerrar Sesión
              </button>
            ) : (
              <a 
                href="/login"
                className="text-white px-4 py-2 rounded-md"
                style={{ backgroundColor: config.branding.primaryColor }}
              >
                Iniciar Sesión
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
```

## 🔐 Autenticación sin Tenant Complexity

### Hook de Autenticación Simplificado
```typescript
// hooks/use-auth.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'customer';
}

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Obtener usuario actual (sin tenant_id)
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me'),
    retry: false,
  });

  // Login
  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post('/auth/login', credentials),
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    queryClient.clear();
    window.location.href = '/login';
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login: loginMutation.mutate,
    logout,
    isLoginPending: loginMutation.isPending,
  };
};
```

### Protección de Rutas por Plan
```typescript
// components/auth/plan-guard.tsx
'use client';

import { useClientConfig } from '@/hooks/use-client-config';
import { useAuth } from '@/hooks/use-auth';

interface PlanGuardProps {
  requiredPlan: 'starter' | 'business' | 'enterprise';
  requiredFeature?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PlanGuard: React.FC<PlanGuardProps> = ({
  requiredPlan,
  requiredFeature,
  children,
  fallback
}) => {
  const config = useClientConfig();
  const { user } = useAuth();

  const planLevels = { starter: 1, business: 2, enterprise: 3 };
  const currentLevel = planLevels[config.plan];
  const requiredLevel = planLevels[requiredPlan];

  const hasAccess = currentLevel >= requiredLevel;
  const hasFeature = !requiredFeature || config.features[requiredFeature as keyof typeof config.features];

  if (!hasAccess || !hasFeature) {
    return fallback || (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">
          Esta funcionalidad requiere el plan {requiredPlan} o superior.
          {requiredFeature && ` Feature requerida: ${requiredFeature}`}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
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
# Build optimizado para producción
npm run build

# Verificar tipos antes del build
npm run type-check

# Lint y formateo
npm run lint:fix
npm run format

# Iniciar servidor de producción
npm start
```

### Docker para Cliente Específico
```dockerfile
# Dockerfile para instancia del cliente
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with client-specific environment variables
ARG NEXT_PUBLIC_CLIENT_NAME
ARG NEXT_PUBLIC_BRAND_PRIMARY_COLOR
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_CLIENT_NAME=$NEXT_PUBLIC_CLIENT_NAME
ENV NEXT_PUBLIC_BRAND_PRIMARY_COLOR=$NEXT_PUBLIC_BRAND_PRIMARY_COLOR
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## 📚 Comandos Útiles

### Desarrollo
```bash
# Servidor de desarrollo con hot reload
npm run dev

# Verificación de tipos en tiempo real
npm run type-check -- --watch

# Lint con corrección automática
npm run lint:fix

# Formateo de código
npm run format
```

### Testing (cuando se implemente)
```bash
# Ejecutar tests unitarios
npm run test

# Tests con coverage
npm run test:coverage

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e
```

### Build y Análisis
```bash
# Build de producción
npm run build

# Análisis del bundle
npm run build:analyze

# Verificar build localmente
npm run start
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
- ✅ **White-label total** - Sin marca Synkro visible
- ✅ **Pricing premium** - Justificación para precios altos
- ✅ **Customización ilimitada** - CSS y JS específicos
- ✅ **Compliance total** - Datos y UI completamente aislados

---

**Frontend Synkro** - Experiencias de e-commerce únicas para cada cliente 🛍️✨
