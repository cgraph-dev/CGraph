# 33-03 Plan Execution Summary

**Plan:** 33-03: API Audit, Exchange Rate, Profile Theme Reconciliation, Exports Fix, Oban Queues
**Phase:** 33-canonical-reconciliation **Executed:** 2026-03-11 **Status:** ✅ Complete (5/5 tasks)

## Objective

Reconcile configuration drift between backend and frontend across five domains: API endpoint
catalog, node exchange rate constants, profile theme presets, shared-types package exports, and Oban
background job queue configuration.

---

## Tasks

### Task 1 — API Endpoint Catalog (P0.3)

| Item            | Detail                                                                                                                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Commit**      | `5468b31a`                                                                                                                                                                                                |
| **Files**       | `docs/api/ENDPOINT_CATALOG.md` (new), `packages/api-client/src/endpoints.ts` (new)                                                                                                                        |
| **Description** | Created exhaustive REST endpoint catalog documenting every backend route with method, path, auth requirements, and rate-limit tier. Generated a typed `endpoints.ts` constant for the API client package. |

### Task 2 — Exchange Rate Constants (P0.5)

| Item            | Detail                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Commit**      | `a395410e`                                                                                                                                      |
| **Files**       | `apps/backend/lib/cgraph/gamification/nodes.ex` (update), `apps/backend/config/config.exs` (update), `packages/shared-types/src/nodes.ts` (new) |
| **Description** | Unified the Nodes-to-USD exchange rate (`0.008`) as a runtime-configurable value in the backend and a typed constant in shared-types.           |

### Task 3 — Profile Theme Reconciliation (P0.7)

| Item            | Detail                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Commit**      | `ea5ac84c`                                                                                                                                                                                                                                                                                                                                                                                       |
| **Files**       | `apps/backend/lib/cgraph/gamification/profile_theme.ex` (update), `packages/animation-constants/src/registries/profileThemes.ts` (update), `apps/backend/priv/repo/migrations/20260311130000_reconcile_profile_themes.exs` (new)                                                                                                                                                                 |
| **Description** | Reconciled backend (22 presets) and frontend (10 themes) to a unified 25-theme set: 5 free (`default`, `midnight`, `sakura`, `forest`, `ocean`), 5 earned (`sunset`, `cyber`, `gothic`, `gold`, `arctic`), and 15 shop themes. Migration maps legacy slugs (e.g. `gradient-aurora` → `aurora`, `cyberpunk-neon` → `cyber`) and inserts missing canonical entries. Fully reversible via `down/0`. |

### Task 4 — Shared-Types Exports Fix + Forum Re-exports (P0.9)

| Item            | Detail                                                                                                                                                                                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Commit**      | `83c5d642`                                                                                                                                                                                                                                                                                                                   |
| **Files**       | `packages/shared-types/package.json` (update), `packages/shared-types/src/index.ts` (update), `packages/shared-types/src/forums.ts` (new)                                                                                                                                                                                    |
| **Description** | Added `./nodes` and `./forums` export map entries to `package.json` (joining `./rarity` and `./cosmetics` added by plan 33-02). Re-exported 4 orphaned forum modules (`forum-emoji`, `forum-moderation`, `forum-plugin`, `forum-rss`) from `index.ts`. Created `forums.ts` barrel file aggregating all 8 forum type modules. |

### Task 5 — Oban Queue Config Expansion (P0.10)

| Item            | Detail                                                                                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Commit**      | `3062b16a`                                                                                                                                                                                                        |
| **Files**       | `apps/backend/config/config.exs` (update)                                                                                                                                                                         |
| **Description** | Added 5 new Oban queues (`payments: 5`, `cosmetics: 10`, `reputation_calc: 5`, `forum_indexing: 10`, `unlocks: 10`) and bumped `critical` from 10 → 20. Total queues: 27 (was 22). All existing queues preserved. |

---

## Deviations

| #   | Deviation                                                                                                                | Reason                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Backend `profile_theme.ex` and frontend `profileThemes.ts` were already reconciled to the 25-set before Task 3 execution | A prior plan or edit had already updated the code files. The migration was still created as specified; the commit includes the migration plus any lint-staged formatting adjustments. |
| 2   | Created `forums.ts` barrel file (not in original file list)                                                              | Required as the target for the `./forums` export map entry since no barrel existed.                                                                                                   |

---

## Must-Haves Verification

| Requirement                            | Status | Evidence                                                            |
| -------------------------------------- | ------ | ------------------------------------------------------------------- |
| API endpoint catalog exists            | ✅     | `docs/api/ENDPOINT_CATALOG.md`                                      |
| Exchange rate unified BE ↔ FE          | ✅     | `config.exs` + `nodes.ts` both use `0.008`                          |
| 25 profile themes (5+5+15) BE ↔ FE     | ✅     | `@presets` and `PROFILE_THEME_PRESETS` both list 25 slugs           |
| Theme migration with rollback          | ✅     | `20260311130000_reconcile_profile_themes.exs` has `up/0` + `down/0` |
| shared-types exports ./nodes, ./forums | ✅     | `package.json` exports map updated                                  |
| 4 orphaned forum files re-exported     | ✅     | `index.ts` re-exports all 4                                         |
| Oban 27 queues (5 new + critical bump) | ✅     | `config.exs` has 27 queue entries, `critical: 20`                   |
| All commits individually staged        | ✅     | No `git add .` used                                                 |

---

## Commit Log

| Task | Hash       | Message                                                      |
| ---- | ---------- | ------------------------------------------------------------ |
| 1    | `5468b31a` | `feat(33-03): create api endpoint catalog`                   |
| 2    | `a395410e` | `feat(33-03): unify exchange rate constants`                 |
| 3    | `ea5ac84c` | `feat(33-03): reconcile profile themes to 25-set`            |
| 4    | `83c5d642` | `feat(33-03): fix shared-types exports and forum re-exports` |
| 5    | `3062b16a` | `feat(33-03): expand oban queue configuration`               |
