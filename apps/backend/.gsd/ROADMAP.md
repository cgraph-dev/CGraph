# CGraph Roadmap — Full-Stack Wiring to 100% Deployment

> Generated: 2026-03-04 | Phases: 6 | Scope: Full monorepo (backend + web + mobile)
>
> Every backend API, frontend page, and mobile screen has been built. This roadmap wires them
> together so every feature actually works for real users. See DISCOVERY.md for the full gap
> analysis that produced these phases.

---

## Phase Overview

| # | Phase | Goal | Tasks | Plans | Status |
|---|-------|------|-------|-------|--------|
| 20 | Backend Safety Net | Fix all P0 security + crash bugs in backend APIs | 10 | 2 | Not started |
| 21 | Web Wiring | Replace all mock data with real API calls in web app | 8 | 2 | Not started |
| 22 | Mobile Wiring | Wire mobile stubs, facades, mocks to real stores/APIs | 12 | 3 | Not started |
| 23 | Creator & Payments | End-to-end creator monetization + coin shop + IAP | 8 | 2 | Not started |
| 24 | Test Coverage | Creator tests, webhook tests, coverage baseline | 5 | 1 | Not started |
| 25 | Infrastructure & Perf | PgBouncer, MeiliSearch, load tests, version sync | 6 | 1 | Not started |

> **Total**: ~49 tasks across 6 phases, 11 plan files

---

## Phase 20 — Backend Safety Net

**Goal**: Fix every issue that would cause 500 errors, data loss, or security breaches when real
users hit the APIs. No frontend work — pure backend hardening.

**Plan 20-01: Security Critical Fixes**
- [ ] Fix payout race condition with `Repo.transaction` + `FOR UPDATE` row lock
- [ ] Verify Apple JWS signatures in IAP flow (`iap_controller.ex`)
- [ ] Verify Google RTDN Pub/Sub auth tokens (`iap_controller.ex`)
- [ ] Validate SIWE `chain_id` parameter (`wallet_authentication.ex`)
- [ ] Complete audit logging for security-sensitive operations

**Plan 20-02: API Crash & Quality Fixes**
- [ ] Replace `inspect(reason)` with safe error messages in 25+ controllers
- [ ] Replace `Repo.get!` with `Repo.get` + error tuple in 3 locations
- [ ] Make `Earnings.get_balance/1` atomic (single query, no read-then-write)
- [ ] Fix compile-time `System.get_env` in `CoinBundles` → runtime config
- [ ] Remove dead `@tier_mapping` code from `stripe_webhook_controller.ex`

---

## Phase 21 — Web Wiring

**Goal**: Every web page displays real data from backend APIs. No mock constants, no hardcoded
fallbacks, no TODO comments.

**Plan 21-01: Customization Pages + Forum Admin**
- [ ] Wire Progression Customization (achievements, leaderboard, quests, daily rewards) → gamification API
- [ ] Wire Identity Customization (borders, titles, badges) → cosmetics API
- [ ] Wire Theme Customization → themes API
- [ ] Wire Forum Admin analytics → `/api/v1/forums/:id/analytics`
- [ ] Wire Forum Admin rules → `/api/v1/forums/:id/automod/rules`
- [ ] Wire Forum Admin mod queue → `/api/v1/moderation/reports`

**Plan 21-02: Admin Dashboard + Error States**
- [ ] Remove `adminStore.mockData.ts` fallback — show "unavailable" on error
- [ ] Audit all remaining `MOCK_` constants across web codebase and replace

---

## Phase 22 — Mobile Wiring

**Goal**: Every mobile screen uses real data, every facade resolves to a real store, every hook
has a working implementation.

**Plan 22-01: Screen Mock Data Replacement**
- [ ] Wire Notifications Inbox → `useNotificationStore` → `GET /api/v1/notifications`
- [ ] Wire User Wall → user wall API → `GET /api/v1/users/:id/wall`
- [ ] Remove mock forum fallback — show error state on API failure
- [ ] Fix `currentUserId = 'current-user'` in Call History → `useAuthStore().user.id`

