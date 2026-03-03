---
phase: 17-monetization
plan: 02
subsystem: payments
tags: [iap, apple, google, mobile, subscriptions, react-native-iap]

requires:
  - phase: 17-01
    provides: Extended User schema (iap_provider, iap_transaction_id), subscription_changeset, Subscriptions.activate_subscription/2
provides:
  - IAP receipt validation (Apple App Store Server API v2 + Google Play Developer API v3)
  - iap_receipts table for receipt storage and idempotent validation
  - Mobile native IAP purchase flow via react-native-iap
  - Server-to-server notification handlers (Apple S2S + Google RTDN)
  - Cross-platform subscription sync (IAP on mobile ↔ web premium status)
affects: [mobile-premium, subscriptions, webhooks]

tech-stack:
  added: [react-native-iap]
  patterns: [iap-receipt-validation, platform-dispatch, server-notification-handler]

key-files:
  created:
    - apps/backend/lib/cgraph/subscriptions/receipt_validation.ex
    - apps/backend/lib/cgraph/subscriptions/iap_validator.ex
    - apps/backend/lib/cgraph_web/controllers/iap_controller.ex
    - apps/mobile/src/features/premium/services/iap-service.ts
    - apps/mobile/src/screens/premium/subscription-management.tsx
  modified:
    - apps/backend/lib/cgraph_web/router/gamification_routes.ex
    - apps/backend/lib/cgraph_web/router/health_routes.ex
    - apps/mobile/src/features/premium/hooks/index.ts
    - apps/mobile/src/screens/premium/premium-screen.tsx
    - apps/mobile/package.json

key-decisions:
  - "Apple App Store Server API v2 (signed JWS) instead of deprecated verifyReceipt"
  - "Google Play Developer API v3 (androidpublisher) for subscription validation"
  - "Idempotent receipt validation via Repo.get_by(original_transaction_id) — returns existing on duplicate"
  - "react-native-iap over expo-in-app-purchases (not Expo managed workflow)"
  - "Keep existing payment.ts for non-IAP flows; iap-service.ts handles native layer only"
  - "S2S notifications (Apple DID_RENEW/REFUND, Google SUBSCRIPTION_RENEWED/CANCELED) on unauthenticated routes alongside Stripe webhook"
  - "Cross-platform sync relies on shared User.subscription_tier — both IAP and Stripe paths write to same field"

patterns-established:
  - "IAP validation: platform dispatch (apple/google) → API call → store receipt → activate subscription"
  - "Server notification handlers: verify platform signature → process event → update subscription state"
  - "Mobile IAP: native SDK purchase → receipt → POST to backend → server validates → activate"

duration: 10min
completed: 2026-03-02
---

# Plan 17-02: Mobile IAP + Cross-Platform Subscription Sync

**Built Apple IAP + Google Play receipt validation, native mobile purchase flow, server-to-server notifications, and cross-platform subscription sync.**

## Tasks Completed (7/7)

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create iap_receipts schema | `90905826` | receipt_validation.ex, migration |
| 2 | Build IAP validator module | `b34bcf0e` | iap_validator.ex |
| 3 | Build IAP controller | `e5160bd6` | iap_controller.ex |
| 4 | Add IAP routes to router | `62af676f` | gamification_routes.ex, health_routes.ex |
| 5 | Install IAP SDK + wire service | `3e8fae99` | iap-service.ts, package.json |
| 6 | Extend premium screens | `0a7254ea` | premium-screen.tsx, subscription-management.tsx |
| 7 | Cross-platform sync wiring | `1d14ac52` | hooks/index.ts |

## What Was Built

1. **iap_receipts table**: Schema with platform, product_id, original_transaction_id, validation_status, expires_at, auto_renewing. Unique index on {platform, original_transaction_id} for idempotent validation.

2. **IAPValidator**: Platform dispatch (apple/google) → API validation → receipt storage → subscription activation. Uses App Store Server API v2 (JWS signed transactions) and Google Play Developer API v3. Idempotent — returns existing receipt on duplicate transaction_id.

3. **IAPController**: POST /api/v1/iap/validate (receipt from mobile), POST /api/v1/iap/restore (re-validate stored receipts), POST /api/v1/iap/notifications/apple (S2S v2), POST /api/v1/iap/notifications/google (RTDN).

4. **Routes**: IAP validate/restore in gamification_routes (authenticated). Apple/Google notification endpoints in health_routes (unauthenticated, alongside Stripe webhook).

5. **Mobile IAP service**: react-native-iap with purchaseSubscription, restorePurchases, loadProducts. Purchase listener sends receipt to backend. finishTransaction after validation.

6. **Premium screens extended**: premium-screen.tsx wired to IAP purchase flow. New subscription-management.tsx with restore, manage, platform-specific links.

7. **Cross-platform sync**: Both IAP and Stripe paths use activate_subscription/2 writing to same User fields. Mobile syncs on launch via GET /api/v1/premium/status.

## Deviations

None — all tasks executed as planned.
