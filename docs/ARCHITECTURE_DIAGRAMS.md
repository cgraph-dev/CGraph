# CGraph Architecture Diagrams

> **Version: 0.9.48** | Last Updated: March 12, 2026

Visual documentation of CGraph's system architecture.

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Clients["Client Applications"]
        WEB["🌐 Web App<br/>React 19 / Vite"]
        MOBILE["📱 Mobile App<br/>Expo 54 / RN"]
        LANDING["🏠 Landing Page<br/>React / Vite"]
    end

    subgraph Edge["Edge Layer"]
        CF["☁️ Cloudflare<br/>WAF / CDN / DDoS"]
    end

    subgraph Hosting["Hosting"]
        VERCEL["▲ Vercel<br/>Web + Landing"]
        FLY["🚀 Fly.io<br/>Backend API"]
    end

    subgraph Backend["Backend Services"]
        PHOENIX["🔥 Phoenix 1.8<br/>Elixir API"]
        CHANNELS["📡 Phoenix Channels<br/>WebSocket"]
        OBAN["⚙️ Oban<br/>Background Jobs"]
        AI["🤖 AI Service<br/>Chat/Moderate/Summarize"]
        CRDT["📝 CRDT Collaboration<br/>Yjs + DocumentServer"]
    end

    subgraph Data["Data Layer"]
        PG[("🐘 PostgreSQL 16<br/>95 Tables")]
        REDIS[("🔴 Redis 7<br/>Cache / PubSub")]
    end

    subgraph External["External Services"]
        STRIPE["💳 Stripe<br/>Payments"]
        S3["📦 S3<br/>File Storage"]
    end

    WEB --> CF
    MOBILE --> CF
    LANDING --> CF

    CF --> VERCEL
    CF --> FLY

    VERCEL --> PHOENIX
    FLY --> PHOENIX

    PHOENIX --> CHANNELS
    PHOENIX --> OBAN
    PHOENIX --> AI
    PHOENIX --> CRDT
    PHOENIX --> PG
    PHOENIX --> REDIS
    CHANNELS --> REDIS

    PHOENIX --> STRIPE
    PHOENIX --> S3
```

---

## 2. Dual-App Architecture ()

```mermaid
flowchart LR
    subgraph Public["Public Domain: cgraph.org"]
        LP["Landing Page<br/>/"]
        AUTH["Auth Pages<br/>/login, /register"]
        LEGAL["Legal Pages<br/>/privacy, /terms"]
        COMPANY["Company Pages<br/>/about, /careers"]
    end

    subgraph App["App Domain: app.cgraph.org"]
        DASH["Dashboard<br/>/"]
        MSG["Messages<br/>/messages"]
        FORUMS["Forums<br/>/forums"]
        SETTINGS["Settings<br/>/settings"]
    end

    LP -->|"Login"| AUTH
    AUTH -->|"Authenticated"| DASH
    DASH --> MSG
    DASH --> FORUMS
    DASH --> SETTINGS

    style Public fill:#e1f5fe
    style App fill:#f3e5f5
```

---

## 3. Real-Time Communication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant WS as Phoenix Channel
    participant PS as PubSub (Redis)
    participant DB as PostgreSQL

    C->>WS: Connect (JWT)
    WS->>WS: Authenticate
    WS->>PS: Subscribe to topics

    C->>WS: Send Message
    WS->>DB: Persist message
    WS->>PS: Broadcast to topic
    PS->>WS: Deliver to subscribers
    WS->>C: Message received

    Note over C,DB: Messages encrypted E2EE client-side
```

---

## 4. E2EE Message Flow (Triple Ratchet / PQXDH)

```mermaid
sequenceDiagram
    participant A as Alice (Sender)
    participant S as Server
    participant B as Bob (Recipient)

    Note over A,B: Key Exchange (PQXDH / ML-KEM-768)
    A->>S: Fetch Bob's prekey bundle
    S->>A: {identity_key, signed_prekey, kem_prekey, one_time_prekey?}
    A->>A: Generate shared secret (PQXDH: ECDH + ML-KEM-768)
    A->>A: Split secret → {skEc, skScka}

    Note over A,B: Message Encryption (Triple Ratchet)
    A->>A: Encrypt message (KDF_HYBRID → AES-256-GCM)
    A->>S: Send encrypted message + header
    S->>B: Deliver encrypted message
    B->>B: Decrypt message (KDF_HYBRID)
    B->>B: Advance EC + PQ ratchets

    Note over S: Server CANNOT decrypt messages
```

