# Skills Integration Guide

## Current Setup

Synkro uses a **hybrid approach** combining project-specific skills and global skills from Vercel.

### Project-Level Skills (`./skills/`)

These are versioned in git and specific to Synkro:

- **15 skills total** including:
  - Synkro-specific skills (7): `synkro`, `synkro-ecommerce`, `synkro-panel`, etc.
  - Generic skills (6): `typescript`, `react-19`, `nextjs-15`, `tailwind-4`, `pytest`, `fastapi`
  - Performance skill (1): `react-performance` (adapted for Synkro)
  - PR skill (1): `synkro-pr`

**Location**: `./.cursor/skills/` (symlink to `./skills/`)

### Global Skills (`~/.cursor/skills/`)

Optional skills installed globally via `npx add-skill`:

- `vercel-react-best-practices` - Complete 45-rule React performance guide
- `web-design-guidelines` - Accessibility and UX guidelines

**Location**: `~/.cursor/skills/` (user-level, not versioned)

## How Cursor Loads Skills

Cursor loads skills from both locations:
1. **Project-level** (`./.cursor/skills/`) - Loaded first, project-specific
2. **Global-level** (`~/.cursor/skills/`) - Loaded second, available across projects

## Skill Overlap: `react-performance` vs `vercel-react-best-practices`

### `react-performance` (Project-specific)
- ✅ Adapted for Synkro's architecture
- ✅ Includes Synkro-specific examples
- ✅ Focused on most critical patterns
- ⚠️ 40+ rules (subset)

### `vercel-react-best-practices` (Global)
- ✅ Complete 45-rule reference
- ✅ More comprehensive coverage
- ✅ Updated by Vercel team
- ⚠️ Generic (not Synkro-specific)

**Recommendation**: Keep both! They complement each other:
- Use `react-performance` for Synkro-specific patterns
- Use `vercel-react-best-practices` for comprehensive reference

## Setup for New Collaborators

### Required: Project Skills

```bash
cd synkro
./skills/setup.sh  # Auto-detects and configures
```

### Optional: Global Skills

```bash
npx add-skill vercel-labs/agent-skills \
  --skill vercel-react-best-practices \
  --skill web-design-guidelines \
  -a cursor
```

## Verifying Installation

```bash
# Check project skills
ls -la .cursor/skills/

# Check global skills
ls -la ~/.cursor/skills/

# Count total skills
find .cursor/skills ~/.cursor/skills -name "SKILL.md" 2>/dev/null | wc -l
```

## Troubleshooting

### Skills Not Loading

1. Restart Cursor after installation
2. Verify symlinks: `ls -la .cursor/skills`
3. Check both locations: project and global

### Duplicate Skills

If you see duplicate skills, Cursor will use both. This is fine - they complement each other.

### Removing Global Skills

```bash
rm -rf ~/.cursor/skills/vercel-react-best-practices
rm -rf ~/.cursor/skills/web-design-guidelines
```

## Best Practices

1. **Project skills** (`./skills/`) - Version in git, required for all collaborators
2. **Global skills** (`~/.cursor/skills/`) - Optional, personal preference
3. **Keep both** - They serve different purposes and complement each other
4. **Document additions** - If adding new global skills, document them here
