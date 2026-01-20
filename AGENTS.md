# Repository Guidelines

## How to Use This Guide

- Start here for cross-project norms. Synkro is a multi-project repository with two main applications.
- Each component may have component-specific guidelines (e.g., `synkro_ecommerce/backend/AGENTS.md`, `synkro_panel/frontend/AGENTS.md`).
- Component docs override this file when guidance conflicts.

## Setup for Collaborators

**Important**: Each collaborator must run the setup script on their local machine. The script **auto-detects** installed AI assistants:

```bash
./skills/setup.sh  # Auto-detects and configures installed agents
```

Or specify manually:

```bash
./skills/setup.sh --cursor --claude  # Specific agents
./skills/setup.sh --all               # All agents
./skills/setup.sh --no-auto           # Interactive mode
```

The symlinks created are local to each developer and are not versioned in git. After running setup, restart your AI assistant to load the skills.

### Optional: Global Skills

You can also install Vercel's React Best Practices globally (recommended):

```bash
npx add-skill vercel-labs/agent-skills
```

This installs skills globally (`~/.cursor/skills/`) that complement our project-specific skills. See [skills/SKILLS_INTEGRATION.md](./skills/SKILLS_INTEGRATION.md) for details.

## Available Skills

Use these skills for detailed patterns on-demand:

### Generic Skills (Any Project)
| Skill | Description | URL |
|-------|-------------|-----|
| `typescript` | Const types, flat interfaces, utility types | [SKILL.md](skills/typescript/SKILL.md) |
| `react-19` | React 19 patterns, hooks, components | [SKILL.md](skills/react-19/SKILL.md) |
| `react-performance` | React/Next.js performance optimization (Vercel best practices) | [SKILL.md](skills/react-performance/SKILL.md) |
| `nextjs-15` | App Router, Server Actions, streaming | [SKILL.md](skills/nextjs-15/SKILL.md) |
| `tailwind-4` | cn() utility, Tailwind patterns | [SKILL.md](skills/tailwind-4/SKILL.md) |
| `pytest` | Fixtures, mocking, markers, parametrize | [SKILL.md](skills/pytest/SKILL.md) |
| `fastapi` | FastAPI patterns, routers, dependencies | [SKILL.md](skills/fastapi/SKILL.md) |

### Synkro-Specific Skills
| Skill | Description | URL |
|-------|-------------|-----|
| `synkro` | Project overview, component navigation | [SKILL.md](skills/synkro/SKILL.md) |
| `synkro-ecommerce` | E-commerce instance patterns | [SKILL.md](skills/synkro-ecommerce/SKILL.md) |
| `synkro-panel` | SaaS panel patterns | [SKILL.md](skills/synkro-panel/SKILL.md) |
| `synkro-ecommerce-backend` | FastAPI backend for e-commerce | [SKILL.md](skills/synkro-ecommerce-backend/SKILL.md) |
| `synkro-ecommerce-frontend` | Next.js frontend for e-commerce | [SKILL.md](skills/synkro-ecommerce-frontend/SKILL.md) |
| `synkro-panel-backend` | FastAPI backend for SaaS panel | [SKILL.md](skills/synkro-panel-backend/SKILL.md) |
| `synkro-panel-frontend` | Next.js frontend for SaaS panel | [SKILL.md](skills/synkro-panel-frontend/SKILL.md) |

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| General Synkro development questions | `synkro` |
| Working on e-commerce instance features | `synkro-ecommerce` |
| Working on SaaS panel features | `synkro-panel` |
| Creating/modifying FastAPI routers | `fastapi` |
| Creating/modifying FastAPI routers in e-commerce | `synkro-ecommerce-backend` |
| Creating/modifying FastAPI routers in panel | `synkro-panel-backend` |
| Creating/modifying React components | `react-19` |
| Optimizing React/Next.js performance | `react-performance` |
| Implementing data fetching | `react-performance` |
| Reviewing code for performance issues | `react-performance` |
| Creating/modifying Next.js pages/routes | `nextjs-15` |
| Creating/modifying Next.js components in e-commerce | `synkro-ecommerce-frontend` |
| Creating/modifying Next.js components in panel | `synkro-panel-frontend` |
| Writing TypeScript types/interfaces | `typescript` |
| Working with Tailwind classes | `tailwind-4` |
| Writing Python tests with pytest | `pytest` |
| Understanding project architecture | `synkro` |
| Create a PR with gh pr create | `synkro-pr` |
| Review PR requirements: template, title conventions | `synkro-pr` |
| Fill .github/pull_request_template.md | `synkro-pr` |

---

## Project Overview

Synkro is a SaaS e-commerce platform based on completely isolated instances. Each client gets their own complete application, database, and deployment.

| Component | Location | Tech Stack |
|-----------|----------|------------|
| E-commerce Backend | `synkro_ecommerce/backend/` | FastAPI, Python 3.13+, PostgreSQL |
| E-commerce Frontend | `synkro_ecommerce/frontend/` | Next.js 15, React 19, Tailwind 4 |
| Panel Backend | `synkro_panel/backend/` | FastAPI, Python 3.13+, PostgreSQL |
| Panel Frontend | `synkro_panel/frontend/` | Next.js 15, React 19, Tailwind 4 |

---

## Python Development

```bash
# Setup (for each backend)
cd synkro_ecommerce/backend  # or synkro_panel/backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Run
fastapi dev app/main.py
```

---

## Frontend Development

```bash
# Setup (for each frontend)
cd synkro_ecommerce/frontend  # or synkro_panel/frontend
pnpm install

# Run
pnpm dev
```

---

## Commit & Pull Request Guidelines

Follow conventional-commit style: `<type>[scope]: <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

**Scopes:** `ecommerce`, `panel`, `ecommerce-backend`, `ecommerce-frontend`, `panel-backend`, `panel-frontend`

Before creating a PR:
1. Run all relevant tests and linters
2. Ensure both applications work independently
3. Link screenshots for UI changes
4. Update documentation if needed

---

## Architecture Principles

- **Independence**: Each application (`synkro_ecommerce` and `synkro_panel`) is completely independent
- **No Monorepo Tools**: No workspaces, Turborepo, or shared dependencies
- **Separate Databases**: Each instance has its own PostgreSQL database
- **Isolation**: No cross-references between e-commerce and panel codebases
- **Instance-based**: Each client gets a dedicated deployment of `synkro_ecommerce`

---

## Resources

- [Main README](./README.md) - Complete project documentation
- [E-commerce Backend README](./synkro_ecommerce/backend/README.md)
- [E-commerce Frontend README](./synkro_ecommerce/frontend/README.md)
- [Panel Backend README](./synkro_panel/backend/README.md)
- [Panel Frontend README](./synkro_panel/frontend/README.md)
