# Mock Data System

Sistema centralizado de datos de ejemplo para desarrollo y testing.

## 📁 Estructura de Archivos

```
mockData/
├── index.ts                              # Central mock data hub
└── README.md                             # Esta documentación

components/layout/shop/
├── new-drops/
│   └── mockData/
│       └── index.ts                      # Mock data para New Drops
├── categories/
│   └── mockData/
│       └── index.ts                      # Mock data para Categories
└── other-sections/
    └── mockData/
        └── index.ts                      # Mock data para otras secciones
```

## 🔄 Uso del Sistema

### 1. Importación Directa (Recomendado)
```typescript
// Desde la carpeta específica del componente
import { newDropsProducts, type Product } from './mockData';
import { categories, type Category } from './mockData';
```

### 2. Importación Centralizada
```typescript
// Desde el hub central
import { 
  newDropsProducts, 
  categories,
  type Product, 
  type Category 
} from '@/mockData';
```

### 3. Generación Dinámica
```typescript
import { generateMockProduct, generateMockCategory } from '@/mockData';

// Crear productos de ejemplo
const newProduct = generateMockProduct('new-001', {
  name: 'Custom Product Name',
  price: 150,
  brand: 'Custom Brand'
});

// Crear categorías de ejemplo
const newCategory = generateMockCategory('cat-001', {
  name: 'Custom Category',
  featured: true
});
```

## 🎯 Beneficios del Sistema

### ✅ Organización Modular
- Cada sección tiene sus propios datos mock
- Fácil mantenimiento y actualización
- Separación clara de responsabilidades

### ✅ TypeScript Support
- Tipos completamente tipados
- IntelliSense completo
- Detección de errores en tiempo de desarrollo

### ✅ Reutilización
- Hub central para acceso desde cualquier parte
- Utilidades para generar datos dinámicos
- Configuración centralizada

### ✅ Transición a API Real
- Estructura preparada para reemplazar con llamadas reales
- Mismos tipos para mock y API real
- Configuración de delays para simular latencia

## 🔧 Configuración

### Configuración Global
```typescript
export const mockConfig = {
  useRealImages: false,        // Usar imágenes de Unsplash
  apiDelay: 1000,             // Delay simulado en ms
  itemsPerPage: {
    newDrops: 4,
    categories: 2,
    products: 12
  },
  currency: 'COP',
  currencySymbol: '$'
};
```

### Personalizar Imágenes
```typescript
// Usar placeholder
const imageUrl = getMockImageUrl(300, 300, 'shoes');
// → /api/placeholder/300/300

// Usar imágenes reales (configurar useRealImages: true)
const realImageUrl = getMockImageUrl(300, 300, 'sneakers');
// → https://images.unsplash.com/300x300/?sneakers
```

### Simular Delays de API
```typescript
const fetchMockData = async () => {
  await mockApiDelay(); // Simula latencia de red
  return newDropsProducts;
};
```

## 📊 Tipos de Datos

### Product
```typescript
interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  rating?: number;
}
```

### Category
```typescript
interface Category {
  id: string;
  name: string;
  image: string;
  productCount?: number;
  featured?: boolean;
  description?: string;
  slug?: string;
}
```

## 🚀 Migración a API Real

### Paso 1: Crear servicios de API
```typescript
// services/productService.ts
export const fetchNewProducts = async (): Promise<Product[]> => {
  const response = await fetch('/api/products/new');
  return response.json();
};
```

### Paso 2: Reemplazar en componentes
```typescript
// Antes (mock)
import { newDropsProducts } from './mockData';

// Después (API real)
import { useQuery } from '@tanstack/react-query';
import { fetchNewProducts } from '@/services/productService';

const { data: newDropsProducts } = useQuery({
  queryKey: ['products', 'new'],
  queryFn: fetchNewProducts
});
```

### Paso 3: Mantener tipos
```typescript
// Los tipos se mantienen iguales
import { type Product } from '@/mockData';
```

## 🎨 Personalización por Cliente (SaaS)

```typescript
// Configuración específica por tenant
const getTenantMockData = (tenantId: string) => {
  const baseProducts = [...newDropsProducts];
  
  // Personalizar según el cliente
  return baseProducts.map(product => ({
    ...product,
    price: adjustPriceForTenant(product.price, tenantId),
    image: getTenantProductImage(product.id, tenantId)
  }));
};
```

## 🔄 Próximas Mejoras

- [ ] Integración con Storybook
- [ ] Generadores más avanzados
- [ ] Mock data basado en schemas
- [ ] Seed data para testing
- [ ] Sincronización con backend mock 