---

## 5. Monorepo Structure

```mermaid
flowchart TB
    subgraph Root["/ (Root)"]
        PKG["package.json"]
        TURBO["turbo.json"]
        PNPM["pnpm-workspace.yaml"]
    end

    subgraph Apps["apps/"]
        BACKEND["backend/<br/>Phoenix API"]
        WEB["web/<br/>React SPA"]
        MOBILE["mobile/<br/>Expo App"]
        LANDING["landing/<br/>Marketing"]
    end

    subgraph Packages["packages/"]
        TYPES["shared-types/<br/>TypeScript types"]
        UTILS["utils/<br/>Shared utilities"]
        CRYPTO["crypto/<br/>PQ E2EE (PQXDH + Triple Ratchet)"]
        SOCKET["socket/<br/>Phoenix connection"]
        ANIM["animation-constants/<br/>Spring configs"]
    end

    subgraph Infra["infrastructure/"]
        DOCKER["docker/<br/>Dockerfiles"]
        TERRAFORM["terraform/<br/>IaC"]
    end

    Root --> Apps
    Root --> Packages
    Root --> Infra

    WEB --> TYPES
    WEB --> UTILS
    WEB --> CRYPTO
    WEB --> SOCKET
    MOBILE --> TYPES
    MOBILE --> UTILS
    MOBILE --> CRYPTO
    MOBILE --> SOCKET
    LANDING --> ANIM
```

---

## 6. Database Schema Overview

```mermaid
erDiagram
    USERS ||--o{ CONVERSATIONS : participates
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ POSTS : creates
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ REFERRALS : refers

    CONVERSATIONS ||--o{ MESSAGES : contains
    CONVERSATIONS ||--o{ PARTICIPANTS : has

    FORUMS ||--o{ POSTS : contains
    POSTS ||--o{ COMMENTS : has
    POSTS ||--o{ VOTES : receives

    SERVERS ||--o{ CHANNELS : contains
    SERVERS ||--o{ ROLES : defines
    SERVERS ||--o{ MEMBERS : has

    USERS {
        uuid id PK
        string email UK
        string username UK
        string password_hash
        timestamp inserted_at
    }

    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text encrypted_content
        timestamp inserted_at
    }

    POSTS {
        uuid id PK
        uuid forum_id FK
        uuid author_id FK
        string title
        text content
        int score
    }
```

---

## 7. Phoenix Router Pipeline Architecture (v0.9.26)

```mermaid
flowchart TB
    subgraph Request["Incoming Request"]
        REQ["HTTP Request"]
    end

    subgraph Pipelines["Router Pipelines"]
        API["api<br/>SecurityHeaders → CookieAuth<br/>→ RequestTracing → RateLimiter(standard)<br/>→ ApiVersion → Idempotency → Sentry"]
        STRICT["api_auth_strict<br/>SecurityHeaders → CookieAuth<br/>→ RequestTracing → RateLimiter(strict)<br/>→ ApiVersion → Idempotency → Sentry"]
        RELAXED["api_relaxed<br/>SecurityHeaders → RequestTracing<br/>→ RateLimiter(relaxed)<br/>→ ApiVersion → Sentry"]
        AUTH["api_auth<br/>api plugs + RequireAuth<br/>(JWT verification → current_user)"]
        ADMIN["api_admin<br/>RequireAuth + RequireAdmin<br/>(admin role check)"]
    end

    subgraph Routes["Route Evaluation Order"]
        R1["health_routes()"]
        R2["auth_routes()<br/>register, login, OAuth, wallet, 2FA"]
        R3["user_routes() ⚠️ BEFORE public<br/>/tiers/me, /emojis/favorites"]
        R4["public_routes()<br/>/tiers/:tier, /emojis/:id"]
        R5["messaging_routes()<br/>conversations, groups"]
        R6["forum_routes()<br/>boards, threads"]
        R7["gamification_routes()<br/>XP, quests, shop"]
        R8["admin_routes()<br/>admin dashboard"]
    end

    REQ --> R1
    R1 --> R2 --> R3 --> R4 --> R5 --> R6 --> R7 --> R8

    R1 -.->|":api"| API
    R2 -.->|":api_auth_strict"| STRICT
    R3 -.->|":api + :api_auth"| AUTH
    R4 -.->|":api_relaxed"| RELAXED
    R5 -.->|":api + :api_auth"| AUTH
    R6 -.->|":api + :api_auth"| AUTH
    R7 -.->|":api + :api_auth"| AUTH
    R8 -.->|":api_admin"| ADMIN

    style Routes fill:#e3f2fd
    style Pipelines fill:#f3e5f5
```

