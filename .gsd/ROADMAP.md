# CGraph Roadmap — v0.9.48 → v1.0.0

> Generated: 2025-02-27 | Phases: 19 | Requirements: 136 mapped | Depth: Comprehensive
>
> Design principle: Small focused phases (3–9 reqs) give execution agents maximum context budget per
> phase. Early phases are granular; later phases stay natural. Every phase delivers one verifiable
> capability.

---

## Phase Overview

| #   | Phase                   | Goal                                               | Reqs | Depends On     |
| --- | ----------------------- | -------------------------------------------------- | ---- | -------------- |
| 1   | Infrastructure Baseline | Monorepo builds, versions aligned, routes healthy  | 3    | —              |
| 2   | Auth Core               | Register, verify, login, token refresh — all work  | 4    | Phase 1        |
| 3   | Auth Advanced           | OAuth, 2FA, session management complete            | 3    | Phase 2        |
| 4   | Design System & Mobile  | Professional visuals, mobile builds pass           | 4    | Phase 1        |
| 5   | Message Transport       | Real-time 1:1 messaging with indicators & receipts | 4    | Phase 2        |
| 6   | Message Features & Sync | Edit, delete, reply, react, cross-device sync      | 5    | Phase 5        |
| 7   | E2EE & Mobile Security  | End-to-end encryption + biometric auth             | 6    | Phase 5        |
| 8   | Social & Profiles       | Onboarding, profiles, presence, user search        | 7    | Phase 2        |
| 9   | Notifications & Safety  | Push, notification center, DND, account deletion   | 7    | Phase 8        |
| 10  | Message Extras          | Forward, pin, bookmark, link preview, disappearing | 5    | Phase 6        |
| 11  | Groups & Channels       | Group creation, channels, invites, group messaging | 7    | Phase 5        |
| 12  | Roles & Moderation      | Permissions, moderation tools, group E2EE          | 9    | Phase 11       |
| 13  | Voice & Video           | 1:1 and group calls, screen share, call E2EE       | 9    | Phase 12       |
| 14  | Forum Core              | Boards, threads, posts, polls, real-time updates   | 9    | Phase 12       |
| 15  | Forum Customization     | 50+ options, plugins, advanced features            | 8    | Phase 14       |
| 16  | Gamification            | XP, quests, battle pass, shop, cosmetics           | 12   | Phase 14       |
| 17  | Monetization            | Stripe, mobile IAP, creator payouts                | 10   | Phase 16       |
| 18  | Rich Media & Polish     | Voice msgs, files, GIFs, search, animations, scale | 20   | Phase 7, 13    |
| 19  | Launch                  | App Store, landing page, wallet auth, final QA     | 4    | Phase 15,17,18 |

**Dependency Graph:**

```
Phase 1 (Infrastructure)
├─► Phase 2 (Auth Core)
│   ├─► Phase 3 (Auth Advanced)
│   ├─► Phase 5 (Message Transport)
│   │   ├─► Phase 6 (Message Features) ─► Phase 10 (Message Extras)
│   │   ├─► Phase 7 (E2EE & Mobile Security) ──────────────────┐
│   │   └─► Phase 11 (Groups & Channels)                       │
│   │        └─► Phase 12 (Roles & Moderation)                  │
│   │             ├─► Phase 13 (Voice & Video) ─────────────────┤
│   │             └─► Phase 14 (Forum Core)                     │
│   │                  ├─► Phase 15 (Forum Customization)       │
│   │                  └─► Phase 16 (Gamification)              │
│   │                       └─► Phase 17 (Monetization)         │
│   └─► Phase 8 (Social & Profiles)                             │
│        └─► Phase 9 (Notifications & Safety)                   │
└─► Phase 4 (Design System & Mobile)                            │
                                                                ▼
                                               Phase 18 (Rich Media & Polish)
                                                                │
                           Phases 15, 17, 18 ──────────────────►│
                                                                ▼
                                                   Phase 19 (Launch)
```

**Parallel tracks after Phase 2:**

- Track A: Messaging → Features → E2EE → Rich Media
- Track B: Social → Notifications
- Track C: Groups → Permissions → Voice/Forums → Gamification → Monetization

