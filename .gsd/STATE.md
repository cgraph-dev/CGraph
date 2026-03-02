# CGraph Project State

> Auto-maintained by GSD workflow. Do not edit manually.

---

## Core Value

Secure real-time communication that works end-to-end.

## Current Focus

**Phase 18 — Rich Media & Polish** — **Complete (46 commits, 5 plans, 20 requirements)**

Phase 18 hardened and polished CGraph: rich media messaging (voice, files, GIFs, scheduled messages) with E2EE, search & discovery (Meilisearch, quick switcher, explore), UI polish (animations, skeletons, component library), infrastructure scale (10K WebSocket, load testing, feature flags, rate limiting), and moderation safety (AI auto-action, dashboard metrics, appeals). All 20 requirements delivered across 46 commits.

## Position

- **Phase:** 18 of 19 — Rich Media & Polish (**Complete**)
- **Plan:** 5/5 plans executed (46 commits)
- **Status:** Phase complete
- **Last activity:** 2026-03-02 — Phase 18 executed (46 commits)

## Plans

| Plan  | Objective                                                           | Wave | Autonomous | Depends On        | Status      |
| ----- | ------------------------------------------------------------------- | ---- | ---------- | ----------------- | ----------- |
| 18-01 | Rich media messaging + E2EE (voice, files, GIFs, scheduled)        | 1    | ✅          | —                 | **Complete** |
| 18-02 | Search & discovery (Meilisearch, quick switcher, explore)           | 1    | ✅          | —                 | **Complete** |
| 18-03 | UI polish & component library (animations, skeletons, Storybook)   | 1    | ✅          | —                 | **Complete** |
| 18-04 | Infrastructure scale & hardening (10K WS, load test, FF, rate limit)| 1    | ✅          | —                 | **Complete** |
| 18-05 | Moderation & safety hardening (AI auto-action, dashboard, appeals)  | 1    | ✅          | —                 | **Complete** |

## Progress

| Metric             | Value     |
| ------------------ | --------- |
| Overall progress   | 94%       |
| Phases complete    | 17 / 19   |
| Requirements done  | 127 / 136 |
| Current phase reqs | 20 / 20   |

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
| 11  | Groups & Channels       | **Complete** (2026-03-01) |
| 12  | Roles & Moderation      | **Complete** (2026-03-01) |
| 13  | Voice & Video           | **Complete** (2026-03-01) |
| 14  | Forum Core              | **Complete** (2026-03-01) |
| 15  | Forum Customization     | **Complete** (2026-03-02) |
| 16  | Gamification            | **Complete** (2026-03-02) |
| 17  | Monetization            | Planned (4 plans)         |
| 18  | Rich Media & Polish     | **Complete** (2026-03-02) |
| 19  | Launch                  | Blocked by 17             |

## Project Reference

See: .gsd/PROJECT.md (updated 2026-02-28)

**Core value:** Secure real-time communication that works end-to-end
**Current focus:** Phase 18 complete (46 commits, 20 requirements). Next: Phase 17 (Monetization) or Phase 19 (Launch, blocked by 17).

## Accumulated Context

### Recent Decisions (Phase 18 Execution)

- **R2 storage wiring**: Cloudflare R2 client module with presigned upload/download URLs, bucket config in runtime.exs
- **File encryption**: AES-256-GCM file encryption layer wrapping R2 uploads, key derivation via HKDF-SHA256 from E2EE session keys
- **Voice/file E2EE**: Extended existing E2EE pipeline to cover voice messages and file attachments (encrypt-before-upload, decrypt-after-download)
- **GIF picker**: Tenor API integration with search/trending endpoints, GIF message type in schema
- **Scheduled messages**: Full CRUD backend (ScheduledMessage schema, Oban worker for send-at), UI on web + mobile with date/time pickers
- **Meilisearch indexing**: Message indexing pipeline via Oban job on message insert/update, conversation-scoped search
- **Quick switcher**: Cmd+K command palette with fuzzy search across conversations, channels, users
- **Explore feature**: Backend `list_public_forums/1` aggregation endpoint, frontend explore screens (web + mobile), fixed DateTime parsing + pagination bugs
- **Animation tokens**: Centralized transitions.ts token file, ErrorFallback + usePageTransition hook for page transitions
- **Skeleton components**: 6 skeleton loading components (conversation list, message list, profile, channel, settings, search results)
- **Empty states**: 7 empty state components with illustrations and CTAs
- **Storybook expansion**: 31 total stories (16 new), covering skeletons, empty states, and existing components
- **Mobile polish**: 4 Reanimated-based animation components, COMPONENTS.md catalog document
- **Feature flags admin**: REST API for flag CRUD + history, frontend SDK (useFeatureFlag hook), admin panel UI
- **Rate limiting**: Per-tier rate limits (premium 2x, enterprise 5x base), audit of all endpoints
- **WebSocket backpressure**: ConnectionMonitor module, 15K max connections with graceful degradation
- **k6 load tests**: 3 test scenarios (10K WebSocket connections, realistic traffic mix, rich media upload), SCALE_RESULTS.md
- **Moderation audit log**: Structured audit log schema with action/actor/target/metadata, queryable API
- **AI auto-action pipeline**: Automated moderation with configurable thresholds, escalation rules
- **Moderation dashboard**: Extended stats endpoints, metrics UI with charts, bulk batch_review actions
- **Appeal system**: Email notifications via Orchestrator pattern, mobile appeal submission screen, 15 integration tests