> **Critical**: `user_routes()` MUST evaluate before `public_routes()`. Public routes contain
> wildcard patterns (`/tiers/:tier`, `/emojis/:id`) that would shadow specific authenticated routes
> (`/tiers/me`, `/emojis/favorites`, `/emojis/recent`).

---

## 8. Authentication Flow

```mermaid
flowchart TB
    START([User visits app])

    START --> CHECK{Has valid<br/>session?}

    CHECK -->|Yes| APP[Access App]
    CHECK -->|No| LOGIN[Show Login]

    LOGIN --> CHOOSE{Auth Method}

    CHOOSE -->|Email| EMAIL[Email + Password]
    CHOOSE -->|OAuth| OAUTH[Google/Apple/FB]
    CHOOSE -->|Wallet| WALLET[Web3 Connect]

    EMAIL --> VERIFY{Valid?}
    OAUTH --> CALLBACK[OAuth Callback]
    WALLET --> SIGN[Sign Message]

    VERIFY -->|Yes| TOKEN[Generate JWT]
    VERIFY -->|No| ERROR[Show Error]
    CALLBACK --> TOKEN
    SIGN --> TOKEN

    TOKEN --> SESSION[Create Session]
    SESSION --> APP

    ERROR --> LOGIN
```

---

## 9. Deployment Pipeline

```mermaid
flowchart LR
    subgraph Dev["Development"]
        CODE["Code Push"]
        PR["Pull Request"]
    end

    subgraph CI["CI Pipeline"]
        LINT["Lint + Format"]
        TYPE["TypeScript"]
        TEST["Tests"]
        SEC["Security Scan"]
        BUILD["Build"]
    end

    subgraph Deploy["Deployment"]
        STAGE["Staging"]
        PROD["Production"]
    end

    CODE --> PR
    PR --> LINT
    LINT --> TYPE
    TYPE --> TEST
    TEST --> SEC
    SEC --> BUILD

    BUILD -->|"main branch"| STAGE
    STAGE -->|"Manual approve"| PROD

    style Dev fill:#fff3e0
    style CI fill:#e8f5e9
    style Deploy fill:#e3f2fd
```

---

## 10. State Management (Zustand Stores)

```mermaid
flowchart TB
    subgraph Stores["Zustand Stores"]
        AUTH["authStore<br/>User session"]
        CHAT["chatStore<br/>Messages"]
        THEME["themeStore<br/>UI theme"]
        E2EE["e2eeStore<br/>Encryption keys"]
        NOTIFICATION["notificationStore<br/>Alerts"]
    end

    subgraph Components["React Components"]
        COMP["Components"]
    end

    subgraph Persist["Persistence"]
        LOCAL["localStorage"]
        SECURE["SecureStore (mobile)"]
        INDEXED["IndexedDB"]
    end

    COMP -->|"selectors"| Stores
    AUTH --> LOCAL
    THEME --> LOCAL
    E2EE --> INDEXED
    E2EE --> SECURE
```

---

## 11. Facade Hook Architecture

