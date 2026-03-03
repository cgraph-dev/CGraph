# CGraph Backend

## What This Is

The Elixir/Phoenix API server powering CGraph — a secure real-time messaging and community platform.
This backend serves REST JSON APIs, Phoenix Channels for real-time communication, and Oban background
jobs. It handles 57 domain contexts spanning auth, messaging, groups, forums, gamification, creator
monetization, E2EE key exchange, and more. **This GSD instance manages only `apps/backend/`** —
frontend, mobile, and landing page work lives in a separate GSD instance at the monorepo root.

## Core Value

**Every API response is correct, secure, and fast** — if auth leaks tokens, payments double-charge,
rate limiting is bypassable, or queries degrade under load, nothing else matters.

## Requirements

### Validated

<!-- Shipped and confirmed working. From v0.9.47 → v1.0.0 (19 phases, 142 requirements). -->

- ✓ Phoenix context-based DDD — 57 bounded contexts in `lib/cgraph/` — established
- ✓ REST JSON API under `/api/v1/` with ~124 controller files — established
- ✓ Phoenix Channels — 19 channel modules for real-time — established
- ✓ Guardian JWT auth — access/refresh tokens, key rotation, token blacklist — established
- ✓ Argon2 password hashing — established
- ✓ OAuth 2.0 — Google, Apple, Facebook, TikTok via Assent — established
- ✓ TOTP 2FA with recovery codes via nimble_totp — established
- ✓ SIWE wallet auth — EIP-4361, nonce + domain binding, signature recovery — established
- ✓ Session management with device revocation — established
- ✓ 3-tier caching — L1 ETS → L2 Cachex → L3 Redis with stampede protection — established
- ✓ Oban background jobs — 29 workers — established
- ✓ Stripe integration — platform subscriptions, Connect creator monetization, coin shop — established
- ✓ E2EE key exchange support — X3DH, PQXDH, Kyber prekeys — established
- ✓ PostgreSQL with Ecto — primary + read replica, Snowflake IDs, 118 migrations — established
- ✓ Fly.io deployment with DNS clustering — multi-region Erlang distribution — established
- ✓ OpenTelemetry tracing — Phoenix, Ecto, Oban instrumented — established
- ✓ Prometheus metrics — telemetry_metrics_prometheus_core — established
- ✓ RateLimiterV2 — sliding window with tiered limits (strict/standard/relaxed) — established
- ✓ InputValidation module — param validation before DB writes — established
- ✓ AuditLogPlug — per-category audit logging on auth + admin routes — established
- ✓ WebSocket reconnection — circuit breaker + session resumption + jitter — Phase 1
- ✓ Route audit — 613 routes, zero 500s on critical path — Phase 1
- ✓ Token lifecycle management — TokenManager with family tracking, rotation — Phase 2
- ✓ Gamification system — XP, achievements, quests, battle pass, shop, marketplace, prestige — Phase 16
- ✓ Creator monetization — Stripe Connect, paid forums, earnings ledger, payouts — Phase 17
- ✓ Forums — boards, threads, posts, polls, categories, RSS, permissions, leaderboard — Phase 14–15
- ✓ Groups/channels — roles, invites, bans, automod, channel categories — Phase 11–12
- ✓ WebRTC signaling — voice/video calls, room management — Phase 13
- ✓ Push notifications — Expo push service integration — Phase 9
- ✓ Moderation system — reports, appeals, enforcement — Phase 12
- ✓ Data export — GDPR pipeline (processor → formatter → delivery) — established
- ✓ Collaborative editing — Yjs CRDT sync via DocumentServer — established

### Active

<!-- Backend hardening, performance, security, API completeness. -->

**Security Hardening (P0)**

