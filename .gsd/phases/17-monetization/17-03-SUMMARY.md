---
phase: 17
plan: 03
title: 'Virtual Currency Purchase + Billing Portal'
subsystem: shop, billing, payments
tags: [coins, stripe-checkout, billing-portal, invoices, coin-bundles]
requires: [17-01]
provides: [coin-purchase-flow, billing-invoices, plan-management]
affects: [backend, web, shared-types]
tech-stack: [elixir, phoenix, stripe, react, typescript, zustand]
key-files:
  - apps/backend/lib/cgraph/shop/coin_bundles.ex
  - apps/backend/lib/cgraph/shop/coin_checkout.ex
  - apps/backend/lib/cgraph/shop/coin_purchase.ex
  - apps/backend/lib/cgraph_web/controllers/api/v1/coin_shop_controller.ex
  - apps/backend/lib/cgraph_web/controllers/api/payment_controller.ex
  - apps/backend/priv/repo/migrations/20260302600004_create_coin_purchases.exs
  - apps/web/src/pages/premium/coin-shop/useCoinShop.ts
  - apps/web/src/pages/premium/coin-shop/checkout-success.tsx
  - apps/web/src/modules/settings/components/billing-settings.tsx
  - apps/web/src/modules/settings/components/panels/billing-settings-panel.tsx
  - apps/web/src/services/billing.ts
  - packages/shared-types/src/billing.ts
key-decisions:
  - Coin bundles defined as backend config map (not DB) — fast reads, deploy-time changes
  - Stripe Checkout in mode:payment (not subscription) for one-time coin purchases
  - coin_purchases table records every purchase with stripe_session_id for idempotency
  - Extended existing PaymentController (not new BillingController) for invoices + plan changes
  - Invoice history from Stripe API (not local DB) — single source of truth
  - Coin fulfillment via checkout.session.completed webhook uses Idempotency from 17-01
patterns-established:
  - coin-bundle-config: Static coin bundle definitions with tiered bonus system
  - stripe-one-time-checkout: Payment-mode Checkout sessions for non-subscription purchases
  - coin-purchase-idempotency: stripe_session_id uniqueness prevents double-award
  - billing-invoice-passthrough: Proxy Stripe invoice API to frontend with pagination
duration: ~25min
completed: true
---

# Plan 17-03 Summary: Virtual Currency Purchase + Billing Portal

## Result

**8/8 tasks completed** — 9 commits (8 tasks + 1 fix)

## Tasks

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Define coin bundles configuration | `d7903722` | ✅ |
| 2 | Create coin_purchases table and schema | `74747231` | ✅ |
| 3 | Build coin checkout module | `2d9c31cf` | ✅ |
| 4 | Build coin shop controller and routes | `09d27577` | ✅ |
| 5 | Extend PaymentController for invoices | `8b604acc` | ✅ |
| 6 | Verify coin shop frontend wiring | `c9566d20` | ✅ |
| 7 | Extend billing settings UI | `f3b00b4a` | ✅ |
| 8 | Add shared billing types | `aec06f58` | ✅ |
| fix | Fix TypeScript errors in billing panel | `b521d58e` | ✅ |

## What Was Built

### Backend (Elixir/Phoenix)
- **CoinBundles** — Static config defining 4 coin bundles (100/500/1200/2500 coins) with tiered bonus percentages
- **CoinPurchase schema** — Records purchases with user_id, bundle_id, amount_coins, price_cents, stripe_session_id, status tracking
- **CoinCheckout** — Creates Stripe Checkout sessions in `mode: payment` for one-time coin purchases; fulfills via webhook using 17-01's Idempotency module
- **CoinShopController** — `POST /api/v1/shop/purchase-coins` (matches existing frontend), `GET /api/v1/shop/bundles`
- **PaymentController extended** — Added `invoices` action (paginated Stripe invoice history), `change_plan` action for upgrade/downgrade
- **Migration** — `20260302600004_create_coin_purchases` with stripe_session_id unique index

### Web (React/TypeScript)
- **useCoinShop.ts** — Verified wiring to `POST /api/v1/shop/purchase-coins`, checkout redirect flow
- **checkout-success.tsx** — New success page for coin purchase completion with coin animation
- **billing-settings.tsx** — Extended with invoice history table, plan change controls
- **billing-settings-panel.tsx** — Extended with invoice display and plan management sections
- **billing.ts** — Added `getInvoices()`, `changePlan()` service functions

### Shared Types
- **billing.ts** — Added Invoice, CoinBundle, CoinPurchase, PlanChangeRequest types

## Dependencies Used
- 17-01: Idempotency module for webhook dedup, TierFeatures for plan info, User schema fields
