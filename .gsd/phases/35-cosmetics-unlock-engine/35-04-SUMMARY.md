---
phase: 35-cosmetics-unlock-engine
plan: 04
status: complete
completed_at: 2026-03-12
commits:
  - d684c12c  # feat(35-04): add unlock engine core dispatcher and evaluator behaviour
  - 4fe125ad  # feat(35-04): add five unlock evaluator implementations
  - bea7ce1f  # feat(35-04): add oban workers and visibility rules
files_created:
  - apps/backend/lib/cgraph/cosmetics/unlock_engine.ex
  - apps/backend/lib/cgraph/cosmetics/unlock_evaluator.ex
  - apps/backend/lib/cgraph/cosmetics/evaluators/level_evaluator.ex
  - apps/backend/lib/cgraph/cosmetics/evaluators/achievement_evaluator.ex
  - apps/backend/lib/cgraph/cosmetics/evaluators/collection_evaluator.ex
  - apps/backend/lib/cgraph/cosmetics/evaluators/event_evaluator.ex
  - apps/backend/lib/cgraph/cosmetics/evaluators/purchase_evaluator.ex
  - apps/backend/lib/cgraph/workers/unlock_check_worker.ex
  - apps/backend/lib/cgraph/workers/seasonal_rotation_worker.ex
  - apps/backend/lib/cgraph/cosmetics/visibility_rules.ex
---

# Plan 35-04 Summary — Unlock Engine

## Objective

Build the Unlock Engine: core dispatcher, evaluator behaviour with 5 implementations,
Oban workers for unlock checking and seasonal rotation, and visibility rules for
locked/unlocked states.

## Tasks Completed

### Task 1: Unlock Engine Core + Behaviour

- **UnlockEvaluator** behaviour with `evaluate/2` callback (`{:ok, boolean} | {:error, term}`)
  and optional `progress/2` callback (float 0.0–1.0).
- **UnlockEngine** dispatches to registered evaluators by `unlock_condition["type"]`.
  Registry pattern maps type strings to evaluator modules. Returns `:unlocked`,
  `:locked`, `{:progress, float}`, or `{:error, term}`.
- Emits telemetry on `[:cgraph, :cosmetics, :unlocked]` for unlock events.

### Task 2: Five Evaluator Implementations

| Evaluator | Type | Strategy | Side Effects |
|-----------|------|----------|-------------|
| **LevelEvaluator** | `"level"` | Checks `karma` and/or `total_posts_created` against thresholds (NOT `user.level` — XP tables dropped) | None |
| **AchievementEvaluator** | `"achievement"` | Checks user has earned required achievement slugs via `AchievementSystem` | None (read-only) |
| **CollectionEvaluator** | `"collection"` | Counts owned items of target type in `user_inventory` | None (read-only) |
| **EventEvaluator** | `"event"` | Checks current UTC time within `starts_at`/`ends_at` window | None (pure) |
| **PurchaseEvaluator** | `"purchase"` | Verifies Node balance via `CGraph.Nodes`, debits on unlock | Debits Nodes |

- Level, Achievement, and Collection evaluators implement both `evaluate/2` and `progress/2`.
- Event and Purchase evaluators implement only `evaluate/2`.

### Task 3: Oban Workers + Visibility Rules

- **UnlockCheckWorker** — Queue `:unlocks`, max 3 attempts, unique per user (60 s window).
  Checks all locked badges for a user, grants newly unlocked items to inventory.
- **SeasonalRotationWorker** — Queue `:cosmetics`, max 3 attempts. Deactivates expired
  seasonal/event badges, activates ones whose window has started.
- **VisibilityRules** — `filter_visible/2` annotates items with `:state` (`:unlocked`,
  `:locked`, `:locked_preview`) and `:progress`. Items with rarity >= legendary get
  `:locked_preview` state (preview but greyed out).

## Verification

- `mix compile` passes cleanly (no new warnings).
- Oban queues `:unlocks` and `:cosmetics` already configured in `config.exs` — not modified.
- LevelEvaluator uses `karma` / `total_posts_created` — does NOT reference `user.level`.
- PurchaseEvaluator uses `CGraph.Nodes.debit_nodes/4` — does NOT query DB directly.

## Must-Have Truths — Verified

- [x] UnlockEngine dispatches to registered evaluators by unlock_condition.type
- [x] UnlockEvaluator behaviour: `@callback evaluate(user, condition) :: {:ok, boolean} | {:error, term}`
- [x] 5 evaluators: level (karma-based), achievement, collection, event (time-limited), purchase (Nodes)
- [x] UnlockCheckWorker (Oban, :unlocks queue) triggered on achievement earned
- [x] SeasonalRotationWorker (Oban, :cosmetics queue) monthly cron rotates limited items
- [x] VisibilityRules: items with rarity >= legendary show preview but greyed out when locked
- [x] All evaluators are pure functions — no side effects (except PurchaseEvaluator)
- [x] Engine logs unlock events to telemetry [:cgraph, :cosmetics, :unlocked]
- [x] LevelEvaluator uses karma or total_posts_created (NOT user.level — XP tables dropped)
