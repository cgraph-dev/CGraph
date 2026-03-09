---
phase: 26-great-delete
plan: 04
status: complete
commit: dbfc41d9
files_changed: 46
lines_deleted: ~3300
---

# Plan 26-04 Summary: Route Cleanup, Dangling Reference Sweep, and TS Fixes

## What Was Done

Cleaned up all routing, lazy page imports, duplicate constants, and remaining dangling references
after the Great Delete (Plans 01–03). Fixed 86 TypeScript compilation errors caused by the
deletions. App compiles with only 17 pre-existing errors (lottie/emoji/auth).

## Tasks Completed

### Task 1: Gamification Routes Removed

- `app-routes.tsx`: Removed `UserLeaderboard` import, `community/leaderboard` route, and all
  gamification redirect routes → replaced with catch-all redirects to `/`

### Task 2: Lazy Page Imports

- Already cleaned in Plan 02 (UserLeaderboard lazy import removed, TODO comment in place)

### Task 3: LEGACY_BORDER_ID_TO_V2_TYPE Removed

- `constants.ts`: Deleted 18-entry legacy border ID map
- `useIdentityCustomization.ts`: Removed import, simplified `applyBorderToStore`
- `index.ts`: Removed re-export

### Task 4: Mobile Navigation Cleaned

- `settings-navigator.tsx`: Removed LeaderboardScreen import and Stack.Screen
- `friends-navigator.tsx`: Removed LeaderboardScreen import and Stack.Screen

### Task 5: Global Dangling Reference Sweep

- Deleted `apps/web/src/pages/community/user-leaderboard/` (8 files missed in Plan 03)
- Deleted mobile leaderboard screens (`screens/leaderboard/`, `screens/community/leaderboard/`)
- Deleted `gamificationService.ts` (465 lines) and `useGamification.ts` (309 lines)
- Cleaned barrel exports: features/index.ts, components/index.ts, services/index.ts, hooks/index.ts
- Fixed `avatar.tsx`: Replaced deleted AnimatedBorder import with View stub
- Fixed `authStore.ts`: Removed dynamic imports of deleted gamification/marketplace stores

### Task 6: TypeScript Compilation Fixes

- `FeatureGateKey`: Local type alias replacing deleted shared-types export (2 files)
- `AchievementCategory`: Added 'legendary' and 'secret' to union type (fixed 30 errors)
- `useIdentityCustomization.ts`: Fixed return types from `unknown[]` to proper types
- `badge-selection.tsx`: Replaced `never[]` with `StubAchievement[]` interface
- `useTitleSelection.ts`: Fixed `never[]` to `PreviewTitle[]`
- `avatar-borders-section.tsx`: Fixed ~25 type errors from stub types
- `avatar-border-renderer.tsx`: Added `particleDensity` to stub preferences
- `full-profile-card.tsx` / `mini-profile-card.tsx`: Fixed null/undefined assignability
- `theme-customization/hooks.ts`: Fixed `unknown[]` → `Theme[]` return type
- `user-profile/useProfileData.ts`: Fixed Achievement type conflict
- `notification-provider.tsx`: Suppressed unused handler from deleted component

## Lint Fixes

- Fixed JSDoc missing description on `FriendsNavigator`
- Removed useless try/catch in `authStore.login`
- Changed `as FeatureGateKey` → `satisfies FeatureGateKey`
- Added eslint-disable for `react-hooks/exhaustive-deps` with explanation

## Remaining (Pre-existing, NOT Gamification)

- 17 TypeScript errors in: lottie, emoji-picker, auth-logo, login-form, password-toggle,
  upload-emoji
- These exist on the `main` branch before Plan 04 changes

## Result

- **0 gamification-related TypeScript errors**
- All gamification routes redirect gracefully to `/`
- No dead imports referencing deleted modules
- Phase 26 "The Great Delete" is complete