---

## Phase 1: Infrastructure Baseline

**Goal:** Monorepo is healthy — all packages at same version, backend routes respond, WebSocket
reconnects reliably.

**Rationale:** Version drift (9/11 packages at 0.9.31, backend at 0.9.36, only web at 0.9.47) makes
shared types unreliable. Route errors are unidentified. Without a clean baseline, nothing built on
top is safe.

**Depends on:** —

### Requirements (3)

| REQ-ID   | Requirement                                      |
| -------- | ------------------------------------------------ |
| INFRA-02 | All package versions synced to 0.9.47 baseline   |
| INFRA-03 | Backend routes audited — erroring routes fixed   |
| INFRA-05 | Reconnection with exponential backoff and jitter |

### Success Criteria

1. All `package.json` files and `mix.exs` show synchronized version numbers
2. Backend boots and every auth/health route returns non-500 responses
3. WebSocket reconnects after network drop with exponential backoff (no thundering herd)

### Plans

| Plan  | Scope                                                                   | Status   |
| ----- | ----------------------------------------------------------------------- | -------- |
| 01-01 | Version Sync — update all 10 packages to 0.9.47                         | **done** |
| 01-02 | Backend Route Audit — verify health/auth/public routes                  | **done** |
| 01-03 | WebSocket Reconnection Hardening — circuit breaker + session resumption | **done** |

---

## Phase 2: Auth Core

**Goal:** Users can register, verify email, log in, reset password, and stay logged in reliably on
both platforms.

**Rationale:** These are the flows every single user touches. AUTH-14 (refresh mutex) is the
highest-risk item — without it, concurrent 401s race-condition and log users out. Mobile has zero
token refresh today.

**Depends on:** Phase 1

### Requirements (4)

| REQ-ID  | Requirement                                       |
| ------- | ------------------------------------------------- |
| AUTH-01 | Register with email/password on web and mobile    |
| AUTH-02 | Email verification on both platforms              |
| AUTH-03 | Password reset via email link on both platforms   |
| AUTH-14 | Token refresh mutex (concurrent request handling) |

### Success Criteria

1. New user registers on web, receives verification email, verifies account, and can log in
2. User logs in on mobile and stays logged in across app restarts (token refresh works)
3. Concurrent API 401s trigger exactly one refresh request, not a race condition
4. User resets password via email link and logs in with new password

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 3: Auth Advanced

**Goal:** OAuth, 2FA, and session management complete on all platforms.

**Rationale:** OAuth reduces sign-up friction. 2FA protects accounts. Session management gives users
control. Backend for all three is fully implemented — the gaps are mobile 2FA screens (zero exist)
and frontend session management UI (missing on both platforms).

**Depends on:** Phase 2

### Requirements (3)

| REQ-ID  | Requirement                                    |
| ------- | ---------------------------------------------- |
| AUTH-04 | OAuth (Google, Apple) on both platforms        |
| AUTH-05 | TOTP 2FA with recovery codes on both platforms |
| AUTH-07 | Manage active sessions and revoke devices      |

### Success Criteria

1. User logs in via Google OAuth on web and Apple Sign-In on mobile
2. User enables TOTP 2FA, logs out, and must enter 6-digit code to log back in
3. User views list of active sessions and revokes a session from another device

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 4: Design System & Mobile

**Goal:** Professional visual foundation on both platforms, mobile builds pass.

**Rationale:** Web has Tailwind config + 12 color presets but no dark/light mode toggle in the theme
store. Mobile has full dark mode. WCAG AA compliance is unverified. EAS build config exists but is
untested. This phase establishes visual quality before feature work.

**Depends on:** Phase 1

### Requirements (4)

| REQ-ID    | Requirement                                             |
| --------- | ------------------------------------------------------- |
| DESIGN-01 | Design system with consistent tokens                    |
| DESIGN-02 | Color palette with WCAG AA contrast ratios              |
| DESIGN-05 | Dark mode / light mode with system preference detection |
| INFRA-08  | Mobile app builds for iOS and Android (Expo EAS)        |

### Success Criteria

