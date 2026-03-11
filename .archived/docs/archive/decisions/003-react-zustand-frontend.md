# ADR-003: React 19 + Zustand for Frontend

## Status

**Accepted**

## Date

2025-08-01

## Authors

- @cgraph-dev/frontend-team

## Context

CGraph's web application requires:

- Rich, interactive UI with real-time updates
- Complex state management (messages, conversations, presence, themes)
- Performance at scale (thousands of messages)
- Cross-platform code sharing with React Native mobile app
- Type safety throughout

We needed to choose a frontend stack that balances developer experience, performance, and long-term
maintainability.

## Decision Drivers

- React Native compatibility (code sharing)
- State management simplicity
- Bundle size
- TypeScript support
- Real-time update performance
- Developer familiarity

## Considered Options

### Option 1: React 19 + Zustand

**Description**: Latest React with minimal state management library.

**Pros**:

- React 19 automatic batching improves performance
- Zustand is tiny (~1KB) with no boilerplate
- Hooks-based API is intuitive
- Perfect TypeScript support
- Shares mental model with React Native
- Selective re-renders via selectors

**Cons**:

- Zustand less structured than Redux (flexibility can be misused)
- Fewer dev tools than Redux

### Option 2: React + Redux Toolkit

**Description**: React with official Redux state management.

**Pros**:

- Battle-tested at scale
- Excellent DevTools
- Strong conventions
- Large ecosystem (RTK Query, etc.)

**Cons**:

- More boilerplate (slices, selectors, actions)
- Larger bundle size
- Learning curve for new developers
- Can be overkill for many use cases

### Option 3: Vue 3 + Pinia

**Description**: Alternative framework with native state management.

**Pros**:

- Excellent reactivity system
- Simpler than React in some cases
- Good TypeScript support

**Cons**:

- No React Native equivalent
- Smaller ecosystem
- Team would need retraining

### Option 4: SolidJS

**Description**: Fine-grained reactivity without Virtual DOM.

**Pros**:

- Best-in-class performance
- Familiar JSX syntax

**Cons**:

- No React Native path
- Smaller ecosystem
- Less mature tooling

## Decision

**Chosen option: React 19 + Zustand**

We chose React 19 + Zustand because:

1. **Code sharing**: Same paradigm as React Native mobile app
2. **Simplicity**: Zustand requires no boilerplate, just stores
3. **Performance**: Selective subscriptions prevent unnecessary re-renders
4. **Bundle size**: Zustand adds only ~1KB vs Redux's ~10KB+
5. **TypeScript**: Both have excellent type inference

## Implementation Patterns

### Store Structure

```typescript
// Separate stores by domain
const useAuthStore = create<AuthStore>(...);
const useChatStore = create<ChatStore>(...);
const useThemeStore = create<ThemeStore>(...);
```

### Selective Subscriptions

```typescript
// ❌ Bad - subscribes to entire store
const store = useChatStore();
const count = store.messages.length;

// ✅ Good - only re-renders when count changes
const count = useChatStore((s) => s.messages.length);
```

### Persistence

```typescript
const useAuthStore = create(
  persist(
    (set) => ({ ... }),
    { name: 'auth-storage' }
  )
);
```

## Consequences

### Positive

- Fast development velocity
- Minimal boilerplate
- Easy to test (pure functions)
- Great TypeScript DX
- Simple debugging with Zustand DevTools

### Negative

- Less structure can lead to inconsistent patterns
- Team must follow conventions manually

### Neutral

- Different from Redux patterns (some team relearning)
- Requires explicit selector optimization

## Related Decisions

- ADR-004: Vite for build tooling
- ADR-006: React Native for mobile

## References

- [React 19 Documentation](https://react.dev/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Why Zustand over Redux](https://docs.pmnd.rs/zustand/getting-started/comparison)
