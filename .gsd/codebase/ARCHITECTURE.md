# CGraph Architecture

> Generated: 2026-03-11 | Version: 1.1.0

## 1. Overall System Architecture

CGraph is a **pnpm/Turborepo monorepo** implementing a secure real-time messaging platform with
forums, a Nodes virtual-currency economy, and end-to-end encryption. The architecture follows a
**client–server model** with:

- **Backend:** Elixir/Phoenix API server (REST JSON API + Phoenix Channels for real-time)
- **Web client:** React 19 SPA (Vite + TypeScript)
- **Mobile client:** React Native (Expo SDK 54) + TypeScript
- **Landing page:** React SPA (Vite + TypeScript)
- **Shared packages:** 6 cross-platform TypeScript packages

```
┌─────────────────────────────────────────────────────────┐
│                    Clients                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │  Web App  │  │Mobile App│  │ Landing  │  │Docs Site││
│  │ React 19  │  │  Expo 54 │  │(Vite+React)│ │Docusaurus││
│  │  Vite     │  │  RN 0.81 │  │          │  │         ││
│  └─────┬─────┘  └────┬─────┘  └──────────┘  └─────────┘│
│        │              │                                  │
│  ┌─────┴──────────────┴─────┐                           │
│  │   Shared Packages        │                           │
│  │ @cgraph/socket            │                           │
│  │ @cgraph/crypto            │                           │
│  │ @cgraph/api-client        │                           │
│  │ @cgraph/shared-types      │                           │
│  │ @cgraph/utils             │                           │
│  │ @cgraph/animation-constants│                          │
│  └─────────────┬────────────┘                           │
└────────────────┼────────────────────────────────────────┘
                 │ REST (HTTPS) + WebSocket (Phoenix Channels)
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Elixir/Phoenix 1.8)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  CGraphWeb (Router, Controllers, Channels, Plugs)│   │
│  └──────────────────────┬───────────────────────────┘   │
│  ┌──────────────────────┴───────────────────────────┐   │
│  │  CGraph (Domain Contexts / Business Logic)        │   │
│  │  Accounts│Messaging│Groups│Forums│Nodes│Pulse...   │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────┴────────────────────────────┐  │
│  │  PostgreSQL (Ecto) │ Redis (Caching/Rate Limits)  │  │
│  │  Oban (Jobs)       │ S3/R2 (File Storage)         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Build System

- **Package manager:** pnpm workspaces (`pnpm-workspace.yaml`)
- **Task runner:** Turborepo with remote caching enabled
- **TypeScript:** Strict mode, ES2022 target, bundler module resolution
- **Backend build:** Mix/Elixir toolchain, independent from JS build

---

## 2. Backend Architecture (Elixir/Phoenix)

### 2.1 Application Structure

The backend follows **Phoenix context-based Domain-Driven Design (DDD)**. Business logic lives in
`lib/cgraph/` as bounded contexts; web-facing code lives in `lib/cgraph_web/`.

**Entry point:** `lib/cgraph/application.ex` — OTP Application supervisor

**Supervision tree (rest_for_one strategy):**

```
CGraph.Supervisor
├── CGraphWeb.Telemetry           (telemetry reporters)
├── CGraph.Repo                   (primary Ecto repository)
├── CGraph.ReadRepo               (read replica, falls back to primary)
├── Redix                         (Redis connection pool, conditional — only when `redis_enabled?`)
├── CGraph.Redis                  (Redis GenServer wrapper, conditional — only when `redis_enabled?`)
├── CGraph.RateLimiter.Distributed (sliding window, always started — Redis or ETS fallback)
├── Phoenix.PubSub                (PG2 adapter, auto-clusters via Erlang distribution)
├── DNSCluster                    (Fly.io multi-region clustering)
├── OpenTelemetry                 (distributed tracing setup)
├── CGraph.CacheSupervisor        (Cachex instances: general, session, token caches)
├── CGraph.SecuritySupervisor     (JWT key rotation, token blacklist, account lockout)
├── CGraph.Auth.TokenManager      (refresh token rotation, family tracking, theft detection)
├── CGraph.WorkerSupervisor       (Oban, Presence, WebRTC)
├── DocumentRegistry + DocumentSupervisor (real-time collaborative editing)
├── CGraph.Metrics                (in-app metrics collector)
├── CGraph.Snowflake              (distributed ID generation for message ordering)
├── CGraph.Telemetry.SlowQueryReporter (N+1 detection)
├── Finch                         (HTTP client pool for Swoosh, Tesla)
├── CGraph.ApiVersioning          (API version negotiation)
└── CGraphWeb.Endpoint            (Phoenix HTTP/WS endpoint — started last)
```

### 2.2 Domain Contexts (`lib/cgraph/`)

Each context is a bounded module with its own schemas, queries, and business logic:

| Context            | Module                  | Purpose                                                                                                                                 |
| ------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Accounts**       | `CGraph.Accounts`       | Users, profiles, friends, sessions, settings, registration, wallet auth                                                                 |
| **Messaging**      | `CGraph.Messaging`      | Conversations, messages, reactions, read receipts, delivery tracking, voice messages, saved messages                                    |
| **Groups**         | `CGraph.Groups`         | Group CRUD, channels, channel categories, roles, members, invites, bans, custom emojis, automod                                         |
| **Forums**         | `CGraph.Forums`         | Forum boards, threads, posts, comments, polls, votes, categories, RSS, custom emojis, permissions, leaderboard                          |
| **Gamification**   | `CGraph.Gamification`   | **DEPRECATED (stub-only)** — XP, quests, levels, streaks removed; facade returns empty/noop. Schemas remain for data migration          |
| **Nodes**          | `CGraph.Nodes`          | Virtual currency (Nodes) economy: wallets, transactions, tipping, content unlock, withdrawal requests, node bundles, platform cut (20%) |
| **Pulse**          | `CGraph.Pulse`          | Pulse engagement scoring: pulse scores, tiers, pulse transactions, transaction processing                                               |
| **Discovery**      | `CGraph.Discovery`      | Content discovery feed: community health, topics, post metrics, user frequency, feed generation                                         |
| **Stickers**       | `CGraph.Stickers`       | Sticker system: sticker packs, user sticker packs, sticker schemas                                                                      |
| **Animations**     | `CGraph.Animations`     | Lottie animation management: caching, manifests, Noto emoji scraping                                                                    |
| **Notifications**  | `CGraph.Notifications`  | Push notifications, in-app notifications, delivery system                                                                               |
| **Encryption**     | `CGraph.Encryption`     | Server-side encrypted fields, key management, hashing                                                                                   |
| **AI**             | `CGraph.AI`             | LLM client, sentiment analysis, smart replies, content moderation, summarizer                                                           |
| **Collaboration**  | `CGraph.Collaboration`  | Real-time document editing (Yjs CRDT sync), document server GenServer                                                                   |
| **WebRTC**         | `CGraph.WebRTC`         | Voice/video calls, signaling, room management, participant tracking                                                                     |
| **Moderation**     | `CGraph.Moderation`     | Reports, appeals, enforcement, user restrictions                                                                                        |
| **Search**         | `CGraph.Search`         | Full-text search engine, indexing, user/message search                                                                                  |
| **Subscriptions**  | `CGraph.Subscriptions`  | Tier system, premium features, tier limits                                                                                              |
| **OAuth**          | `CGraph.OAuth`          | Google, Apple, Facebook, TikTok providers (via Assent)                                                                                  |
| **Referrals**      | `CGraph.Referrals`      | Referral system, tracking                                                                                                               |
| **Reputation**     | `CGraph.Reputation`     | User reputation scoring                                                                                                                 |
| **Calendar**       | `CGraph.Calendar`       | Calendar events                                                                                                                         |
| **Announcements**  | `CGraph.Announcements`  | System announcements, dismissals                                                                                                        |
| **Customizations** | `CGraph.Customizations` | User themes, visual customizations                                                                                                      |
| **Webhooks**       | `CGraph.Webhooks`       | Outbound webhook delivery, signature verification                                                                                       |
| **Data Export**    | `CGraph.DataExport`     | GDPR data export (processor → formatter → delivery)                                                                                     |
| **Creators**       | `CGraph.Creators`       | Creator economy: earnings, payouts, paid subscriptions, connect onboarding, content gating                                              |
| **Events**         | `CGraph.Events`         | Domain event system, typed events                                                                                                       |
| **Chaos**          | `CGraph.Chaos`          | Chaos engineering: fault injection, circuit breaker validation, scenario simulation                                                     |
| **Admin**          | `CGraph.Admin`          | Admin metrics and dashboard data                                                                                                        |
| **Explore**        | `CGraph.Explore`        | Explore feed, trending content                                                                                                          |
| **Audit**          | `CGraph.Audit`          | Audit logging                                                                                                                           |
| **Permissions**    | `CGraph.Permissions`    | Role-based permission checking                                                                                                          |
| **Presence**       | `CGraph.Presence`       | Online/offline status tracking (sampled)                                                                                                |
| **Storage**        | `CGraph.Storage`        | File uploads via Waffle → S3/R2                                                                                                         |
| **Cache**          | `CGraph.Cache`          | 3-tier caching: L1 (ETS), L2 (Cachex), L3 (Redis), with stampede protection                                                             |
| **Feature Flags**  | `CGraph.FeatureFlags`   | Runtime feature toggles                                                                                                                 |

### 2.3 Web Layer (`lib/cgraph_web/`)

**Router** (`CGraphWeb.Router`): Routes organized by domain via imports:

- `HealthRoutes` — health checks, webhooks, telemetry
- `AuthRoutes` — registration, login, OAuth, wallet, 2FA
- `PublicRoutes` — public forum browsing, tiers, RSS, emojis
- `UserRoutes` — profiles, settings, friends, notifications
- `MessagingRoutes` — conversations, groups, channels, reactions
- `ForumRoutes` — forum CRUD, boards, threads, permissions
- `GamificationRoutes` — legacy gamification endpoints (deprecated, returns stubs)
- `NodesRoutes` — Nodes economy endpoints (wallets, transactions, tipping, withdrawals)
- `PulseRoutes` — Pulse engagement scoring endpoints
- `DiscoveryRoutes` — Content discovery feed endpoints
- `AnimationRoutes` — Lottie animation/border endpoints
- `AdminRoutes` — admin dashboard, moderation, GDPR
- `AIRoutes` — AI-powered features
- `SyncRoutes` — offline data sync
- `CreatorRoutes` — creator economy endpoints (earnings, payouts, onboarding)

**Pipelines (plug chains):**

- `:api` — standard JSON pipeline with security headers, rate limiting (standard tier), API
  versioning, idempotency, Sentry context
- `:api_auth_strict` — strict rate limiting for auth endpoints (brute-force protection), audit
  logging
- `:api_relaxed` — relaxed rate limiting for read-heavy public endpoints
- `:api_auth` — authenticated pipeline with RequireAuth plug, audit logging (user category)
- `:api_admin` — admin pipeline with RequireAuth + RequireAdmin plugs (audit-logged)
- `:browser` — HTML pipeline for Phoenix LiveDashboard

**Controllers:** Versioned under `controllers/api/v1/` — over 100 controller/JSON view pairs
organized by resource (auth, users, messages, groups, forums, gamification, etc.). Additional
top-level controllers outside `v1/` include: `cosmetics_controller`, `friend_controller`,
`gamification_controller`, `health_controller`, `iap_controller`, `metrics_controller`,
`nodes_controller`, `premium_controller`, `settings_controller`, `shop_controller`,
`stripe_webhook_controller`, `title_controller`, `wallet_auth_controller`, plus
`payment_controller`, `subscription_controller`, `username_controller` under `api/`.

**Plug middleware stack:**

- `SecurityHeaders` — HSTS, CSP, X-Frame-Options
- `CookieAuth` — Cookie-to-Bearer translation for web clients
- `RequestTracing` — End-to-end request correlation
- `RateLimiterV2` — Sliding window algorithm with tiered limits (strict/standard/relaxed)
- `ApiVersion` — API version negotiation
- `IdempotencyPlug` — Idempotent request handling
- `SentryContext` — Error tracking context
- `AuditLogPlug` — Per-category audit logging
- `RequireAuth` / `RequireAdmin` — Authorization enforcement
- `CorrelationId` — Distributed tracing correlation
- `EtagPlug` — HTTP ETag caching (available but not wired into pipelines)
- `OptionalAuthPipeline` — Optional authentication for public endpoints with optional auth
- `TwoFactorRateLimiter` — 2FA-specific rate limiting
- `CurrentUser` — Current user assignment
- `GeoRouter` — Geographic routing
- `RawBodyPlug` — Raw body preservation (for webhook signature verification)
- `RequestContextPlug` — Request context propagation
- `TracingPlug` / `TraceContext` — OpenTelemetry tracing integration

### 2.4 Background Workers

**Oban** job processing system with 27 workers in `lib/cgraph/workers/` (notable workers):

- `NotificationWorker` — push/email notification delivery
- `ScheduledMessageWorker` — timed message delivery
- `SearchIndexWorker` — search index updates
- `MessageArchivalWorker` — message archiving
- `CleanupWorker` — data cleanup
- `DatabaseBackup` — backup orchestration
- `DeadLetterWorker` — failed job retry
- `WebhookDeliveryWorker` — outbound webhook delivery
- `HardDeleteUser` — GDPR hard delete
- `SendEmailNotification` / `SendPushNotification` — delivery workers
- `CriticalAlertDispatcher` — high-priority alert delivery
- `DeleteExpiredMessages` / `DeleteExpiredSecretMessages` — message expiry
- `EmailDigestWorker` / `NotificationRetryWorker` / `PartitionManager`
- `AppealNotificationWorker` — moderation appeal notifications
- `CleanupLinkPreviewCache` — link preview cache cleanup
- `FetchLinkPreview` — link preview fetching
- `ModerationWorker` — moderation task processing
- `RankingUpdateWorker` — forum ranking updates
- `StatusExpiryWorker` — user status expiry
- `PulseDecayWorker` — pulse score decay processing
- `DocumentCompactionWorker` — collaborative document compaction
- `ExpireSecretConversations` — secret chat session expiry
- `FileCleanupWorker` — orphaned file cleanup
- `SendScheduledMessage` — scheduled message dispatch
- Worker orchestrator (`base.ex`) for complex multi-step jobs

---

## 3. API Design

### 3.1 REST JSON API

All endpoints follow a versioned REST pattern under `/api/v1/`:

```
GET    /api/v1/conversations
POST   /api/v1/conversations
GET    /api/v1/conversations/:id/messages
POST   /api/v1/conversations/:id/messages
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/users/:id/profile
...
```

**Conventions:**

- JSON request/response format
- Controller + JSON view pairs (e.g., `message_controller.ex` + `message_json.ex`)
- `FallbackController` for standardized error responses
- `ChangesetJSON` for Ecto changeset error rendering
- Cursor-based pagination for large collections
- API versioning via `ApiVersion` plug

### 3.2 Real-Time Architecture (Phoenix Channels / WebSocket)

WebSocket endpoint at `/socket` with JWT authentication. Channel topology:

| Channel               | Pattern          | Purpose                                           |
| --------------------- | ---------------- | ------------------------------------------------- |
| `ConversationChannel` | `conversation:*` | 1-on-1 and group chat messages, typing indicators |
| `GroupChannel`        | `group:*`        | Group-level events, member updates                |
| `UserChannel`         | `user:*`         | Per-user notifications, friend requests, presence |
| `PresenceChannel`     | `presence:*`     | Online/offline tracking (Phoenix.Presence)        |
| `CallChannel`         | `call:*`         | WebRTC signaling for voice/video calls            |
| `WebRTCLobbyChannel`  | `webrtc:lobby`   | Call initiation lobby                             |
| `VoiceStateChannel`   | `voice:*`        | Voice state tracking                              |
| `SecretChatChannel`   | `secret_chat:*`  | E2EE secret chat sessions                         |

| `ForumChannel` | `forum:*` | Forum-level real-time updates | | `ThreadChannel` | `thread:*` |
Thread-level real-time updates | | `BoardChannel` | `board:*` | Board-level real-time updates | |
`AIChannel` | `ai:*` | Streaming AI responses | | `DocumentChannel` | `document:*` | Collaborative
editing (Yjs CRDT sync) | | `QrAuthChannel` | `qr_auth:*` | QR code login authentication |

**Backpressure:** Channel backpressure module prevents message flooding.

**Socket security:** Dedicated `SocketSecurity` module for channel-level authorization.

### 3.3 PubSub

`Phoenix.PubSub` with PG2 adapter — auto-clusters across Fly.io instances via Erlang distribution.
Pool size scales with scheduler count for parallel message dispatch.

---

## 4. Authentication & Authorization

### 4.1 Authentication Flow

```
Client                        Backend
  │                              │
  ├──POST /api/v1/auth/login────►│ Verify credentials (Argon2)
  │◄──{access_token, refresh}────│ Issue JWT (Guardian / JOSE)
  │                              │
  ├──GET /api/v1/... ───────────►│ RequireAuth plug validates JWT
  │  Authorization: Bearer <jwt> │ Assigns current_user to conn
  │                              │
  ├──WS /socket?token=<jwt>─────►│ UserSocket.connect/3 verifies JWT
  │◄──Socket established─────────│ Assigns current_user to socket
