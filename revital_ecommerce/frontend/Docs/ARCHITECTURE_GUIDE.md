# 🏗️ Guía de Arquitectura Frontend - API & Estado

Esta guía explica la arquitectura completa del sistema de comunicación con la API, manejo de estado del servidor y hooks personalizados implementados en el frontend.

## 📖 Índice

1. [Visión General](#visión-general)
2. [ApiWrapper](#apiwrapper)
3. [Services](#services)
4. [Hooks Personalizados](#hooks-personalizados)
5. [React Query Provider](#react-query-provider)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Mejores Prácticas](#mejores-prácticas)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visión General

### Arquitectura en Capas

```
┌─────────────────────────────────────────┐
│                COMPONENTES              │
│          (React Components)             │
├─────────────────────────────────────────┤
│                 HOOKS                   │
│        (use-auth, use-products)         │
├─────────────────────────────────────────┤
│               SERVICES                  │
│   (auth.service, user.service, etc.)    │
├─────────────────────────────────────────┤
│              API WRAPPER                │
│         (axios config + HTTP)           │
├─────────────────────────────────────────┤
│               BACKEND API               │
│            (FastAPI Server)             │
└─────────────────────────────────────────┘
```

### Flujo de Datos

```
Component → Hook → Service → ApiWrapper → Backend
                ↓
        React Query Cache
```

---

## 🔧 ApiWrapper

**Ubicación**: `/utils/apiWrapper.ts`

### Responsabilidades

- ✅ **Configuración de Axios**: Instancia singleton con interceptores
- ✅ **Autenticación automática**: Manejo de tokens JWT
- ✅ **Refresh automático**: Renovación de tokens expirados
- ✅ **Métodos HTTP básicos**: GET, POST, PUT, DELETE, PATCH

### Configuración

```typescript
// Configuración base
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const instance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Interceptores

#### Request Interceptor
```typescript
// Agrega automáticamente el token de autorización
instance.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### Response Interceptor
```typescript
// Maneja refresh automático de tokens
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Intentar renovar token automáticamente
      await refreshToken();
      return instance(originalRequest);
    }
    return Promise.reject(error);
  }
);
```

### API Disponible

```typescript
// Métodos HTTP básicos
import { get, post, put, del, patch } from '@/utils/apiWrapper';

// Manejo de tokens
import { 
  getStoredToken, 
  storeTokens, 
  clearTokens, 
  isAuthenticated 
} from '@/utils/apiWrapper';
```

---

## 🏢 Services

**Ubicación**: `/services/`

### Estructura

```
services/
├── auth.service.ts      # Autenticación
├── user.service.ts      # Usuarios y perfiles
└── product.service.ts   # Productos e inventario
```

### Principios

- ✅ **Separación por dominio**: Cada service maneja una entidad específica
- ✅ **Funciones puras**: Solo lógica de transformación de datos
- ✅ **Usa ApiWrapper**: Para todas las llamadas HTTP
- ✅ **Tipado fuerte**: TypeScript con interfaces definidas

### Auth Service

```typescript
// /services/auth.service.ts

import { post, storeTokens } from '@/utils/apiWrapper';
import type { LoginRequest, TokenResponse } from '@/types';

export async function login(credentials: LoginRequest): Promise<TokenResponse> {
  const tokens = await post<TokenResponse>('/auth/login', credentials);
  
  // Almacenar tokens automáticamente
  storeTokens(tokens.access_token, tokens.refresh_token);
  
  return tokens;
}

export async function register(userData: RegisterRequest): Promise<User> {
  return await post<User>('/auth/register', userData);
}

export function logout(): void {
  clearTokens();
}
```

### User Service

```typescript
// /services/user.service.ts

import { get, put, post, del } from '@/utils/apiWrapper';

export async function getCurrentUser(): Promise<User> {
  return await get<User>('/users/me');
}

export async function updateCurrentUser(userData: UserUpdate): Promise<User> {
  return await put<User>('/users/me', userData);
}

export async function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const formData = new FormData();
  formData.append('avatar', file);
  
  return await post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
```

### Product Service

```typescript
// /services/product.service.ts

export async function getProducts(params?: ProductFilters): Promise<PaginatedResponse<Product>> {
  return await get<PaginatedResponse<Product>>('/products', { params });
}

export async function createProduct(productData: ProductCreate): Promise<Product> {
  return await post<Product>('/products', productData);
}

export async function updateProductStock(stockData: StockUpdate): Promise<Product> {
  return await put<Product>(`/products/${stockData.id_producto}/stock`, stockData);
}
```

---

## 🎣 Hooks Personalizados

**Ubicación**: `/hooks/`

### Estructura

```
hooks/
├── use-auth.ts          # Autenticación y sesión
├── use-products.ts      # Productos e inventario
└── use-toast-actions.ts # Notificaciones (existente)
```

### Principios

- ✅ **React Query**: Para manejo de estado del servidor
- ✅ **Cache inteligente**: Configuración optimizada por caso de uso
- ✅ **UX optimizada**: Actualizaciones optimistas, prefetching
- ✅ **Error handling**: Manejo consistente de errores

### Use Auth Hook

```typescript
// /hooks/use-auth.ts

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'currentUser'],
    queryFn: () => userService.getCurrentUser(),
    enabled: isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    user,
    isAuthenticated: isAuthenticated() && !!user,
    isLoading,
    error,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: () => {
      toast.success('¡Bienvenido!');
      queryClient.invalidateQueries({ queryKey: ['auth', 'currentUser'] });
      window.location.href = '/dashboard';
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
    },
  });
}
```

### Use Products Hook

```typescript
// /hooks/use-products.ts

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', 'list', { filters }],
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stockData: StockUpdate) => productService.updateProductStock(stockData),
    
    // Actualización optimista
    onMutate: async (stockData) => {
      await queryClient.cancelQueries({ 
        queryKey: ['products', 'detail', stockData.id_producto] 
      });

      const previousProduct = queryClient.getQueryData(['products', 'detail', stockData.id_producto]);

      queryClient.setQueryData(['products', 'detail', stockData.id_producto], (old: Product) => ({
        ...old,
        stock_actual: stockData.nuevo_stock,
      }));

      return { previousProduct };
    },
    
    onError: (error, stockData, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(['products', 'detail', stockData.id_producto], context.previousProduct);
      }
      toast.error('Error al actualizar stock');
    },
    
    onSuccess: () => {
      toast.success('Stock actualizado');
    },
  });
}
```

### Query Keys

```typescript
// Organización consistente de claves
export const PRODUCT_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
  list: (filters?: ProductFilters) => [...PRODUCT_KEYS.lists(), { filters }] as const,
  details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PRODUCT_KEYS.details(), id] as const,
};
```

---

## ⚛️ React Query Provider

**Ubicación**: `/providers/query-provider.tsx`

### Configuración

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minuto por defecto
        gcTime: 5 * 60 * 1000, // 5 minutos
        retry: (failureCount, error: any) => {
          if (error?.response?.status === 404) return false;
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        gcTime: 5 * 60 * 1000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Configuración en Layout

```typescript
// app/layout.tsx
import QueryProvider from '@/providers/query-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## 💡 Ejemplos de Uso

### 1. Componente de Login

```typescript
'use client';

import { useLogin } from '@/hooks/use-auth';
import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { mutate: login, isPending, error } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        disabled={isPending}
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        disabled={isPending}
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}
```

### 2. Lista de Productos

```typescript
'use client';

import { useProducts, usePrefetchProduct } from '@/hooks/use-products';
import { useState } from 'react';

export default function ProductList() {
  const [filters, setFilters] = useState<ProductFilters>({});
  
  const { 
    data: productsPage, 
    isLoading, 
    error, 
    refetch 
  } = useProducts(filters);

  const prefetchProduct = usePrefetchProduct();

  if (isLoading) return <div>Cargando productos...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Productos ({productsPage?.total} total)</h2>
      
      <div className="products-grid">
        {productsPage?.data.map((product) => (
          <div 
            key={product.id_producto}
            onMouseEnter={() => prefetchProduct(product.id_producto)}
          >
            <h3>{product.nombre}</h3>
            <p>Stock: {product.stock_actual}</p>
            <p>${product.precio}</p>
          </div>
        ))}
      </div>
      
      <button onClick={() => refetch()}>
        Recargar
      </button>
    </div>
  );
}
```

### 3. Gestión de Stock (con Actualización Optimista)

```typescript
'use client';

import { useProduct, useUpdateStock } from '@/hooks/use-products';
import { useState } from 'react';

export default function StockManager({ productId }: { productId: number }) {
  const { data: product, isLoading } = useProduct(productId);
  const { mutate: updateStock, isPending } = useUpdateStock();
  
  const [newStock, setNewStock] = useState(0);

  const handleUpdateStock = () => {
    updateStock({
      id_producto: productId,
      nuevo_stock: newStock,
      motivo: 'Ajuste manual',
      tipo_movimiento: 'ajuste'
    });
  };

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h3>{product?.nombre}</h3>
      <p>Stock actual: {product?.stock_actual}</p>
      
      <input
        type="number"
        value={newStock}
        onChange={(e) => setNewStock(Number(e.target.value))}
        placeholder="Nuevo stock"
      />
      
      <button 
        onClick={handleUpdateStock}
        disabled={isPending}
      >
        {isPending ? 'Actualizando...' : 'Actualizar Stock'}
      </button>
    </div>
  );
}
```

### 4. Dashboard de Usuario

```typescript
'use client';

import { useAuth, useUpdateProfile } from '@/hooks/use-auth';
import { useProducts } from '@/hooks/use-products';

export default function Dashboard() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { data: products, isLoading: isLoadingProducts } = useProducts({ 
    limit: 5 
  });
  const { mutate: updateProfile } = useUpdateProfile();

  if (isLoadingAuth) return <div>Cargando usuario...</div>;

  return (
    <div>
      <h1>¡Hola, {user?.nombres}!</h1>
      
      <section>
        <h2>Productos Recientes</h2>
        {isLoadingProducts ? (
          <div>Cargando productos...</div>
        ) : (
          <div>
            {products?.data.map(product => (
              <div key={product.id_producto}>
                {product.nombre}
              </div>
            ))}
          </div>
        )}
      </section>
      
      <button onClick={() => updateProfile({ nombres: 'Nuevo nombre' })}>
        Actualizar Perfil
      </button>
    </div>
  );
}
```

---

## ✨ Mejores Prácticas

### 1. Organización de Query Keys

```typescript
// ✅ Bueno - Estructura jerárquica consistente
const PRODUCT_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
  list: (filters: ProductFilters) => [...PRODUCT_KEYS.lists(), { filters }] as const,
  details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PRODUCT_KEYS.details(), id] as const,
};