```mermaid
flowchart TB
    subgraph Facades["Domain Facade Hooks"]
        AF["useAuthFacade<br/>Auth + Session"]
        CF["useChatFacade<br/>Messages + Effects"]
        GF["useGamificationFacade<br/>XP + Prestige + Events"]
        SF["useSettingsFacade<br/>Preferences + Theme"]
        CMF["useCommunityFacade<br/>Forums + Groups"]
        MF["useMarketplaceFacade<br/>Listings + Borders"]
        UF["useUIFacade<br/>Notifications + Search"]
    end

    subgraph Stores["Zustand Stores (Primitive Selectors)"]
        AS["authStore"]
        CS["chatStore"]
        CES["chatEffectsStore"]
        CBS["chatBubbleStore"]
        GS["gamificationStore"]
        PS["prestigeStore"]
        SES["seasonalEventStore"]
        RS["referralStore"]
        SS["settingsStore"]
        CUS["customizationStore"]
        TS["themeStore"]
        FS["forumStore"]
        GRS["groupStore"]
        ANS["announcementStore"]
        MS["marketplaceStore"]
        ABS["avatarBorderStore"]
        NS["notificationStore"]
        SRS["searchStore"]
        CAS["calendarStore"]
    end

    subgraph Components["React Components"]
        COMP["Components use facades<br/>not stores directly"]
    end

    COMP --> Facades
    AF --> AS
    CF --> CS
    CF --> CES
    CF --> CBS
    GF --> GS
    GF --> PS
    GF --> SES
    GF --> RS
    SF --> SS
    SF --> CUS
    SF --> TS
    CMF --> FS
    CMF --> GRS
    CMF --> ANS
    MF --> MS
    MF --> ABS
    UF --> NS
    UF --> SRS
    UF --> CAS

    style Facades fill:#10b981,color:#fff
    style Stores fill:#3b82f6,color:#fff
    style Components fill:#8b5cf6,color:#fff
```

**Pattern**: Components → Facade Hook → Multiple Stores. Each facade uses primitive selectors
(individual field subscriptions) to prevent re-render storms, then returns a stable `useMemo`'d
object.

---

## 12. Socket Module Architecture

```mermaid
graph TD
    SM["SocketManager<br/>(Orchestrator — 616 lines)"] --> UC["userChannel.ts<br/>E2EE · Calls · Presence"]
    SM --> PM["presenceManager.ts<br/>Lobby · Online Queries"]
    SM --> CC["conversationChannel.ts<br/>Messages · Typing · Reactions"]
    SM --> GC["groupChannel.ts<br/>Group Messages · Typing"]
    SM --> CH["channelHandlers.ts<br/>Forum + Thread Handlers"]

    UC --> |"e2ee:key_revoked"| E2EE["useE2EEStore"]
    UC --> |"incoming_call"| CALL["useIncomingCallStore"]
    UC --> |"conversation_*"| CHAT["useChatStore"]
    PM --> |"friend_online/offline"| STATUS["Status Listeners"]
    CC --> |"new_message / typing"| CHAT
    GC --> |"new_message / typing"| GRP["useGroupStore"]
    CH --> |"new_thread / comment"| FRM["useForumStore"]

    style SM fill:#4f46e5,color:#fff
    style UC fill:#7c3aed,color:#fff
    style PM fill:#2563eb,color:#fff
    style CC fill:#0891b2,color:#fff
    style GC fill:#059669,color:#fff
    style CH fill:#d97706,color:#fff
```

> Each channel module is a **pure function** that receives socket state references and wires up
> Phoenix channel event handlers. The SocketManager delegates via thin wrapper methods, preserving
> the same public API while splitting a 960-line monolith into 5 focused modules.

---

## 13. Request Flow

```mermaid
flowchart LR
    CLIENT["Client"] --> CDN["Cloudflare CDN"]
    CDN --> LB["Load Balancer"]
    LB --> PHOENIX["Phoenix"]

    PHOENIX --> PLUG["Plug Pipeline"]
    PLUG --> AUTH["Auth Middleware"]
    AUTH --> RATE["Rate Limiter"]
    RATE --> CONTROLLER["Controller"]

    CONTROLLER --> CONTEXT["Business Context"]
    CONTEXT --> REPO["Ecto Repo"]
    REPO --> DB[("PostgreSQL")]

    CONTROLLER --> RESPONSE["JSON Response"]
    RESPONSE --> CLIENT
```

---

## Diagram Legend

| Symbol | Meaning            |
| ------ | ------------------ |
| 🌐     | Web application    |
| 📱     | Mobile application |
| 🔥     | Phoenix/Elixir     |
| 🐘     | PostgreSQL         |
| 🔴     | Redis              |
| ☁️     | Cloud service      |
| 💳     | Payment service    |
| 📦     | Storage service    |

---

## 14. AI Service Architecture (v0.9.34)