- [ ] Fix payout race condition — `Payout.request_payout/1` lacks Repo.transaction/FOR UPDATE; concurrent requests can double-pay via Stripe Transfer
- [ ] Remove `inspect(reason)` from API errors — 25+ controllers leak Stripe errors, Ecto internals, module paths to end users
- [ ] Verify Apple JWS signatures in IAP flow — `iap_controller.ex` + `iap_validator.ex` decode without signature check; forged S2S notifications grant free premium
- [ ] Verify Google RTDN Pub/Sub auth tokens — `iap_controller.ex` processes RTDN without OAuth verification; forged subscription events possible
- [ ] Validate SIWE chain_id — wallet auth accepts any chain; cross-chain replay if multi-chain is added
- [ ] Complete audit logging — auth lifecycle, admin access, billing/payment events, creator payouts not logged

**API Quality (P1)**

- [ ] Fix all `Repo.get!` with user-controlled params — `creator_controller.ex:subscribe`, `paid_subscription.ex:36`, `coin_checkout.ex:143` raise 500 on missing records
- [ ] Make `Earnings.get_balance/1` atomic — two separate queries outside transaction; inconsistent balance under concurrent writes
- [ ] Fix compile-time `System.get_env` in CoinBundles — module attribute evaluates at compile time; nil in Docker runtime-env deployments
- [ ] Remove empty `@tier_mapping` dead code — `StripeWebhookController` dead module attribute
- [ ] Move plan definitions from PaymentController to config — hardcoded pricing in controller
- [ ] Split oversized controllers — `e2ee_controller` (686 LOC), `custom_emoji_controller` (560), `user_controller` (552), `auth_controller` (541), `rss_controller` (487), `permissions_controller` (470)
- [ ] Split `iap_validator.ex` (542 LOC) — separate Apple/Google validators with shared interface

**Performance & Scaling (P1)**

- [ ] Run load tests against staging — zero production-grade performance data; k6 scripts exist but untested
- [ ] Deploy PgBouncer — connection pooling needed before scaling; config exists in `pgbouncer/`
- [ ] Activate MeiliSearch in production — search currently falls back to PostgreSQL ILIKE
- [ ] Fix auth p95 latency — 383ms in local dev vs 300ms SLO target
- [ ] Implement CRDT state compaction — DocumentServer Yjs state grows unboundedly (TODO no-op)
- [ ] Fix Elixir version mismatch — Dockerfile pins 1.17.3 vs local 1.19.4

**Test Coverage (P1)**

- [ ] Write Creator monetization tests — 9 context files + 1 controller with zero tests; financial code is completely untested
- [ ] Expand Stripe webhook tests — only 50 lines / 4 tests covering signature rejection; event handler logic untested
- [ ] Establish backend coverage baseline — actual `mix coveralls` line coverage % unknown
- [ ] Add IAP credential startup validation — `iap_validator.ex` defaults to empty strings; fails opaquely

### Out of Scope

<!-- Backend-only boundaries. -->

- Frontend/mobile/landing page work — managed in separate GSD instance at monorepo root
- External security audit engagement — budget not allocated ($25K–$120K); track separately
- Database sharding — PostgreSQL handles current scale; revisit post-100K users
- Sealed sender (metadata protection) — complex, post-hardening
- Key backup/recovery UX — blocked on audit engagement decisions
- AI features (smart replies, summarizer) — not differentiating at this stage
- SIEM integration — unnecessary at current scale
- Self-hosting support — single deployment target (Fly.io)

## Context

**Current State (v1.0.0):** The backend is feature-complete with 786 `.ex` source files, 191 test
files, and 118 database migrations across 57 domain contexts. All 19 phases of the original monorepo
roadmap are complete. The backend serves, routes are healthy, and all major features are built.

**What Needs Work:**

- Security: 4 P0 vulnerabilities (payout race condition, Apple/Google IAP signature bypass, error info
  leaks) identified in `.gsd/codebase/CONCERNS.md`
- Financial code: Creator monetization (9 files, ~900 LOC) has zero dedicated tests
- Performance: No load testing has been run; auth p95 exceeds SLO even in dev
- API quality: `Repo.get!` with user-controlled params in payment/subscription flows
- Code health: 6 controllers exceed 400+ lines; `iap_validator.ex` is 542 lines mixing two providers

