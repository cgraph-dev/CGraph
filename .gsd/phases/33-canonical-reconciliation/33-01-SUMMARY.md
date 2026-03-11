---
plan: 33-01
phase: 33-canonical-reconciliation
status: complete
completed: 2026-03-11
tasks_completed: 3
tasks_total: 3
---

# Plan 33-01 Summary: Canonical Cosmetics Manifest & Unified Rarity

## Objective

Create the canonical cosmetics manifest resolving all source document conflicts, build the unified
Rarity module, and normalize all existing cosmetics to the 7-tier rarity system.

## Tasks Completed

### Task 1: Create canonical cosmetics manifest (P0.1)

**Description**: Resolved 5 source document conflicts and created the single source of truth for all
cosmetic items across the platform.

**Files created**:

- `docs/COSMETICS_MANIFEST.md` (422 lines) — Human-readable canonical reference
- `apps/backend/priv/repo/seeds/cosmetics_manifest.json` — Machine-readable seed data

**Commit**: `c37878ef` — `docs(33-01): create canonical cosmetics manifest`

**Counts verified**:

- Badges: 70 (60 base + 10 forum)
- Titles: 70 (55 base + 15 forum rank/tier/event)
- Nameplates: 45 (30 base + 15 forum)
- Profile Themes: 25 (5 free + 5 earned + 15 shop)
- Name Styles: 50 (8 fonts + 12 effects + 15 colors + 10 prefixes + 5 suffixes)
- Profile Frames: 55 (50 base + 5 free defaults)
- Forum Themes: 10 (Neon Cyber → Zen Garden)
- **Total: 325 items**

### Task 2: Create unified rarity module (P0.2)

**Description**: Created `CGraph.Cosmetics.Rarity` module with canonical 7-tier system and updated
all 4 existing gamification schemas to use it.

**Files created**:

- `apps/backend/lib/cgraph/cosmetics/rarity.ex` — Unified rarity module

**Files modified**:

- `apps/backend/lib/cgraph/gamification/avatar_border.ex` — Removed `@rarities` (9 values), uses
  `Rarity.string_values()`
- `apps/backend/lib/cgraph/gamification/chat_effect.ex` — Removed `@rarities` (7 values), uses
  `Rarity.string_values()`
- `apps/backend/lib/cgraph/gamification/profile_theme.ex` — Removed `@rarities` (8 values), uses
  `Rarity.string_values()`
- `apps/backend/lib/cgraph/gamification/title.ex` — Removed `@rarities` (7 values), uses
  `Rarity.string_values()`

**Commit**: `c0431e11` — `feat(33-01): create unified rarity module`

**Rarity module API**:

- `tiers/0` — `[:free, :common, :uncommon, :rare, :epic, :legendary, :mythic]`
- `string_values/0` — `["free", "common", "uncommon", "rare", "epic", "legendary", "mythic"]`
- `atom_values/0` — same as `tiers/0`
- `color/1` — hex color for each tier
- `rank/1` — 0-based numeric rank
- `compare/2` — `:lt | :eq | :gt` comparison

### Task 3: Rarity migration (P0.3)

**Description**: Created migration to normalize all cosmetic tables to the canonical 7-tier system,
adding the `source` field for provenance tracking.

**Files created**:

- `apps/backend/priv/repo/migrations/20260311120000_unify_rarity_tiers.exs`

**Commit**: `54abae7a` — `feat(33-01): add rarity tier migration`

**Migration actions**:

- Adds `source` column (string, default: "earned") to all 4 cosmetic tables
- Creates index on `source` for each table
- Backfills: `seasonal` → rarity=rare, source=seasonal
- Backfills: `event` → rarity=rare, source=event
- Backfills: `unique` → rarity=mythic
- Backfills: purchasable items → source=purchased
- Full `down/0` rollback included

## Deviations

| Deviation                                                       | Reason                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile Frames count is 55, not "50+"                           | Plan specified "50+"; 55 = 50 base + 5 free defaults, within spec                                                                                                                                                                                              |
| Migration uses string type for `source`, not Ecto.Enum          | Matches existing codebase pattern — all schemas use `:string` + `validate_inclusion/3`, not `Ecto.Enum`. Ecto.Enum would require a DB-level enum creation which diverges from existing patterns. Source validation will be added in a follow-up schema update. |
| `achievement.ex` also has `@rarities` but was not in plan scope | Noted during pre-task audit; achievement.ex has 6 values (common→mythic). Not modified per plan scope — will be addressed in a follow-up plan if needed.                                                                                                       |

## Must-Haves Verification

| Must-Have                                                                                                                                                         | Status                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| COSMETICS_MANIFEST.md created with definitive counts: 70 badges, 70 titles, 45 nameplates, 25 profile themes, 50 name styles, 50+ profile frames, 10 forum themes | ✅ All counts match                                    |
| cosmetics_manifest.json contains every cosmetic item with id, slug, name, rarity, category, track, unlock_type, unlock_condition, nodes_cost                      | ✅ 325 items, all fields present                       |
| All 7 rarity tiers represented across all cosmetic types                                                                                                          | ✅ Every type has items distributed across free→mythic |
| Zero numeric conflicts between section counts and item lists                                                                                                      | ✅ JSON totals match MD tables                         |
| CGraph.Cosmetics.Rarity module created with tiers/0, string_values/0, color/1, rank/1, compare/2                                                                  | ✅ All functions + atom_values/0                       |
| Existing schemas updated to use Rarity.string_values() in validate_inclusion/3                                                                                    | ✅ avatar_border, chat_effect, profile_theme, title    |
| Migration adds free tier to schemas missing it, adds source field                                                                                                 | ✅ source field added to all 4 tables                  |
| Migration has down/0 rollback                                                                                                                                     | ✅ Full rollback                                       |
