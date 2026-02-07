---
name: nextjs-15
description: >
  Next.js 15 App Router patterns, Server Actions, and streaming.
  Trigger: When creating/modifying Next.js pages, routes, or using App Router features.
license: MIT
metadata:
  author: revital
  version: "1.0"
  scope: [root]
  auto_invoke: "Creating/modifying Next.js pages/routes"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## App Router Patterns

```typescript
// ✅ ALWAYS: Use App Router (not Pages Router)
// app/products/page.tsx
export default async function ProductsPage() {
  // Server component by default
  const products = await fetchProducts()
  return <ProductsList products={products} />
}

// ✅ ALWAYS: Use 'use client' only when needed
'use client'
export function AddToCartButton({ productId }: { productId: string }) {
  // Client component for interactivity
  return <button onClick={() => addToCart(productId)}>Add to Cart</button>
}
```

## Server Actions

```typescript
// ✅ ALWAYS: Use Server Actions for mutations
'use server'
export async function addToCart(productId: string) {
  // Server-side mutation
  await cartService.add(productId)
}

// ✅ ALWAYS: Use in client components
'use client'
import { addToCart } from '@/app/actions'

export function AddToCartButton({ productId }: { productId: string }) {
  return <button onClick={() => addToCart(productId)}>Add to Cart</button>
}
```

## Route Patterns

```typescript
// ✅ ALWAYS: Use route groups for organization
// app/(shop)/products/page.tsx
// app/(dashboard)/admin/page.tsx

// ✅ ALWAYS: Use dynamic routes
// app/products/[id]/page.tsx
export default async function ProductPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const product = await fetchProduct(params.id)
  return <ProductDetail product={product} />
}
```

## Rules

**ALWAYS**:
- Use App Router structure
- Server components by default
- Use 'use client' only when needed
- Use Server Actions for mutations

**NEVER**:
- Use Pages Router
- Mix server/client incorrectly
- Skip TypeScript types
- Put business logic in components
