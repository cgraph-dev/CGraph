# Phase 17 — Plan vs Codebase Audit Report

> Audited: 2026-03-02 | Plans: 17-01 through 17-04 | Status: **12 issues found (4 critical, 4
> moderate, 4 minor)**

---

## Severity Legend

| Level        | Meaning                                                             |
| ------------ | ------------------------------------------------------------------- |
| **CRITICAL** | Will cause runtime errors or silent data loss during execution      |
| **MODERATE** | Incorrect assumption requiring plan adjustment to avoid wasted work |
| **MINOR**    | Cosmetic or architectural divergence — fixable during execution     |

---

## CRITICAL Issues

### C1. `activate_subscription/2` parameter keys don't match plan 17-02

**Plan 17-02** `store_and_activate` passes:

```elixir
%{subscription_tier: tier, subscription_expires_at: ..., iap_provider: platform, iap_transaction_id: txn_id}
```

**Actual signature** at `subscriptions.ex:127`:

```elixir
def activate_subscription(%User{} = user, params) do
  attrs = %{
    subscription_tier: params.tier,                              # expects :tier not :subscription_tier
    subscription_expires_at: unix_to_datetime(params.current_period_end),  # expects :current_period_end (unix)
    stripe_subscription_id: params.stripe_subscription_id,
    stripe_customer_id: params.stripe_customer_id
  }
```

**Problems:**

1. Uses `params.tier` (not `params.subscription_tier`) — `KeyError` at runtime
2. Uses `params.current_period_end` with `unix_to_datetime` — expects integer unix timestamp, not
   DateTime
3. Does not accept `iap_provider` or `iap_transaction_id` — these are silently ignored
4. `subscription_changeset` only casts
   `[:subscription_tier, :subscription_expires_at, :stripe_customer_id, :is_premium]` —
   `stripe_subscription_id` is silently dropped

**Fix required:** Plan 17-02 task 2 must either (a) call `activate_subscription` with correct keys,
or (b) extend the function signature + changeset for IAP fields.

### C2. `award_coins/4` signature mismatch in plan 17-03

**Plan 17-03** `fulfill_purchase/1` calls:

```elixir
CGraph.Gamification.award_coins(purchase.user_id, purchase.coins_awarded, :purchase)
```

**Actual signature** at `gamification.ex:232`:

```elixir
def award_coins(%User{} = user, amount, type, opts \\ [])
```

**Three bugs:**

1. First arg must be `%User{}` struct — plan passes a UUID binary → `FunctionClauseError`
2. `type` must be `String.t()` — plan passes atom `:purchase` → `FunctionClauseError`
3. Needs `Repo.get!(User, purchase.user_id)` before calling

**Fix required:** Plan 17-03 task 3 must load the user struct and pass `"purchase"` as a string.

### C3. `subscription_changeset` only casts 4 fields — all new fields silently dropped

**Actual changeset** at `auth_strategies.ex:102`:

```elixir
def subscription_changeset(user, attrs) do
  user
  |> cast(attrs, [:subscription_tier, :subscription_expires_at, :stripe_customer_id, :is_premium])
end
```

**Impact on plans:**

- `stripe_subscription_id` — **pre-existing bug**: `activate_subscription` sets it, changeset drops
  it. Webhook `find_user_by_stripe_subscription` will never find users.
- `iap_provider`, `iap_transaction_id` (17-02) — will be silently dropped
- `stripe_connect_id`, `creator_status`, `creator_onboarded_at` (17-04) — will be silently dropped

**Fix required:** Plan 17-01 task 1 must extend `subscription_changeset` (or create
`creator_changeset`) to cast all new fields. This is a **prerequisite** for plans 17-02 and 17-04 to
function.

### C4. Pre-existing bug: `stripe_subscription_id` never persisted

`activate_subscription/2` builds `attrs` with
`stripe_subscription_id: params.stripe_subscription_id`, but the changeset doesn't cast it. The
field doesn't appear in the User schema definition. This means:

- `find_user_by_stripe_subscription` (used by webhook controller for `subscription.updated` and
  `subscription.deleted`) **always fails**
- Subscription updates and cancellation webhooks from Stripe are **silently broken today**

**Fix required:** Plan 17-01 must add `stripe_subscription_id` to the user schema, migration, and
changeset as a P0 fix.

---

## MODERATE Issues

### M1. Three overlapping billing/payment controller surfaces

