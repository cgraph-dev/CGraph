# CGraph Backend

## What This Is

CGraph Backend is the Elixir/Phoenix API server powering a secure real-time messaging and community
platform with post-quantum E2EE, gamification, forums, creator monetization, and voice/video calling.
It provides 613 REST JSON API endpoints, 17 Phoenix Channels (WebSocket) for real-time communication,
and 29 Oban background workers. All APIs are authenticated, rate-limited, input-validated, and audit-
logged. Production-hardened with PgBouncer connection pooling, 3-tier caching, and k6 load test suite.
Backend only — frontend, landing, and mobile are managed separately.

## Core Value

**Every API request is authenticated, rate-limited, validated, and auditable** — if the security
pipeline breaks, the entire platform is compromised.

## Stack

| Component           | Technology                         | Version       |
| ------------------- | ---------------------------------- | ------------- |
| **Language**         | Elixir                             | ~> 1.19       |
| **Framework**        | Phoenix                            | ~> 1.8.3      |
| **HTTP Server**      | Bandit                             | ~> 1.10       |
| **Database**         | PostgreSQL (Ecto SQL)              | ~> 3.13       |
| **DB Driver**        | Postgrex                           | ~> 0.21       |
| **Auth**             | Guardian + JOSE                    | ~> 2.4 / 1.11 |
| **Password Hashing** | Argon2                             | ~> 4.1        |
| **2FA**              | NimbleTOTP                         | ~> 1.0        |
| **Background Jobs**  | Oban                               | ~> 2.20       |
| **Cache (L2)**       | Cachex                             | ~> 4.1        |
| **Cache (L3)**       | Redis (Redix)                      | ~> 1.5        |
| **Payments**         | Stripe (stripity_stripe)           | ~> 3.2        |
| **Email**            | Swoosh + Finch                     | ~> 1.20       |
| **File Uploads**     | Waffle + ExAws S3                  | ~> 1.1        |
| **HTTP Clients**     | Tesla + Finch + Req                | ~> 1.15       |
| **Tracing**          | OpenTelemetry                      | ~> 1.5        |
| **Error Tracking**   | Sentry                             | ~> 11.0       |
| **Web3**             | ex_keccak + ex_secp256k1           | ~> 0.7        |
| **OAuth**            | Assent                             | ~> 0.2        |
| **Clustering**       | dns_cluster (Fly.io)               | ~> 0.1        |
| **PubSub**           | Phoenix.PubSub (PG2)              | ~> 2.1        |
| **Circuit Breaker**  | Fuse                               | ~> 2.5        |

**App version:** 1.0.0 (`@version` in mix.exs)
**Total deps:** 62 (direct in mix.exs)

## Architecture

Phoenix context-based DDD with strict separation:

```
lib/cgraph/           ← 57 domain contexts (business logic ONLY)
lib/cgraph_web/       ← Web layer (routers, controllers, channels, plugs)
lib/cgraph/workers/   ← 29 Oban background workers
```

- **Contexts:** Accounts, Messaging, Groups, Forums, Gamification, Creators, Notifications,
  Encryption, AI, Collaboration, WebRTC, Moderation, Search, Subscriptions, OAuth, Cache,
  Security, Permissions, Storage, Shop, and 37 more
- **Controllers:** ~124 files under `controllers/api/v1/` + root + admin levels
- **Channels:** 17 WebSocket channels (conversation, group, user, presence, forum, call, etc.)
- **Plugs:** ~30 middleware (auth, security, rate limiting, tracing, feature gates)
- **Migrations:** 118 Ecto migrations
- **Repos:** `CGraph.Repo` (writes) + `CGraph.ReadRepo` (read replica, falls back to primary)

## Non-Negotiables

**NEVER break these. No exceptions. No "I'll fix it later."**

1. **CGraph.Encryption + CGraph.Crypto** — E2EE pipeline (X3DH, PQXDH, Double/Triple Ratchet).
   Never weaken, bypass, or log plaintext.
2. **Guardian JWT + CGraph.Security** — Token lifecycle, blacklist, key rotation. Never issue
   tokens without proper claims. Never skip blacklist checks.
3. **RateLimiterV2 (sliding window)** — On every public endpoint. Bypass = security hole.
   Tiers: strict (auth), standard (default), relaxed (read-heavy).
4. **AuditLogPlug on all auth + admin routes** — Every auth action and admin operation must have
   an audit trail. No silent mutations.