1. Web and mobile both toggle between dark/light/system mode with persisted preference
2. Primary text/background combinations pass WCAG AA contrast ratios (4.5:1 minimum)
3. Mobile app builds for iOS simulator and Android emulator via EAS without errors
4. Built mobile app launches and reaches the login screen on both platforms

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 5: Message Transport

**Goal:** Users can send and receive 1:1 text messages in real-time with typing indicators and
delivery/read receipts.

**Rationale:** This is the core product loop. Phoenix Channels + conversation channel already exist
(390 lines with rate limiting, typing, receipts, presence). Frontend socket package has typed
channel clients. This phase wires everything end-to-end across web and mobile.

**Depends on:** Phase 2

### Requirements (4)

| REQ-ID | Requirement                                 |
| ------ | ------------------------------------------- |
| MSG-01 | Send/receive 1:1 text messages in real-time |
| MSG-06 | Typing indicators                           |
| MSG-18 | Read receipts (with opt-out)                |
| MSG-19 | Delivery receipts                           |

### Success Criteria

1. User sends a 1:1 message on web and it appears in real-time on mobile (and vice versa)
2. User sees typing indicator when contact is composing a message
3. Sent message shows delivery checkmark, then read checkmark when opened by recipient
4. User can disable read receipts in settings

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 6: Message Features & Sync

**Goal:** Full message feature set — edit, delete, reply, react, sync across devices.

**Rationale:** These features make messaging feel complete. Edit history, soft-delete indicators,
thread replies, and emoji reactions are expected in any modern messenger. Cross-device sync
(WatermelonDB) is critical for mobile offline usage.

**Depends on:** Phase 5

### Requirements (5)

| REQ-ID | Requirement                                           |
| ------ | ----------------------------------------------------- |
| MSG-04 | Edit messages with history visible                    |
| MSG-05 | Delete messages (soft-delete with indicator)          |
| MSG-07 | Reply/quote specific messages                         |
| MSG-09 | React to messages with emoji                          |
| MSG-22 | Messages sync across devices (WatermelonDB on mobile) |

### Success Criteria

1. User edits a message and recipient sees edit history
2. User deletes a message and recipient sees "message deleted" indicator
3. User replies to a specific message with visible thread context
4. User reacts with emoji and it appears in real-time for both parties
5. User reads messages on web, switches to mobile, and messages are synced

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 7: E2EE & Mobile Security

**Goal:** All 1:1 messages are end-to-end encrypted. Biometric auth on mobile.

**Rationale:** E2EE is CGraph's #1 differentiator. The crypto library exists (PQXDH + Triple Ratchet
\+ ML-KEM-768) but the integration pipeline (encrypt-before-send, decrypt-on-receive) must be wired
to the chat module. Client-side key storage and biometric auth share native Keychain/Keystore APIs.

**Depends on:** Phase 5

### Requirements (6)

| REQ-ID  | Requirement                                               |
| ------- | --------------------------------------------------------- |
| E2EE-01 | 1:1 E2EE with PQXDH + Triple Ratchet                      |
| E2EE-03 | Verify contact identity via safety numbers / QR code      |
| E2EE-04 | E2EE key sync for new devices                             |
| E2EE-08 | Client-side key storage (Keychain/Keystore/encrypted web) |
| E2EE-09 | E2EE bootstrap automatically after login                  |
| AUTH-06 | Biometric auth (Face ID / fingerprint) on mobile          |

### Success Criteria

1. Messages display encryption lock icon indicating E2EE protection
2. User verifies contact identity via safety numbers screen
3. E2EE bootstraps automatically after login without user action
4. User adds a new device and E2EE keys sync seamlessly
5. User authenticates with Face ID or fingerprint on mobile

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 8: Social & Profiles

**Goal:** Onboarding, profiles, presence, status, user search, and user blocking make CGraph a
social app.

**Rationale:** With messaging working, the social layer converts new users into engaged users.
Onboarding wizard, profile setup, and presence are table-stakes. Blocking is a safety requirement
that must exist before scaling users.

**Depends on:** Phase 2

### Requirements (7)

