---
name: react-19
description: >
  React 19 patterns, hooks, and component best practices.
  Trigger: When creating/modifying React components, hooks, or using React features.
license: MIT
metadata:
  author: revital
  version: "1.0"
  scope: [root]
  auto_invoke: "Writing React components"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Component Patterns

```typescript
// ✅ ALWAYS: Use function components
export function ProductCard({ product }: { product: Product }) {
  return <div>{product.name}</div>
}

// ✅ ALWAYS: Use TypeScript for props
interface ProductCardProps {
  product: Product
  onAddToCart?: (id: string) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return <div>{product.name}</div>
}
```

## Hooks Patterns

```typescript
// ✅ ALWAYS: Use hooks at top level
export function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const { data, isLoading } = useQuery(['products'], fetchProducts)
  
  useEffect(() => {
    if (data) setProducts(data)
  }, [data])
  
  return <div>{/* ... */}</div>
}

// ✅ ALWAYS: Custom hooks for reusable logic
function useProducts() {
  return useQuery(['products'], fetchProducts)
}
```

## Rules

**ALWAYS**:
- Use function components
- Use TypeScript for props
- Use hooks at top level
- Extract reusable logic to custom hooks

**NEVER**:
- Use class components
- Use `any` for props
- Call hooks conditionally
- Mix concerns in components

## Performance

For performance optimization patterns (waterfalls, bundle size, re-renders), see `react-performance` skill.

**Related Skills**:
- `react-performance` - Performance optimization patterns
- `nextjs-15` - Next.js 15 specific patterns
