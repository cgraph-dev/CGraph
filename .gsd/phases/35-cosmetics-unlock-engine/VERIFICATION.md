# Phase 35 — Cosmetics + Unlock Engine — Post-Execution Verification

**Verified:** 2026-03-12 **Status:** PASSED (after fixes) **Score:** 7/7 truths verified **Fix
commit:** `be766c1f`

---

## Goal

> Every cosmetic type has a backend schema. Unified inventory replaces join tables. Unlock engine
> evaluates conditions and grants rewards automatically. Visibility matrix controls what renders
> where. Full seed data for 340+ items.

---

## Truth Verification

| #   | Truth                                   | Status     | Evidence                                                                                            |
| --- | --------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| 1   | All cosmetic types have backend schemas | ✓ VERIFIED | badge.ex, nameplate.ex, profile_effect.ex, profile_frame.ex, name_style.ex — 14 files in cosmetics/ |
| 2   | Unified inventory replaces join tables  | ✓ VERIFIED | inventory.ex (66 lines), migration 20260312100010, polymorphic with 9 item types                    |
| 3   | Unlock engine evaluates conditions      | ✓ VERIFIED | unlock_engine.ex (103 lines), 5 evaluators, behaviour pattern                                       |
| 4   | Visibility matrix controls rendering    | ✓ VERIFIED | visibility_rules.ex (74 lines), 6 surfaces defined                                                  |
| 5   | Seed data for 340+ items                | ✓ VERIFIED | 7 seed files: 70 badges, 70 titles, 42 borders, 45 nameplates, 18 effects, 55 frames, 50 styles     |
| 6   | Web UI for inventory/shop/equip         | ✓ VERIFIED | 6 components in modules/cosmetics/, routed at /cosmetics and /cosmetics/shop                        |
| 7   | Mobile UI for inventory/equip           | ✓ VERIFIED | 3 files (inventory-screen, equip-screen, cosmetic-renderer), wired in settings-navigator            |

---

## Artifact Verification

### Backend (all ✓ — substantive, wired)

| File                                | Lines     | Status                                              |
| ----------------------------------- | --------- | --------------------------------------------------- |
| cosmetics/badge.ex                  | 66        | ✓ Schema + changeset + rarity validation            |
| cosmetics/nameplate.ex              | 57        | ✓ Schema + gradient colors + animation              |
| cosmetics/profile_effect.ex         | 54        | ✓ Schema + unlock_condition JSONB                   |
| cosmetics/profile_frame.ex          | 55        | ✓ Schema + binary_id PK                             |
| cosmetics/name_style.ex             | 43        | ✓ Schema                                            |
| cosmetics/inventory.ex              | 66        | ✓ Polymorphic, 9 types, composite index             |
| cosmetics/nameplate_setting.ex      | 42        | ✓ User preferences                                  |
| cosmetics/cosmetics.ex              | 324       | ✓ Context: 12+ functions (list/equip/unequip/grant) |
| cosmetics/unlock_engine.ex          | 103       | ✓ Evaluator dispatch, @evaluators registry          |
| cosmetics/unlock_evaluator.ex       | 22        | ✓ Behaviour definition                              |
| cosmetics/visibility_rules.ex       | 74        | ✓ 6-surface matrix                                  |
| evaluators/ (5 files)               | 277 total | ✓ level, achievement, collection, event, purchase   |
| workers/unlock_check_worker.ex      | 72        | ✓ Oban :unlocks queue                               |
| workers/seasonal_rotation_worker.ex | 63        | ✓ Oban :cosmetics queue, monthly cron               |

### Controllers & Routes (all ✓)

| File                                       | Lines | Status                                         |
| ------------------------------------------ | ----- | ---------------------------------------------- |
| controllers/cosmetics_controller.ex        | 525   | ✓ inventory/equip/unequip endpoints            |
| controllers/api/v1/badge_controller.ex     | 90    | ✓ index/show/user_badges                       |
| controllers/api/v1/nameplate_controller.ex | 124   | ✓ index/show/user_nameplates/update_settings   |
| router/cosmetics_routes.ex                 | 43    | ✓ Macro module, imported + called in router.ex |

### Migrations (8 ✓)

20260312100001-4 (badges, nameplates, effects, frames), 100010-12 (inventory, settings, styles),
100020 (unlock_log)

### Seeds (7 files, 350+ items ✓)

badge(70), title(70), border(42), nameplate(45), effect(18), frame(55), style(50)

---

## Compile / Type Checks

| Check                       | Result                                |
| --------------------------- | ------------------------------------- |
| Backend mix compile --force | ✓ Exit 0 (pre-existing warnings only) |
| Web tsc --noEmit            | ✓ Zero cosmetics errors (after fix)   |

---

## Gaps Found & Fixed (commit be766c1f)

### Critical

| #   | Gap                                                               | Fix                                                        |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | Web cosmetic-renderer missing profile_frame + name_style (TS2739) | Added FallbackRenderer entries                             |
| 2   | Web pages not routed (orphaned)                                   | Added lazy imports + routes at /cosmetics, /cosmetics/shop |
| 3   | Web pages missing export default (lazy crash)                     | Added default exports                                      |

### Non-critical

| #   | Gap                                      | Fix                              |
| --- | ---------------------------------------- | -------------------------------- |
| 4   | Mobile cosmetic-renderer missing 2 types | Added FallbackRenderer entries   |
| 5   | Web inventory TYPE_TABS missing 2 types  | Added profile_frame + name_style |
| 6   | Web shop SHOP_SECTIONS missing 2 types   | Added profile_frame + name_style |
| 7   | Mobile TYPE_FILTERS missing 2 types      | Added profile_frame + name_style |

---

## Acceptable Deferred Items

- Mobile TODO: "Wire to real API" — Phase 35 specifies "basic equip/view" scope
- Web pages use prop-based data injection with stub fallback — designed pattern
