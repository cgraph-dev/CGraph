---
phase: 01-infrastructure-baseline
plan: 01
subsystem: infra
tags: [versioning, monorepo]
status: complete
started: 2026-02-27
completed: 2026-02-27
---

# Plan 01-01 Summary: Version Sync

Synced all 12 monorepo packages from mixed versions (0.9.31/0.9.36) to unified 0.9.47 baseline.

## Tasks Completed

| #   | Task                                        | Commit                               | Status |
| --- | ------------------------------------------- | ------------------------------------ | ------ |
| 1   | Update all package versions to 0.9.47       | `9fa2fcda`                           | Done   |
| 2   | Verify monorepo builds with synced versions | (verification only, no file changes) | Done   |

## Files Modified

- `apps/mobile/package.json` — 0.9.31 → 0.9.47
- `apps/landing/package.json` — 0.9.31 → 0.9.47
- `apps/backend/mix.exs` — 0.9.36 → 0.9.47
- `packages/api-client/package.json` — 0.9.31 → 0.9.47
- `packages/crypto/package.json` — 0.9.31 → 0.9.47
- `packages/shared-types/package.json` — 0.9.31 → 0.9.47
- `packages/socket/package.json` — 0.9.31 → 0.9.47
- `packages/utils/package.json` — 0.9.31 → 0.9.47
- `packages/animation-constants/package.json` — 0.9.31 → 0.9.47
- `docs-website/package.json` — 0.9.31 → 0.9.47

## Verification Results

- **11 JS/TS packages** at version 0.9.47 ✓
- **Backend mix.exs** at @version "0.9.47" ✓
- **pnpm install** — lockfile already up to date, no changes needed ✓
- **turbo build** — shared packages (socket, crypto) build successfully ✓
- **mix compile** — backend compiles successfully ✓

## Deviations

1. **No lockfile changes:** `pnpm install` reported lockfile already up to date, so no Task 2 commit
   was needed. The version field in package.json is metadata only; it doesn't affect dependency
   resolution in pnpm workspaces.
2. **Backend --warnings-as-errors:** `mix compile --warnings-as-errors` fails due to pre-existing
   `@doc` attribute redefinition warnings (not version-related). `mix compile` without the flag
   succeeds. These warnings are pre-existing tech debt, not introduced by this change.

## Duration

~3 minutes

## Next Step

Ready for 01-02-PLAN.md (Backend Route Audit)
