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
│   └── animation-constants/  # Shared animation durations/springs
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
import { motion } from 'framer-motion';
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
├── chat/
├── forums/
├── gamification/
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

## 15. Elixir/Phoenix Backend Conventions

### 15.1 Context Module Pattern

The backend follows a **Phoenix Context** pattern where each domain lives under `lib/cgraph/` as a
folder + facade module pair:

```
lib/cgraph/
├── accounts/          # Sub-modules: User, WalletAuthentication, etc.
├── accounts.ex        # Facade — public API for the Accounts domain
├── creators/          # Sub-modules: ConnectOnboarding, Earnings, etc.
│   └── creators.ex    # ⚠ Facade INSIDE directory (see note below)
├── gamification/      # Sub-modules: EventSystem, Cosmetics, Prestige, etc.
├── gamification.ex    # Facade — public API for Gamification domain
├── forums/
├── forums.ex
├── shop/              # CoinBundles, CoinCheckout, CoinPurchase
├── collaboration/     # Document, DocumentServer
├── data_export/       # 5 export modules
└── ...                # ~57 context domains total
```

> **Facade file location inconsistency**: Most contexts place the facade as a **peer file**
> alongside the directory (e.g., `lib/cgraph/accounts.ex` alongside `lib/cgraph/accounts/`).
> However, **Creators** places its facade **inside** the directory at
> `lib/cgraph/creators/creators.ex`. Follow the peer-file pattern for new contexts.
>
> **Missing facades**: Two major contexts have **no facade file at all**:
> `notifications` and `subscriptions`. Their modules are accessed directly via
> sub-module paths (e.g., `CGraph.Notifications.Delivery`, `CGraph.Subscriptions.TierLimits`).

**Facade + Delegation Pattern** (introduced by `Creators` context):

Larger contexts use `defdelegate` in the facade module to keep the public API
clean while splitting implementation across specialized sub-modules:

```elixir
# lib/cgraph/creators/creators.ex — thin facade, ~40 lines
defmodule CGraph.Creators do
  @moduledoc "Creator monetization context — facade for Connect onboarding,
  paid subscriptions, earnings, and payouts."

  alias CGraph.Creators.{ConnectOnboarding, PaidSubscription, Earnings, Payout}

  # ── Connect Onboarding ──────────────────────────────────────────
  defdelegate create_connect_account(user), to: ConnectOnboarding
  defdelegate check_account_status(connect_account_id), to: ConnectOnboarding

  # ── Paid Subscriptions ──────────────────────────────────────────
  defdelegate subscribe_to_paid_forum(subscriber, forum), to: PaidSubscription
  defdelegate cancel_paid_subscription(subscription), to: PaidSubscription

  # ── Earnings ────────────────────────────────────────────────────
  defdelegate get_balance(creator_id), to: Earnings
  defdelegate get_stats(creator_id, period \\ :last_30_days), to: Earnings

  # ── Payouts ─────────────────────────────────────────────────────
  defdelegate request_payout(creator), to: Payout
  defdelegate minimum_payout_cents(), to: Payout
end
```

Sub-module naming convention: named by **responsibility** — `ConnectOnboarding`,
`PaidSubscription`, `Earnings`, `Payout`, `ContentGate`.

### 15.2 Schema Conventions

All Ecto schemas follow consistent conventions:

```elixir
# Standard schema preamble
@primary_key {:id, :binary_id, autogenerate: true}
@foreign_key_type :binary_id
@timestamps_opts [type: :utc_datetime]

# Field grouping: belongs_to first, then fields, then timestamps
schema "creator_earnings" do
  belongs_to :creator, CGraph.Accounts.User
  belongs_to :forum, CGraph.Forums.Forum

  field :gross_amount_cents, :integer
  field :currency, :string, default: "usd"

  timestamps(updated_at: false)  # Ledger tables omit updated_at
end

# Changeset uses module attrs for field lists
@required_fields ~w(creator_id gross_amount_cents)a
@optional_fields ~w(forum_id currency stripe_payment_intent_id)a
```

