---
phase: 32-nodes-monetization
plan: "01"
subsystem: payments
tags: [nodes, stripe, ecto, wallet, tipping, monetization]

requires:
  - phase: 31-forums-discovery
    provides: forum threads with is_content_gated + gate_price_nodes fields

provides:
  - Node wallet system (available/pending balances)
  - Credit/debit with row-level locking
  - Tipping with 20% platform cut + 21-day hold
  - Content unlock (gated threads)
  - Withdrawal requests with EUR conversion
  - Stripe Checkout for node bundle purchases
  - RESTful API at /api/v1/nodes/*

affects: [32-02-frontend, mobile, billing, creator-dashboard]

tech-stack:
  added: []
  patterns:
    - "Ecto.Multi for all multi-step wallet operations"
    - "SELECT FOR UPDATE row locking on wallet debits"
    - "@primary_key false for 1:1 wallet table (user_id is PK)"
    - "Compile-time @bundles list for node pricing tiers"

key-files:
  created:
    - apps/backend/lib/cgraph/nodes/nodes.ex
    - apps/backend/lib/cgraph/nodes/node_wallet.ex
    - apps/backend/lib/cgraph/nodes/node_transaction.ex
    - apps/backend/lib/cgraph/nodes/withdrawal_request.ex
    - apps/backend/lib/cgraph/nodes/node_bundles.ex
    - apps/backend/lib/cgraph_web/controllers/nodes_controller.ex
    - apps/backend/lib/cgraph_web/controllers/nodes_json.ex
    - apps/backend/lib/cgraph_web/router/nodes_routes.ex
    - apps/backend/priv/repo/migrations/20260310120000_create_nodes_tables.exs
  modified:
    - apps/backend/lib/cgraph/gamification.ex
    - apps/backend/lib/cgraph/stickers.ex
    - apps/backend/lib/cgraph/gamification/title_shop_system.ex
    - apps/backend/lib/cgraph/gamification/achievement_system.ex
    - apps/backend/lib/cgraph_web/controllers/stripe_webhook_controller.ex
    - apps/backend/lib/cgraph_web/router.ex
    - apps/backend/lib/cgraph_web/router/gamification_routes.ex
    - apps/backend/lib/cgraph_web/controllers/user_json.ex
    - apps/backend/lib/cgraph_web/controllers/auth_json.ex
    - apps/backend/lib/cgraph_web/controllers/shop_controller.ex
    - apps/backend/lib/cgraph_web/controllers/title_controller.ex

key-decisions:
  - "Kept gamification_routes.ex — still has achievements, premium, IAP, shop, titles, cosmetics"
  - "Used @primary_key false for node_wallets — 1:1 with users, user_id is PK"
  - "20% flat platform cut on tips and content unlocks"
  - "21-day hold period on earned nodes before release/withdrawal"
  - "EUR conversion at €0.80 per 100 nodes (0.008 per node)"
  - "Minimum 1000 nodes (€8) for withdrawal"
  - "5 bundle tiers: Starter (500/€4.99) to Ultimate (17000/€99.99)"

patterns-established:
  - "Nodes context pattern: credit_nodes/debit_nodes with Ecto.Multi + row locks"
  - "Bundle pricing as compile-time module constants (no DB table)"
  - "Stripe metadata { type: node_purchase, user_id, bundle_id } for webhook routing"

duration: ~45min
completed: 2025-01-10
---

# Phase 32 Plan 01: Nodes Backend Summary

**Replaced entire coins virtual currency with Nodes system — wallet, tipping, content unlock, withdrawals, and Stripe checkout all functional.**

## Performance

- **Tasks:** 4/4 completed
- **Files created:** 9
- **Files modified:** 11
- **Files deleted:** 6

## Accomplishments

- Deleted 6 coin-era files and removed all coin references from 11 callers
- Created 3 database tables (node_wallets, node_transactions, withdrawal_requests) plus migration to drop users.coins column
- Built complete Nodes context with wallet CRUD, credit/debit (row-locked), tipping (20% cut + 21-day hold), content unlock, held node release, and withdrawal
- Created 7 REST API endpoints under /api/v1/nodes with Stripe Checkout integration

## Task Commits

1. **Task 1: Delete coin files + update callers** — `2305f890`
2. **Task 2: Create Nodes database tables** — `16ac230d`
3. **Task 3: Build Nodes context + schemas** — `452cd540`
4. **Task 4: Create Nodes API + routes** — `0af60287`

## Files Created/Modified

### Created
- `nodes/nodes.ex` — Main context: wallet ops, tipping, unlock, withdrawal
- `nodes/node_wallet.ex` — Wallet schema (@primary_key false, user_id PK)
- `nodes/node_transaction.ex` — Transaction schema (8 types)
- `nodes/withdrawal_request.ex` — Withdrawal schema (4 statuses)
- `nodes/node_bundles.ex` — 5 purchasable tiers (compile-time constants)
- `controllers/nodes_controller.ex` — 7 endpoint actions
- `controllers/nodes_json.ex` — JSON serialization
- `router/nodes_routes.ex` — Route macro
- `migrations/20260310120000_create_nodes_tables.exs` — Tables + indexes

### Deleted
- coins_controller.ex, coins_json.ex, coin_shop_controller.ex
- coin_bundles.ex, coin_checkout.ex, coin_purchase.ex

### Modified
- gamification.ex: removed award_coins/spend_coins, fixed do_claim_streak
- stickers.ex: spend_coins → Nodes.debit_nodes
- title_shop_system.ex: coin checks → Nodes.debit_nodes
- achievement_system.ex: award_coins → Nodes.credit_nodes
- stripe_webhook_controller.ex: coin_purchase → node_purchase
- router.ex: added nodes_routes import + macro call
- gamification_routes.ex: removed coin routes
- user_json.ex, auth_json.ex: removed coins field
- shop_controller.ex, title_controller.ex: removed coins from responses

## Deviations from Plan

### Auto-fixed Issues

**1. Leftover `coins` variable in `do_claim_streak/5`**
- **Found during:** Task 4 (compile check)
- **Issue:** Tuple returned `{final_user, coins, new_streak}` where `coins` var was undefined after removing coin computation
- **Fix:** Replaced with `{final_user, 0, new_streak}`
- **Committed in:** `0af60287` (part of Task 4 commit)

**2. Unused `Gamification` alias in stickers.ex**
- **Found during:** Task 4 (compile check)
- **Fix:** Removed the alias
- **Committed in:** `0af60287`

**3. Controller file paths differ from plan**
- **Issue:** Plan specified `controllers/api/v1/nodes_controller.ex` but codebase convention is `controllers/nodes_controller.ex` with module `CGraphWeb.NodesController`
- **Fix:** Followed actual codebase convention, not plan paths

**Total deviations:** 3 auto-fixed
**Impact on plan:** All necessary for correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.
