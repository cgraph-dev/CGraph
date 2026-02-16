# CGraph Architecture Enforcement

> **Version: 0.9.8** | Last Updated: January 2026

This document defines the architectural boundaries and how they're enforced.

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         PAGES                                │
│  Route handlers, layout composition, page-level state        │
│  Can import: components, hooks, types, utils                 │
├─────────────────────────────────────────────────────────────┤
│                       COMPONENTS                             │
│  UI components, presentation logic                           │
│  Can import: hooks (for state), components, types, utils     │
│  Cannot import: stores directly, services                    │
├─────────────────────────────────────────────────────────────┤
│                         HOOKS                                │
│  Business logic, state access, side effects                  │
│  Can import: stores, services, types, utils                  │
├─────────────────────────────────────────────────────────────┤
│                        STORES                                │
│  Zustand stores, global state                                │
│  Can import: types, services (for async actions)             │
├─────────────────────────────────────────────────────────────┤
│                       SERVICES                               │
│  API calls, external integrations                            │
│  Can import: types, lib utilities only                       │
├─────────────────────────────────────────────────────────────┤
│                      LIB / UTILS                             │
│  Pure utilities, helpers, constants                          │
│  Can import: nothing from src (leaf nodes)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Enforcement Methods

### 1. ESLint Rules (Automated)

Architectural boundaries are enforced via `no-restricted-imports` rules in `eslint.config.js`:

```javascript
// Components cannot import stores directly
{
  files: ['apps/web/src/components/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': ['warn', {
      patterns: [{
        group: ['@/stores/*', '!@/stores/hooks'],
        message: 'Use store hooks instead of importing stores directly.'
      }]
    }]
  }
}
```

### 2. Pre-commit Hooks (Automated)

All staged files are linted before commit:

```bash
# .husky/pre-commit
pnpm lint-staged
```

### 3. CI Checks (Automated)

The CI workflow runs `pnpm lint` on every PR.

### 4. Code Review (Manual)

Reviewers should check for:

- [ ] Components using hooks for state, not direct store imports
- [ ] Services not importing from components or pages
- [ ] No circular dependencies between modules

---

## Common Patterns

### ✅ Correct: Component Using Hook

```tsx
// components/MessageList.tsx
import { useMessages } from '@/hooks/useMessages';

export function MessageList() {
  const { messages, isLoading } = useMessages();
  return (
    <div>
      {messages.map((m) => (
        <Message key={m.id} {...m} />
      ))}
    </div>
  );
}
```

### ❌ Wrong: Component Importing Store Directly

```tsx
// components/MessageList.tsx
import { useMessageStore } from '@/stores/messageStore'; // ❌ Violation!

export function MessageList() {
  const messages = useMessageStore((state) => state.messages);
  // ...
}
```

### ✅ Correct: Hook Accessing Store

```tsx
// hooks/useMessages.ts
import { useMessageStore } from '@/stores/messageStore'; // ✅ Allowed

export function useMessages() {
  const messages = useMessageStore((state) => state.messages);
  const isLoading = useMessageStore((state) => state.isLoading);
  return { messages, isLoading };
}
```

---

## Store Access Pattern

We use a **hooks-based store access pattern** to:

1. Decouple components from state implementation
2. Enable easier testing (mock hooks, not stores)
3. Provide a clear API boundary

### Store Hook Exports

```typescript
// stores/hooks.ts - Central export for all store hooks
export { useAuthStore } from './authStore';
export { useMessageStore } from './messageStore';
export { useChatStore } from './chatStore';
// ... etc
```

Components should import from `@/stores/hooks` or use custom hooks from `@/hooks/`.

---

## Migration Path

If you find code violating these boundaries:

1. Create a hook that wraps the store access
2. Update the component to use the hook
3. Add tests for the hook
4. Remove the direct store import

---

## Exceptions

Some exceptions are allowed:

| Exception         | Reason                          |
| ----------------- | ------------------------------- |
| `@/stores/index`  | Re-exports hooks safely         |
| `@/stores/hooks`  | Dedicated hook exports          |
| Test files        | Can import anything for testing |
| Storybook stories | Can import stores for demos     |

---

<sub>**CGraph Architecture Enforcement** • Version 0.9.28</sub>
