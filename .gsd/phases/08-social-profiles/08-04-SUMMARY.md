---
phase: 08-social-profiles
plan: 04
subsystem: ui
tags: [react, react-native, expo-image-picker, react-easy-crop, avatar, profile]

requires:
  - phase: 02-auth-core
    provides: User model with avatar_url, display_name, bio fields
  - phase: 08-social-profiles/08-01
    provides: Social module structure, hooks barrel exports

provides:
  - Web profile edit hook with updateProfile (PUT /api/v1/me) and uploadAvatar (POST /api/v1/me/avatar)
  - Web profile edit form with avatar cropping via react-easy-crop (already existed from 08-03)
  - Mobile profile edit screen with avatar crop via expo-image-picker
  - Barrel exports for mobile social screens

affects: [09-notifications, 11-groups, social-profiles]

tech-stack:
  added: []
  patterns: [PUT /api/v1/me for profile fields, POST /api/v1/me/avatar with multipart FormData]

key-files:
  created:
    - apps/mobile/src/screens/social/profile-edit-screen.tsx
  modified:
    - apps/web/src/modules/social/hooks/useProfileEdit.ts
    - apps/web/src/modules/social/hooks/useProfileActions.ts

key-decisions:
  - "Web profile-edit-form.tsx already existed from 08-03 — no duplicate created"
  - "Added updateProfile/uploadAvatar to useProfileEdit hook for correct /api/v1/me endpoints"
  - "Mobile uses expo-image-picker built-in crop (allowsEditing + aspect 1:1) — no extra crop library needed"

patterns-established:
  - "Profile field updates: PUT /api/v1/me with {display_name, bio, signature}"
  - "Avatar uploads: POST /api/v1/me/avatar with multipart FormData (file key)"
  - "Mobile form screens: ScrollView + KeyboardAvoidingView + Animated FadeInDown sections"

duration: 8min
completed: 2026-03-01
---

# Plan 08-04: Profile Edit with Avatar Cropping Summary

**Web useProfileEdit hook gains updateProfile/uploadAvatar via PUT/POST /api/v1/me; mobile profile edit screen with expo-image-picker crop**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-01T23:16:00Z
- **Completed:** 2026-03-01T23:24:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Enhanced `useProfileEdit` hook with `updateProfile()` (PUT /api/v1/me) and `uploadAvatar()` (POST /api/v1/me/avatar with FormData)
- Verified existing `profile-edit-form.tsx` (from 08-03) already has full avatar crop UI via react-easy-crop
- Created mobile `ProfileEditScreen` with avatar picker (expo-image-picker, 1:1 crop), display name, bio, signature fields
- Both platforms persist profile changes via existing backend endpoints

## Task Commits

Each task was committed atomically:

1. **Task 1: Complete web profile edit with avatar cropping** — `3f6595a7` (feat)
2. **Task 2: Create mobile profile edit screen** — `9b8c5c3b` (feat)

**Plan metadata:** (this commit) (docs: complete plan summary)

## Files Created/Modified

- [apps/web/src/modules/social/hooks/useProfileEdit.ts](apps/web/src/modules/social/hooks/useProfileEdit.ts) — Added `updateProfile` and `uploadAvatar` methods using correct `/api/v1/me` endpoints
- [apps/web/src/modules/social/hooks/useProfileActions.ts](apps/web/src/modules/social/hooks/useProfileActions.ts) — Re-exported `ProfileFields` type
- [apps/mobile/src/screens/social/profile-edit-screen.tsx](apps/mobile/src/screens/social/profile-edit-screen.tsx) — Full mobile profile edit screen with avatar crop, form fields, save/cancel
- [apps/web/src/modules/social/components/profile-edit-form.tsx](apps/web/src/modules/social/components/profile-edit-form.tsx) — Verified (already complete from 08-03)

## Decisions Made

- **No web form duplication:** `profile-edit-form.tsx` already existed from 08-03 with full react-easy-crop integration — reused as-is.
- **Hook augmentation vs replacement:** Added `updateProfile`/`uploadAvatar` alongside existing methods to maintain backward compatibility with existing consumers (profile card inline editing).
- **Mobile crop approach:** expo-image-picker provides built-in square crop via `allowsEditing: true, aspect: [1, 1]` — no additional crop library needed on mobile.

## Deviations from Plan

None — plan executed exactly as written. The `profile-edit-form.tsx` was already present from 08-03, which the plan anticipated ("check before creating duplicates").

## Issues Encountered

None

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Profile editing complete on both platforms with avatar crop
- Backend endpoints verified (PUT /api/v1/me, POST /api/v1/me/avatar)
- Ready for remaining 08-social-profiles plans (08-05+)

---

_Phase: 08-social-profiles_
_Completed: 2026-03-01_