```

**Providers:**

- **Email/password** — Argon2 hashing, Guardian JWT
- **OAuth 2.0** — Google, Apple, Facebook, TikTok (via Assent library)
- **Web3 wallet** — Ethereum wallet auth (EIP-4361 Sign-In with Ethereum, ex_keccak + ex_secp256k1)
- **2FA** — TOTP (nimble_totp) with backup/recovery codes
- **Cookie auth** — `CookieAuth` plug translates httpOnly cookies to Bearer tokens for web clients
- **QR code login** — `CGraph.Auth.QrLogin` for QR-based authentication with `QrAuthChannel`

**Token management:**

- JWT via Guardian + JOSE
- `TokenManager` for token lifecycle
- `TokenBlacklist` for revocation (Redis-backed)
- `JWTKeyRotation` for key rotation

### 4.2 Authorization

- **Role-based:** `Permissions.Checker` + `Permissions.Roles` for role → permission mapping
- **Group-level:** Per-group roles with permission overwrites per channel
- **Forum-level:** Board permissions, moderator roles
- **Admin:** `RequireAdmin` plug for admin-only routes
- **Account lockout:** Progressive lockout after failed attempts

---

## 5. Database Architecture

### 5.1 Database: PostgreSQL (via Ecto)

**Repositories:**

- `CGraph.Repo` — Primary write repository
- `CGraph.ReadRepo` — Read replica (falls back to primary)

**Schema highlights (from 90+ migrations):**

- `users` — Core user table with random UID, wallet fields, OAuth fields, deactivation
- `sessions` — Session tracking
- `conversations` / `conversation_participants` — DM and group conversations
- `messages` — **Partitioned table** for scalability (migration `20260213000001`)
- `groups` / `group_members` / `group_roles` / `group_channels` / `channel_categories` —
  Discord-like group structure
- `forums` / `boards` / `threads` / `posts` / `comments` — Full forum system with categories, polls,
  votes
- `friendships` / `deleted_friendships` — Friend system with history
- `notifications` — Notification delivery tracking
- `gamification tables` — achievements, quests, XP transactions, coins, shop items, marketplace,
  prestige, avatar borders, chat effects, seasonal events, battle pass tiers
- `private_messages` — PM system separate from conversations
- `referrals` — Referral tracking
- `calendar_events` — Calendar system
- `cosmetics` — Visual customizations
- `collaboration_documents` — Real-time document editing
- `delivery_receipts` — Message delivery tracking
- `e2ee_prekeys` / `e2ee_kyber_prekeys` — E2EE key exchange (X3DH + post-quantum Kyber)
- `audit_logs` — Security audit trail
- `content_reports` — Moderation reports
- `webhook_endpoints` / `webhook_deliveries` — Webhook system
- `search_history` / `dismissed_suggestions` — Search UX
- `user_customizations` / `user_theme_preferences` — Visual personalization

**ID strategy:** Snowflake IDs for messages (ordering), random UIDs for users (privacy, converted
from sequential via migration `20260111000001`).

**Performance:** Comprehensive indexing strategy including partial indexes on messages, performance
indexes, security indexes, pagination indexes.

### 5.2 Caching Architecture

3-tier caching system (`lib/cgraph/cache/`):

- **L1:** ETS (in-process, microsecond access)
- **L2:** Cachex (inter-process, millisecond access)
- **L3:** Redis (distributed, cross-instance)
- **Stampede protection** for cache thundering herd prevention
- Cache tags for targeted invalidation
- Telemetry integration for hit/miss monitoring

### 5.3 Connection Pooling

- Ecto pool with configurable size (default 50 per instance)
- PgBouncer available in `infrastructure/pgbouncer/` for connection multiplexing
- `queue_target` / `queue_interval` tuning for high-concurrency

---

## 6. Frontend Architecture (Web)

### 6.1 Technology Stack

- **Framework:** React 19 + TypeScript (strict)
- **Bundler:** Vite with SWC plugin
- **Routing:** React Router DOM v7 with lazy-loaded route groups
- **State management:** Zustand v5 (module-scoped stores)
- **Server state:** TanStack React Query v5 with offline-first, persistent cache (localStorage)
- **Styling:** Tailwind CSS + CVA (class-variance-authority) + tailwind-merge
- **UI primitives:** Radix UI (dialog, popover, tabs, tooltip, etc.)
- **Animation:** Motion 12 (formerly Framer Motion) + GSAP
- **i18n:** i18next with browser-detected language + HTTP backend
- **Real-time:** Phoenix JS client via `@cgraph/socket` package
- **E2EE:** Custom Signal Protocol implementation via `@cgraph/crypto` package
- **Charts:** Recharts v3
- **Forms/validation:** Zod
- **3D:** Three.js via react-three-fiber (landing/effects)
- **Collaborative editing:** Yjs CRDT + y-protocols

### 6.2 Module Architecture (DDD-style)

Modules in `src/modules/` follow a feature-slice pattern:

```
src/modules/<feature>/
├── api/           # API layer (TanStack Query hooks + fetch functions)
├── components/    # Feature-specific React components
├── hooks/         # Feature-specific custom hooks
├── store/         # Zustand store slice for the feature
├── types/         # TypeScript interfaces & types
└── index.ts       # Public barrel export
```

**Feature modules:** `admin`, `auth`, `calls`, `chat`, `creator`, `discovery`, `forums`, `groups`,
`moderation`, `nodes`, `premium`, `pulse`, `search`, `secret-chat`, `settings`, `social`

### 6.3 State Management

**Zustand stores** organized by domain, unified export from `src/stores/index.ts`:

- **User domain:** `useAuthStore`, `useProfileStore`, `useSettingsStore`, `useFriendStore`
- **Chat domain:** `useChatStore`, `useChatEffectsStore`, `useChatBubbleStore`,
  `useIncomingCallStore`
- **Community domain:** `useForumStore`, `useForumHostingStore`, `useAnnouncementStore`,
  `useGroupStore`, `useModerationStore`
- **Nodes Economy domain:** `useNodesStore` (in `src/modules/nodes/store`)
- **Secret Chat domain:** `useSecretChatStore` (in `src/modules/secret-chat/store`) — ghost mode,
  panic wipe, session management
- **Premium domain:** `usePremiumStore` (in `src/modules/premium/store`)
- **Theme domain:** `useThemeStore`, `useForumThemeStore`, `useCustomizationStore`
- **Utility domain:** `useNotificationStore`, `useSearchStore`, `usePluginStore`, `useCalendarStore`
- **Feature flags:** `useFeatureFlagStore` (in `src/stores/featureFlagStore.ts`)
- **Voice:** `useVoiceStateStore` (in `src/stores/voiceStateStore.ts`)

### 6.4 Routing

React Router DOM v7 with:

- **Route groups** under `src/routes/route-groups/` (`auth-routes`, `dev-routes`, `forum-routes`,
  `public-routes`, `settings-routes`)
- **Lazy-loaded pages** via `React.lazy()` + `Suspense` (`src/routes/lazyPages.ts`)
- **Route guards:** `ProtectedRoute`, `PublicRoute`, `AdminRoute`, `ProfileRedirectRoute`
  (`src/routes/guards.tsx`)
- **Auth initializer:** Token refresh and auth state hydration on app load

### 6.5 Data Flow

```
Component
  │ dispatch action / call hook
  ▼
