---
phase: 32-nodes-monetization
verified: 2026-03-10
status: passed
score: 29/29
fix_commit: e1af2a7e
---

# Phase 32 Verification Report — Nodes Monetization

## Overall Status: ✓ PASSED (after fixes)

**Score:** 29/29 must-haves verified
**Fix commit:** `e1af2a7e` — 15 files, 29 insertions, 29 deletions

---

## 1. Goal Achievement — Observable Truths

### Backend Truths (15/15)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | node_wallets, node_transactions, withdrawal_requests tables created | ✓ VERIFIED | Migration `20260310120000_create_nodes_tables.exs` — 3 tables, proper PKs, indexes |
| 2 | coins field REMOVED from users schema | ✓ VERIFIED | `remove_if_exists :coins` in migration; field absent from `user.ex` |
| 3 | Coin files DELETED (6 files) | ✓ VERIFIED | All 6 confirmed absent: coins_controller, coin_shop_controller, coin_bundles, coin_checkout, coin_purchase, coins_json |
| 4 | award_coins/spend_coins REMOVED from gamification.ex | ✓ VERIFIED | No `award_coins` or `spend_coins` functions in gamification.ex |
| 5 | All callers updated to Nodes context | ✓ VERIFIED | stickers.ex → `Nodes.debit_nodes`, title_shop_system.ex → `debit_nodes`, achievement_system.ex → `credit_nodes` |
| 6 | user_json.ex / auth_json.ex do NOT serialize coins | ✓ VERIFIED | Zero "coins" references in either file |
| 7 | Node wallet: available_balance + pending_balance | ✓ VERIFIED | `node_wallet.ex` — fields: available_balance, pending_balance, lifetime_earned, lifetime_spent |
| 8 | 8 transaction types match plan | ✓ VERIFIED | `@valid_types` exactly matches: purchase, tip_received, tip_sent, content_unlock, subscription_received, subscription_sent, withdrawal, cosmetic_purchase |
| 9 | 20% platform cut on earned transactions | ✓ VERIFIED | `@platform_cut_percent 20` in nodes.ex; applied in `tip/3` and `unlock_content/2` |
| 10 | 21-day hold on earned nodes | ✓ VERIFIED | `@hold_days 21` in nodes.ex; `hold_until` set via `DateTime.add(now, @hold_days * 86400)` |
| 11 | Content unlock wired to Phase 31 thread gating | ✓ VERIFIED | `unlock_content/2` queries `CGraph.Forums.Thread` for `is_content_gated` and `gate_price_nodes` |
| 12 | Stripe webhook updated for node purchases | ✓ VERIFIED | `checkout.session.completed` handler matches `type: "node_purchase"` metadata, calls `Nodes.credit_nodes` |
| 13 | 5 bundles match plan pricing | ✓ VERIFIED | Starter(500/€4.99), Popular(1200/€9.99), Creator(2800/€19.99), Pro(6500/€39.99), Ultimate(17000/€99.99) |
| 14 | nodes_routes under /api/v1/nodes | ✓ VERIFIED | 7 routes: wallet, transactions, bundles, checkout, tip, unlock, withdraw; `[:api, :api_auth]` pipeline |
| 15 | POST /api/v1/nodes/tip with 20% cut | ✓ VERIFIED | `tip/3` debits sender full amount, credits recipient `net_amount` after 20% cut |

