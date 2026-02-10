# Repository Guidelines

## How to Use This Guide

- Start here for cross-project norms. Revital is a multi-project repository with two main applications.
- Each component may have component-specific guidelines (e.g., `revital_ecommerce/backend/AGENTS.md`, `revital_panel/frontend/AGENTS.md`).
- Component docs override this file when guidance conflicts.

## Setup for Collaborators

**Important**: Each collaborator must run the setup script on their local machine. The script **auto-detects** installed AI assistants:

```bash
./.agents/setup.sh  # Auto-detects and configures installed agents
```

Or specify manually:

```bash
./.agents/setup.sh --cursor --claude  # Specific agents
./.agents/setup.sh --all               # All agents
./.agents/setup.sh --no-auto           # Interactive mode
```

The symlinks created are local to each developer and are not versioned in git. After running setup, restart your AI assistant to load the skills.

### Optional: Global Skills

You can also install Vercel's React Best Practices globally (recommended):

```bash
npx add-skill vercel-labs/agent-skills
```

This installs skills globally (`~/.cursor/skills/`) that complement our project-specific skills. See [.agents/SKILLS_INTEGRATION.md](./.agents/SKILLS_INTEGRATION.md) for details.

## Available Skills

Use these skills for detailed patterns on-demand:

### Generic Skills (Any Project)
| Skill | Description | URL |
|-------|-------------|-----|
| `typescript` | Const types, flat interfaces, utility types | [SKILL.md](.agents/skills/typescript/SKILL.md) |
| `react-19` | React 19 patterns, hooks, components | [SKILL.md](.agents/skills/react-19/SKILL.md) |
| `react-performance` | React/Next.js performance optimization (Vercel best practices) | [SKILL.md](.agents/skills/react-performance/SKILL.md) |
| `nextjs-15` | App Router, Server Actions, streaming | [SKILL.md](.agents/skills/nextjs-15/SKILL.md) |
| `tailwind-4` | cn() utility, Tailwind patterns | [SKILL.md](.agents/skills/tailwind-4/SKILL.md) |
| `pytest` | Fixtures, mocking, markers, parametrize | [SKILL.md](.agents/skills/pytest/SKILL.md) |
| `fastapi` | FastAPI patterns, routers, dependencies | [SKILL.md](.agents/skills/fastapi/SKILL.md) |
| `performance` | Web performance (Lighthouse, Core Web Vitals, budgets) | [SKILL.md](.agents/skills/performance/SKILL.md) |
| `doc` | DOCX creation/editing, python-docx, layout fidelity | [SKILL.md](.agents/skills/doc/SKILL.md) |
| `pricing-strategy` | Pricing, packaging, tier structure | [SKILL.md](.agents/skills/pricing-strategy/SKILL.md) |
| `security-best-practices` | Backend/frontend security by stack | [SKILL.md](.agents/skills/security-best-practices/SKILL.md) |

### Revital-Specific Skills
| Skill | Description | URL |
|-------|-------------|-----|
| `revital` | Project overview, component navigation | [SKILL.md](.agents/skills/revital/SKILL.md) |
| `revital-ecommerce` | E-commerce instance patterns | [SKILL.md](.agents/skills/revital-ecommerce/SKILL.md) |
| `revital-panel` | SaaS panel patterns | [SKILL.md](.agents/skills/revital-panel/SKILL.md) |
| `revital-ecommerce-backend` | FastAPI backend for e-commerce | [SKILL.md](.agents/skills/revital-ecommerce-backend/SKILL.md) |
| `revital-ecommerce-frontend` | Next.js frontend for e-commerce | [SKILL.md](.agents/skills/revital-ecommerce-frontend/SKILL.md) |
| `revital-panel-backend` | FastAPI backend for SaaS panel | [SKILL.md](.agents/skills/revital-panel-backend/SKILL.md) |
| `revital-panel-frontend` | Next.js frontend for SaaS panel | [SKILL.md](.agents/skills/revital-panel-frontend/SKILL.md) |

### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| General Revital development questions | `revital` |
| Working on e-commerce instance features | `revital-ecommerce` |
| Working on SaaS panel features | `revital-panel` |
| Creating/modifying FastAPI routers | `fastapi` |
| Creating/modifying FastAPI routers in e-commerce | `revital-ecommerce-backend` |
| Creating/modifying FastAPI routers in panel | `revital-panel-backend` |
| Creating/modifying React components | `react-19` |
| Optimizing React/Next.js performance | `react-performance` |
| Implementing data fetching | `react-performance` |
| Reviewing code for performance issues | `react-performance` |
| Creating/modifying Next.js pages/routes | `nextjs-15` |
| Creating/modifying Next.js components in e-commerce | `revital-ecommerce-frontend` |
| Creating/modifying Next.js components in panel | `revital-panel-frontend` |
| Writing TypeScript types/interfaces | `typescript` |
| Working with Tailwind classes | `tailwind-4` |
| Writing Python tests with pytest | `pytest` |
| Understanding project architecture | `revital` |
| Create a PR with gh pr create | `revital-pr` |
| Review PR requirements: template, title conventions | `revital-pr` |
| Fill .github/pull_request_template.md | `revital-pr` |
| Creating/editing DOCX, layout-sensitive docs | `doc` |
| Speed up site, performance audit, Core Web Vitals | `performance` |
| Pricing, tiers, packaging strategy | `pricing-strategy` |
| Security review, auth, input validation, OWASP | `security-best-practices` |

---

## Project Overview

Revital is a SaaS e-commerce platform based on completely isolated instances. Each client gets their own complete application, database, and deployment.

| Component | Location | Tech Stack |
|-----------|----------|------------|
| E-commerce Backend | `revital_ecommerce/backend/` | FastAPI, Python 3.13+, PostgreSQL |
| E-commerce Frontend | `revital_ecommerce/frontend/` | Next.js 15, React 19, Tailwind 4 |
| Panel Backend | `revital_panel/backend/` | FastAPI, Python 3.13+, PostgreSQL |
| Panel Frontend | `revital_panel/frontend/` | Next.js 15, React 19, Tailwind 4 |

---

## Python Development

```bash
# Setup (for each backend)
cd revital_ecommerce/backend  # or revital_panel/backend
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
cd revital_ecommerce/frontend  # or revital_panel/frontend
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

- **Independence**: Each application (`revital_ecommerce` and `revital_panel`) is completely independent
- **No Monorepo Tools**: No workspaces, Turborepo, or shared dependencies
- **Separate Databases**: Each instance has its own PostgreSQL database
- **Isolation**: No cross-references between e-commerce and panel codebases
- **Instance-based**: Each client gets a dedicated deployment of `revital_ecommerce`

---

## Resources

- [Main README](./README.md) - Complete project documentation
- [E-commerce Backend README](./revital_ecommerce/backend/README.md)
- [E-commerce Frontend README](./revital_ecommerce/frontend/README.md)
- [Panel Backend README](./revital_panel/backend/README.md)
- [Panel Frontend README](./revital_panel/frontend/README.md)
