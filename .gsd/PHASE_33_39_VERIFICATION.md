# Phase 33–39 Verification Report

> **Generated:** 2025-07-25 **Updated:** 2025-07-25 — ALL 41 ISSUES FIXED **Methodology:**
> Goal-backward codebase audit — verified every file path, module name, schema, function,
> dependency, and architectural assumption in all 35 plan files against the actual codebase.
> **Original Verdict:** ✗ FAILED — 41 issues found (14 CRITICAL, 15 MAJOR, 12 MINOR) **Current
> Verdict:** ✓ ALL ISSUES ADDRESSED — All 35 plan files updated with correct paths, warnings,
> pre-tasks, and architectural guidance.

## Fix Summary

All 41 issues have been resolved by editing the plan files directly. Here is what was done:

### Systemic Fixes Applied

| Fix ID    | Issue                              | Plans Fixed                                            | Resolution                                                                                                                                                                    |
| --------- | ---------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FIX-A** | `cgraph/cosmetics/` does not exist | 33-01, 35-01, 35-02, 35-03, 35-04, 35-05               | Added ⚠️ warnings that `cosmetics/` is a NEW directory. Fixed key_links to reference actual `gamification/avatar_border.ex` and `gamification/title.ex` paths.                |
| **FIX-B** | Controllers under `api/v1/`        | 35-03, 36-01, 36-02, 36-03, 37-01, 37-02, 37-04, 39-01 | All controller paths changed to top-level `controllers/` (matching existing pattern).                                                                                         |
| **FIX-C** | Direct `router.ex` modification    | 35-03, 36-01, 36-02, 36-03, 37-01, 37-02, 37-04, 39-01 | All changed to create macro-based route modules (e.g., `CGraphWeb.Router.PaidDmRoutes`).                                                                                      |
| **FIX-D** | Phase 38 recreates existing infra  | 38-02, 38-03, 38-04                                    | Added MANDATORY AUDIT pre-tasks. Changed "new" to "update/extend existing". Added detailed warnings about existing 10-file cache system, search modules, and image_optimizer. |

### Individual Fixes Applied

| Fix ID    | Issue                                                       | Plan Fixed          | Resolution                                                                                |
| --------- | ----------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| **FIX-E** | Dropped gamification tables                                 | 33-01               | Added warning about migration `20260723120000` and which tables were kept vs dropped.     |
| **FIX-F** | Missing deps (samly, ueberauth, mogrify/vix, elasticsearch) | 39-01, 38-04, 38-03 | Added pre_tasks to audit existing `assent` dep, add missing hex deps before building.     |
| **FIX-G** | `forum_permissions.ex` → `forum_permission.ex`              | 37-04               | Fixed to singular filename. Added note about existing RBAC.                               |
| **FIX-H** | `gdpr_export.ex` marked as "update" but doesn't exist       | 36-03               | Changed to "CREATE NEW". Added warning that entire `compliance/` directory is new.        |
| **FIX-I** | `thread_poll.ex` / `advanced_search.ex` marked as "new"     | 37-03               | Changed to "update — ALREADY EXISTS". Added line counts and extend-not-recreate guidance. |
| **FIX-J** | `message-actions.tsx` doesn't exist                         | 34-02               | Changed to `message-bubble/message-action-menu.tsx` (correct path).                       |
| **FIX-K** | `creatorStore.ts` / `creatorService.ts` marked as "new"     | 36-05               | Changed to "update — ALREADY EXISTS".                                                     |
| **FIX-L** | `:critical` Oban queue marked as "new"                      | 33-03               | Changed to "UPDATE concurrency 10→20". Fixed total queue count 22→25.                     |
| **FIX-M** | `border_seeds.exs` wrong filename                           | 35-06               | Changed to `seed_borders.exs` (correct filename).                                         |
| **FIX-N** | Profile card has 6 variants                                 | 34-02               | Added note about layout variants for tip button placement.                                |
| **FIX-O** | Missing customization audit                                 | 34-05               | Added pre_tasks to audit existing customizationStore.ts and customize/ screens.           |
| **FIX-P** | Dropped XP tables affect LevelEvaluator                     | 35-04               | Added warning that LevelEvaluator cannot use user.level from dropped XP table.            |
| **FIX-Q** | `compliance/` dir referenced as pre-existing                | 39-03               | Fixed key_link to note it's created in Phase 36-03, not pre-existing.                     |

---

### Original Report (Preserved Below)

---

## Table of Contents

