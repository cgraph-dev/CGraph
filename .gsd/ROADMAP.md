# CGraph Roadmap — v0.9.48 → v1.0.0

> Generated: 2026-02-27 | Phases: 10 | Requirements: 136 mapped | Depth: Comprehensive

---

## Phase Overview

| #   | Phase              | Version | Goal                                                    | Reqs | Depends On |
| --- | ------------------ | ------- | ------------------------------------------------------- | ---- | ---------- |
| 1   | Foundation         | v0.9.48 | Fix auth, restore real-time, sync versions, design base | 14   | —          |
| 2   | Messaging Core     | v0.9.49 | E2EE pipeline, message flow, receipts, offline sync     | 15   | Phase 1    |
| 3   | Social Connections | v0.9.50 | Friends, presence, notifications, onboarding            | 19   | Phase 2    |
| 4   | Groups & Channels  | v0.9.51 | Group creation, roles, permissions, automod             | 16   | Phase 2    |
| 5   | Voice & Video      | v0.9.52 | 1:1 calls, group calls (LiveKit), screen sharing        | 9    | Phase 4    |
| 6   | Forums             | v0.9.53 | Full forum suite, 50+ customizations, plugins           | 17   | Phase 4    |
| 7   | Gamification       | v0.9.54 | XP, quests, battle pass, economy, cosmetics             | 12   | Phase 6    |
| 8   | Monetization       | v0.9.55 | Stripe, mobile IAP, creator payouts                     | 10   | Phase 7    |
| 9   | Scale & Polish     | v0.9.56 | Load testing, animations, AI moderation, polish         | 20   | Phase 5–8  |
| 10  | Launch             | v1.0.0  | App Store, landing page, parity audit, final QA         | 4    | Phase 9    |

**Dependency Graph:**

```
Phase 1 (Foundation)
  └─► Phase 2 (Messaging Core)
       ├─► Phase 3 (Social Connections)
       ├─► Phase 4 (Groups & Channels)
       │    ├─► Phase 5 (Voice & Video)
       │    └─► Phase 6 (Forums)
       │         └─► Phase 7 (Gamification)
       │              └─► Phase 8 (Monetization)
       └───────────────────────────────►┐
                     Phases 5–8 ────────┤
                                        ▼
                              Phase 9 (Scale & Polish)
                                        │
                                        ▼
                              Phase 10 (Launch)
```

---

## Phase 1: Foundation

**Version:** v0.9.48 **Goal:** Make the app functional — auth works, real-time works, builds pass,
versions aligned, design system established. **Rationale:** Every feature depends on authentication
and real-time WebSocket infrastructure. The version drift between packages means shared types are
unreliable. Without fixing this layer, no reconnection work is safe.

### Requirements (14)

| REQ-ID    | Requirement                                             |
| --------- | ------------------------------------------------------- |
| AUTH-01   | Register with email/password on web and mobile          |
| AUTH-02   | Email verification on both platforms                    |
| AUTH-03   | Password reset via email link on both platforms         |
| AUTH-04   | OAuth (Google, Apple) on both platforms                 |
| AUTH-05   | TOTP 2FA with recovery codes on both platforms          |
| AUTH-07   | Manage active sessions and revoke devices               |
| AUTH-14   | Token refresh mutex (concurrent request handling)       |
| DESIGN-01 | Design system with consistent tokens                    |
| DESIGN-02 | Color palette with WCAG AA contrast ratios              |
| DESIGN-05 | Dark mode / light mode with system preference detection |
| INFRA-02  | All package versions synced to 0.9.47 baseline          |
| INFRA-03  | Backend routes audited — erroring routes fixed          |
| INFRA-05  | Reconnection with exponential backoff and jitter        |
| INFRA-08  | Mobile app builds for iOS and Android (Expo EAS)        |

### Success Criteria

1. User can register, log in, and stay logged in across page reloads on web and mobile
2. User can see online/offline status updates in real-time after connecting
3. App loads with consistent design system (colors, typography, dark/light mode toggle works)
4. Mobile app builds and runs on iOS simulator and Android emulator without errors

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 2: Messaging Core

**Version:** v0.9.49 **Goal:** End-to-end encrypted messaging works reliably — the primary product
value. **Rationale:** E2EE is CGraph's #1 differentiator. The crypto library exists (PQXDH + Triple
Ratchet), but the integration pipeline — encrypt before send, decrypt on receive — is the
highest-complexity task. This phase wires E2EE to the chat module. **Depends on:** Phase 1

### Requirements (15)

