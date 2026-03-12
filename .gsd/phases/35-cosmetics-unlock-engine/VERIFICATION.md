# Phase 35 — Cosmetics Unlock Engine — Verification Report

**Verified by:** GSD Verifier  
**Date:** 2025-07-24  
**Backend compile status:** 0 errors, 13 warnings (all pre-existing, none from Phase 35)

---

## Summary

All 7 plans verified against codebase. **20 errors found and fixed** across plans 35-01 through
35-07. All fixes prevent implementation failures that would have occurred during execution.

---

## Fixed Issues by Plan

### Plan 35-01 (Schemas) — 5 fixes

| #   | Issue                              | Fix                                                                                                               |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Rarity field typed as `Ecto.Enum`  | Changed to `:string` with `validate_inclusion(:rarity, Rarity.string_values())` matching avatar_border.ex pattern |
| 2   | Missing UUID/binary_id conventions | Added `@primary_key {:id, :binary_id, autogenerate: true}`, `@foreign_key_type :binary_id`, `@timestamps_opts`    |
| 3   | Manifest said "profile_effects"    | Corrected: manifest has `profile_themes: 25`, NO `profile_effects` key                                            |
| 4   | No slug field mentioned            | Added slug requirement (unique, string) matching existing schemas                                                 |
| 5   | No reference to existing patterns  | Added link to avatar_border.ex as canonical schema pattern                                                        |

### Plan 35-02 (Inventory) — 4 fixes

| #   | Issue                             | Fix                                                                                                          |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | `item_id` typed as `:integer`     | Changed to `:binary_id` (all PKs are UUID)                                                                   |
| 2   | `item_type` enum had `chat_theme` | Fixed to `chat_effect` / `profile_theme` (matching existing schemas)                                         |
| 3   | Missing schema conventions        | Added binary_id PK, foreign_key_type, timestamps directives                                                  |
| 4   | Join tables undocumented          | Listed all 4 existing join tables (user_avatar_borders, user_titles, user_chat_effects, user_profile_themes) |

### Plan 35-03 (API Routes) — 7 fixes

| #   | Issue                                                | Fix                                                                                       |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | Controller paths contradicted (top-level vs api/v1/) | Standardized to `controllers/api/v1/`                                                     |
| 2   | Said "do NOT modify router.ex"                       | router.ex MUST be modified (add import + macro call)                                      |
| 3   | Said "extend cosmetics.ex context"                   | cosmetics.ex does NOT exist — must be CREATED (only rarity.ex exists)                     |
| 4   | Missing router.ex modification details               | Added exact import line position (after line 40) and macro call position (after line 141) |
| 5   | Route deduplication warning missing                  | Added warning: gamification_routes.ex already has border/theme/effect routes              |
| 6   | files_modified missing router.ex                     | Added `apps/backend/lib/cgraph_web/router.ex`                                             |
| 7   | files_modified missing cosmetics.ex                  | Added `apps/backend/lib/cgraph/cosmetics/cosmetics.ex (CREATE)`                           |

### Plan 35-04 (Unlock Engine) — 4 fixes

| #   | Issue                                   | Fix                                                                                 |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | LevelEvaluator used `user.level`        | XP tables were dropped. Use `reputation_score` or `post_count` instead              |
| 2   | UnlockCheckWorker in `:cosmetics` queue | Should use `:unlocks` queue (both `:cosmetics` and `:unlocks` exist in Oban config) |
| 3   | No achievement_triggers.ex reference    | Added reference to existing `@action_achievement_map` pattern                       |
| 4   | Missing Oban queue documentation        | Documented both queues: `:cosmetics` (10) and `:unlocks` (10)                       |

### Plan 35-05 (Frontend UI) — 3 fixes

| #   | Issue                                   | Fix                                                                                   |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | shop-page.tsx listed as "update"        | Changed to "new" — no `modules/cosmetics/` directory exists                           |
| 2   | Key links referenced non-existent paths | Corrected: existing cosmetics UI is at `settings/components/cosmetics-settings/` only |
| 3   | Mobile paths assumed existing           | Clarified: NO mobile cosmetics screens/components exist, all must be created          |

### Plan 35-06 (Seed Data) — 4 fixes

