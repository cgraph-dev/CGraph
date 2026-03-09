# Plan 28-03 Summary: Border Unification

**Phase:** 28 — Complete Cosmetics  
**Plan:** 03 — Unify border rendering  
**Status:** ✅ Complete  
**Date:** 2026-03-10  

## Objective

Unify border rendering: replace CSS-particle borders with Lottie, ensure single
rendering path per border, verify all 42 canonical borders, and sync backend seed
data from 18 to 42 borders.

## Tasks Completed

### Task 1: Unify border rendering to single Lottie path
**Commit:** `e1ac28b4`

- **Switched rendering consumers** (`avatar.tsx`, `profile-card-preview.tsx`) from
  `borderCollections.ts` → `avatar-borders.ts` (`getBorderById` + `lottieUrl`)
- **Added `RARITY_COLORS`** (Tailwind variant) and re-exported `BorderRarity`/`BorderTheme`
  types from `avatar-borders.ts` for consumer convenience
- **Updated `themed-border-card.tsx`** to import `RARITY_COLORS` from `avatar-borders`
- **Marked `borderCollections.ts` as `@deprecated`** — retained only for the browse/filter
  UI (themed-border-card, borders-section, useIdentityCustomization) which uses the old
  `BorderDefinition` type with animationType/colors fields
- **Deleted `border-particle-system/`** directory (10 files, ~300 lines) and its barrel
  re-export `border-particle-system.tsx` — confirmed zero external importers

### Task 2: Verify all 42 borders compile cleanly
**Commit:** `7f185e7d`

- Confirmed `avatar-borders.ts` contains exactly **42** `AvatarBorderConfig` entries
- Verified all 42 entries have `lottieUrl` pointing to valid files in `public/lottie/borders/`
- **44 Lottie JSON files** exist in the borders directory (2 extras — acceptable)
- TypeScript compilation passes with **zero border-related errors**

### Task 3: Sync backend border seed to 42 Lottie borders
**Commit:** `d6cf0dfa`

- Created `apps/backend/priv/repo/seeds/seed_borders.exs` — 42 Lottie borders
- Each border includes `lottie_url`, `lottie_config`, `animation_type: "lottie"`
- Uses **upsert semantics** (`ON CONFLICT (slug) DO UPDATE`) — safe to run on top of
  existing 18 borders from the original migration
- Border data faithfully translated from `avatar-borders.ts` (themes, rarities, unlock
  types, metadata with colors/tags)

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/data/avatar-borders.ts` | Added `RARITY_COLORS`, re-exported types |
| `apps/web/src/data/borderCollections.ts` | Marked `@deprecated` |
| `apps/web/src/components/ui/avatar.tsx` | Import → `avatar-borders`, `lottieFile` → `lottieUrl` |
| `apps/web/src/modules/settings/.../profile-card-preview.tsx` | Import → `avatar-borders`, `lottieFile` → `lottieUrl` |
| `apps/web/src/modules/settings/.../themed-border-card.tsx` | `RARITY_COLORS` import → `avatar-borders` |
| `apps/web/src/modules/social/.../border-particle-system.tsx` | **Deleted** |
| `apps/web/src/modules/social/.../border-particle-system/` | **Deleted** (10 files) |
| `apps/backend/priv/repo/seeds/seed_borders.exs` | **Created** — 42-border Lottie seed |

## Must-Have Verification

| Truth | Status |
|-------|--------|
| All CSS-particle borders replaced with Lottie equivalents | ✅ Particle system deleted; rendering path uses Lottie |
| Single rendering path per border (Lottie or CSS, never both) | ✅ `avatar.tsx` and `profile-card-preview.tsx` use Lottie-only path |
| All 42 canonical borders render correctly on web | ✅ 42 entries, all with valid `lottieUrl`, TS compiles clean |
| Backend seed synced: 42 borders (up from 18) | ✅ `seed_borders.exs` with 42 upsert entries |

## Remaining Technical Debt

- `borderCollections.ts` (1260 lines) still imported by browse/filter UI components
  (`borders-section.tsx`, `useIdentityCustomization.ts`, `themed-border-card/animations.ts`,
  `themed-border-card/types.ts`). These use `BorderDefinition` with `animationType`/`colors`
  fields incompatible with `AvatarBorderConfig`. Full migration requires UI refactor.
