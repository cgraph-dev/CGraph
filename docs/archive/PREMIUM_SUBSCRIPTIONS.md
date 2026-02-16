# Premium & Subscriptions (v0.9.1)

## Scope

- Premium tiers and features exposure
- Coins and shop interaction with premium
- Subscription lifecycle endpoints

## API Surface

- `GET /api/v1/premium/status`
- `GET /api/v1/premium/tiers`
- `GET /api/v1/premium/features`
- `POST /api/v1/premium/subscribe`
- `POST /api/v1/premium/cancel`
- Related coin/shop endpoints: `GET /api/v1/coins`, `GET /api/v1/coins/packages`,
  `GET /api/v1/shop`, `POST /api/v1/shop/:id/purchase`

## Behavior

- Users have `subscription_tier` (e.g., `free`, `premium`, `premium_plus`) and
  `subscription_expires_at`.
- Premium enables enhanced limits (attachments, reactions), badges, and shop discounts (document
  exact deltas).
- Status endpoint returns tier and expiry for gating UI.

## Incomplete / TODO

- Client hooks for premium gating return stub data; document as incomplete.
- Subscription billing provider integration not finalized in docs—add Stripe plan IDs and webhook
  flows when ready.
- Shop discount rules not codified in docs; align backend + UI.
- Coin purchase packages exist but purchase flow not documented—add UX and anti-abuse notes.