**Key rules:**
- **Primary keys**: ULIDs via `:binary_id` (not auto-increment integers)
- **Timestamps**: always `:utc_datetime`
- **Monetary values**: stored as `_cents` integers (never floats)
- **Status fields**: string enums validated via `validate_inclusion/3`
- **Changesets**: `@required_fields` / `@optional_fields` module attributes with `~w()a` sigil

### 15.3 Controller Patterns

Two controller styles exist:

**Style A — Direct JSON response** (used by `CreatorController`, larger controllers):

```elixir
defmodule CGraphWeb.API.V1.CreatorController do
  use CGraphWeb, :controller
  require Logger

  alias CGraph.Creators

  def onboard(conn, _params) do
    user = conn.assigns.current_user

    case Creators.create_connect_account(user) do
      {:ok, %{account_id: id, url: url}} ->
        json(conn, %{data: %{account_id: id, onboarding_url: url}})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{message: "Failed", detail: inspect(reason)}})
    end
  end
end
```

**Style B — `action_fallback` + `render_data` helper** (used by `PaymentController`, `CoinShopController`):

```elixir
defmodule CGraphWeb.API.PaymentController do
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2]

  action_fallback CGraphWeb.FallbackController

  def create_checkout(conn, params) do
    user = Guardian.Plug.current_resource(conn)
    case Subscriptions.create_checkout_session(user, tier) do
      {:ok, url} -> render_data(conn, %{checkout_url: url})
      {:error, msg} -> conn |> put_status(:unprocessable_entity) |> json(%{error: msg})
    end
  end
end
```

**Shared conventions across both styles:**
- Response envelope: `%{data: ...}` for success, `%{error: %{message: ...}}` for errors
- User access: `conn.assigns.current_user` (pipeline-assigned) or `Guardian.Plug.current_resource(conn)`
- Multi-clause error matching with descriptive atom errors (`:below_minimum`, `:already_subscribed`, etc.)
- Controllers use `with` chains for multi-step validations
- `@doc` on every public action, `@spec` annotations on Style B controllers

### 15.4 Route Organization

Routes are split into **macro modules** under `lib/cgraph_web/router/`:

```elixir
# lib/cgraph_web/router/creator_routes.ex
defmodule CGraphWeb.Router.CreatorRoutes do
  defmacro creator_routes do
    quote do
      scope "/api/v1", CGraphWeb.API.V1 do
        pipe_through [:api, :api_auth]

        post "/creator/onboard", CreatorController, :onboard
        get  "/creator/status", CreatorController, :status
        put  "/forums/:id/monetization", CreatorController, :update_monetization
        post "/forums/:id/subscribe", CreatorController, :subscribe
      end
    end
  end
end
```

Route modules are then imported into the main `Router` via `import` + macro call.
API routes follow REST under `/api/v1/{resource}`.

**All 11 route modules**: `admin_routes`, `ai_routes`, `auth_routes`, `creator_routes`,
`forum_routes`, `gamification_routes`, `health_routes`, `messaging_routes`, `public_routes`,
`sync_routes`, `user_routes`.

**Router Pipelines:**

| Pipeline           | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `:api`             | Base JSON pipeline (parses body, accepts JSON)       |
| `:api_auth`        | Authenticated routes (adds Guardian + cookie auth)   |
| `:api_auth_strict` | Strict auth with rate limiting (`:strict` tier)      |
| `:api_relaxed`     | Relaxed rate limiting tier for high-traffic endpoints |
| `:api_admin`       | Admin-only routes (RequireAdmin plug)                |

### 15.5 Channel Patterns

Phoenix Channels follow documented conventions (see `GamificationChannel`):

- **Rate limiting**: per-event-type limits stored in socket assigns
- **PubSub subscriptions**: user-specific + global topics subscribed in `handle_info(:after_join, ...)`
- **Event interception**: `intercept` macro for outgoing events
- **Presence tracking**: via `CGraphWeb.Presence` for live user counts
- **Pattern-matched handlers**: one `handle_info` clause per PubSub event atom
  (`:xp_awarded`, `:achievement_unlocked`, `:battle_pass_purchased`, etc.)

### 15.6 Wallet Authentication (SIWE / EIP-4361)

The `WalletAuthentication` module implements Sign-In with Ethereum:

- **Challenge flow**: `get_or_create_wallet_challenge/1` → SIWE message → EIP-191 signature verify
- **SIWE message parsing**: regex-based field extraction from EIP-4361 format
- **Security**: nonce deleted after successful verification (replay protection),
  domain allowlist (`@allowed_domains`), expiration validation
- **Crypto**: `ExKeccak` for keccak256 hashing, `ExSecp256k1` for EC recovery
- **User creation**: auto-generates username from wallet address prefix

### 15.7 Migration Conventions

```elixir
defmodule CGraph.Repo.Migrations.AddCreatorMonetization do
  use Ecto.Migration

  def change do
    # ── Section headers with comment separators ──────────────────
    create table(:paid_forum_subscriptions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :status, :string, default: "active"
      timestamps(type: :utc_datetime)
    end

    create unique_index(:paid_forum_subscriptions, [:forum_id, :subscriber_id])
    create index(:paid_forum_subscriptions, [:stripe_subscription_id])
  end
end
```

**Rules:**
- All tables use `primary_key: false` with explicit `:binary_id` PK
- Foreign keys always specify `type: :binary_id` and `on_delete` strategy
- Timestamps use `type: :utc_datetime`
- Indexes created for all foreign keys + frequently queried columns
- Unique indexes for business constraints (e.g., one subscription per user per forum)
- Comment section headers (`# ── Name ──`) group related DDL

### 15.8 Structured Logging

Backend uses `Logger` with keyword-list metadata (not string interpolation):

```elixir
Logger.info("stripe_connect_account_created",
  user_id: user.id,
  account_id: account.id
)

Logger.error("stripe_connect_account_failed",
  user_id: user.id,
  error: inspect(reason)
)
```

Log messages are snake_case event names for machine parseability.

### 15.9 JSON View Pattern

56+ JSON view files exist alongside controllers, following the `*_json.ex` naming convention:

```
lib/cgraph_web/controllers/
├── auth_controller.ex
├── auth_json.ex           # JSON rendering for auth responses
├── user_controller.ex
├── user_json.ex           # JSON rendering for user responses
├── forum_controller.ex
├── forum_json.ex          # JSON rendering for forum responses
└── ...
```

**Standard view function signatures:**

```elixir
defmodule CGraphWeb.UserJSON do
  def data(assigns), do: ...
  def show(assigns), do: ...
  def index(assigns), do: ...
end
```

Functions receive assigns maps and return plain data structures (maps/lists) that Phoenix
automatically encodes to JSON.

**Sub-controller split files**: Larger controllers extract specific action groups into sub-modules
within a child directory:
- `custom_emoji_controller/favorites_actions.ex`
- `forum_controller/voting_actions.ex`
- `cosmetics_controller/serializers.ex`
- `events_controller/helpers.ex` (root level)
- `marketplace_controller/helpers.ex` (root level)
- `admin/marketplace_controller/settings_actions.ex`

### 15.10 Plug Pipeline Architecture

Custom plug middleware stack used across router pipelines:

| Plug                   | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| `SecurityHeaders`      | Sets security-related HTTP response headers            |
| `RateLimiterV2`        | Rate limiting with tiers: `:standard`, `:strict`, `:relaxed` |
| `CookieAuth`           | Cookie-based authentication fallback                   |
| `RequestTracing`       | Assigns request IDs for distributed tracing            |
| `ApiVersion`           | API version negotiation                                |
| `IdempotencyPlug`      | Idempotency key handling for safe retries              |
| `SentryContext`        | Enriches Sentry error context with request metadata    |
| `RequireAuth`          | Halts unauthenticated requests                         |
| `RequireAdmin`         | Halts non-admin requests                               |
| `AuditLogPlug`         | Logs admin/sensitive actions to audit trail             |
| `LevelGatePlug`        | Gates features behind gamification level requirements  |
| `PremiumGatePlug`      | Gates features behind premium subscription status      |
| `AuthPipeline`         | Guardian JWT authentication pipeline                   |
| `AuthErrorHandler`     | Authentication error handling                          |
| `OptionalAuthPipeline` | Optional auth for public + auth routes                 |
| `UserAuth`             | User authentication utilities                          |
| `CurrentUser`          | Assigns current user to connection                     |
| `Common`               | Common plug utilities                                  |
| `Cors`                 | CORS configuration (Corsica)                           |
| `CorrelationId`        | Distributed tracing correlation IDs                    |
| `EtagPlug`             | HTTP ETag caching (available, not in pipelines)        |
| `GeoRouter`            | Geo-based routing                                      |
| `RateLimiter`          | Rate limiter (v1)                                      |
| `RateLimitPlug`        | Generic rate limit plug                                |
| `RawBodyPlug`          | Raw body preservation (webhook signature verification) |
| `RequestContextPlug`   | Request context propagation                            |
| `TraceContext`         | Trace context propagation                              |
| `TracingPlug`          | OpenTelemetry tracing integration                      |
| `TwoFactorRateLimiter` | 2FA-specific rate limiting                             |