| REQ-ID  | Requirement                                               |
| ------- | --------------------------------------------------------- |
| AUTH-06 | Biometric auth (Face ID / fingerprint) on mobile          |
| MSG-01  | Send/receive 1:1 text messages in real-time               |
| MSG-04  | Edit messages with history visible                        |
| MSG-05  | Delete messages (soft-delete with indicator)              |
| MSG-06  | Typing indicators                                         |
| MSG-07  | Reply/quote specific messages                             |
| MSG-09  | React to messages with emoji                              |
| MSG-18  | Read receipts (with opt-out)                              |
| MSG-19  | Delivery receipts                                         |
| MSG-22  | Messages sync across devices (WatermelonDB on mobile)     |
| E2EE-01 | 1:1 E2EE with PQXDH + Triple Ratchet                      |
| E2EE-03 | Verify contact identity via safety numbers / QR code      |
| E2EE-04 | E2EE key sync for new devices                             |
| E2EE-08 | Client-side key storage (Keychain/Keystore/encrypted web) |
| E2EE-09 | E2EE bootstrap automatically after login                  |

### Success Criteria

1. User sends a 1:1 message on web and it appears in real-time on mobile (and vice versa)
2. User can verify contact identity via safety numbers screen
3. Messages display encryption lock icon indicating E2EE protection
4. User sees typing indicator when contact is composing a message
5. User edits a message and edit history is visible to recipient

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 3: Social Connections

**Version:** v0.9.50 **Goal:** Friends, presence, notifications, onboarding, and profile features
make CGraph a social app. **Rationale:** With messaging working, the social layer makes the app
usable for daily communication. Onboarding converts new users into engaged users. Push notifications
keep users returning. **Depends on:** Phase 2

### Requirements (19)

| REQ-ID    | Requirement                                             |
| --------- | ------------------------------------------------------- |
| AUTH-08   | Account deletion (GDPR) with data export                |
| AUTH-09   | Onboarding wizard (avatar → find friends → community)   |
| AUTH-10   | Profile setup (display name, avatar, bio)               |
| AUTH-11   | QR code login (scan from mobile to log into web)        |
| MSG-08    | Forward messages across conversations                   |
| MSG-13    | Pin messages in conversations                           |
| MSG-14    | Save/bookmark messages                                  |
| MSG-16    | Link previews with OG metadata                          |
| MSG-17    | Disappearing messages with configurable timer           |
| NOTIF-01  | Mobile push notifications (Expo → APNs/FCM)             |
| NOTIF-02  | Web push notifications                                  |
| NOTIF-03  | In-app notification center with activity feed           |
| NOTIF-04  | Notification preferences per conversation/channel/forum |
| NOTIF-05  | Online/offline presence for contacts                    |
| NOTIF-06  | Custom status text                                      |
| NOTIF-07  | Do Not Disturb mode with schedule                       |
| NOTIF-08  | Email digest for lapsed engagement                      |
| SEARCH-02 | Search users by name/username                           |
| MOD-03    | Block users (messaging, presence, search blocked)       |

### Success Criteria

1. New user completes onboarding wizard and has a profile, friends, and a community within 2 minutes
2. User receives push notification on mobile when mentioned in a conversation
3. User sets status to "Do Not Disturb" and stops receiving notifications
4. User blocks a contact and they disappear from search, presence, and messaging

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 4: Groups & Channels

**Version:** v0.9.51 **Goal:** Groups, channels, roles, permissions, and moderation tools work
across platforms. **Rationale:** Groups and channels are where CGraph becomes a community platform.
The permission system must work correctly before forums and gamification can layer on top. Group
E2EE key distribution is prerequisite for encrypted group features. **Depends on:** Phase 2

### Requirements (16)

| REQ-ID   | Requirement                                         |
| -------- | --------------------------------------------------- |
| MSG-02   | Send/receive group messages in real-time            |
| MSG-03   | Send messages in channels within groups             |
| MSG-21   | Message threads in channels                         |
| GROUP-01 | Create groups with avatar, description, settings    |
| GROUP-02 | Create channels with categories within groups       |
| GROUP-03 | Define roles with granular permissions              |
| GROUP-04 | Per-channel permission overrides                    |
| GROUP-05 | Invite via invite link                              |
| GROUP-06 | Ban/kick members with reason logging                |
| GROUP-07 | Custom emoji uploaded by members                    |
| GROUP-08 | Automod rules (spam, word, link filters)            |
| GROUP-09 | Discover and browse public groups via explore page  |
| E2EE-02  | Group messages E2EE with key distribution           |
| MOD-01   | Report content (messages, posts, users)             |
| MOD-02   | Moderators review reports and take actions          |
| MOD-04   | Automod filters spam, banned words, malicious links |

### Success Criteria

