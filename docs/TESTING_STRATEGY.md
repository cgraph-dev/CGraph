# CGraph Testing Strategy

> **Version: 2.0.0** | Last Updated: February 2026

Comprehensive testing approach across all CGraph applications.

---

## Testing Philosophy

1. **Test at the right level** - Unit tests for logic, integration for workflows, E2E for user
   journeys
2. **Fast feedback** - Tests should run quickly; slow tests are skipped locally but run in CI
3. **Deterministic** - No flaky tests; fix or delete them
4. **Maintainable** - Clear naming, focused tests, minimal mocking

---

## Test Pyramid

```
                    ┌─────────┐
                    │   E2E   │  ← 5% - Critical user journeys
                   ─┴─────────┴─
                  ┌─────────────┐
                  │ Integration │  ← 25% - API, database, services
                 ─┴─────────────┴─
                ┌─────────────────┐
                │     Unit        │  ← 70% - Functions, components
               ─┴─────────────────┴─
```

---

## Coverage Targets

| App         | Current | Target | Priority Areas          |
| ----------- | ------- | ------ | ----------------------- |
| **Backend** | ~80%    | 80%    | Auth, E2EE, permissions |
| **Web**     | ~62%    | 70%    | Critical flows, hooks   |
| **Mobile**  | ~50%    | 60%    | Core features           |
| **Landing** | ~70%    | 80%    | Components, E2E, visual |

> **Backend**: 163 test files, 83/83 controllers covered (100%), 70 context/module tests, chaos
> testing framework, 3 integration tests, 6 channel tests. All controllers have HTTP-level tests (0
> structural-only). See `docs/OPERATIONAL_MATURITY_REGISTRY.md` for complete file inventory.
>
> **Web**: 171 test files. **Mobile**: 15 test files. **Landing**: 16 test files (11 unit, 5 E2E).

### Coverage Enforcement

- **Backend**: `coveralls.json` configured with 60% minimum threshold
  - ExCoveralls generates HTML + JSON reports in `cover/`
  - CI enforces via `MIX_ENV=test mix coveralls`
- **Web**: Vitest coverage with c8 provider
  - Threshold: 19% lines (gradually increasing)
- **Mobile**: Jest coverage
  - Threshold: 60% lines

### Infrastructure Modules (Phase 38) — Test Targets

Phase 38 introduced 26 infrastructure modules. These are primarily internal plumbing with no external
API surface, so testing focuses on unit tests for core logic and integration tests for data flows.

| Module Group | Key Modules | Test Priority | Target Coverage |
| --- | --- | --- | --- |
| Sharding | `ConsistentHash`, `ShardRouter`, `ShardManager` | High | 80% |
| Cache | `MultiTierCache`, `CacheWarmer`, `CacheInvalidator` | High | 75% |
| Archival | `Archival`, `ArchivePolicy`, `ArchivalWorker` | Medium | 70% |
| Queues | `PriorityQueue`, `DeadLetterQueue` | Medium | 75% |
| Search | `ElasticAdapter`, `SearchIndexer` | Medium | 70% |
| Monitoring | `HealthDashboard`, `Alerting`, `MetricsCollector` | Medium | 70% |
| Operations | `Runbook`, `CapacityPlanner`, `DisasterRecovery`, `PerformanceProfiler` | Low | 60% |
| CDN | `CDNManager`, `ImageOptimizer` | Low | 60% |
| Presence | `DistributedPresence` | Medium | 70% |

### Feature Modules (Phases 33-37) — Test Targets

Phases 33-37 introduced domain features with user-facing API surfaces. Testing covers contexts,
controllers, evaluators, and workers.

