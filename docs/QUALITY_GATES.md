# Quality Gates & CI Requirements

> **Version: 0.9.8** | Last Updated: January 2026

This document defines the mandatory quality gates that must pass before any code can be merged to
`main`. All checks are enforced via CI and pre-commit hooks.

---

## 🚦 Gate Summary

| Gate             | Tool                | Failure Policy        | Owner     |
| ---------------- | ------------------- | --------------------- | --------- |
| TypeScript       | `pnpm typecheck`    | **Block merge**       | @dev-team |
| Linting          | `eslint --fix`      | **Block merge**       | @dev-team |
| Formatting       | `prettier --check`  | **Block merge**       | @dev-team |
| Commit Message   | `commitlint`        | **Block merge**       | @dev-team |
| Dependency Audit | `pnpm audit`        | **Block on critical** | @security |
| Secret Scanning  | `gitleaks`          | **Block merge**       | @security |
| Build            | `turbo run build`   | **Block merge**       | @dev-team |
| Backend Security | `sobelow`           | **Block on high**     | @security |
| **Coverage**     | `vitest --coverage` | **Warn <60%**         | @dev-team |
| **Architecture** | ESLint boundaries   | **Warn**              | @dev-team |

---

## 📋 Pre-Commit Hooks (Enforced Locally)

Via `husky` + `lint-staged`:

```bash
# Runs on every commit
*.{ts,tsx,js,jsx} → eslint --fix → prettier --write
*.{json,md,yml}   → prettier --write
commit message    → commitlint (conventional commits)
```

**Configuration:** [package.json](../package.json) `lint-staged` section

---

## 🔒 CI Pipeline Checks

### Required Checks (Block Merge)

1. **TypeScript Compilation**

   ```bash
   pnpm typecheck
   # Must exit 0 with no errors
   ```

2. **ESLint**

   ```bash
   pnpm lint
   # Must exit 0 with no errors (warnings allowed)
   ```

3. **Prettier**

   ```bash
   pnpm format:check
   # Must exit 0 (all files formatted)
   ```

4. **Build**

   ```bash
   pnpm build
   # All apps must build successfully
   ```

5. **Commit Message**
   ```bash
   # Format: type(scope): subject
   # Example: fix(web): resolve type errors
   # Subject must be lowercase
   ```

### Security Checks (Block on Severity)

1. **Gitleaks** (Secret Scanning)
   - Blocks on any detected secret
   - No exceptions

2. **pnpm audit**
   - Blocks on critical vulnerabilities
   - High vulnerabilities reviewed case-by-case

3. **Sobelow** (Elixir Security)
   - Blocks on high-severity findings
   - Medium findings tracked in issues

4. **Grype** (Container Scanning)
   - Blocks on critical CVEs
   - High CVEs require remediation plan

---

## ⚙️ Configuration Files

| File                             | Purpose                         |
| -------------------------------- | ------------------------------- |
| `eslint.config.js`               | ESLint flat config + arch rules |
| `tsconfig.base.json`             | TypeScript base configuration   |
| `commitlint.config.js`           | Commit message rules            |
| `turbo.json`                     | Build pipeline configuration    |
| `.github/workflows/`             | CI workflow definitions         |
| `.github/workflows/coverage.yml` | Coverage reporting & thresholds |
| `apps/web/vite.config.ts`        | Coverage thresholds (60%)       |

---

## 🏗️ Architectural Boundaries

ESLint enforces layer separation:

```
Components → Hooks → Stores → Services → Lib
     ↓         ↓         ↓         ↓       ↓
   (UI)    (Logic)   (State)   (API)   (Utils)
```

**Rules:**

- Components cannot import stores directly (use hooks)
- Pages cannot import services directly (use hooks)
- Services cannot import from components/pages

See [ARCHITECTURE_ENFORCEMENT.md](ARCHITECTURE_ENFORCEMENT.md) for details.

---

## 🎯 Quality Metrics Targets

### Code Quality

| Metric            | Target    | Current | Enforced |
| ----------------- | --------- | ------- | -------- |
| TypeScript Errors | 0         | ✅ 0    | CI Block |
| ESLint Errors     | 0         | ✅ 0    | CI Block |
| Test Coverage     | ≥60%      | 🔄 TBD  | CI Warn  |
| Bundle Size (web) | <500KB gz | 🔄 TBD  | —        |

### Security

| Metric        | Target | Current | Enforced |
| ------------- | ------ | ------- | -------- |
| Critical CVEs | 0      | ✅ 0    | CI Block |
| High CVEs     | <5     | 🔄 TBD  | Review   |
| Secret Leaks  | 0      | ✅ 0    | CI Block |

### Performance

| Metric | Target | Current | Enforced |
| ------ | ------ | ------- | -------- |
| LCP    | <2.5s  | 🔄 TBD  | —        |
| FID    | <100ms | 🔄 TBD  | —        |
| CLS    | <0.1   | 🔄 TBD  | —        |

### Architecture

| Metric           | Target   | Current | Enforced |
| ---------------- | -------- | ------- | -------- |
| Layer violations | 0 errors | ✅ 0    | ESLint   |
| Circular deps    | 0        | 🔄 TBD  | ESLint   |

---

## 🚨 Bypass Policy

Quality gates may only be bypassed with:

1. **Written approval** from tech lead
2. **Documented reason** in PR description
3. **Tracking issue** for remediation
4. **Time-boxed exception** (max 7 days)

Bypasses are audited monthly.

---

## 📚 Related Documents

- [ENGINEERING_STANDARDS.md](PrivateFolder/ENGINEERING_STANDARDS.md) - Full coding standards
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution workflow
- [SECURITY.md](../SECURITY.md) - Security policy

---

<sub>**CGraph Quality Gates** • Version 0.9.8 • Last updated: January 2026</sub>
