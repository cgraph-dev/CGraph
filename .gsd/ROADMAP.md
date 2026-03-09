# CGraph Roadmap — v0.9.48 → v1.0.0

> Generated: 2025-02-27 | Phases: 19 | Requirements: 136 mapped | Depth: Comprehensive
>
> Design principle: Small focused phases (3–9 reqs) give execution agents maximum context budget per
> phase. Early phases are granular; later phases stay natural. Every phase delivers one verifiable
> capability.

---

## Phase Overview

| #   | Phase                   | Goal                                               | Reqs | Depends On                              |
| --- | ----------------------- | -------------------------------------------------- | ---- | --------------------------------------- |
| 1   | Infrastructure Baseline | Monorepo builds, versions aligned, routes healthy  | 3    | — ✅ Complete (2026-02-27)              |
| 2   | Auth Core               | Register, verify, login, token refresh — all work  | 4    | Phase 1 ✅ Complete (2026-02-28)        |
| 3   | Auth Advanced           | OAuth, 2FA, session management complete            | 3    | Phase 2 ✅ Complete (2026-02-28)        |
| 4   | Design System & Mobile  | Professional visuals, mobile builds pass           | 4    | Phase 1 ✅ Complete (2026-02-28)        |
| 5   | Message Transport       | Real-time 1:1 messaging with indicators & receipts | 4    | Phase 2 ✅ Complete (2026-02-28)        |
| 6   | Message Features & Sync | Edit, delete, reply, react, cross-device sync      | 5    | Phase 5 ✅ Complete (2026-02-28)        |
| 7   | E2EE & Mobile Security  | End-to-end encryption + biometric auth             | 6    | Phase 5 ✅ Complete (2026-02-28)        |
| 8   | Social & Profiles       | Onboarding, profiles, presence, user search        | 7    | Phase 2 ✅ Complete (2026-03-01)        |
| 9   | Notifications & Safety  | Push, notification center, DND, account deletion   | 7    | Phase 8 ✅ — **Complete** (2026-03-01)  |
| 10  | Message Extras          | Forward, pin, bookmark, link preview, disappearing | 5    | Phase 6 ✅ — **Complete** (2026-03-01)  |
| 11  | Groups & Channels       | Group creation, channels, invites, group messaging | 7    | Phase 5 ✅ Complete (2026-03-01)        |
| 12  | Roles & Moderation      | Permissions, moderation tools, group E2EE          | 9    | Phase 11 ✅ Complete (2026-03-01)       |
| 13  | Voice & Video           | 1:1 and group calls, screen share, call E2EE       | 9    | Phase 12 ✅                             |
| 14  | Forum Core              | Boards, threads, posts, polls, real-time updates   | 9    | Phase 12 ✅                             |
| 15  | Forum Customization     | 50+ options, plugins, advanced features            | 8    | Phase 14 ✅ Complete (2026-03-02)       |
| 16  | Gamification            | XP, quests, battle pass, shop, cosmetics           | 12   | Phase 14 ✅ Complete (2026-03-02)       |
| 17  | Monetization            | Stripe, mobile IAP, creator payouts                | 10   | Phase 16 ✅ Complete (2026-03-02)       |
| 18  | Rich Media & Polish     | Voice msgs, files, GIFs, search, animations, scale | 20   | Phase 7 ✅, 13 ✅ Complete (2026-03-02) |
| 19  | Launch                  | App Store, landing page, wallet auth, final QA     | 4    | Phase 15,17,18                          |
| ... | *Phases 20-25*          | *See below — all complete*                         |      |                                         |
| 26  | The Great Delete        | Remove entire gamification system from codebase     | 4    | Phase 25 ✅                             |
| 27  | Fix What Remains        | Consolidate themes, fix achievements, clean stores  | 2    | Phase 26 ✅                             |
| 28  | Complete Cosmetics      | Nameplate, profile effects, border unification      | 3    | Phase 27 ✅                             |
| 29  | Secret Chat             | E2E encrypted secret chat UI + privacy features     | 2    | Phase 26                                |
| 30  | Pulse Reputation        | Community-scoped reputation system (backend + UI)   | 2    | Phase 26                                |
| 31  | Forums + Discovery      | Forums, feed ranking, frequency-based discovery     | 2    | Phase 30                                |
| 32  | Nodes Monetization      | Virtual currency wallet, tipping, content unlock    | 2    | Phase 31                                |

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

Phases 20–25 ──────────────────────────────────────► All Complete
                                                                │
                                           Phase 26 (Great Delete)
                                          ┌─────────┼─────────┐
                                          ▼         ▼         ▼
                              Phase 27        Phase 29     Phase 30
                            (Fix What        (Secret      (Pulse
                             Remains)        Chat)        Reputation)
                                │                             │
                                ▼                             ▼
                              Phase 28               Phase 31 (Forums
                            (Complete                + Discovery)
                             Cosmetics)                       │
                                                              ▼
                                                   Phase 32 (Nodes
                                                    Monetization)