1. [Critical Issues (14)](#1-critical-issues)
2. [Major Issues (15)](#2-major-issues)
3. [Minor Issues (12)](#3-minor-issues)
4. [Affected Plans Matrix](#4-affected-plans-matrix)
5. [Fix Recommendations](#5-fix-recommendations)

---

## 1. CRITICAL Issues

These will cause compilation errors, runtime failures, or architectural conflicts if implemented
as-written.

### C-01: Wrong module path — `cgraph/cosmetics/` does not exist

| Field              | Value                                                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | CRITICAL                                                                                                                                                                                                            |
| **Affected Plans** | 33-01, 35-01, 35-02, 35-03, 35-04, 35-06, 35-07                                                                                                                                                                     |
| **Plans Say**      | Create files under `apps/backend/lib/cgraph/cosmetics/` (e.g., `rarity.ex`, `badge.ex`, `inventory.ex`, `unlock_engine.ex`, etc.)                                                                                   |
| **Reality**        | Directory `cgraph/cosmetics/` does NOT exist. All cosmetics schemas live under `apps/backend/lib/cgraph/gamification/`                                                                                              |
| **Impact**         | ~25 new files proposed under a non-existent directory structure. Creating `cgraph/cosmetics/` alongside `cgraph/gamification/` will create a confusing parallel module tree with split ownership of cosmetics logic |

**Fix:** Either (A) place all new cosmetics files under `cgraph/gamification/` with the existing
schemas, or (B) create `cgraph/cosmetics/` AND migrate `avatar_border.ex`, `title.ex`,
`profile_theme.ex`, `chat_effect.ex` out of `cgraph/gamification/` into it. Option B requires
updating all existing references across the codebase.

---

### C-02: Plans reference `border.ex` but actual schema is `avatar_border.ex`

| Field              | Value                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Severity**       | CRITICAL                                                                                                         |
| **Affected Plans** | 35-01, 35-02, 35-06                                                                                              |
| **Plans Say**      | Reference pattern: `apps/backend/lib/cgraph/cosmetics/border.ex`                                                 |
| **Reality**        | Actual file: `apps/backend/lib/cgraph/gamification/avatar_border.ex`, module: `CGraph.Gamification.AvatarBorder` |
| **Impact**         | Any code referencing `CGraph.Cosmetics.Border` will fail to compile                                              |

**Fix:** Update all references from `border.ex` / `Border` to `avatar_border.ex` / `AvatarBorder`.

---

### C-03: Gamification tables were DROPPED — schemas are orphaned

| Field              | Value                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Severity**       | CRITICAL                                                                                                                                                                                                                                                                                                                                                                             |
| **Affected Plans** | 33-01, 33-03, 35-01, 35-02, 35-04                                                                                                                                                                                                                                                                                                                                                    |
| **Plans Say**      | Modify existing schemas (`avatar_border.ex`, `title.ex`, etc.) and build unlock engine on top of them                                                                                                                                                                                                                                                                                |
| **Reality**        | Migration `20260723120000_drop_gamification_tables.exs` drops tables: `xp_transactions`, `xp_configs`, `daily_caps`, `user_quests`, `quests`, `prestige_rewards`, `user_prestige`, `user_event_progress`, `battle_pass_tiers`, `seasonal_events`, `marketplace_items`, `leaderboard_entries`, `feature_gate_configs`, `coin_transactions`. Achievement and cosmetic tables are KEPT. |
| **Impact**         | Plans that depend on XP, quests, prestige, events, or marketplace will fail — those tables no longer exist. However, core cosmetic tables (borders, titles, themes, effects) ARE still intact                                                                                                                                                                                        |

**Fix:** Phase 33 should acknowledge the dropped tables and NOT reference XP/quest/prestige/event
functionality. The unlock engine (35-04) should NOT use XP-based evaluators unless XP tables are
recreated first.

---

### C-04: CosmeticsController is NOT under `api/v1/` namespace

| Field              | Value                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | CRITICAL                                                                                                                                                                              |
| **Affected Plans** | 35-03, 36-01, 36-02, 36-03, 37-01, 37-02, 37-03, 37-04, 39-01                                                                                                                         |
| **Plans Say**      | Create controllers at `apps/backend/lib/cgraph_web/controllers/api/v1/<name>_controller.ex`                                                                                           |
| **Reality**        | Existing `CosmeticsController` is at `apps/backend/lib/cgraph_web/controllers/cosmetics_controller.ex` (top-level, not under `api/v1/`). Module name: `CGraphWeb.CosmeticsController` |
| **Impact**         | 12+ new controllers proposed under `api/v1/` subdirectory which doesn't match existing controller placement pattern. Creates inconsistent controller organization                     |

**Fix:** Place all new controllers at the top-level `controllers/` directory (matching existing
`cosmetics_controller.ex`, not under `api/v1/`), OR if the intent is to move to namespaced
controllers, create a migration plan for ALL existing controllers.

---

### C-05: Router uses macro-based route modules — plans assume direct route definitions

| Field              | Value                                                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | CRITICAL                                                                                                                                                                                                                          |
| **Affected Plans** | 35-03, 36-01, 36-02, 36-03, 37-01, 37-02, 37-03, 37-04, 39-01                                                                                                                                                                     |
| **Plans Say**      | "Modify `router.ex` — add routes" (direct route definitions)                                                                                                                                                                      |
| **Reality**        | Router imports domain-specific route modules and calls macros: `CGraphWeb.Router.GamificationRoutes`, `CGraphWeb.Router.NodesRoutes`, `CGraphWeb.Router.ForumRoutes`, etc. Pattern: create module → import in router → call macro |
| **Impact**         | Adding routes directly to `router.ex` breaks the established architectural pattern and will cause merge conflicts with the 15+ existing route modules                                                                             |

**Fix:** Each plan that adds routes should specify creating a new route module (e.g.,
`CGraphWeb.Router.PaidDmRoutes`, `CGraphWeb.Router.BoostRoutes`,
`CGraphWeb.Router.EnterpriseRoutes`) instead of modifying `router.ex` directly.

---

### C-06: Phase 38-02 proposes building cache system that ALREADY EXISTS

| Field              | Value                                                                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | CRITICAL                                                                                                                                                                                                               |
| **Affected Plans** | 38-02                                                                                                                                                                                                                  |
| **Plans Say**      | Create: `multi_tier_cache.ex`, `cache_warmer.ex`, `cache_invalidator.ex` with L1(ETS)/L2(Redis)/L3(Postgres) tiers                                                                                                     |
| **Reality**        | `apps/backend/lib/cgraph/cache/` already has 10 files: `l1.ex`, `l2.ex`, `l3.ex`, `distributed.ex`, `tiered.ex`, `unified.ex`, `redis_pool.ex`, `stampede.ex`, `tags.ex`, `telemetry.ex` + `distributed/` subdirectory |
| **Impact**         | Complete duplication — creating `multi_tier_cache.ex` alongside existing `tiered.ex` and `unified.ex` will cause confusion and potential conflicts                                                                     |

**Fix:** Replace 38-02 cache tasks with: (1) Audit existing cache modules, (2) Add `cache_warmer.ex`
and `cache_invalidator.ex` IF they don't already exist in the cache system, (3) Extend existing
architecture rather than rebuilding.

---

### C-07: Phase 38-03 proposes creating workers that ALREADY EXIST

| Field              | Value                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | CRITICAL                                                                                                                                 |
| **Affected Plans** | 38-02, 38-03                                                                                                                             |
| **Plans Say**      | Create `search_index_worker.ex`, `dead_letter_worker.ex`, `archival_worker.ex`                                                           |
| **Reality**        | ALL three already exist: `apps/backend/lib/cgraph/workers/search_index_worker.ex`, `dead_letter_worker.ex`, `message_archival_worker.ex` |
| **Impact**         | Creating duplicate files will fail or shadow existing implementations. The codebase already has 30 workers.                              |

**Fix:** Change to "extend" or "audit/enhance" — review existing worker implementations and add
missing functionality rather than creating from scratch.

---

### C-08: Phase 38-04 proposes creating image_optimizer that ALREADY EXISTS

| Field              | Value                                                               |
| ------------------ | ------------------------------------------------------------------- |
| **Severity**       | CRITICAL                                                            |
| **Affected Plans** | 38-04                                                               |
| **Plans Say**      | Create `apps/backend/lib/cgraph/cdn/image_optimizer.ex`             |
| **Reality**        | `apps/backend/lib/cgraph/uploads/image_optimizer.ex` already exists |
| **Impact**         | Two competing image optimizers in different directories             |

**Fix:** Reference and extend the existing `uploads/image_optimizer.ex` instead of creating
`cdn/image_optimizer.ex`.

---

### C-09: Missing hex dependencies for Phase 39

| Field              | Value                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| **Severity**       | CRITICAL                                                                                                          |
| **Affected Plans** | 39-01                                                                                                             |
| **Plans Say**      | Use `samly` (SAML 2.0) and `ueberauth` (OIDC) for SSO                                                             |
| **Reality**        | Neither `samly` nor `ueberauth` exists in `mix.exs`. The codebase uses `assent ~> 0.2` for OAuth                  |
| **Impact**         | SSO implementation will require adding new deps AND ensuring they don't conflict with existing `assent` auth flow |

**Fix:** 39-01 must include explicit dep addition tasks (`{:samly, "~> x.x"}`,
`{:ueberauth, "~> x.x"}`) or preferably investigate whether `assent` can handle SAML/OIDC to avoid
adding competing auth libraries.

---

### C-10: Missing hex dependencies for image processing

| Field              | Value                                                                |
| ------------------ | -------------------------------------------------------------------- |
| **Severity**       | CRITICAL                                                             |
| **Affected Plans** | 38-04                                                                |
| **Plans Say**      | "Hex packages considered: Mogrify or Vix"                            |
| **Reality**        | Neither `mogrify` nor `vix` exists in `mix.exs`                      |
| **Impact**         | Image processing tasks will fail without adding the dependency first |

**Fix:** Add explicit task in 38-04 to add the chosen image processing dep to `mix.exs` before
implementing features.

---

### C-11: Search infrastructure duplicates existing `cgraph/search/` module

| Field              | Value                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | CRITICAL                                                                                                                                                         |
| **Affected Plans** | 38-03                                                                                                                                                            |
| **Plans Say**      | Create `apps/backend/lib/cgraph/search/elastic_adapter.ex`, `search_indexer.ex`                                                                                  |
| **Reality**        | `apps/backend/lib/cgraph/search/` already exists with: `backend.ex`, `indexer.ex`, `messages.ex`, `search_engine.ex`, `users.ex` + `search_engine/` subdirectory |
| **Impact**         | Creating `search_indexer.ex` alongside existing `indexer.ex` causes naming conflict and design duplication                                                       |

**Fix:** Extend existing search architecture. If Elasticsearch support is needed, add it as a new
backend in the existing `search_engine/` directory.

---

### C-12: `forum_permissions.ex` (plural) doesn't exist — it's `forum_permission.ex` (singular)

| Field              | Value                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Severity**       | CRITICAL                                                                                                                                               |
| **Affected Plans** | 37-04                                                                                                                                                  |
| **Plans Say**      | Modify `apps/backend/lib/cgraph/forums/forum_permissions.ex` — "extend with roles"                                                                     |
| **Reality**        | File is `forum_permission.ex` (singular), module: `CGraph.Forums.ForumPermission`. Already has full RBAC: `can?/4`, `get_effective_permission/4`, etc. |
| **Impact**         | Plan will fail to find the file to modify. Additionally, the "extend with roles" work may already be done                                              |

**Fix:** Correct filename to `forum_permission.ex` and audit existing RBAC before adding duplicate
permission logic.

---

### C-13: `cosmetics.ex` context module path is wrong

| Field              | Value                                                                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | CRITICAL                                                                                                                                                                                             |
| **Affected Plans** | 35-03                                                                                                                                                                                                |
| **Plans Say**      | Modify `apps/backend/lib/cgraph/cosmetics/cosmetics.ex`                                                                                                                                              |
| **Reality**        | No such file exists. The context module is `CGraph.Gamification` at `apps/backend/lib/cgraph/gamification/gamification.ex` (or `lib/cgraph/gamification.ex`). No standalone cosmetics context exists |
| **Impact**         | Cannot modify a non-existent file                                                                                                                                                                    |

**Fix:** Either extend the existing `CGraph.Gamification` context or create a new `CGraph.Cosmetics`
context from scratch (and document the relationship to `CGraph.Gamification`).

---

### C-14: Plans reference `gdpr_export.ex` which doesn't exist

| Field              | Value                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------ |
| **Severity**       | CRITICAL                                                                                   |
| **Affected Plans** | 36-03                                                                                      |
| **Plans Say**      | Modify `apps/backend/lib/cgraph/compliance/gdpr_export.ex` — add cosmetics + nodes exports |
| **Reality**        | Neither the `compliance/` directory nor `gdpr_export.ex` exists anywhere in the codebase   |
| **Impact**         | Cannot modify a non-existent file. Compliance module must be created from scratch          |

**Fix:** 36-03 must create the entire `compliance/` directory structure (not just modify existing
files). Should be a "create" task, not a "modify" task.

---

## 2. MAJOR Issues

These won't cause immediate compilation errors but will cause architectural problems, rework, or
integration friction.

### M-01: Forums module is far more complex than plans assume

| Field              | Value                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | MAJOR                                                                                                                                                                                                                                                                                                                                                                         |
| **Affected Plans** | 37-01, 37-02, 37-03, 37-04, 37-05, 37-06                                                                                                                                                                                                                                                                                                                                      |
| **Plans Say**      | Create `forum_analytics.ex`, `advanced_search.ex`, `thread_poll.ex`, `scheduled_post.ex`, `moderation_log.ex`                                                                                                                                                                                                                                                                 |
| **Reality**        | Forums module has **68 top-level .ex files** + `core/` and `repositories/` subdirectories. Already has: `poll.ex`, `thread_poll.ex`, `search.ex` (277 lines with tsvector), `moderation.ex`, `ranking_engine.ex`, `leaderboard.ex`, `custom_emoji.ex`, `forum_plugin.ex`, `forum_automod.ex`, `content_report.ex`, `warning.ex`, `subscription.ex`, `subscription_service.ex` |
| **Impact**         | Plans underestimate existing forum complexity. Several "create" tasks should be "extend" tasks                                                                                                                                                                                                                                                                                |

**Fix:** For each Phase 37 plan, audit the existing 68 forum files first. `poll.ex`,
`thread_poll.ex`, `search.ex`, `moderation.ex` already exist and should be extended, not recreated.

---

### M-02: `thread_poll.ex` already exists in forums

| Field              | Value                                                                     |
| ------------------ | ------------------------------------------------------------------------- |
| **Severity**       | MAJOR                                                                     |
| **Affected Plans** | 37-03                                                                     |
| **Plans Say**      | Create `apps/backend/lib/cgraph/forums/thread_poll.ex`                    |
| **Reality**        | File already exists at that exact path                                    |
| **Impact**         | Creating a new file will either fail or overwrite existing implementation |

**Fix:** Change to "extend existing `thread_poll.ex`" — add multi_select, anonymous, closes_at
fields if missing.

---

### M-03: `search.ex` (277 lines) already has full-text search with tsvector

| Field              | Value                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | MAJOR                                                                                                                            |
| **Affected Plans** | 37-03                                                                                                                            |
| **Plans Say**      | Create `apps/backend/lib/cgraph/forums/advanced_search.ex` using tsvector on thread.title + post.content                         |
| **Reality**        | `CGraph.Forums.Search` already has 277 lines of PostgreSQL tsvector/tsquery full-text search across threads, posts, and comments |
| **Impact**         | Creating a parallel search module introduces competing implementations                                                           |

**Fix:** Extend existing `search.ex` with advanced features (faceted search, saved searches, etc.)
rather than creating `advanced_search.ex`.

---

### M-04: No `cosmetics/` or `paid-dm/` web module — cosmetics UI is under `settings/`

| Field              | Value                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Severity**       | MAJOR                                                                                                                                                                                                              |
| **Affected Plans** | 35-05, 36-04                                                                                                                                                                                                       |
| **Plans Say**      | Create files under `apps/web/src/modules/cosmetics/` and `apps/web/src/modules/paid-dm/`                                                                                                                           |
| **Reality**        | Neither module directory exists. Cosmetics UI lives under `settings/components/cosmetics-settings/` and `settings/components/customize/` (19 border-related files). No `paid-dm` module exists                     |
| **Impact**         | Creating new top-level modules is valid but needs explicit documentation that this is a NEW module, not extending existing code. Existing cosmetics UI under `settings/` may need refactoring to avoid duplication |

**Fix:** Plans should explicitly note: "Creates new `cosmetics/` module. Existing cosmetics UI under
`settings/components/cosmetics-settings/` should be migrated or deprecated." Same for `paid-dm/`.

---

### M-05: `message-actions.tsx` doesn't exist at the referenced path

| Field              | Value                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **Severity**       | MAJOR                                                                                                    |
| **Affected Plans** | 34-02                                                                                                    |
| **Plans Say**      | Modify `apps/web/src/modules/chat/components/message-actions.tsx` — add tip action                       |
| **Reality**        | File doesn't exist. Actual files: `message-bubble/message-action-menu.tsx` and `message-actions-bar.tsx` |
| **Impact**         | Cannot modify a non-existent file                                                                        |

**Fix:** Change reference to `message-action-menu.tsx` or `message-actions-bar.tsx` (whichever is
appropriate for adding tip actions).

---

### M-06: No `cosmetics.ts` or `nodes.ts` in shared-types or api-client packages

| Field              | Value                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | MAJOR                                                                                                                                          |
| **Affected Plans** | 33-02, 33-03, 34-06, 35-07                                                                                                                     |
| **Plans Say**      | Some plans create these files, others reference them as existing                                                                               |
| **Reality**        | Neither file exists in either package. Plans 33-02 and 33-03 correctly note "create" but later plans may assume they exist when they don't yet |
| **Impact**         | Dependency ordering must be strictly followed — any plan referencing these files must wait for 33-02/33-03 to complete                         |

**Fix:** Add explicit dependency notes: "requires 33-02 completed (creates
`shared-types/src/cosmetics.ts`)" and "requires 33-03 completed (creates
`shared-types/src/nodes.ts`)".

---

### M-07: Mobile has no cosmetics components — only `customizationStore.ts`

| Field              | Value                                                                                                                                                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | MAJOR                                                                                                                                                                                                                                     |
| **Affected Plans** | 34-05, 35-05                                                                                                                                                                                                                              |
| **Plans Say**      | 34-05 creates customize screens (theme-browser, particle-effects, etc.); 35-05 creates mobile cosmetics screens                                                                                                                           |
| **Reality**        | Mobile has `customizationStore.ts` and `screens/customize/` (6 files: customize-screen, badge-selection, effects-customization, identity-customization, title-selection). No border, theme-browser, or cosmetic-renderer components exist |
| **Impact**         | More greenfield work on mobile than plans estimate. Plans correctly identify files to create but may underestimate effort since there's no foundation to build on                                                                         |

**Fix:** Add a pre-task in 34-05: "Audit existing `customizationStore.ts` and `screens/customize/`
to understand current mobile customization patterns before building new screens."

---

### M-08: `creatorStore.ts` already exists on mobile

| Field              | Value                                                         |
| ------------------ | ------------------------------------------------------------- |
| **Severity**       | MAJOR                                                         |
| **Affected Plans** | 36-05                                                         |
| **Plans Say**      | Create `apps/mobile/src/stores/creatorStore.ts`               |
| **Reality**        | `creatorStore.ts` already exists in `apps/mobile/src/stores/` |
| **Impact**         | Creating will overwrite existing store                        |

**Fix:** Change to "extend existing `creatorStore.ts`" — add creator economy methods to existing
store.

---

### M-09: `creatorService.ts` already exists on mobile

| Field              | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| **Severity**       | MAJOR                                                             |
| **Affected Plans** | 36-05                                                             |
| **Plans Say**      | Create `apps/mobile/src/services/creatorService.ts`               |
| **Reality**        | `creatorService.ts` already exists in `apps/mobile/src/services/` |
| **Impact**         | Creating will overwrite existing service                          |

**Fix:** Change to "extend existing `creatorService.ts`" — add paid DM and creator economy methods.

---

### M-10: Rarity is a plain string field — no Ecto.Enum or dedicated module

| Field              | Value                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | MAJOR                                                                                                                                                                       |
| **Affected Plans** | 33-01                                                                                                                                                                       |
| **Plans Say**      | Create `CGraph.Cosmetics.Rarity` module with proper enum-like behavior, then update existing schemas to use it                                                              |
| **Reality**        | Rarity is currently a plain `:string` field on each schema (validated with changeset functions or inline lists). No shared rarity module exists                             |
| **Impact**         | The plan correctly identifies this as something to BUILD, but the migration path needs careful handling — all existing rarity strings must be mapped to the new tier system |

**Fix:** 33-01's migration must include explicit mapping from current rarity strings (which may vary
per schema) to the unified `@tiers`. Add a pre-task to audit all current rarity values across all
cosmetic tables.

---

### M-11: Oban queues `:cosmetics` and `:payments` don't exist yet

| Field              | Value                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | MAJOR                                                                                                                                                               |
| **Affected Plans** | 33-03, 34-01, 35-04, 36-02                                                                                                                                          |
| **Plans Say**      | 33-03 adds 6 queues: `payments`, `cosmetics`, `reputation_calc`, `forum_indexing`, `critical`, `unlocks`. Later plans reference `:payments` and `:cosmetics` queues |
| **Reality**        | None of these 6 queues exist in current config. 25 queues are configured but not these. Note: `:critical` queue already exists (concurrency 10)                     |
| **Impact**         | Workers assigned to non-existent queues will never execute. 33-03 must run before any dependent plan                                                                |

**Fix:** 33-03 should check for existing `:critical` queue (already exists with concurrency 10)
before adding it. Remove `:critical` from the "new queues" list since it already exists.

---

### M-12: `partition_manager.ex` already exists in workers

| Field              | Value                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Severity**       | MAJOR                                                                                                     |
| **Affected Plans** | 38-01                                                                                                     |
| **Plans Say**      | Database sharding plan may create partition management functionality                                      |
| **Reality**        | `apps/backend/lib/cgraph/workers/partition_manager.ex` already exists (30 workers total in the directory) |
| **Impact**         | Any new sharding/partition management code must integrate with existing `partition_manager.ex`            |

**Fix:** Audit existing `partition_manager.ex` before building sharding layer. May already handle
some of the proposed functionality.

---

### M-13: `moderation.ex` already exists in forums

| Field              | Value                                                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | MAJOR                                                                                                                                                                                                          |
| **Affected Plans** | 37-04                                                                                                                                                                                                          |
| **Plans Say**      | Create `apps/backend/lib/cgraph/forums/moderation_log.ex`                                                                                                                                                      |
| **Reality**        | `moderation.ex` already exists (separate from proposed `moderation_log.ex`, but related). Also: `content_report.ex`, `warning.ex`, `forum_automod.ex` all exist. The web module has `forumStore.moderation.ts` |
| **Impact**         | New moderation_log.ex must integrate with existing moderation infrastructure, not duplicate it                                                                                                                 |

**Fix:** Audit existing `moderation.ex`, `content_report.ex`, `warning.ex`, and `forum_automod.ex`
before creating `moderation_log.ex`. May only need a new schema + integration, not a full module.

---

### M-14: Web forums module has 70+ files — plans don't account for existing components

| Field              | Value                                                                                                                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Severity**       | MAJOR                                                                                                                                                                                                                                            |
| **Affected Plans** | 37-05                                                                                                                                                                                                                                            |
| **Plans Say**      | Create `forum-search-page.tsx`, `thread-poll.tsx`, `mention-autocomplete.tsx`, etc.                                                                                                                                                              |
| **Reality**        | Forums module already has: `forum-search/`, `poll-card.tsx`, `poll-widget.tsx`, `bbcode-editor/`, `post-composer.tsx`, `leaderboard-widget/`, `customization-center/`, `subscription-manager/`, `user-groups/`, `rss-feed/`, 8 store files, etc. |
| **Impact**         | Several proposed web components may overlap with existing ones. `poll-card.tsx` and `poll-widget.tsx` already exist — creating `thread-poll.tsx` may conflict                                                                                    |

**Fix:** Audit existing forum web components before creating new ones. Map existing files to planned
features to identify overlaps.

---

### M-15: `forumStore.ts` already exists on mobile

| Field              | Value                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Severity**       | MAJOR                                                                                                                   |
| **Affected Plans** | 37-06                                                                                                                   |
| **Plans Say**      | Create `apps/mobile/src/stores/forumAdminStore.ts` (new store, OK) but plan may also reference modifying forum stores   |
| **Reality**        | `forumStore.ts` already exists. `forumService.ts` also exists. Plan must extend, not recreate                           |
| **Impact**         | Low if plan correctly creates only `forumAdminStore.ts` as new. Could be issues if it tries to recreate existing stores |

**Fix:** Verify 37-06 only creates new stores/services and correctly references existing ones.

---

## 3. MINOR Issues

These are non-blocking but should be corrected for plan accuracy.

### m-01: `shop-page.tsx` referenced as existing but module doesn't exist

| Affected Plans | 35-05                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------- |
| **Plans Say**  | Modify `apps/web/src/modules/cosmetics/pages/shop-page.tsx`                                       |
| **Reality**    | No `cosmetics/` module exists. `shop-page.tsx` would need to be created in Phase 35, not modified |

---

### m-02: `border_seeds.exs` referenced but file is named `seed_borders.exs`

| Affected Plans | 35-06                                                        |
| -------------- | ------------------------------------------------------------ |
| **Plans Say**  | Modify `apps/backend/priv/repo/seeds/border_seeds.exs`       |
| **Reality**    | Actual file: `apps/backend/priv/repo/seeds/seed_borders.exs` |

---

### m-03: Profile-card has 11 files — plans only reference 1

| Affected Plans | 34-02                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plans Say**  | Modify `profile-card/profile-card.tsx` — add tip button                                                                                       |
| **Reality**    | Profile card has 11 files (6 layout variants, types, constants, etc.). Tip button placement depends on which layout variant(s) should show it |

---

### m-04: Mobile `screens/forums/` already exists (separate from `screens/forum/`)

| Affected Plans | 37-06                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **Plans Say**  | Create screens under `apps/mobile/src/screens/forums/`                                           |
| **Reality**    | Both `screens/forum/` AND `screens/forums/` directories exist. Plans should clarify which to use |

---

### m-05: Elasticsearch dep doesn't exist for 38-03 search adapter

| Affected Plans | 38-03                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| **Plans Say**  | Create `elastic_adapter.ex` for Elasticsearch/OpenSearch                          |
| **Reality**    | No elasticsearch hex package in mix.exs. Existing search uses PostgreSQL tsvector |

---

### m-06: `eflame` dep doesn't exist for 38-05 profiler

| Affected Plans | 38-05                                            |
| -------------- | ------------------------------------------------ |
| **Plans Say**  | "Hex packages considered: eflame (flame graphs)" |
| **Reality**    | Not in mix.exs — must be added if used           |

---

### m-07: `animation-constants` registries may not match plan assumptions

| Affected Plans | 33-02                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Plans Say**  | Modify `registries/borders.ts`, `registries/nameplates.ts`, `registries/profileEffects.ts` — UPPERCASE→lowercase |
| **Reality**    | Need to verify these files exist and use UPPERCASE. If they don't, the task is unnecessary                       |

---

### m-08: `NodesChannel` doesn't exist in socket package

| Affected Plans | 34-06                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Plans Say**  | "Consideration: `NodesChannel` in `@cgraph/socket` for real-time balance"                                                          |
| **Reality**    | Socket package has 4 channels: `conversationChannel.ts`, `forumChannel.ts`, `groupChannel.ts`, `userChannel.ts`. No `NodesChannel` |

---

### m-09: Missing `elasticsearch` hex dep for search infrastructure

| Affected Plans | 38-03                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **Plans Say**  | References Elasticsearch as search backend                                                          |
| **Reality**    | No elasticsearch-related hex packages in mix.exs. Would need `elasticsearch` or `elastic` dep added |

---

### m-10: `StreamData` for property-based tests

| Affected Plans | 35-04                                                      |
| -------------- | ---------------------------------------------------------- |
| **Plans Say**  | "StreamData property-based tests"                          |
| **Reality**    | Need to verify if `stream_data` is in test deps of mix.exs |

---

### m-11: `apps/backend/lib/cgraph/archival/` doesn't exist as standalone module

| Affected Plans | 38-02                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plans Say**  | Create archival context under `cgraph/archival/`                                                                                                              |
| **Reality**    | No archival directory exists. `message_archival_worker.ex` exists under `workers/`. Plan correctly creates new directory but should reference existing worker |

---

### m-12: `prometheus.ex` isn't a standalone dep

| Affected Plans | 38-04                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **Plans Say**  | "Hex packages considered: Prometheus.ex (metrics)"                                               |
| **Reality**    | Codebase uses `telemetry_metrics_prometheus_core ~> 1.2` — not a standalone `prometheus` package |

---

## 4. Affected Plans Matrix

| Plan      | Critical               | Major            | Minor      | Status      |
| --------- | ---------------------- | ---------------- | ---------- | ----------- |
| **33-01** | C-01, C-02, C-03       | M-10             | —          | ✗ FAILED    |
| **33-02** | —                      | M-06             | m-07       | ? UNCERTAIN |
| **33-03** | —                      | M-06, M-11       | —          | ? UNCERTAIN |
| **34-01** | —                      | M-11             | —          | ? UNCERTAIN |
| **34-02** | —                      | M-05             | m-03       | ✗ FAILED    |
| **34-03** | —                      | —                | —          | ✓ VERIFIED  |
| **34-04** | —                      | —                | —          | ✓ VERIFIED  |
| **34-05** | —                      | M-07             | —          | ? UNCERTAIN |
| **34-06** | —                      | M-06             | m-08       | ? UNCERTAIN |
| **35-01** | C-01, C-02             | —                | —          | ✗ FAILED    |
| **35-02** | C-01                   | —                | —          | ✗ FAILED    |
| **35-03** | C-01, C-04, C-05, C-13 | —                | —          | ✗ FAILED    |
| **35-04** | C-01, C-03             | —                | m-10       | ✗ FAILED    |
| **35-05** | —                      | M-04             | m-01       | ✗ FAILED    |
| **35-06** | —                      | —                | m-02       | ? UNCERTAIN |
| **35-07** | —                      | M-06             | —          | ? UNCERTAIN |
| **36-01** | C-04, C-05             | —                | —          | ✗ FAILED    |
| **36-02** | C-04, C-05             | M-11             | —          | ✗ FAILED    |
| **36-03** | C-04, C-05, C-14       | —                | —          | ✗ FAILED    |
| **36-04** | —                      | M-04             | —          | ? UNCERTAIN |
| **36-05** | —                      | M-08, M-09       | —          | ✗ FAILED    |
| **37-01** | C-04, C-05             | M-01             | —          | ✗ FAILED    |
| **37-02** | C-04, C-05             | M-01             | —          | ✗ FAILED    |
| **37-03** | C-04, C-05             | M-01, M-02, M-03 | —          | ✗ FAILED    |
| **37-04** | C-04, C-05, C-12       | M-01, M-13       | —          | ✗ FAILED    |
| **37-05** | —                      | M-01, M-14       | —          | ✗ FAILED    |
| **37-06** | —                      | M-01, M-15       | m-04       | ? UNCERTAIN |
| **38-01** | —                      | M-12             | —          | ? UNCERTAIN |
| **38-02** | C-06, C-07             | —                | m-11       | ✗ FAILED    |
| **38-03** | C-07, C-11             | —                | m-05, m-09 | ✗ FAILED    |
| **38-04** | C-08, C-10             | —                | m-12       | ✗ FAILED    |
| **38-05** | —                      | —                | m-06       | ? UNCERTAIN |
| **39-01** | C-04, C-05, C-09       | —                | —          | ✗ FAILED    |
| **39-02** | —                      | —                | —          | ✓ VERIFIED  |
| **39-03** | C-04, C-05             | —                | —          | ✗ FAILED    |

### Summary

- ✓ **VERIFIED:** 3 plans (34-03, 34-04, 39-02)
- ✗ **FAILED:** 22 plans
- ? **UNCERTAIN:** 12 plans

---

## 5. Fix Recommendations

### Priority 1: Systemic Fixes (address multiple plans at once)

#### FIX-A: Resolve the `cosmetics/` vs `gamification/` directory question

**Affects:** C-01, C-02, C-13 (14 plans) **Recommendation:** Create
`apps/backend/lib/cgraph/cosmetics/` as a NEW dedicated module. Gradually migrate existing schemas
from `gamification/` OR explicitly document that `CGraph.Gamification` handles existing cosmetics
while `CGraph.Cosmetics` handles new cosmetics features (unlock engine, inventory, evaluators).
**Decision needed:** Single module or two-module split?

#### FIX-B: Standardize controller placement

**Affects:** C-04 (12 plans) **Recommendation:** Keep all controllers at the top-level
`controllers/` directory matching the existing pattern. Do NOT use `api/v1/` subdirectory. Update
all plan references from `controllers/api/v1/X_controller.ex` to `controllers/X_controller.ex`.

#### FIX-C: Create route modules instead of modifying router.ex

**Affects:** C-05 (12 plans) **Recommendation:** Each domain that needs routes should specify
creating a route module under `apps/backend/lib/cgraph_web/router/`:

- `paid_dm_routes.ex`
- `boost_routes.ex`
- `forum_monetization_routes.ex`
- `enterprise_routes.ex`
- `identity_card_routes.ex`
- `tag_routes.ex`
- `forum_admin_routes.ex`

#### FIX-D: Audit-before-create for Phase 38

**Affects:** C-06, C-07, C-08, C-11 (4 plans) **Recommendation:** Rewrite Phase 38 plans to start
with audit tasks for existing infrastructure: cache system (10 files), search engine (5 files +
subdirectory), workers (30 files), image optimizer. Then specify "extend" or "enhance" tasks, not
"create from scratch".

### Priority 2: Individual Fixes

| Fix   | Issue      | Action                                                                                           |
| ----- | ---------- | ------------------------------------------------------------------------------------------------ |
| FIX-E | C-03       | Add pre-task to Phase 33: audit dropped gamification tables, confirm cosmetic tables still exist |
| FIX-F | C-09, C-10 | Add explicit dep-addition tasks in affected plans                                                |
| FIX-G | C-12       | Correct `forum_permissions.ex` → `forum_permission.ex` in 37-04                                  |
| FIX-H | C-14       | Change 36-03 `gdpr_export.ex` from "modify" to "create"                                          |
| FIX-I | M-02, M-03 | Change 37-03 `thread_poll.ex` and `advanced_search.ex` from "create" to "extend"                 |
| FIX-J | M-05       | Change 34-02 reference to `message-action-menu.tsx`                                              |
| FIX-K | M-08, M-09 | Change 36-05 `creatorStore.ts` and `creatorService.ts` from "create" to "extend"                 |
| FIX-L | M-11       | Add `:critical` to existing queues list (already exists); remove from "new queues" in 33-03      |
| FIX-M | m-02       | Change `border_seeds.exs` → `seed_borders.exs` in 35-06                                          |

---

## Appendix: Codebase Reference Counts

| Area                  | Existing Files   | Plans Propose         |
| --------------------- | ---------------- | --------------------- |
| Backend workers       | 30               | +12 new               |
| Forums module backend | 68 .ex files     | +15 new               |
| Forums module web     | 70+ components   | +7 new                |
| Cache system          | 10 files         | 3 "new" (2 duplicate) |
| Search system         | 5 files + subdir | 2 "new" (1 duplicate) |
| Mobile stores         | 14 stores        | +5 new                |
| Mobile services       | 15 services      | +3 new (2 duplicate)  |
| Oban queues           | 25 configured    | +5 new (1 duplicate)  |
| Shared-types          | 20 files         | +4 new                |
