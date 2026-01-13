# CGraph Monorepo Conventions

> Standards and conventions for scalable multi-team development

## Table of Contents

- [Package Structure](#package-structure)
- [Naming Conventions](#naming-conventions)
- [Dependency Management](#dependency-management)
- [Code Ownership](#code-ownership)
- [Versioning Strategy](#versioning-strategy)
- [Testing Standards](#testing-standards)
- [Documentation Requirements](#documentation-requirements)

---

## Package Structure

### Directory Layout

```
cgraph/
├── apps/                    # Deployable applications
│   ├── backend/            # Phoenix API server
│   ├── web/                # React web client
│   └── mobile/             # React Native app
├── packages/               # Shared libraries
│   ├── core/               # Domain logic, entities, services
│   ├── ui/                 # Shared UI components
│   ├── state/              # State management (Zustand)
│   ├── utils/              # Utility functions
│   ├── shared-types/       # TypeScript types
│   └── config/             # Shared configuration
├── docs/                   # Documentation
│   ├── guides/             # How-to guides
│   ├── api/                # API documentation
│   ├── architecture/       # System architecture
│   └── release-notes/      # Version changelogs
├── infrastructure/         # IaC, Docker, K8s configs
└── tools/                  # Build & dev tools
```

### Package Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `apps/` | Deployable artifacts | `backend`, `web`, `mobile` |
| `packages/` | Shared libraries | `core`, `ui`, `utils` |
| `tools/` | Development utilities | Scripts, generators |

---

## Naming Conventions

### Package Names

- **Scope**: All packages use `@cgraph/` scope
- **Format**: `@cgraph/{name}` (lowercase, kebab-case)

Examples:
- `@cgraph/core`
- `@cgraph/ui`
- `@cgraph/shared-types`

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `User.types.ts` |
| Tests | Same as source + `.test` | `UserProfile.test.tsx` |
| Constants | SCREAMING_SNAKE | `API_ENDPOINTS.ts` |

### Branch Naming

```
{type}/{ticket-id}-{short-description}
```

Types:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation
- `chore/` - Maintenance

Examples:
- `feature/CG-123-add-voice-messages`
- `fix/CG-456-message-sync-issue`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
{type}({scope}): {description}

[optional body]

[optional footer(s)]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance
- `perf` - Performance improvement

Examples:
```
feat(messaging): add voice message support

Implements voice recording and playback for messages.
Includes compression and streaming upload.

Closes #123
```

---

## Dependency Management

### Internal Dependencies

Use workspace protocol for internal packages:

```json
{
  "dependencies": {
    "@cgraph/core": "workspace:*",
    "@cgraph/ui": "workspace:*"
  }
}
```

### External Dependencies

- **Pin major versions**: Use `^` for minor updates
- **Shared deps at root**: Common devDependencies in root `package.json`
- **No duplicate versions**: Use `pnpm dedupe` regularly

### Dependency Update Policy

| Type | Frequency | Automation |
|------|-----------|------------|
| Security patches | Immediately | Dependabot |
| Minor updates | Weekly | Dependabot PRs |
| Major updates | Monthly review | Manual |

---

## Code Ownership

### CODEOWNERS Structure

```
# Core team owns everything by default
* @cgraph-dev/core-team

# Platform-specific ownership
/apps/backend/ @cgraph-dev/backend-team
/apps/web/ @cgraph-dev/frontend-team
/apps/mobile/ @cgraph-dev/mobile-team

# Shared packages require core team review
/packages/ @cgraph-dev/core-team

# Security-sensitive areas
**/auth/ @cgraph-dev/security-team
**/crypto/ @cgraph-dev/security-team
```

### Review Requirements

| Area | Required Reviewers | Auto-merge |
|------|-------------------|------------|
| `apps/backend/` | 1 backend + 1 any | No |
| `apps/web/` | 1 frontend + 1 any | No |
| `packages/` | 2 core team | No |
| `docs/` | 1 any | Yes (if docs only) |

---

## Versioning Strategy

### Semantic Versioning

```
MAJOR.MINOR.PATCH[-PRERELEASE]
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Process

1. Create release branch: `release/v{version}`
2. Update CHANGELOG.md
3. Bump versions across packages
4. Create PR to main
5. After merge, tag release: `git tag v{version}`
6. Push tag triggers release workflow

### Version Synchronization

All packages share the same version number for simplicity:

```bash
# Update all package versions
pnpm version {major|minor|patch}
```

---

## Testing Standards

### Coverage Requirements

| Package | Minimum Coverage |
|---------|-----------------|
| `packages/core/` | 80% |
| `packages/utils/` | 90% |
| `apps/backend/` | 75% |
| `apps/web/` | 70% |
| `apps/mobile/` | 60% |

### Test Categories

| Type | Location | When to Run |
|------|----------|-------------|
| Unit | `*.test.ts` | Every commit |
| Integration | `*.integration.test.ts` | PR merge |
| E2E | `e2e/` | Nightly + release |
| Visual | `*.visual.test.ts` | PR merge |

### Testing Patterns

```typescript
// Use descriptive test names
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid email', async () => {
      // Arrange
      const userData = { email: 'test@example.com', name: 'Test' };
      
      // Act
      const user = await userService.createUser(userData);
      
      // Assert
      expect(user.email).toBe('test@example.com');
    });

    it('should throw ValidationError for invalid email', async () => {
      // ...
    });
  });
});
```

---

## Documentation Requirements

### Code Documentation

**Required for:**
- All exported functions/classes
- Complex business logic
- Non-obvious implementations

**JSDoc Standard:**
```typescript
/**
 * Encrypts a message using Signal Protocol.
 * 
 * @param content - The plain text content to encrypt
 * @param recipientId - The recipient's user ID
 * @param options - Encryption options
 * @returns The encrypted message payload
 * @throws {EncryptionError} If encryption fails
 * 
 * @example
 * ```typescript
 * const encrypted = await encryptMessage('Hello', 'user-123');
 * ```
 */
export async function encryptMessage(
  content: string,
  recipientId: string,
  options?: EncryptionOptions
): Promise<EncryptedPayload> {
  // ...
}
```

### README Requirements

Every package must have a README.md with:

1. **Description** - What the package does
2. **Installation** - How to install
3. **Usage** - Basic examples
4. **API** - Exported interfaces
5. **Contributing** - How to contribute

### Architecture Decision Records (ADRs)

Major architectural decisions must be documented in `/docs/architecture/decisions/`:

```markdown
# ADR-{number}: {Title}

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?
```

---

## Import Order Convention

```typescript
// 1. React/framework imports
import React, { useState, useEffect } from 'react';

// 2. External dependencies
import { motion } from 'framer-motion';
import { z } from 'zod';

// 3. Internal packages
import { User } from '@cgraph/core';
import { Button } from '@cgraph/ui';

// 4. Relative imports
import { useLocalState } from '../hooks';
import { formatMessage } from './utils';

// 5. Type imports
import type { MessageProps } from './types';
```

---

## Error Handling Convention

```typescript
// Domain errors extend base error
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Specific domain errors
export class ValidationError extends DomainError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', { field });
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', { resource, id });
  }
}
```

---

## Performance Guidelines

### Bundle Size Limits

| Package | Max Size (gzipped) |
|---------|-------------------|
| `@cgraph/core` | 50KB |
| `@cgraph/ui` | 100KB |
| `apps/web` (initial) | 200KB |

### Performance Patterns

1. **Lazy loading** - Use dynamic imports for routes
2. **Memoization** - Use React.memo, useMemo, useCallback appropriately
3. **Virtualization** - Use for lists > 100 items
4. **Image optimization** - Use next/image or similar

---

*Last updated: January 2026*
