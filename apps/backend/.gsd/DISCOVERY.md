# CGraph — Full-Stack Wiring Discovery

> **Generated**: 2026-03-04 | **Scope**: Wire all built features end-to-end across backend, web,
> and mobile so every feature reaches users | **Goal**: 100% deployment status

---

## Executive Summary

CGraph v1.0.0 has **all backend APIs built** (786 source files, 57 contexts, 126 API controllers)
and **all frontend UI built** (web pages + mobile screens for every feature). However, dozens of
features are **not wired end-to-end** — frontend pages use mock/hardcoded data instead of calling
real backend APIs, store facades return empty values, hooks are stubs, and critical security issues
in the backend would break features in production. The project is ~75% wired; completing the
remaining ~25% requires 6 phases of systematic work.

---

## 1. Backend Security Blockers (Must Fix Before Users Hit These APIs)

These aren't "nice-to-have" — they will cause **500 errors, data loss, or security breaches** when
real users interact with the features.

| # | Issue | Impact | Location |
|---|-------|--------|----------|
| B1 | **Payout race condition** — no transaction/row lock on `request_payout/1` | Double payouts (real money loss) | `lib/cgraph/creators/payout.ex` |
| B2 | **`inspect(reason)` in 25+ controllers** — leaks Stripe errors, Ecto internals to users | Information disclosure + ugly UX | Codebase-wide (see CONCERNS.md §4.0.3) |
| B3 | **Apple JWS not verified** in IAP flow | Attacker can forge free premium | `lib/cgraph_web/controllers/iap_controller.ex` |
| B4 | **Google RTDN token not verified** | Attacker can forge subscription events | `lib/cgraph_web/controllers/iap_controller.ex` |
| B5 | **SIWE chain_id not validated** | Cross-chain replay attack | `lib/cgraph/accounts/wallet_authentication.ex` |
| B6 | **`Repo.get!` with user input** (3 locations) | 500 on invalid IDs | `paid_subscription.ex:36`, `creator_controller.ex:111`, `coin_checkout.ex:143` |
| B7 | **`System.get_env` at compile time** in CoinBundles | All Stripe price IDs = nil in Docker | `lib/cgraph/shop/coin_bundles.ex` |
| B8 | **`Earnings.get_balance/1` not atomic** | Inconsistent balance under concurrency | `lib/cgraph/creators/earnings.ex` |
| B9 | **Empty `@tier_mapping`** — dead code | Lookups fall through silently | `stripe_webhook_controller.ex` |
| B10 | **Hardcoded billing plans** in controller | Can't change pricing without deploy | `payment_controller.ex` |

---

## 2. Web App — Pages Using Mock Data Instead of Backend APIs

These pages render correctly but display **hardcoded/fake data**. The backend APIs exist for all of
them. They need service functions + store integration + API calls replacing mock imports.

### 2.1 Customization Pages (Gamification UI)

| Page | Mock Data Source | Backend API Available | Gap |
|------|-----------------|----------------------|-----|
| **Progression Customization** | `MOCK_ACHIEVEMENTS`, `MOCK_LEADERBOARD`, `MOCK_QUESTS`, `MOCK_DAILY_REWARDS` in `mock-data.ts` | `GET /api/v1/achievements`, `GET /api/v1/leaderboard`, `GET /api/v1/quests`, `GET /api/v1/daily-rewards` | Replace mock imports with API calls via gamification store/hooks |
| **Identity Customization** | `MOCK_BORDERS`, `MOCK_TITLES`, `MOCK_BADGES` in `constants.ts` | `GET /api/v1/cosmetics/borders`, `GET /api/v1/cosmetics/titles`, `GET /api/v1/cosmetics/badges` | Wire to gamification cosmetics API |
| **Theme Customization** | `MOCK_THEMES` in `constants.ts` | `GET /api/v1/themes` | Wire to themes API |

### 2.2 Forum Admin Dashboard

| Feature | Current State | Backend API | Gap |
|---------|--------------|-------------|-----|
| **Analytics** | `// Mock analytics data` (hardcoded in `useForumAdminInit.ts`) | `GET /api/v1/forums/:id/analytics` | Wire to real analytics endpoint |
| **Rules** | `// Mock rules` (hardcoded) | `GET /api/v1/forums/:id/automod/rules` | Wire to automod API |
| **Mod Queue** | `// Mock mod queue` (hardcoded) | `GET /api/v1/moderation/reports` | Wire to moderation API |
| **Members** | `// Mock members` (hardcoded) | `GET /api/v1/forums/:id/members` | Wire to forum members API |

### 2.3 Admin Dashboard

| Feature | Current State | Gap |
|---------|--------------|-----|
| **Stats fallback** | `adminStore.mockData.ts` — hardcoded stats (12847 users, revenue $2847.50, etc.) used when API calls fail | Ensure error states show "unavailable" instead of fake numbers |

### 2.4 Creator Dashboard (No Web Service Layer)

The web app has a `pages/creator/` directory but **no API service layer** for creator endpoints:

- No `creatorService.ts` or equivalent
- Backend has full creator API: onboard, status, update monetization, subscribe, balance, payout
- No web store module for creator state

---

## 3. Mobile App — Stub Features & Mock Data

### 3.1 Screens Using Entirely Mock Data

