# CGraph Codebase Conventions

> Auto-generated codebase mapping document. Source: analysis of ESLint, Prettier, TypeScript,
> commitlint configs, and source files across the monorepo.

---

## 1. Monorepo Structure

```
CGraph/
├── apps/
│   ├── backend/       # Elixir/Phoenix API server (PostgreSQL, Redis)
│   ├── web/           # React 19 + Vite SPA (Zustand, TanStack Query)
│   ├── mobile/        # React Native + Expo SDK 54
│   └── landing/       # Marketing site (Vite + React)
├── packages/
│   ├── api-client/    # HTTP client with circuit breaker + retry
│   ├── crypto/        # E2EE (Signal Protocol-inspired)
│   ├── shared-types/  # Cross-app TypeScript types
│   ├── socket/        # Phoenix WebSocket client
│   ├── utils/         # Shared validation, formatting, HTTP helpers
│   ├── animation-constants/  # Shared animation durations/springs
│   └── ui/            # Liquid Glass component library
├── infrastructure/    # Docker, Terraform, observability configs
├── docs/              # Architecture docs, ADRs, runbooks
└── docs-website/      # Docusaurus documentation site
```

Managed by **pnpm workspaces** (`pnpm@10.12.1`) with **Turborepo** for task orchestration.

- `package.json` root defines workspace scripts: `dev`, `build`, `test`, `lint`, `typecheck`,
  `format`
- `turbo.json` configures task dependencies, caching, and remote cache (enabled)
- Workspace packages are referenced via `workspace:*` or `workspace:^` in `package.json`

---

## 2. Code Formatting

### Prettier (`.prettierrc`)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"],
  "overrides": [
    {
      "files": "*.md",
      "options": {
        "proseWrap": "always"
      }
    }
  ]
}
```

Key rules:

- **Semicolons**: always
- **Quotes**: single quotes
- **Indent**: 2 spaces
- **Print width**: 100 characters
- **Trailing commas**: ES5 style
- **Line endings**: LF (Unix)
- **Tailwind CSS**: class sorting plugin enabled

### EditorConfig (`.editorconfig`)

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[Makefile]
indent_style = tab
```

### lint-staged (pre-commit)

```json
{
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

---

## 3. TypeScript Configuration

### Base Config (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true,
    "composite": false
  },
  "exclude": ["node_modules", "dist", "build", ".turbo"]
}
```

**Critical strictness flags:**

- Full `strict` mode enabled
- `noUncheckedIndexedAccess` — array/object index access returns `T | undefined`
- `noUnusedLocals` / `noUnusedParameters` — dead code detection
- `noImplicitReturns` — all code paths must return

### ESLint TypeScript Rules

From `eslint.config.js`:

```javascript
// Ban explicit `any` type (ERROR in all apps/packages)
'@typescript-eslint/no-explicit-any': 'error'

// Ban type assertions (as X) — prefer type guards or `satisfies`
// `as const` is always allowed
'@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }]

// Unused vars: prefix with _ to suppress
'@typescript-eslint/no-unused-vars': ['warn', {
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_',
}]
```

**Type assertion ban**: Production code must NOT use `as X` casts. Use:

- Type guards (`if ('field' in obj)`)
- `satisfies` operator
- Explicit type annotations
- Exception: test files (`*.test.ts`, `*.spec.ts`, `**/mocks/**`, `**/__tests__/**`) are exempt

---

## 4. Naming Conventions

### File Naming

