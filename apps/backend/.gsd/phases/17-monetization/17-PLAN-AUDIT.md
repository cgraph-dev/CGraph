# Phase 17 — Plan vs Codebase Audit Report (Re-Audit)

> Re-audited: 2026-03-02 | Plans: 17-01 through 17-04 | Prior: 12 issues found and fixed **Re-audit
> result: 5 new issues found → ALL 5 NOW RESOLVED**

---

## Prior Audit Status

All 12 issues from the first audit have been **resolved in the plan text**:

| Prior ID | Issue                                   | Resolution                                                      | Status |
| -------- | --------------------------------------- | --------------------------------------------------------------- | ------ |
| C1       | `activate_subscription` param keys      | Fixed in 17-02 — uses `tier:`, `current_period_end:` (unix int) | ✅     |
| C2       | `award_coins` signature                 | Fixed in 17-03 — loads `%User{}`, passes `"purchase"` string    | ✅     |
| C3       | `subscription_changeset` field coverage | Fixed in 17-01 task 0 — extends changeset to cast all fields    | ✅     |
| C4       | `stripe_subscription_id` not persisted  | Fixed in 17-01 task 0 — adds field + migration                  | ✅     |
| M1       | Billing route collision                 | Fixed in 17-03 — extends PaymentController, no new controller   | ✅     |
| M2       | Duplicate billing UI                    | Fixed in 17-01 + 17-03 — extends existing billing-settings.tsx  | ✅     |
| M3       | `useCoinShop` not a stub                | Fixed in 17-03 — documents as 146L real hook, verifies wiring   | ✅     |
| M4       | No IAP SDK                              | Fixed in 17-02 — prerequisite `pnpm add react-native-iap`       | ✅     |
| m1       | Existing mobile screens                 | Fixed in 17-02 — "Extend" not "Create"                          | ✅     |
| m2       | Store location                          | Fixed in 17-01 — `modules/premium/store/`                       | ✅     |
| m3       | Tier inconsistency                      | Fixed in 17-01 task 0 — explicit fix step                       | ✅     |
| m4       | Type proliferation                      | Fixed in 17-04 — imports TierName from tiers.ts                 | ✅     |

---

## NEW Issues Found in Re-Audit

### CRITICAL

#### C5 — Migration column conflict: 17-01 task 0 AND 17-04 task 1 both add same user columns

**Plans affected:** 17-01 task 0, 17-04 task 1

Both migrations add to the `users` table:

- `stripe_connect_id`
- `creator_status`
- `creator_onboarded_at`

17-01 task 0 (`TIMESTAMP_fix_subscription_fields.exs`) adds ALL 8 new user columns including
these 3. 17-04 task 1 (`TIMESTAMP_add_creator_monetization.exs`) also adds these 3.

Running both causes: `column "stripe_connect_id" of relation "users" already exists`.

**Fix:** Remove `stripe_connect_id`, `creator_status`, `creator_onboarded_at` ALTER statements from
17-04 task 1.

#### C6 — Shop route mismatch: frontend POSTs to `/api/v1/shop/purchase-coins` but no backend route exists for it

**Plans affected:** 17-03 task 4

**Frontend (verified):** `useCoinShop.ts:54` calls `POST /api/v1/shop/purchase-coins` **Backend
(verified):** `gamification_routes.ex:95-101` has `/shop` scope with
`POST /:id/purchase → ShopController`

17-03 task 4 says "Add routes to gamification_routes.ex shop scope" but doesn't specify the exact
path to add within that scope.

**Fix:** 17-03 task 4 must explicitly state: "Add
`post "/purchase-coins", CoinShopController, :checkout` inside the existing `/shop` scope in
gamification_routes.ex, alongside the existing ShopController routes."

### MODERATE

#### M5 — Duplicate invoice endpoints across 17-01 task 8 and 17-03 task 5

**Plans affected:** 17-01 task 8, 17-03 task 5

17-01 task 8: "GET /api/v1/premium/invoices" on PremiumController 17-03 task 5: "GET
/api/v1/billing/invoices" on PaymentController

Two invoice endpoints on different controllers/paths. The 17-03 version (PaymentController at
`/billing/invoices`) is correct since PaymentController already owns `/billing/*` routes.

**Fix:** Remove the invoice endpoint from 17-01 task 8 (or repurpose as premium status history only,
not Stripe invoices).

### MINOR

#### m5 — 17-02 task 5 code sample mixes `expo-in-app-purchases` and `react-native-iap` APIs

The prerequisite says `pnpm add react-native-iap` but the code sample uses `expo-in-app-purchases`
import.

**Fix:** Use `react-native-iap` APIs consistently.

#### m6 — Premium store not re-exported from `@/stores` barrel