| Screen | Current State | Backend API | Gap |
|--------|--------------|-------------|-----|
| **Notifications Inbox** | `getMockNotifications()` with fake `setTimeout` delay; `useNotificationStore` exists but isn't used | `GET /api/v1/notifications` | Wire screen to notification store → API |
| **User Wall** | `MOCK_POSTS` hardcoded array; zero API calls | `GET /api/v1/users/:id/wall` | Wire to user profile/wall API |
| **Forum List** (error fallback) | Falls back to `getMockForums()` on any API error | `GET /api/v1/forums` | Remove mock fallback, show error state instead |

### 3.2 Store Facade Stubs

| Facade | Field | Current Value | Should Be |
|--------|-------|--------------|-----------|
| `useCommunityFacade()` | `forums` | `[] as unknown[]` | `forumStore.forums` (store exists, just not wired) |
| `useMarketplaceFacade()` | `balance` | Hardcoded `0` | `gamificationStore.coins` (store exists) |
| `useUIFacade()` | `isSidebarOpen` | Hardcoded `false` | Wire to UI store (or remove for mobile) |
| `useUIFacade()` | `setSidebarOpen/activeModal/showModal/hideModal` | No-ops `() => {}` | Wire to UI state management |

### 3.3 Stub Hooks

| Hook | File | Current State | Fix |
|------|------|--------------|-----|
| `useVoiceRecording()` | `features/messaging/hooks/index.ts` | Returns `{ isRecording: false, duration: 0, start: async () => {}, stop: async () => null }` | Implement with `expo-av` Audio recording API |
| `VoiceMessageRecorder` component | `features/messaging/components/index.ts` | Export commented out: `// TODO: Create when needed` | Create component using `useVoiceRecording()` hook |

### 3.4 Hardcoded Values

| Screen | Issue | Fix |
|--------|-------|-----|
| **Call History** | `currentUserId = 'current-user'` hardcoded | Read from `useAuthStore().user.id` |
| **Voice Call** | Audio levels are `Math.random()` simulated | Read actual WebRTC audio levels from `RTCRtpReceiver.getStats()` |

### 3.5 Missing Screens/Features

| Feature | Status | Fix |
|---------|--------|-----|
| `GroupInviteAccept` screen | Deep link redirects to `GroupInvites` as workaround | Create dedicated invite accept screen |
| Forum hooks directory | `features/forums/hooks/` doesn't exist (all other features have hooks) | Create forum-specific hooks |

### 3.6 Protocol Incomplete

| Issue | Impact | Fix |
|-------|--------|-----|
| X3DH DH4 (one-time prekey) not computed | Only 3/4 DH operations in handshake — reduced forward secrecy | Implement DH4 = ECDH(EK_A, OPK_B) by retaining one-time prekey privkey |
| WatermelonDB message sender stub | Minimal sender info in offline messages | Cache sender profile data in WatermelonDB schema |

---

## 4. Cross-Platform Gaps (Backend APIs With No Frontend Integration)

These backend endpoint groups have **no corresponding service layer** in either web or mobile:

| Backend API Group | Endpoints | Web Service | Mobile Service | Gap |
|-------------------|-----------|-------------|----------------|-----|
| **Creator Monetization** | `/api/v1/creator/*` (onboard, status, subscribe, balance, payout) | ❌ None | ❌ None | Create service + store + hooks for both |
| **Coin Shop** | `/api/v1/coins/bundles`, `/api/v1/coins/checkout` | ❌ None | ❌ None (IAP service exists but no coin shop) | Create coin shop service for web |
| **Creator Analytics** | `/api/v1/creator/analytics` | ❌ None | ❌ None | Create analytics service + dashboard |
| **Admin Marketplace** | `/admin/marketplace/*` (20+ endpoints) | Partially (admin module exists) | ❌ None | Complete admin marketplace integration |
| **AI Features** | `/api/v1/ai/*` (summarize, smart replies, moderate, sentiment) | ❌ None | ❌ None | Create AI service layer |

---

## 5. Backend Quality Issues Affecting User Experience

| Issue | User Impact | Phase to Fix |
|-------|-------------|-------------|
| Auth p95 latency 383ms (SLO: 300ms) | Slow login/signup | Performance phase |
| Elixir version mismatch (Docker 1.17.3 vs local 1.19.4) | Potential production behavior differences | Infrastructure phase |
| 0 creator monetization tests | Payout/subscription bugs ship undetected | Testing phase |
| Stripe webhook tests cover signature only (4 tests) | Payment event handling bugs ship undetected | Testing phase |
| PgBouncer not deployed | DB connection exhaustion under load | Infrastructure phase |
| MeiliSearch not activated | Slow search (PostgreSQL ILIKE fallback) | Infrastructure phase |

---

## 6. Phasing Strategy

Based on dependency analysis, the work naturally groups into 6 phases:

| Phase | Name | Focus | Why This Order |
|-------|------|-------|---------------|
| **1** | Backend Safety Net | Fix all P0 security issues + crash bugs | Can't send users to broken/insecure APIs |
| **2** | Web Wiring | Replace all mock data with real API calls | Largest user base, highest visibility |
| **3** | Mobile Wiring | Wire mobile stubs, facades, and mock screens | Parallel with web if resources allow |
| **4** | Creator & Payments | End-to-end creator monetization + coin shop | Revenue-generating features |
| **5** | Test Coverage | Creator tests, webhook tests, coverage baseline | Catch bugs before they hit users |
| **6** | Infrastructure & Performance | PgBouncer, MeiliSearch, load tests, version sync | Scale for real traffic |

**Total estimated work**: ~45 discrete tasks across 6 phases.

---

_Generated: 2026-03-04 | Source: Full monorepo analysis + codebase inventory verification_
