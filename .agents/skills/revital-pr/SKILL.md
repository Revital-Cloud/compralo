---
name: revital-pr
description: >
  Creates Pull Requests for Revital following the project template and conventions.
  Trigger: When working on pull request requirements or creation (PR template sections, PR title Conventional Commits check), or when inspecting PR-related GitHub workflows.
license: MIT
metadata:
  author: revital
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Create a PR with gh pr create"
    - "Review PR requirements: template, title conventions"
    - "Fill .github/pull_request_template.md (Context/Description/Steps to review/Checklist)"
    - "Understand review ownership"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## PR Creation Process

1. **Analyze changes**: `git diff main...HEAD` to understand ALL commits
2. **Determine affected components**: revital_ecommerce (backend/frontend)
3. **Fill template sections** based on changes
4. **Create PR** with `gh pr create`

## PR Template Structure

```markdown
### Context

{Why this change? Link issues with `Fix #XXXX` or `Closes #XXXX`}

### Description

{Summary of changes and dependencies. Mention which component(s) are affected in revital_ecommerce}

### Steps to review

{How to test/verify the changes. Include:
- Which application(s) to run (ecommerce, panel, or both)
- Test data or setup needed
- Expected behavior
- Screenshots if UI changes}

### Checklist

- [ ] Code follows project conventions (see AGENTS.md)
- [ ] All tests pass locally
- [ ] Linting passes (if applicable)
- [ ] Database migrations are included (if applicable)
- [ ] Environment variables documented (if new ones added)
- [ ] README updated (if needed)

#### revital_ecommerce (if applicable)
- [ ] Backend changes tested locally
- [ ] Frontend changes tested locally
- [ ] API endpoints tested (if modified/added)
- [ ] Database schema changes tested (if applicable)
- [ ] Screenshots included for UI changes (Mobile/Tablet/Desktop)


### License

By submitting this pull request, I confirm that my contribution is made under the terms of the MIT license.
```

## Component-Specific Rules

| Component | Location | Extra Checks |
|-----------|---------|--------------|
| revital_ecommerce/backend | `revital_ecommerce/backend/` | API endpoints tested, DB migrations |
| revital_ecommerce/frontend | `revital_ecommerce/frontend/` | Screenshots Mobile/Tablet/Desktop |

## Commands

```bash
# Check current branch status
git status
git log main..HEAD --oneline

# View full diff
git diff main...HEAD

# View diff for specific component
git diff main...HEAD -- revital_ecommerce/

# Create PR with heredoc for body
gh pr create --title "feat: description" --body "$(cat <<'EOF'
### Context
...
EOF
)"

# Create draft PR
gh pr create --draft --title "feat: description"

# Check which files changed
git diff --name-only main...HEAD
```

## Title Conventions

Follow conventional commits: `<type>[scope]: <description>`

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `chore:` Maintenance
- `refactor:` Code restructure
- `test:` Tests
- `perf:` Performance improvements
- `style:` Code style changes

**Scopes:**
- `ecommerce` - Changes to revital_ecommerce
- `ecommerce-backend` - Backend e-commerce only
- `ecommerce-frontend` - Frontend e-commerce only

**Examples:**
- `feat[ecommerce]: Add product favorites feature`
- `fix[ecommerce-backend]: Fix subscription validation`
- `docs: Update API documentation`
- `refactor[ecommerce-frontend]: Improve cart state management`

## Architecture Rules (CRITICAL)

**ALWAYS verify:**
- ✅ Each application remains independent
- ✅ No shared dependencies introduced
- ✅ Database schemas remain separate

**NEVER:**
- ❌ Share database connections between apps
- ❌ Create monorepo tools or shared packages

## Before Creating PR

1. ✅ All tests pass locally
2. ✅ Both applications work independently (if both affected)
3. ✅ No linting errors
4. ✅ Branch is up to date with main: `git pull origin main`
5. ✅ Commits are clean and follow conventional commits
6. ✅ No cross-references between components
7. ✅ Database migrations tested (if applicable)

## Testing Checklist

### For Backend Changes
```bash
# Test e-commerce backend
cd revital_ecommerce/backend
source venv/bin/activate
pytest
```

### For Frontend Changes
```bash
# Test e-commerce frontend
cd revital_ecommerce/frontend
pnpm run build  # Check for build errors
```

## Resources

- **AGENTS.md**: Project guidelines and conventions
- **README.md**: Complete project documentation
- **Component READMEs**: 
  - `revital_ecommerce/backend/README.md`
  - `revital_ecommerce/frontend/README.md`
