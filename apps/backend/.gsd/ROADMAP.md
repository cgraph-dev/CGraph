# CGraph Roadmap — v1.1 Chat Superpowers

> Generated: 2026-03-04 | Updated: current | Phases: 7 | Scope: Backend (v1.1 milestone)
>
> v1.0.0 shipped (Phases 1–25). Phase 26 adds chat superpowers: secret chat, stickers, E2EE
> hardening, file transfer, voice/video call fixes, emoji 2026, chat completeness, Triple Ratchet
> integration, competitive features, and integration testing.

---

## Phase Overview

| #   | Phase                 | Goal                                                                                                                | Tasks | Plans | Status      |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------- | ----- | ----- | ----------- |
| 20  | Backend Safety Net    | Fix all P0 security + crash bugs in backend APIs                                                                    | 10    | 2     | ✅ Complete |
| 21  | Web Wiring            | Replace all mock data with real API calls in web app                                                                | 8     | 2     | ✅ Complete |
| 22  | Mobile Wiring         | Wire mobile stubs, facades, mocks to real stores/APIs                                                               | 12    | 3     | ✅ Complete |
| 23  | Creator & Payments    | End-to-end creator monetization + coin shop + IAP                                                                   | 8     | 2     | ✅ Complete |
| 24  | Test Coverage         | Ship safety net — catch regressions in revenue-critical and security-critical paths                                 | 5     | 1     | ✅ Complete |
| 25  | Infrastructure & Perf | Production-ready infrastructure for real user traffic                                                               | 6     | 1     | ✅ Complete |
| 26  | Chat Superpowers      | Complete DM experience: secret chat, stickers, E2EE Triple Ratchet, file transfer, calls, emojis, polls, scheduling | 20    | 10    | 🔄 Active   |

> **Total**: ~69 tasks across 7 phases, 21 plan files

---

## Phase 20 — Backend Safety Net ✅

**Goal**: Fix every issue that would cause 500 errors, data loss, or security breaches when real
users hit the APIs. No frontend work — pure backend hardening.

**Plan 20-01: Security Critical Fixes** ✅

- [x] Fix payout race condition with `Repo.transaction` + `FOR UPDATE` row lock
- [x] Verify Apple JWS signatures in IAP flow (`iap_controller.ex`)
- [x] Verify Google RTDN Pub/Sub auth tokens (`iap_controller.ex`)
- [x] Validate SIWE `chain_id` parameter (`wallet_authentication.ex`)
- [x] Complete audit logging for security-sensitive operations

**Plan 20-02: API Crash & Quality Fixes** ✅

- [x] Replace `inspect(reason)` with safe error messages in 14 controllers (30 replacements)
- [x] Replace `Repo.get!` with `Repo.get` + error tuple in 11 locations
- [x] Make `Earnings.get_balance/1` atomic (single query with subquery)
- [x] Fix compile-time `System.get_env` in `CoinBundles` → runtime config
- [x] Remove dead `@tier_mapping` code from `stripe_webhook_controller.ex`

---

## Phase 21 — Web Wiring ✅

**Goal**: Every web page displays real data from backend APIs. No mock constants, no hardcoded
fallbacks, no TODO comments.

**Plan 21-01: Customization Pages + Forum Admin** ✅

- [x] Wire Progression Customization (achievements, leaderboard, quests, daily rewards) →
      gamification API
- [x] Wire Identity Customization (borders, titles, badges) → cosmetics API
- [x] Wire Theme Customization → themes API
- [x] Wire Forum Admin analytics → `/api/v1/forums/:id/analytics`
- [x] Wire Forum Admin rules → `/api/v1/forums/:id/automod/rules`
- [x] Wire Forum Admin mod queue → `/api/v1/moderation/reports`

**Plan 21-02: Admin Dashboard + Error States** ✅

- [x] Remove `adminStore.mockData.ts` fallback — show "unavailable" on error
- [x] Audit all remaining `MOCK_` constants across web codebase and replace

---

## Phase 22 — Mobile Wiring ✅

**Goal**: Every mobile screen uses real data, every facade resolves to a real store, every hook has
a working implementation.

**Plan 22-01: Screen Mock Data Replacement** ✅

- [x] Wire Notifications Inbox → `useNotificationStore` → `GET /api/v1/notifications`
- [x] Wire User Wall → user wall API → `GET /api/v1/users/:id/wall`
- [x] Remove mock forum fallback — show error state on API failure
- [x] Fix `currentUserId = 'current-user'` in Call History → `useAuthStore().user.id`

**Plan 22-02: Store Facades & Hooks** ✅

- [x] Wire `useCommunityFacade().forums` → `forumStore.forums`
- [x] Wire `useMarketplaceFacade().balance` → `gamificationStore.coins`
- [x] Wire `useUIFacade()` methods to UI state management (or remove mobile-irrelevant ones)
- [x] Implement `useVoiceRecording()` with `expo-audio` Audio API
- [x] Create `VoiceMessageRecorder` component export
- [x] Create `features/forums/hooks/` directory with forum-specific hooks

**Plan 22-03: Protocol & Infrastructure** ✅

- [x] Implement X3DH DH4 (one-time prekey computation) for full forward secrecy
- [x] Expand WatermelonDB message sender stub (cache sender profile data)

