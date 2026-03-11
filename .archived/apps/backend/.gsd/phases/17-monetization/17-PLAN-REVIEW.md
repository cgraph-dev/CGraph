# Phase 17 — Monetization: Plan Review

## Phase Goal

> "Revenue works — Stripe on web, Apple IAP / Google Play on mobile, forum creator payouts"

## Plan Summary

| Plan       | Title                                               | Wave | Depends On   | Requirements                   | Tasks        | Key Deliverables                                                                                                                                |
| ---------- | --------------------------------------------------- | ---- | ------------ | ------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 17-01      | Stripe Subscription Hardening + Idempotent Webhooks | 1    | —            | PAY-01, PAY-03, PAY-10         | 9            | pre-existing bug fixes, webhook_events table, idempotency module, TierFeatures, PremiumGatePlug, billing settings extension, subscription store |
| 17-02      | Mobile IAP + Cross-Platform Sync                    | 1    | —            | PAY-02                         | 7            | iap_receipts schema, IAPValidator, IAP controller, mobile IAP service, premium screens, cross-platform sync                                     |
| 17-03      | Virtual Currency Purchase + Billing Portal          | 1    | —            | PAY-04, PAY-05                 | 8            | coin_bundles, coin_purchases, checkout module, coin shop controller, billing controller, billing page UI                                        |
| 17-04      | Creator Monetization                                | 2    | 17-01, 17-03 | PAY-06, PAY-07, PAY-08, PAY-09 | 9            | Connect onboarding, paid forum subscriptions, content gates, earnings/payouts, analytics dashboard, creator types                               |
| **Totals** |                                                     |      |              | **10/10 PAY-**                 | **33 tasks** |                                                                                                                                                 |

## Wave Execution Plan

```
Wave 1 (parallel):
  ├── 17-01: Stripe hardening + webhooks    [backend-focused]
  ├── 17-02: Mobile IAP + sync              [mobile + backend]
  └── 17-03: Coin purchase + billing portal  [backend + web]

Wave 2 (sequential after Wave 1):
  └── 17-04: Creator monetization           [full-stack, depends on 17-01 idempotency + 17-03 patterns]
```

## Requirement Coverage

| Req    | Description                                      | Plan  | Status                                   |
| ------ | ------------------------------------------------ | ----- | ---------------------------------------- |
| PAY-01 | Premium subscription via Stripe                  | 17-01 | Covered (harden existing)                |
| PAY-02 | Premium subscription via Apple IAP / Google Play | 17-02 | Covered                                  |
| PAY-03 | Premium feature gating (tier-based access)       | 17-01 | Covered (TierFeatures + PremiumGatePlug) |
| PAY-04 | Virtual currency purchase with real money        | 17-03 | Covered                                  |
| PAY-05 | Billing history / plan management portal         | 17-03 | Covered                                  |
| PAY-06 | Forum owners offer paid subscriptions            | 17-04 | Covered                                  |
| PAY-07 | Paid content gates                               | 17-04 | Covered                                  |
| PAY-08 | Creator earnings tracking + withdrawal           | 17-04 | Covered                                  |
| PAY-09 | Creator analytics dashboard                      | 17-04 | Covered                                  |
| PAY-10 | Idempotent Stripe webhook processing             | 17-01 | Covered                                  |

## Success Criteria Mapping

| #   | Criterion                                                  | Plan(s) |
| --- | ---------------------------------------------------------- | ------- |
| 1   | User subscribes via Stripe, premium unlocks immediately    | 17-01   |
| 2   | Mobile IAP purchase syncs with web subscription            | 17-02   |
| 3   | Forum owner enables paid sub, first payout succeeds        | 17-04   |
| 4   | User manages subscription/views invoices in billing portal | 17-03   |
| 5   | Webhook idempotency prevents double-charges on replay      | 17-01   |

## Dependency Graph

```
17-01 ──┐
17-02   │ (independent)
17-03 ──┤
        │
        ▼
      17-04 (depends on 17-01 webhook idempotency + 17-03 coin checkout patterns)
```

