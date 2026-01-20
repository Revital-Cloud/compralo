---
name: synkro-panel-frontend
description: >
  Next.js 15 frontend patterns for SaaS panel.
  Trigger: When creating/modifying Next.js pages, components, services in synkro_panel/frontend.
license: MIT
metadata:
  author: synkro
  version: "1.0"
  scope: [synkro_panel/frontend]
  auto_invoke: "Creating/modifying Next.js components in panel"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Structure

```
synkro_panel/frontend/
├── app/
│   ├── page.tsx         # Landing page
│   ├── login/           # Login
│   ├── register/        # Register
│   └── (dashboard)/     # Client panel
│       ├── dashboard/   # Overview
│       ├── instance/     # Instance management
│       ├── subscription/# Subscription management
│       ├── billing/     # Billing
│       └── settings/    # Settings
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── dashboard/       # Dashboard components
│   └── layout/          # Layout components
├── services/            # API services
├── types/               # TypeScript types
└── utils/               # Utilities
```

## Landing Page Patterns

```typescript
// ✅ ALWAYS: Landing page is marketing-focused
// app/page.tsx
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Plans />
      <FAQ />
      <Contact />
    </>
  )
}
```

## Dashboard Patterns

```typescript
// ✅ ALWAYS: Use App Router for dashboard
// app/(dashboard)/dashboard/page.tsx
export default async function DashboardPage() {
  const instance = await fetchInstance()
  return <DashboardOverview instance={instance} />
}
```

## Service Patterns

```typescript
// ✅ ALWAYS: Centralize API calls
// services/instance.service.ts
import { api } from '@/utils/api'

export const instanceService = {
  async getInstance(): Promise<Instance> {
    return api.get('/instances/me')
  },
  
  async updateSubscription(planId: number): Promise<Subscription> {
    return api.post('/subscriptions', { plan_id: planId })
  }
}
```

## Rules

**ALWAYS**:
- Use App Router
- Separate landing page from dashboard
- TypeScript for all components
- shadcn/ui for UI components
- Tailwind for styling

**NEVER**:
- Mix landing and dashboard logic
- Reference `synkro_ecommerce` code
- Skip TypeScript types
- Use Pages Router

## Related Skills

- `nextjs-15` - Next.js 15 general patterns
- `react-19` - React 19 patterns
- `typescript` - TypeScript patterns
- `tailwind-4` - Tailwind patterns
- `synkro-panel` - Panel overview