### Frontend Truths (14/14)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Wallet page at /nodes | ✓ VERIFIED | `nodes-wallet.tsx` — balance card, pending balance, transactions, withdrawal modal |
| 2 | Shop page at /nodes/shop with 5 bundles | ✓ VERIFIED | `nodes-shop.tsx` — renders `bundles?.map()` with BundleCard components |
| 3 | Bundle purchase via Stripe Checkout | ✓ VERIFIED | `useCreateCheckout` → `nodesApi.createCheckout` → `window.location.href = data.checkout_url` |
| 4 | Tip button with presets (10/50/100/500) + custom | ✓ VERIFIED | `tip-modal.tsx` — `PRESETS = [10, 50, 100, 500] as const`, custom input field |
| 5 | Content unlock wired in thread-view.tsx | ✓ VERIFIED | `unlockMutation.mutate(post.id)` with success toast + insufficient_balance → navigate `/nodes/shop` |
| 6 | Transaction history with type filtering | ✓ VERIFIED | `nodes-wallet.tsx` — 6 filter tabs (All, Purchases, Tips, Received, Unlocks, Withdrawals) |
| 7 | Withdrawal form (min 1000, €0.80/100) | ✓ VERIFIED | `withdrawal-modal.tsx` — `MIN_WITHDRAWAL = 1000`, `EUR_PER_NODE = 0.008` |
| 8 | 18 coin-shop files deleted | ✓ VERIFIED | All confirmed absent; 0 remaining CoinShop/coin-shop references |
| 9 | premium/components/index.ts updated | ✓ VERIFIED | No CoinShopWidget exports remain |
| 10 | stripe.tsx kept and reused | ✓ VERIFIED | `lib/stripe.tsx` exists, untouched |
| 11 | premium-page/ kept | ✓ VERIFIED | Directory exists with 9 files |
| 12 | lib/wallet/ not touched | ✓ VERIFIED | Directory exists intact (4 files) |
| 13 | Toast on purchase success | ✓ VERIFIED | `toast.success()` in tip-modal, withdrawal-modal, thread-view |
| 14 | 7/7 API endpoints match backend routes | ✓ VERIFIED | wallet, transactions, bundles, checkout, tip, unlock, withdraw |

---

## 2. Required Artifacts

### Backend (9 created + 11 modified + 6 deleted)

| File | Exists | Lines | Stubs | Wired | Status |
|------|--------|-------|-------|-------|--------|
| nodes/nodes.ex | ✓ | 510 | 0 | ✓ | VERIFIED |
| nodes/node_wallet.ex | ✓ | 37 | 0 | ✓ | VERIFIED |
| nodes/node_transaction.ex | ✓ | 42 | 0 | ✓ | VERIFIED |
| nodes/withdrawal_request.ex | ✓ | 40 | 0 | ✓ | VERIFIED |
| nodes/node_bundles.ex | ✓ | 82 | 0 | ✓ | VERIFIED |
| nodes_controller.ex | ✓ | 233 | 0 | ✓ | VERIFIED (fixed) |
| nodes_json.ex | ✓ | 77 | 0 | ✓ | VERIFIED (fixed) |
| nodes_routes.ex | ✓ | 26 | 0 | ✓ | VERIFIED |
| migration | ✓ | 73 | 0 | ✓ | VERIFIED |

### Frontend (12 created + 5 modified + 18 deleted)

| File | Exists | Lines | Stubs | Wired | Status |
|------|--------|-------|-------|-------|--------|
| modules/nodes/index.ts | ✓ | 33 | 0 | ✓ | VERIFIED |
| modules/nodes/types/index.ts | ✓ | 63 | 0 | ✓ | VERIFIED |
| modules/nodes/services/nodesApi.ts | ✓ | 78 | 0 | ✓ | VERIFIED |
| modules/nodes/store/nodesStore.ts | ✓ | 68 | 0 | ✓ | VERIFIED |
| modules/nodes/hooks/useNodes.ts | ✓ | 100 | 0 | ✓ | VERIFIED |
| components/tip-button.tsx | ✓ | 35 | 0 | ✓ | VERIFIED |
| components/tip-modal.tsx | ✓ | 140 | 0 | ✓ | VERIFIED (fixed) |
| components/bundle-card.tsx | ✓ | 62 | 0 | ✓ | VERIFIED (fixed) |
| components/transaction-row.tsx | ✓ | 55 | 0 | ✓ | VERIFIED (fixed) |
| components/withdrawal-modal.tsx | ✓ | 90 | 0 | ✓ | VERIFIED (fixed) |
| pages/nodes/nodes-wallet.tsx | ✓ | 135 | 0 | ✓ | VERIFIED |
| pages/nodes/nodes-shop.tsx | ✓ | 72 | 0 | ✓ | VERIFIED |

---

## 3. Issues Found & Fixed