| Phase | Module Group | Key Modules | Test Priority | Target Coverage |
| --- | --- | --- | --- | --- |
| 33 | Rarity | `Cosmetics.Rarity` | High | 90% |
| 34 | Nodes | `Nodes`, `NodeWallet`, `NodeTransaction` | High | 85% |
| 34 | Discovery | `Discovery`, `Feed`, `PostMetric` | Medium | 75% |
| 34 | Customizations | `Customizations`, `UserCustomization` | Medium | 70% |
| 35 | Cosmetics | `Cosmetics`, `UnlockEngine`, `VisibilityRules` | High | 85% |
| 35 | Evaluators | `AchievementEval`, `CollectionEval`, `EventEval`, `LevelEval`, `PurchaseEval` | High | 90% |
| 35 | Cosmetic Schemas | `Badge`, `Nameplate`, `ProfileEffect`, `ProfileFrame`, `NameStyle` | Medium | 75% |
| 35 | Controllers | `CosmeticsController`, `BadgeController`, `NameplateController` | High | 80% |
| 36 | PaidDM | `PaidDm`, `PaidDmFile`, `PaidDmSetting` | High | 80% |
| 36 | Creators | `Creators`, `Earnings`, `Payout`, `RevenueSplit` | High | 85% |
| 36 | Boosts | `Boosts`, `Boost`, `BoostEffect` | Medium | 70% |
| 36 | Compliance | `AgeGate`, `TaxReporter` | High | 90% |
| 36 | Controllers | `CreatorController`, `PaidDmController`, `BoostController`, `TierController` | High | 80% |
| 37 | Forum Identity | `IdentityCard`, `PostCreationFlow`, `Reputation` | Medium | 75% |
| 37 | Tags/Templates | `ThreadTag`, `TagCategory`, `ThreadTemplate` | Medium | 70% |
| 37 | Social Features | `AtMention`, `ScheduledPost`, `ForumAnalytics` | Medium | 70% |
| 37 | Admin/Moderation | `CustomForum`, `ModerationLog`, `ForumPermission` | High | 80% |
| 37 | Controllers | `IdentityCardController`, `TagController`, `ForumAdminController`, `ForumModerationController` | High | 80% |
| 37 | Workers | `ScheduledPostWorker`, `ForumAnalyticsWorker`, `ReputationRecalcWorker`, `DigestWorker` | Medium | 70% |

---

## 1. Backend Testing (Elixir)

### Framework

- **ExUnit** - Built-in test framework
- **Mox** - Behavior-based mocking
- **ExMachina** - Test factories
- **Wallaby** - Browser testing (for LiveView)

### Directory Structure

```
apps/backend/
├── test/
│   ├── support/
│   │   ├── channel_case.ex      # Channel test helpers
│   │   ├── conn_case.ex         # Controller test helpers
│   │   ├── data_case.ex         # Ecto test helpers
│   │   └── factory.ex           # ExMachina factories
│   │
│   ├── cgraph/                   # Unit tests (70 files)
│   │   ├── accounts/
│   │   │   ├── user_test.exs
│   │   │   └── auth_test.exs
│   │   ├── messaging/
│   │   │   ├── message_test.exs
│   │   │   └── channel_test.exs
│   │   ├── e2ee/
│   │   │   ├── key_bundle_test.exs
│   │   │   └── session_test.exs
│   │   ├── forums/              # Forum context tests
│   │   ├── gamification/        # Gamification context tests
│   │   ├── billing/             # Billing context tests
│   │   ├── admin/               # Admin context tests
│   │   └── security/            # Security-specific tests
│   │       ├── auth_test.exs
│   │       ├── authorization_test.exs
│   │       └── input_validation_test.exs
│   │
│   ├── cgraph_web/               # Integration tests
│   │   ├── controllers/
│   │   │   ├── auth_controller_test.exs
│   │   │   └── message_controller_test.exs
│   │   ├── channels/
│   │   │   └── room_channel_test.exs
│   │   └── security/
│   │       └── rate_limiting_test.exs
│   │
│   └── test_helper.exs
```

### Test Examples

#### Unit Test (Pure Logic)

```elixir
# test/cgraph/accounts/user_test.exs
defmodule CGraph.Accounts.UserTest do
  use CGraph.DataCase, async: true

  alias CGraph.Accounts.User

  describe "changeset/2" do
    test "validates email format" do
      changeset = User.changeset(%User{}, %{email: "invalid"})
      assert %{email: ["has invalid format"]} = errors_on(changeset)
    end

    test "validates username length" do
      changeset = User.changeset(%User{}, %{username: "ab"})
      assert %{username: ["should be at least 3 characters"]} =
        errors_on(changeset)
    end

    test "rejects reserved usernames" do
      reserved = ~w[admin root system cgraph support]

      for username <- reserved do
        changeset = User.changeset(%User{}, %{username: username})
        assert %{username: ["is reserved"]} = errors_on(changeset)
      end
    end
  end
end
```

#### Integration Test (Database + API)

