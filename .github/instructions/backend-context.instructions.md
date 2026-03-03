---
applyTo: "apps/backend/**"
---
# CGraph Backend — Copilot Context

## Stack
Elixir/Phoenix 1.8, PostgreSQL (Ecto), Redis, Oban, Guardian JWT, Fly.io

## NEVER
- Put business logic in controllers — delegate to lib/cgraph/<context>/
- Bypass RateLimiterV2 plug
- Break CGraph.Encryption or Guardian JWT
- Use Task.async in controllers — use Oban workers
- Write directly to DB without going through contexts

## ALWAYS
- CGraph.Repo for writes, CGraph.ReadRepo for reads
- CGraph.Cache for all caching (L1 ETS → L2 Cachex → L3 Redis)
- Run Credo + Sobelow + Dialyzer before marking any task done
- Update docs/API_CONTRACTS.md after ANY endpoint change
- Update packages/shared-types/src/ if response shape changes

## Contexts (26 total — DO NOT MIX)
Accounts | Messaging | Groups | Forums | Gamification | Notifications
Encryption | AI | Collaboration | WebRTC | Moderation | Search
Subscriptions | OAuth | Permissions | Referrals | Reputation | Calendar
Announcements | Customizations | Webhooks | DataExport | Audit | Cache
FeatureFlags | Presence | Storage
