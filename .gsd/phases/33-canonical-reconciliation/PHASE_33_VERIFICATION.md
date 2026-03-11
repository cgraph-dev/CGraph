# Phase 33 — Codebase Verification Report

**Generated**: Post-fix verification  
**Method**: Goal-backward analysis per `verify-phase` skill  
**Status**: ALL ISSUES FIXED — plans updated to match codebase reality

---

## Summary

| Plan      | Claims Verified | Confirmed | Wrong (fixed) | Uncertain (resolved) |
| --------- | :-------------: | :-------: | :-----------: | :------------------: |
| 33-01     |        9        |     7     |       2       |          0           |
| 33-02     |        7        |     5     |       2       |          0           |
| 33-03     |        8        |     5     |       2       |          1           |
| **Total** |     **24**      |  **17**   |     **6**     |        **1**         |

All 7 issues have been corrected in the plan files.

---

## 33-01: Canonical Cosmetics Manifest + Rarity Module

| #   | Claim                                                         |   Verdict   | Evidence                                                                                               |
| --- | ------------------------------------------------------------- | :---------: | ------------------------------------------------------------------------------------------------------ |
| 1   | `docs/PrivateFolder/` has design docs with conflicting counts |   ✓ FIXED   | Was "5 design documents" — actually **14 files** (guides + design docs + notes). Updated to "14 files" |
| 2   | `avatar_border.ex` uses `@rarities` + `validate_inclusion`    | ✓ CONFIRMED | 9 values: `common uncommon rare epic legendary mythic unique seasonal event`                           |
| 3   | `chat_effect.ex` same pattern                                 | ✓ CONFIRMED | 7 values (no `seasonal`, `event`)                                                                      |
| 4   | `profile_theme.ex` same pattern + 22 presets                  | ✓ CONFIRMED | 8 rarity values + 22 presets (21 named + `custom`)                                                     |
| 5   | `title.ex` same pattern                                       | ✓ CONFIRMED | 7 values (matches `chat_effect.ex`)                                                                    |
| 6   | `cgraph/cosmetics/` does not exist yet                        | ✓ CONFIRMED | Directory absent, correctly marked as NEW                                                              |
| 7   | Migration dropped XP/quest/prestige, kept cosmetics           | ✓ CONFIRMED | 14 tables dropped, cosmetic tables intentionally preserved                                             |
| 8   | Seeds directory exists                                        | ✓ CONFIRMED | 2 files: `load_test_users.exs`, `seed_borders.exs`                                                     |
| 9   | Rarity values diverge across schemas                          |   ✓ ADDED   | New warning added documenting exact divergence (9/7/8/7 values)                                        |

### Rarity Value Divergence (new finding, added to plan)

| Schema             | Values                                                               | Count |
| ------------------ | -------------------------------------------------------------------- | :---: |
| `avatar_border.ex` | common uncommon rare epic legendary mythic **unique seasonal event** |   9   |
| `chat_effect.ex`   | common uncommon rare epic legendary mythic **unique**                |   7   |
| `profile_theme.ex` | common uncommon rare epic legendary mythic **unique seasonal**       |   8   |
| `title.ex`         | common uncommon rare epic legendary mythic **unique**                |   7   |

Migration must normalize ALL schemas to canonical 7 tiers.

---

## 33-02: Frontend Rarity Unification + Shared Cosmetics Types

| #   | Claim                                             |   Verdict   | Evidence                                                                                                                                                 |
| --- | ------------------------------------------------- | :---------: | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `borders.ts` path and line count                  |   ✓ FIXED   | Was `src/registries/borders.ts` (532 lines). Actually `src/borders.ts` (531 lines). Fixed path in `files_modified`, key_links, and Task 3 verify command |
| 2   | `nameplates.ts` UPPERCASE rarity                  | ✓ CONFIRMED | Type: `FREE \| COMMON \| RARE \| EPIC \| LEGENDARY \| MYTHICAL`                                                                                          |
| 3   | `profileEffects.ts` UPPERCASE rarity              | ✓ CONFIRMED | MYTHICAL in type but no data entries use it. Note added.                                                                                                 |
| 4   | Web `constants.ts` missing UNCOMMON               | ✓ CONFIRMED | Tiers: free, common, rare, epic, legendary, mythic — already lowercase, UNCOMMON absent                                                                  |
| 5   | Mobile `themeStore.ts` alignment                  |   ✓ FIXED   | Was "verify alignment". Now documents: 7 tiers with `divine` (not `free`), has `uncommon` that web lacks                                                 |
| 6   | `shared-types` rarity.ts/cosmetics.ts don't exist | ✓ CONFIRMED | Neither file exists yet                                                                                                                                  |
| 7   | MYTHICAL present in registries                    | ✓ CONFIRMED | Divergence found and documented                                                                                                                          |