5. **InputValidation module before any DB write on public endpoints** — Validate and sanitize all
   user input before it touches Ecto. `lib/cgraph_web/api/input_validation/`.
6. **Argon2 for ALL passwords** — No bcrypt, no SHA, no plaintext. `argon2_elixir ~> 4.1` only.
7. **Business logic in contexts, NEVER in controllers** — Controllers delegate to
   `lib/cgraph/<context>/`. Controllers only: parse params → call context → render response.
8. **CGraph.Repo for writes, CGraph.ReadRepo for reads, CGraph.Cache for caching** — Never
   bypass the repo abstraction. Never write to ReadRepo. Never cache without Cache module.

## After Any Endpoint Add/Change

Every time you add, modify, or remove an API endpoint:

1. **Update** `/CGraph/docs/API_CONTRACTS.md` immediately — document the endpoint, params,
   response shape, error codes
2. **Update** `packages/shared-types/src/` if the response shape changed — TypeScript types must
   match backend JSON views
3. **Commit both files in the same commit** as the backend change — never let contracts drift

## Requirements

### Validated

<!-- Shipped and working in the backend codebase at v1.0.0. -->

- ✓ Phoenix context-based DDD with 57 bounded contexts — established
- ✓ JWT auth with Guardian (access/refresh tokens, key rotation, blacklist) — established
- ✓ OAuth via Assent (Google, Apple, Facebook, TikTok) — established
- ✓ SIWE Web3 wallet auth (EIP-4361, nonce, domain binding, chain_id validation) — v1.0
- ✓ TOTP 2FA with backup/recovery codes (nimble_totp) — established
- ✓ Phoenix Channels real-time infrastructure (17 channels) — established
- ✓ E2EE key exchange endpoints (X3DH prekeys, Kyber prekeys) — established
- ✓ Gamification system (XP, achievements, quests, battle pass, shop, marketplace) — established
- ✓ Forums system (boards, threads, posts, polls, categories, RSS, leaderboard) — established
- ✓ Groups/channels with roles, invites, bans, automod, custom emojis — established
- ✓ WebRTC signaling (voice/video call rooms, participant tracking) — established
- ✓ Creator monetization (Stripe Connect Express, paid forums, earnings, payouts) — established
- ✓ Content gating (ContentGate — teaser/full access/free override) — established
- ✓ Stripe webhooks (platform + Connect events, idempotent processing) — established
- ✓ Coin shop (virtual currency bundles, one-time Stripe Checkout) — established
- ✓ Full-text search (Meilisearch integration + PostgreSQL fallback) — established
- ✓ 3-tier caching (L1 ETS → L2 Cachex → L3 Redis, stampede protection) — established
- ✓ Distributed rate limiting (RateLimiterV2, Redis + ETS fallback) — established
- ✓ Background jobs (Oban, 29 workers, orchestrator pipeline) — established
- ✓ Observability (OpenTelemetry, Prometheus, Sentry, slow query reporter) — established
- ✓ Fly.io deployment with DNS clustering (multi-region) — established
- ✓ Data export (GDPR pipeline: processor → formatter → delivery) — established
- ✓ Email system (Swoosh + Oban delivery workers, digest) — established
- ✓ File uploads (Waffle → S3/R2 via ExAws) — established
- ✓ Moderation (reports, appeals, enforcement, automod) — established
- ✓ 118 Ecto migrations, Snowflake IDs, partitioned messages table — established
- ✓ Payout race condition fixed (Repo.transaction + FOR UPDATE row lock) — v1.0
- ✓ Safe error messages in all controllers (inspect leak removed from 30 responses) — v1.0
- ✓ Apple JWS + Google RTDN signature verification in IAP — v1.0
- ✓ Audit logging on all auth + admin routes — v1.0
- ✓ Repo.get! replaced with safe Repo.get + nil handling (11 locations) — v1.0
- ✓ Atomic Earnings.get_balance/1 (single query with subquery) — v1.0
- ✓ Runtime config for CoinBundles (compile-time System.get_env removed) — v1.0
- ✓ Dead code removed (@tier_mapping) — v1.0
- ✓ PgBouncer deployed as app sidecar (transaction pool, 200 connections) — v1.0
- ✓ k6 load test suite (7 scripts: smoke, auth, forums, search, combined) — v1.0
- ✓ Auth p95 latency fixed (Argon2 tuned: t_cost=2, m_cost=15, ~100-150ms) — v1.0
- ✓ Elixir/OTP aligned (Dockerfile 1.19.4/OTP 28.3 matches .tool-versions) — v1.0
- ✓ CRDT document compaction (Oban worker + client-assisted) — v1.0
- ✓ MeiliSearch setup mix task for deployment — v1.0
- ✓ Creator monetization tests (117 tests, 94-100% coverage) — v1.0
- ✓ Backend coverage baseline established (33.8% overall, ExCoveralls) — v1.0
- ✓ Web wired to real APIs (mock data removed) — v1.0
- ✓ Mobile wired to real APIs (facades resolved, stubs replaced) — v1.0