| #   | Issue                | Fix                                                                                                |
| --- | -------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | Manifest path wrong  | Changed from `priv/cosmetics/COSMETICS_MANIFEST.json` to `priv/repo/seeds/cosmetics_manifest.json` |
| 2   | "15 profile effects" | Manifest has NO profile_effects key. Has `profile_themes: 25`. Flagged for implementor decision    |
| 3   | "20 profile frames"  | Corrected to 55 frames (manifest value)                                                            |
| 4   | "25 name styles"     | Corrected to 50 styles (manifest value)                                                            |

### Plan 35-07 (Types + API Client) — 3 fixes

| #   | Issue                                      | Fix                                                                            |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| 1   | api-client cosmetics.ts listed as "update" | Changed to CREATE — file does not exist                                        |
| 2   | shared-types CosmeticType assumed complete | Noted: `profile_frame` and `name_style` missing from union type, must be added |
| 3   | cosmetics.ex listed as "update"            | Changed to CREATE — only rarity.ex exists in cosmetics/ dir                    |

---

## Codebase State Reference (for implementors)

### Existing files — DO NOT recreate

| File                                                 | Key facts                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `lib/cgraph/cosmetics/rarity.ex`                     | 7 tiers (free→mythic), `tiers/0`, `string_values/0`, `atom_values/0`, `rank/1`, `compare/2`, `color/1`     |
| `lib/cgraph/gamification/avatar_border.ex`           | Canonical schema pattern — slug, :string rarity, binary_id PK, Lottie fields                               |
| `lib/cgraph/gamification/title.ex`                   | :string rarity with `Rarity.string_values()`, unlock_type/requirement                                      |
| `lib/cgraph/gamification/user_avatar_border.ex`      | Join table: user_id, avatar_border_id, is_equipped, unlock_source                                          |
| `lib/cgraph/gamification/user_title.ex`              | Join table: user_id, title_id, unlocked_at                                                                 |
| `lib/cgraph/gamification/user_chat_effect.ex`        | Join table: is_active, unlock_source, expires_at, custom_config                                            |
| `lib/cgraph/gamification/user_profile_theme.ex`      | Join table: is_active, custom overrides                                                                    |
| `lib/cgraph_web/controllers/cosmetics_controller.ex` | Border/theme/effect endpoints already exist                                                                |
| `lib/cgraph_web/router/gamification_routes.ex`       | Already has cosmetics routes (borders/themes/effects)                                                      |
| `priv/repo/seeds/cosmetics_manifest.json`            | badges:70, titles:70, nameplates:45, profile_themes:25, name_styles:50, profile_frames:55, forum_themes:10 |
| `priv/repo/seeds/seed_borders.exs`                   | Uses `alias Cgraph.Repo` (lowercase g)                                                                     |
| `packages/shared-types/src/cosmetics.ts`             | CosmeticType, CosmeticItem, UserCosmeticInventory, UnlockCondition                                         |

### Files that must be CREATED (do not exist)

| File                                           | Notes                                  |
| ---------------------------------------------- | -------------------------------------- |
| `lib/cgraph/cosmetics/cosmetics.ex`            | Context module — only rarity.ex exists |
| `lib/cgraph_web/router/cosmetics_routes.ex`    | Route macro module                     |
| `packages/api-client/src/cosmetics.ts`         | API client methods                     |
| `apps/web/src/modules/cosmetics/` (entire dir) | All pages + components are new         |
| `apps/mobile/src/screens/cosmetics/`           | All screens are new                    |
| `apps/mobile/src/components/cosmetics/`        | All components are new                 |

### Oban queues (already configured)

- `:cosmetics` — 10 workers
- `:unlocks` — 10 workers

### Manifest counts (source of truth)

| Type            | Count | Notes               |
| --------------- | ----- | ------------------- |
| badges          | 70    |                     |
| titles          | 70    |                     |
| nameplates      | 45    |                     |
| profile_themes  | 25    | NOT profile_effects |
| name_styles     | 50    |                     |
| profile_frames  | 55    |                     |
| forum_themes    | 10    |                     |
| profile_effects | —     | NOT in manifest     |

---

## Verdict

**PASS with corrections** — All 7 plans have been corrected. No blocking issues remain. Plans are
now safe to execute.