| Type                      | Convention                                       | Example                                    |
| ------------------------- | ------------------------------------------------ | ------------------------------------------ |
| React components (`.tsx`) | **kebab-case** (enforced by ESLint `check-file`) | `user-profile.tsx`, `glass-card.tsx`       |
| Hooks                     | **camelCase** with `use` prefix                  | `useDebounce.ts`, `useAuth.ts`             |
| Stores                    | **camelCase** with `Store` suffix                | `authStore.impl.ts`, `chatStore.ts`        |
| Utilities                 | **camelCase**                                    | `format.ts`, `validation.ts`               |
| Types                     | **camelCase** + `.types` suffix                  | `authStore.types.ts`, `admin.types.ts`     |
| Tests                     | Same name + `.test`                              | `authStore.test.ts`, `button.test.tsx`     |
| Barrel exports            | `index.ts`                                       | `stores/index.ts`, `modules/auth/index.ts` |
| Zod schemas               | grouped in `schemas/` folder                     | `schemas/base.ts`, `schemas/auth.ts`       |
| Storybook stories         | Same name + `.stories`                           | `button.stories.tsx`                       |
| CSS modules               | PascalCase + `.module.css` (legacy)              | `GlassCard.module.css`                     |

### TypeScript Naming

- **Interfaces/Types**: PascalCase — `User`, `AuthState`, `TokenSet`
- **Enums/Constants**: SCREAMING_SNAKE_CASE for config objects — `THEME_COLORS`, `MAX_FILE_SIZES`
- **Functions**: camelCase — `mapUserFromApi`, `createLogger`, `validateResponse`
- **React Components**: PascalCase function declarations — `function Button(...)`,
  `function Modal(...)`
- **Generic type parameters**: Single uppercase or descriptive — `<T>`,
  `<T extends (...args: Parameters<T>) => void>`

---

## 5. Import Patterns

### Import Order (from `CONTRIBUTING.md`)

```typescript
// 1. React/framework
import React, { useState, useEffect } from 'react';

// 2. External packages (alphabetical)
import { motion } from 'motion/react';
import { z } from 'zod';

// 3. Internal packages (@cgraph/*)
import { createHttpClient } from '@cgraph/utils';
import { formatDateHeader } from '@cgraph/utils';

// 4. Relative imports (parent before sibling)
import { useAuth } from '../hooks';
import { UserCard } from './UserCard';

// 5. Type imports (last)
import type { User } from '@cgraph/shared-types';
```

### Path Aliases

- **Web/Landing**: `@/` → `src/` (configured in `vite.config.ts` via `resolve.alias`)
- **Mobile**: `@/` → `src/`, plus `@components/`, `@hooks/`, `@lib/`, `@screens/` (in both
  `tsconfig.json` paths and Jest `moduleNameMapper`). tsconfig also has `@features/`, `@services/`
  and package aliases (`@cgraph/*`). Jest additionally maps `@contexts/` and `@types/` (no
  corresponding tsconfig paths — `src/contexts/` does not exist on disk)

### Barrel Files

Barrel `index.ts` files are used extensively for public API surfaces:

```typescript
// apps/web/src/stores/index.ts — unified store exports
export { useAuthStore } from '../modules/auth/store';
export type { User, AuthState } from '../modules/auth/store';
export { useChatStore } from '../modules/chat/store';
// ...grouped by domain with section headers
```

```typescript
// apps/web/src/lib/validation/schemas/index.ts — schema barrel
export { dateTimeSchema, uuidSchema, emailSchema } from './base';
export { userSchema, type User } from './user';
export { loginResponseSchema, type LoginResponse } from './auth';
```

---

## 6. React Component Patterns

### React 19 Rules (enforced by ESLint)

```javascript
// BANNED — will cause ESLint errors:
React.FC; // Use plain function declarations
React.FunctionComponent; // Use plain function declarations
forwardRef; // ref is a regular prop in React 19
useContext(); // Use use() hook in React 19
```

### Component Declaration Pattern

```tsx
// apps/web/src/components/ui/button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/**
 * Versatile button component with multiple variants and sizes.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ref, // ref is a regular prop in React 19
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  // Implementation
}

Button.displayName = 'Button';
```

**Key patterns:**

- Plain `function` declarations (not arrow functions for components)
- Props interface extending HTML element attributes
- Default values via destructuring
- `ref` passed as a regular prop
- `displayName` set for debugging

### File Size Limits (enforced in CI)

- **TSX components**: max 300 lines (hard fail in web, warning-only in mobile)
- **Elixir files**: max 500 lines (hard fail)