### Active

<!-- v1.0.0 shipped. Remaining work is maintenance and incremental improvements. -->

**Maintenance (P2)**

- [ ] Split oversized controllers (6 controllers > 400 LOC)
- [ ] Split `iap_validator.ex` (542 LOC → separate modules)
- [ ] Move hardcoded plan definitions to config
- [ ] Increase overall test coverage from 33.8% toward 60% target
- [ ] Fix 5 pre-existing test failures (E2EE, Phase12, Payout aggregate, forums_extended)
- [ ] External security audit when budget available ($25K–$120K)

### Out of Scope

<!-- Backend-only boundaries. Revisit after hardening phases complete. -->

- Frontend/web app — managed in separate GSD instance at monorepo root
- Mobile app — managed in separate GSD instance at monorepo root
- Landing page — managed separately
- External security audit — budget not allocated ($25K–$120K), post-hardening
- Database sharding — PostgreSQL handles current scale, shard post-100K users
- GraphQL API — REST + Channels sufficient, adds complexity without value
- Self-hosting — single deployment target (Fly.io)
- AI features (smart replies, summarizer) — not differentiating
- Sealed sender (metadata protection) — complex protocol change, future version
- Custom WebRTC SFU — LiveKit handles this externally

## Context

**Current State (v1.0.0 — shipped 2026-03-05):** Backend is fully built and production-hardened with
789 source files across 57 domain contexts. All major features implemented and wired end-to-end:
auth, messaging, groups, forums, gamification, creator monetization, E2EE key exchange, real-time
channels, search, payments, and voice/video signaling. Security hardening complete — payout race
conditions fixed, error leaks patched, IAP signatures verified, auth latency optimized.

**Codebase Health:** 993 files (789 lib + 198 test + 6 config), 173,868 LOC Elixir. 118 Ecto
migrations. 2,372 tests passing (5 pre-existing failures, 8 skipped). 33.8% overall coverage,
94–100% on revenue-critical modules.

**Known Issues (minor):**

- `payout.ex:40` FOR UPDATE + aggregate PostgreSQL bug (test skipped)
- 5 pre-existing test failures in full suite (E2EE, Phase12, Payout, forums_extended)
- Route shadowing: Forum resources route shadows Creator subscribe endpoint
- Overall test coverage at 33.8% (below 60% target, revenue modules well-covered)
- 6 controllers exceed 400 LOC (refactor candidates)

**Known Working:**

- Backend compiles, starts, and serves all 613 routes
- 198 test files, 2,372 tests passing
- Database schema fully migrated (118 migrations)
- Fly.io deployment operational with DNS clustering + PgBouncer sidecar
- Stripe integration (platform subscriptions + Connect + webhooks) functional
- All 17 Phoenix Channels operational
- Oban workers processing jobs (29 workers + orchestrator)
- Caching (3-tier), rate limiting (RateLimiterV2), and telemetry active
- Argon2 auth tuned to p95 ~100-150ms
- Dockerfile aligned: Elixir 1.19.4/OTP 28.3
- k6 load test suite ready (7 scripts)
- MeiliSearch setup task available (`mix search.setup`)
- CRDT document compaction (Oban worker + client-assisted)

**Test Coverage:** 198 test files, 2,372 tests. ExCoveralls configured. 33.8% overall, 94–100% on
revenue-critical paths (earnings, payouts, subscriptions, IAP, webhooks).

## Constraints

- **Tech stack:** Elixir ~> 1.19, Phoenix ~> 1.8.3, Bandit ~> 1.10 — no framework migrations
- **Data layer:** PostgreSQL via Ecto, Redis via Redix — no ORM changes
- **Auth:** Guardian JWT + Argon2 + SIWE + TOTP — no auth library swaps
- **Deployment:** Fly.io with DNS clustering — no multi-cloud
- **Scope:** Backend only (`apps/backend/`) — frontend/mobile changes are out of scope
- **Monorepo:** Lives in `/CGraph/apps/backend/` — husky pre-commit hooks at root require
  `--no-verify` for backend-only commits