**Existing controllers:** | Endpoint Prefix | Controller | Source |
|----------------|-----------|--------| | `/api/v1/billing/*` | `CGraphWeb.Api.PaymentController` |
`user_routes.ex:254-258` | | `/api/v1/premium/*` | `PremiumController` |
`gamification_routes.ex:75-80` |

**Plans add:** | Endpoint Prefix | Controller | Plan | |----------------|-----------|------| |
`/api/v1/billing/*` | `BillingController` (new) | 17-03 | | `/api/v1/shop/*` | `CoinShopController`
(new) | 17-03 | | `/api/v1/iap/*` | `IAPController` (new) | 17-02 | | `/api/v1/creator/*` |
`CreatorController` (new) | 17-04 |

**Conflict:** Plan 17-03 creates a `BillingController` with routes at `/api/v1/billing/*` — but
`PaymentController` already serves those routes. Both have `status`, `portal`, `checkout` actions.
Route collision will fail at compile time.

**Fix required:** Plans must either (a) extend `PaymentController` for billing, (b) replace it, or
(c) use a different route prefix.

### M2. Web billing UI already exists — plans would create duplicates

**Existing:**

- `apps/web/src/services/billing.ts` (123L) — full `billingService` with `getStatus()`,
  `createCheckout()`, `createPortal()`
- `apps/web/src/modules/settings/components/billing-settings.tsx` (277L) — complete billing
  management component
- `apps/web/src/modules/settings/components/panels/billing-settings-panel.tsx` (138L)
- Accessible via Settings page → Billing section

**Plan 17-01 + 17-03** create:

- `apps/web/src/modules/settings/billing/billing-page.tsx`, `subscription-status.tsx`,
  `invoice-history.tsx`
- `apps/web/src/pages/premium/billing/billing-page.tsx`, `invoice-table.tsx`, `plan-card.tsx`

This creates **duplicate billing UIs** at two new locations alongside the existing one.

**Fix required:** Plans should extend the existing `billing-settings.tsx` rather than creating new
pages from scratch.

### M3. `useCoinShop.ts` is NOT a stub — already has real checkout logic

**Plan 17-03 task 6** says "Replace stub/mock checkout with real API calls." But `useCoinShop.ts`
(146L) already:

- Calls `POST /api/v1/shop/purchase-coins` and redirects to `checkout_url`
- Calls `POST /api/v1/shop/purchase-item` for marketplace items
- Calls `POST /api/v1/shop/claim-daily` for daily bonus
- Has full loading/error states

**Mismatch:** Plan 17-03 backend creates routes at `/api/v1/shop/checkout` but the existing frontend
calls `/api/v1/shop/purchase-coins`. Either the backend endpoint must match the existing frontend,
or both must be updated.

### M4. No native IAP SDK in mobile — plan 17-02 cannot execute as written

**Plan 17-02** imports from `expo-in-app-purchases` or `react-native-iap`. Neither package is in
`apps/mobile/package.json`. The existing `payment.ts` (554L) uses a **pure REST API** approach — all
purchases go through backend calls, not native IAP.

**Fix required:** Plan 17-02 must add `react-native-iap` or `expo-in-app-purchases` to mobile
dependencies as task 0. Also must decide whether to refactor `payment.ts` or create `iap-service.ts`
alongside it.

---

## MINOR Issues

### m1. Mobile hooks/screens already exist — plans say "create"

| Plan says to create          | Already exists at                                 |
| ---------------------------- | ------------------------------------------------- |
| `hooks/useSubscription.ts`   | `features/premium/hooks/index.ts:81` (354L total) |
| `screens/premium-screen.tsx` | `screens/premium/premium-screen.tsx` (253L)       |

Plans should say "extend" instead of "create." The existing code has substantially more structure
than plans account for (coin-shop-screen has 22 sub-component files).

### m2. `subscriptionStore.ts` location violates web architecture

Plan 17-01 creates `apps/web/src/stores/subscriptionStore.ts`. The web app convention is
`modules/<domain>/store/index.ts`. Should be `modules/premium/store/index.ts` or similar, with
barrel export from `stores/index.ts`.

### m3. Tier feature values inconsistent in existing code

`PremiumController` has two conflicting definitions:

- `tiers/2`: enterprise `xp_multiplier: 3.0`, `coin_bonus: 50`
- `features/2`: enterprise `xp_multiplier: 2.5`, `coin_bonus: 30`