```mermaid
flowchart TB
    subgraph Clients["Client Layer"]
        WEB_AI["Web App<br/>aiService.ts"]
        REST["REST API<br/>/api/v1/ai/*"]
    end

    subgraph Channels["Phoenix Channels"]
        AI_CH["ai:{user_id}<br/>Streaming responses"]
    end

    subgraph AI_Core["AI Context (CGraph.AI)"]
        CHAT["chat/3<br/>Streaming completion"]
        SUMMARIZE["summarize/2<br/>Text summarization"]
        MODERATE["moderate/2<br/>Content moderation"]
        SENTIMENT["analyze_sentiment/1<br/>Sentiment analysis"]
    end

    subgraph Support["Support Modules"]
        RL["RateLimiter<br/>Per-user + tier limits"]
        MOD["Moderation<br/>LLM + heuristic fallback"]
        SENT["Sentiment<br/>LLM + keyword fallback"]
        PROV["Provider<br/>OpenAI / Anthropic / local"]
    end

    subgraph External["LLM Provider"]
        LLM["OpenAI / Anthropic API<br/>via Req HTTP"]
    end

    WEB_AI --> AI_CH
    REST --> AI_Core
    AI_CH --> AI_Core

    CHAT --> RL
    CHAT --> PROV
    SUMMARIZE --> PROV
    MODERATE --> MOD
    SENTIMENT --> SENT

    MOD --> PROV
    SENT --> PROV
    PROV --> LLM

    style AI_Core fill:#7c3aed,color:#fff
    style Support fill:#2563eb,color:#fff
```

---

## 15. CRDT Collaboration Architecture (v0.9.34)

```mermaid
flowchart TB
    subgraph Clients["Collaborating Clients"]
        C1["Client A<br/>Yjs Doc + PhoenixProvider"]
        C2["Client B<br/>Yjs Doc + PhoenixProvider"]
        C3["Client C<br/>Yjs Doc + PhoenixProvider"]
    end

    subgraph Phoenix["Phoenix Backend"]
        DOC_CH["document:{id}<br/>DocumentChannel"]
        DOC_SRV["DocumentServer<br/>GenServer per-document"]
        REG["DocumentRegistry<br/>Process Registry"]
        SUP["DocumentSupervisor<br/>DynamicSupervisor"]
    end

    subgraph Storage["Persistence"]
        DB[("PostgreSQL<br/>collaboration_documents")]
    end

    C1 <-->|"Yjs updates<br/>(binary)"| DOC_CH
    C2 <-->|"Yjs updates<br/>(binary)"| DOC_CH
    C3 <-->|"Yjs updates<br/>(binary)"| DOC_CH

    DOC_CH --> DOC_SRV
    DOC_SRV --> REG
    SUP --> DOC_SRV
    DOC_SRV --> DB

    style Phoenix fill:#059669,color:#fff
    style Clients fill:#d97706,color:#fff
```

> **Pattern:** Each document gets a dedicated GenServer (started on-demand via DynamicSupervisor).
> The server holds the Yjs document state, merges incoming updates, broadcasts to all connected
> clients, and periodically persists snapshots to PostgreSQL.

---

## 16. Offline-First Mobile Architecture (v0.9.34)

```mermaid
flowchart TB
    subgraph Mobile["Mobile App (Expo/RN)"]
        UI["React Components<br/>useSync / useOfflineStatus"]
        WDB["WatermelonDB<br/>SQLite (9 tables)"]
        SYNC["SyncEngine<br/>Pull/Push/Conflict Resolution"]
    end

    subgraph Backend["Phoenix Backend"]
        SYNC_API["/api/v1/sync<br/>SyncController"]
        CONTEXTS["Business Contexts<br/>Messaging / Accounts / Groups"]
        DB[("PostgreSQL<br/>Source of Truth")]
    end

    UI --> WDB
    UI --> SYNC

    SYNC -->|"Pull: GET /sync/pull?since=ts"| SYNC_API
    SYNC -->|"Push: POST /sync/push"| SYNC_API

    SYNC_API --> CONTEXTS
    CONTEXTS --> DB

    SYNC_API -->|"Changes + timestamp"| SYNC
    SYNC -->|"Apply to local DB"| WDB

    style Mobile fill:#f59e0b,color:#000
    style Backend fill:#4f46e5,color:#fff
```

> **Sync Protocol:** Last-write-wins with server timestamps. Mobile pulls all changes since last
> sync timestamp, applies them to WatermelonDB, then pushes locally created/modified records. The
> server resolves conflicts using `updated_at` comparison. Nine tables synced: users, conversations,
> messages, participants, groups, group_members, group_messages, channels, and notifications.