| REQ-ID    | Requirement                                           |
| --------- | ----------------------------------------------------- |
| AUTH-09   | Onboarding wizard (avatar → find friends → community) |
| AUTH-10   | Profile setup (display name, avatar, bio)             |
| AUTH-11   | QR code login (scan from mobile to log into web)      |
| NOTIF-05  | Online/offline presence for contacts                  |
| NOTIF-06  | Custom status text                                    |
| SEARCH-02 | Search users by name/username                         |
| MOD-03    | Block users (messaging, presence, search blocked)     |

### Success Criteria

1. New user completes onboarding wizard and has a profile within 2 minutes
2. User sees online/offline status for contacts in real-time
3. User sets custom status text visible to contacts
4. User searches for another user by name and finds them
5. User blocks a contact and they disappear from search, presence, and messaging

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 9: Notifications & Safety

**Goal:** Push notifications on all platforms, notification center, DND mode, GDPR account deletion.

**Rationale:** Push notifications are the #1 re-engagement mechanism. Without them, users don't
return. Account deletion is a GDPR legal requirement. These must be solid before inviting real
users.

**Depends on:** Phase 8

### Requirements (7)

| REQ-ID   | Requirement                                             |
| -------- | ------------------------------------------------------- |
| NOTIF-01 | Mobile push notifications (Expo → APNs/FCM)             |
| NOTIF-02 | Web push notifications                                  |
| NOTIF-03 | In-app notification center with activity feed           |
| NOTIF-04 | Notification preferences per conversation/channel/forum |
| NOTIF-07 | Do Not Disturb mode with schedule                       |
| NOTIF-08 | Email digest for lapsed engagement                      |
| AUTH-08  | Account deletion (GDPR) with data export                |

### Success Criteria

1. User receives push notification on mobile when mentioned in a conversation
2. User receives web push notification for new messages (with browser permission)
3. User views notification center showing activity feed with proper grouping
4. User enables DND mode and stops receiving all notifications
5. User deletes account and all personal data is purged or exported

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 10: Message Extras

**Goal:** Secondary messaging features — forward, pin, bookmark, link previews, disappearing
messages.

**Rationale:** These features elevate messaging from functional to delightful. Link previews with OG
metadata make shared URLs useful. Disappearing messages add privacy options beyond E2EE.

**Depends on:** Phase 6

### Requirements (5)

| REQ-ID | Requirement                                   |
| ------ | --------------------------------------------- |
| MSG-08 | Forward messages across conversations         |
| MSG-13 | Pin messages in conversations                 |
| MSG-14 | Save/bookmark messages                        |
| MSG-16 | Link previews with OG metadata                |
| MSG-17 | Disappearing messages with configurable timer |

### Success Criteria

1. User forwards a message to another conversation
2. User pins a message and it appears in the pinned messages list
3. User bookmarks a message and finds it in saved messages
4. Shared URL shows rich link preview with title, description, and image
5. User enables disappearing messages and they auto-delete after configured timer

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 11: Groups & Channels

**Goal:** Users can create groups, organize channels, invite friends, and message in groups in
real-time.

**Rationale:** Groups and channels transform CGraph from a messaging app into a community platform.
Group messaging, channel categories, invites, and discovery are the structural foundation that
forums, voice channels, and gamification all build on.

**Depends on:** Phase 5

### Requirements (7)

| REQ-ID   | Requirement                                        |
| -------- | -------------------------------------------------- |
| GROUP-01 | Create groups with avatar, description, settings   |
| GROUP-02 | Create channels with categories within groups      |
| GROUP-05 | Invite via invite link                             |
| GROUP-09 | Discover and browse public groups via explore page |
| MSG-02   | Send/receive group messages in real-time           |
| MSG-03   | Send messages in channels within groups            |
| MSG-21   | Message threads in channels                        |

### Success Criteria

1. User creates a group, sets avatar and description, creates channels with categories
2. User invites friends via invite link and they join the group
3. User sends a message in a channel and it appears in real-time for group members
4. User discovers and joins a public group from the explore page
5. User creates a thread in a channel for focused discussion

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 12: Roles & Moderation

**Goal:** Group governance — roles, permissions, moderation tools, automod, group E2EE, and content
reporting.

**Rationale:** Before communities can scale, the permission system must enforce who can do what.
Moderation tools protect communities from abuse. Group E2EE ensures encrypted group conversations.
This must be correct before forums and gamification layer on top.