// ❌ Malo - Keys inconsistentes
const keys = {
  products: ['products'],
  productList: ['product-list'],
  singleProduct: (id: number) => [`product-${id}`],
};
```

### 2. Configuración de Stale Time

```typescript
// ✅ Configuración específica por tipo de dato
const useProducts = () => useQuery({
  queryKey: PRODUCT_KEYS.lists(),
  queryFn: getProducts,
  staleTime: 5 * 60 * 1000, // 5 minutos - datos que cambian frecuentemente
});

const useCategories = () => useQuery({
  queryKey: ['categories'],
  queryFn: getCategories,
  staleTime: 15 * 60 * 1000, // 15 minutos - datos más estáticos
});

const useUserProfile = () => useQuery({
  queryKey: ['user', 'profile'],
  queryFn: getCurrentUser,
  staleTime: 10 * 60 * 1000, // 10 minutos - perfil del usuario
});
```

### 3. Error Handling

```typescript
// ✅ Manejo de errores específico
const useProducts = () => useQuery({
  queryKey: PRODUCT_KEYS.lists(),
  queryFn: getProducts,
  retry: (failureCount, error) => {
    // No reintentar errores 404 o 403
    if (error?.response?.status === 404 || error?.response?.status === 403) {
      return false;
    }
    return failureCount < 3;
  },
  throwOnError: (error) => {
    // Solo lanzar errores críticos
    return error?.response?.status >= 500;
  }
});
```

### 4. Actualizaciones Optimistas

```typescript
// ✅ Patrón completo de actualización optimista
const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProduct,
    
    onMutate: async (newData) => {
      // 1. Cancelar queries en progreso
      await queryClient.cancelQueries({ queryKey: PRODUCT_KEYS.detail(newData.id) });
      
      // 2. Obtener datos previos
      const previousProduct = queryClient.getQueryData(PRODUCT_KEYS.detail(newData.id));
      
      // 3. Actualizar optimistamente
      queryClient.setQueryData(PRODUCT_KEYS.detail(newData.id), (old) => ({
        ...old,
        ...newData
      }));
      
      return { previousProduct };
    },
    
    onError: (err, newData, context) => {
      // 4. Revertir en caso de error
      if (context?.previousProduct) {
        queryClient.setQueryData(PRODUCT_KEYS.detail(newData.id), context.previousProduct);
      }
    },
    
    onSettled: (data, error, variables) => {
      // 5. Invalidar para asegurar consistencia
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(variables.id) });
    }
  });
};
```

### 5. Prefetching Inteligente

```typescript
// ✅ Prefetch en hover para mejor UX
const ProductCard = ({ productId }: { productId: number }) => {
  const prefetchProduct = usePrefetchProduct();
  
  return (
    <div 
      onMouseEnter={() => prefetchProduct(productId)}
      onFocus={() => prefetchProduct(productId)}
    >
      {/* Contenido del card */}
    </div>
  );
};

