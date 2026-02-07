# AI Agent Skills

This directory contains **Agent Skills** following the [Agent Skills open standard](https://agentskills.io). Skills provide domain-specific patterns, conventions, and guardrails that help AI coding assistants (Claude Code, OpenCode, Cursor, etc.) understand project-specific requirements.

## What Are Skills?

[Agent Skills](https://agentskills.io) is an open standard format for extending AI agent capabilities with specialized knowledge. Originally developed by Anthropic and released as an open standard, it is now adopted by multiple agent products.

Skills teach AI assistants how to perform specific tasks. When an AI loads a skill, it gains context about:

- Critical rules (what to always/never do)
- Code patterns and conventions
- Project-specific workflows
- References to detailed documentation

## Setup

**Important for Collaborators**: Each developer must run the setup script on their local machine. The symlinks created are local and not versioned in git.

### Project-Level Skills (Required)

Run the setup script to configure skills. It will **auto-detect** installed AI assistants:

```bash
./skills/setup.sh
```

The script automatically detects:
- **Cursor** (if `cursor` command exists or `.cursor` directory found)
- **Claude Code** (if `.claude` directory found)
- **Codex** (if `.codex` directory found)
- **Gemini CLI** (if `.gemini` directory found)
- **GitHub Copilot** (if `gh` CLI is installed)

You can also manually specify agents:

```bash
./skills/setup.sh --cursor --claude    # Specific agents
./skills/setup.sh --all                # All agents
./skills/setup.sh --no-auto            # Interactive mode (disable auto-detection)
```

This creates symlinks so each tool finds skills in its expected location:

| Tool | Symlink Created |
|------|-----------------|
| Claude Code / OpenCode | `.claude/skills/` |
| Codex (OpenAI) | `.codex/skills/` |
| GitHub Copilot | `.github/skills/` |
| Gemini CLI | `.gemini/skills/` |
| Cursor | `.cursor/skills/` |

After running setup, restart your AI coding assistant to load the skills.

### Global Skills (Optional)

You can also install Vercel's React Best Practices globally for additional performance guidelines:

```bash
npx add-skill vercel-labs/agent-skills --skill vercel-react-best-practices --skill web-design-guidelines
```

**Note**: This installs skills globally (`~/.cursor/skills/`) and they will be available across all projects. Our project-specific skills (`react-performance`) complement these global skills.

## How to Use Skills

Skills are automatically discovered by the AI agent. To manually load a skill during a session:

```
Read skills/{skill-name}/SKILL.md
```

## Available Skills

### Generic Skills

Reusable patterns for common technologies:

| Skill | Description |
|-------|-------------|
| `typescript` | Const types, flat interfaces, utility types |
| `react-19` | React 19 patterns, hooks, components |
| `react-performance` | React/Next.js performance optimization (Vercel best practices) |
| `nextjs-15` | App Router, Server Actions, streaming |
| `tailwind-4` | cn() utility, Tailwind 4 patterns |
| `pytest` | Fixtures, mocking, markers |
| `fastapi` | FastAPI patterns, routers, dependencies |

### Revital-Specific Skills

Patterns tailored for Revital development:

| Skill | Description |
|-------|-------------|
| `revital` | Project overview, component navigation |
| `revital-ecommerce` | E-commerce instance patterns |
| `revital-panel` | SaaS panel patterns |
| `revital-ecommerce-backend` | FastAPI backend for e-commerce |
| `revital-ecommerce-frontend` | Next.js frontend for e-commerce |
| `revital-panel-backend` | FastAPI backend for SaaS panel |
| `revital-panel-frontend` | Next.js frontend for SaaS panel |

## Directory Structure

```
skills/
├── {skill-name}/
│   ├── SKILL.md              # Required - main instruction and metadata
│   ├── scripts/              # Optional - executable code
│   ├── assets/               # Optional - templates, schemas, resources
│   └── references/           # Optional - links to local docs
└── README.md                 # This file
```

## Why Auto-invoke Sections?

**Problem**: AI assistants (Claude, Gemini, Cursor, etc.) don't reliably auto-invoke skills even when the `Trigger:` in the skill description matches the user's request. They treat skill suggestions as "background noise" and barrel ahead with their default approach.

**Solution**: The `AGENTS.md` files contain an **Auto-invoke Skills** section that explicitly commands the AI: "When performing X action, ALWAYS invoke Y skill FIRST." This forces the AI to load skills.

## Creating New Skills

### Quick Checklist

1. Create directory: `skills/{skill-name}/`
2. Add `SKILL.md` with required frontmatter
3. Add `metadata.scope` and `metadata.auto_invoke` fields
4. Keep content concise (under 500 lines)
5. Reference existing docs instead of duplicating
6. Add to `AGENTS.md` skills table and auto-invoke section

## Design Principles

- **Concise**: Only include what AI doesn't already know
- **Progressive disclosure**: Point to detailed docs, don't duplicate
- **Critical rules first**: Lead with ALWAYS/NEVER patterns
- **Minimal examples**: Show patterns, not tutorials

## Resources

- [Agent Skills Standard](https://agentskills.io) - Open standard specification
- [Agent Skills GitHub](https://github.com/anthropics/skills) - Example skills
- [Revital AGENTS.md](../AGENTS.md) - AI agent general rules
