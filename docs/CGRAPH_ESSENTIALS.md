# CGraph Essentials

> **Version: 0.9.37** | The 20 rules that matter most

This is the **minimal enforceable subset** of our coding standards. Every PR must follow these
rules. For the full 8,400-line standards doc, see
[ENGINEERING_STANDARDS.md](PrivateFolder/ENGINEERING_STANDARDS.md).

---

## 🚦 The 20 Essential Rules

### TypeScript (5 rules)

#### 1. No `any` — Use proper types

```typescript
// ❌ Bad
function process(data: any) { ... }

// ✅ Good
function process(data: UserMessage) { ... }
function process(data: unknown) { ... }  // If truly unknown, validate first
```

#### 2. Explicit return types on exported functions

```typescript
// ❌ Bad
export function getUser(id: string) {
  return db.users.find(id);
}

// ✅ Good
export function getUser(id: string): Promise<User | null> {
  return db.users.find(id);
}
```

#### 3. Use `readonly` for immutable data

```typescript
// ❌ Bad
interface Config {
  apiUrl: string;
  timeout: number;
}

// ✅ Good
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}
```

#### 4. Prefer `unknown` over `any` for error handling

```typescript
// ❌ Bad
catch (error: any) {
  console.log(error.message);
}

// ✅ Good
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
}
```

#### 5. No unused variables (prefix with `_` if intentional)

```typescript
// ❌ Bad - triggers TS6133
const [value, setValue] = useState(); // setValue unused

// ✅ Good
const [value, _setValue] = useState(); // Explicitly unused
```

---

### React (5 rules)

#### 6. Components < 300 lines — Extract when larger

```typescript
// ❌ Bad - 500 line component
function Dashboard() { /* 500 lines */ }

// ✅ Good - Extract sub-components
function Dashboard() {
  return (
    <>
      <DashboardHeader />
      <DashboardMetrics />
      <DashboardActivity />
    </>
  );
}
```

> **Backend rule:** Elixir modules must stay under **500 lines**. Use the sub-module + `defdelegate`
> facade pattern to split large contexts (see `groups.ex`, `notifications.ex` for examples).

#### 7. No inline functions in JSX for callbacks

```typescript
// ❌ Bad - Creates new function every render
<Button onClick={() => handleClick(id)} />

// ✅ Good - Stable reference
const handleButtonClick = useCallback(() => handleClick(id), [id]);
<Button onClick={handleButtonClick} />
```

#### 8. Use `useMemo`/`useCallback` for expensive computations

```typescript
// ❌ Bad - Recalculates every render
const sortedItems = items.sort((a, b) => a.name.localeCompare(b.name));

// ✅ Good - Memoized
const sortedItems = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);
```

#### 9. Key props must be stable and unique

```typescript
// ❌ Bad - Index as key
{items.map((item, index) => <Item key={index} />)}

// ✅ Good - Stable ID
{items.map((item) => <Item key={item.id} />)}
```

#### 10. Prefer composition over prop drilling

```typescript
// ❌ Bad - Prop drilling through 4 levels
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <Avatar user={user} />

// ✅ Good - Context or composition
<UserProvider value={user}>
  <App>
    <Layout>
      <Sidebar>
        <Avatar />  // Uses useUser() hook
```

---

### State Management (3 rules)

#### 11. Zustand stores: One concern per store

```typescript
// ❌ Bad - God store
const useStore = create((set) => ({
  user: null,
  messages: [],
  settings: {},
  theme: 'dark',
  // 50 more fields...
}));

// ✅ Good - Separated concerns
const useUserStore = create(...);
const useMessageStore = create(...);
const useSettingsStore = create(...);
```

#### 12. No store access in render — Use selectors

```typescript
// ❌ Bad - Subscribes to entire store
const store = useMessageStore();
return <div>{store.messages.length}</div>;

// ✅ Good - Minimal subscription
const count = useMessageStore((s) => s.messages.length);
return <div>{count}</div>;
```

#### 13. Derive state, don't duplicate

