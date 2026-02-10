# .agents – AI Agent Skills

**All project skills live under [`.agents/skills/`](skills/)** so that when you add new skills (e.g. from external sources), everything stays in one tree.

Run **`./.agents/setup.sh`** from the repo root to symlink Cursor (and other agents) to `.agents/skills/`.

## What Are Skills?

[Agent Skills](https://agentskills.io) is an open standard for extending AI agents with specialized knowledge. Skills teach assistants critical rules, code patterns, and project workflows.

## Setup

**Important for Collaborators**: Each developer must run the setup script locally. The symlinks are not versioned in git.

From the **repo root**:

```bash
./.agents/setup.sh              # Auto-detects installed AI assistants
./.agents/setup.sh --cursor     # Cursor only
./.agents/setup.sh --all        # All agents
./.agents/setup.sh --no-auto    # Interactive mode
```

This creates symlinks to **`.agents/skills/`**:

| Tool | Symlink |
|------|---------|
| Cursor | `.cursor/skills/` → `.agents/skills/` |
| Claude Code / OpenCode | `.claude/skills/` → `.agents/skills/` |
| Codex (OpenAI) | `.codex/skills/` → `.agents/skills/` |
| Gemini CLI | `.gemini/skills/` → `.agents/skills/` |
| GitHub Copilot | `.github/copilot-instructions.md` (copy of AGENTS.md) |

After running setup, restart your AI assistant to load the skills.

### Optional: Global Skills

```bash
npx add-skill vercel-labs/agent-skills --skill vercel-react-best-practices --skill web-design-guidelines
```

See [SKILLS_INTEGRATION.md](SKILLS_INTEGRATION.md) for details.

## Directory Structure

```
.agents/
├── setup.sh                 # Run from repo root: ./.agents/setup.sh
├── README.md                # This file
├── SKILLS_INTEGRATION.md    # Integration guide
└── skills/                  # All skills (canonical location)
    ├── {skill-name}/
    │   ├── SKILL.md
    │   ├── scripts/         # Optional
    │   ├── assets/          # Optional
    │   └── references/      # Optional
    └── ...
```

## Creating New Skills

1. Create `.agents/skills/{skill-name}/` with a `SKILL.md`.
2. Add to [AGENTS.md](../AGENTS.md) (skills table and auto-invoke section if needed).

## Resources

- [AGENTS.md](../AGENTS.md) – Repository guidelines and skill list
- [Agent Skills Standard](https://agentskills.io)
