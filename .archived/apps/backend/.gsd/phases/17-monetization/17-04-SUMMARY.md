---
phase: 17
plan: 04
title: 'Creator Monetization — Stripe Connect, Paid Forums, Payouts'
status: complete
started: 2026-03-02
completed: 2026-03-02
tasks_total: 9
tasks_completed: 9
commits: 9
---

# Summary 17-04: Creator Monetization

## Result

All 9 tasks executed successfully. Creator monetization system fully implemented with Stripe Connect
onboarding, paid forum subscriptions, earnings tracking, payouts, content gating, dashboard UI, and
webhook integration.

## Task Table

| #   | Task                                     | Status | Commit     | Key Files                                                                                               |
| --- | ---------------------------------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Database schema for creator monetization | ✅     | `980db1d2` | Migration 20260302600005, PaidForumSubscription, CreatorEarning, CreatorPayout schemas                  |
| 2   | Build Stripe Connect onboarding          | ✅     | `c0720121` | `creators/connect_onboarding.ex`                                                                        |
| 3   | Build paid forum subscription module     | ✅     | `0c243779` | `creators/paid_subscription.ex`                                                                         |
| 4   | Build earnings and payout modules        | ✅     | `7310fd00` | `creators/earnings.ex`, `creators/payout.ex`                                                            |
| 5   | Build creator controller and routes      | ✅     | `0116efbb` | `creators/creators.ex`, `creator_controller.ex`, `creator_analytics_controller.ex`, `creator_routes.ex` |
| 6   | Content gate implementation              | ✅     | `4c435e0a` | `creators/content_gate.ex`, `paid-badge.tsx`, `content-gate.tsx`                                        |
| 7   | Build creator dashboard UI               | ✅     | `a0ef2c51` | `creator-dashboard.tsx`, `earnings-page.tsx`, `analytics-page.tsx`, `payout-page.tsx`                   |
| 8   | Wire Connect webhooks                    | ✅     | `daa05c49` | `stripe_webhook_controller.ex` (extended)                                                               |
| 9   | Add shared creator types                 | ✅     | `41236bac` | `packages/shared-types/src/creator.ts`                                                                  |

## Architecture Decisions

- **Facade pattern**: `CGraph.Creators` delegates to `ConnectOnboarding`, `PaidSubscription`,
  `Earnings`, `Payout`, `ContentGate`
- **Webhook routing**: Metadata-based dispatch (`type: "paid_forum"`) distinguishes creator payments
  from platform subscriptions
- **All webhooks** go through `Idempotency.process_once/2` from 17-01
- **User.creator_changeset/2** from 17-01 used for all Connect field updates (not
  Accounts.update_user)
- **Platform fee**: Configurable via `config :cgraph, CGraph.Creators, platform_fee_percent: 15`
  (default 15%)
- **Minimum payout**: $10 (1000 cents), enforced in `Payout.request_payout/1`

## Files Created

### Backend (Elixir)

- `apps/backend/priv/repo/migrations/20260302600005_add_creator_monetization.exs`
- `apps/backend/lib/cgraph/creators/creators.ex` — Facade context
- `apps/backend/lib/cgraph/creators/connect_onboarding.ex`
- `apps/backend/lib/cgraph/creators/paid_subscription.ex`
- `apps/backend/lib/cgraph/creators/earnings.ex`
- `apps/backend/lib/cgraph/creators/payout.ex`
- `apps/backend/lib/cgraph/creators/content_gate.ex`
- `apps/backend/lib/cgraph/creators/paid_forum_subscription.ex` — Ecto schema
- `apps/backend/lib/cgraph/creators/creator_earning.ex` — Ecto schema
- `apps/backend/lib/cgraph/creators/creator_payout.ex` — Ecto schema
- `apps/backend/lib/cgraph_web/controllers/api/v1/creator_controller.ex`
- `apps/backend/lib/cgraph_web/controllers/api/v1/creator_analytics_controller.ex`
- `apps/backend/lib/cgraph_web/router/creator_routes.ex`

### Frontend (React/TypeScript)

- `apps/web/src/pages/creator/creator-dashboard.tsx`
- `apps/web/src/pages/creator/earnings-page.tsx`
- `apps/web/src/pages/creator/analytics-page.tsx`
- `apps/web/src/pages/creator/payout-page.tsx`
- `apps/web/src/components/forums/paid-badge.tsx`
- `apps/web/src/components/forums/content-gate.tsx`

### Shared Types

- `packages/shared-types/src/creator.ts`

## Files Modified

- `apps/backend/lib/cgraph_web/controllers/stripe_webhook_controller.ex` — Added Connect event
  handlers
- `apps/backend/lib/cgraph_web/router.ex` — Added `import CreatorRoutes` + `creator_routes()`
- `packages/shared-types/src/index.ts` — Added `export * from './creator'`

## Dependencies

- 17-01: `User.creator_changeset/2`, `Idempotency.process_once/2`,
  `stripe_connect_id`/`creator_status`/`creator_onboarded_at` columns
- 17-03: `CoinCheckout` patterns referenced