**Known Working:**

- Backend starts, routes healthy (613 routes audited)
- All auth flows (email, OAuth, 2FA, wallet, session management)
- All real-time channels (19 channel modules)
- All domain contexts respond to API requests
- CI passes (Credo, Sobelow, Dialyzer, mix_audit, ExUnit)
- Observability stack (Prometheus, OTel, Sentry)

**Codebase Documentation:** 7 verified docs in `.gsd/codebase/` (verified across 3 audit passes,
6,384 lines) — ARCHITECTURE, CONCERNS, CONVENTIONS, INTEGRATIONS, STACK, STRUCTURE, TESTING.

## Constraints

- **Tech stack**: Elixir ~> 1.17 / Phoenix ~> 1.8.3 / Bandit ~> 1.10 — no framework migrations
- **Architecture**: Phoenix context-based DDD — business logic ONLY in `lib/cgraph/<context>/`, NEVER in controllers
- **Repos**: `CGraph.Repo` for writes, `CGraph.ReadRepo` for reads, `CGraph.Cache` for all caching — no direct ETS/Redis outside Cache module
- **Auth**: Guardian JWT + JOSE for tokens, Argon2 for ALL passwords (no exceptions), `CGraph.Security` for token lifecycle/blacklist/key rotation
- **Encryption**: NEVER break `CGraph.Encryption` + `CGraph.Crypto` (E2EE pipeline — X3DH, PQXDH, Double/Triple Ratchet)
- **Rate limiting**: NEVER bypass `RateLimiterV2` sliding window — bypass = security hole
- **Audit**: `AuditLogPlug` MUST be on all auth + admin routes
- **Validation**: `InputValidation` module MUST run before any DB write on public endpoints
- **API contracts**: After ANY endpoint add/change → update `/CGraph/docs/API_CONTRACTS.md` immediately
- **Shared types**: If response shape changes → update `packages/shared-types/src/` in same commit
- **Scale**: Must support 10,000+ concurrent users
- **Deployment**: Fly.io with DNS clustering; Dockerfile builds; `--no-verify` for backend-only commits (husky hooks at monorepo root)
- **Quality**: "No inflation — only real working code"

## Key Decisions

| Decision | Rationale | Outcome |
| --- | --- | --- |
| Backend-only GSD instance | Frontend/mobile managed separately; backend has its own hardening roadmap | — |
| Phoenix context-based DDD | Business logic in bounded contexts, not controllers; 57 contexts established | ✓ |
| Guardian + TokenManager over raw JWT | Family tracking, rotation, theft detection not possible with plain Guardian | ✓ |
| Cachex temp tokens for 2FA | Stateless JWT can't hold pending 2FA state; Cachex TTL auto-expires | ✓ |
| Repo.transaction for financial ops | Payout race condition proves non-transactional financial code is unsafe | — |
| Orchestrator.enqueue for all emails | Oban retry/dedup beats direct Mailer call; consistent pattern | ✓ |
| RateLimiterV2 sliding window | Tiered limits (strict/standard/relaxed); Redis-backed with ETS fallback | ✓ |
| Snowflake IDs for messages | Ordering guarantee; random UIDs for users (privacy) | ✓ |
| Read replica pattern | CGraph.ReadRepo falls back to primary; separates read/write load | ✓ |
| Bandit over Cowboy | Modern HTTP server; better HTTP/2 support | ✓ |
| 3-tier cache (ETS → Cachex → Redis) | L1 microsecond / L2 millisecond / L3 distributed; stampede protection | ✓ |
| Stripe Connect Express for creators | Funds flow directly to connected accounts; platform fee auto-deducted (15%) | ✓ |

---

_Last updated: 2026-03-04 after `/gsd:new-project` — backend-only project initialization_

_Last updated: 2026-02-28 after Phase 6 (Message Features & Sync)_
