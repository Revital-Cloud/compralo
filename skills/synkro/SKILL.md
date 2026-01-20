---
name: synkro
description: >
  Main entry point for Synkro development - quick reference for all components.
  Trigger: General Synkro development questions, project overview, component navigation.
license: MIT
metadata:
  author: synkro
  version: "1.0"
  scope: [root]
  auto_invoke: "General Synkro development questions"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Components

| Component | Stack | Location |
|-----------|-------|----------|
| E-commerce Backend | FastAPI, Python 3.13+, PostgreSQL | `synkro_ecommerce/backend/` |
| E-commerce Frontend | Next.js 15, React 19, Tailwind 4 | `synkro_ecommerce/frontend/` |
| Panel Backend | FastAPI, Python 3.13+, PostgreSQL | `synkro_panel/backend/` |
| Panel Frontend | Next.js 15, React 19, Tailwind 4 | `synkro_panel/frontend/` |

## Architecture Principles

**CRITICAL**: Synkro uses **isolated instances**, NOT multi-tenant:

- Each client gets a **complete separate deployment** of `synkro_ecommerce`
- Each instance has its **own PostgreSQL database**
- `synkro_panel` manages metadata about instances, NOT shared data
- **NO cross-references** between e-commerce and panel codebases
- **NO monorepo tools** - each app is independent

## Quick Commands

```bash
# E-commerce Backend
cd synkro_ecommerce/backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
fastapi dev app/main.py

# E-commerce Frontend
cd synkro_ecommerce/frontend
pnpm install
pnpm dev

# Panel Backend
cd synkro_panel/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
fastapi dev app/main.py

# Panel Frontend
cd synkro_panel/frontend
pnpm install
pnpm dev
```

## Database Setup

```bash
# E-commerce DB (per instance)
createdb synkro_ecommerce
psql synkro_ecommerce < synkro_ecommerce/db/db_synkro.sql

# Panel DB (centralized)
createdb synkro_saas
psql synkro_saas < synkro_panel/db/db_synkrosaas.sql
```

## Commit Style

Conventional commits: `<type>[scope]: <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

**Scopes:** `ecommerce`, `panel`, `ecommerce-backend`, `ecommerce-frontend`, `panel-backend`, `panel-frontend`

## Related Skills

- `synkro-ecommerce` - E-commerce instance patterns
- `synkro-panel` - SaaS panel patterns
- `synkro-ecommerce-backend` - FastAPI backend for e-commerce
- `synkro-ecommerce-frontend` - Next.js frontend for e-commerce
- `synkro-panel-backend` - FastAPI backend for SaaS panel
- `synkro-panel-frontend` - Next.js frontend for SaaS panel

## Resources

- **Main README**: [../README.md](../../README.md)
- **E-commerce Backend**: [../../synkro_ecommerce/backend/README.md](../../synkro_ecommerce/backend/README.md)
- **E-commerce Frontend**: [../../synkro_ecommerce/frontend/README.md](../../synkro_ecommerce/frontend/README.md)
- **Panel Backend**: [../../synkro_panel/backend/README.md](../../synkro_panel/backend/README.md)
- **Panel Frontend**: [../../synkro_panel/frontend/README.md](../../synkro_panel/frontend/README.md)
