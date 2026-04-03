---
name: revital-ecommerce
description: >
  E-commerce instance application patterns. This is the application deployed per client.
  Trigger: When working on e-commerce features, products, cart, orders, payments.
license: MIT
metadata:
  author: revital
  version: "1.0"
  scope: [revital_ecommerce]
  auto_invoke: "Working on e-commerce instance features"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Overview

`revital_ecommerce` is the **e-commerce application deployed once per client**. Each client gets:
- Complete separate deployment
- Own PostgreSQL database
- Own domain and configuration
- Complete isolation from other clients

## Structure

```
revital_ecommerce/
├── backend/          # FastAPI - API REST
├── frontend/         # Next.js 15 - Store + Admin Dashboard
└── db/              # PostgreSQL schema and functions
```

## Backend (FastAPI)

**Location**: `revital_ecommerce/backend/`

**Key Features**:
- JWT authentication (Admin, Employee, Customer roles)
- Products management (24+ endpoints)
- Cart and orders
- Payments (Wompi integration)
- Categories → Lines → Sublines hierarchy
- Brands and suppliers
- Discounts and loyalty points
- Inventory and stock movements
- Emails (Resend)
- Analytics and KPIs

**Patterns**:
- FastAPI routers in `app/routers/`
- Pydantic schemas in `app/schemas/`
- Services in `app/services/`
- Middleware for auth/roles in `app/middlewares/`

## Frontend (Next.js 15)

**Location**: `revital_ecommerce/frontend/`

**Key Features**:
- Public store (catalog, filters, cart, checkout)
- Admin dashboard (products, orders, analytics)
- User profile and favorites
- Dark mode support
- Cookie compliance (GDPR)

**Patterns**:
- App Router structure
- Components in `components/`
- Services in `services/` (API calls)
- Stores in `stores/` (Zustand)
- Types in `types/`

## Database

**Location**: `revital_ecommerce/db/`

- Schema: `db_revital.sql`
- Functions: `Functions/` (per table)
- Triggers: `triggers/`
- Views: `views/`

## Rules

**ALWAYS**:
- No references to SaaS concepts (plans, billing, subscriptions)
- Everything is local to the instance

**NEVER**:
- Share database with other instances
- Assume multi-tenant architecture

## Related Skills

- `revital-ecommerce-backend` - FastAPI patterns
- `revital-ecommerce-frontend` - Next.js patterns
- `fastapi` - FastAPI general patterns
- `nextjs-15` - Next.js 15 patterns