---

## 7. State Management Patterns

### Zustand Store Architecture

Stores are organized by **domain modules** under `apps/web/src/modules/`:

```
modules/
├── auth/
│   ├── store/
│   │   ├── index.ts              # barrel
│   │   ├── authStore.impl.ts     # store definition
│   │   ├── authStore.types.ts    # type definitions
│   │   ├── authStore.utils.ts    # helper functions
│   │   ├── auth-actions.ts       # action implementations
│   │   └── auth-init.ts          # initialization logic
│   ├── api/
│   ├── components/
│   ├── hooks/
│   └── types/
├── calls/
├── chat/
├── creator/
├── discovery/
├── forums/
├── groups/
├── moderation/
├── nodes/
├── premium/
├── pulse/
├── search/
├── secret-chat/
├── settings/
├── social/
└── ...
```

### Store Creation Pattern

```typescript
// apps/web/src/modules/auth/store/authStore.impl.ts
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions — delegated to separate files to keep store small
        login: createLoginAction(set, get),
        logout: createLogoutAction(set, get),
        clearError: () => set({ error: null }),

        // Reset for testing
        reset: () =>
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          }),
      }),
      {
        name: 'cgraph-auth-v2',
        storage: createJSONStorage(() => safeStorage),
      }
    ),
    { name: 'AuthStore' }
  )
);
```

### Architectural Boundaries (enforced by ESLint)

```javascript
// Components CANNOT import stores directly — must use hooks
// apps/web/src/components/**
'no-restricted-imports': ['error', {
  patterns: [{
    group: ['@/stores/*', '!@/stores/hooks', '!@/stores/index'],
    message: 'Components should use store hooks from @/stores/hooks',
  }]
}]

// Components and pages CANNOT import services directly
// Must use hooks as intermediary
```

### TanStack Query Integration

```typescript
// apps/web/src/lib/queryKeys.ts
// Centralized query key factory pattern
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (filters?: UserFilters) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  conversations: {
    /* ... */
  },
  messages: {
    /* ... */
  },
};
```

---

## 8. Error Handling Patterns

### Domain-Specific Errors (from `CONTRIBUTING.md`)

```typescript
// ✅ Good — specific error types
throw new ValidationError('Email is required');
throw new AuthenticationError('Invalid credentials');
throw new NotFoundError('User not found');

// ❌ Bad — generic errors
throw new Error('Something went wrong');
```

### Error Boundary (React)

```tsx
// apps/web/src/components/error-boundary.tsx
class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }
}
```

### Error Tracking (Sentry Integration)

```typescript
// apps/web/src/lib/error-tracking.ts
const Sentry = await import('@sentry/react');

Sentry.init({
  dsn: SENTRY_DSN,
  environment: ENVIRONMENT,
  release: `cgraph-web@${RELEASE}`,
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
});
```

### API Error Extraction

```typescript
// packages/utils/src/httpClient.ts
// Shared HTTP client with:
// - Automatic token refresh with queue management
// - Retry logic with exponential backoff
// - Idempotency keys for mutating requests
// - Circuit breaker pattern (via @cgraph/api-client)
```

---

## 9. Logging Patterns

### Structured Logger

```typescript
// apps/web/src/lib/logger.ts
// Factory-pattern logger with namespace prefixes

import { createLogger } from '@/lib/logger';
const logger = createLogger('API');

logger.debug('Request sent', { url, method }); // Dev only
logger.info('User authenticated'); // Dev only
logger.warn('Rate limited', { retryAfter }); // Dev + production (sanitized)
logger.error(new Error('Connection failed')); // Dev + production (sent to Sentry)
logger.breadcrumb('User clicked send'); // Adds to Sentry breadcrumb trail
```

**Key behaviors:**

- **Development**: Full logging with stack traces
- **Production**: PII stripped, errors forwarded to Sentry, warnings sanitized
- **Web**: `console.log`/`console.debug` banned (`no-console: error`);
  `console.warn`/`console.error` allowed