**Depends on:** Phase 11

### Requirements (9)

| REQ-ID   | Requirement                                |
| -------- | ------------------------------------------ |
| GROUP-03 | Define roles with granular permissions     |
| GROUP-04 | Per-channel permission overrides           |
| GROUP-06 | Ban/kick members with reason logging       |
| GROUP-07 | Custom emoji uploaded by members           |
| GROUP-08 | Automod rules (spam, word, link filters)   |
| E2EE-02  | Group messages E2EE with key distribution  |
| MOD-01   | Report content (messages, posts, users)    |
| MOD-02   | Moderators review reports and take actions |
| MOD-04   | Automod filters spam, banned words, links  |

### Success Criteria

1. Group owner assigns roles and a restricted member cannot post in a read-only channel
2. Automod silently filters a spam message without moderator intervention
3. User reports content and moderator reviews and takes action from mod panel
4. Group messages are encrypted end-to-end with proper key distribution
5. Members upload custom emoji and use them in group conversations

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 13: Voice & Video

**Goal:** Voice and video calls work across platforms — 1:1 via WebRTC, group via LiveKit, all E2EE.

**Rationale:** Calls complete the communication suite. LiveKit SFU enables group calls beyond 2
participants. Call E2EE is critical for privacy positioning. Persistent voice channels
(Discord-style) are a key community feature.

**Depends on:** Phase 12

### Requirements (9)

| REQ-ID  | Requirement                                  |
| ------- | -------------------------------------------- |
| CALL-01 | 1:1 voice calls (WebRTC peer-to-peer)        |
| CALL-02 | 1:1 video calls                              |
| CALL-03 | Group voice calls (LiveKit SFU)              |
| CALL-04 | Group video calls (LiveKit SFU)              |
| CALL-05 | Screen sharing during calls                  |
| CALL-06 | Persistent voice channels (Discord-style)    |
| CALL-07 | Call history and call back                   |
| CALL-08 | All calls E2EE (SFrame / Insertable Streams) |
| E2EE-07 | Voice/video call media E2EE¹                 |

> ¹ CALL-08 and E2EE-07 cover the same capability. Counted as 2 REQ-IDs, delivered together.

### Success Criteria

1. User makes a 1:1 video call from web to mobile with clear audio and video
2. Three users join a group voice call via LiveKit with no echo or feedback
3. User shares screen during a call and others see it in real-time
4. User joins a persistent voice channel and can talk to anyone present
5. Call media is end-to-end encrypted (encryption indicator visible)

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 14: Forum Core

**Goal:** Full forum CRUD — boards, threads, posts, polls, votes, real-time updates, search.

**Rationale:** Forums are CGraph's differentiator — community features integrated into a messaging
app. The existing forum backend has boards, threads, posts, polls, and categories. This phase wires
it all together with real-time Phoenix Channel updates and full-text search.

**Depends on:** Phase 12

### Requirements (9)

| REQ-ID    | Requirement                                         |
| --------- | --------------------------------------------------- |
| FORUM-01  | Create and manage forums with admin controls        |
| FORUM-02  | Boards/sub-forums with categories                   |
| FORUM-03  | Threads with BBCode formatting and attachments      |
| FORUM-04  | Post, reply, comment with nested discussion         |
| FORUM-05  | Polls within threads                                |
| FORUM-06  | Upvote/downvote with reputation impact              |
| FORUM-09  | Real-time forum updates (new posts, replies, votes) |
| FORUM-10  | Full-text search across threads and posts           |
| SEARCH-03 | Search forum threads and posts                      |

### Success Criteria

1. User creates a forum with boards and categories, and it renders correctly
2. User creates a thread with BBCode formatting and embedded poll
3. New posts and replies appear in real-time without page refresh
4. User searches forum content and finds relevant threads ranked by relevance
5. User upvotes/downvotes posts and reputation scores update

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 15: Forum Customization

**Goal:** 50+ customization options, plugin system, advanced forum features.

**Rationale:** The "50+ customizations" claim must be real and enumerable — themes, CSS, layouts,
colors, fonts, widgets, sidebar, header, post templates, custom fields, badges, leaderboard, karma
names, rank images. This is what makes CGraph forums competitive with MyBB/XenForo.

