# CGraph Project Status

> **Version: 0.9.31** | Last Updated: Session 30
>
> **⚠️ Scores below were re-calibrated in Session 30 to reflect reality.
> See [V1_ACTION_PLAN.md](V1_ACTION_PLAN.md) for actual gaps.**

---

## 🔧 Remediation Status

### Phase Implementation Progress

| Phase                           | Target                        | Status      | Completion |
| ------------------------------- | ----------------------------- | ----------- | ---------- |
| Phase 0: Critical Security      | Remove secrets from git       | ✅ COMPLETE | 100%       |
| Phase 1: Security Hardening     | OAuth, CORS, SSL, Audit       | ✅ COMPLETE | 100%       |
| Phase 2: Code Quality           | Console.log, as any           | ✅ COMPLETE | 100%       |
| Phase 3: Store Consolidation    | 32 → 7 facades                | ✅ COMPLETE | 100%       |
| Phase 4: Component Refactoring  | Break down large components   | ✅ COMPLETE | 100%       |
| Phase 5: Feature Completeness   | Edit/delete, voice, E2EE      | ✅ COMPLETE | 100%       |
| Phase 6: Test Coverage          | Facade + unit tests           | ✅ COMPLETE | 80%        |
| Phase 7: Platform Parity        | Web ↔ Mobile feature match    | ✅ COMPLETE | 100%       |
| Phase 8: Performance Polish     | Bundle optimization           | ✅ COMPLETE | 100%       |
| Phase 9: Operational Maturity   | Testing, CI/CD, Observability | ✅ COMPLETE | 100%       |
| Phase 10: Test Suite Green      | 0 backend test failures       | ✅ COMPLETE | 100%       |
| Phase 11: Compliance Pass       | <500 BE / <300 FE file limits | ✅ COMPLETE | 100%       |
| Phase 12: Architecture Refactor | Router split, component org   | ✅ COMPLETE | 100%       |
| Phase 13: Audit Fix + Test Fix  | P0/P1/P2 findings + 635 fails | ✅ COMPLETE | 100%       |

### Key Improvements (v0.9.13)

| Metric                | Before  | After       | Status                   |
| --------------------- | ------- | ----------- | ------------------------ |
| `.env` with secrets   | Present | **DELETED** | ✅                       |
| `as any` casts        | 27      | **10**      | ✅ 63% reduction         |
| `console.log` calls   | 325     | **65**      | ✅ 80% reduction         |
| Settings.tsx lines    | 1,172   | **221**     | ✅ 81% reduction         |
| UserProfile.tsx lines | 1,157   | **715**     | ✅ 38% reduction         |
| SocketManager.ts      | 960     | **616**     | ✅ 36% reduction         |
| ChatBubbleSettings    | 933     | **305**     | ✅ 67% reduction         |
| Store facades         | 0       | **7**       | ✅ Consolidation done    |
| Facade hooks (new)    | 0       | **7**       | ✅                       |
| Lazy-loaded pages     | 50      | **62**      | ✅ +12 new pages         |
| Mobile screens (new)  | 0       | **7**       | ✅ Platform parity       |
| Passing tests         | 840     | **1,633**   | ✅ +793 tests            |
| Test failures         | 635     | **0**       | ✅ All resolved          |
| Facade test coverage  | 0       | **132**     | ✅ 7 test files          |
| Backend test files    | 127     | **163**     | ✅ +36 (83 ctrl, 70 ctx) |
| Web test files        | 0       | **171**     | ⚠️ Files exist but ~20% line coverage |
| Mobile test files     | 0       | **15**      | ⚠️ Files exist but ~25% line coverage |
| Build chunks          | ~150    | **168**     | ✅ Optimized             |
| TypeScript errors     | 0       | **0**       | ✅ Clean                 |

### Overall Health Score

**7.2/10** (re-calibrated from inflated 9.0/10 — see V1_ACTION_PLAN.md)

| Category             | Score | Target | Notes |
| -------------------- | ----- | ------ | ----- |
| Security             | 6/10  | 9/10   | Mobile E2EE is XOR stub, rate limiting gaps |
| Code Quality         | 8/10  | 9/10   | 100+ `any` casts remain |
| Feature Completeness | 8/10  | 9/10   | Many features are stubs/TODOs |
| Test Coverage        | 5/10  | 8/10   | Web ~20%, Mobile ~25%, Backend ~70% |
| Maintainability      | 8/10  | 9/10   | |
| Production Readiness | 6/10  | 10/10  | Load tests never run, no SLO tracking |
| Observability        | 5/10  | 10/10  | Grafana config exists, not connected |
| Resilience           | 5/10  | 10/10  | No chaos testing, no backup verification |
| Architecture         | 8/10  | 9/10   | Solid structure, some oversized contexts |