### Critical Findings Added to Plan

1. **MYTHIC vs MYTHICAL divergence**: `borders.ts` uses `MYTHIC`,
   `nameplates.ts`/`profileEffects.ts` use `MYTHICAL`. Warning added.
2. **UNCOMMON missing everywhere**: Absent from ALL 3 animation-constants registries (not just web).
   Warning added.
3. **Mobile tier set differs**: Uses `divine` where `free` expected; has `uncommon` that web lacks.
   Documented in key_links.

---

## 33-03: API Audit, Exchange Rate, Theme Reconciliation, Exports, Oban

| #   | Claim                                        |   Verdict   | Evidence                                                                                                                                                                      |
| --- | -------------------------------------------- | :---------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `:critical` queue at concurrency 10          | ✓ CONFIRMED | Queue #17 in config.exs                                                                                                                                                       |
| 2   | Oban queue count                             |   ✓ FIXED   | Was "25 queues". Actually **22**. Updated count, added full queue list. Final total after additions: 27                                                                       |
| 3   | 22 backend profile presets                   | ✓ CONFIRMED | 21 named + `custom` = 22                                                                                                                                                      |
| 4   | Frontend theme count                         |   ✓ FIXED   | Was "18 themes". Actually **10** (9 curated + 1 custom). Gap is 22→10 (not 22→18)                                                                                             |
| 5   | shared-types exports map                     | ✓ CONFIRMED | Only `.`, `./api`, `./models`, `./events`                                                                                                                                     |
| 6   | 4 orphaned forum files                       | ✓ CONFIRMED | All 4 exist, none re-exported by `index.ts`                                                                                                                                   |
| 7   | Exchange rate constant                       | ? RESOLVED  | `@exchange_rate_eur` doesn't exist (correct), BUT `@eur_per_100_nodes Decimal.new("0.80")` already exists (= 0.008 EUR/node). Warning added: rename existing vs add duplicate |
| 8   | `ENDPOINT_CATALOG.md` and `endpoints.ts` new | ✓ CONFIRMED | `docs/api/` exists with `API_REFERENCE.md` and `openapi.yaml` only. `api-client/src/` has `client.ts`, `index.ts`, `resilience.ts` only                                       |

### Key Corrections Applied

| Issue                      | Was                          | Corrected To                                                                |
| -------------------------- | ---------------------------- | :-------------------------------------------------------------------------- |
| Oban queue count           | 25                           | **22** (listed all 22 by name)                                              |
| Frontend themes            | 18                           | **10** (listed all 10 by name)                                              |
| Post-expansion queue total | (implicit 30)                | **27** (22 existing + 5 new)                                                |
| Exchange rate              | "add @exchange_rate_eur"     | Added ⚠️: `@eur_per_100_nodes` already exists, consider rename vs duplicate |
| Oban key_links queue names | `:mailer, :media_processing` | `:mailers, :media`                                                          |

---

## Files Modified

| File            | Changes                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `33-01-PLAN.md` | Fixed doc count (5→14), added rarity divergence warning                                                                                   |
| `33-02-PLAN.md` | Fixed borders.ts path, line count, added MYTHIC/MYTHICAL divergence, UNCOMMON warning, mobile tier details, fixed verify command          |
| `33-03-PLAN.md` | Fixed Oban count (25→22), frontend themes (18→10), added exchange rate duplication warning, corrected queue names, added final total (27) |

---

## Verification Confidence: HIGH

All claims verified against source code. No remaining unresolved discrepancies. Plans are ready for
execution.
