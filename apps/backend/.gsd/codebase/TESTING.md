# CGraph Testing Patterns

> Auto-generated codebase mapping document. Source: analysis of test configs, test files, CI
> workflows, and coverage settings across the monorepo.

---

## 1. Test Frameworks Overview

| App/Package           | Framework      | Test Runner       | Environment               | Config File                         |
| --------------------- | -------------- | ----------------- | ------------------------- | ----------------------------------- |
| `apps/web`            | **Vitest**     | Vitest (via Vite) | jsdom                     | `apps/web/vite.config.ts`           |
| `apps/mobile`         | **Jest**       | jest-expo         | React Native              | `apps/mobile/jest.config.js`        |
| `apps/landing`        | **Vitest**     | Vitest (via Vite) | jsdom                     | `apps/landing/vitest.config.ts`     |
| `apps/backend`        | **ExUnit**     | `mix test`        | Elixir                    | `apps/backend/test/`                |
| `packages/crypto`     | **Vitest**     | Vitest            | node                      | `packages/crypto/vitest.config.ts`  |
| `packages/utils`      | **Vitest**     | Vitest            | node                      | (inferred from package)             |
| `packages/api-client` | **Vitest**     | Vitest            | node                      | (inferred from package)             |
| `packages/socket`     | **Vitest**     | Vitest            | node                      | (inferred from package)             |
| **E2E (web)**         | **Playwright** | Playwright Test   | Chromium, Firefox, WebKit | `apps/web/playwright.config.ts`     |
| **E2E (landing)**     | **Playwright** | Playwright Test   | Chromium                  | `apps/landing/playwright.config.ts` |

### Supporting Libraries

- **@testing-library/react** — component testing (web)
- **@testing-library/react-native** — component testing (mobile)
- **@testing-library/jest-dom** — DOM assertion matchers
- **MSW (Mock Service Worker)** — API mocking for unit/integration tests (web)
- **Storybook** — component development and visual testing (web + mobile)

> **Note — Vitest Version Fragmentation**: Shared packages use different Vitest versions: `^1.0.0`
> (crypto, utils, api-client), `^1.6.0` (socket), `^3.0.0` (animation-constants). `shared-types` has
> no Vitest (no tests). Web uses `^3.1.0`, landing uses `^3.2.4`.

---

## 2. Test File Organization & Naming

### File Naming Convention

| Type              | Pattern                                 | Example                                                    |
| ----------------- | --------------------------------------- | ---------------------------------------------------------- |
| Unit tests        | `{name}.test.ts(x)`                     | `authStore.test.ts`, `button.test.tsx`                     |
| Spec tests        | `{name}.spec.ts(x)`                     | `auth.spec.ts`, `navigation.spec.ts`                       |
| Integration tests | `{name}.test.ts` in `test/integration/` | `api.test.ts`, `websocket.test.ts`                         |
| E2E tests         | `{name}.spec.ts` in `e2e/`              | `auth.spec.ts`, `messaging.spec.ts`                        |
| E2E setup         | `{name}.setup.ts` in `e2e/`             | `auth.setup.ts`                                            |
| Test setup        | `setup.ts` in `test/`                   | `src/test/setup.ts`                                        |
| Test utilities    | `utils.tsx` in `test/`                  | `src/test/utils.tsx` (mobile only; web has no `utils.tsx`) |

### Directory Structure

```
apps/web/src/
├── test/
│   ├── setup.ts              # Global Vitest setup (MSW, mocks, cleanup)
│   ├── __mocks__/            # Module-level stubs (framer-motion, heroicons-outline, heroicons-solid, heroicons-20-solid)
│   ├── mocks/                # (empty — MSW handlers in src/mocks/)
│   ├── fixtures/             # Test data fixtures (currently empty)
│   └── integration/
│       ├── api.test.ts       # API client integration tests
│       ├── app.test.tsx      # App-level integration tests
│       └── websocket.test.ts # WebSocket integration tests
├── mocks/
│   └── handlers.ts           # MSW request handlers (570 lines)
├── stores/__tests__/         # Store unit tests
│   ├── authStore.test.ts
│   ├── chatStore.test.ts
│   └── ... (16 store test files)
├── hooks/__tests__/          # Hook unit tests (9 direct + 7 facade tests = 16)
│   ├── useDebounce.test.ts
│   ├── useClickOutside.test.ts
│   └── ... (9 hook test files + hooks/facades/__tests__/ with 7 facade tests)
├── components/__tests__/     # Component unit tests
│   ├── modal.test.tsx
│   ├── toast.test.tsx
│   └── ... (5 component test files)
├── lib/__tests__/            # Library unit tests
└── modules/*/
    ├── store/__tests__/      # Module-specific store tests
    └── ...

apps/web/e2e/                 # Playwright E2E tests
├── auth.setup.ts             # Authentication fixture
├── auth.spec.ts
├── messaging.spec.ts
├── navigation.spec.ts
├── groups-forums.spec.ts
├── premium.spec.ts
└── accessibility.spec.ts

apps/mobile/src/
├── test/
│   ├── setup.ts              # Jest setup (Expo mocks, RN mocks)
│   └── utils.tsx             # Custom render with providers, mock factories
├── components/__tests__/     # Component tests
├── stores/__tests__/         # Store tests
├── hooks/__tests__/          # Hook tests
└── ...
```

