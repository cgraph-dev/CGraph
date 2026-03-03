---
phase: 17-monetization
plan: 01
subsystem: payments
tags: [stripe, webhooks, idempotency, subscriptions, premium, billing]

requires:
  - phase: 16-gamification
    provides: LevelGatePlug pattern, award_coins/4, coin economy
provides:
  - Webhook idempotency (process_once/2) — used by 17-03 coin fulfillment and 17-04 Connect webhooks
  - TierFeatures module — single source of truth for tier capabilities
  - PremiumGatePlug — tier-based endpoint gating
  - Extended User schema with subscription/IAP/creator fields — used by 17-02 and 17-04
  - Subscription Zustand store — used by billing UI across plans
affects: [17-02, 17-03, 17-04, billing, premium, subscriptions]

tech-stack:
  added: []
  patterns: [webhook-idempotency, tier-feature-extraction, premium-gate-plug]

key-files:
  created:
    - apps/backend/lib/cgraph/subscriptions/webhook_event.ex
    - apps/backend/lib/cgraph/subscriptions/idempotency.ex
    - apps/backend/lib/cgraph/subscriptions/tier_features.ex
    - apps/backend/lib/cgraph_web/plugs/premium_gate_plug.ex
    - apps/backend/priv/repo/migrations/20260302600001_fix_subscription_fields.exs
    - apps/backend/priv/repo/migrations/20260302600002_create_webhook_events.exs
    - apps/web/src/pages/premium/premium-page/checkout-return.tsx
    - packages/shared-types/src/subscription.ts
  modified:
    - apps/backend/lib/cgraph/accounts/user.ex
    - apps/backend/lib/cgraph/accounts/user/auth_strategies.ex
    - apps/backend/lib/cgraph_web/controllers/stripe_webhook_controller.ex
    - apps/backend/lib/cgraph_web/controllers/premium_controller.ex
    - apps/backend/lib/cgraph_web/router/gamification_routes.ex
    - apps/web/src/modules/premium/store/index.ts
    - apps/web/src/modules/settings/components/billing-settings.tsx
    - apps/web/src/modules/settings/components/panels/billing-settings-panel.tsx
    - apps/web/src/services/billing.ts
    - packages/shared-types/src/index.ts

key-decisions:
  - "Postgres unique constraint + on_conflict: :nothing for lock-free webhook idempotency (no distributed locks)"
  - "Always return 200 to Stripe even on errors to prevent retry storms — errors tracked in webhook_events table"
  - "TierFeatures module replaces inline maps in PremiumController — single source of truth resolves 2.5/3.0 inconsistency"
  - "PremiumGatePlug follows LevelGatePlug pattern with bypass_premium_gates test config"
  - "72-hour grace period on invoice.payment_failed before subscription deactivation"
  - "Extended User schema with IAP + creator fields upfront (17-01 task 0) to unblock 17-02 and 17-04"

patterns-established:
  - "Webhook idempotency: Idempotency.process_once(event, handler_fn) wrapping all webhook processing"
  - "Tier gating: PremiumGatePlug with min_tier option for pipeline-based endpoint protection"
  - "Feature extraction: TierFeatures module pattern for centralized tier configuration"

duration: 12min
completed: 2026-03-02
---

# Plan 17-01: Stripe Subscription Hardening + Idempotent Webhooks

**Fixed pre-existing subscription bugs, built webhook idempotency, extracted TierFeatures, created PremiumGatePlug, and extended billing UI with real-time subscription store.**

## Tasks Completed (9/9)

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 0 | Fix pre-existing subscription bugs | `f8242f77` | user.ex, auth_strategies.ex, migration |
| 1 | Create webhook_events schema | `2c43388c` | webhook_event.ex, migration |
| 2 | Build idempotency module | `af1cad7b` | idempotency.ex |
| 3 | Wire idempotency into webhook controller | `90fd4ccc` | stripe_webhook_controller.ex |
| 4 | Extract TierFeatures module | `616eb4d1` | tier_features.ex, premium_controller.ex |
| 5 | Create PremiumGatePlug | `377bfb39` | premium_gate_plug.ex, gamification_routes.ex |
| 6 | Extend web billing + subscription store | `36a492e5` | billing-settings.tsx, premiumStore, billing.ts |
| 7 | Add shared subscription types | `dd3d25c4` | subscription.ts, index.ts |
| 8 | Wire premium status with store | `928e8e1a` | premium_controller.ex |

## What Was Built

1. **Pre-existing bug fixes**: Added 8 missing User schema fields (stripe_subscription_id, cancel_at_period_end, subscription_grace_until, iap_provider, iap_transaction_id, stripe_connect_id, creator_status, creator_onboarded_at). Extended subscription_changeset to cast all fields. Added creator_changeset. Fixed enterprise tier inconsistency (2.5→3.0 XP, 30→50 coins).

2. **Webhook idempotency**: webhook_events table with unique stripe_event_id index. Idempotency.process_once/2 uses Postgres constraint for lock-free deduplication. Duplicate events acknowledged (200) but not reprocessed. Failed events tracked for investigation.

3. **TierFeatures module**: Single source of truth for all tier capabilities — XP multiplier, coin bonus, file limits, group limits, feature flags. Replaces inconsistent inline maps in PremiumController.

4. **PremiumGatePlug**: Pipeline-based tier gating returning 403 with tier_required error. Supports bypass for test environment. Added premium_gate and enterprise_gate pipelines to router.

5. **Web billing enhancements**: Extended subscription Zustand store with full state (cancel_at_period_end, grace_until, features, invoices). Invoice history table in billing settings. Checkout return page for Stripe redirects. Billing service extended with getInvoices() and cancelSubscription().

6. **Shared types**: SubscriptionTier, SubscriptionStatus, TierFeatures, Invoice, CheckoutSession, PortalSession types exported from shared-types package.

## Deviations

None — all tasks executed as planned.
