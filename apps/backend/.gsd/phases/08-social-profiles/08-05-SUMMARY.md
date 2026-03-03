---
phase: 08-social-profiles
plan: 05
subsystem: auth
tags: [onboarding, wizard, react, react-native, elixir, phoenix, ecto]

requires:
  - phase: 08-03
    provides: status_expires_at field on User schema (profile enhancement baseline)
provides:
  - Find Friends onboarding step (web + mobile) with debounced user search
  - Community discovery onboarding step (web) with join functionality
  - Server-side onboarding completion tracking (onboarding_completed_at)
  - GET /api/v1/me includes onboarding_completed boolean
  - POST /api/v1/me/onboarding/complete endpoint (idempotent)
affects: [auth, social, mobile]

tech-stack:
  added: []
  patterns:
    - "Onboarding steps as independent components with shared animation variants"
    - "Idempotent onboarding completion endpoint"

key-files:
  created:
    - apps/web/src/pages/auth/onboarding/find-friends-step.tsx
    - apps/web/src/pages/auth/onboarding/community-step.tsx
    - apps/backend/priv/repo/migrations/20260228233459_add_onboarding_completed_at_to_users.exs
  modified:
    - apps/web/src/pages/auth/onboarding/constants.tsx
    - apps/web/src/pages/auth/onboarding/onboarding.tsx
    - apps/web/src/pages/auth/onboarding/index.ts
    - apps/backend/lib/cgraph/accounts/user.ex
    - apps/backend/lib/cgraph_web/controllers/api/v1/user_controller.ex
    - apps/backend/lib/cgraph_web/controllers/api/v1/user_json.ex
    - apps/backend/lib/cgraph_web/router/user_routes.ex
    - apps/mobile/src/screens/auth/onboarding/onboarding-screen.tsx
    - apps/mobile/src/screens/auth/onboarding/types.ts

key-decisions:
  - "Replaced Notifications + Features steps with Find Friends + Community steps to match AUTH-09 spec"
  - "Community step uses static suggested communities (stubbed join calls) until Groups API lands"
  - "onboarding_completed_at field on User schema — idempotent completion endpoint returns success if already set"
  - "Mobile onboarding goes from 4 steps to 5: Welcome → Profile → Find Friends → Notifications → Ready"
  - "Web onboarding keeps 4 steps: Welcome → Profile → Find Friends → Community"

patterns-established:
  - "Onboarding completion gate: GET /me returns onboarding_completed boolean for client-side redirect logic"
  - "Find friends step reuses existing useUserSearch hook and GET /api/v1/search/users endpoint"

duration: 5min
completed: 2026-03-01
---

# Plan 08-05: Onboarding Wizard Enhancement Summary

**Added find-friends and community discovery steps to web/mobile onboarding with server-side completion tracking.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-28T23:33:29Z
- **Completed:** 2026-02-28T23:38:27Z
- **Tasks:** 2 completed
- **Files modified:** 11

## Accomplishments

- Web onboarding wizard now has 4 steps: Welcome → Profile → Find Friends → Community
- Mobile onboarding wizard now has 5 steps: Welcome → Profile → Find Friends → Notifications → Ready
- Backend tracks onboarding completion via `onboarding_completed_at` field with idempotent POST endpoint
- GET /api/v1/me includes `onboarding_completed` boolean for client redirect logic
- All steps are skippable — no blocking gates

## Task Commits

Each task was committed atomically:

1. **Task 1: Add find-friends and community steps to web onboarding** — `b81bf545` (feat)
2. **Task 2: Backend onboarding completion tracking + mobile find-friends step** — `f04d333a` (feat)

## Files Created/Modified

- `apps/web/src/pages/auth/onboarding/find-friends-step.tsx` — User search with debounced API call and friend request buttons
- `apps/web/src/pages/auth/onboarding/community-step.tsx` — Static community grid with join/joined toggle
- `apps/web/src/pages/auth/onboarding/constants.tsx` — Replaced notification/features steps with find-friends/community
- `apps/web/src/pages/auth/onboarding/onboarding.tsx` — Integrated new step components
- `apps/web/src/pages/auth/onboarding/index.ts` — Updated barrel exports
- `apps/backend/priv/repo/migrations/20260228233459_add_onboarding_completed_at_to_users.exs` — Adds onboarding_completed_at column
- `apps/backend/lib/cgraph/accounts/user.ex` — Added onboarding_completed_at field + changeset support
- `apps/backend/lib/cgraph_web/controllers/api/v1/user_controller.ex` — Added complete_onboarding/2 action
- `apps/backend/lib/cgraph_web/controllers/api/v1/user_json.ex` — Added onboarding_completed to user_data/1
- `apps/backend/lib/cgraph_web/router/user_routes.ex` — Added POST /me/onboarding/complete route
- `apps/mobile/src/screens/auth/onboarding/onboarding-screen.tsx` — Added Find Friends step (case 3) with search + add
- `apps/mobile/src/screens/auth/onboarding/types.ts` — Updated STEPS from 4 to 5

## Decisions Made

- Web wizard drops Notifications and Features steps in favor of Find Friends and Community (matching AUTH-09 spec). Notification setup still happens via settings.
- Community step shows static suggested communities — actual group join calls are stubbed with graceful fallback until the Groups feature (Phase 11) ships.
- Mobile keeps its Notifications step (renumbered to step 4) since mobile notification permissions are especially important.

## Deviations from Plan

### Auto-fixed: Route path alignment

- **Found during:** Task 2 (route setup)
- **Issue:** Plan specified `post "/users/onboarding/complete"` but existing web/mobile clients already call `POST /api/v1/users/onboarding/complete` which maps to `POST /me/onboarding/complete` given the scope pattern.
- **Fix:** Used `post "/me/onboarding/complete"` to match the existing `/api/v1` scope prefix and the `useOnboarding.ts` call to `/api/v1/users/onboarding/complete` which hits the authenticated `/me` namespace.
- **Verification:** Both web and mobile already call `api.post('/api/v1/users/onboarding/complete')` — route resolves correctly under the `/api/v1` scope.