---

## 17. Cosmetics & Unlock Engine Architecture (Phase 33 + 35)

```mermaid
flowchart TB
    subgraph Rarity["Canonical Rarity System (Phase 33)"]
        RT["Rarity Module<br/>7-tier: free → mythic"]
        CM["Cosmetics Manifest<br/>325 items total"]
    end

    subgraph Schemas["Cosmetic Schemas (Phase 35)"]
        B["Badge (70)"]
        NP["Nameplate (45)"]
        PE["ProfileEffect"]
        PF["ProfileFrame (55)"]
        NS["NameStyle (50)"]
        INV["Inventory<br/>Unified per-user"]
    end

    subgraph Engine["Unlock Engine"]
        UE["UnlockEngine<br/>evaluate conditions"]
        AE["AchievementEvaluator"]
        CE["CollectionEvaluator"]
        EE["EventEvaluator"]
        LE["LevelEvaluator"]
        PE2["PurchaseEvaluator"]
        VR["VisibilityRules<br/>rarity + ownership gating"]
        UE --> AE & CE & EE & LE & PE2
    end

    subgraph Workers["Background Processing"]
        UCW["UnlockCheckWorker<br/>Oban — evaluates on activity"]
        SRW["SeasonalRotationWorker<br/>quarterly rotation"]
    end

    subgraph API["REST API"]
        CC["CosmeticsController<br/>inventory / equip / unequip"]
        BC["BadgeController"]
        NC["NameplateController"]
    end

    RT --> Schemas
    Schemas --> INV
    INV --> UE
    UE --> VR
    Workers --> UE
    API --> INV

    style Engine fill:#a855f7,color:#fff
    style Rarity fill:#f59e0b,color:#000
```

> **Phase 33** unified rarity to 7 tiers and created the cosmetics manifest (325 items). **Phase 35** implemented all schemas, the unlock engine with 5 evaluators, unified inventory, API controllers, and frontend UI (web + mobile).

---

## 18. Creator Economy Architecture (Phase 36)

```mermaid
flowchart TB
    subgraph PaidDM["Paid DM Files"]
        PDS["PaidDmSetting<br/>per-user pricing config"]
        PDF["PaidDmFile<br/>locked file + price"]
        PDC["PaidDmController<br/>send / unlock / settings"]
    end

    subgraph Premium["Premium Content"]
        PT["PremiumThread<br/>gated forum threads"]
        ST["SubscriptionTier<br/>up to 3 tiers per forum"]
        RS["RevenueSplit<br/>80% creator / 20% platform"]
        RSW["RevenueSplitWorker<br/>async payout processing"]
    end

    subgraph Boosts["Content Boosts"]
        BO["Boost<br/>forum + thread boosts"]
        BE["BoostEffect<br/>visibility multiplier"]
        BOC["BoostController"]
    end

    subgraph Compliance["Compliance Layer"]
        AG["AgeGate<br/>regional age verification"]
        TR["TaxReporter<br/>earnings reports + 1099"]
    end

    subgraph Creator["Creator Dashboard"]
        CR["Creators Context<br/>earnings / payouts / onboarding"]
        CC["CreatorController<br/>status / analytics / tiers"]
        CAC["CreatorAnalyticsController"]
    end

    PaidDM --> RS
    Premium --> RS
    Boosts --> RS
    RS --> RSW
    Creator --> Compliance

    style PaidDM fill:#3b82f6,color:#fff
    style Premium fill:#8b5cf6,color:#fff
    style Compliance fill:#ef4444,color:#fff
```

> **Phase 36** added the full creator economy: paid DM file monetization, premium threads with subscription tiers, content boosts, revenue splits (80/20), compliance layer (AgeGate + TaxReporter), GDPR export extension, and creator dashboard UI on web + mobile.

---

## 19. Forum Transformation Architecture (Phase 37)

