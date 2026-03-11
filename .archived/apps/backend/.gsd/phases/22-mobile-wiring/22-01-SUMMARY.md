# Plan 22-01 Summary — Mobile Screen Mock Data Replacement

## Result: ✅ Complete

## Commits

| Hash       | Message                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `4ae64e60` | fix(mobile): wire notifications screen to real notification store       |
| `db711b58` | fix(mobile): wire user wall screen to real API, remove MOCK_POSTS       |
| `d763efba` | fix(mobile): remove getMockForums fallback, show error state on failure |
| `e908ea9e` | fix(mobile): read currentUserId from auth store in call history         |

## What Changed

### Task 1: Notifications Screen

- Replaced `getMockNotifications()` + `setTimeout` delay with `useNotificationStore`
- Screen now uses store selectors for notifications, isLoading, error
- Pull-to-refresh triggers `fetchNotifications(true)` (reset)
- Deleted `getMockNotifications()` from types.ts

### Task 2: User Wall Screen

- Replaced `MOCK_POSTS` constant with API fetch via `GET /api/v1/users/:id/posts`
- Added useEffect for data loading, error state, empty state
- Wired `currentUserId` from `useAuthStore`
- Deleted `MOCK_POSTS` from types.ts

### Task 3: Forum List Error Handling

- Removed `getMockForums()` fallback in catch block
- Added proper error state with retry button UI
- Deleted `getMockForums()` from helpers.ts

### Task 4: Call History Auth

- Replaced hardcoded `'current-user'` with `useAuthStore((s) => s.user?.id) ?? ''`
- Call direction filtering now works for authenticated user

## Files Modified (8)

- `screens/notifications/notifications-inbox-screen/index.tsx`
- `screens/notifications/notifications-inbox-screen/types.ts`
- `screens/profile/user-wall-screen.tsx`
- `screens/profile/user-wall-screen/types.ts`
- `screens/forums/forum-list-screen.tsx`
- `screens/forums/forum-list-screen/helpers.ts`
- `screens/calls/call-history-screen.tsx`

## Notes

- Notification type compatibility: added cast between store Notification type and screen's local
  type (types diverge slightly — follow-up to unify)
