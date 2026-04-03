---
name: revital-ecommerce-frontend
description: >
  Next.js 15 frontend patterns for e-commerce instance.
  Trigger: When creating/modifying Next.js pages, components, services in revital_ecommerce/frontend.
license: MIT
metadata:
  author: revital
  version: "1.0"
  scope: [revital_ecommerce/frontend]
  auto_invoke: "Creating/modifying Next.js components in e-commerce"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Structure

```
revital_ecommerce/frontend/
├── app/
│   ├── (auth)/          # Login, register, password recovery
│   ├── (shop)/          # Catalog, products, cart, checkout
│   └── (dashboard)/     # Admin dashboard
├── components/
│   ├── ui/              # shadcn/ui components
│   └── ...              # Feature components
├── hooks/               # Custom React hooks
├── services/            # API services
├── stores/              # Zustand stores
├── types/               # TypeScript types
├── utils/               # Utilities
└── lib/                 # Config (theme, menu, footer)
```

## App Router Patterns

```typescript
// ✅ ALWAYS: Use App Router structure
// app/(shop)/products/page.tsx
export default async function ProductsPage() {
  // Server component by default
  const products = await fetchProducts()
  return <ProductsList products={products} />
}

// ✅ ALWAYS: Use Server Actions for mutations
'use server'
export async function addToCart(productId: string) {
  // Server action
}
```

## Component Patterns

```typescript
// ✅ ALWAYS: Use TypeScript with proper types
import { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onAddToCart?: (id: string) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}
```

## Service Patterns

```typescript
// ✅ ALWAYS: Centralize API calls in services
// services/product.service.ts
import { api } from '@/utils/api'

export const productService = {
  async getAll(): Promise<Product[]> {
    return api.get('/products')
  },
  
  async getById(id: string): Promise<Product> {
    return api.get(`/products/${id}`)
  }
}
```

## Store Patterns (Zustand)

```typescript
// ✅ ALWAYS: Use Zustand for client state
// stores/cart.store.ts
import { create } from 'zustand'

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  })),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  }))
}))
```

## Rules

**ALWAYS**:
- Use App Router (not Pages Router)
- Server components by default, client when needed
- TypeScript for all components
- shadcn/ui for UI components
- Tailwind for styling

**NEVER**:
- Use Pages Router
- Mix server/client code incorrectly
- Skip TypeScript types

## Related Skills

- `nextjs-15` - Next.js 15 general patterns
- `react-19` - React 19 patterns
- `typescript` - TypeScript patterns
- `tailwind-4` - Tailwind patterns
- `revital-ecommerce` - E-commerce overview