`modules/premium/store/premiumStore.ts` exists but `stores/index.ts` doesn't re-export it.
Components using `import from '@/stores'` won't find it.

**Fix:** Either add re-export or document that imports must use `@/modules/premium/store`.

---

## Verified Correct (No Issues)

| Claim                                                                     | File                                | Verified |
| ------------------------------------------------------------------------- | ----------------------------------- | -------- |
| `activate_subscription/2` with `params.tier`, `params.current_period_end` | subscriptions.ex L126-139           | ✅       |
| `award_coins/4` takes `%User{}` + String.t() type                         | gamification.ex L231-232            | ✅       |
| PaymentController at `CGraphWeb.Api.PaymentController`                    | payment_controller.ex (158L)        | ✅       |
| 4 billing routes: plans, status, checkout, portal                         | user_routes.ex L250-258             | ✅       |
| `billing-settings.tsx` (277L) exists                                      | modules/settings/components/        | ✅       |
| `billing-settings-panel.tsx` (138L) exists                                | modules/settings/components/panels/ | ✅       |
| `billing.ts` (123L) with getStatus/createCheckout/createPortal            | services/billing.ts                 | ✅       |
| `useCoinShop.ts` (146L) calls `POST /api/v1/shop/purchase-coins`          | useCoinShop.ts L54                  | ✅       |
| `coin-shop.tsx` (145L) with 12 files in directory                         | pages/premium/coin-shop/            | ✅       |
| Premium store at `modules/premium/store/` (premiumStore.ts)               | modules/premium/store/              | ✅       |
| `payment.ts` (553L) mobile payment service                                | mobile/src/lib/payment.ts           | ✅       |
| `useSubscription()` + `usePremiumStatus()` in mobile hooks                | features/premium/hooks/index.ts     | ✅       |
| `premium-screen.tsx` (253L) with sub-components                           | screens/premium/                    | ✅       |
| `tiers.ts` (386L) with `TierName = 'free' \| 'premium' \| 'enterprise'`   | shared-types/src/tiers.ts L25       | ✅       |
| Forum `belongs_to :owner`                                                 | forum.ex L118                       | ✅       |
| `SubscriptionService` (219L) = notification subs only                     | forums/subscription_service.ex      | ✅       |
| `stripity_stripe ~> 3.2` in deps                                          | mix.exs L93                         | ✅       |
| Stripe config with price_ids/URLs                                         | config/stripe.exs + runtime.exs     | ✅       |
| No IAP SDK in mobile package.json (plan notes prerequisite)               | mobile/package.json                 | ✅       |
| `stripe.tsx` (184L) Elements provider                                     | web/src/lib/stripe.tsx              | ✅       |
| `coin-shop-screen/` with 16 files                                         | mobile/src/screens/premium/         | ✅       |

---

## Codebase State Reminders (Pre-Existing Bugs — Plan 17-01 Task 0 Addresses These)

These bugs exist in the current codebase and are **correctly documented** in 17-01 task 0:

| Bug                                                        | Impact                                      | Verified Location                  |
| ---------------------------------------------------------- | ------------------------------------------- | ---------------------------------- |
| `stripe_subscription_id` not in User schema/changeset      | Silently dropped by `activate_subscription` | user.ex, auth_strategies.ex        |
| `cancel_at_period_end` not in User schema                  | `PremiumController.cancel/2` silently fails | premium_controller.ex              |
| `subscription_changeset` only casts 4 fields               | All new IAP/Connect fields would be dropped | auth_strategies.ex L108-117        |
| `features/2` enterprise xp_multiplier=2.5 vs `tiers/2`=3.0 | Inconsistent API responses                  | premium_controller.ex L100 vs L399 |
| `creator_changeset/2` does not exist                       | Needed by 17-04 Connect onboarding          | auth_strategies.ex (missing)       |

---

## Action Items — ALL RESOLVED

| Priority | Issue                            | Fix Applied                                                                  | Plan File | Status |
| -------- | -------------------------------- | ---------------------------------------------------------------------------- | --------- | ------ |
| **P0**   | C5 — Migration column conflict   | Removed user column ALTERs from 17-04 task 1 (already in 17-01 task 0)       | 17-04     | ✅     |
| **P1**   | C6 — Shop route path             | Added explicit `post "/purchase-coins"` route spec in shop scope             | 17-03     | ✅     |
| **P1**   | M5 — Duplicate invoice endpoints | Replaced 17-01 task 8 with enriched status endpoint; invoices on PaymentCtrl | 17-01     | ✅     |
| **P2**   | m5 — IAP library API mismatch    | Rewrote code sample to use `react-native-iap` APIs exclusively               | 17-02     | ✅     |
| **P2**   | m6 — Store barrel                | Added `usePremiumStore` re-export instruction for `stores/index.ts`          | 17-01     | ✅     |