```elixir
# test/cgraph_web/controllers/message_controller_test.exs
defmodule CGraphWeb.MessageControllerTest do
  use CGraphWeb.ConnCase

  import CGraph.Factory

  setup do
    user = insert(:user)
    server = insert(:server, owner: user)
    channel = insert(:channel, server: server)

    conn =
      build_conn()
      |> log_in_user(user)

    {:ok, conn: conn, user: user, channel: channel}
  end

  describe "POST /channels/:channel_id/messages" do
    test "creates message with valid params", %{conn: conn, channel: channel} do
      params = %{content: "Hello, world!"}

      conn = post(conn, ~p"/api/v1/channels/#{channel.id}/messages", params)

      assert %{"id" => id, "content" => "Hello, world!"} =
        json_response(conn, 201)
      assert Messaging.get_message!(id)
    end

    test "returns 400 for empty content", %{conn: conn, channel: channel} do
      conn = post(conn, ~p"/api/v1/channels/#{channel.id}/messages", %{content: ""})

      assert %{"error" => "validation_error"} = json_response(conn, 400)
    end

    test "returns 403 for non-member", %{channel: channel} do
      other_user = insert(:user)
      conn = build_conn() |> log_in_user(other_user)

      conn = post(conn, ~p"/api/v1/channels/#{channel.id}/messages", %{
        content: "Unauthorized"
      })

      assert json_response(conn, 403)
    end
  end
end
```

### Running Tests

```bash
# All tests
mix test

# Specific file
mix test test/cgraph/accounts/user_test.exs

# Specific test by line number
mix test test/cgraph/accounts/user_test.exs:42

# With coverage
mix test --cover

# Security tests only
mix test test/cgraph/security/ test/cgraph_web/security/

# Watch mode (with mix_test_watch)
mix test.watch
```

---

## 2. Frontend Testing (React)

### Framework

- **Vitest** - Fast, Vite-native test runner
- **React Testing Library** - Component testing
- **MSW** - API mocking
- **Playwright** - E2E testing

### Directory Structure

```
apps/web/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx      # Co-located test
│   │   │   └── Button.stories.tsx   # Storybook
│   │   └── MessageInput/
│   │       ├── MessageInput.tsx
│   │       └── MessageInput.test.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── __tests__/
│   │       └── useAuth.test.ts
│   │
│   ├── lib/
│   │   ├── e2ee/
│   │   │   ├── crypto.ts
│   │   │   └── __tests__/
│   │   │       ├── crypto.test.ts
│   │   │       └── crypto.security.test.ts
│   │   └── api/
│   │       └── __tests__/
│   │           └── client.test.ts
│   │
│   └── __tests__/                    # Integration tests
│       ├── login.test.tsx
│       └── messaging.test.tsx
│
├── e2e/                              # Playwright E2E
│   ├── auth.spec.ts
│   ├── messaging.spec.ts
│   └── e2e.config.ts
│
└── vitest.config.ts
```

### Test Examples

#### Component Test

```tsx
// src/components/MessageInput/MessageInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from './MessageInput';

describe('MessageInput', () => {
  it('renders input field', () => {
    render(<MessageInput onSend={() => {}} />);

    expect(screen.getByPlaceholderText(/message/i)).toBeInTheDocument();
  });

  it('calls onSend with message content', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(<MessageInput onSend={onSend} />);

    const input = screen.getByPlaceholderText(/message/i);
    await user.type(input, 'Hello!');
    await user.keyboard('{Enter}');

    expect(onSend).toHaveBeenCalledWith('Hello!');
  });

  it('clears input after sending', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={() => {}} />);

    const input = screen.getByPlaceholderText(/message/i);
    await user.type(input, 'Hello!');
    await user.keyboard('{Enter}');

    expect(input).toHaveValue('');
  });

  it('disables send when input is empty', () => {
    render(<MessageInput onSend={() => {}} />);

    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
  });
});
```

#### Hook Test

```tsx
// src/hooks/__tests__/useAuth.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { AuthProvider } from '../../providers/AuthProvider';

describe('useAuth', () => {
  it('provides user after login', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('clears user on logout', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // First login
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Then logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

#### E2E Test (Playwright)

```typescript
// e2e/messaging.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Messaging', () => {
  test.beforeEach(async ({ page }) => {
    // Login helper
    await page.goto('/login');
    await page.fill('[name="email"]', 'e2e@test.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/channels/*');
  });

  test('user can send a message', async ({ page }) => {
    // Navigate to a channel
    await page.click('text=general');

    // Type and send message
    const input = page.locator('[data-testid="message-input"]');
    await input.fill('Hello from E2E test!');
    await input.press('Enter');

    // Verify message appears
    await expect(page.locator('text=Hello from E2E test!')).toBeVisible();
  });

  test('message appears in real-time for other user', async ({ browser }) => {
    // Create two browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login as different users
    await loginAs(page1, 'user1@test.com');
    await loginAs(page2, 'user2@test.com');

    // Both join same channel
    await page1.click('text=general');
    await page2.click('text=general');

    // User 1 sends message
    await page1.locator('[data-testid="message-input"]').fill('Real-time test');
    await page1.locator('[data-testid="message-input"]').press('Enter');

    // User 2 sees it without refresh
    await expect(page2.locator('text=Real-time test')).toBeVisible({
      timeout: 5000,
    });
  });
});
```

### Running Tests

```bash
# Unit and component tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# Security tests only
pnpm test:security

