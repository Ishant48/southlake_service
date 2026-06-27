# Linting & Code Quality Setup

## Overview

The project uses a full code quality pipeline: ESLint (TypeScript-aware), Prettier, Husky Git hooks, lint-staged, and Commitlint for conventional commits.

---

## Tools

| Tool | Config File | Purpose |
|------|------------|---------|
| ESLint | `eslint.config.mjs` | Static analysis + TypeScript rules |
| Prettier | `.prettierrc` | Code formatting |
| Husky | `.husky/` | Git hook runner |
| lint-staged | `lint-staged.config.js` | Run linting only on staged files |
| Commitlint | `commitlint.config.js` | Enforce conventional commit messages |

---

## ESLint

**Config:** `eslint.config.mjs` (ESLint flat config — no `.eslintrc`)

Key rules:
- TypeScript-aware via `typescript-eslint`
- Prettier integration (`eslint-plugin-prettier`)
- `no-explicit-any` warnings (relaxed in test files)
- `no-unused-vars` as errors (relaxed in test files)
- Test file override block: relaxed `no-console`, `no-explicit-any`

```bash
npm run lint          # check (max-warnings 0 = fail on any warning)
npm run lint:fix      # auto-fix
```

---

## Prettier

**Config:** `.prettierrc`

```bash
npm run format         # format src/**/*.ts
npm run format:check   # check without writing
```

---

## Husky Hooks

### Pre-commit (`.husky/pre-commit`)

Runs on every `git commit`:
1. `lint-staged` — lint + format only staged files
2. `npm run type-check` — full TypeScript compilation check

If either fails, the commit is blocked.

### Commit-msg (`.husky/commit-msg`)

Runs `commitlint` against the commit message.  
Rejects commits that do not follow the conventional commits format.

---

## Conventional Commits

**Config:** `commitlint.config.js`

Format: `<type>(<scope>): <subject>`

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change without feature/fix |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Build, tooling, config changes |
| `ci` | CI/CD pipeline changes |

**Examples:**
```
feat(auth): add OTP rate limiting
fix(users): resolve pagination off-by-one error
refactor(roles): move entities into module folder
docs: add rate limiting documentation
test(auth): add e2e tests for login flow
```

**Rules:**
- `type-enum` — only the types listed above
- `subject-case: lower-case`
- `header-max-length: 100`

---

## lint-staged

**Config:** `lint-staged.config.js`

```javascript
{
  '*.ts': ['eslint --fix --max-warnings 0', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
}
```

Only files staged for the commit are processed — making commits fast even in large projects.

---

## Scripts

```bash
npm run lint          # Full ESLint check
npm run lint:fix      # Auto-fix ESLint issues
npm run format        # Prettier format
npm run format:check  # Prettier check (CI)
npm run type-check    # tsc --noEmit
```

---

## IDE Integration (VS Code)

Install extensions:
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)

Recommended settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Testing Guide](./TESTING.md)