### Test File Matching

**Vitest (web):**

```typescript
include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'];
```

**Jest (mobile):**

```javascript
testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'];
```

---

## 3. Unit Test Patterns

### 3.1 Zustand Store Tests

**Pattern**: Direct state manipulation via `getState()`/`setState()` without rendering.

```typescript
// apps/web/src/stores/__tests__/authStore.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { useAuthStore, mapUserFromApi } from '@/modules/auth/store';

// Reset store state after each test
afterEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
});

describe('authStore', () => {
  describe('mapUserFromApi', () => {
    it('should correctly map API user response to User type', () => {
      const user = mapUserFromApi(mockApiUser);
      expect(user.id).toBe('user-123');
      expect(user.displayName).toBe('Test User');
    });

    it('should handle missing optional fields with defaults', () => {
      const user = mapUserFromApi({ id: 'user-456', email: 'test@example.com' });
      expect(user.level).toBe(1);
      expect(user.xp).toBe(0);
    });
  });

  describe('state management', () => {
    it('should have initial unauthenticated state', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should update state when setting authenticated user', () => {
      useAuthStore.setState({
        user: mapUserFromApi(mockApiUser),
        token: 'test-token',
        isAuthenticated: true,
      });
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should not affect other state when clearing error', () => {
      useAuthStore.setState({ user: mapUserFromApi(mockApiUser), error: 'Some error' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
      expect(useAuthStore.getState().user?.id).toBe('user-123');
    });
  });
});
```

**Key patterns:**

- `afterEach` resets store to initial state (stores have a `reset()` method)
- Direct `getState()` for reading, `setState()` for writing
- Tests are synchronous — no component rendering needed
- Mock data objects defined at top of file

### 3.2 React Component Tests (Web — Vitest + Testing Library)

```typescript
// apps/web/src/components/__tests__/modal.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Modal } from '../ui/modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  };

  beforeEach(() => { vi.clearAllMocks(); });

  it('renders nothing when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the modal with title when open', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('sets aria-modal and aria-labelledby attributes', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

**Key patterns:**

- `defaultProps` object for reusable base props
- `vi.fn()` for mock functions
- `screen.getByRole()` / `screen.getByText()` for queries (accessibility-first)
- Accessibility attributes tested explicitly
- `beforeEach(() => vi.clearAllMocks())` for clean state

### 3.3 React Native Component Tests (Mobile — Jest + Testing Library)

```typescript
// apps/mobile/src/components/__tests__/button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../button';

// Mock theme store inline
jest.mock('@/stores', () => ({
  useThemeStore: () => ({
    colorScheme: 'light',
    colors: { primary: '#10b981', /* ... */ },
  }),
}));

