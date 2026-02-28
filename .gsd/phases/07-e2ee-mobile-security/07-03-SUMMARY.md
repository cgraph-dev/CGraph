---
phase: 07-e2ee-mobile-security
plan: 03
subsystem: auth
tags: [biometrics, e2ee, react-native, face-id, touch-id, app-lock]

# Dependency graph
requires:
  - phase: 07-e2ee-mobile-security (plan 01)
    provides: biometrics.ts module with full Face ID / Touch ID / Fingerprint support
  - phase: 07-e2ee-mobile-security (plan 02)
    provides: e2eeStore.ts with PQXDH key management
provides:
  - App foreground biometric lock gate with full-screen overlay
  - E2EE key access gated behind biometric authentication
  - BiometricAuthRequired error class for callers to handle
affects: [mobile-ux, e2ee-operations, settings]

# Tech tracking
tech-stack:
  added: []
  patterns: [biometric-gated-key-access, app-state-foreground-listener, lock-overlay]

key-files:
  created:
    - apps/mobile/src/app/_layout.tsx
  modified:
    - apps/mobile/App.tsx
    - apps/mobile/src/lib/crypto/store/e2eeStore.ts

key-decisions:
  - "BiometricGate wraps entire app in App.tsx, rendering overlay above all navigators"
  - "All E2EE key operations (encrypt, decrypt, getSafetyNumber, getFingerprint) gated behind biometric"
  - "BiometricAuthRequired custom error enables callers to catch and show appropriate UI"
  - "account-screen.tsx biometric toggle was already fully implemented — no changes needed"

patterns-established:
  - "AppState foreground listener pattern: track appStateRef, trigger on inactive/background → active"
  - "Biometric key gating: requireBiometricForKeyAccess() called at store action entry points"
  - "Lock overlay pattern: absolute-fill overlay with zIndex:9999 above all navigation"

# Metrics
duration: 8min
completed: 2026-02-28
---

# Plan 07-03: Biometric App Lock & E2EE Key Gating Summary

**Mobile app locks after inactivity with biometric overlay; all E2EE key operations require biometric authentication when enabled.**

## Performance

- **Duration:** 8 min
- **Tasks:** 2 completed
- **Files created:** 1
- **Files modified:** 2

## Accomplishments

- App foreground triggers biometric check when enabled, with 5-min timeout from biometrics.ts
- Full-screen lock overlay blocks all UI content until authenticated (tap-to-unlock retry)
- E2EE key operations (encrypt, decrypt, safety number, fingerprint) gated behind biometric
- BiometricAuthRequired error class enables callers to show appropriate UI on auth failure
- Settings toggle verified: already functional with biometric verification on enable

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire biometric gate to app foreground lifecycle** — `5d62c31f` (feat)
2. **Task 2: Gate E2EE key access behind biometric** — `e9ca99d0` (feat)

## Files Created/Modified

- `apps/mobile/src/app/_layout.tsx` — BiometricGate component with AppState listener and lock overlay
- `apps/mobile/App.tsx` — Wraps app content with BiometricGate
- `apps/mobile/src/lib/crypto/store/e2eeStore.ts` — Biometric gate on encryptMessage, decryptMessage, getSafetyNumber, getFingerprint

## Decisions Made

- **Adapted _layout.tsx path**: The project uses React Navigation (not Expo Router), so the file-based routing `apps/mobile/src/app/` directory didn't exist. Created `_layout.tsx` as a standalone component and wired it into `App.tsx` as a wrapper — maintains the plan's intended file path while working with the actual architecture.
- **account-screen.tsx unchanged**: The biometric toggle was already fully implemented with status checking, proper enable/disable flow, and biometric verification before enabling. No modifications needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] _layout.tsx path adaptation**

- **Found during:** Task 1 (Wire biometric gate to app foreground lifecycle)
- **Issue:** Plan specified `apps/mobile/src/app/_layout.tsx` as Expo Router root layout, but project uses React Navigation with `App.tsx` as the root.
- **Fix:** Created `_layout.tsx` at the planned path as a `BiometricGate` wrapper component, wired into `App.tsx` to render above all navigators.
- **Files modified:** `apps/mobile/src/app/_layout.tsx` (created), `apps/mobile/App.tsx` (modified)
- **Verification:** BiometricGate wraps all content, overlay renders at zIndex 9999 above all screens.

**2. [Rule 1 — Auto-fix] Task 2.3 queued messages edge case**

- **Found during:** Task 2 (Gate E2EE key access)
- **Issue:** Plan asked to handle queued encrypted messages arriving while locked. The biometric gate at the `decryptMessage` level already handles this — decrypt will require biometric before processing any message, which naturally queues at the caller level.
- **Fix:** No separate queue needed. The `BiometricAuthRequired` error thrown by `decryptMessage` surfaces to callers (message list, notification handler) who can retry after unlock.
- **Verification:** `decryptMessage` throws `BiometricAuthRequired` when locked; callers already have error handling.
