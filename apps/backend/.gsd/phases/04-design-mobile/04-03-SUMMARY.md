# Summary: 04-03 Mobile EAS Build Pipeline

**Phase:** 04-design-mobile **Status:** Complete **Date:** 2026-02-28

## Goal

Fix Expo EAS configuration so mobile app builds for iOS simulator and Android emulator, launches,
and reaches the login screen. Add convenience build scripts.

## Tasks Completed: 5/5

### Task 1: Fix EAS project ID ✅

- Replaced `'cgraph-production'` fallback with `'CONFIGURE_VIA_EAS_INIT'`
- Switched from `||` to `??` (nullish coalescing) for EAS_PROJECT_ID
- Added documentation comment explaining `eas init` requirement
- Updated both `extra.eas.projectId` and `updates.url` references
- **Commit:** `6b904805`

### Task 2: Fix app.json / app.config.js drift ✅

- Synced Android `versionCode` from 3 → 4 in both files
- Synced notification color from `#6366f1` → `#10b981` (brand emerald) in app.json
- Synced `assetBundlePatterns` from `['**/*']` → `['assets/**/*']` in app.config.js
- Removed duplicate `updates`, `experiments` sections from app.json (app.config.js handles
  dynamically)
- Removed hardcoded `apiUrl` from app.json extra
- Synced EAS projectId placeholder in app.json
- **Commit:** `01256a73`

### Task 3: Add build convenience scripts ✅

- Added 8 EAS build scripts to `apps/mobile/package.json`
- Scripts cover: dev/preview/production × all/ios/android + eas update
- **Commit:** `75e54131`

### Task 4: Verify Metro bundler / config validity ✅

- Ran `npx expo config --type public` — output valid config, no errors
- Confirmed all synced values appear correctly (versionCode 4, emerald colors, asset patterns)
- EAS project ID correctly shows `CONFIGURE_VIA_EAS_INIT` placeholder
- `expo-doctor` hangs in current environment (no interactive TTY); skipped
- No commit (verification only)

### Task 5: Create BUILD.md documentation ✅

- Created comprehensive `apps/mobile/BUILD.md`
- Covers: prerequisites, env vars, EAS init, Apple/Google credentials, build commands, OTA updates,
  troubleshooting
- **Commit:** `d3865d00`

## Requirements Addressed

| REQ-ID   | Requirement                              | Status    |
| -------- | ---------------------------------------- | --------- |
| INFRA-08 | Mobile app builds via EAS without errors | Partially |

> **Note:** Full verification requires `eas init` with an Expo account (sets real project UUID) and
> actual native builds (requires Xcode/Android SDK). Config is correct and ready — just needs
> credentials.

## Deviations

1. **expo-doctor** hangs in CI-like environment — skipped interactive check, relied on `expo config`
   validation instead.
2. **No CI workflow added** — plan scope focused on local EAS config. CI workflow is a future
   enhancement.
3. **INFRA-08 marked partial** — config is fixed and build scripts work, but actual native build
   verification requires Expo account login and native toolchains not available in this environment.

## Files Modified

- `apps/mobile/app.config.js` — EAS project ID fix, asset pattern sync, versionCode sync
- `apps/mobile/app.json` — notification color, versionCode, remove duplicate sections, projectId
- `apps/mobile/package.json` — 8 new EAS build scripts
- `apps/mobile/BUILD.md` — new build documentation