**Depends on:** Phase 14

### Requirements (8)

| REQ-ID   | Requirement                                         |
| -------- | --------------------------------------------------- |
| FORUM-07 | 50+ customization options (themes, CSS, layouts)    |
| FORUM-08 | Built-in plugin system                              |
| FORUM-11 | Forum moderation tools (reports, actions, automod)  |
| FORUM-12 | Per-board permissions and permission templates      |
| FORUM-13 | Custom emoji packs and post icons                   |
| FORUM-14 | RSS feeds for boards and threads                    |
| FORUM-15 | User groups with secondary group membership         |
| FORUM-16 | Ranking engine and leaderboard tied to gamification |

### Success Criteria

1. Forum owner customizes theme, CSS, colors, layout and it renders as configured
2. Forum admin installs a plugin and it activates immediately
3. Per-board permissions restrict access correctly
4. RSS feed for a board returns valid XML with recent threads
5. 50+ distinct customization options are enumerable and functional

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 16: Gamification

**Goal:** XP, achievements, quests, battle pass, economy, marketplace, cosmetics all functional.

**Rationale:** Gamification is CGraph's stickiness engine. Economy rules (daily caps, diminishing
returns) must be set before any user earns XP. Progressive disclosure reveals complexity gradually.
The existing gamification backend has contexts for XP, achievements, quests, shop.

**Depends on:** Phase 14

### Requirements (12)

| REQ-ID  | Requirement                                               |
| ------- | --------------------------------------------------------- |
| GAME-01 | XP from messaging, forums, social actions (daily caps)    |
| GAME-02 | Achievements/badges for milestones                        |
| GAME-03 | Daily/weekly quests for XP rewards                        |
| GAME-04 | Leaderboards (global, per-group, per-forum)               |
| GAME-05 | Battle pass with seasonal tiers                           |
| GAME-06 | Virtual currency (coins) — earn and spend in shop         |
| GAME-07 | Cosmetics (avatar borders, chat effects, themes, titles)  |
| GAME-08 | Marketplace — list and trade items                        |
| GAME-09 | Progressive disclosure (XP first → marketplace later)     |
| GAME-10 | Forum participation awards XP with forum leaderboards     |
| GAME-11 | Animated avatar borders and username effects (performant) |
| GAME-12 | Equippable titles displayed throughout app                |

### Success Criteria

1. User earns XP from sending messages and forum posts, sees XP bar progress in real-time
2. User completes a daily quest and receives coin reward
3. User purchases an animated avatar border from the shop and it renders performantly
4. User views leaderboard showing top contributors in their community
5. Progressive disclosure reveals marketplace only after user reaches threshold level

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 17: Monetization

**Goal:** Revenue works — Stripe on web, Apple IAP / Google Play on mobile, forum creator payouts.

**Rationale:** Mobile MUST use Apple IAP + Google Play Billing for digital goods (App Store §3.1.1).
Forum owner revenue sharing incentivizes community creation. Webhook idempotency prevents
double-charges.

**Depends on:** Phase 16

### Requirements (10)

| REQ-ID | Requirement                                               |
| ------ | --------------------------------------------------------- |
| PAY-01 | Premium subscription tiers via Stripe (web)               |
| PAY-02 | Premium subscription via Apple IAP / Google Play (mobile) |
| PAY-03 | Premium features gated by tier                            |
| PAY-04 | Purchase virtual currency with real money                 |
| PAY-05 | Billing portal (manage subscription, invoices, plans)     |
| PAY-06 | Forum owner paid subscriptions with custom pricing        |
| PAY-07 | Forum owner paid content gates                            |
| PAY-08 | Forum owner earnings tracking and withdrawal              |
| PAY-09 | Creator analytics dashboard with fee transparency         |
| PAY-10 | Stripe webhooks with idempotent processing                |

### Success Criteria