| # | Severity | File | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | **BUG** | nodes_controller.ex:76 | `bundle.price` → KeyError (field is `price_cents`) | Changed to `bundle.price_cents` |
| 2 | **BUG** | nodes_json.ex:41 | `b.price` → KeyError (field is `price_eur`) | Changed to `b.price_eur` |
| 3 | **BUG** | bundle-card.tsx:5 | `../../types` → TS2307 module not found | Fixed to `../types` |
| 4 | **BUG** | tip-modal.tsx:9 | `../../hooks/useNodes` → TS2307 module not found | Fixed to `../hooks/useNodes` |
| 5 | **BUG** | transaction-row.tsx:5 | `../../types` → TS2307 module not found | Fixed to `../types` |
| 6 | **BUG** | withdrawal-modal.tsx:6 | `../../hooks/useNodes` → TS2307 module not found | Fixed to `../hooks/useNodes` |
| 7 | **BUG** | tip-modal.tsx:20 | `PRESETS[0]` → TS2345 (number \| undefined) | Added `as const` assertion |
| 8 | **LOW** | sticker_controller.ex:185 | Pattern-matched `:insufficient_coins` | Changed to `:insufficient_nodes` |
| 9 | **LOW** | stickers.ex:146,285-288 | Function `maybe_charge_coins` | Renamed to `maybe_charge_nodes` |
| 10 | **LOW** | stickers.ex:295 | Error atom `:insufficient_coins` | Changed to `:insufficient_nodes` |
| 11 | **LOW** | shop_controller.ex:93 | User-facing "don't have enough coins" | Changed to "nodes" |
| 12 | **LOW** | title_controller.ex:131 | User-facing "don't have enough coins" | Changed to "nodes" |
| 13 | **LOW** | shop_controller.ex:3,9 | Module doc says "coin shop" | Changed to "cosmetic shop" |
| 14 | **LOW** | gamification.ex:137 | Doc references `coins_awarded` | Changed to `xp_awarded` |
| 15 | **LOW** | gamification.ex:160 | Param named `_coins` | Changed to `_bonus` |
| 16 | **LOW** | stripe_webhook_controller.ex:158 | Comment says "coin purchases" | Changed to "node purchases" |
| 17 | **LOW** | stickers.ex:13 | Comment says "Coin-gated" | Changed to "Node-gated" |
| 18 | **LOW** | stickers.ex:139-140 | Doc references "coins" | Changed to "nodes" |

**2 tests updated** to match atom rename: `stickers_test.exs`, `messaging/stickers_test.exs`

---

## 4. Anti-Patterns Scan

| Pattern | Count |
|---------|-------|
| TODO/FIXME | 0 |
| Placeholder content | 0 |
| Empty returns / stubs | 0 |
| console.log-only functions | 0 |

---

## 5. Compilation & Type-Check

| Check | Result |
|-------|--------|
| Backend `mix compile` | ✓ CLEAN (only pre-existing warnings from Forums/ChatPoll/VoiceMessage/HTTPoison) |
| Frontend `tsc --noEmit` | ✓ CLEAN (0 errors in Phase 32 files) |

---

## 6. Human Verification Required

| # | Test | Expected | Why Human |
|---|------|----------|-----------|
| 1 | Navigate to /nodes | See balance card with ℕ symbol, transaction history, withdrawal button | Visual appearance |
| 2 | Navigate to /nodes/shop | See 5 bundle cards with correct pricing, "Popular" badge | Visual layout |
| 3 | Click a bundle "Buy" button | Stripe Checkout session opens | External service |
| 4 | Complete Stripe test purchase | Wallet balance increases, toast shows "ℕ X added" | End-to-end flow |
| 5 | Click TipButton on forum post | Modal shows presets, 80% disclosure, balance check | Visual + interaction |
| 6 | Send a tip | Sender debited, recipient credited (pending), toast confirms | Real-time state |
| 7 | Click "Unlock" on gated thread | Content revealed on success; insufficient balance → redirect to shop | E2E unlock flow |
| 8 | Request withdrawal (≥1000 nodes) | Form shows EUR conversion, request created | Business logic |

---

## 7. Verification Metadata

- **Approach:** Goal-backward analysis from plan must_haves
- **Files inspected:** 39 (9 created backend, 12 created frontend, 11 modified backend, 5 modified frontend, 6 deleted backend, 18 deleted frontend)
- **Issues found:** 7 bugs (2 backend runtime, 5 frontend TS errors) + 11 low-severity
- **Issues fixed:** 18/18 (all fixed in commit `e1af2a7e`)
- **Remaining gaps:** 0
