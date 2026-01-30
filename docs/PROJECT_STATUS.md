# CGraph Project Status

> **Version: 0.9.8** | Last Updated: January 2026

This document consolidates the project status, feature tracking, and development roadmap.

---

## 📊 Feature Implementation Status

### Current Coverage: ~75%

```
Implemented:        51 features
Remaining:          18 features
Total tracked:      69 features
Coverage:           ~74%
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

## ❌ Remaining Features (18)

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
14. **RSS Feeds** - Subscribe to threads/forums
15. **Forum Ordering** - Drag-drop reordering
16. **Smilies/Emoji** - Custom emoji system
17. **Post Icons** - Decorative post icons
18. **Multi-Quote** - Quote multiple posts

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

| Feature         | Web | Mobile |
| --------------- | --- | ------ |
| Thread Prefixes | ✅  | ✅     |
| Thread Ratings  | ✅  | ✅     |
| Polls           | ✅  | ✅     |
| Attachments     | ✅  | ✅     |
| Edit History    | ✅  | ✅     |
| Basic Posts     | ✅  | ✅     |
| Comments        | ✅  | ✅     |
| Voting          | ✅  | ✅     |

**Result:** 15/15 core forum features on both platforms

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
