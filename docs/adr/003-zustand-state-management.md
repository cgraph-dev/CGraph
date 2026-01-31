# Architecture Decision Record: Zustand State Management

## Status

Accepted

## Date

2025-01-01

## Context

The web application requires state management for:

- Authentication state
- Chat/conversations data
- Real-time presence
- UI preferences
- E2EE key management

We evaluated several state management solutions.

## Decision

We adopted **Zustand** as our primary state management solution.

```typescript
// Example: authStore.ts
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        login: async (email, password) => {
          /* ... */
        },
        logout: () => set({ user: null, token: null, isAuthenticated: false }),
      }),
      { name: 'auth-storage' }
    )
  )
);
```

## Consequences

### Positive

- **Minimal Boilerplate**: No providers, reducers, or actions to define
- **TypeScript Native**: Excellent type inference
- **Performance**: Automatic selector optimization
- **Middleware**: Built-in persist, devtools, immer support
- **Bundle Size**: ~2.9kB gzipped vs Redux's ~7kB+

### Negative

- **Less Structured**: No enforced patterns like Redux
- **Smaller Ecosystem**: Fewer middleware options than Redux

## Store Organization

```
stores/
├── authStore.ts      # Authentication & user state
├── chatStore.ts      # Conversations & messages
├── friendStore.ts    # Friend list & requests
├── presenceStore.ts  # Online status
├── uiStore.ts        # Theme, preferences
└── notificationStore.ts
```

## Alternatives Considered

1. **Redux Toolkit**: Industry standard
   - Rejected: Too much boilerplate for our needs

2. **Jotai**: Atomic state management
   - Rejected: Less intuitive for complex store logic

3. **React Query + Context**: Server state + local state
   - Rejected: Would still need Zustand for client state

## References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Why Zustand](https://tkdodo.eu/blog/working-with-zustand)