```mermaid
flowchart TB
    subgraph Identity["Identity System"]
        IC["IdentityCard<br/>per-user forum identity"]
        PCF["PostCreationFlow<br/>structured post flow"]
        REP["Reputation<br/>per-forum scoring"]
    end

    subgraph Tags["Thread Organization"]
        TC["TagCategory<br/>category groupings"]
        TT["ThreadTag<br/>thread classification"]
        TTP["ThreadTemplate<br/>structured templates"]
    end

    subgraph Social["Social Features"]
        AM["AtMention<br/>@user notifications"]
        SP["ScheduledPost<br/>time-delayed publishing"]
        FA["ForumAnalytics<br/>engagement metrics"]
    end

    subgraph Admin["Administration"]
        CF["CustomForum<br/>user-created forums"]
        ML["ModerationLog<br/>audit trail"]
        FP["ForumPermission<br/>21-flag permission system"]
        PT["PermissionTemplate<br/>reusable permission sets"]
        FAC["ForumAdminController"]
        FMC["ForumModerationController"]
    end

    subgraph Workers2["Background Workers"]
        SPW["ScheduledPostWorker"]
        FAW["ForumAnalyticsWorker"]
        RRW["ReputationRecalcWorker"]
        DW["DigestWorker"]
    end

    Identity --> Social
    Tags --> Social
    Social --> Workers2
    Admin --> ML

    style Identity fill:#10b981,color:#fff
    style Admin fill:#ef4444,color:#fff
    style Tags fill:#f59e0b,color:#000
```

> **Phase 37** transformed forums with identity cards, thread tags/categories, @mentions, templates, analytics, scheduled posts, custom forums, moderation log, extended permissions (21 flags + templates), and full web + mobile UI (13+ web components, 12+ mobile components).

---

## 20. Infrastructure Scaling Architecture (Phase 38)

```mermaid
flowchart TB
    subgraph Sharding["Database Sharding"]
        SM["ShardManager<br/>GenServer"]
        CH["ConsistentHash<br/>256 vnodes / ring"]
        SR["ShardRouter<br/>route(table, key, mode)"]
        SMIG["ShardMigration<br/>split / merge / verify"]
        SM --> CH
        SR --> SM
        SMIG --> SM
    end

    subgraph Caching["Multi-Tier Cache"]
        MTC["MultiTierCache<br/>build_key / fetch / put"]
        L1["L1 — ETS<br/>1 min TTL"]
        L2["L2 — Cachex<br/>15 min TTL"]
        L3["L3 — Redis<br/>24 h TTL"]
        CW["CacheWarmer<br/>boot + periodic"]
        CI["CacheInvalidator<br/>PubSub-driven"]
        MTC --> L1 --> L2 --> L3
        CW --> MTC
        CI --> MTC
    end

    subgraph Queues["Queue & Search"]
        PQ["PriorityQueue<br/>critical / high / normal / low"]
        DLQ["DeadLetterQueue<br/>ETS + admin API"]
        EA["ElasticAdapter<br/>ES / OpenSearch / pg fallback"]
        SI["SearchIndexer<br/>bulk indexing"]
        PQ --> DLQ
        EA --> SI
    end

    subgraph Monitoring["Monitoring Stack"]
        HD["HealthDashboard<br/>component status"]
        AL["Alerting<br/>Slack + PagerDuty"]
        MC["MetricsCollector<br/>SLO tracking"]
        HD --> AL
        MC --> AL
    end

    subgraph Operations["Operations Toolkit"]
        RB["Runbook<br/>define_runbook macro"]
        CP["CapacityPlanner<br/>linear regression"]
        DR["DisasterRecovery<br/>failover / promote"]
        PP["PerformanceProfiler<br/>flame graph / slow queries"]
    end

    subgraph Archival["Data Archival"]
        AP["ArchivePolicy<br/>365-day threshold"]
        AR["Archival Context<br/>archive / restore"]
        AW["ArchivalWorker<br/>monthly Oban cron"]
        AP --> AR --> AW
    end

    subgraph CDN["CDN Management"]
        CM["CDNManager<br/>R2 / S3 backend"]
        IO["ImageOptimizer<br/>resize / WebP / srcset"]
        CM --> IO
    end

    subgraph Presence["Distributed Presence"]
        DP["DistributedPresence<br/>CRDT multi-node"]
    end
```

> **Phase 38 adds 26 Elixir modules** across 8 subsystems covering database sharding,
> multi-tier caching, data archival, priority queues, search infrastructure, distributed
> presence, CDN management, monitoring, and operations toolkit. All modules are optionally
> enabled via runtime configuration.

---

<sub>**CGraph Architecture Diagrams** • Version 0.9.48 • Last updated: March 12, 2026</sub>