# E2E tests
pnpm test:e2e

# E2E with UI
pnpm test:e2e --ui
```

---

## 3. Landing Testing (React + Vite)

### Framework

- **Vitest 3.2** — Unit test runner with jsdom environment
- **@testing-library/react 16** — Component rendering + queries
- **@testing-library/user-event 14** — Realistic user interaction simulation
- **Playwright 1.58** — E2E testing with Chromium
- **Lighthouse CI 0.15** — Performance budget enforcement

### Test Inventory (16 files, 98 tests)

**Unit tests (11 files, 63 tests):**

| File                     | Tests | Covers                                   |
| ------------------------ | ----- | ---------------------------------------- |
| `App.test.tsx`           | 3     | Module imports, smoke test               |
| `Logo.test.tsx`          | 5     | Logo rendering, alt text, dimensions     |
| `ErrorBoundary.test.tsx` | 8     | Error catching, fallback UI, recovery    |
| `Navigation.test.tsx`    | 10    | Links, mobile toggle, active states      |
| `SEO.test.tsx`           | 9     | Meta tags, JSON-LD, OG/Twitter cards     |
| `Footer.test.tsx`        | 6     | Link sections, copyright, legal links    |
| `CTA.test.tsx`           | 4     | Badge, buttons, description              |
| `Hero.test.tsx`          | 7     | Heading, CTAs, trust badges, a11y        |
| `Features.test.tsx`      | 4     | Header, description, feature cards       |
| `Security.test.tsx`      | 4     | Badge, PQXDH, Triple Ratchet mentions    |
| `NotFound.test.tsx`      | 4     | Error message, back link, resource links |

**E2E tests (5 files, 35 tests):**

| File                    | Tests | Covers                                               |
| ----------------------- | ----- | ---------------------------------------------------- |
| `landing.spec.ts`       | 9     | Hero, sections, nav, footer, SEO meta                |
| `navigation.spec.ts`    | 5     | Routing, legal pages, 404, mobile toggle             |
| `accessibility.spec.ts` | 7     | Skip link, focus, alt text, headings, lang           |
| `performance.spec.ts`   | 7     | Load time, fonts, lazy loading, CSP, hints           |
| `visual.spec.ts`        | 7     | Screenshot baselines (hero, nav, footer, 404, about) |

### Animation Mocking

GSAP and Framer Motion are JS-driven animation libraries that cause non-deterministic test results.
Both are mocked using a Proxy pattern that returns no-op functions:

```typescript
// vitest.setup.ts
vi.mock('gsap', () => new Proxy({}, { get: () => () => ({}) }));
vi.mock(
  'framer-motion',
  () =>
    new Proxy(
      {},
      {
        get: (_, prop) => {
          if (prop === 'motion') return new Proxy({}, { get: (_, tag) => tag });
          return () => ({});
        },
      }
    )
);
```

### Visual Regression

- Baselines stored in `e2e/visual.spec.ts-snapshots/` (committed to repo)
- Generated on Linux/Chromium — CI must match the same OS family
- Animations disabled via `prefers-reduced-motion: reduce` media emulation
- Font stability ensured via `document.fonts.ready` (no `waitForTimeout`)
- Threshold: 2% pixel diff (`maxDiffPixelRatio: 0.02`)
- Regenerate: `pnpm e2e -- e2e/visual.spec.ts --update-snapshots`

### Lighthouse CI

- Configuration: `lighthouserc.json`
- Builds site via `pnpm build && pnpm preview` (port 4173)
- Tests 4 URLs: `/`, `/about`, `/docs`, `/blog`
- Budgets: Performance ≥ 0.85, Accessibility ≥ 0.90, SEO ≥ 0.90
- Resource limits: JS < 500 KB, CSS < 100 KB
- Quick local audit: `pnpm lighthouse` (1 run)
- Full CI audit: `pnpm lighthouse:ci` (3 runs + assertions)

### Observability (Client-Side Only)

- **Web Vitals v5**: CLS, FCP, INP, LCP, TTFB → Plausible custom events (prod) / console (dev)
- **Error tracking**: window.error + unhandledrejection + ErrorBoundary → Plausible custom events
- Rate-limited: max 10 errors per session, deduped via Set
- No backend endpoints — purely client-side via Plausible Analytics (GDPR-compliant)

### Running Landing Tests

```bash
# Unit tests
pnpm --filter @cgraph/landing test          # Run all (63 tests)
pnpm --filter @cgraph/landing test:watch    # Watch mode