Plan 17-01 TierFeatures extraction should **resolve this inconsistency**, not just extract one
version.

### m4. Type proliferation — `TierName` vs `PlanId` vs inline definitions

Three independent definitions of the same enum:

- `packages/shared-types/src/tiers.ts`: `TierName = 'free' | 'premium' | 'enterprise'`
- `apps/web/src/lib/stripe.tsx`: `PlanId = 'free' | 'premium' | 'enterprise'`
- `apps/mobile/src/lib/payment.ts`: inline `tier: 'free' | 'premium' | 'enterprise'`

Plans create `subscription.ts` and `billing.ts` shared types — should consolidate these rather than
adding more.

---

## Missing from Plans — Required Additions

| What                                               | Where                          | Which plan should add it                                 |
| -------------------------------------------------- | ------------------------------ | -------------------------------------------------------- |
| `stripe_subscription_id` field on User schema      | Migration + schema + changeset | 17-01 task 1                                             |
| `subscription_grace_until` field on User           | Migration + schema + changeset | 17-01 task 3 (references it but no migration)            |
| Extend `subscription_changeset` for all new fields | `auth_strategies.ex`           | 17-01 task 1 (pre-req for 17-02, 17-04)                  |
| `react-native-iap` or `expo-in-app-purchases` dep  | `apps/mobile/package.json`     | 17-02 task 0 (new task)                                  |
| Route deconfliction for `/api/v1/billing/*`        | Router                         | 17-03 task 5                                             |
| `cancel_at_period_end` field on User               | Migration + schema             | 17-01 (referenced in PremiumController, never persisted) |

---

## Pre-existing Bugs Plans Should Fix

| Bug                                                             | Impact                                            | Suggested Plan |
| --------------------------------------------------------------- | ------------------------------------------------- | -------------- |
| `stripe_subscription_id` silently dropped by changeset          | Subscription update/cancel webhooks fail silently | 17-01          |
| `cancel_at_period_end` not in schema but set in changeset       | Cancel state never persisted                      | 17-01          |
| `subscription_status` cast in `changeset/2` but no field exists | Silent no-op                                      | 17-01          |
| Tier feature values differ between `tiers/2` and `features/2`   | Confusing API responses                           | 17-01          |

---

## What's Correct ✓

| Aspect                                                                               | Verdict                |
| ------------------------------------------------------------------------------------ | ---------------------- |
| Requirement coverage: 10/10 PAY requirements mapped                                  | ✓ Complete             |
| Wave decomposition: 3 parallel + 1 dependent                                         | ✓ Sound                |
| Stripe dep `stripity_stripe ~> 3.2` exists                                           | ✓ Confirmed            |
| `create_checkout_session/3` exists and works                                         | ✓ Confirmed            |
| `create_portal_session/1` exists and works                                           | ✓ Confirmed            |
| Webhook route at `POST /api/webhooks/stripe`                                         | ✓ Confirmed            |
| 7 webhook event handlers in controller                                               | ✓ Confirmed            |
| Forum `belongs_to :owner` for creator identification                                 | ✓ Confirmed            |
| Forums.SubscriptionService is notifications only                                     | ✓ Correctly identified |
| LevelGatePlug exists to model PremiumGatePlug after                                  | ✓ Confirmed            |
| Stripe config in `stripe.exs` + `runtime.exs`                                        | ✓ Confirmed            |
| User schema has `subscription_tier`, `subscription_expires_at`, `stripe_customer_id` | ✓ Confirmed            |
| `TierName` type in shared-types/tiers.ts (386L)                                      | ✓ Confirmed            |

---

## Recommendations

1. **Add "task 0" to plan 17-01:** Fix pre-existing subscription bugs — add
   `stripe_subscription_id` + `cancel_at_period_end` to schema + changeset, resolve tier feature
   inconsistency
2. **Merge plan 17-03's billing controller** into the existing `PaymentController` (or replace it) —
   don't create a third billing surface
3. **Rename plan 17-03's shop endpoint** from `/api/v1/shop/checkout` to
   `/api/v1/shop/purchase-coins` to match existing frontend
4. **Plan 17-02 must add IAP SDK dependency** as a prerequisite task and decide on `payment.ts`
   refactor strategy
5. **Plan 17-02 and 17-03 code samples** must use correct function signatures (`%User{}` structs,
   string types, correct param keys)
6. **All plans adding user fields** must include changeset updates — the current changeset is a hard
   gate