```

**Parallel tracks after Phase 2:**

- Track A: Messaging → Features → E2EE → Rich Media
- Track B: Social → Notifications
- Track C: Groups → Permissions → Voice/Forums → Gamification → Monetization

---

## Phase 1: Infrastructure Baseline ✅

**Completed:** 2026-02-27 | **Plans:** 3/3 | **Verification:** Passed (12/12)

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

## Phase 2: Auth Core ✅

**Completed:** 2026-02-28 | **Plans:** 3/3 | **Verification:** Passed (11/11)

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

**Plans:** 3 plans in 2 waves

Plans:

- [x] 02-01-PLAN.md — Backend auth fixes (password reset email, sessions field fix, cleanup)
- [x] 02-02-PLAN.md — Frontend auth completeness (web validation, mobile deep linking)
- [x] 02-03-PLAN.md — Token refresh wiring with TDD (TokenManager, rotation, theft detection)

| Plan  | Scope                                                                     | Wave | Status                   |
| ----- | ------------------------------------------------------------------------- | ---- | ------------------------ |
| 02-01 | Backend Auth Fixes — password reset email, sessions fields, cleanup       | 1    | ✅ Complete (2026-02-28) |
| 02-02 | Frontend Auth Completeness — web password validation, mobile deep linking | 1    | ✅ Complete (2026-02-28) |
| 02-03 | Token Refresh Wiring (TDD) — TokenManager, rotation, theft detection      | 2    | ✅ Complete (2026-02-28) |

---

## Phase 3: Auth Advanced ✅

**Completed:** 2026-02-28 | **Plans:** 3/3 | **Verification:** Passed (16/16) | **UAT:** Passed
(18/18)

**Goal:** OAuth, 2FA, and session management complete on all platforms.

**Rationale:** OAuth reduces sign-up friction. 2FA protects accounts. Session management gives users
control. Backend for all three is fully implemented — the gaps are mobile 2FA screens (zero exist)
and frontend session management UI (missing on both platforms).

**Depends on:** Phase 2 ✅

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

| Plan  | Scope                                                                          | Wave | Status                   |
| ----- | ------------------------------------------------------------------------------ | ---- | ------------------------ |
| 03-01 | 2FA Login Gate (TDD) — backend gates login on TOTP, temp token + verify action | 1    | ✅ Complete (2026-02-28) |
| 03-02 | Frontend 2FA Login UI — web TOTP form + mobile TwoFactorVerifyScreen           | 2    | ✅ Complete (2026-02-28) |
| 03-03 | Session-Token Bridge (TDD) — revoke session also revokes tokens in Store       | 1    | ✅ Complete (2026-02-28) |

---

## Phase 4: Design System & Mobile ✅

**Completed:** 2026-02-28 | **Plans:** 3/3 | **Verification:** Passed (12/12) | **UAT:** Passed
(16/16)

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

| Plan  | Scope                                                                        | Wave | Status                   |
| ----- | ---------------------------------------------------------------------------- | ---- | ------------------------ |
| 04-01 | Unified Design Tokens + WCAG Audit — single token source, fix contrast pairs | 1    | ✅ Complete (2026-02-28) |
| 04-02 | Web Light Mode — make CSS theme-aware, light mode actually renders           | 2    | ✅ Complete (2026-02-28) |
| 04-03 | Mobile EAS Build Pipeline — fix config, verify builds, add scripts           | 1    | ✅ Complete (2026-02-28) |

---

## Phase 5: Message Transport ✅

**Completed:** 2026-02-28 | **Plans:** 2/2 | **Verification:** Passed (12/12 + 15 integration tests)

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

| Plan  | Scope                                                                          | Wave | Status                   |
| ----- | ------------------------------------------------------------------------------ | ---- | ------------------------ |
| 05-01 | Web Real-Time Message Transport — socket→store→UI wiring for receipts + typing | 1    | ✅ Complete (2026-02-28) |
| 05-02 | Mobile Real-Time Message Transport — receipt ACK, status display, auto-read    | 1    | ✅ Complete (2026-02-28) |

---

## Phase 6: Message Features & Sync ✅

**Completed:** 2026-02-28 | **Plans:** 5/5 | **UAT:** Passed (13/13, 2 fixed)

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

| Plan  | Scope                                                                             | Wave | Status  |
| ----- | --------------------------------------------------------------------------------- | ---- | ------- |
| 06-01 | Edit History Backend + Shared Types — MessageEdit record wiring, EditHistory type | 1    | ✅ Done |
| 06-02 | Soft-Delete Indicator — "[Message deleted]" placeholder on web + mobile           | 1    | ✅ Done |
| 06-03 | Reply & Reaction Verification — Confirm MSG-07 + MSG-09 end-to-end                | 1    | ✅ Done |
| 06-04 | Edit History UI — History viewer (web+mobile), mobile edit form                   | 2    | ✅ Done |
| 06-05 | WatermelonDB Bridge — Wire chatStore ↔ WatermelonDB for offline sync              | 3    | ✅ Done |

---

## Phase 7: E2EE & Mobile Security ✅

**Completed:** 2026-02-28 | **Plans:** 8/8 | **Verification:** Passed (6/6)

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

**Plans:** 8 plans in 4 waves

Plans:

- [x] 07-01-PLAN.md — Enable PQXDH + Triple Ratchet + auto-bootstrap on web
- [x] 07-02-PLAN.md — Wire PQ-bridge + auto-bootstrap on mobile
- [x] 07-03-PLAN.md — Biometric auth gate + key protection on mobile
- [x] 07-04-PLAN.md — Decrypt-on-receive pipeline + lock icon on web
- [x] 07-05-PLAN.md — Decrypt-on-receive pipeline + lock icon on mobile
- [x] 07-06-PLAN.md — Safety number verification screens (web + mobile)
- [x] 07-07-PLAN.md — Multi-device key sync backend (cross-signing + sync API)
- [x] 07-08-PLAN.md — Multi-device key sync client + device management UI

| Plan  | Scope                                                            | Wave | Status                   |
| ----- | ---------------------------------------------------------------- | ---- | ------------------------ |
| 07-01 | Web PQXDH + Triple Ratchet enable + auto-bootstrap               | 1    | ✅ Complete (2026-02-28) |
| 07-02 | Mobile PQ-bridge wiring + auto-bootstrap                         | 1    | ✅ Complete (2026-02-28) |
| 07-03 | Biometric auth gate + E2EE key protection                        | 1    | ✅ Complete (2026-02-28) |
| 07-04 | Web decrypt-on-receive + encryption lock icon                    | 2    | ✅ Complete (2026-02-28) |
| 07-05 | Mobile decrypt-on-receive + encryption lock icon                 | 2    | ✅ Complete (2026-02-28) |
| 07-06 | Safety number verification (web dialog + mobile screen + QR)     | 3    | ✅ Complete (2026-02-28) |
| 07-07 | Multi-device key sync backend (cross-signing, trust chain, sync) | 3    | ✅ Complete (2026-02-28) |
| 07-08 | Multi-device key sync client (protocol, UI, key change banners)  | 4    | ✅ Complete (2026-02-28) |

---

## Phase 8: Social & Profiles ✅ Complete (2026-03-01)

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

**Plans:** 7 plans in 1 wave (all parallel — independent vertical slices)

- [x] 08-01-PLAN.md — User search UI (web + mobile) wired to existing Meilisearch backend
      (SEARCH-02)
- [x] 08-02-PLAN.md — Contacts presence list with online/offline indicators (NOTIF-05)
- [x] 08-03-PLAN.md — Custom status persistence + expiry via Oban (NOTIF-06)
- [x] 08-04-PLAN.md — Profile edit with avatar cropping on web + mobile (AUTH-10)
- [x] 08-05-PLAN.md — Onboarding wizard enhancement: find friends + community steps (AUTH-09)
- [x] 08-06-PLAN.md — Block enforcement across messaging, presence, profile, search (MOD-03)
- [x] 08-07-PLAN.md — QR code login protocol: backend + web + mobile (AUTH-11)

| Plan  | Scope                                                   | Wave | Depends | Status  |
| ----- | ------------------------------------------------------- | ---- | ------- | ------- |
| 08-01 | User search UI (web + mobile) — SEARCH-02               | 1    | —       | ✅ Done |
| 08-02 | Contacts presence list with indicators — NOTIF-05       | 1    | —       | ✅ Done |
| 08-03 | Custom status persistence + expiry — NOTIF-06           | 1    | —       | ✅ Done |
| 08-04 | Profile edit with avatar crop — AUTH-10                 | 1    | —       | ✅ Done |
| 08-05 | Onboarding wizard: find friends + community — AUTH-09   | 2    | 03      | ✅ Done |
| 08-06 | Block enforcement (messaging/presence/profile) — MOD-03 | 2    | 03      | ✅ Done |
| 08-07 | QR code login protocol (full stack) — AUTH-11           | 1    | —       | ✅ Done |

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

### Discovery Findings

- **NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-08, AUTH-08 are FULLY IMPLEMENTED** — backend services
  (PushService, ExpoClient, APNsClient, FCMClient, WebPushClient), frontend hooks
  (usePushNotifications, web-push service worker), notification center (full page + stores + API),
  email digest workers, and account deletion (soft → hard delete, data export, GDPR UI) all exist
  and are substantive.
- **NOTIF-04 needs per-conversation/channel preferences** — global toggles exist but no per-target
  mute/mode.
- **NOTIF-07 needs schedule UI + timezone** — backend `quiet_hours` fields exist but no UI, and
  logic uses UTC only.

### Plans

| Plan  | Scope                                                              | Wave | Status |
| ----- | ------------------------------------------------------------------ | ---- | ------ |
| 09-01 | Per-conversation & per-channel notification preferences (NOTIF-04) | 1    | —      |
| 09-02 | DND schedule UI & timezone-aware quiet hours (NOTIF-07)            | 1    | —      |
| 09-03 | Notification wiring audit & gap fixes (NOTIF-01/02/03/08)          | 2    | —      |
| 09-04 | Account deletion polish & phase integration (AUTH-08)              | 2    | —      |

---

## Phase 10: Message Extras

**Completed:** 2026-03-01 | **Plans:** 3/3 | **Requirements:** 5/5

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

### Discovery Findings

- **MSG-13 (Pin) is FULLY IMPLEMENTED** — backend schema (`is_pinned`, `pinned_at`, `pinned_by`),
  dedicated `channel_pinned_messages` table, controllers with authorization, web pin in action
  menu + pinned-messages-panel, mobile pinned-messages-bar + action menu toggle.
- **MSG-14 (Bookmark) is FULLY IMPLEMENTED** — `saved_messages` table/schema/context/controller, web
  saved-messages page (187 lines), mobile saved-messages-screen (342 lines). **Gap:** No "Save"
  button in message action menus on either platform.
- **MSG-17 (Disappearing) is FULLY IMPLEMENTED** — `expires_at` on messages, `message_ttl` on
  conversations, Oban cron worker, web toggle. **Gap:** No mobile toggle, no timer indicator on
  messages.
- **MSG-08 (Forward) is PARTIAL** — Web has forward modal (276 lines) + handler, but uses
  client-side re-send (no server tracking). Mobile has no forward UI. No `forwarded_from` schema
  field.
- **MSG-16 (Link Preview) is PARTIAL** — `link_preview :map` field on messages, web component (82
  lines), mobile component (149 lines), validation. **Gap:** No server-side OG metadata fetching —
  clients must send preview data.

### Plans

| Plan  | Scope                                                            | Wave | Status      |
| ----- | ---------------------------------------------------------------- | ---- | ----------- |
| 10-01 | Message forwarding full stack — backend API + mobile UI (MSG-08) | 1    | ✅ Complete |
| 10-02 | Server-side link preview engine with OG metadata (MSG-16)        | 1    | ✅ Complete |
| 10-03 | Extras polish — save buttons, mobile disappearing, shared types  | 2    | ✅ Complete |

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

| Plan  | Scope                                                      | Wave | Status      |
| ----- | ---------------------------------------------------------- | ---- | ----------- |
| 11-01 | WebSocket topic alignment + group channel messaging E2E    | 1    | ✅ Complete |
| 11-02 | Group CRUD, channels, and invites E2E wiring               | 1    | ✅ Complete |
| 11-03 | Explore page for group discovery + channel message threads | 2    | ✅ Complete |

---

## Phase 12: Roles & Moderation ✅

**Completed:** 2026-03-01 | **Plans:** 4/4 | **Commits:** 9

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

| Plan  | Scope                                                             | Wave | Status   |
| ----- | ----------------------------------------------------------------- | ---- | -------- |
| 12-01 | Roles & permissions hardening — effective permissions + overrides | 1    | Complete |
| 12-02 | Ban/kick + content reporting — group moderation pipeline          | 1    | Complete |
| 12-03 | Automod enforcement pipeline — runtime message filtering          | 2    | Complete |
| 12-04 | Custom emoji permissions + group E2EE key distribution            | 2    | Complete |

---

## Phase 13: Voice & Video

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

### Discovery Findings

- **FORUM-01 (Forum CRUD):** ~95% complete — Forum schema (444L), Core context (95L + sub-modules),
  ForumController (399L), hierarchy controller, full routes. Gap: no backend admin-specific bulk
  operations.
- **FORUM-02 (Boards/Categories):** ~90% complete — Board schema (103L) with sub-board nesting,
  Category schema (48L), Boards context (103L), Categories context (85L), BoardController (119L),
  routes. Gap: category CRUD not in web store, board reorder endpoint not routed.
- **FORUM-03 (Threads/BBCode/Attachments):** ~70% complete — Thread schema (162L), ThreadPost schema
  (127L), ThreadAttachment schema (110L), full context functions. **Gap: BBCode parser is a STUB**
  (only html_escape + newline→br). No attachment upload controller/routes.
- **FORUM-04 (Posts/Comments/Nested Discussion):** ~90% complete — Two parallel systems:
  reddit-style (Post 207L + Comment 133L) and MyBB-style (ThreadPost 127L). Full contexts with
  nested comment support (depth max 10). Gap: no editComment/deleteComment store actions on web, no
  markBestAnswer.
- **FORUM-05 (Polls):** ~85% complete — ThreadPoll schema (81L), PollVote schema (33L), Polls
  context (110L) with create/vote/results. **Gap: No PollController or routes** — polls unreachable
  via HTTP.
- **FORUM-06 (Voting/Reputation):** ~80% complete — Vote system fully implemented (voting.ex 148L,
  forum_voting.ex 225L, ranking_engine.ex 253L). **Gap: votes update entity score but NEVER update
  ForumMember.reputation fields**.
- **FORUM-09 (Real-time):** ~85% complete — ForumChannel (220L) + ThreadChannel (406L). Web hooks
  fully wired. Gap: no BoardChannel, no poll vote broadcast, no post edit broadcast.
- **FORUM-10/SEARCH-03 (Full-text Search):** ~40% complete — search.ex (63L) uses ILIKE only on
  reddit-style Posts. **Gap: No tsvector/GIN indexes, no Thread/ThreadPost search, no relevance
  ranking**. Web search component has full UI but no store action. Mobile search hits old endpoint.
- **Overall:** 64+ backend files (~7,500L schemas + contexts), 8 controllers (~2,200L), 2 channels
  (626L), web store (60+ actions, ~43,000L total), mobile 10 screens + 5 components (~5,000L).
  ~80-85% built.

### Plans

| Plan  | Scope                                                                     | Wave | Depends   | Status |
| ----- | ------------------------------------------------------------------------- | ---- | --------- | ------ |
| 14-01 | BBCode parser + poll API + attachment uploads (FORUM-03, FORUM-05)        | 1    | —         | —      |
| 14-02 | Full-text search + reputation propagation (FORUM-10, SEARCH-03, FORUM-06) | 1    | —         | —      |
| 14-03 | Web forum wiring — search, categories, comments, store gaps               | 2    | 14-01, 02 | —      |
| 14-04 | Mobile forum wiring — BBCode renderer, search, store, delete flows        | 2    | 14-01, 02 | —      |
| 14-05 | Real-time broadcasting gaps + integration tests (FORUM-09, ALL)           | 2    | 14-01, 02 | —      |

---

## Phase 15: Forum Customization ✅ Complete (2026-03-02)

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

### Discovery Findings

- **FORUM-07 (50+ Options) ~55%** — Backend: `ForumTheme` (96L), `Forum` has
  custom_css/sidebar/header fields, `ThemeController` (159L). Web: theme store (200L) with 3
  presets, theme provider. **Gaps:** No CSS editor, no widget configurator, no custom fields, no
  badge manager, no karma names, no rank images. ~20 of 50 options missing.
- **FORUM-08 (Plugins) ~70%** — Backend: `ForumPlugin` (107L) with 18 hooks, `Plugins` context
  (268L), controller+routes. Web: marketplace page+store. **Gap:** No plugin execution runtime
  (hooks defined but never dispatched), no conflict detection.
- **FORUM-11 (Moderation) ~70%** — Backend: `moderation.ex` (213L), reports, bans, moderators. Web:
  8-slice moderation store, automod settings. **Gap:** Automod is group-level not forum-level, no
  warning/strike system, mobile is groups-only.
- **FORUM-12 (Permissions) ~60%** — Backend: `BoardPermission` (285L), `PermissionTemplate` (241L),
  `PermissionsController` (470L). Web: forum-level panel only. **Gap:** No board-level permissions
  UI, no template management pages, no mobile.
- **FORUM-13 (Emoji/Icons) ~65%** — Backend: `CustomEmoji` (262L), `EmojiPack` (72L), `PostIcon`
  (155L), controller (445L). **Gap:** No pack import/export, no post icon selector in thread
  creation, mobile basic.
- **FORUM-14 (RSS) ~60%** — Backend: `rss.ex` (170L), `RssController` (480L). Web: RSS button+feeds
  page. **Gap:** No per-board RSS, no mobile RSS, thin tests.
- **FORUM-15 (User Groups) ~45%** — Backend complete (90%): `ForumUserGroup` (213L),
  `MemberSecondaryGroup` (209L), `GroupAutoRule` (323L), `SecondaryGroupsController` (447L).
  **Gap:** Zero web admin UI, zero mobile.
- **FORUM-16 (Ranking) ~65%** — Backend: `RankingEngine` (253L), `Leaderboard` (71L),
  `LeaderboardController` (181L). **Gap:** No gamification bridge, no Oban cron, no custom karma
  names, no rank images, forum leaderboard page is 15-line stub.

### Plans

| Plan  | Scope                                                                 | Wave | Depends       | Status |
| ----- | --------------------------------------------------------------------- | ---- | ------------- | ------ |
| 15-01 | Customization engine — 55 options, CSS editor, widgets, custom fields | 1    | —             | —      |
| 15-02 | Plugin execution runtime + forum automod + warn/strike system         | 1    | —             | —      |
| 15-03 | User groups admin UI + per-board permissions UI + templates           | 1    | —             | —      |
| 15-04 | Emoji packs + post icons + per-board RSS + mobile RSS                 | 2    | 15-01, 02, 03 | —      |
| 15-05 | Ranking integration + leaderboard + gamification bridge + rank images | 2    | 15-01, 02, 03 | —      |

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

| Plan  | Scope                                                                        | Wave | Depends On        | Status      |
| ----- | ---------------------------------------------------------------------------- | ---- | ----------------- | ----------- |
| 16-01 | XP event pipeline — action triggers, daily caps, forum XP (GAME-01,10)       | 1    | —                 | Not Started |
| 16-02 | Achievement triggers + quest rotation engine (GAME-02,03)                    | 1    | —                 | Not Started |
| 16-03 | Progressive disclosure — level-gated features (GAME-09)                      | 1    | —                 | Not Started |
| 16-04 | Leaderboard scoping + battle pass lifecycle + marketplace (GAME-04,05,06,08) | 2    | 16-01,16-02,16-03 | Not Started |
| 16-05 | Cosmetics rendering + animated borders + title propagation (GAME-07,11,12)   | 2    | 16-01,16-03       | Not Started |

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

| Plan  | Scope                                                                   | Status       |
| ----- | ----------------------------------------------------------------------- | ------------ |
| 17-01 | Stripe Subscription Hardening (PAY-01, PAY-03, PAY-10)                  | **Complete** |
| 17-02 | Mobile IAP + Cross-Platform Sync (PAY-02)                               | **Complete** |
| 17-03 | Virtual Currency Purchase + Billing Portal (PAY-04, PAY-05)             | **Complete** |
| 17-04 | Creator Monetization — Stripe Connect, Paid Forums, Payouts (PAY-06–09) | **Complete** |

**Completed:** 2026-03-02 | **Commits:** 38 | **Plans:** 4/4

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

| Plan  | Scope                                                                          | Status       |
| ----- | ------------------------------------------------------------------------------ | ------------ |
| 18-01 | Rich media messaging + E2EE (MSG-10, MSG-11, MSG-12, MSG-15, E2EE-05, E2EE-06) | **Complete** |
| 18-02 | Search & discovery (MSG-20, SEARCH-01, SEARCH-04, SEARCH-05)                   | **Complete** |
| 18-03 | UI polish & component library (DESIGN-03, DESIGN-04, DESIGN-06)                | **Complete** |
| 18-04 | Infrastructure scale & hardening (INFRA-01, INFRA-04, INFRA-06, INFRA-07)      | **Complete** |
| 18-05 | Moderation & safety hardening (MOD-05, MOD-06, MOD-07)                         | **Complete** |

---

## Phase 19: Launch

**Goal:** Ship to production — App Store approved, landing page live, wallet auth for crypto users,
final QA.

**Rationale:** No new core features. Focus is on store submission (requires IAP working), landing
page, parity audit, and the two wallet auth methods deferred from core auth.

**Depends on:** Phases 15, 17, 18

### Requirements (4)

| REQ-ID      | Requirement                                                  |
| ----------- | ------------------------------------------------------------ |
| ~~AUTH-12~~ | ~~Privy auth~~ — **DESCOPED** (custom auth already complete) |
| AUTH-13     | Ethereum wallet signature auth (SIWE + WalletConnect polish) |
| INFRA-09    | Landing page reflects v1.0 features                          |
| INFRA-10    | App Store and Google Play submissions approved               |

### Success Criteria

1. iOS app downloads from App Store and Android app downloads from Google Play
2. Landing page accurately reflects v1.0 features with working signup flow
3. Web-mobile parity audit shows 100% feature coverage on both platforms
4. New user can go from landing page to first encrypted message in under 3 minutes

### Plans

| Plan  | Scope                                                                             | Wave | Status |
| ----- | --------------------------------------------------------------------------------- | ---- | ------ |
| 19-01 | Wallet Auth Polish — SIWE standard + WalletConnect multi-wallet (Privy descoped)  | 1    | —      |
| 19-02 | Landing Page v1.0 Update — features, pricing, download links, showcase sections   | 1    | —      |
| 19-03 | App Store & Play Store Submission — EAS config, metadata, screenshots, eas submit | 2    | —      |
| 19-04 | Final QA — Web-mobile parity audit, version bump to 1.0.0, release tag            | 2    | —      |

---

## Coverage Map

All 136 requirements mapped across 13 categories. Each REQ-ID appears in exactly one phase.

| Category   | Total   | P1  | P2  | P3  | P4  | P5  | P6  | P7  | P8  | P9  | P10 | P11 | P12 | P13 | P14 | P15 | P16 | P17 | P18 | P19 |
| ---------- | ------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH (13)  | 13      | —   | 3   | 3   | —   | —   | —   | 1   | 3   | 1   | —   | —   | —   | —   | —   | —   | —   | —   | —   | 1   |
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
| **TOTAL**  | **135** | 3   | 3   | 3   | 4   | 4   | 5   | 6   | 7   | 7   | 5   | 6   | 9   | 9   | 10  | 8   | 12  | 10  | 20  | 3   |

> AUTH-14 counted under AUTH. CALL-08 and E2EE-07 are counted separately but delivered together.
> FORUM-10 and SEARCH-03 are related but distinct REQ-IDs, both in Phase 14.

**Orphan check: 0 unmapped requirements. 135/135 covered. (AUTH-12 descoped — Privy unnecessary)**

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

| Phase | Name                     | Status                   | Progress |
| ----- | ------------------------ | ------------------------ | -------- |
| 1     | Infrastructure Baseline  | ✅ Complete (2026-02-27) | 100%     |
| 2     | Auth Core                | ✅ Complete (2026-02-28) | 100%     |
| 3     | Auth Advanced            | ✅ Complete (2026-02-28) | 100%     |
| 4     | Design System & Mobile   | ✅ Complete (2026-02-28) | 100%     |
| 5     | Message Transport        | ✅ Complete (2026-02-28) | 100%     |
| 6     | Message Features & Sync  | ✅ Complete (2026-02-28) | 100%     |
| 7     | E2EE & Mobile Security   | ✅ Complete (2026-02-28) | 100%     |
| 8     | Social & Profiles        | ✅ Complete (2026-03-01) | 100%     |
| 9     | Notifications & Safety   | ✅ Complete (2026-03-01) | 100%     |
| 10    | Message Extras           | Planned (3 plans)        | 0%       |
| 11    | Groups & Channels        | Ready to plan            | 0%       |
| 12    | Roles & Moderation       | Blocked by 11            | 0%       |
| 13    | Voice & Video            | Blocked by 12            | 0%       |
| 14    | Forum Core               | Blocked by 12            | 0%       |
| 15    | Forum Customization      | Blocked by 14            | 0%       |
| 16    | Gamification             | ✅ Complete              | 100%     |
| 17    | Monetization             | Planned (4 plans)        | 0%       |
| 18    | Rich Media & Polish      | Planned (5 plans)        | 0%       |
| 19    | Launch                   | Blocked by 15,17,18      | 0%       |
| 20    | Liquid Glass UI          | Planned (10 plans)       | 30%      |
| 21    | UI Interactions & Motion | Planned (10 plans)       | 0%       |
| 25    | Cinematic UI Parity      | Complete (8 plans)       | 100%     |

---

### Phase 20: Liquid Glass UI — Web App Visual Layer Upgrade ✅

**Goal:** Replace all legacy `bg-dark-*` / `bg-gray-*` styling across `apps/web` with the
liquid-glass design system. Visual layer only — zero store/hook/socket/API changes.

**Depends on:** Commit `61489806` (liquid-glass primitives) **Plans:** 10 plans — **COMPLETE**

Plans:

- [x] 20-01-PLAN.md — Shared UI Primitives (22 files)
- [x] 20-02-PLAN.md — Chat Conversations & Input (25 files)
- [x] 20-03-PLAN.md — Chat Secondary (24 files)
- [x] 20-04-PLAN.md — Settings & Social (60 files)
- [x] 20-05-PLAN.md — Groups & Calls (46 files)
- [x] 20-06-PLAN.md — Forums (88 files)
- [x] 20-07-PLAN.md — Gamification, Admin, Moderation & Premium (65 files)
- [x] 20-08-PLAN.md — Pages: Auth, Settings, Customize (59 files)
- [x] 20-09-PLAN.md — Pages: Forums, Groups, Messages (78 files)
- [x] 20-10-PLAN.md — Pages: Admin, Calls, Community, Social, Gamification (61 files)

**Result:** 0 legacy `bg-dark-*` remaining (6 intentional theme preview configs preserved). Zero
TypeScript errors.

---

### Phase 21: UI Interactions & Motion Upgrade

**Goal:** Every UI interaction (buttons, modals, sidebars, dropdowns, notifications, chat, page
transitions, toasts) has polished spring-driven animations using `motion/react` and
`@cgraph/animation-constants`, respecting `useReducedMotion()` throughout.

**Depends on:** Phase 20 (Liquid Glass UI) **Plans:** 10 plans

Plans:

- [x] 21-01-PLAN.md — Import migration: framer-motion → motion/react (727 files)
- [x] 21-02-PLAN.md — Animation constants expansion + useMotionSafe hook
- [x] 21-03-PLAN.md — Button & IconButton motion system
- [x] 21-04-PLAN.md — Sidebar & navigation layoutId indicators
- [x] 21-05-PLAN.md — Modals, dialogs & overlay animations
- [x] 21-06-PLAN.md — Dropdowns & notification badge animations
- [x] 21-07-PLAN.md — Chat message entrance animations
- [x] 21-08-PLAN.md — Page transitions & toast enhancements
- [x] 21-09-PLAN.md — Mobile haptics & Reanimated upgrades
- [x] 21-10-PLAN.md — Hardcoded value cleanup & final validation

---

### Phase 22: Modern UI Overhaul — Discord/Instagram/Messenger Quality

**Goal:** Upgrade web and mobile UI to match the complexity and polish of Discord, Instagram, and
Meta Messenger — with message grouping, floating action bars, swipe gestures, command palette,
server icon bar, forum cards, stories row, user card popovers, responsive layouts, skeleton loading,
and micro-interactions across both platforms.

**Depends on:** Phases 20 (Liquid Glass UI), 21 (UI Interactions & Motion) **Plans:** 10 plans

Plans:

- [ ] 22-01-PLAN.md — Web design tokens + enhanced UI primitives (Avatar, Skeleton, ContextMenu,
      ScrollArea)
- [ ] 22-02-PLAN.md — Mobile design tokens + mobile UI primitives parity
- [ ] 22-03-PLAN.md — Web chat message overhaul (Discord-style grouping, action bars, reactions,
      embeds, threads)
- [ ] 22-04-PLAN.md — Mobile chat overhaul (Messenger-style bubbles, swipe-to-reply, long-press
      actions, reactions)
- [ ] 22-05-PLAN.md — Conversation list & chat info panel (stories row, online now, member list,
      shared media grid)
- [ ] 22-06-PLAN.md — Profile & social surfaces (Instagram-style profiles, user card popovers,
      status composer)
- [ ] 22-07-PLAN.md — Groups & channels UI (Discord server icon bar, channel categories, voice user
      indicators)
- [ ] 22-08-PLAN.md — Forums UI overhaul (thread cards, grid/list views, voting, rich post composer,
      polls)
- [ ] 22-09-PLAN.md — Navigation, search & cross-cutting (command palette, search overlay,
      notifications, call overlay, explore)
- [ ] 22-10-PLAN.md — Polish pass (skeleton loading compositions, empty states, micro-interactions,
      responsive layout, mobile tab bar)

---

### Phase 23: E2EE Fix — Encryption/Decryption Reliability

**Goal:** End-to-end encrypted messages decrypt reliably in real-time without requiring page
refresh. E2EE initializes automatically on login.

**Depends on:** Phase 7 (E2EE & Mobile Security) **Plans:** 2 plans

Plans:

- [ ] 23-01-PLAN.md — Bootstrap E2EE on app startup + event-driven decrypt retry
- [ ] 23-02-PLAN.md — Decrypt encrypted messages loaded via REST API (fetchMessages)

---

### Phase 24: Landing Page Update — Accurate v1.0.0 Information

**Goal:** All landing page content matches the actual v1.0.0 state — version numbers, feature
descriptions, stats, milestones, status page, blog, download links, navigation, and company subpages
are accurate.

**Depends on:** — **Plans:** 6 plans

Plans:

- [ ] 24-01-PLAN.md — Core data files (landing-data.ts, pricing-data.ts) + version sync to 1.0.0
- [ ] 24-02-PLAN.md — About page comprehensive update (stats, milestones, tech stack, vision)
- [ ] 24-03-PLAN.md — Status page (live banner) + Blog (v1.0.0 release post)
- [ ] 24-04-PLAN.md — Download pages + Navigation + VoiceVideoShowcase accuracy
- [ ] 24-05-PLAN.md — Press, Careers, Contact subpages accuracy pass
- [ ] 24-06-PLAN.md — Visual verification checkpoint (human browsing)

---

### Phase 25: Cinematic UI Parity — Web & Mobile Match Landing/Auth Quality ✅

**Goal:** Web and mobile app UI matches the cinematic visual quality of the landing and auth pages —
premium buttons with magnetic/shimmer effects, interactive particle backgrounds, squircle avatars
(border-radius: 43px) with Lottie support, enhanced glass cards, and ambient effects.

**Depends on:** Phase 24 (Landing Page Update) **Plans:** 8 plans — **COMPLETE**

Plans:

- [x] 25-01-PLAN.md — Shared animation presets (backgrounds + buttons in
      @cgraph/animation-constants)
- [x] 25-02-PLAN.md — Web button upgrade (magnetic pull, shimmer, flowing border)
- [x] 25-03-PLAN.md — Web cinematic background (interactive canvas particle field)
- [x] 25-04-PLAN.md — Web avatar squircle (border-radius: 43px) + Lottie avatar support
- [x] 25-05-PLAN.md — Web component polish (glass card spotlight, gradient text, micro-interactions)
- [x] 25-06-PLAN.md — Mobile button upgrade (gradient border, glow press, haptics)
- [x] 25-07-PLAN.md — Mobile avatar squircle + Lottie avatar support
- [x] 25-08-PLAN.md — Mobile premium components (glass card, gradient text, ambient background)

**Result:** Web and mobile apps have cinematic UI matching landing/auth quality. All effects respect
`useReducedMotion` / `prefers-reduced-motion`. All animations use native-thread execution on mobile.

---

## v2.0 Pivot — Product Evolution (Phases 26-32)

> The following phases execute the "Definitive Plan" — a major product pivot that removes the
> gamification system and builds Pulse reputation, Nodes currency, Secret Chat UI, and Discovery
> in its place. See `docs/PrivateFolder/This will be the definitive.txt` for full plan.

### Phase 26: The Great Delete

**Goal:** Remove the entire gamification system from the codebase — backend (30+ Elixir modules,
83 routes stripped to 3), frontend stores (9 stores + facades), pages (gamification hub, achievements,
quests, titles, leaderboard, progression customization), components (214 files), mobile screens,
and all supporting types/hooks/tests.

**Depends on:** Phase 25 (Cinematic UI Parity) **Plans:** 4 plans

Plans:
- [ ] 26-01-PLAN.md — Backend delete (30+ Elixir modules, routes stripped, migration)
- [ ] 26-02-PLAN.md — Frontend stores, facades, hooks delete (web + mobile)
- [ ] 26-03-PLAN.md — Frontend pages, components, screens delete (~300 files)
- [ ] 26-04-PLAN.md — Route cleanup, type consolidation, dangling reference sweep (wave 2)

---

### Phase 27: Fix What Remains Broken ✅

**Completed:** 2026-03-10 | **Plans:** 2/2 | **Verification:** Passed (14/15)

**Goal:** Fix everything broken after the Great Delete — consolidate dual theme system, simplify
background effects, build ParticleEngine, clean achievement types, fix rarity constants.

**Depends on:** Phase 26 **Plans:** 2 plans

Plans:
- [x] 27-01-PLAN.md — Customization fixes (themes, effects, particles, dead props)
- [x] 27-02-PLAN.md — Achievement system fix (strip gamification fields, fix titleRewards, rarities)

---

### Phase 28: Complete Broken Cosmetics

**Goal:** Build/fix the three most impactful cosmetic features: NameplateBar (full rendering with
Lottie), Profile Effects (LottieOverlay), and Border unification (CSS→Lottie, sync 42 borders).

**Depends on:** Phase 27 **Plans:** 3 plans

Plans:
- [ ] 28-01-PLAN.md — NameplateBar component (web + mobile, all 24 nameplates)
- [ ] 28-02-PLAN.md — Profile effects via LottieOverlay (12 effects)
- [ ] 28-03-PLAN.md — Border unification (CSS→Lottie, 42 borders, backend seed sync)

---

### Phase 29: Secret Chat

**Goal:** Build complete Secret Chat with E2E encryption (custom Signal Protocol from packages/crypto/),
Ghost Mode, Secret Identity, Timed Conversations, Panic Wipe, 12 secret themes. Backend infrastructure
partially exists — frontend UI is 100% greenfield.

**Depends on:** Phase 26 **Plans:** 2 plans

Plans:
- [ ] 29-01-PLAN.md — Backend: Ghost Mode, session extensions, Panic Wipe, timed expiry
- [ ] 29-02-PLAN.md — Frontend: Secret Chat UI, 12 themes, E2E encryption integration

---

### Phase 30: Pulse Reputation

**Goal:** Build community-scoped reputation system. 100% greenfield. Weighted voting (1-4x based on
voter's pulse), 6 tiers (newcomer→legend), 5% decay per 30 days inactive, Fade gated at pulse >= 50.

**Depends on:** Phase 26 **Plans:** 2 plans

Plans:
- [ ] 30-01-PLAN.md — Backend: tables, context, weighted votes, decay worker, API
- [ ] 30-02-PLAN.md — Frontend: PulseDots, profile card integration, reaction UI, achievements

---

### Phase 31: Forums + Discovery

**Goal:** Build Forums (threads, replies, content gating) and Discovery (feed ranking with 5 modes,
user frequencies, community health scoring). 100% greenfield.

**Depends on:** Phase 30 **Plans:** 2 plans

Plans:
- [ ] 31-01-PLAN.md — Backend: tables, feed ranking, health scoring, forum CRUD, API
- [ ] 31-02-PLAN.md — Frontend: feed page, forum pages, frequency picker, routes

---

### Phase 32: Nodes Monetization

**Goal:** Build virtual currency system (Nodes). Wallet, transaction processing, tipping, content
unlock, withdrawal requests. Uses existing Stripe integration — Paddle migration is separate epic.

**Depends on:** Phase 31 **Plans:** 2 plans

Plans:
- [ ] 32-01-PLAN.md — Backend: wallet tables, context, tipping, platform cut, withdrawals, API
- [ ] 32-02-PLAN.md — Frontend: wallet page, bundle purchase, tipping UI, content unlock, routes

---

_Roadmap: 32 phases · 135+ requirements · Updated: 2026-07-23_
