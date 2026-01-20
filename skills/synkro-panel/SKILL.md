---
name: synkro-panel
description: >
  SaaS panel application patterns. Manages instances, clients, plans, subscriptions, billing.
  Trigger: When working on SaaS management features, instances, subscriptions, billing.
license: MIT
metadata:
  author: synkro
  version: "1.0"
  scope: [synkro_panel]
  auto_invoke: "Working on SaaS panel features"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Overview

`synkro_panel` is the **central SaaS management application** that:
- Manages all client instances
- Handles subscriptions and billing
- Provides landing page for marketing
- Allows clients to manage their instance

## Structure

```
synkro_panel/
├── backend/          # FastAPI - SaaS API
├── frontend/         # Next.js 15 - Landing + Panel
└── db/              # PostgreSQL schema (centralized)
```

## Backend (FastAPI)

**Location**: `synkro_panel/backend/`

**Key Features**:
- Client management (companies)
- Instance management (create, configure, monitor)
- Plans (Starter, Business, Enterprise)
- Subscriptions
- Billing and recurring payments
- Domain management
- Resource usage monitoring
- Plan history
- Rate limiting and security

**Patterns**:
- FastAPI routers in `app/routers/`
- Pydantic schemas in `app/schemas/`
- Services in `app/services/`
- Middleware for auth/security in `app/middlewares/`

## Frontend (Next.js 15)

**Location**: `synkro_panel/frontend/`

**Key Features**:
- Landing page (hero, features, plans, FAQ, contact)
- Client panel (dashboard, subscription, billing, domain, resources, settings)
- Authentication (login/register)

**Patterns**:
- App Router structure
- Landing page: `app/page.tsx`
- Dashboard: `app/(dashboard)/`
- Components in `components/`
- Services in `services/` (API calls)
- Types in `types/`

## Database

**Location**: `synkro_panel/db/`

- Schema: `db_synkrosaas.sql`
- Functions: `Functions/` (per table)
- Triggers: `triggers/`

**Note**: This is a **centralized database** storing metadata about all instances, NOT instance data.

## Rules

**ALWAYS**:
- Keep panel code independent from `synkro_ecommerce`
- Store only metadata about instances, not instance data
- Act as logical orchestrator, not technical

**NEVER**:
- Access instance databases directly
- Duplicate e-commerce logic
- Contain store/shop functionality

## Related Skills

- `synkro-panel-backend` - FastAPI patterns
- `synkro-panel-frontend` - Next.js patterns
- `fastapi` - FastAPI general patterns
- `nextjs-15` - Next.js 15 patterns