1. User creates a group, invites friends, and messages in channels with real-time delivery
2. Group owner assigns roles and a restricted member cannot post in a read-only channel
3. Automod silently filters a spam message without moderator intervention
4. User discovers and joins a public group from the explore page

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 5: Voice & Video

**Version:** v0.9.52 **Goal:** Voice and video calls work across platforms with E2EE — 1:1 via
WebRTC, group via LiveKit. **Rationale:** Calls complete the communication suite. LiveKit SFU
enables group calls beyond 2 participants. E2EE for calls is critical for the privacy-first
positioning. **Depends on:** Phase 4

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
| E2EE-07 | Voice/video call media E2EE                  |

### Success Criteria

1. User makes a 1:1 video call from web to mobile with clear audio and video
2. Three users join a group voice call via LiveKit with no echo or feedback
3. User shares their screen during a group call and others see it in real-time
4. Call media is end-to-end encrypted (verified via encryption indicator)

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 6: Forums

**Version:** v0.9.53 **Goal:** Full MyBB-class forum suite with 50+ customization options, plugins,
real-time updates. **Rationale:** Forums are CGraph's differentiator — community features inside a
messaging app. The 50+ customization claim must be real and enumerable. Real-time forum updates tie
it to the Phoenix Channels infrastructure. **Depends on:** Phase 4

### Requirements (17)

| REQ-ID    | Requirement                                            |
| --------- | ------------------------------------------------------ |
| FORUM-01  | Create and manage forums with admin controls           |
| FORUM-02  | Boards/sub-forums with categories                      |
| FORUM-03  | Threads with BBCode formatting and attachments         |
| FORUM-04  | Post, reply, comment with nested discussion            |
| FORUM-05  | Polls within threads                                   |
| FORUM-06  | Upvote/downvote with reputation impact                 |
| FORUM-07  | 50+ customization options (themes, CSS, layouts, etc.) |
| FORUM-08  | Built-in plugin system                                 |
| FORUM-09  | Real-time forum updates (new posts, replies, votes)    |
| FORUM-10  | Full-text search across threads and posts              |
| FORUM-11  | Forum moderation tools (reports, actions, automod)     |
| FORUM-12  | Per-board permissions and permission templates         |
| FORUM-13  | Custom emoji packs and post icons                      |
| FORUM-14  | RSS feeds for boards and threads                       |
| FORUM-15  | User groups with secondary group membership            |
| FORUM-16  | Ranking engine and leaderboard tied to gamification    |
| SEARCH-03 | Search forum threads and posts                         |

### Success Criteria

1. User creates a forum, customizes theme/CSS/colors, and it renders as configured
2. User creates a thread with BBCode formatting and embedded poll, receives replies in real-time
3. Forum admin installs a plugin and it activates immediately
4. User searches forum content and finds relevant threads ranked by relevance

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 7: Gamification

**Version:** v0.9.54 **Goal:** XP, achievements, quests, battle pass, economy, marketplace, and
cosmetics all functional. **Rationale:** Gamification is CGraph's stickiness engine — no competitor
comes close. Economy rules (caps, diminishing returns) must be set before any user earns XP.
Progressive disclosure reveals complexity gradually. **Depends on:** Phase 6

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

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 8: Monetization

**Version:** v0.9.55 **Goal:** Revenue works — Stripe on web, Apple IAP / Google Play on mobile,
forum owner payouts. **Rationale:** Payments touch every platform differently. Mobile MUST use Apple
IAP + Google Play Billing for digital goods (App Store §3.1.1). Forum owner revenue makes creation
incentivized. **Depends on:** Phase 7

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

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 9: Scale & Polish

**Version:** v0.9.56 **Goal:** Platform handles 10K+ concurrent users, every screen is polished,
remaining features hardened. **Rationale:** All core features exist by this point. This phase
hardens: load testing reveals bottlenecks, animation polish makes the app feel premium, AI
moderation catches abuse, and rich media features (voice messages, GIFs, files) complete the
messaging experience. **Depends on:** Phases 5, 6, 7, 8

### Requirements (20)

| REQ-ID    | Requirement                                                    |
| --------- | -------------------------------------------------------------- |
| MSG-10    | Voice messages with waveform visualization                     |
| MSG-11    | File and image sharing (up to tier limit)                      |
| MSG-12    | GIF search and inline send                                     |
| MSG-15    | Schedule messages for future delivery                          |
| MSG-20    | Search message history with filters                            |
| E2EE-05   | File attachments encrypted client-side before upload           |
| E2EE-06   | Voice message metadata encrypted E2E                           |
| SEARCH-01 | Search messages with filters (sender, date, channel)           |
| SEARCH-04 | Quick switcher (⌘K / Ctrl+K) for fast navigation               |
| SEARCH-05 | Browse/discover public communities via explore page            |
| MOD-05    | AI-powered content moderation flags toxic content              |
| MOD-06    | Admin moderation dashboard with metrics                        |
| MOD-07    | Appeal system for moderation decisions                         |
| DESIGN-03 | Component library with consistent variants and states          |
| DESIGN-04 | Smooth animations and transitions (Framer Motion / Reanimated) |
| DESIGN-06 | Empty states, error states, skeleton loading patterns          |
| INFRA-01  | 10,000+ concurrent WebSocket connections                       |
| INFRA-04  | Load tested with realistic traffic patterns                    |
| INFRA-06  | Feature flags for gradual rollout                              |
| INFRA-07  | Rate limiting on all public endpoints                          |