- **Mobile**: `console.log`/`console.debug` discouraged (`no-console: warn` in mobile-local config);
  `console.warn`/`console.error`/`console.info` allowed (root config targets `error` but
  per-workspace lint uses local config)
- Test files are exempt from the logger requirement

### Named Logger Instances

Pre-created loggers are exported for major subsystems: `authLogger`, `socketLogger`, `e2eeLogger`,
`apiLogger`, `chatLogger`, etc.

---

## 10. API Route/Handler Patterns

### Validated API Client

```typescript
// apps/web/src/lib/validation/validatedApi.ts
import { api } from '@/lib/api';
import { validateWithFallback, loginResponseSchema } from './schemas';

export const authApi = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/api/v1/auth/login', { identifier, password });
    return validateWithFallback(loginResponseSchema, response.data, 'login');
  },
};
```

**Pattern**: every API response is validated against a Zod schema at runtime using
`validateWithFallback()`.

### API URL Convention

- Backend routes follow REST: `/api/v1/{resource}`
- Production uses `VITE_API_URL` env var (Cloudflare Pages → Fly.io backend)
  > **Note**: `apps/web/vercel.json` also exists with Vercel rewrites (`/api/*` → Fly.io). Terraform
  > DNS points `web.cgraph.org` to CF Pages.
- Development uses Vite proxy: `/api` → `https://cgraph-backend.fly.dev` (configurable)

### HTTP Client Architecture

```
apps/web/src/lib/api.ts
  └── createHttpClient() from @cgraph/utils
       ├── Token refresh with queue
       ├── Retry with exponential backoff
       ├── Idempotency keys
       └── Circuit breaker from @cgraph/api-client
```

---

## 11. Validation Patterns

### Zod Schema Architecture

```
apps/web/src/lib/validation/
├── schemas/
│   ├── index.ts        # barrel re-export
│   ├── base.ts         # dateTimeSchema, uuidSchema, emailSchema, paginationSchema
│   ├── auth.ts         # loginResponseSchema, tokensSchema
│   ├── user.ts         # userSchema, userRefSchema
│   ├── conversation.ts # messageSchema, conversationSchema
│   ├── notification.ts # notificationSchema
│   ├── social.ts       # friendSchema, groupSchema, channelSchema
│   └── utils.ts        # validateResponse, validateWithFallback, createValidatedFetcher
├── schemas.ts          # thin barrel re-export
└── validatedApi.ts     # API client with built-in validation
```

### Schema Examples

```typescript
// schemas/base.ts
export const dateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/));

export const paginationSchema = z.object({
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
  total: z.number().int().nonnegative().optional(),
  total_pages: z.number().int().nonnegative().optional(),
  has_more: z.boolean().optional(),
});
```

### Input Validation (packages/utils)

```typescript
// packages/utils/src/validation.ts
export function isValidEmail(email: string): boolean {
  /* regex */
}
export function isValidUsername(username: string): boolean {
  /* 3-30 chars, alphanumeric + _ */
}
export function isValidPassword(password: string): boolean {
  /* min 8, letter + number */
}
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  feedback: string[];
};
export function sanitizeInput(input: string): string {
  /* XSS prevention */
}
```

---

## 12. Git Conventions

### Commit Messages (`commitlint.config.js`)

Format: `type(scope): description`

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `revert`, `wip`

**Rules:**

- Type: required, lowercase
- Scope: optional, lowercase
- Subject: required, lowercase start, no period, max 100 chars header
- Body: blank line before
- Footer: blank line before

```
feat(messaging): add message reactions
fix(auth): resolve token refresh race condition
docs(readme): update installation instructions
test(store): add gamification store unit tests
```

### Branch Naming

- `feature/` — new features
- `fix/` — bug fixes
- `docs/` — documentation
- `refactor/` — restructuring
- `test/` — test additions

---

## 13. JSDoc Requirements

JSDoc is **enforced by ESLint** (error level) on all exported functions/classes in:

- `apps/web/src/`
- `apps/mobile/src/`
- `packages/`

Test files, mocks, and `__tests__/` directories are exempt.

```typescript
/**
 * Hook that debounces a value.
 *
 * Returns the debounced value that only updates after the specified
 * delay has passed without the value changing.
 *
 * @param value - value to debounce
 * @param delay - debounce delay in milliseconds
 * @returns debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(search, 300);
 */
export function useDebounce<T>(value: T, delay: number): T { ... }
```

Custom JSDoc tags allowed: `@refactored`, `@security`, `@updated`, `@architecture`, `@todo`

---

## 14. Code Organization Within Files

### Module File Structure

Store files follow a decomposition pattern to stay under 300 lines:

```
authStore.types.ts     — Interface / type definitions
authStore.utils.ts     — Pure helper functions (mapUserFromApi, etc.)
authStore.impl.ts      — Store creation (orchestrator)
auth-actions.ts        — Action implementations (login, logout, etc.)
auth-init.ts           — Initialization logic
index.ts               — Barrel export
```

### Section Headers

Files use `// ============` comment separators to group related code:

```typescript
// ============================================================================
// User Domain (Auth, Profile, Settings, Friends)
// ============================================================================
export { useAuthStore } from '../modules/auth/store';

// ============================================================================
// Chat Domain (Messages, Conversations, Effects)
// ============================================================================
export { useChatStore } from '../modules/chat/store';
```

### File-Level Module JSDoc

```typescript
/**
 * API client configuration and base utilities.
 * @module
 */

/**
 * Production-safe logger with integrated error tracking
 * @module lib/logger
 * @version 2.0.0
 * @since v0.7.58
 */
```

---

## 15. Technology Stack Summary

| Layer             | Technology                                         |
| ----------------- | -------------------------------------------------- |
| Frontend (Web)    | React 19, Vite, TypeScript 5.8, Tailwind CSS       |
| Frontend (Mobile) | React Native 0.81, Expo SDK 54                     |
| Routing (Web)     | React Router 7                                     |
| State Management  | Zustand 5 + TanStack Query 5                       |
| Validation        | Zod 3.24                                           |
| Animation         | Motion 12 (package: `motion`), GSAP                |
| Backend           | Elixir 1.18, Phoenix, PostgreSQL 16, Redis 7       |
| Realtime          | Phoenix Channels (WebSocket)                       |
| E2EE              | Signal Protocol-inspired (custom `@cgraph/crypto`) |
| Build             | Vite (web/landing), Metro (mobile), Turborepo      |
| Package Manager   | pnpm 10 with workspaces                            |
| CI/CD             | GitHub Actions, Fly.io (backend), CF Pages (web)   |
| Error Tracking    | Sentry (browser + React Native)                    |
| UI Components     | Radix UI primitives + custom Tailwind components   |
| Styling           | Tailwind CSS (web), StyleSheet (mobile)            |
| Node.js           | >=20.x (engines), v22 (CI/Docker)                  |

---

## 16. Architectural Enforcement Summary

All enforced at **error** level in ESLint or CI:

1. **No `any`** — `@typescript-eslint/no-explicit-any: error`
2. **No type assertions** — `consistent-type-assertions: never` (web, mobile, packages — landing
   exempt; except tests)
3. **No `React.FC`** — banned via `no-restricted-syntax` (web, mobile only)
4. **No `forwardRef`** — React 19, ref is a regular prop (web, mobile only)
5. **No `useContext`** — use `use()` hook (React 19) (web, mobile only)
6. **No direct store imports in components** — use hooks
7. **No direct service imports in components/pages** — use hooks
8. **No `console.log` in source** — `error` in web, `warn` in mobile (local config); use
   `createLogger()`
9. **JSDoc required** on exported functions/classes
10. **Kebab-case `.tsx` filenames** — enforced by `eslint-plugin-check-file`
11. **300-line TSX limit** — enforced in CI
12. **500-line Elixir limit** — enforced in CI
