---
name: revital
description: >
  Main entry point for Revital development - quick reference for all components.
  Trigger: General Revital development questions, project overview, component navigation.
license: MIT
metadata:
  author: revital
  version: "1.0"
  scope: [root]
  auto_invoke: "General Revital development questions"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Components

| Component | Stack | Location |
|-----------|-------|----------|
| E-commerce Backend | FastAPI, Python 3.13+, PostgreSQL | `revital_ecommerce/backend/` |
| E-commerce Frontend | Next.js 15, React 19, Tailwind 4 | `revital_ecommerce/frontend/` |
| Panel Backend | FastAPI, Python 3.13+, PostgreSQL | `revital_panel/backend/` |
| Panel Frontend | Next.js 15, React 19, Tailwind 4 | `revital_panel/frontend/` |

## Architecture Principles

**CRITICAL**: Revital uses **isolated instances**, NOT multi-tenant:

- Each client gets a **complete separate deployment** of `revital_ecommerce`
- Each instance has its **own PostgreSQL database**
- `revital_panel` manages metadata about instances, NOT shared data
- **NO cross-references** between e-commerce and panel codebases
- **NO monorepo tools** - each app is independent

## Quick Commands

```bash
# E-commerce Backend
cd revital_ecommerce/backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
fastapi dev app/main.py

# E-commerce Frontend
cd revital_ecommerce/frontend
pnpm install
pnpm dev

# Panel Backend
cd revital_panel/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
fastapi dev app/main.py

# Panel Frontend
cd revital_panel/frontend
pnpm install
pnpm dev
```

## Database Setup

```bash
# E-commerce DB (per instance)
createdb revital_ecommerce
psql revital_ecommerce < revital_ecommerce/db/db_revital.sql

# Panel DB (centralized)
createdb revital_saas
psql revital_saas < revital_panel/db/db_revitalsaas.sql
```

## Commit Style

Conventional commits: `<type>[scope]: <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

**Scopes:** `ecommerce`, `panel`, `ecommerce-backend`, `ecommerce-frontend`, `panel-backend`, `panel-frontend`

## Related Skills

- `revital-ecommerce` - E-commerce instance patterns
- `revital-panel` - SaaS panel patterns
- `revital-ecommerce-backend` - FastAPI backend for e-commerce
- `revital-ecommerce-frontend` - Next.js frontend for e-commerce
- `revital-panel-backend` - FastAPI backend for SaaS panel
- `revital-panel-frontend` - Next.js frontend for SaaS panel

## Resources

- **Main README**: [../README.md](../../README.md)
- **E-commerce Backend**: [../../revital_ecommerce/backend/README.md](../../revital_ecommerce/backend/README.md)
- **E-commerce Frontend**: [../../revital_ecommerce/frontend/README.md](../../revital_ecommerce/frontend/README.md)
- **Panel Backend**: [../../revital_panel/backend/README.md](../../revital_panel/backend/README.md)
- **Panel Frontend**: [../../revital_panel/frontend/README.md](../../revital_panel/frontend/README.md)