describe('Button', () => {
  it('renders with children text', () => {
    const { getByText } = render(<Button>Click Me</Button>);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>Press</Button>);
    fireEvent.press(getByText('Press'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress} loading>Loading</Button>);
    fireEvent.press(getByText('Loading'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### 3.4 Hook Tests

```typescript
// apps/web/src/hooks/__tests__/useDebounce.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 500 },
    });

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // Not updated yet

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated'); // Now updated
  });
});
```

**Key patterns:**

- `vi.useFakeTimers()` / `vi.useRealTimers()` for timer-dependent hooks
- `renderHook()` from `@testing-library/react`
- `act()` wrapping for state updates
- `rerender()` for simulating prop changes

### 3.5 Utility/Package Tests

```typescript
// packages/utils/src/__tests__/validation.test.ts
import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidUsername, getPasswordStrength } from '../validation';

describe('isValidEmail', () => {
  it('should validate correct emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
  });
});
```

**Pattern**: Pure function tests — no mocking, no DOM, simple input/output.

---

## 4. Integration Test Patterns

### API Integration Tests

```typescript
// apps/web/src/test/integration/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios at module level
vi.mock('axios', () => ({
  default: { create: vi.fn().mockReturnValue(mockAxiosInstance) },
  create: vi.fn().mockReturnValue(mockAxiosInstance),
  isAxiosError: (error: unknown) => error instanceof Error && 'isAxiosError' in error,
}));

describe('API Client', () => {
  it('should create axios instance with correct base URL', () => {
    axios.create({ baseURL: 'http://localhost:4000/api/v1', timeout: 10000 });
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'http://localhost:4000/api/v1' })
    );
  });
});
```

Integration test location: `apps/web/src/test/integration/`

---

## 5. E2E Test Patterns (Playwright)

### Configuration

```typescript
// apps/web/playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ...(process.env.CI ? [['github']] : []),
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: '...' },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: '...' },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'], storageState: '...' },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'], storageState: '...' },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  timeout: 30_000,
  expect: { timeout: 10_000 },
});
```

**5 browser targets**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari.

### Authentication Setup (Shared State)

```typescript
// apps/web/e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  if (process.env.SKIP_AUTH === 'true') {
    await page.context().storageState({ path: authFile });
    return;
  }

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@cgraph.dev');
  await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'testpassword123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|home)?/);

  // Save signed-in state for other tests
  await page.context().storageState({ path: authFile });
});
```

### E2E Test Example

```typescript
// apps/web/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/email.*required/i)).toBeVisible();
    await expect(page.getByText(/password.*required/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('invalid@test.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible({ timeout: 10000 });
  });

  test('should have link to forgot password', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.getByRole('link', { name: /forgot.*password/i });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/\/(forgot-password|reset)/);
  });
});
```

**Key patterns:**

- Resilient locators: `getByRole`, `getByLabel`, `getByText` with regex patterns
- Tolerant matchers: `/sign in|log in/i` to handle UI text variations
- Explicit timeouts for async operations
- Page Object pattern not used (flat spec files)
- E2E tests are in `apps/web/e2e/` (separate from unit tests)

### E2E Test Files

| File                    | Coverage                                |
| ----------------------- | --------------------------------------- |
| `auth.setup.ts`         | Authentication fixture                  |
| `auth.spec.ts`          | Login, register, logout, password reset |
| `messaging.spec.ts`     | Chat and messaging flows                |
| `navigation.spec.ts`    | Routing and navigation                  |
| `groups-forums.spec.ts` | Group/forum features                    |
| `premium.spec.ts`       | Premium subscription flows              |
| `accessibility.spec.ts` | WCAG compliance checks                  |

---

## 6. Test Utilities & Helpers

### Web Test Setup (`apps/web/src/test/setup.ts`)

The global setup file:

1. **MSW server** — intercepts HTTP requests with mock handlers
2. **Module mocks** — stubs heavy libraries (framer-motion, heroicons, animation-presets, logger)
3. **UI component mocks** — stub barrel exports (`@/components/ui`, `@/shared/components/ui`)
4. **Browser API mocks** — `matchMedia`, `IntersectionObserver`, `ResizeObserver`
5. **Console filtering** — suppresses React warnings in test output
6. **Cleanup** — `afterEach(() => { server.resetHandlers(); cleanup(); })`

```typescript
// Key setup excerpts
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  cleanup(); // @testing-library/react cleanup
});
afterAll(() => server.close());

export { server }; // Exported for per-test handler overrides
```

### Heavy Module Stubs (Vite Alias Strategy)

Instead of `vi.mock()` which can cause Vitest to hang in jsdom, heavy modules are redirected at the
Vite resolver level:

```typescript
// apps/web/vite.config.ts — test-only aliases
...(process.env.VITEST ? {
  'framer-motion': path.resolve(__dirname, './src/test/__mocks__/framer-motion.tsx'),
  '@heroicons/react/24/outline': path.resolve(__dirname, './src/test/__mocks__/heroicons-outline.tsx'),
} : {}),
```

### Mobile Test Utilities (`apps/mobile/src/test/utils.tsx`)

Custom render function wrapping all required providers:

```tsx
// Custom render with all providers
function createWrapper(options: WrapperOptions = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <GestureHandlerRootView>
        <SafeAreaProvider>
          <NavigationContainer>
            <QueryClientProvider client={queryClient}>
              <E2EEProvider>{children}</E2EEProvider>
            </QueryClientProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  };
}

// Custom render function
export function renderWithProviders(ui: ReactElement, options?: CustomRenderOptions) {
  const wrapper = createWrapper(options?.wrapperOptions);
  return render(ui, { wrapper, ...options });
}
```

### Mock Data Factories

```typescript
// apps/mobile/src/test/utils.tsx
export function createMockUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: 'user-test-123',
    email: 'test@example.com',
    username: 'testuser',
    status: 'online',
    ...overrides,
  };
}

export function createMockMessage(overrides = {}) {
  return {
    id: 'msg-test-123',
    content: 'Test message content',
    sender_id: 'user-test-123',
    ...overrides,
  };
}
```

---

## 7. Mocking Patterns

### MSW Handlers (Web)

```typescript
// apps/web/src/mocks/handlers.ts (570 lines)
import { http, HttpResponse, delay } from 'msw';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Mock data factories
const mockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'demo@example.com',
  username: 'demo',
  ...overrides,
});

// Request handlers
export const handlers = [
  http.post(`${API_BASE}/api/v1/auth/login`, async ({ request }) => {
    await delay(100);
    const body = await request.json();
    if (body.identifier === 'test@example.com') {
      return HttpResponse.json({
        data: { user: mockUser(), tokens: { access_token: 'mock-jwt', refresh_token: 'mock-rt' } },
      });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),
  // ... comprehensive handlers for all API endpoints
];
```

### Per-Test Handler Overrides

```typescript
import { server } from '../test/setup';
import { http, HttpResponse } from 'msw';

it('handles server error', async () => {
  server.use(
    http.get('/api/v1/me', () => HttpResponse.json({ error: 'Internal error' }, { status: 500 }))
  );
  // ... test error handling
});
```

### Vitest Mocking (Web)

```typescript
// Function mocks
const onClose = vi.fn();

// Module mocks (in setup.ts or individual tests)
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Timer mocks
vi.useFakeTimers();
vi.advanceTimersByTime(500);
vi.useRealTimers();
```

### Jest Mocking (Mobile)

```typescript
// Module mocks (in test files)
jest.mock('@/stores', () => ({
  useThemeStore: () => ({
    colorScheme: 'light',
    colors: {
      /* ... */
    },
  }),
}));

// Expo module mocks (in setup.ts)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
  },
}));
```

---

## 8. Backend (ExUnit) Test Patterns

### 8.1 Test Support Modules

Backend tests use three case templates:

| Case Template        | Purpose                                  | Imports                                   |
| -------------------- | ---------------------------------------- | ----------------------------------------- |
| `CGraph.DataCase`    | Context/model tests (DB access)          | `Repo`, `Ecto`, `Ecto.Changeset`, `Ecto.Query` |
| `CGraphWeb.ConnCase` | Controller/API tests (HTTP requests)     | `Plug.Conn`, `Phoenix.ConnTest`, verified routes |
| `CGraphWeb.ChannelCase` | WebSocket channel tests               | `Phoenix.ChannelTest`                      |

All cases use Ecto SQL Sandbox for test isolation with automatic transaction rollback.

### 8.2 Factory Pattern (ExMachina)

Test data is generated via `CGraph.Factory` using ExMachina:

```elixir
import CGraph.Factory

# Build unsaved struct
user = build(:user)

# Insert into database
user = insert(:user, email: "custom@test.com")

# Build a list
users = build_list(5, :user)

# Insert with associations
message = insert(:message, sender: insert(:user))
```

Factory is in `test/support/factory.ex` (~786 lines) with factories for all domain entities:
users, admins, forums, threads, posts, messages, achievements, quests, avatar borders,
user ownership records, etc.

### 8.3 Controller Test Pattern

```elixir
# test/cgraph_web/controllers/wallet_auth_controller_test.exs
defmodule CGraphWeb.WalletAuthControllerTest do
  use CGraphWeb.ConnCase, async: false

  alias CGraph.Accounts.WalletAuth
  import CgraphWeb.UserFixtures

  @valid_pin "123456"

  setup do
    {:ok, wallet_address} = WalletAuth.generate_wallet_address()
    %{wallet_address: wallet_address}
  end

  describe "POST /api/v1/auth/wallet/generate" do
    test "generates valid wallet credentials", %{conn: conn} do
      conn = post(conn, ~p"/api/v1/auth/wallet/generate")
      assert %{"wallet_address" => addr} = json_response(conn, 200)
      assert String.starts_with?(addr, "0x")
    end
  end
end
```

**Key patterns:**
- `use CGraphWeb.ConnCase` provides `build_conn()` and `json_response/2`
- `describe` blocks group by endpoint: `"POST /api/v1/..."`, `"GET /api/v1/..."`
- `setup` block creates shared test data (fixtures or factory)
- Auth via `put_req_header("authorization", "Bearer #{token}")`
- Route sigils: `~p"/api/v1/auth/wallet/generate"`
- Pattern match on `json_response(conn, status_code)` for assertions
- Comment section headers (`# ===`) separate test groups

### 8.4 Context/Integration Test Pattern

```elixir
# test/cgraph/gamification_test.exs
defmodule CGraph.GamificationTest do
  use CGraph.DataCase, async: true
  use CGraphWeb.ConnCase

  import CGraph.Factory
  import Phoenix.ChannelTest

  setup do
    user = insert(:user)
    conn = build_conn()
      |> put_req_header("accept", "application/json")
      |> put_req_header("authorization", "Bearer #{generate_token(user)}")
    %{conn: conn, user: user}
  end

  describe "GET /api/v1/cosmetics/borders" do
    test "returns paginated list", %{authed_conn: conn} do
      insert_list(15, :avatar_border)
      response = conn |> get("/api/v1/cosmetics/borders") |> json_response(200)
      assert is_list(response["borders"])
    end
  end
end
```

**Features:**
- `async: true` for parallel execution (when no shared state)
- Factory-based data setup in `setup` block
- Direct Repo assertions for verifying side effects
- Multi-case usage (`DataCase` + `ConnCase`) for hybrid tests

### 8.5 Backend Test File Organization

**Total backend test files: ~191** (excluding `test/support/`). Coverage tool: `ExCoveralls ~> 0.18`
(configured via `test_coverage: [tool: ExCoveralls]` in `mix.exs`). Run with `mix coveralls`.

```
test/
├── test_helper.exs
├── support/
│   ├── data_case.ex            # DB test case (sandbox)
│   ├── conn_case.ex            # HTTP test case
│   ├── channel_case.ex         # WebSocket test case
│   ├── factory.ex              # ExMachina factories (~786 lines)
│   ├── fixtures.ex             # Test fixtures
│   └── aliases.ex              # Common aliases
├── cgraph/                     # Context tests (92 test files)
│   ├── accounts_test.exs
│   ├── gamification_test.exs
│   ├── forums_test.exs
│   ├── messaging_test.exs
│   ├── subscriptions_test.exs
│   └── ...                     # auth/, chaos/, crypto/, forums/, etc.
├── cgraph_web/
│   ├── controllers/            # Controller tests (82 files)
│   │   ├── wallet_auth_controller_test.exs
│   │   ├── gamification_controller_test.exs
│   │   ├── shop_controller_test.exs
│   │   ├── stripe_webhook_controller_test.exs
│   │   └── ...                 # admin/, api/ subdirs
│   ├── channels/               # Channel tests (6 files)
│   │   ├── chat_channel_test.exs
│   │   └── ...
│   └── plugs/                  # Plug tests (1 file: cookie_auth_test.exs)
└── integration/
```

### 8.6 Test Gaps (New Modules Without Tests)

The following recently-added modules do **not yet have corresponding test files:**

| Module                                          | Expected Test Location                                |
| ----------------------------------------------- | ----------------------------------------------------- |
| `CGraph.Creators.*` (9 modules)                 | `test/cgraph/creators_test.exs`                        |
| `CGraphWeb.API.V1.CreatorController` (242 lines)| `test/cgraph_web/controllers/api/v1/creator_controller_test.exs` |
| `CGraphWeb.CoinShopController`                  | `test/cgraph_web/controllers/coin_shop_controller_test.exs` |
| `CGraphWeb.GamificationChannel` (expanded)      | `test/cgraph_web/channels/gamification_channel_test.exs` |
| `CGraphWeb.IapController`                       | `test/cgraph_web/controllers/iap_controller_test.exs`  |
| `CGraphWeb.API.V1.CreatorAnalyticsController`   | `test/cgraph_web/controllers/api/v1/creator_analytics_controller_test.exs` |
| `CGraph.Shop.CoinBundles`                       | `test/cgraph/shop/coin_bundles_test.exs`               |
| `CGraph.Shop.CoinCheckout`                      | `test/cgraph/shop/coin_checkout_test.exs`              |
| `CGraph.Shop.CoinPurchase`                      | `test/cgraph/shop/coin_purchase_test.exs`              |
| `CGraph.Collaboration.Document`                 | `test/cgraph/collaboration/document_test.exs`          |
| `CGraph.Collaboration.DocumentServer`           | `test/cgraph/collaboration/document_server_test.exs`   |

The `factory.ex` also lacks factories for:
- `paid_forum_subscription`
- `creator_earning`
- `creator_payout`
- `coin_purchase`

### 8.7 Integration Tests

9 integration test files exist under `test/integration/`:

| File                                        | Purpose                              |
| ------------------------------------------- | ------------------------------------ |
| `e2ee_messaging_integration_test.exs`       | End-to-end encrypted messaging flows |
| `phase5_verification_test.exs`              | Phase 5 feature verification         |
| `phase9_verification_test.exs`              | Phase 9 feature verification         |
| `phase12_verification_test.exs`             | Phase 12 feature verification        |
| `phase13_verification_test.exs`             | Phase 13 feature verification        |
| `phase14_verification_test.exs`             | Phase 14 feature verification        |
| `phase14_uat_test.exs`                      | Phase 14 UAT acceptance tests        |
| `real_time_messaging_integration_test.exs`  | Real-time messaging integration      |
| `voice_message_storage_integration_test.exs`| Voice message storage flows          |

### 8.8 Nested Test Directory Structure

`test/cgraph/` contains subdirectories for specialized test domains:

```
test/cgraph/
├── auth/              # Authentication-specific tests
├── chaos/             # Chaos engineering / resilience tests
├── crypto/            # Cryptography tests
├── forums/            # Forum domain tests
├── messaging/         # Messaging domain tests
├── moderation/        # Content moderation tests
├── performance/       # Performance benchmark tests
├── query/             # Query/filter tests
├── services/          # Service layer tests
├── subscriptions/     # Subscription domain tests
├── webrtc/            # WebRTC signaling tests
├── accounts_test.exs
├── gamification_test.exs
└── ...                # Other top-level context tests
```

### 8.9 Mox (Behaviour-Based Mocking)

**Mox 1.2** is a test dependency for behaviour-based mocking:

```elixir
# In test_helper.exs
Mox.defmock(CGraph.MockStripeClient, for: CGraph.StripeClientBehaviour)

# In test files
import Mox

setup :verify_on_exit!

test "processes payment" do
  expect(CGraph.MockStripeClient, :create_charge, fn _params ->
    {:ok, %{id: "ch_123"}}
  end)

  assert {:ok, _} = Payments.charge(user, amount)
end
```

**Conventions:**
- Define behaviours with `@callback` for any external service dependency
- Mock modules are defined once in `test_helper.exs` or `test/support/`
- Use `setup :verify_on_exit!` to ensure all expectations are fulfilled
- Prefer `expect/3` (strict) over `stub/3` (lenient) for test precision

### 8.10 Floki (HTML Parsing in Tests)

**Floki** is a test dependency used for HTML response assertions:

```elixir
html = html_response(conn, 200)
assert Floki.find(html, "h1") |> Floki.text() =~ "Welcome"
assert Floki.find(html, ".error-message") == []
```

Useful for testing LiveView or HTML-rendered responses alongside JSON API tests.

### 8.11 Async Test Guidance

| Setting          | When to use                                        |
| ---------------- | -------------------------------------------------- |
| `async: true`    | No shared DB state, no channels, pure logic tests  |
| `async: false`   | DB operations (Ecto sandbox), channel tests, tests sharing global state |

**Rules of thumb:**
- `CGraph.DataCase` tests that insert/read data: use `async: false` (or rely on sandbox checkout)
- `CGraphWeb.ConnCase` controller tests with DB access: typically `async: false`
- `CGraphWeb.ChannelCase` channel tests: always `async: false`
- Pure logic tests with no side effects: prefer `async: true` for speed
- When in doubt, use `async: false` — correctness over speed

---

## 9. Coverage Configuration & Targets

### Web (Vitest + v8)

```typescript
// apps/web/vite.config.ts
coverage: {
  enabled: true,
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  reportsDirectory: './coverage',
  exclude: [
    'node_modules/**', 'dist/**', '**/*.d.ts',
    '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}',
    '**/test/**', '**/mocks/**',
    'src/data/**', '**/constants.ts',        // Static data
    '**/unicode-emojis.ts', '**/presets.ts', // Static data (no logic)
    'src/components/enhanced/ui/holographic-ui/**',  // Experimental
    'src/components/enhanced/ui/holographic-ui-v4/**', // Experimental
    'src/themes/presets/theme-template.ts',  // Static config
    'src/pages/**',                           // Tested via E2E
  ],
  thresholds: {
    statements: 40,
    branches: 55,
    functions: 50,
    lines: 40,
  },
}
```

### Mobile (Jest)

```javascript
// apps/mobile/jest.config.js
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/index.{ts,tsx}',
  '!src/types/**',
  '!src/test/**',
],
coverageThreshold: {
  global: { branches: 60, functions: 60, lines: 60, statements: 60 },
},
coverageReporters: ['text', 'lcov', 'html'],
```

### Target Coverage Goals (from `CONTRIBUTING.md`)

| Package          | Target | Current (approx) |
| ---------------- | ------ | ---------------- |
| `packages/utils` | 90%    | ~80%             |
| `apps/backend`   | 60%    | ~82%             |
| `apps/web`       | 60%    | ~20%             |
| `apps/mobile`    | 60%    | ~25%             |

**Ratchet approach**: CI thresholds are set just above current levels and raised incrementally. PRs
must not decrease coverage.

---

## 10. Test Commands

### Root Level (Turborepo)

```bash
pnpm test              # Run all tests across workspace
pnpm lint              # ESLint across workspace
pnpm typecheck         # TypeScript checks across workspace
pnpm format:check      # Prettier check (no writes)
```

### Web App

```bash
pnpm --filter @cgraph/web run test              # Vitest (watch mode)
pnpm --filter @cgraph/web run test -- --run     # Vitest (single run)
pnpm --filter @cgraph/web run test:coverage     # Vitest with coverage
pnpm --filter @cgraph/web run test:e2e          # Playwright (all browsers)
pnpm --filter @cgraph/web run test:e2e:ui       # Playwright UI mode
pnpm --filter @cgraph/web run test:e2e:headed   # Playwright headed mode
pnpm --filter @cgraph/web run test:e2e:debug    # Playwright debug mode
pnpm --filter @cgraph/web run typecheck         # tsc --noEmit
pnpm --filter @cgraph/web run lint              # ESLint (max 37 warnings)
```

### Mobile App

```bash
pnpm --filter @cgraph/mobile run test           # Jest
pnpm --filter @cgraph/mobile run test:ci        # Jest --ci --coverage --maxWorkers=2
pnpm --filter @cgraph/mobile run test:coverage  # Jest with coverage
pnpm --filter @cgraph/mobile run typecheck      # tsc --noEmit
pnpm --filter @cgraph/mobile run lint           # ESLint
```

### Backend (Elixir)

```bash
cd apps/backend
mix test                          # Run all tests
mix test --cover                  # With coverage
mix test --cover --export-coverage default  # Export for CI
mix format --check-formatted      # Formatting check
mix credo --strict                # Static analysis
mix dialyzer                      # Type checking
mix sobelow --config              # Security scanning
mix deps.audit                    # Dependency vulnerability scan
```

### Shared Packages

```bash
pnpm --filter @cgraph/utils run test -- --run
pnpm --filter @cgraph/crypto run test -- --run
pnpm --filter @cgraph/api-client run test -- --run
pnpm --filter @cgraph/socket run test -- --run
```

---

## 11. CI Test Pipeline

### Workflow: `.github/workflows/ci.yml`

Triggered on: push to `main`/`develop`, PRs to `main`/`develop`.

```
CI Pipeline
├── pr-size          # PR size check (notice >400, warn >1000 lines)
├── file-size        # Web TSX + Elixir <300/500 lines (hard fail), Mobile TSX (warn only)
├── lint             # ESLint + Prettier format:check
├── typecheck        # tsc --noEmit across workspace
├── backend-test     # mix test --cover (with Postgres + Redis)
│   ├── mix format --check-formatted
│   ├── mix credo --strict
│   ├── mix compile --warnings-as-errors
│   ├── mix test --cover --export-coverage default
│   └── mix dialyzer
├── packages-test    # Test all shared packages
│   ├── @cgraph/api-client (test + typecheck)
│   ├── @cgraph/crypto (test + typecheck)
│   ├── @cgraph/utils (test + typecheck)
│   └── @cgraph/socket (test + typecheck)
├── frontend-test    # Vitest --run --coverage + build
├── mobile-test      # Jest --ci --coverage + lint + typecheck
├── docker-build     # Build backend + web Docker images
├── coverage-report  # Combined coverage from all apps
│   └── Enforce min 40% web coverage (hard fail)
├── security         # Comprehensive security scanning
│   ├── gitleaks (secrets scanning)
│   ├── hadolint (Dockerfile linting)
│   ├── Sobelow (Elixir security)
│   ├── mix deps.audit (Hex vulnerabilities)
│   ├── pnpm audit (npm vulnerabilities)
│   ├── Syft (SBOM generation)
│   └── Grype (dependency scanning, high+ fail)
└── quality-gate     # Required status check — ALL must pass
```

### Workflow: `.github/workflows/e2e.yml`

Triggered on: push to `main`, PRs to `main`/`develop`, nightly at 4 AM UTC.

```
E2E Pipeline
├── e2e-web
│   ├── Services: Postgres 16, Redis 7.2
│   ├── Install Playwright browsers (chromium only in CI)
│   ├── Build web app
│   ├── Run Playwright tests (SKIP_AUTH=true for CI)
│   └── Upload: playwright-report, playwright-results artifacts
├── e2e-mobile (nightly/tagged only, macos-latest)
│   └── Maestro mobile E2E tests
└── e2e-complete (gate, needs: e2e-web)
    └── Summary and status check
```

### Workflow: `.github/workflows/coverage.yml`

Triggered on: push to `main`, PRs to `main`.

Runs all tests with coverage, generates combined report, posts PR comment with coverage delta.

### Additional Quality Workflows

| Workflow                | Purpose                         |
| ----------------------- | ------------------------------- |
| `semgrep.yml`           | Static analysis (SAST)          |
| `codeql.yml`            | GitHub CodeQL security analysis |
| `load-test.yml`         | k6 load testing                 |
| `chaos-test.yml`        | Chaos engineering               |
| `performance.yml`       | Performance benchmarks          |
| `dependency-review.yml` | New dependency scanning         |

---

## 12. Test Configuration Details

### Vitest (Web) — Key Settings

```typescript
// apps/web/vite.config.ts
test: {
  globals: true,           // No need to import describe/it/expect
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  testTimeout: 10000,      // 10s per test
  hookTimeout: 10000,      // 10s per hook
}
```

### Jest (Mobile) — Key Settings

```javascript
// apps/mobile/jest.config.js
module.exports = {
  preset: 'jest-expo',
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  maxWorkers: '50%',
  errorOnDeprecated: true,
  testTimeout: 10000,
};
```

### Playwright — Key Settings

```typescript
timeout: 30_000,                    // 30s per test
expect: { timeout: 10_000 },       // 10s for assertions
retries: process.env.CI ? 2 : 0,   // 2 retries in CI
fullyParallel: true,                // Tests run in parallel
workers: process.env.CI ? 1 : undefined,  // Single worker in CI
```

---

## 13. Test Quality Patterns

### Assertion Style

- Web (Vitest): `expect(x).toBe(y)`, `expect(x).toBeNull()`, `expect(x).toEqual({...})`
- Mobile (Jest): Same API — `expect(x).toBeTruthy()`, `expect(fn).toHaveBeenCalledTimes(1)`
- Playwright: `await expect(locator).toBeVisible()`, `await expect(page).toHaveURL(/pattern/)`
- DOM assertions: `@testing-library/jest-dom` — `.toBeInTheDocument()`, `.toHaveAttribute()`

### Test Isolation

- Stores are reset via `setState()` in `afterEach`
- MSW handlers are reset via `server.resetHandlers()` in `afterEach`
- DOM cleanup via `cleanup()` from `@testing-library/react`
- Mocks cleared via `vi.clearAllMocks()` / `jest.clearAllMocks()` in `beforeEach`

### Test Naming

- `describe` blocks for feature grouping: `describe('authStore', () => { ... })`
- Nested `describe` for sub-features: `describe('mapUserFromApi', () => { ... })`
- `it` blocks with "should" convention: `it('should validate correct emails', () => { ... })`

### What Gets Unit Tested vs E2E Tested

| Category                | Unit Tests | E2E Tests                        |
| ----------------------- | ---------- | -------------------------------- |
| Store state logic       | ✅         |                                  |
| Pure utility functions  | ✅         |                                  |
| Hook behavior           | ✅         |                                  |
| Component rendering     | ✅         |                                  |
| Component accessibility | ✅         | ✅                               |
| API response validation | ✅         |                                  |
| Auth flows              |            | ✅                               |
| Multi-page navigation   |            | ✅                               |
| Full user journeys      |            | ✅                               |
| Page-level wiring       |            | ✅ (excluded from unit coverage) |