## Risk Assessment

| Risk                                   | Mitigation                                                                    | Plan         |
| -------------------------------------- | ----------------------------------------------------------------------------- | ------------ |
| Apple/Google IAP API complexity        | Use expo-in-app-purchases or react-native-iap abstraction; sandbox testing    | 17-02        |
| Stripe Connect regulatory requirements | Express accounts minimize platform compliance burden                          | 17-04        |
| Double-charge on webhook replay        | webhook_events idempotency table in 17-01                                     | 17-01        |
| Mobile vs web payment rule confusion   | Clear separation: IAP for mobile digital goods, Stripe for web + creator subs | 17-02, 17-04 |
| Creator payout disputes                | Detailed earnings ledger with fee transparency                                | 17-04        |

## Existing Infrastructure Leveraged

- `stripity_stripe ~> 3.2` — Already in deps
- `CGraph.HTTP.Services.Stripe` — Tesla HTTP client with retry/circuit-breaker
- `CGraph.Subscriptions` (330L) — Existing subscription management
- `StripeWebhookController` (243L) — Existing webhook handler
- `PremiumController` (401L) — Existing premium tier management
- `apps/web/src/lib/stripe.tsx` — Stripe Elements provider
- `apps/web/src/pages/premium/coin-shop/` — Full coin shop UI (useCoinShop.ts already calls
  /api/v1/shop/purchase-coins)
- `apps/web/src/modules/settings/components/billing-settings.tsx` (277L) — Existing billing
  management UI (extended, not replaced)
- `apps/web/src/services/billing.ts` (123L) — Existing billing service
- `apps/mobile/src/lib/payment.ts` (553L) — Payment service abstraction
- `apps/mobile/src/hooks/index.ts` (354L) — Already has useSubscription() + usePremiumStatus()
- `apps/mobile/src/screens/premium/premium-screen.tsx` (253L) — Already exists with sub-components
- Phase 16 Gamification — `award_coins/4` (requires %User{} struct + String.t() type)

## Audit Resolution

All 12 issues from [17-PLAN-AUDIT.md](17-PLAN-AUDIT.md) have been resolved:

- **C1** activate_subscription param keys → Fixed in 17-02
- **C2** award_coins signature → Fixed in 17-03 (loads User struct, uses string type)
- **C3** subscription_changeset field coverage → Fixed in 17-01 task 0 (extends changeset)
- **C4** stripe_subscription_id not persisted → Fixed in 17-01 task 0 (adds field + migration)
- **M1** billing route collision → Fixed in 17-03 (extends PaymentController, not new
  BillingController)
- **M2** duplicate billing UI → Fixed in 17-01 + 17-03 (extends existing billing-settings.tsx)
- **M3** useCoinShop not a stub → Fixed in 17-03 (uses /api/v1/shop/purchase-coins, verifies wiring)
- **M4** no IAP SDK → Fixed in 17-02 (adds react-native-iap prerequisite)
- **m1** existing mobile hooks/screens → Fixed in 17-02 (Extend, not Create)
- **m2** store location → Fixed in 17-01 (uses modules/premium/store/)
- **m3** tier inconsistency → Fixed in 17-01 task 0 (reconciled before TierFeatures)
- **m4** type proliferation → Fixed in 17-04 (imports TierName from tiers.ts)

## Files Modified (Aggregate)

**New files created:** ~28 **Existing files modified:** ~15 (including extending
billing-settings.tsx, PaymentController, useCoinShop.ts, user.ex, auth_strategies.ex) **New DB
tables:** webhook_events, iap_receipts, coin_purchases, paid_forum_subscriptions, creator_earnings,
creator_payouts **New columns:** users.iap_provider, users.iap_transaction_id,
users.stripe_connect_id, users.creator_onboarded_at, users.creator_status,
forums.monetization_enabled, forums.subscription_price_cents, forums.subscription_currency
