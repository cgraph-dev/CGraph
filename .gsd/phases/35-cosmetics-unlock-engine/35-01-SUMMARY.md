---
phase: 35-cosmetics-unlock-engine
plan: 01
status: complete
started: 2026-03-12
completed: 2026-03-12
tasks_total: 3
tasks_completed: 3
---

# Plan 35-01 Summary: Cosmetic Schemas + Migrations

## Objective

Create 4 new cosmetic schemas (Badge, Nameplate, ProfileEffect, ProfileFrame) with migrations and
proper rarity integration.

## Tasks Completed

### Task 1: Badge schema + migration (2.1)

- **Files**: `apps/backend/lib/cgraph/cosmetics/badge.ex`, migration `20260312100001`
- **Commit**: `324f6a3d`
- Created Badge Ecto schema with fields: slug (unique), name, description, icon_url, rarity,
  category, track, unlock_type, unlock_condition (JSONB), nodes_cost, stackable, sort_order,
  is_active
- Migration creates `badges` table with composite `[:rarity, :category]` index, individual rarity
  and category indexes, and unique slug constraint
- Rarity validated against `Rarity.string_values()` (7-tier)
- Uses `@primary_key {:id, :binary_id, autogenerate: true}` and
  `@timestamps_opts [type: :utc_datetime_usec]`

### Task 2: Nameplate schema + migration (2.2)

- **Files**: `apps/backend/lib/cgraph/cosmetics/nameplate.ex`, migration `20260312100002`
- **Commit**: `8dcd46f2`
- Created Nameplate Ecto schema with fields: slug (unique), name, background_url, text_color,
  border_style, rarity, unlock_type, unlock_condition (JSONB), animated (boolean), sort_order,
  is_active
- Migration creates `nameplates` table with rarity index and unique slug constraint
- Same binary_id PK and utc_datetime_usec timestamp conventions

### Task 3: Profile effect + frame schemas (2.3, 2.4)

- **Files**: `apps/backend/lib/cgraph/cosmetics/profile_effect.ex`,
  `apps/backend/lib/cgraph/cosmetics/profile_frame.ex`, migrations `20260312100003`,
  `20260312100004`
- **Commit**: `5a25e507`
- ProfileEffect schema: slug, name, type (particle|aura|trail), config (JSONB), rarity, preview_url,
  sort_order, is_active
- ProfileFrame schema: slug, name, frame_url, animated (boolean), rarity, unlock_type,
  unlock_condition (JSONB), sort_order, is_active (manifest has 55 frames)
- Both migrations include rarity indexes, type index (effects), unique slug constraints

## Must-Haves Verification

| Requirement                                                | Status |
| ---------------------------------------------------------- | ------ |
| Badge schema with all required fields                      | Done   |
| Nameplate schema with all required fields                  | Done   |
| ProfileEffect schema with type (particle\|aura\|trail)     | Done   |
| ProfileFrame schema (55 frames in manifest)                | Done   |
| All schemas use 7-tier rarity from CGraph.Cosmetics.Rarity | Done   |
| unlock_condition JSONB stores {type, threshold, metadata}  | Done   |
| All tables have indexes on rarity + category columns       | Done   |
| All schemas use binary_id primary key + autogenerate       | Done   |
| All schemas use utc_datetime_usec timestamps               | Done   |

## Files Created

- `apps/backend/lib/cgraph/cosmetics/badge.ex`
- `apps/backend/lib/cgraph/cosmetics/nameplate.ex`
- `apps/backend/lib/cgraph/cosmetics/profile_effect.ex`
- `apps/backend/lib/cgraph/cosmetics/profile_frame.ex`
- `apps/backend/priv/repo/migrations/20260312100001_create_badges_table.exs`
- `apps/backend/priv/repo/migrations/20260312100002_create_nameplates_table.exs`
- `apps/backend/priv/repo/migrations/20260312100003_create_profile_effects_table.exs`
- `apps/backend/priv/repo/migrations/20260312100004_create_profile_frames_table.exs`
