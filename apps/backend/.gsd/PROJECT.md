# CGraph Backend

## What This Is

CGraph Backend is the Elixir/Phoenix API server powering a secure real-time messaging and community
platform. It provides REST JSON APIs, Phoenix Channels (WebSocket) for real-time, and background job
processing for an E2EE messaging app with gamification, forums, groups, and creator monetization.
Backend only — frontend, landing, and mobile are managed separately.

## Core Value

**Every API request is authenticated, rate-limited, validated, and auditable** — if the security
pipeline breaks, the entire platform is compromised.

## Stack

| Component           | Technology                         | Version       |
| ------------------- | ---------------------------------- | ------------- |
| **Language**         | Elixir                             | ~> 1.17       |
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
- ✓ SIWE Web3 wallet auth (EIP-4361, nonce, domain binding, signature recovery) — established
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

### Active

<!-- Current focus: post-v1.0 backend hardening. See ROADMAP.md for phase details. -->

**Security Hardening (P0)**

- [ ] Fix payout race condition — wrap in `Repo.transaction` + `FOR UPDATE` row lock
- [ ] Remove `inspect(reason)` from 25+ controller error responses (information leak)
- [ ] Verify Apple JWS signatures in IAP flow
- [ ] Verify Google RTDN Pub/Sub auth tokens
- [ ] Validate SIWE `chain_id` against allowed chains
- [ ] Complete audit logging coverage on all auth + admin routes

**API Quality (P1)**

- [ ] Replace `Repo.get!` with `Repo.get` + error tuple in 3 user-input locations
- [ ] Make `Earnings.get_balance/1` atomic (race condition on concurrent reads)
- [ ] Fix compile-time `System.get_env` in CoinBundles (move to runtime config)
- [ ] Remove dead code (`@tier_mapping` module attribute)
- [ ] Move hardcoded plan definitions to config
- [ ] Split oversized controllers (6 controllers > 400 LOC)
- [ ] Split `iap_validator.ex` (542 LOC → separate modules)

**Performance & Scaling (P1)**

- [ ] Run k6 load tests against staging (scripts exist in `infrastructure/load-tests/`)
- [ ] Deploy PgBouncer (config exists in `pgbouncer/`)
- [ ] Activate Meilisearch in production
- [ ] Fix auth p95 latency (383ms vs 300ms SLO target)
- [ ] Implement CRDT state compaction for collaborative editing
- [ ] Fix Elixir version mismatch (Dockerfile 1.17.3 vs local 1.19.4)

**Test Coverage (P1)**

- [ ] Write Creator monetization tests (9 source files + 1 controller, zero tests)
- [ ] Expand Stripe webhook tests (currently 4 tests, signature verification only)
- [ ] Establish backend coverage baseline (`mix coveralls`)
- [ ] Add IAP credential startup validation

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

**Current State (v1.0.0):** Backend is fully built with 786 source files across 57 domain contexts.
All major features are implemented: auth, messaging, groups, forums, gamification, creator
monetization, E2EE key exchange, real-time channels, search, and payments. The focus now is
hardening — fixing security issues, improving API quality, expanding test coverage, and optimizing
performance.

**Codebase Health:** Score 7.3/10 (from CONCERNS.md audit). 48 action items identified — primarily
security fixes (P0), API quality improvements (P1), and test coverage gaps (P1).

**Known Issues:**

- Payout race condition (no row locking on concurrent withdrawal requests)
- 25+ controllers leak error details via `inspect(reason)` in API responses
- IAP validator doesn't verify Apple JWS or Google RTDN signatures
- SIWE doesn't validate `chain_id`
- 3 `Repo.get!` calls with user-controlled params (500 on invalid ID)
- `Earnings.get_balance/1` isn't atomic
- Creator monetization has zero test coverage (9 source files)
- Stripe webhook tests cover signature only (4 tests)
- Auth p95 latency 383ms (SLO target 300ms)
- Dockerfile uses Elixir 1.17.3, local dev uses 1.19.4

**Known Working:**

- Backend compiles, starts, and serves all routes
- 191 test files passing
- Database schema fully migrated (118 migrations)
- Fly.io deployment operational with DNS clustering
- Stripe integration (platform subscriptions + Connect) functional
- All 17 Phoenix Channels operational
- Oban workers processing jobs
- Caching, rate limiting, and telemetry active

**Test Coverage:** 191 test files. ExCoveralls configured but baseline not yet established. Creator
monetization and Stripe webhook flows are the biggest coverage gaps.

## Constraints

- **Tech stack:** Elixir ~> 1.17, Phoenix ~> 1.8.3, Bandit ~> 1.10 — no framework migrations
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
| Post-v1.0 hardening approach              | v1.0 features complete; focus on security, quality, coverage before scaling             | — Active      |
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

_Last updated: 2026-03-04 — `/gsd:new-project` backend-only scope from v1.0.0 codebase_

_Last updated: 2026-02-28 after Phase 6 (Message Features & Sync)_
