# CGraph Testing Guide

> Comprehensive testing documentation for the CGraph platform

**Version:** 0.9.28 | **Last Updated:** January 2026

---

## 📋 Overview

CGraph uses a multi-layered testing strategy across all platform components:

| Component    | Framework                           | Coverage Target |
| ------------ | ----------------------------------- | --------------- |
| Web Frontend | Vitest + React Testing Library      | 80%+            |
| Mobile App   | Jest + React Native Testing Library | 75%+            |
| Backend API  | ExUnit                              | 90%+            |
| E2E Tests    | Playwright (Web) / Detox (Mobile)   | Critical paths  |

---

## 🌐 Web Frontend Testing

### Setup

```bash
cd apps/web
pnpm install
pnpm test        # Run all tests
pnpm test:watch  # Watch mode
pnpm test:coverage  # With coverage report
```

### Test Structure

```
apps/web/
├── src/
│   ├── components/
│   │   └── __tests__/           # Component tests
│   ├── hooks/
│   │   └── __tests__/           # Hook tests
│   ├── stores/
│   │   └── __tests__/           # Store tests
│   └── lib/
│       └── __tests__/           # Utility tests
└── e2e/                         # Playwright E2E tests
```

### Writing Component Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Testing Hooks

```tsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Testing Zustand Stores

```tsx
import { act } from '@testing-library/react';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('sets user on login', () => {
    const user = { id: '1', username: 'testuser' };

    act(() => {
      useAuthStore.getState().login(user);
    });

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
```

---

## 📱 Mobile App Testing

### Setup

```bash
cd apps/mobile
pnpm install
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # With coverage
```

### Testing Components

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { ChatBubble } from '../ChatBubble';

describe('ChatBubble', () => {
  it('displays message content', () => {
    const { getByText } = render(<ChatBubble message={{ content: 'Hello!', sender: 'user' }} />);
    expect(getByText('Hello!')).toBeTruthy();
  });
});
```

### E2E Tests with Detox

```bash
# Build for testing
detox build --configuration ios.sim.debug

# Run E2E tests
detox test --configuration ios.sim.debug
```

```javascript
// e2e/login.e2e.js
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await expect(element(by.id('home-screen'))).toBeVisible();
  });
});
```

---

## 🔧 Backend Testing

### Setup

```bash
cd apps/backend
mix deps.get
mix test              # Run all tests
mix test --cover      # With coverage
mix test test/cgraph_web/  # Specific directory
```

### Test Structure

```
apps/backend/test/
├── cgraph/                    # Context tests
│   ├── accounts_test.exs
│   ├── forums_test.exs
│   └── messaging_test.exs
├── cgraph_web/
│   ├── channels/              # Channel tests
│   └── controllers/           # Controller tests
├── support/
│   ├── conn_case.ex
│   ├── data_case.ex
│   └── fixtures/
└── test_helper.exs
```

### Writing Context Tests

```elixir
defmodule CGraph.AccountsTest do
  use CGraph.DataCase, async: true

  alias CGraph.Accounts

  describe "users" do
    @valid_attrs %{email: "test@example.com", username: "testuser"}

    test "create_user/1 with valid data creates a user" do
      assert {:ok, %User{} = user} = Accounts.create_user(@valid_attrs)
      assert user.email == "test@example.com"
      assert user.username == "testuser"
    end

    test "create_user/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_user(%{})
    end
  end
end
```

### Writing Controller Tests

```elixir
defmodule CGraphWeb.UserControllerTest do
  use CGraphWeb.ConnCase, async: true

  import CGraph.AccountsFixtures

  setup %{conn: conn} do
    {:ok, conn: put_req_header(conn, "accept", "application/json")}
  end

  describe "GET /api/v1/users/:id" do
    test "returns user when exists", %{conn: conn} do
      user = user_fixture()
      conn = get(conn, ~p"/api/v1/users/#{user.id}")

      assert %{"id" => id, "username" => username} = json_response(conn, 200)["data"]
      assert id == user.id
    end

    test "returns 404 when user not found", %{conn: conn} do
      conn = get(conn, ~p"/api/v1/users/nonexistent-id")
      assert json_response(conn, 404)
    end
  end
end
```

### Testing Channels

```elixir
defmodule CGraphWeb.ChatChannelTest do
  use CGraphWeb.ChannelCase

  setup do
    user = user_fixture()
    {:ok, socket} = connect(CGraphWeb.UserSocket, %{"token" => user.token})
    {:ok, _, socket} = subscribe_and_join(socket, "chat:lobby", %{})

    %{socket: socket, user: user}
  end

  test "new_message broadcasts to channel", %{socket: socket} do
    push(socket, "new_message", %{"content" => "Hello!"})

    assert_broadcast "new_message", %{content: "Hello!"}
  end
end
```

---

## 🎭 E2E Testing with Playwright

### Setup

```bash
cd apps/web
pnpm exec playwright install
pnpm test:e2e           # Run E2E tests
pnpm test:e2e:ui        # Interactive mode
pnpm test:e2e:debug     # Debug mode
```

### Writing E2E Tests

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign up', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="username"]', 'newuser');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/onboarding');
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('user can log in', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'existing@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

### Testing Real-Time Features

```typescript
// e2e/messaging.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Real-time Messaging', () => {
  test('messages appear in real-time', async ({ browser }) => {
    // Create two browser contexts (two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login as user 1
    await page1.goto('/login');
    await page1.fill('[name="email"]', 'user1@example.com');
    await page1.fill('[name="password"]', 'password');
    await page1.click('button[type="submit"]');

    // Login as user 2
    await page2.goto('/login');
    await page2.fill('[name="email"]', 'user2@example.com');
    await page2.fill('[name="password"]', 'password');
    await page2.click('button[type="submit"]');

    // Both navigate to same chat
    await page1.goto('/chat/dm/user2');
    await page2.goto('/chat/dm/user1');

    // User 1 sends message
    await page1.fill('[data-testid="message-input"]', 'Hello from user 1!');
    await page1.press('[data-testid="message-input"]', 'Enter');

    // User 2 should see it
    await expect(page2.locator('text=Hello from user 1!')).toBeVisible();

    await context1.close();
    await context2.close();
  });
});
```

---

## 📊 Test Coverage

### Viewing Coverage Reports

```bash
# Web frontend
cd apps/web
pnpm test:coverage
open coverage/index.html

# Backend
cd apps/backend
mix test --cover
open cover/Elixir.CGraph.html
```

### Coverage Targets

| Component           | Target | Current |
| ------------------- | ------ | ------- |
| Core Business Logic | 90%    | 88%     |
| API Controllers     | 85%    | 82%     |
| React Components    | 80%    | 76%     |
| Utility Functions   | 95%    | 93%     |

---

## 🔄 CI/CD Integration

Tests run automatically on every PR via GitHub Actions:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test --coverage
      - uses: codecov/codecov-action@v3

  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v4
      - uses: erlef/setup-beam@v1
        with:
          elixir-version: '1.17'
          otp-version: '26'
      - run: mix deps.get
      - run: mix test --cover

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
```

---

## 🧪 Best Practices

### 1. Test Naming

```typescript
// ✅ Good: Descriptive behavior
it('should display error message when password is too short');
it('should disable submit button while loading');

// ❌ Bad: Vague or implementation-focused
it('works correctly');
it('calls setState');
```

### 2. Arrange-Act-Assert

```typescript
it('updates user profile', async () => {
  // Arrange
  const user = createTestUser();
  render(<ProfileForm user={user} />);

  // Act
  await userEvent.type(screen.getByLabelText('Bio'), 'New bio text');
  await userEvent.click(screen.getByText('Save'));

  // Assert
  expect(screen.getByText('Profile updated')).toBeVisible();
});
```

### 3. Avoid Implementation Details

```typescript
// ✅ Good: Test behavior
expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();

// ❌ Bad: Test implementation
expect(component.state.isDisabled).toBe(true);
```

### 4. Use Test IDs Sparingly

```tsx
// Only for elements without accessible names
<div data-testid="loading-spinner" />;

// Prefer accessible queries
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email address');
screen.getByText('Welcome back!');
```

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [ExUnit Documentation](https://hexdocs.pm/ex_unit/ExUnit.html)
- [Testing Phoenix](https://hexdocs.pm/phoenix/testing.html)

---

_Last updated: January 2026_