```typescript
// ❌ Bad - Duplicate state
const [items, setItems] = useState([]);
const [itemCount, setItemCount] = useState(0); // Derived!

// ✅ Good - Derive from source
const [items, setItems] = useState([]);
const itemCount = items.length; // Computed
```

---

### Architecture (4 rules)

#### 14. No business logic in components

```typescript
// ❌ Bad - Business logic in component
function OrderForm() {
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      const discount = item.qty > 10 ? 0.9 : 1;
      return sum + item.price * item.qty * discount;
    }, 0);
  };
}

// ✅ Good - Logic in service/util
// lib/orders/calculateTotal.ts
export function calculateTotal(items: OrderItem[]): number { ... }

// Component just uses it
import { calculateTotal } from '@/lib/orders';
```

#### 15. API calls go through service layer

```typescript
// ❌ Bad - Direct API call in component
useEffect(() => {
  fetch('/api/users')
    .then((r) => r.json())
    .then(setUsers);
}, []);

// ✅ Good - Through service
// services/userService.ts
export const userService = {
  getAll: () => api.get<User[]>('/users'),
};

// Component
const { data: users } = useQuery(['users'], userService.getAll);
```

#### 16. Consistent file naming

```
components/   → kebab-case.tsx    (user-avatar.tsx)
hooks/        → camelCase.ts      (useAuth.ts)
stores/       → camelCase.ts      (userStore.ts)
utils/lib/    → camelCase.ts      (formatDate.ts)
types/        → kebab-case.ts     (user.ts)
```

#### 17. Barrel exports for public APIs only

```typescript
// ✅ Good - Public API barrel
// components/index.ts
export { Button } from './Button';
export { Input } from './Input';
// Only export what external code needs

// ❌ Bad - Re-exporting internal helpers
export { validateButtonProps } from './Button/utils'; // Internal!
```

---

### Security (3 rules)

#### 18. Never log sensitive data

```typescript
// ❌ Bad
logger.info('User login', { email, password });
logger.debug('API response', response); // May contain tokens

// ✅ Good
logger.info('User login', { email });
logger.debug('API response', { status: response.status });
```

#### 19. Validate all external input

```typescript
// ❌ Bad - Trust user input
const userId = req.params.id;
db.users.delete(userId);

// ✅ Good - Validate first
const userId = z.string().uuid().parse(req.params.id);
const user = await db.users.findUnique({ where: { id: userId } });
if (user.ownerId !== currentUser.id) throw new ForbiddenError();
```

#### 20. E2EE failures must block, not fallback

```typescript
// ❌ Bad - Silent fallback to plaintext
try {
  encrypted = await encrypt(message);
} catch {
  // Send plaintext anyway - DANGEROUS
  send(message);
}

// ✅ Good - Block and notify
try {
  encrypted = await encrypt(message);
  send(encrypted);
} catch (error) {
  throw new EncryptionError('Message not sent - encryption failed');
}
```

---

## 🔧 Enforcement

| Rule                 | Enforced By                  | Failure      |
| -------------------- | ---------------------------- | ------------ |
| 1-5 (TypeScript)     | `tsconfig.json` strict mode  | Block build  |
| 6 (Component size)   | Code review + 300-line limit | Block PR     |
| 7-10 (React)         | `eslint-plugin-react-hooks`  | Block commit |
| 11-13 (State)        | Code review                  | Block PR     |
| 14-17 (Architecture) | Code review                  | Block PR     |
| 18-20 (Security)     | Code review + Sobelow        | Block PR     |

---

## ✅ PR Checklist

Before submitting, verify:

- [ ] No `any` types (use `unknown` if needed)
- [ ] Exported functions have explicit return types
- [ ] Components under 300 lines (backend modules under 500 lines)
- [ ] No inline callbacks in JSX
- [ ] Store selectors are minimal
- [ ] Business logic not in components
- [ ] No sensitive data in logs
- [ ] All inputs validated

---

## 📚 Full Standards

For comprehensive guidelines (8,400+ lines), see:

- [ENGINEERING_STANDARDS.md](PrivateFolder/ENGINEERING_STANDARDS.md)

---

<sub>**CGraph Essentials** • Version 0.9.37 • Last updated: February 21, 2026</sub>
