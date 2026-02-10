---
name: react-performance
description: >
  React and Next.js performance optimization guidelines adapted for Revital.
  Based on Vercel's React Best Practices (40+ rules). Trigger: When writing, reviewing, or refactoring React/Next.js code for performance.
license: MIT
metadata:
  author: revital
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Writing React components"
    - "Implementing data fetching"
    - "Reviewing code for performance issues"
    - "Optimizing bundle size"
    - "Refactoring React/Next.js code"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Overview

Performance optimization guide for React 19 and Next.js 15, adapted for Revital's architecture. Based on Vercel's React Best Practices with 40+ rules prioritized by impact.

**Note**: If you have `vercel-react-best-practices` installed globally (via `npx add-skill`), both skills will be available. This skill is project-specific and adapted for Revital, while `vercel-react-best-practices` provides the complete 45-rule reference.

**Reference**: [Vercel React Best Practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)

## Priority Order (Apply in This Order)

1. **CRITICAL**: Eliminating Waterfalls
2. **CRITICAL**: Bundle Size Optimization
3. **HIGH**: Server-Side Performance
4. **MEDIUM-HIGH**: Client-Side Data Fetching
5. **MEDIUM**: Re-render Optimization
6. **MEDIUM**: Rendering Performance
7. **LOW-MEDIUM**: JavaScript Performance
8. **LOW**: Advanced Patterns

---

## 1. Eliminating Waterfalls (CRITICAL)

**Impact: CRITICAL** - Waterfalls are the #1 performance killer. Each sequential await adds full network latency.

### Defer Await Until Needed

**Impact: HIGH** - Move `await` into branches where actually used.

```typescript
// ❌ INCORRECT: Blocks both branches
async function handleProductRequest(productId: string, skipDetails: boolean) {
  const product = await fetchProduct(productId)
  
  if (skipDetails) {
    return { id: product.id } // Still waited for full product
  }
  
  return product
}

// ✅ CORRECT: Only blocks when needed
async function handleProductRequest(productId: string, skipDetails: boolean) {
  if (skipDetails) {
    return { id: productId } // Returns immediately
  }
  
  const product = await fetchProduct(productId)
  return product
}
```

### Use Promise.all() for Independent Operations

**Impact: CRITICAL** - 2-10× improvement

```typescript
// ❌ INCORRECT: Sequential execution
const products = await fetchProducts()
const categories = await fetchCategories()
const brands = await fetchBrands()

// ✅ CORRECT: Parallel execution
const [products, categories, brands] = await Promise.all([
  fetchProducts(),
  fetchCategories(),
  fetchBrands()
])
```

### Strategic Suspense Boundaries (Next.js 15)

**Impact: HIGH** - Faster initial paint

```typescript
// ❌ INCORRECT: Entire page blocked
async function ProductPage() {
  const product = await fetchProduct() // Blocks everything
  
  return (
    <div>
      <Header />
      <ProductDetails product={product} />
      <Footer />
    </div>
  )
}

// ✅ CORRECT: Only product section blocked
function ProductPage() {
  return (
    <div>
      <Header />
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails />
      </Suspense>
      <Footer />
    </div>
  )
}

async function ProductDetails() {
  const product = await fetchProduct() // Only blocks this component
  return <div>{product.name}</div>
}
```

---

## 2. Bundle Size Optimization (CRITICAL)

### Avoid Barrel File Imports

**Impact: CRITICAL** - Reduces bundle size significantly

```typescript
// ❌ INCORRECT: Imports entire barrel
import { Button, Card, Input } from '@/components'

// ✅ CORRECT: Direct imports
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
```

### Use Dynamic Imports for Heavy Components

**Impact: HIGH** - Reduces initial bundle

```typescript
// ❌ INCORRECT: Heavy component in main bundle
import { ProductChart } from '@/components/admin/ProductChart'

// ✅ CORRECT: Lazy load heavy components
import dynamic from 'next/dynamic'

const ProductChart = dynamic(
  () => import('@/components/admin/ProductChart'),
  { ssr: false }
)
```

### Defer Non-Critical Third-Party Libraries

**Impact: HIGH** - Load analytics/logging after hydration

```typescript
// ❌ INCORRECT: Blocks hydration
import { track } from '@/lib/analytics'

export function ProductPage() {
  useEffect(() => {
    track('page_view')
  }, [])
}

// ✅ CORRECT: Load after hydration
export function ProductPage() {
  useEffect(() => {
    import('@/lib/analytics').then(({ track }) => {
      track('page_view')
    })
  }, [])
}
```

---

## 3. Server-Side Performance (HIGH)

### Use React.cache() for Per-Request Deduplication

**Impact: HIGH** - Prevents duplicate fetches in same request

