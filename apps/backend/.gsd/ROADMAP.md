# CGraph Backend Roadmap — Post-v1.0 Hardening

> Generated: 2026-03-04 | Phases: TBD | Scope: Backend only (`apps/backend/`)
>
> This roadmap focuses on backend hardening after v1.0.0 release: security fixes, performance
> optimization, API quality improvements, and test coverage. Frontend/mobile work is managed in a
> separate GSD instance at the monorepo root.

---

## Phase Overview

| # | Phase | Goal | Reqs | Status |
|---|-------|------|------|--------|
| — | — | — | — | Awaiting planning |

> Run `/gsd:discovery-phase` to analyze active requirements from PROJECT.md and plan phases.

---

## Active Requirements (from PROJECT.md)

### Security Hardening (P0)

- Fix payout race condition (Repo.transaction + FOR UPDATE)
- Remove `inspect(reason)` from 25+ controller API errors
- Verify Apple JWS signatures in IAP flow
- Verify Google RTDN Pub/Sub auth tokens
- Validate SIWE chain_id
- Complete audit logging

### API Quality (P1)

- Fix `Repo.get!` with user-controlled params (3 locations)
- Make `Earnings.get_balance/1` atomic
- Fix compile-time `System.get_env` in CoinBundles
- Remove dead code (`@tier_mapping`)
- Move hardcoded plan definitions to config
- Split oversized controllers (6 controllers > 400 LOC)
- Split `iap_validator.ex` (542 LOC)

### Performance & Scaling (P1)

- Run load tests against staging (k6 scripts ready)
- Deploy PgBouncer (config exists)
- Activate MeiliSearch in production
- Fix auth p95 latency (383ms vs 300ms SLO)
- Implement CRDT state compaction
- Fix Elixir version mismatch (Dockerfile 1.17.3 vs local 1.19.4)

### Test Coverage (P1)

- Write Creator monetization tests (9 files + 1 controller, zero tests)
- Expand Stripe webhook tests (4 tests, signature only)
- Establish backend coverage baseline (`mix coveralls`)
- Add IAP credential startup validation

---

## Reference

- **Codebase docs:** `.gsd/codebase/` (7 files, 6,384 lines)
- **Detailed concerns:** `.gsd/codebase/CONCERNS.md` (48 action items, score 7.3/10)
- **Prior roadmap:** 19 phases completed (v0.9.47 → v1.0.0), archived in git history

---

_Last updated: 2026-03-04 — project initialization_
