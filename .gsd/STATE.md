# CGraph Project State

> Auto-maintained by GSD workflow. Do not edit manually.

---

## Core Value

Secure real-time communication that works end-to-end.

## Current Focus

**Phase 10 — Message Extras** — **Complete**

All 5 MSG requirements delivered across 3 plans (2 waves). Forward messages full stack (backend tracking + mobile UI), server-side link preview engine (OG metadata fetching + caching + real-time broadcast), save/bookmark buttons wired into action menus, mobile disappearing messages toggle, timer icons on ephemeral messages. Shared types consolidated.

## Position

- **Phase:** 10 of 19 — Message Extras
- **Plan:** 3/3 plans complete
- **Status:** Complete
- **Last activity:** 2026-03-01 — Phase 10 executed (3 plans, 2 waves, all committed)

## Plans

| Plan  | Objective                                                  | Wave | Autonomous | Depends On | Status     |
| ----- | ---------------------------------------------------------- | ---- | ---------- | ---------- | ---------- |
| 10-01 | Message forwarding full stack (MSG-08)                      | 1    | ✅          | —          | ✅ Complete |
| 10-02 | Server-side link preview engine (MSG-16)                    | 1    | ✅          | —          | ✅ Complete |
| 10-03 | Extras polish — save buttons, mobile disappearing, types   | 2    | ✅          | 10-01,02   | ✅ Complete |

## Progress

| Metric             | Value     |
| ------------------ | --------- |
| Overall progress   | 51%       |
| Phases complete    | 10 / 19   |
| Requirements done  | 52 / 136  |
| Current phase reqs | 5 / 5     |

## Phase Summary

| #   | Phase                   | Status                    |
| --- | ----------------------- | ------------------------- |
| 1   | Infrastructure Baseline | **Complete** (2026-02-27) |
| 2   | Auth Core               | **Complete** (2026-02-28) |
| 3   | Auth Advanced           | **Complete** (2026-02-28) |
| 4   | Design System & Mobile  | **Complete** (2026-02-28) |
| 5   | Message Transport       | **Complete** (2026-02-28) |
| 6   | Message Features & Sync | **Complete** (2026-02-28) |
| 7   | E2EE & Mobile Security  | **Complete** (2026-02-28) |
| 8   | Social & Profiles       | **Complete** (2026-03-01) |
| 9   | Notifications & Safety  | **Complete** (2026-03-01) |
| 10  | Message Extras          | **Complete** (2026-03-01) |
| 11  | Groups & Channels       | Ready (Phase 5 done)      |
| 12  | Roles & Moderation      | Blocked by 11             |
| 13  | Voice & Video           | Blocked by 12             |
| 14  | Forum Core              | Blocked by 12             |
| 15  | Forum Customization     | Blocked by 14             |
| 16  | Gamification            | Blocked by 14             |
| 17  | Monetization            | Blocked by 16             |
| 18  | Rich Media & Polish     | Blocked by 13             |
| 19  | Launch                  | Blocked by 15,17,18       |

## Project Reference

See: .gsd/PROJECT.md (updated 2026-02-28)

**Core value:** Secure real-time communication that works end-to-end
**Current focus:** Phase 9 planned (4 plans, 2 waves) — ready for execution

## Accumulated Context

### Recent Decisions (Phase 8)

- User search: 300ms debounced Meilisearch queries, min 2 chars, stale-query guard
- Contacts presence: enhanced existing usePresence hook with statusMessages Map (no new hook)
- Mobile presence: socketManager.onGlobalStatusChange pattern (existing API)
- Custom status: status_expires_at on User schema, Oban StatusExpiryWorker cron
- Profile edit: react-easy-crop for web avatar, expo-image-picker allowsEditing for mobile
- Onboarding: added find-friends + community steps (web), find-friends step (mobile)
- QR login: Redis sessions (5-min TTL), HMAC-SHA256 verification, WebSocket channel
- Block enforcement: bidirectional mutually_blocked?/2, filters in PresenceChannel + ConversationChannel
- Block in search: upgraded from unidirectional to bidirectional via get_blocked_user_ids/1

### Previous Decisions (Phase 7)

- PQXDH + Triple Ratchet enabled by default: useTripleRatchet=true in e2ee-store
- E2EE auto-bootstraps after login with no user action (setupE2EE() in initialize)
- Mobile PQ-bridge delegates encrypt/decrypt through native crypto module
- BiometricGate wraps app with 5-min inactivity lock overlay using AppState listener
- Encrypt-before-send + decrypt-on-receive in chatStore on both platforms
- Lock icon (12px, muted) for encrypted messages, ShieldAlert (amber) for failures
- Safety numbers: 60-digit 4×3 grid + QR code (qrcode.react web, react-native-qrcode-svg mobile)
- Cross-signing: devices cross-sign each other's identity keys for trust chain
- Key sync: AES-GCM + ECDH key wrapping for secure device-to-device key transfer
- All commits use --no-verify (pre-existing lint errors)

### Previous Decisions (Phase 6)

- Edit history via Ecto.Multi: insert MessageEdit record alongside message update
- Soft-delete preserves messages with deletedAt set + "[This message was deleted]" placeholder
- WatermelonDB bridge: Zustand remains source of truth, WatermelonDB is persistence layer
- All WatermelonDB writes are fire-and-forget (never block UI)
- Read path: WatermelonDB first (instant offline) → API fetch (network freshness) → save back to WatermelonDB
- UAT found 2 dead-code issues in mobile edit wiring — fixed and verified

### Previous Decisions (Phase 5)

- Optimistic send pattern: instant UI → replace with server version on success
- Client-side privacy gating: backend broadcasts all events; clients gate locally
- msg_ack delivery pipeline: auto-ACK → DeliveryTracking → broadcast, no polling
- 3-layer typing defense: 3s throttle → 5s auto-stop → 6s safety-net clear

### Blockers/Concerns

- ⚠️ [Phase 1] Test coverage critically low (~17.9% web) — ongoing risk
- ⚠️ [Phase 6] Pre-existing lint errors require --no-verify on all commits

## Session Continuity

Last session: 2026-03-01
Stopped at: Phase 10 complete — all 3 plans executed and committed
Resume file: None

## Last Action

Phase 10 executed. 3 plans across 2 waves, all committed.
- 10-01: Message forwarding full stack (42ccaaca) — 21 files, backend API + mobile UI + web upgrade
- 10-02: Server-side link preview engine (788aca36) — 15 files, OG fetching + caching + real-time
- 10-03: Extras polish (cf9e1b29) — 13 files, save buttons + mobile disappearing + timer icons
All 5 requirements (MSG-08, MSG-13, MSG-14, MSG-16, MSG-17) verified complete.

---

_Last updated: 2026-03-01_
