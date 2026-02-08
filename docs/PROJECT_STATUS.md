# CGraph Project Status

> **Version: 0.9.13** | Last Updated: February 8, 2026 | Commit: `042b18b`

This document consolidates the project status, feature tracking, and development roadmap.

---

## 🔧 Remediation Status

### Phase Implementation Progress

| Phase                          | Target                      | Status      | Completion |
| ------------------------------ | --------------------------- | ----------- | ---------- |
| Phase 0: Critical Security     | Remove secrets from git     | ✅ COMPLETE | 100%       |
| Phase 1: Security Hardening    | OAuth, CORS, SSL, Audit     | ✅ COMPLETE | 100%       |
| Phase 2: Code Quality          | Console.log, as any         | ✅ COMPLETE | 100%       |
| Phase 3: Store Consolidation   | 32 → 7 facades              | ✅ COMPLETE | 100%       |
| Phase 4: Component Refactoring | Break down large components | ✅ COMPLETE | 100%       |
| Phase 5: Feature Completeness  | Edit/delete, voice, E2EE    | ✅ COMPLETE | 100%       |
| Phase 6: Test Coverage         | Facade + unit tests         | ✅ COMPLETE | 80%        |
| Phase 7: Platform Parity       | Web ↔ Mobile feature match  | ✅ COMPLETE | 100%       |
| Phase 8: Performance Polish    | Bundle optimization         | ✅ COMPLETE | 100%       |

### Key Improvements (v0.9.13)

| Metric                | Before  | After       | Status                |
| --------------------- | ------- | ----------- | --------------------- |
| `.env` with secrets   | Present | **DELETED** | ✅                    |
| `as any` casts        | 27      | **1**       | ✅ 96% reduction      |
| `console.log` calls   | 325     | **2**       | ✅ 99% reduction      |
| Settings.tsx lines    | 1,172   | **221**     | ✅ 81% reduction      |
| UserProfile.tsx lines | 1,157   | **715**     | ✅ 38% reduction      |
| Store facades         | 0       | **7**       | ✅ Consolidation done |
| Facade hooks (new)    | 0       | **7**       | ✅ Discord-style      |
| Lazy-loaded pages     | 50      | **62**      | ✅ +12 new pages      |
| Mobile screens (new)  | 0       | **7**       | ✅ Platform parity    |
| Passing tests         | 840     | **1,342**   | ✅ +502 tests         |
| Facade test coverage  | 0       | **132**     | ✅ 7 test files       |
| Build chunks          | ~150    | **168**     | ✅ Optimized          |
| TypeScript errors     | 0       | **0**       | ✅ Clean              |

### Overall Health Score

**9.0/10** (up from 8.5/10)

| Category             | Score | Target |
| -------------------- | ----- | ------ |
| Security             | 9/10  | 9/10   |
| Code Quality         | 9/10  | 9/10   |
| Feature Completeness | 9/10  | 9/10   |
| Test Coverage        | 8/10  | 8/10   |
| Maintainability      | 9/10  | 9/10   |
| Production Readiness | 9/10  | 10/10  |

See `docs/REMEDIATION_STATUS_2026_01_31.md` for full details.

---

## 📊 Feature Implementation Status

### Current Coverage: ~80%

```
Implemented:        55 features
Remaining:          14 features
Total tracked:      69 features
Coverage:           ~80%
```

### Category Breakdown

| Category         | Total | Done | Complete |
| ---------------- | ----- | ---- | -------- |
| Core Forums      | 15    | 12   | 80%      |
| Private Messages | 12    | 10   | 83%      |
| User System      | 15    | 10   | 67%      |
| Moderation       | 15    | 14   | 93%      |
| Calendar/Events  | 9     | 9    | 100%     |
| Announcements    | 6     | 5    | 83%      |
| Reputation       | 8     | 6    | 75%      |
| Referrals        | 4     | 4    | 100%     |
| Search           | 10    | 8    | 80%      |
| Formatting       | 10    | 8    | 80%      |

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

---

## ❌ Remaining Features (14)

### High Priority

1. **Email Notifications** - Digest emails for subscriptions
2. **Push Notifications** - Browser push notifications
3. **Forum Hierarchy** - Infinite subforum nesting
4. **Username Changes** - With cooldown period

### Medium Priority

5. **Forum Permissions** - Per-forum granular access
6. **Profile Visibility** - Full privacy controls
7. **Ignore List** - Block users from PMs
8. **Secondary Groups** - Multiple group membership
9. **Forum Subscriptions** - Subscribe to entire forums
10. **Auto-Subscribe** - Auto-sub when posting

### Lower Priority

11. **User Stars** - Visual post count indicators
12. **Thread View Modes** - Linear vs threaded display
13. **Printable Version** - Export thread as PDF
14. **Multi-Quote** - Quote multiple posts

### Recently Completed (v0.9.13)

- ✅ **RSS Feeds** - Subscribe to threads/forums (web page created)
- ✅ **Custom Emoji** - Custom emoji system (web page + upload modal)
- ✅ **Call History** - View and manage call history (web page)
- ✅ **E2EE Verification** - Safety number verification (web page)

---

## 🗄️ Database Schema

**91 tables** supporting all features:

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