# E2E tests (auto-starts Vite dev server on port 3001)
pnpm --filter @cgraph/landing e2e           # All E2E (35 tests)
pnpm --filter @cgraph/landing e2e:ui        # Interactive UI mode
pnpm --filter @cgraph/landing e2e:headed    # Headed browser

# Performance
pnpm --filter @cgraph/landing lighthouse    # Quick Lighthouse audit
pnpm --filter @cgraph/landing lighthouse:ci # Full CI audit with budgets
```

---

## React 19 Testing Patterns

With the React 19 migration (v0.9.37), tests should use updated patterns:

### `useOptimistic` Testing

```tsx
import { renderHook, act } from '@testing-library/react';

test('optimistic update appears immediately', async () => {
  const { result } = renderHook(() => useOptimisticMessages(initialMessages));
  act(() => result.current.addOptimistic({ content: 'Sending...' }));
  expect(result.current.messages).toContainEqual(
    expect.objectContaining({ content: 'Sending...' })
  );
});
```

### `useFormStatus` Testing

```tsx
import { render, screen } from '@testing-library/react';

test('submit button disables during submission', () => {
  render(
    <form action={serverAction}>
      <SubmitButton />
    </form>
  );
  // useFormStatus reflects pending state from parent <form action=>
  expect(screen.getByRole('button')).toBeEnabled();
});
```

### `use()` Context Testing

Replace `useContext(Ctx)` with `use(Ctx)` — testing approach remains the same (wrap in provider), but ensure Suspense boundaries exist for async resources passed to `use()`.

---

## 4. Mobile Testing (React Native)

### Framework

- **Jest** - Test runner
- **React Native Testing Library** - Component testing
- **Detox** - E2E testing

### Key Test Areas

```typescript
// __tests__/screens/LoginScreen.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';

describe('LoginScreen', () => {
  it('validates email format', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'invalid');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(getByText('Invalid email format')).toBeTruthy();
    });
  });
});
```

---

## 5. CI Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: --health-cmd pg_isready --health-interval 10s
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: erlef/setup-beam@v1
        with:
          elixir-version: '1.17'
          otp-version: '27'

      - name: Install dependencies
        working-directory: apps/backend
        run: mix deps.get

      - name: Run tests
        working-directory: apps/backend
        run: mix test --cover
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost/cgraph_test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: apps/backend/cover/excoveralls.json

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - run: pnpm install

      - name: Run tests
        working-directory: apps/web
        run: pnpm test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v4

  e2e-test:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        working-directory: apps/web
        run: pnpm test:e2e
```

---

## 6. Testing Best Practices

### Do's

- ✅ Test behavior, not implementation
- ✅ Use meaningful test names that describe the scenario
- ✅ Keep tests independent and isolated
- ✅ Use factories for test data
- ✅ Test edge cases and error scenarios
- ✅ Run tests before pushing

### Don'ts

- ❌ Don't test private functions directly
- ❌ Don't write tests that depend on test order
- ❌ Don't mock what you don't own
- ❌ Don't test third-party library behavior
- ❌ Don't leave skipped tests without issues
- ❌ Don't test implementation details

### Test Naming Convention

```
# Elixir
describe "function_name/arity" do
  test "behavior when condition" do
  end
end

# TypeScript
describe('ComponentName', () => {
  it('should [expected behavior] when [condition]', () => {
  });
});
```

---

## 7. Mocking Strategy

### When to Mock

| Mock          | Use Case                              |
| ------------- | ------------------------------------- |
| External APIs | Third-party services (Stripe, email)  |
| Time          | Date-dependent logic                  |
| Randomness    | Crypto, UUIDs when determinism needed |
| File system   | Large file operations                 |

### When NOT to Mock

| Don't Mock                | Instead                              |
| ------------------------- | ------------------------------------ |
| Database                  | Use test database with transactions  |
| Your own modules          | Test them together                   |
| HTTP in integration tests | Use test server                      |
| Everything                | Mocking too much means testing mocks |

---

<sub>**CGraph Testing Strategy** • Version 0.9.37</sub>