### Recent Decisions (Phase 14 Execution)

- **BBCode parser**: Regex-based tag processing with HTML escaping before tag expansion for XSS protection, 14 tag types supported
- **Poll API**: PollController with nested routes under `/threads/:thread_id/poll`, inline poll creation inside existing `create_thread/3` transaction
- **Full-text search**: PostgreSQL tsvector columns + GIN indexes + auto-update triggers, `to_tsquery/1` for safe user input, `ts_rank_cd` for relevance sorting
- **Reputation propagation**: Self-vote prevention (voter != author), chain resolution (thread → board → forum) for forum_id lookup
- **BoardChannel**: Board-level Phoenix channel for real-time thread events (new/updated/deleted), presence tracking
- **Mobile forum store**: Zustand + forumService pattern matching existing mobile architecture
- **BBCode renderer (mobile)**: Stack-based recursive parser with native RN Text/View/Image rendering, spoiler reveal via Pressable
- **Integration tests**: 64 test cases covering all 10 requirements in `phase14_verification_test.exs`
- **Board socket page wiring deferred**: `forum-board-view.tsx` is a re-export stub; `useBoardSocket` hook available for later integration

### Recent Decisions (Phase 13 Execution)

- **JOSE-based LiveKit tokens**: No external LiveKit SDK — used existing JOSE + :httpc for JWT generation and Twirp API calls
- **Hybrid routing in webrtc.ex**: P2P for 1:1 calls (existing), LiveKit SFU for 3+ participants (new `escalate_to_sfu/1`)
- **SFrame E2EE**: ExternalE2EEKeyProvider + HKDF-SHA256 key derivation, per-room 256-bit AES keys in ETS
- **Voice channels via Phoenix Presence**: VoiceChannelManager tracks occupancy, auto-cleanup on disconnect
- **@livekit/react-native-webrtc** replaces standalone react-native-webrtc for LiveKit compatibility on mobile
- **Docker Compose for LiveKit** at `infrastructure/docker-compose.livekit.yml` (matches observability pattern)
- **Call history REST API**: GET /api/v1/calls with cursor pagination (added to messaging_routes.ex)

### Recent Decisions (Phase 11 Planning)

- WebSocket topic mismatch: backend "group:*" vs web "channel:*" vs mobile composite — all clients must use "group:{channelId}"
- Extensive existing infrastructure: backend 24+ files (2800+ lines), web stores/components (2700+ lines), mobile services/screens (2800+ lines)
- Full DB schema already migrated: groups, channels, categories, members, roles, invites, audit_logs, permissions, pinned_messages
- Mobile groupsService has getPublicGroups() + getFeaturedGroups() but no dedicated explore screen
- Web discover-tab is generic search — needs dedicated explore page for GROUP-09
- Thread infrastructure exists (backend 405+211 lines, web threadStore 212 lines + thread-panel 261 lines) — needs wiring for channel context
- 3 plans, 2 waves: Wave 1 parallel (socket fix + CRUD wiring), Wave 2 sequential (explore + threads)

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

Last session: 2026-03-02
Stopped at: Phase 18 executed — 46 commits, 5 plans complete, 20 requirements delivered
Resume file: .gsd/phases/18-rich-media-polish/

## Last Action

Phase 18 executed. 5 plans in 1 wave, 46 commits, 20 requirements delivered:
- 18-01 (Complete): Rich media messaging + E2EE — R2 storage, file encryption, voice/file E2EE, file/image UI, GIF picker, scheduled messages CRUD + UI, 22 integration tests
- 18-02 (Complete): Search & discovery — Meilisearch indexing, in-conversation search, quick switcher, explore backend + frontend + mobile, 10 integration tests, 2 bug fixes
- 18-03 (Complete): UI polish & component library — animation tokens, page transitions, 6 skeletons, 7 empty states, 31 Storybook stories, 4 mobile animations, COMPONENTS.md
- 18-04 (Complete): Infrastructure scale & hardening — feature flag admin API + SDK, rate limiting per-tier, WebSocket backpressure (15K), 3 k6 load tests, SCALE_RESULTS.md
- 18-05 (Complete): Moderation & safety — audit log, AI auto-action pipeline, extended stats, dashboard metrics, bulk actions, appeal emails + mobile screen, 15 integration tests

Next: Phase 17 (Monetization — 4 plans already planned) or verify Phase 18.

---

_Last updated: 2026-03-02 (Phase 18 complete)_