- **Scale:** Must support 10,000+ concurrent WebSocket connections
- **Quality:** No shortcuts on security — every fix must maintain the non-negotiables above

## Key Decisions

| Decision                                  | Rationale                                                                              | Outcome       |
| ----------------------------------------- | -------------------------------------------------------------------------------------- | ------------- |
| Context-based DDD (57 contexts)           | Clean domain boundaries, each context owns its schemas/queries/logic                   | ✓ Established |
| Guardian + JOSE over raw JWT              | Family tracking, rotation, theft detection not possible with plain JWT                 | ✓ Established |
| RateLimiterV2 (sliding window)            | More accurate than fixed window; tiered limits per pipeline                             | ✓ Established |
| Cachex temp tokens for 2FA login          | Stateless JWT can't hold pending 2FA state; Cachex TTL auto-expires                    | ✓ Established |
| 3-tier cache (ETS → Cachex → Redis)       | L1 microsecond, L2 millisecond, L3 distributed — stampede protection at each tier      | ✓ Established |
| Snowflake IDs for messages                | Ordering guarantee + timestamp extraction; random UIDs for users (privacy)              | ✓ Established |
| Oban for all background work              | Persistent jobs, retries, dead letter, cron — consistent pattern via orchestrator       | ✓ Established |
| Bandit over Cowboy                        | Pure Elixir HTTP2/WS server, simpler supervision, better telemetry                     | ✓ Established |
| Stripe Connect Express for creators       | Funds flow directly to connected accounts; 15% application_fee_percent                  | ✓ Established |
| Partitioned messages table                | Horizontal scaling for message volume; migration `20260213000001`                       | ✓ Established |
| ReadRepo with primary fallback            | Read replica reduces primary load; graceful fallback if replica unavailable             | ✓ Established |
| Post-v1.0 hardening approach              | v1.0 features complete; focus on security, quality, coverage before scaling             | ✓ Complete    |
| PgBouncer as app sidecar (not separate process) | Fly.io runs each `[processes]` entry on separate machines; sidecar pattern matches Alloy | ✓ Established |
| Argon2 tuning (t_cost=2, m_cost=15)       | Default params caused 300-400ms latency; tuned to ~100-150ms while maintaining security | ✓ Established |
| Client-assisted CRDT compaction           | Server-side Yjs merge requires NIF; Oban worker + client PubSub is pragmatic alternative | ✓ Established |
| Postgres-native webhook idempotency       | Unique constraint + ON CONFLICT :nothing — simpler than Redis distributed locks         | ✓ Established |
| Session tokens hashed before storage      | Raw tokens never persisted; `create_session` returns 3-tuple with separate client token | ✓ Established |
| OAuth bypasses 2FA by design              | OAuth providers already verify identity; 2FA gate only for password-based login         | ✓ Established |
| Orchestrator.enqueue for all emails       | Oban retry/dedup beats direct Mailer call; consistent async delivery                   | ✓ Established |
| Soft-delete preserves message row         | `deleted_at` + placeholder; never hard-delete for audit trail integrity                | ✓ Established |
| Edit history via Ecto.Multi               | MessageEdit record alongside message update in single transaction                      | ✓ Established |
| Session revocation cascades to tokens     | Without bridge, revoking session leaves JWT valid until expiry                          | ✓ Established |

## Reference

| Document                        | Location                         | Purpose                             |
| ------------------------------- | -------------------------------- | ----------------------------------- |
| **Codebase map**                | `.gsd/codebase/` (7 files)       | ARCHITECTURE, STRUCTURE, STACK, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS |
| **Requirements**                | `.gsd/REQUIREMENTS.md`           | 98 v1 requirements across 13 categories |
| **Roadmap**                     | `.gsd/ROADMAP.md`                | Post-v1.0 hardening phases          |
| **API Contracts**               | `/CGraph/docs/API_CONTRACTS.md`  | Endpoint documentation              |
| **Shared Types**                | `packages/shared-types/src/`     | TypeScript types matching JSON views |

---

_Last updated: 2026-03-05 after v1.0.0 milestone — all 25 phases shipped_
