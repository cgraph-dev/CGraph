---
phase: 35-cosmetics-unlock-engine
plan: 07
status: complete
completed_at: "2026-03-12"
commits:
  - hash: 010c1c28
    message: "feat(35-07): extend shared cosmetics types"
  - hash: 76cd7901
    message: "feat(35-07): create api-client cosmetics module"
  - hash: 24bc43ce
    message: "feat(35-07): add cosmetics_unlock_log join table migration"
---

# Plan 35-07 Summary

## Objective
Extend shared types and API client for all new cosmetic types, create join table migration, and ensure end-to-end type safety from backend to frontend.

## Tasks Completed

### Task 1: Extend shared cosmetics types
- **File:** `packages/shared-types/src/cosmetics.ts`
- Added `profile_frame` and `name_style` to `CosmeticType` union
- Added interfaces: `Badge`, `Nameplate`, `ProfileEffect`, `ProfileFrame`, `NameStyle`, `InventoryItem`
- All types use `RarityTier` from `./rarity` and existing `UnlockCondition`
- Barrel already re-exported via `export * from './cosmetics'` in index.ts

### Task 2: Create API client cosmetics module
- **Files:** `packages/api-client/src/cosmetics.ts` (NEW), `packages/api-client/src/index.ts` (updated)
- Created typed API methods: `getInventory`, `equipItem`, `unequipItem`, `getBadges`, `getUserBadges`, `getNameplates`, `getUserNameplates`, `getProfileEffects`, `getProfileFrames`, `getNameStyles`
- Uses inline type definitions (no `@cgraph/shared-types` import — matches nodes.ts pattern from Phase 34 fix)
- Types use snake_case to match backend JSON:API response shapes
- Added barrel re-exports in index.ts

### Task 3: Join table migration
- **File:** `apps/backend/priv/repo/migrations/20260312100020_add_cosmetics_join_tables.exs`
- Created `cosmetics_unlock_log` table with `binary_id` PK
- Columns: `user_id` (FK → users), `item_type`, `item_id`, `unlocked_at` (utc_datetime_usec), `via`
- Index on `[user_id, item_type]`; unique index on `[user_id, item_type, item_id]`
- Backend compiles cleanly (warnings are pre-existing)

## Must-Haves Verification
- ✅ shared-types cosmetics.ts exports Badge, Nameplate, ProfileEffect, ProfileFrame, NameStyle, InventoryItem, CosmeticType union
- ✅ api-client cosmetics.ts exports getInventory, equipItem, unequipItem, getBadges, getNameplates, getUserBadges, etc.
- ✅ Join table migration for user↔cosmetic unlock log
- ✅ Types match backend JSON:API response shapes (snake_case in api-client)
- ✅ Barrel re-exports from package index