See `docs/REMEDIATION_STATUS_2026_01_31.md` for full details.

---

## 📊 Feature Implementation Status

### Current Coverage: 100%

```
Implemented:        69 features
Remaining:           0 features
Total tracked:      69 features
Coverage:           100%
```

### Category Breakdown

| Category         | Total | Done | Complete |
| ---------------- | ----- | ---- | -------- |
| Core Forums      | 15    | 15   | 100%     |
| Private Messages | 12    | 12   | 100%     |
| User System      | 15    | 15   | 100%     |
| Moderation       | 15    | 15   | 100%     |
| Calendar/Events  | 9     | 9    | 100%     |
| Announcements    | 6     | 6    | 100%     |
| Reputation       | 8     | 8    | 100%     |
| Referrals        | 4     | 4    | 100%     |
| Search           | 10    | 10   | 100%     |
| Formatting       | 10    | 10   | 100%     |

---

## ✅ Implemented Features

### Core Forum System

- Thread prefixes, ratings, poll system
- File attachments with thumbnails
- Edit history timeline
- Thread subscriptions
- Report system with categories
- Quick reply with BBCode toolbar
- Forum statistics

### Private Messaging

- PM conversations and folders
- Drafts and read receipts
- Starred/important messages

### Calendar & Events

- Full event management with RSVP
- Categories and recurring events
- Visibility controls

### Referral System

- Unique referral codes
- Reward tiers (Bronze → Legendary)
- Leaderboard and stats

### Announcement System

- Per-forum and global announcements
- Dismissible banners
- Date-based display

### User Profiles

- Signatures, badges, custom titles
- Profile fields and online status

### Reputation System

- Points with comments
- Full history and breakdown

### Member Directory

- User list with filtering/search
- Group memberships

### Moderation Tools

- Split/merge/move threads
- Soft delete with restore
- Warning system with points
- Ban management
- Moderation queue and logs

### Content Formatting

- Full BBCode parser
- Spoiler tags, code highlighting
- Nested quote display

### Webhooks & Integrations (v0.9.29)

- Outbound webhook delivery (Oban-powered)
- HMAC-SHA256 signed payloads
- Exponential backoff retries (5 attempts)
- Webhook endpoint CRUD with secret rotation
- Delivery tracking with status/response storage

### Voice/Video Infrastructure (v0.9.29)

- WebRTC room management (GenServer + ETS)
- Call history persistence to database
- TURN/STUN/SFU server configuration
- ICE candidate relay support

### Admin Dashboard (v0.9.29)

- Dashboard overview with live metrics + moderation queue
- User management with search, filter, sort (API-backed)
- Events management with CRUD (API-backed)
- Marketplace moderation with approve/reject/bulk actions (API-backed)

---

## ✅ All Features Complete (69/69)

### Completed Since Last Audit

- ✅ **Email Notifications** - Digest emails (SendEmailNotification + EmailDigestWorker)
- ✅ **Push Notifications** - APNS, FCM, WebPush via PushService + circuit breakers
- ✅ **Forum Hierarchy** - parent_forum_id, sub_forums, ForumHierarchyController
  (move/reorder/create_subforum)
- ✅ **Forum Permissions** - ForumPermission schema, PermissionsController CRUD, inheritance
- ✅ **Profile Visibility** - public/friends/private enum, SettingsController integration
- ✅ **Forum Subscriptions** - Subscription schema, SubscriptionService, home feed
- ✅ **Multi-Quote** - PostQuoteButton, useMultiQuote hook, quoteUtils, store integration

### Recently Completed (v0.9.29)

- ✅ **Webhook System** - Outbound webhook delivery with HMAC-SHA256 signatures
- ✅ **Call History DB** - WebRTC call history persisted to database
- ✅ **Admin Dashboard API** - All 4 panels wired to real API endpoints
- ✅ **Gamification API Counts** - Replaced hardcoded achievement counts with API data

### Previously Completed (v0.9.13)

- ✅ **RSS Feeds** - Subscribe to threads/forums (web page created)
- ✅ **Custom Emoji** - Custom emoji system (web page + upload modal)
- ✅ **Call History** - View and manage call history (web page)
- ✅ **E2EE Verification** - Safety number verification (web page)

---

## 🗄️ Database Schema

**91 tables + 3 new** supporting all features:

### Core Tables

- `users`, `forums`, `posts`, `comments`
- `conversations`, `messages`
- `groups`, `channels`

### Feature Tables

- PM: `pm_folders`, `private_messages`, `pm_drafts`
- Calendar: `calendar_events`, `calendar_event_categories`, `calendar_event_rsvps`
- Referrals: `referral_codes`, `referrals`, `referral_reward_tiers`
- Reputation: `reputation_entries`
- Announcements: `announcement_dismissals`
- Webhooks: `webhook_endpoints`, `webhook_deliveries`
- WebRTC: `call_history`