---

## Phase 23 — Creator & Payments End-to-End ✅

**Goal**: Creator monetization, coin shop, and IAP work end-to-end from UI to database for both web
and mobile.

**Plan 23-01: Creator Monetization Service Layer** ✅

- [x] Create web `creatorService.ts` (onboard, status, subscribe, balance, payout, analytics)
- [x] Create web creator store module with hooks
- [x] Wire Creator Dashboard pages to real API
- [x] Create mobile creator service (matching web)

**Plan 23-02: Coin Shop & IAP** ✅

- [x] Create web `coinShopService.ts` (bundles, checkout)
- [x] Wire web gamification shop page to coin shop API
- [x] Wire mobile marketplace to coin shop API (IAP service exists, needs coin shop integration)
- [x] Create AI service layer for web + mobile (summarize, smart replies, moderate)

---

## Phase 24 — Test Coverage ✅

**Goal**: Ship safety net — catch regressions in revenue-critical and security-critical paths.

**Plan 24-01: Critical Path Tests** ✅

- [x] Write Creator monetization tests (earnings, payouts, paid subscriptions — 56 tests)
- [x] Write Creator controller + analytics controller tests (35 tests)
- [x] Write webhook handler downstream function tests (11 tests)
- [x] Write IAP controller tests (15 tests)
- [x] Establish backend coverage baseline (33.8% overall, 94–100% on revenue modules)

---

## Phase 25 — Infrastructure & Performance ✅

**Goal**: Production-ready infrastructure for real user traffic at scale.

**Plan 25-01: Production Readiness** ✅

- [x] Deploy PgBouncer as sidecar in app process (merged into start-with-app.sh)
- [x] Add MeiliSearch setup mix task + deployment documentation
- [x] Create k6 load test scripts (7 scripts: smoke, auth, forums, search, combined)
- [x] Fix auth p95 latency (Argon2 tuned: t_cost=2, m_cost=15 → ~100-150ms)
- [x] Align Elixir version — Dockerfile 1.19.4/OTP 28.3 matches .tool-versions
- [x] Implement CRDT document compaction (Oban worker + client-assisted)

---

## Dependency Graph

```
Phase 20 (Backend Safety) ✅ COMPLETE
  ├─→ Phase 21 (Web Wiring)      ✅ COMPLETE
  ├─→ Phase 22 (Mobile Wiring)   ✅ COMPLETE
  └─→ Phase 23 (Creator/Pay)     ✅ COMPLETE
        └─→ Phase 24 (Tests)     ✅ COMPLETE
              └─→ Phase 25 (Infra) ✅ COMPLETE
                    └─→ Phase 26 (Chat Superpowers) 🔄 ACTIVE

Phase 26 Internal Waves:
  Wave 1: 26-01 (Secret Chat), 26-02 (Stickers) [parallel]
  Wave 2: 26-03 (E2EE Hardening), 26-04 (File Transfer) [parallel]
  Wave 3: 26-05 (Voice/Video Calls), 26-06 (Emoji 2026) [parallel]
  Wave 4: 26-07 (Chat Completeness), 26-08 (DM E2EE Wiring) [parallel]
  Wave 5: 26-09 (Competitive Features), 26-10 (Integration Tests) [parallel]
```

**25/26 PHASES COMPLETE** — Phase 26 active.

---

## Phase 26 — Chat Superpowers 🔄

**Goal**: Ship the complete direct messaging experience — secret chats more secure than Telegram,
sticker store, robust E2EE with Triple Ratchet, chunked file transfer, voice/video call fixes,
Unicode 16.0 emojis, and competitive edge features (polls, scheduling, themes, translation).

Plans:

- [ ] 26-01-PLAN.md — Secret Chat Infrastructure (DB + API + Channel)
- [ ] 26-02-PLAN.md — Sticker System (store, packs, download, send)
- [ ] 26-03-PLAN.md — E2EE Hardening & Triple Ratchet (session tracking, ratchet state, safety
      numbers)
- [ ] 26-04-PLAN.md — File Transfer System (chunked upload, download tokens, tier quotas)
- [ ] 26-05-PLAN.md — Voice & Video Call Fixes (state machine, quality metrics, push notifications)
- [ ] 26-06-PLAN.md — Emoji 2026 Expansion (Unicode 16.0, search, skin tones)
- [ ] 26-07-PLAN.md — Chat Feature Completeness (edit, delete, reply, forward, typing, link preview,
      receipts)
- [ ] 26-08-PLAN.md — DM E2EE Integration (bootstrap, pre-key bundles, ratchet header forwarding)
- [ ] 26-09-PLAN.md — Competitive Edge Features (scheduling, polls, themes, translation)
- [ ] 26-10-PLAN.md — Integration Testing & Regression Fix

---

## Reference

- **Discovery analysis**: `.gsd/DISCOVERY.md` (full gap inventory)
- **Codebase docs**: `.gsd/codebase/` (7 files, 6,384 lines)
- **Detailed concerns**: `.gsd/codebase/CONCERNS.md` (48 action items, score 7.3/10)
- **Prior roadmap**: Phases 1–19 completed (v0.9.47 → v1.0.0), archived in `.gsd/phases/`

---

_Last updated: current — Phase 26 active (Chat Superpowers)_
