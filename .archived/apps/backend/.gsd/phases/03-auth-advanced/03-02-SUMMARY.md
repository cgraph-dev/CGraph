---
phase: 03-auth-advanced
plan: 02
subsystem: auth
tags: [react, react-native, zustand, 2fa, totp, login-flow]

requires:
  - phase: 03-01
    provides: 'Backend 2FA login gate — 2fa_required response + POST /login/2fa endpoint'
provides:
  - 'Web 2FA TOTP form for login flow'
  - 'Mobile TwoFactorVerifyScreen for login flow'
  - 'verifyLoginTwoFactor auth action on both platforms'
affects: [auth-testing, e2e-tests]

tech-stack:
  added: []
  patterns: ['conditional login step rendering', '2fa_required response interception']

key-files:
  created:
    - apps/web/src/pages/auth/login/two-factor-form.tsx
    - apps/mobile/src/screens/auth/two-factor-verify-screen.tsx
  modified:
    - apps/web/src/pages/auth/login/useLoginForm.ts
    - apps/web/src/modules/auth/store/auth-actions.ts
    - apps/web/src/modules/auth/store/authStore.impl.ts
    - apps/web/src/modules/auth/store/authStore.types.ts
    - apps/web/src/pages/auth/login.tsx
    - apps/mobile/src/stores/authStore.ts
    - apps/mobile/src/screens/auth/login-screen.tsx
    - apps/mobile/src/navigation/auth-navigator.tsx
    - apps/mobile/src/types/index.ts

key-decisions:
  - 'Web uses inline conditional render (loginStep state) rather than modal for TOTP form'
  - 'Mobile navigates to separate TwoFactorVerifyScreen via auth stack navigator'

duration: ~5min
completed: 2026-02-28
---

# Phase 3 Plan 02: Frontend 2FA Login UI Summary

**Web and mobile login flows now intercept 2fa_required backend responses and present TOTP
verification UI with backup code support.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-28
- **Completed:** 2026-02-28
- **Tasks:** 2/2
- **Files modified:** 11

## Accomplishments

- Web login page conditionally renders TOTP form when backend returns `2fa_required`
- Web `two-factor-form.tsx` component with 6-digit numeric input, backup code toggle, error display,
  loading state
- Web `verifyLoginTwoFactor` auth action POSTs to `/api/v1/auth/login/2fa`
- Mobile `TwoFactorVerifyScreen` registered in auth navigator
- Mobile login screen navigates to verify screen on `2fa_required` response
- Mobile `verifyLoginTwoFactor` action in authStore handles token storage + socket connection
- Both platforms support backup code entry as fallback
- No regression for non-2FA users — normal login flow unchanged

## Task Commits

1. **Task 1: Web 2FA login form + auth action** — `67962328` (feat)
2. **Task 2: Mobile 2FA verify screen + auth store** — `f20ddf57` (feat)

## Files Created/Modified

### Created

- `apps/web/src/pages/auth/login/two-factor-form.tsx` — Web TOTP form component
- `apps/mobile/src/screens/auth/two-factor-verify-screen.tsx` — Mobile 2FA verify screen

### Modified

- `apps/web/src/pages/auth/login/useLoginForm.ts` — Added loginStep state, 2fa_required interception
- `apps/web/src/modules/auth/store/auth-actions.ts` — Added verifyLoginTwoFactor action
- `apps/web/src/modules/auth/store/authStore.impl.ts` — Wired verifyLoginTwoFactor
- `apps/web/src/modules/auth/store/authStore.types.ts` — Added type for verifyLoginTwoFactor
- `apps/web/src/pages/auth/login.tsx` — Conditional TwoFactorForm render
- `apps/mobile/src/stores/authStore.ts` — 2fa_required detection + verifyLoginTwoFactor action
- `apps/mobile/src/screens/auth/login-screen.tsx` — Navigate to TwoFactorVerify on 2fa_required
- `apps/mobile/src/navigation/auth-navigator.tsx` — Registered TwoFactorVerify screen
- `apps/mobile/src/types/index.ts` — Added TwoFactorVerify to AuthStackParamList

## Decisions Made

- Web uses inline loginStep state (`'credentials' | '2fa'`) for conditional rendering rather than a
  modal overlay
- Mobile uses navigation to a separate screen (consistent with existing auth flow patterns)
- No deep link for 2FA verify screen — only reachable from login flow

## Deviations from Plan

None — plan executed as written.

## Next Phase Readiness

All 3 plans in Phase 3 complete. Ready for phase verification.
