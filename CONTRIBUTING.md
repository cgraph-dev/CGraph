# Contributing to CGraph

Thank you for your interest in contributing to CGraph. This document explains our contribution
process and requirements.

## ⚠️ IMPORTANT: Contributor License Agreement Required

**Before submitting any contribution, you MUST agree to our Contributor License Agreement (CLA).**

By submitting a pull request or any other contribution to CGraph, you agree to the terms of the CLA
found at [CLA.md](./CLA.md). In summary:

- You grant CGraph full, irrevocable rights to your contribution
- Your contribution becomes the exclusive property of CGraph
- You retain no rights to use your contribution outside of CGraph
- CGraph may use, modify, license, or sell your contribution without restriction

**If you do not agree to these terms, do not submit any contributions.**

## Proprietary Software Notice

CGraph is **proprietary software**. This is NOT an open-source project. The source code is
confidential and owned exclusively by CGraph.

Access to this repository is provided only to:

- CGraph employees
- Authorized contractors
- Approved partners under NDA

Unauthorized access, copying, or distribution of this software is prohibited and may result in legal
action.

## Code of Conduct

Be professional. Treat others with respect. Any harassment, discrimination, or unprofessional
behavior will result in immediate removal from the project.

## Getting Started (Authorized Contributors Only)

1. Sign the CLA (see [CLA.md](./CLA.md))
2. Clone the repository (requires authorized access)
3. Create a branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Submit a pull request

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Tests
- `chore` - Maintenance

Examples:

```
feat(messaging): add message reactions
fix(auth): resolve token refresh race condition
docs(readme): update installation instructions
```

### Code Style

#### Elixir

- Use `mix format` before committing
- Follow the [Elixir Style Guide](https://github.com/christopheradams/elixir_style_guide)
- Write documentation for public functions

#### TypeScript/JavaScript

- ESLint and Prettier are configured
- Run `pnpm lint` to check for issues
- Run `pnpm format` to auto-fix formatting

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Backend: `cd apps/backend && mix test`
- Frontend: `pnpm test`

#### Test Coverage Requirements

| Package        | Minimum Coverage |
| -------------- | ---------------- |
| packages/core  | 80%              |
| packages/utils | 90%              |
| apps/backend   | 75%              |
| apps/web       | 70%              |
| apps/mobile    | 60%              |

## Code Conventions

### File Naming

| Type       | Convention            | Example                |
| ---------- | --------------------- | ---------------------- |
| Components | PascalCase            | `UserProfile.tsx`      |
| Hooks      | camelCase with `use`  | `useAuth.ts`           |
| Utilities  | camelCase             | `formatDate.ts`        |
| Types      | PascalCase + `.types` | `User.types.ts`        |
| Tests      | Same name + `.test`   | `UserProfile.test.tsx` |
| Styles     | Same name + `.module` | `Button.module.css`    |

### Import Order

Organize imports in this order with a blank line between groups:

```typescript
// 1. React/framework
import React, { useState, useEffect } from 'react';

// 2. External packages (alphabetical)
import { motion } from 'framer-motion';
import { z } from 'zod';

// 3. Internal packages (@cgraph/*)
import { Button } from '@cgraph/ui';
import { formatDate } from '@cgraph/utils';

// 4. Relative imports (parent before sibling)
import { useAuth } from '../hooks';
import { UserCard } from './UserCard';

// 5. Type imports (last)
import type { User } from '@cgraph/shared-types';
```

### Error Handling

Use domain-specific error classes:

```typescript
// ✅ Good - specific error types
throw new ValidationError('Email is required');
throw new AuthenticationError('Invalid credentials');
throw new NotFoundError('User not found');

// ❌ Bad - generic errors
throw new Error('Something went wrong');
```

## Pull Request Process

1. Ensure CLA is signed
2. Update documentation if needed
3. Add tests for new functionality
4. Ensure CI passes
5. Request review from maintainers
6. Address review feedback
7. Squash commits if requested

### PR Checklist

Before submitting:

- [ ] CLA signed
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Added comments where needed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No proprietary information exposed

## Confidentiality

By contributing, you agree to:

1. Keep all source code confidential
2. Not share code, architecture, or implementation details externally
3. Not use knowledge gained here for competing products
4. Report any security vulnerabilities through private channels only

## Questions?

For authorized contributors only:

- Contact: engineering@cgraph.org
- Internal Slack: #cgraph-dev

---

**CGraph - Proprietary and Confidential**

© 2025-2026 CGraph. All Rights Reserved.