```typescript
// ✅ CORRECT: Deduplicates in same request
import { cache } from 'react'

const getProduct = cache(async (id: string) => {
  return fetch(`/api/products/${id}`).then(r => r.json())
})

// Multiple calls in same request = single fetch
async function ProductPage({ id }: { id: string }) {
  const product = await getProduct(id) // First call
  const related = await getProduct(id) // Uses cache
}
```

### Minimize Serialization at RSC Boundaries

**Impact: HIGH** - Only pass necessary data to client components

```typescript
// ❌ INCORRECT: Passes entire object
async function ServerComponent() {
  const product = await fetchProduct()
  return <ClientComponent product={product} />
}

// ✅ CORRECT: Pass only needed fields
async function ServerComponent() {
  const product = await fetchProduct()
  return <ClientComponent 
    id={product.id}
    name={product.name}
    price={product.price}
  />
}
```

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### Use SWR for Automatic Deduplication

**Impact: MEDIUM-HIGH** - Prevents duplicate requests

```typescript
// ❌ INCORRECT: Manual deduplication
const [data, setData] = useState(null)
useEffect(() => {
  fetch('/api/products').then(r => r.json()).then(setData)
}, [])

// ✅ CORRECT: SWR handles deduplication
import useSWR from 'swr'

function ProductList() {
  const { data, error } = useSWR('/api/products', fetcher)
  // Automatically deduplicates requests
}
```

---

## 5. Re-render Optimization (MEDIUM)

### Use Lazy State Initialization

**Impact: MEDIUM** - Avoids expensive work on every render

```typescript
// ❌ INCORRECT: Parses JSON on every render
function Cart() {
  const [items, setItems] = useState(
    JSON.parse(localStorage.getItem('cart') || '[]')
  )
}

// ✅ CORRECT: Parses only once
function Cart() {
  const [items, setItems] = useState(() => {
    return JSON.parse(localStorage.getItem('cart') || '[]')
  })
}
```

### Extract to Memoized Components

**Impact: MEDIUM** - Prevents unnecessary re-renders

```typescript
// ❌ INCORRECT: Re-renders entire list
function ProductList({ products }: { products: Product[] }) {
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <ExpensiveComponent product={product} />
        </div>
      ))}
    </div>
  )
}

// ✅ CORRECT: Memoize expensive component
const MemoizedProductCard = memo(ExpensiveComponent)

function ProductList({ products }: { products: Product[] }) {
  return (
    <div>
      {products.map(product => (
        <MemoizedProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

---

## 6. Rendering Performance (MEDIUM)

### Use content-visibility for Long Lists

**Impact: MEDIUM** - Improves scroll performance

```typescript
// ✅ CORRECT: Only renders visible items
.product-list {
  content-visibility: auto;
  contain-intrinsic-size: 200px;
}
```

### Hoist Static JSX Elements

**Impact: LOW-MEDIUM** - Reduces re-render work

```typescript
// ❌ INCORRECT: Creates new JSX on every render
function ProductCard({ product }: { product: Product }) {
  return (
    <div>
      <div className="static-header">Header</div>
      <div>{product.name}</div>
    </div>
  )
}

// ✅ CORRECT: Hoist static elements
const STATIC_HEADER = <div className="static-header">Header</div>

function ProductCard({ product }: { product: Product }) {
  return (
    <div>
      {STATIC_HEADER}
      <div>{product.name}</div>
    </div>
  )
}
```

---

## Revital-Specific Patterns

### E-commerce Frontend

```typescript
// ✅ CORRECT: Parallel data fetching for product page
async function ProductPage({ id }: { id: string }) {
  const [product, related, reviews] = await Promise.all([
    fetchProduct(id),
    fetchRelatedProducts(id),
    fetchReviews(id)
  ])
  
  return (
    <div>
      <ProductDetails product={product} />
      <RelatedProducts products={related} />
      <Reviews reviews={reviews} />
    </div>
  )
}
```

### Panel Frontend

```typescript
// ✅ CORRECT: Lazy load dashboard charts
const InstanceChart = dynamic(
  () => import('@/components/dashboard/InstanceChart'),
  { loading: () => <ChartSkeleton /> }
)
```

---

## Rules Summary

**ALWAYS**:
- Use `Promise.all()` for independent async operations
- Defer `await` until actually needed
- Use Suspense boundaries strategically
- Import directly, avoid barrel files
- Use dynamic imports for heavy components
- Use `React.cache()` for server-side deduplication
- Minimize data passed to client components

**NEVER**:
- Create sequential waterfalls
- Import entire barrel files
- Block entire pages for single data fetches
- Pass unnecessary data to client components
- Parse expensive data on every render

---

## Resources

- **Vercel React Best Practices**: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
- **Next.js 15 Docs**: https://nextjs.org/docs
- **React 19 Docs**: https://react.dev
