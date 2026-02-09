---
name: tailwind-4
description: >
  Tailwind CSS patterns and utility usage.
  Trigger: When working with Tailwind classes or styling components.
license: MIT
metadata:
  author: revital
  version: "1.0"
  scope: [root]
  auto_invoke: "Working with Tailwind classes"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Utility Patterns

```typescript
// ✅ ALWAYS: Use cn() utility for conditional classes
import { cn } from '@/lib/utils'

export function Button({ 
  variant, 
  className 
}: { 
  variant: 'primary' | 'secondary'
  className?: string 
}) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800',
        className
      )}
    >
      Button
    </button>
  )
}
```

## Class Patterns

```typescript
// ✅ ALWAYS: Use Tailwind utilities
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow">
  {/* Content */}
</div>

// ✅ ALWAYS: Use responsive utilities
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

## Rules

**ALWAYS**:
- Use `cn()` for conditional classes
- Use Tailwind utilities directly
- Use responsive utilities (sm:, md:, lg:)
- Keep classes readable

**NEVER**:
- Use inline styles
- Use CSS modules unnecessarily
- Mix Tailwind with custom CSS unnecessarily