### Success Criteria

1. 10,000 simulated users connect simultaneously without connection failures or degraded response
   times
2. Page transitions and message animations feel smooth (60fps) on both platforms
3. AI moderation flags toxic content before human moderators see it
4. Every screen has appropriate loading skeletons, empty states, and error recovery
5. Quick switcher (⌘K) navigates to any conversation, channel, or forum instantly

### Plans

| Plan | Scope | Status |
| ---- | ----- | ------ |
| TBD  | TBD   | —      |

---

## Phase 10: Launch

**Version:** v1.0.0 **Goal:** Ship to production — App Store approved, landing page live, final QA
complete. **Rationale:** No new features. Focus is on App Store submission (requires IAP working),
landing page, parity audit, and monitoring. Wallet auth deferred to this phase as non-critical for
core value. **Depends on:** Phase 9

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

All 136 requirements mapped across 13 categories:

| Category   | Total   | Ph1    | Ph2    | Ph3    | Ph4    | Ph5     | Ph6    | Ph7    | Ph8    | Ph9    | Ph10  |
| ---------- | ------- | ------ | ------ | ------ | ------ | ------- | ------ | ------ | ------ | ------ | ----- |
| AUTH (14)  | 14      | 7      | 1      | 4      | —      | —       | —      | —      | —      | —      | 2     |
| MSG (22)   | 22      | —      | 9      | 5      | 3      | —       | —      | —      | —      | 5      | —     |
| E2EE (9)   | 9       | —      | 5      | —      | 1      | 2       | —      | —      | —      | 1      | —     |
| FORUM (16) | 16      | —      | —      | —      | —      | —       | 16     | —      | —      | —      | —     |
| GROUP (9)  | 9       | —      | —      | —      | 9      | —       | —      | —      | —      | —      | —     |
| GAME (12)  | 12      | —      | —      | —      | —      | —       | —      | 12     | —      | —      | —     |
| CALL (8)   | 8       | —      | —      | —      | —      | 8       | —      | —      | —      | —      | —     |
| PAY (10)   | 10      | —      | —      | —      | —      | —       | —      | —      | 10     | —      | —     |
| NOTIF (8)  | 8       | —      | —      | 8      | —      | —       | —      | —      | —      | —      | —     |
| SEARCH (5) | 5       | —      | —      | 1      | —      | —       | 1      | —      | —      | 3      | —     |
| MOD (7)    | 7       | —      | —      | 1      | 3      | —       | —      | —      | —      | 3      | —     |
| DESIGN (6) | 6       | 3      | —      | —      | —      | —       | —      | —      | —      | 3      | —     |
| INFRA (10) | 10      | 4      | —      | —      | —      | —       | —      | —      | —      | 4      | 2     |
| **TOTAL**  | **136** | **14** | **15** | **19** | **16** | **10**¹ | **17** | **12** | **10** | **20** | **4** |

¹ Phase 5 has 9 unique REQ-IDs (CALL-08 and E2EE-07 cover the same capability). Counted by distinct
REQ-IDs = 9.

**Orphan check: 0 unmapped requirements. 136/136 covered.**

---

## Progress

| Phase | Name               | Status         | Progress |
| ----- | ------------------ | -------------- | -------- |
| 1     | Foundation         | Ready to plan  | 0%       |
| 2     | Messaging Core     | Blocked by 1   | 0%       |
| 3     | Social Connections | Blocked by 2   | 0%       |
| 4     | Groups & Channels  | Blocked by 2   | 0%       |
| 5     | Voice & Video      | Blocked by 4   | 0%       |
| 6     | Forums             | Blocked by 4   | 0%       |
| 7     | Gamification       | Blocked by 6   | 0%       |
| 8     | Monetization       | Blocked by 7   | 0%       |
| 9     | Scale & Polish     | Blocked by 5–8 | 0%       |
| 10    | Launch             | Blocked by 9   | 0%       |

---

_Roadmap generated: 2026-02-27 | Core value: Secure real-time communication that works end-to-end_