**Plan 22-02: Store Facades & Hooks**
- [ ] Wire `useCommunityFacade().forums` → `forumStore.forums`
- [ ] Wire `useMarketplaceFacade().balance` → `gamificationStore.coins`
- [ ] Wire `useUIFacade()` methods to UI state management (or remove mobile-irrelevant ones)
- [ ] Implement `useVoiceRecording()` with `expo-av` Audio API
- [ ] Create `VoiceMessageRecorder` component
- [ ] Create `features/forums/hooks/` directory with forum-specific hooks

**Plan 22-03: Protocol & Infrastructure**
- [ ] Implement X3DH DH4 (one-time prekey computation) for full forward secrecy
- [ ] Expand WatermelonDB message sender stub (cache sender profile data)

---

## Phase 23 — Creator & Payments End-to-End

**Goal**: Creator monetization, coin shop, and IAP work end-to-end from UI to database for both
web and mobile.

**Plan 23-01: Creator Monetization Service Layer**
- [ ] Create web `creatorService.ts` (onboard, status, subscribe, balance, payout, analytics)
- [ ] Create web creator store module with hooks
- [ ] Wire Creator Dashboard pages to real API
- [ ] Create mobile creator service (matching web)

**Plan 23-02: Coin Shop & IAP**
- [ ] Create web `coinShopService.ts` (bundles, checkout)
- [ ] Wire web gamification shop page to coin shop API
- [ ] Wire mobile marketplace to coin shop API (IAP service exists, needs coin shop integration)
- [ ] Create AI service layer for web + mobile (summarize, smart replies, moderate)

---

## Phase 24 — Test Coverage

**Goal**: Ship safety net — catch regressions in revenue-critical and security-critical paths.

**Plan 24-01: Critical Path Tests**
- [ ] Write Creator monetization tests (9 files + 1 controller, zero tests currently)
- [ ] Expand Stripe webhook tests beyond signature verification
- [ ] Add IAP credential startup validation tests
- [ ] Establish backend coverage baseline with `mix coveralls`
- [ ] Wire test coverage to CI (coveralls.json already exists)

---

## Phase 25 — Infrastructure & Performance

**Goal**: Production-ready infrastructure for real user traffic at scale.

**Plan 25-01: Production Readiness**
- [ ] Deploy PgBouncer (config exists at `pgbouncer/pgbouncer.ini`)
- [ ] Activate MeiliSearch in production search pipeline
- [ ] Run k6 load tests against staging
- [ ] Fix auth p95 latency (383ms → <300ms SLO)
- [ ] Align Elixir version — Dockerfile 1.17.3 to match dev 1.19.4
- [ ] Implement CRDT state compaction for group sync

---

## Dependency Graph

```
Phase 20 (Backend Safety)
  ├─→ Phase 21 (Web Wiring)      ←─ needs safe APIs
  ├─→ Phase 22 (Mobile Wiring)   ←─ needs safe APIs
  └─→ Phase 23 (Creator/Pay)     ←─ needs payout race fix
        └─→ Phase 24 (Tests)     ←─ needs features to exist
              └─→ Phase 25 (Infra) ←─ needs stable baseline
```

Phases 21 and 22 can run in parallel after Phase 20.

---

## Reference

- **Discovery analysis**: `.gsd/DISCOVERY.md` (full gap inventory)
- **Codebase docs**: `.gsd/codebase/` (7 files, 6,384 lines)
- **Detailed concerns**: `.gsd/codebase/CONCERNS.md` (48 action items, score 7.3/10)
- **Prior roadmap**: Phases 1–19 completed (v0.9.47 → v1.0.0), archived in `.gsd/phases/`

---

_Last updated: 2026-03-04 — phases 20–25 planned from DISCOVERY.md analysis_