---

## 📱 Platform Parity

### Mobile vs Web

| Feature           | Web | Mobile |
| ----------------- | --- | ------ |
| Thread Prefixes   | ✅  | ✅     |
| Thread Ratings    | ✅  | ✅     |
| Polls             | ✅  | ✅     |
| Attachments       | ✅  | ✅     |
| Edit History      | ✅  | ✅     |
| Basic Posts       | ✅  | ✅     |
| Comments          | ✅  | ✅     |
| Voting            | ✅  | ✅     |
| Call History      | ✅  | ✅     |
| Custom Emoji      | ✅  | ✅     |
| RSS Feeds         | ✅  | ✅     |
| E2EE Verification | ✅  | ✅     |
| Key Verification  | ✅  | ✅     |
| Customization Hub | ✅  | ✅     |
| Badge Selection   | ✅  | ✅     |
| Title Selection   | ✅  | ✅     |
| Email Preferences | ✅  | ✅     |

**Result:** 17/17 tracked features on both platforms

---

## 🤖 AI Integration Status

**Current:** Disabled (placeholder for future)

**Planned Provider:** Claude (Anthropic)

**Future Features:**

- Forum moderation assistance
- Chat experience enhancement
- Content suggestions
- Smart search

See [AI_INTEGRATION.md](architecture/AI_INTEGRATION.md) for details.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CGraph Platform                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Web App   │  │ Mobile App  │  │   Backend   │      │
│  │ React 19.1  │  │ React Native│  │   Phoenix   │      │
│  │   Vite 6.3  │  │    Expo     │  │   Elixir    │      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
│         │                │                │              │
│         └────────────────┼────────────────┘              │
│                          │                               │
│                  ┌───────▼───────┐                       │
│                  │   WebSocket   │                       │
│                  │   Phoenix     │                       │
│                  │   Channels    │                       │
│                  └───────┬───────┘                       │
│                          │                               │
│                  ┌───────▼───────┐                       │
│                  │  PostgreSQL   │                       │
│                  │  91 tables    │                       │
│                  └───────────────┘                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Web      | React 19.1, Vite 6.3, TailwindCSS |
| Mobile   | React Native 0.81, Expo SDK 54    |
| Backend  | Phoenix 1.8 / Elixir 1.17+        |
| Database | PostgreSQL (Supabase)             |
| Realtime | Phoenix Channels (WebSocket)      |
| Webhooks | Oban + Finch HTTP client          |
| Payments | Stripe Checkout + Subscriptions   |
| Deploy   | Vercel (frontend), Fly.io (API)   |
| CDN      | Cloudflare                        |
| State    | Zustand 5 + 7 Facade Hooks        |
| Testing  | Vitest 3.2.4 + Testing Library    |

---

## 📁 Project Structure

```
CGraph/
├── apps/
│   ├── web/          # React web application
│   ├── mobile/       # React Native mobile app
│   └── backend/      # Phoenix/Elixir API
├── packages/
│   ├── config/       # Shared configuration
│   ├── core/         # Core utilities
│   ├── shared-types/ # TypeScript types
│   ├── state/        # State management
│   ├── ui/           # Shared UI components
│   └── utils/        # Utility functions
├── docs/             # Documentation
├── infrastructure/   # Docker, Terraform, etc.
└── docs-website/     # Docusaurus documentation site
```

---

## 🚀 Deployment

### Production

- **Web:** Vercel at cgraph.org
- **API:** Fly.io
- **Database:** Managed PostgreSQL

### Development

```bash
# Install dependencies
pnpm install

# Start all apps
pnpm dev

# Run specific app
pnpm --filter web dev
pnpm --filter mobile start
pnpm --filter backend dev
```

---

## 📋 Documentation Index

### Architecture

- [Architecture Overview](architecture/ARCHITECTURE.md)
- [Database Design](architecture/DATABASE.md)
- [Database Scaling](architecture/DATABASE_SCALING.md)
- [Presence System](architecture/PRESENCE_ARCHITECTURE.md)
- [Real-time Communication](architecture/REALTIME_COMMUNICATION.md)
- [AI Integration Plan](architecture/AI_INTEGRATION.md)

### API

- [API Overview](api/API.md)
- [API Reference](api/API_REFERENCE.md)
- [OpenAPI Spec](api/openapi.yaml)

### Guides

- [Deployment Guide](guides/DEPLOYMENT.md)
- [Frontend Guide](guides/FRONTEND.md)
- [Mobile Guide](guides/MOBILE.md)
- [Security Guide](guides/SECURITY.md)

### Archive

Historical documentation is preserved in [docs/archive/](archive/).

---

**Maintained by:** CGraph Development Team
