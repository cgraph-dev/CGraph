# CGraph Store Architecture — Improvement Guide

> **Status**: Reference document for incremental store refactoring
> **Last Updated**: February 2026

## Current Architecture

The app uses **32 Zustand stores** with a well-organized barrel export at `stores/index.ts`.
Most stores follow an **orchestrator + slices** pattern where:
- Types are defined in `*Store.types.ts`
- Implementation slices live in separate action files
- The orchestrator (`*Store.impl.ts`) composes slices with `create()`

### Middleware Usage
| Middleware | Count | Stores |
|-----------|-------|--------|
| `persist` | 14 | gamification, auth, admin, theme, premium, customization, etc. |
| `devtools` | 6 | chat, auth, admin, thread, notification, incomingCall |
| `immer` | 0 | — (consider for deeply nested state) |

## Standards

### New Async State
Use `createAsyncSlice` from `@/lib/store/createAsyncSlice.ts`:
```ts
import { createAsyncSlice } from '@/lib/store/createAsyncSlice';

const useMyStore = create<MyState>()((set, get) => ({
  ...createAsyncSlice<Item[]>('items', () => api.get('/items').then(r => r.data))(set, get),
}));
```

### QueryBoundary for UI
Use `<QueryBoundary>` from `@/components/feedback/QueryBoundary` to handle loading/error states
declaratively instead of manual `if (isLoading)` / `if (isError)` checks.

## Recommended Refactors (Priority Order)

### 1. `forumStore` (~1,211 lines, 60 actions) — HIGH

**Problem**: Owns 5 distinct responsibilities in one state tree.

**Action**: Split into:
- `useForumStore` — core CRUD (forums, posts, comments, voting, sort/filter)
- `useForumContentStore` — thread prefixes, ratings, attachments, edit history, polls
- **Remove** duplicated moderation/admin/bans/reports actions → use `useModerationStore` and `useAdminStore` instead

### 2. `moderationStore` (~870 lines, 34 actions) — MEDIUM

**Problem**: 34 actions for 11 state properties; queue + thread/post/bulk + user moderation all in one.

**Action**: Split into:
- `useModerationQueueStore` — queue + approve/reject (hot path)
- `useModerationActionsStore` — thread/post/bulk operations
- `useUserDisciplineStore` — warnings, bans, user stats, mod log

### 3. `chatStore` (~877 lines, 25 actions) — MEDIUM

**Problem**: Scheduled messages and E2EE actions are bundled with core chat.

**Action**:
- Extract `useScheduledMessageStore` as a separate store
- Remove E2EE actions → compose `useE2EEStore.encrypt()` at call site
- Consider normalizing messages with `Record<id, Message>` instead of arrays

### 4. General Improvements

- **Error surfacing**: Most stores swallow errors in catch blocks. Add `error` state field to all stores with async operations.
- **Stale time**: Implement `staleTime` checks to avoid redundant fetches.
- **Selector optimization**: Use Zustand selectors (`useStore(s => s.specificField)`) to minimize re-renders.