1. User subscribes to Premium on web via Stripe and premium features unlock immediately
2. User purchases premium on mobile via Apple IAP and it syncs with web account
3. Forum owner sets up paid subscription tier and receives first payout
4. User manages subscription and views invoices in billing portal
5. Webhook processing is idempotent (duplicate events don't cause double-charges)

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 18: Rich Media & Polish

**Goal:** Voice messages, file sharing, GIFs, scheduled messages, search, animations, component
polish, scale testing, AI moderation, and feature flags.

**Rationale:** All core features exist by this point. This phase hardens: load testing reveals
bottlenecks, animation polish makes the app feel premium, AI moderation catches abuse, and rich
media completes messaging.

**Depends on:** Phases 7, 13

### Requirements (20)

| REQ-ID    | Requirement                                           |
| --------- | ----------------------------------------------------- |
| MSG-10    | Voice messages with waveform visualization            |
| MSG-11    | File and image sharing (up to tier limit)             |
| MSG-12    | GIF search and inline send                            |
| MSG-15    | Schedule messages for future delivery                 |
| MSG-20    | Search message history with filters                   |
| E2EE-05   | File attachments encrypted client-side before upload  |
| E2EE-06   | Voice message metadata encrypted E2E                  |
| SEARCH-01 | Search messages with filters (sender, date, channel)  |
| SEARCH-04 | Quick switcher (⌘K / Ctrl+K) for fast navigation      |
| SEARCH-05 | Browse/discover public communities via explore page   |
| DESIGN-03 | Component library with consistent variants/states     |
| DESIGN-04 | Smooth animations and transitions (Framer/Reanimated) |
| DESIGN-06 | Empty states, error states, skeleton loading          |
| INFRA-01  | 10,000+ concurrent WebSocket connections              |
| INFRA-04  | Load tested with realistic traffic patterns           |
| INFRA-06  | Feature flags for gradual rollout                     |
| INFRA-07  | Rate limiting on all public endpoints                 |
| MOD-05    | AI-powered content moderation                         |
| MOD-06    | Admin moderation dashboard with metrics               |
| MOD-07    | Appeal system for moderation decisions                |

### Success Criteria

1. 10,000 simulated users connect without connection failures or degraded response times
2. Page transitions and message animations feel smooth (60fps) on both platforms
3. User sends voice message with waveform and it's E2EE before upload
4. Quick switcher (⌘K) navigates to any conversation, channel, or forum instantly
5. Every screen has appropriate loading skeletons, empty states, and error recovery

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 19: Launch

**Goal:** Ship to production — App Store approved, landing page live, wallet auth for crypto users,
final QA.

**Rationale:** No new core features. Focus is on store submission (requires IAP working), landing
page, parity audit, and the two wallet auth methods deferred from core auth.

**Depends on:** Phases 15, 17, 18

### Requirements (4)

| REQ-ID   | Requirement                                    |
| -------- | ---------------------------------------------- |
| AUTH-12  | Privy auth (embedded wallet + social login)    |
| AUTH-13  | Ethereum wallet signature auth                 |
| INFRA-09 | Landing page reflects v1.0 features            |
| INFRA-10 | App Store and Google Play submissions approved |

### Success Criteria

1. iOS app downloads from App Store and Android app downloads from Google Play
2. Landing page accurately reflects v1.0 features with working signup flow
3. Web-mobile parity audit shows 100% feature coverage on both platforms
4. New user can go from landing page to first encrypted message in under 3 minutes

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Coverage Map

All 136 requirements mapped across 13 categories. Each REQ-ID appears in exactly one phase.

| Category   | Total   | P1  | P2  | P3  | P4  | P5  | P6  | P7  | P8  | P9  | P10 | P11 | P12 | P13 | P14 | P15 | P16 | P17 | P18 | P19 |
| ---------- | ------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH (14)  | 14      | —   | 3   | 3   | —   | —   | —   | 1   | 3   | 1   | —   | —   | —   | —   | —   | —   | —   | —   | —   | 2   |
| MSG (22)   | 22      | —   | —   | —   | —   | 4   | 5   | —   | —   | —   | 5   | 3   | —   | —   | —   | —   | —   | —   | 5   | —   |
| E2EE (9)   | 9       | —   | —   | —   | —   | —   | —   | 5   | —   | —   | —   | —   | 1   | 1   | —   | —   | —   | —   | 2   | —   |
| FORUM (16) | 16      | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | 9   | 8   | —   | —   | —   | —   |
| GROUP (9)  | 9       | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | 3   | 5   | —   | —   | —   | —   | —   | —   | —   |
| GAME (12)  | 12      | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | 12  | —   | —   | —   |
| CALL (8)   | 8       | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | 8   | —   | —   | —   | —   | —   | —   |
| PAY (10)   | 10      | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | 10  | —   | —   |
| NOTIF (8)  | 8       | —   | —   | —   | —   | —   | —   | —   | 2   | 6   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   |
| SEARCH (5) | 5       | —   | —   | —   | —   | —   | —   | —   | 1   | —   | —   | —   | —   | —   | 1   | —   | —   | —   | 3   | —   |
| MOD (7)    | 7       | —   | —   | —   | —   | —   | —   | —   | 1   | —   | —   | —   | 3   | —   | —   | —   | —   | —   | 3   | —   |
| DESIGN (6) | 6       | —   | —   | —   | 3   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | 3   | —   |
| INFRA (10) | 10      | 3   | —   | —   | 1   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | —   | 4   | 2   |
| **TOTAL**  | **136** | 3   | 3   | 3   | 4   | 4   | 5   | 6   | 7   | 7   | 5   | 6   | 9   | 9   | 10  | 8   | 12  | 10  | 20  | 4   |

> AUTH-14 counted under AUTH. CALL-08 and E2EE-07 are counted separately but delivered together.
> FORUM-10 and SEARCH-03 are related but distinct REQ-IDs, both in Phase 14.

**Orphan check: 0 unmapped requirements. 136/136 covered.**

---

## Milestone Versions

| Milestone | Phases | Version | What's Usable                        |
| --------- | ------ | ------- | ------------------------------------ |
| Alpha-0   | 1–4    | v0.9.48 | App works: auth, design, builds pass |
| Alpha-1   | 5–7    | v0.9.49 | E2EE messaging works end-to-end      |
| Alpha-2   | 8–10   | v0.9.50 | Social layer, notifications, extras  |
| Beta-0    | 11–12  | v0.9.51 | Groups, channels, moderation         |
| Beta-1    | 13     | v0.9.52 | Voice and video calls                |
| Beta-2    | 14–15  | v0.9.53 | Forums with full customization       |
| Beta-3    | 16     | v0.9.54 | Gamification live                    |
| RC-0      | 17     | v0.9.55 | Monetization working                 |
| RC-1      | 18     | v0.9.56 | Polish, scale, hardening             |
| Release   | 19     | v1.0.0  | App Store launch                     |

---

## Progress

| Phase | Name                    | Status              | Progress |
| ----- | ----------------------- | ------------------- | -------- |
| 1     | Infrastructure Baseline | Ready to plan       | 0%       |
| 2     | Auth Core               | Blocked by 1        | 0%       |
| 3     | Auth Advanced           | Blocked by 2        | 0%       |
| 4     | Design System & Mobile  | Blocked by 1        | 0%       |
| 5     | Message Transport       | Blocked by 2        | 0%       |
| 6     | Message Features & Sync | Blocked by 5        | 0%       |
| 7     | E2EE & Mobile Security  | Blocked by 5        | 0%       |
| 8     | Social & Profiles       | Blocked by 2        | 0%       |
| 9     | Notifications & Safety  | Blocked by 8        | 0%       |
| 10    | Message Extras          | Blocked by 6        | 0%       |
| 11    | Groups & Channels       | Blocked by 5        | 0%       |
| 12    | Roles & Moderation      | Blocked by 11       | 0%       |
| 13    | Voice & Video           | Blocked by 12       | 0%       |
| 14    | Forum Core              | Blocked by 12       | 0%       |
| 15    | Forum Customization     | Blocked by 14       | 0%       |
| 16    | Gamification            | Blocked by 14       | 0%       |
| 17    | Monetization            | Blocked by 16       | 0%       |
| 18    | Rich Media & Polish     | Blocked by 7,13     | 0%       |
| 19    | Launch                  | Blocked by 15,17,18 | 0%       |

---

_Roadmap: 19 phases · 136 requirements · 0 orphans · Generated: 2025-02-27_
