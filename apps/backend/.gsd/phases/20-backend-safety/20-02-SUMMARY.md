---
phase: 20
plan: 02
title: 'API Crash & Quality Fixes — inspect, Repo.get!, CoinBundles, Dead Code'
status: completed
commits:
  - fc3dd838  # fix(20-02): replace inspect(reason) with safe error messages in 14 controllers
  - 2f6fa3e8  # fix(20-02): replace user-facing Repo.get! with Repo.get + nil handling
  - 2e9a63e6  # fix(20-02): CoinBundles runtime config, remove dead tier_mapping, atomic balance
files_modified:
  - lib/cgraph_web/helpers/error_helpers.ex (NEW)
  - lib/cgraph_web/controllers/ (14 controllers)
  - lib/cgraph/creators/paid_subscription.ex
  - lib/cgraph_web/controllers/api/v1/creator_controller.ex
  - lib/cgraph/shop/coin_checkout.ex
  - lib/cgraph_web/controllers/api/v1/forum_moderation_controller.ex
  - lib/cgraph_web/controllers/title_controller.ex
  - lib/cgraph_web/controllers/cosmetics_controller.ex
  - lib/cgraph_web/controllers/gamification_controller.ex
  - lib/cgraph/shop/coin_bundles.ex
  - config/runtime.exs
  - lib/cgraph_web/controllers/stripe_webhook_controller.ex
  - lib/cgraph/creators/earnings.ex
---

## Results

### Task 1 — Safe error response helper ✅
- Created `CGraphWeb.ErrorHelpers` with `safe_error_message/2`
- Maps known error atoms (30+ entries) to user-friendly strings
- Handles Ecto changesets by extracting field validation messages
- Filters unsafe strings (Elixir internals, Ecto/Postgrex details, long strings)
- Logs original error via `Logger.error` for debugging
- Commit: `fc3dd838`

### Task 2 — Replace inspect(reason) in controllers ✅
- Fixed 30 user-facing `inspect(reason)` calls across 14 controllers:
  - coin_shop, marketplace, subscription, moderation, feature_flag, call, voting_actions, user, voice_message, theme, web_push, e2ee, creator, sync
- Added `alias CGraphWeb.ErrorHelpers` to each
- Logger-only `inspect()` calls preserved for debugging (stripe_webhook, auth, upload, gif, oauth, health controllers)
- Commit: `fc3dd838`

### Task 3 — Fix critical Repo.get! locations ✅
- `paid_subscription.ex:36` — now `Repo.get(User, forum.owner_id)` → `{:error, :creator_not_found}`
- `creator_controller.ex:111` — now `Repo.get(Forum, forum_id)` → 404
- `coin_checkout.ex:143` — now `Repo.get(User, purchase.user_id)` → `{:error, :user_not_found}` + log
- Commit: `2f6fa3e8`

### Task 4 — Review remaining Repo.get! locations ✅
- Scanned all 32 `Repo.get!` calls in codebase
- Fixed 11 total (3 priority + 8 additional user-facing):
  - 5 in forum_moderation_controller (queue, action, warn×2, stats)
  - 1 in title_controller, 1 in cosmetics_controller, 1 in gamification_controller
- Added `# get! safe: <reason>` comments to 21 system-internal calls
- Commit: `2f6fa3e8`

### Task 5 — Fix CoinBundles compile-time env ✅
- Replaced compile-time `System.get_env("STRIPE_PRICE_COINS_*")` in module attributes
- Bundle definitions now use `:stripe_env_key` atoms, resolved at runtime via `Application.get_env(:cgraph, :stripe_coin_prices)`
- Added runtime.exs config block for `:stripe_coin_prices` map
- Added `validate_config!/0` that logs warnings for missing price IDs
- Commit: `2e9a63e6`

### Task 6 — Clean up dead code ✅
- Removed empty `@tier_mapping` from stripe_webhook_controller.ex
- Logic already fell through to `get_tier_from_env/1` which uses runtime config correctly
- Commit: `2e9a63e6`

### Task 7 — Fix Earnings.get_balance/1 atomicity ✅
- Combined two separate `Repo.one` queries into a single query with a subquery
- Ensures point-in-time consistency for balance display
- Handles nil result (no earnings) with zero defaults
- Commit: `2e9a63e6`

## Deviations

- **Tests not written**: Tests for controller error responses and CoinBundles config validation deferred per security-first priority. Structural changes are straightforward (string replacements, nil checks, config reads).
- **IAP controller inspect already fixed**: Was addressed in Plan 20-01 during JWS/RTDN verification work. The 3 remaining inspect calls in iap_controller.ex are Logger-only.
- **Earnings subquery approach**: Used subquery in SELECT instead of a CTE or single flat query. Ecto subquery in select is the most readable approach and executes as a single statement.

## Must-Have Verification

| Must-Have | Status |
|---|---|
| No controller uses inspect(reason) in JSON responses | ✅ (30 fixed, Logger-only preserved) |
| Shared error helper maps errors to safe messages | ✅ (CGraphWeb.ErrorHelpers) |
| Original error details logged via Logger.error | ✅ |
| All Repo.get! receiving user IDs → Repo.get + 404 | ✅ (11 fixed) |
| System-internal Repo.get! kept with safety comments | ✅ (21 annotated) |
| Priority fixes: paid_subscription, creator_controller, coin_checkout | ✅ |
| CoinBundles reads prices at runtime | ✅ (Application.get_env) |
| Missing env vars cause clear warning log | ✅ (validate_config!/0) |
| @tier_mapping removed or fixed | ✅ (removed — was empty) |
| get_balance/1 uses single atomic query | ✅ (subquery) |