**Total: 29 plug modules** in `lib/cgraph_web/plugs/`.

### 15.11 Code Quality Tools

The backend enforces code quality via four static analysis tools:

| Tool                | Version | Purpose             | Command                |
| ------------------- | ------- | ------------------- | ---------------------- |
| **Credo**           | 1.7     | Linting / style     | `mix credo --strict`   |
| **Dialyxir**        | 1.4     | Static type analysis| `mix dialyzer`         |
| **Sobelow**         | 0.14    | Security scanning   | `mix sobelow`          |
| **MixAudit**        | 2.1     | Deps vulnerability   | `mix deps.audit`       |

All four run in CI (`backend-test` job) and must pass for the quality gate.

### 15.12 Oban Background Jobs

**Oban** is used for all background job processing. Workers extend `Oban.Worker`:

```elixir
defmodule CGraph.Workers.PayoutWorker do
  use Oban.Worker,
    queue: :payouts,
    max_attempts: 3,
    unique: [period: 300]

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"creator_id" => creator_id}}) do
    # Process payout...
    :ok
  end
end
```

**Conventions:**
- Workers live under `lib/cgraph/workers/`
- Each worker specifies `queue`, `max_attempts`, and optionally `unique`/`scheduled` options
- Jobs return `:ok`, `{:ok, result}`, or `{:error, reason}`
- Oban queues are configured in `config/config.exs`

### 15.13 OpenTelemetry (Distributed Tracing)

6 OTel packages provide distributed tracing across the backend:

- `opentelemetry` / `opentelemetry_api` — core SDK and API
- `opentelemetry_phoenix` — automatic Phoenix span instrumentation
- `opentelemetry_ecto` — automatic Ecto query span instrumentation
- `opentelemetry_oban` — automatic Oban job span instrumentation
- `opentelemetry_exporter` — exports spans (OTLP protocol)

**Conventions:**
- Spans are automatically created for HTTP requests, DB queries, and Oban jobs
- Context propagation happens automatically via `opentelemetry_process_propagator`
- Custom spans use `OpenTelemetry.Tracer.with_span/2` for business-critical paths
- Telemetry config lives in `config/runtime.exs`

### 15.14 Mox (Behaviour-Based Mocking)

**Mox 1.2** is used for test-only mocking via Elixir behaviours:

- Define a `@callback`-annotated behaviour module
- Configure `Mox.defmock(MockModule, for: BehaviourModule)` in `test_helper.exs`
- Use `expect/3` and `stub/3` in tests to define mock return values
- Mox enforces that only declared callbacks are mocked (compile-time safety)

---

## 16. Technology Stack Summary

| Layer             | Technology                                         |
| ----------------- | -------------------------------------------------- |
| Frontend (Web)    | React 19, Vite, TypeScript 5.8, Tailwind CSS       |
| Frontend (Mobile) | React Native 0.81, Expo SDK 54                     |
| State Management  | Zustand 5 + TanStack Query 5                       |
| Validation        | Zod 3.24                                           |
| Animation         | Framer Motion 12, GSAP                             |
| Backend           | Elixir 1.17, Phoenix, PostgreSQL 16, Redis 7, Stripe |
| Backend i18n      | `gettext ~> 0.26` for Elixir internationalization    |
| Backend JWT       | `guardian ~> 2.4` + `jose ~> 1.11` for JWT/JWS       |
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

## 17. Architectural Enforcement Summary

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
