# Phase 32: Nodes Monetization - Context

**Gathered:** 2026-07-24 **Status:** Ready for execution

<domain>
## Phase Boundary

Replace the coins virtual currency with Nodes. Build wallet system, purchase flow (Stripe), tipping
(forum posts + profiles), content unlock (wiring Phase 31 thread gating), and withdrawal requests.
Delete all coin-specific files. This phase does NOT migrate Stripe→Paddle (separate future epic) and
does NOT modify the Creator monetization system.

</domain>

<decisions>
## Implementation Decisions

### Coins → Nodes Migration

- **Replace coins with Nodes entirely** — deprecate/delete coin system
- Migrate coins field → node_wallets table (separate table, not a field on users)
- Delete all 6 backend coin files + 18 frontend coin shop files
- Remove award_coins/spend_coins from gamification.ex
- Update all existing callers: stickers.ex (L290), title_shop_system.ex (L94+L98+L137+L141),
  achievement_system.ex (L114), and JSON serializers (user_json.ex L117, auth_json.ex L117,
  shop_controller.ex L74, title_controller.ex L120)
- Keep non-coin gamification functions (streaks, etc.) if any exist

### Bundle Pricing

- Use definitive plan bundles (EUR pricing, 5 tiers): Starter(500/€4.99), Popular(1200/€9.99/+20%),
  Creator(2800/€19.99/+40%), Pro(6500/€39.99/+63%), Ultimate(17000/€99.99/+70%)
- Purchase via existing Stripe Checkout (NOT Paddle — Paddle migration is a separate epic)

### Tipping

- Tip buttons on **forum posts + user profiles** (not DMs, not group messages)
- Preset amounts: 10, 50, 100, 500 + custom amount input
- 20% platform cut on all tips, disclosed to user before confirming
- 21-day hold on earned nodes (recipient gets pending_balance)

### Content Unlock UX

- **Preview + blur + floating unlock button**
- Show first gate_preview_chars characters readable
- Apply CSS blur (backdrop-filter: blur(8px)) to remaining content
- Float "Unlock for ℕ X" button over blurred section
- Confirmation modal before payment

### Coin Shop Disposition

- **Delete and rebuild from scratch** — remove existing coin-shop.tsx + entire coin-shop/ directory
- Build new Nodes shop page at /nodes/shop
- Keep premium-page/ intact (separate premium subscription feature)
- Keep stripe.tsx provider (reuse for Nodes Checkout)

### Routing

- /nodes → Wallet page (NOT /wallet — avoids conflict with WalletAuth crypto identity)
- /nodes/shop → Shop page (bundle purchase)

### Withdrawal

- Minimum 1000 nodes
- Conversion: €0.80 per 100 nodes (nodes × 0.008 = EUR)
- Status progression: pending → processing → completed/failed

</decisions>

<specifics>
## Specific Ideas

- Toast on purchase success: "ℕ 1,200 added to your wallet"
- ℕ symbol used throughout UI for Nodes amounts
- Popular bundle gets "Most Popular" / "🔥" badge
- Tip confirmation shows "Creator receives 80%"
- Wallet page shows lifetime stats (earned, spent)

</specifics>

<deferred>
## Deferred Ideas

- Paddle migration (Merchant of Record for VAT/tax compliance) — separate multi-sprint epic
- Mobile IAP (StoreKit 2 / Google Play Billing) — future mobile phase
- Cosmetic purchases with Nodes (cosmetic_purchase transaction type exists but no shop UI yet)
- Gift sending/receiving (transaction types defined but no UI)

</deferred>

---

_Phase: 32-nodes-monetization_ _Context gathered: 2026-07-24_
