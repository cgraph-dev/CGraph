# CGraph Architecture Diagrams

> **Version: 0.9.26** | Last Updated: February 16, 2026

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
    end

    subgraph Data["Data Layer"]
        PG[("🐘 PostgreSQL 16<br/>91 Tables")]
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

## 4. E2EE Message Flow (Signal Protocol)

```mermaid
sequenceDiagram
    participant A as Alice (Sender)
    participant S as Server
    participant B as Bob (Recipient)

    Note over A,B: Key Exchange (X3DH)
    A->>S: Fetch Bob's prekey bundle
    S->>A: {identity_key, signed_prekey, one_time_prekey}
    A->>A: Generate shared secret (X3DH)

    Note over A,B: Message Encryption (Double Ratchet)
    A->>A: Encrypt message (AES-256-GCM)
    A->>S: Send encrypted message
    S->>B: Deliver encrypted message
    B->>B: Decrypt message
    B->>B: Ratchet keys forward

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
        UI["ui/<br/>Component library"]
        CONFIG["config/<br/>Shared configs"]
    end

    subgraph Infra["infrastructure/"]
        DOCKER["docker/<br/>Dockerfiles"]
        K8S["kubernetes/<br/>K8s manifests"]
        TERRAFORM["terraform/<br/>IaC"]
    end

    Root --> Apps
    Root --> Packages
    Root --> Infra

    WEB --> TYPES
    WEB --> UTILS
    WEB --> UI
    MOBILE --> TYPES
    MOBILE --> UTILS
    MOBILE --> UI
    LANDING --> UI
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

<sub>**CGraph Architecture Diagrams** • Version 0.9.26 • Last updated: February 16, 2026</sub>