Zustand Store (client state)  ──or──  TanStack Query (server state)
  │                                         │
  │ (optimistic update)                     │ (fetch/mutate)
  ▼                                         ▼
Socket Manager ──────────────────────► @cgraph/api-client
(Phoenix Channel)                      (Fetch + CircuitBreaker)
  │                                         │
  ▼                                         ▼
  WebSocket ──────────────────────────► REST API
  (wss://host/socket)                  (https://host/api/v1/...)
```

### 6.6 Component Architecture

- **UI primitives** in `src/components/ui/` — atomic design components (Button, Card, Input, Dialog,
  etc.)
- **Shared components** in `src/shared/components/` — reusable composed components (QuickSwitcher,
  PageTransition)
- **Feature components** in `src/modules/<feature>/components/` — domain-specific UI
- **Layouts** in `src/layouts/` — AppLayout, AuthLayout, CustomizeLayout, SocialLayout

---

## 7. Mobile Architecture (React Native / Expo)

### 7.1 Technology Stack

- **Framework:** React Native 0.81 + Expo SDK 54
- **Navigation:** React Navigation v7 (native-stack, bottom-tabs)
- **State management:** Zustand (same pattern as web)
- **Server state:** TanStack React Query v5 with async-storage persistence
- **Animation:** React Native Reanimated v4, expo-haptics
- **Auth:** Expo AuthSession, Apple Authentication, biometrics (expo-local-authentication)
- **Push:** expo-notifications
- **Real-time:** Phoenix JS client (same `@cgraph/socket` package)
- **E2EE:** Same `@cgraph/crypto` package
- **Storage:** expo-secure-store, expo-file-system
- **Media:** expo-camera, expo-image-picker, expo-audio, expo-video

### 7.2 Navigation Structure

```
RootNavigator (native-stack)
├── AuthNavigator (unauthenticated)
└── MainNavigator (authenticated)
    ├── MessagesNavigator (bottom tab)
    ├── FriendsNavigator (bottom tab)
    ├── GroupsNavigator (bottom tab)
    ├── ForumsNavigator (bottom tab)
    ├── SearchNavigator (bottom tab)
    ├── NotificationsNavigator
    └── SettingsNavigator
```

### 7.3 Module Architecture

Mirrors web module structure in `src/modules/`: `auth`, `calls`, `chat`, `forums`, `groups`,
`moderation`, `premium`, `profile`, `search`, `settings`, `social`

Each module has own `components/`, `hooks/`, `store/` etc.

**Features** (`src/features/`) provide cross-cutting feature implementations: `auth`, `forums`,
`groups`, `messaging`, `premium`

**Stores** (`src/stores/`): `authStore`, `callStore`, `chatStore`, `creatorStore`,
`customizationStore`, `featureFlagStore`, `forumStore`, `friendStore`, `groupStore`,
`notificationStore`, `settingsStore`, `themeStore`, `voiceStateStore`

**Services** (`src/services/`): `aiService`, `api`, `callService`, `calendarService`,
`creatorService`, `forumService`, `friendsService`, `groupsService`, `notificationsService`,
`premiumService`, `pushNotifications`, `referralService`, `searchService`, `settingsService`,
`tierService`

### 7.4 Platform Abstraction

`src/platform/` provides platform-specific implementations:

- `platform-adapter.ts` — main adapter
- `android/` and `ios/` directories for per-platform code

---

## 8. End-to-End Encryption (E2EE)

### 8.1 Protocol Stack (`@cgraph/crypto` package)

Signal Protocol-inspired with post-quantum extensions:

| Layer                     | Protocol                                       | File                                   |
| ------------------------- | ---------------------------------------------- | -------------------------------------- |
| Key Exchange              | X3DH (Extended Triple Diffie-Hellman)          | `packages/crypto/src/x3dh.ts`          |
| Post-Quantum Key Exchange | PQXDH (X3DH + ML-KEM-768)                      | `packages/crypto/src/pqxdh.ts`         |
| Session Ratchet           | Double Ratchet (AES-256-GCM)                   | `packages/crypto/src/doubleRatchet.ts` |
| Post-Quantum Ratchet      | Triple Ratchet (ECDH + ML-KEM-768)             | `packages/crypto/src/tripleRatchet.ts` |
| SPQR                      | Sparse Post-Quantum Ratchet                    | `packages/crypto/src/spqr.ts`          |
| SCKA                      | Sparse Continuous Key Agreement (ML-KEM Braid) | `packages/crypto/src/scka.ts`          |
| KEM                       | ML-KEM-768 (Kyber) post-quantum KEM            | `packages/crypto/src/kem.ts`           |
| Symmetric                 | AES-256-GCM                                    | `packages/crypto/src/aes.ts`           |

Also includes `file-encryption.ts` for file-level encryption.

**Dependencies:** `@noble/hashes`, `@noble/post-quantum` (no native crypto dependencies)

### 8.2 Client Integration

**Web:** `src/lib/crypto/` — Double Ratchet session manager, E2EE store (IndexedDB), secure storage
with migration support. Also includes `src/lib/wallet/` — WalletConnect integration (wagmi config,
wallet connect provider). **Mobile:** `src/lib/crypto/` — Same protocol, platform-specific secure
storage (expo-secure-store). Also includes `src/lib/wallet/` — WalletConnect integration.

---

## 9. Shared Packages

| Package                       | Purpose                                                                                                                                                                                                                         | Consumers   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `@cgraph/shared-types`        | TypeScript interfaces for API, auth, billing, creator, events, forum (customization, emoji, leaderboard, moderation, permissions, plugin, RSS, user-groups), gamification, messages, models, notifications, subscription, tiers | Web, Mobile |
| `@cgraph/api-client`          | Resilient HTTP client with circuit breaker, retry, timeout                                                                                                                                                                      | Web, Mobile |
| `@cgraph/crypto`              | Signal Protocol E2EE (X3DH, PQXDH, Double/Triple Ratchet, AES-256-GCM)                                                                                                                                                          | Web, Mobile |
| `@cgraph/socket`              | Phoenix Channel client with typed channels (conversation, group, forum, user)                                                                                                                                                   | Web, Mobile |
| `@cgraph/utils`               | Format, validation (Zod), permissions, HTTP client factory                                                                                                                                                                      | Web, Mobile |
| `@cgraph/animation-constants` | Cross-platform animation durations, easings, springs, stagger values, transitions                                                                                                                                               | Web, Mobile |

---

## 10. Observability & Infrastructure

### 10.1 Monitoring Stack

- **Metrics:** Prometheus + Telemetry (Elixir telemetry_metrics_prometheus_core)
- **Dashboards:** Grafana with provisioned dashboards and alerts
- **Tracing:** OpenTelemetry (Phoenix, Ecto, Oban instrumented) → Tempo
- **Logs:** Promtail → Loki → Grafana
- **Alerts:** Alertmanager with configured rules
- **Error tracking:** Sentry (both backend and frontend)
- **Alloy:** Grafana Alloy for unified telemetry collection

### 10.2 Deployment

- **Backend:** Fly.io with DNS-based clustering for multi-region, Bandit HTTP server
- **Web/Landing:** Vercel with edge rewrites (API proxy)
- **CDN/WAF:** Cloudflare (Terraform-managed: WAF rules, rate limiting, caching, DNS)
- **Database:** PostgreSQL (Supabase-hosted, SSL)
- **Infrastructure-as-Code:** Terraform for Cloudflare configuration
- **Load testing:** k6 scripts in `infrastructure/load-tests/`

### 10.3 Payment Processing

- **Stripe** integration via `stripity_stripe` (backend) + `@stripe/react-stripe-js` (frontend)
- Stripe webhook controller for event processing
- Premium subscription tiers with feature gating

### 10.4 Email

- **Swoosh** for email delivery (Finch HTTP adapter)
- Email digest worker, notification emails

---

## 11. Security Architecture

### 11.1 Backend Security

- **Rate limiting:** Sliding window algorithm with tiered limits (RateLimiterV2), Redis-backed with
  ETS fallback
- **Input validation:** Dedicated `InputValidation` module, Zod schemas on frontend
- **Security headers:** HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **CORS:** Corsica library
- **Abuse detection:** `Security.AbuseDetection`
- **Password breach check:** HaveIBeenPwned integration
- **Account lockout:** Progressive lockout with configurable thresholds
- **Token blacklist:** JWT revocation via Redis
- **Audit logging:** Per-category audit trail (auth, user, admin)
- **GDPR:** Data export pipeline + hard delete

### 11.2 Frontend Security

- `src/lib/security/` — CSS sanitization, input validation, XSS/CSRF protection
- DOMPurify for HTML sanitization
- Content Security Policy enforcement

### 11.3 Static Analysis

- **Credo** — Elixir linting
- **Sobelow** — Phoenix security scanning
- **Dialyzer** — Erlang/Elixir type checking
- **mix_audit** — Dependency vulnerability scanning
- **ESLint** — TypeScript/React linting (architecture enforcement rules)
- **detect-secrets** — Pre-commit secret scanning