// ✅ Prefetch de datos relacionados
const useProductWithRelated = (productId: number) => {
  const { data: product } = useProduct(productId);
  const prefetchProducts = usePrefetchProductsByCategory();
  
  // Prefetch productos de la misma categoría
  useEffect(() => {
    if (product?.id_categoria) {
      prefetchProducts(product.id_categoria);
    }
  }, [product?.id_categoria, prefetchProducts]);
  
  return { product };
};
```

---

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Token No Se Actualiza Automáticamente

**Síntoma**: Error 401 constante a pesar de tener refresh token

**Solución**:
```typescript
// Verificar que el interceptor esté configurado correctamente
// y que refreshToken() esté importado dinámicamente
const { refreshToken } = await import('@/services/auth.service');
```

#### 2. Cache No Se Invalida

**Síntoma**: Datos obsoletos después de mutaciones

**Solución**:
```typescript
// Usar claves de query consistentes
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
  queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(productId) });
}
```

#### 3. Múltiples Requests Simultáneos

**Síntoma**: Muchas llamadas API duplicadas

**Solución**:
```typescript
// Configurar staleTime adecuadamente
const useData = () => useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  staleTime: 5 * 60 * 1000, // Evita requests por 5 minutos
});
```

#### 4. Error en Actualización Optimista

**Síntoma**: UI inconsistente después de errores

**Solución**:
```typescript
// Siempre incluir onError para revertir cambios
onError: (error, variables, context) => {
  if (context?.previousData) {
    queryClient.setQueryData(queryKey, context.previousData);
  }
  toast.error('Error al actualizar');
}
```

### Debugging Tips

#### 1. React Query DevTools

```typescript
// Habilitar en desarrollo
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

#### 2. Logging de Requests

```typescript
// En apiWrapper.ts
instance.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
  }
  return config;
});
```

#### 3. Verificación de Cache

```typescript
// En cualquier componente
const queryClient = useQueryClient();

const debugCache = () => {
  console.log('Cache state:', queryClient.getQueryCache().getAll());
};
```

---

## 🎯 Conclusión

Esta arquitectura proporciona:

- **🔒 Seguridad**: Manejo automático de autenticación
- **⚡ Performance**: Cache inteligente y actualizaciones optimistas  
- **🛠️ Mantenibilidad**: Separación clara de responsabilidades
- **🎨 UX**: Interfaz reactiva con estado consistente
- **📈 Escalabilidad**: Fácil agregar nuevos dominios

La combinación de **ApiWrapper + Services + Hooks + React Query** crea una base sólida para cualquier aplicación que consuma APIs RESTful.

---

**Documentación actualizada**: Junio 17 de 2025  
**Versión**: 1.0.0 