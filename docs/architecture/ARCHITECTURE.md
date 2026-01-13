## CGraph System Architecture

> Last updated: January 2026 | Version 0.7.41  
> Living documentation — End-to-end encryption, Message intelligence, Enhanced UI v3.0, Spatial Audio, and distributed systems complete

---

## Executive Summary

CGraph is a production-ready communication platform that seamlessly integrates real-time messaging with persistent forum discussions. Built to address the limitations of platforms that either excel at ephemeral conversations or long-form discussions—but rarely both—CGraph provides a unified experience across web and mobile.

The platform serves four primary use cases: (1) encrypted instant messaging with industry-standard end-to-end encryption between individuals and within group channels, (2) community-driven forum discussions with voting and moderation, (3) real-time voice and video calls via WebRTC with spatial audio, and (4) a comprehensive friends system with presence tracking that connects users across all features.

**v0.7.35 introduces industry-leading enhancements:**
- **Double Ratchet Protocol** — Forward secrecy, break-in recovery, out-of-order message handling
- **Message Intelligence** — Smart replies, sentiment analysis, content moderation, topic extraction  
- **Holographic UI System** — Futuristic interface components with 3D effects
- **Spatial Audio Engine** — HRTF-based 3D positional audio for VR/AR readiness

Authentication is flexible, supporting traditional email/password, OAuth social login (Google, Apple), and privacy-focused Web3 wallet authentication. Users choose their preferred identity model without compromise.

Our technology stack prioritizes real-time performance and developer productivity. Elixir/Phoenix powers the backend, leveraging OTP's actor model for managing hundreds of thousands of concurrent WebSocket connections with minimal resource overhead. React 19 drives both web (via Vite) and mobile (via React Native/Expo) clients, sharing TypeScript types and business logic through a carefully architected monorepo. PostgreSQL 16 handles persistent data with advanced JSON operations, while Meilisearch provides sub-50ms full-text search. Phoenix Presence (CRDT-based) tracks online status with tiered sampling for million-user channels.

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Web App (React 19 + Vite)     │    Mobile (React Native + Expo)    │
│  - TailwindCSS for styling     │    - React Navigation              │
│  - Zustand for state           │    - Async Storage                 │
│  - Socket.io-like via Phoenix  │    - Expo Push Notifications       │
│  - TypeScript everywhere       │    - Same shared-types package     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ENHANCED UI v3.0 (v0.7.35)                                    │  │
│  │ - Double Ratchet Encryption    - AI Message Intelligence      │  │
│  │ - Holographic UI Components    - Spatial Audio Engine         │  │
│  │ - Three.js 3D Environments     - GSAP/Framer Motion          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Cloudflare (CDN + WAF + DDoS Protection)                           │
│  - Rate limiting at edge                                             │
│  - Geographic routing                                                │
│  - SSL termination                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  Phoenix Framework (Elixir 1.19+ / OTP 28)                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   REST API  │ │  WebSocket  │ │  Background │ │   Guardian  │   │
│  │  Endpoints  │ │  Channels   │ │  Jobs(Oban) │ │    (Auth)   │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│  │   WebRTC    │ │  Meilisearch│ │ Distributed │                   │
│  │  Signaling  │ │   Search    │ │ Rate Limit  │                   │
│  └─────────────┘ └─────────────┘ └─────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│  PostgreSQL 16              │  Redis 7                │ Meilisearch │
│  - Primary data store       │  - Session cache        │ - Full-text │
│  - Transactional safety     │  - Presence tracking    │ - Fuzzy     │
│  - Ecto for ORM             │  - Rate limiting        │ - Typo-     │
│                             │  - Pub/Sub clustering   │   tolerant  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
├─────────────────────────────────────────────────────────────────────┤
│  Cloudflare R2    │  Stripe       │  Resend      │  STUN/TURN      │
│  (File storage)   │  (Payments)   │  (Email)     │  (NAT traversal)│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Client-Side Security Architecture (v0.7.35)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SIGNAL PROTOCOL ENCRYPTION                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   X3DH Key      │───▶│  Double Ratchet │───▶│   AES-256-GCM   │ │
│  │   Agreement     │    │   Engine        │    │   Encryption    │ │
│  │   (P-384)       │    │                 │    │                 │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│           │                      │                      │          │
│           ▼                      ▼                      ▼          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  Identity Keys  │    │  DH Ratchet     │    │  Message Keys   │ │
│  │  Pre-Keys       │    │  (per exchange) │    │  (per message)  │ │
│  │  One-Time Keys  │    │  Chain Keys     │    │  Nonces         │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  Security Properties:                                                │
│  ✓ Forward Secrecy — Past messages stay secure if keys compromise   │
│  ✓ Break-in Recovery — Future messages secure after key refresh     │
│  ✓ Out-of-Order — Skipped message keys stored for later delivery    │
│  ✓ Post-Quantum Ready — CRYSTALS-Kyber placeholder for future       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## AI Message Intelligence Architecture (v0.7.35)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI MESSAGE ENGINE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Sentiment  │  │    Smart     │  │   Content    │              │
│  │   Analysis   │  │   Replies    │  │  Moderation  │              │
│  │              │  │              │  │              │              │
│  │  8 Emotions  │  │  5 Categories│  │  Spam/Scam   │              │
│  │  Confidence  │  │  Context     │  │  Harassment  │              │
│  │  Trending    │  │  Learning    │  │  Phishing    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                  │                  │                     │
│         └──────────────────┼──────────────────┘                     │
│                            ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    NLP Processing Pipeline                       ││
│  │  Tokenization → Vectorization → Classification → Aggregation   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                            │                                         │
│         ┌──────────────────┼──────────────────┐                     │
│         ▼                  ▼                  ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Language   │  │    Topic     │  │ Conversation │              │
│  │  Detection   │  │  Extraction  │  │   Insights   │              │
│  │              │  │              │  │              │              │
│  │  20+ Lang    │  │  Categories  │  │  Engagement  │              │
│  │  Script Det  │  │  Confidence  │  │  Patterns    │              │
│  │  Alternatives│  │  Trending    │  │  Summaries   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  Privacy Mode: Local ML Only — No data leaves the device            │
│  Cloud Option: Enhanced accuracy with privacy-preserving API        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Spatial Audio Architecture (v0.7.35)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SPATIAL AUDIO ENGINE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Audio Source                   Listener                            │
│  (Speaker)                      (User)                              │
│      │                              │                                │
│      ▼                              ▼                                │
│  ┌─────────────┐              ┌─────────────┐                       │
│  │  Position   │              │  Position   │                       │
│  │  (x, y, z)  │              │  (x, y, z)  │                       │
│  │  Orientation│              │  Orientation│                       │
│  └─────────────┘              └─────────────┘                       │
│         │                            │                               │
│         └────────────┬───────────────┘                               │
│                      ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    HRTF Processing                               ││
│  │  Head-Related Transfer Function for realistic 3D spatialization ││
│  │  - Distance attenuation (inverse/linear/exponential)            ││
│  │  - Doppler effect simulation                                     ││
│  │  - Occlusion modeling                                            ││
│  └─────────────────────────────────────────────────────────────────┘│
│                      │                                               │
│  ┌───────────────────┼───────────────────┐                          │
│  ▼                   ▼                   ▼                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                    │
│  │ Audio Zones │ │    VAD      │ │   Noise     │                    │
│  │             │ │  (Voice     │ │ Cancellation│                    │
│  │ - Room      │ │  Activity   │ │             │                    │
│  │ - Hall      │ │  Detection) │ │ - RNNoise   │                    │
│  │ - Cave      │ │             │ │ - Krisp     │                    │
│  │ - Outdoor   │ │ - Speaking  │ │   compat    │                    │
│  │ - Custom    │ │ - Threshold │ │             │                    │
│  └─────────────┘ └─────────────┘ └─────────────┘                    │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  VR/AR Ready: Full orientation tracking, room-scale positioning     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Version Numbers (January 2026)

| Component | Version | Rationale |
|-----------|---------|-----------|
| **Backend Runtime** |
| Erlang/OTP | 28 | Latest stable with JIT compiler, 40% performance boost |
| Elixir | 1.19.4 | Set-theoretic types, improved error messages |
| Phoenix Framework | 1.8.3 | Stable release with LiveView 1.x support |
| Phoenix LiveView | 1.1.3 | Real-time UI updates without JavaScript |
| Bandit HTTP Server | 1.10.0 | Pure Elixir HTTP/2 server, replaces Cowboy |
| **Database & Storage** |
| PostgreSQL | 16 | Advanced JSONB operations, better indexing |
| Ecto SQL | 3.13 | Latest ORM with streaming support |
| Postgrex | 0.21 | Native PostgreSQL 16 compatibility |
| **Background Processing** |
| Oban | 2.22 | Reliable job queue with Cron scheduling |
| Cachex | 4.1 | In-memory caching with TTL and eviction |
| **Authentication & Security** |
| Guardian | 2.4 | JWT token management with refresh tokens |
| Argon2 | 4.1 | Password hashing (OWASP recommended) |
| Assent | 0.2 | OAuth 2.0/OIDC multi-provider support |
| Double Ratchet | 1.0.0 | Signal Protocol E2EE (v0.7.35) |
| **Frontend (Web)** |
| Node.js | 22 LTS | Active LTS until April 2027 |
| React | 19.1.0 | Latest with concurrent features |
| Vite | 6.4.1 | Lightning-fast HMR and builds |
| TailwindCSS | 3.5 | Utility-first styling |
| TypeScript | 5.8.0 | Advanced type inference |
| Three.js | 0.182.0 | 3D graphics engine for Enhanced UI |
| @react-three/fiber | 9.5.0 | React renderer for Three.js |
| GSAP | 3.14.2 | Professional-grade animations |
| Framer Motion | 12.0.0 | Declarative React animations |
| AI Engine | 1.0.0 | Message intelligence (v0.7.35) |
| Spatial Audio | 1.0.0 | 3D positional audio (v0.7.35) |
| **Frontend (Mobile)** |
| React Native | 0.81.5 | Latest stable with Fabric renderer |
| Expo SDK | 54 | Latest stable with improved performance |
| TypeScript | 5.9.x | Matches React Native toolchain |
| **Infrastructure** |
| FFmpeg | 6.1.1 | Audio/video processing for voice messages |
| Docker | 24+ | Container runtime for deployments |

---

## OTP Supervision Tree

The backend runs under a single OTP application supervisor that manages all core services. When the application starts, these processes spin up in order and restart automatically if any crash. The supervision strategy is `:one_for_one`, meaning a failed process restarts independently without affecting siblings.

```
Cgraph.Application (Supervisor)
├── Cgraph.Repo                     # PostgreSQL connection pool (Ecto)
├── Cgraph.Vault                    # AES-256-GCM encryption keys
├── Cgraph.Presence.Sampled         # Tiered presence for large channels
├── {Phoenix.PubSub, name: Cgraph.PubSub}  # Inter-process messaging
├── CgraphWeb.Endpoint              # HTTP/WebSocket entry point
├── Oban                            # Background job processor
├── Cachex (multiple instances)     # In-memory caches for sessions, tokens
├── Cgraph.Redis                    # Redis connection (rate limits, sessions)
├── Cgraph.WebRTC                   # WebRTC session manager
├── Cgraph.RateLimiter.Distributed  # Redis-backed rate limiting
├── Cgraph.E2EE.KeyRefreshScheduler # Automatic key rotation
└── Cgraph.Cluster                  # libcluster node discovery
```

A few notes on the design choices here:

1. **Redis comes before RateLimiter.Distributed** — Rate limiting depends on Redis, so we start Redis first to avoid crashes during boot.

2. **Presence.Sampled replaces Phoenix.Presence** — For channels with 10k+ members, standard presence floods the system. Sampled presence sends batched updates at intervals based on channel size.

3. **Cachex instances are named** — We run separate caches for sessions (`:session_cache`), tokens (`:token_cache`), and rate limit fallback (`:rate_limit_fallback`) to isolate eviction policies.

4. **Oban handles async work** — Search indexing, email delivery, and notification dispatch all run as Oban jobs so the main request path stays fast.

5. **RedisPool provides 20 pooled connections** — For 10K+ concurrent users, a single Redis connection becomes a bottleneck. The `Cgraph.Cache.RedisPool` module uses round-robin distribution across connections and supports batch operations via `pipeline/2` and atomic transactions via `transaction/2`. Configure pool size via `REDIS_POOL_SIZE` environment variable.

---

## System Architecture Diagram

```
                                    ┌──────────────┐
                                    │   Browser    │
                                    │   (React)    │
                                    └──────┬───────┘
                                           │ HTTPS/WSS
                                           ▼
┌──────────────┐               ┌───────────────────────┐
│   Mobile     │──────────────▶│     Cloudflare        │
│  (iOS/Droid) │               │   (CDN + Security)    │
└──────────────┘               └───────────┬───────────┘
                                           │
                                           ▼
                               ┌───────────────────────┐
                               │    Load Balancer      │
                               │      (Fly.io)         │
                               └───────────┬───────────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
           ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
           │  Phoenix #1   │      │  Phoenix #2   │      │  Phoenix #N   │
           │   (Primary)   │      │   (Replica)   │      │   (Replica)   │
           └───────┬───────┘      └───────┬───────┘      └───────┬───────┘
                   │                      │                      │
                   └──────────────────────┼──────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
                    ▼                                           ▼
           ┌───────────────┐                           ┌───────────────┐
           │  PostgreSQL   │                           │     Redis     │
           │   (Primary)   │◀─────Replication─────────▶│   (Cluster)   │
           │   + Replica   │                           │               │
           └───────────────┘                           └───────────────┘
```

---

## Data Flow: The Life of a Message

Here's what happens when Alice sends "hey!" to Bob. This flow was carefully optimized for sub-200ms latency.

### Step 1: Client Sends Message

```
Alice's Browser                    
       │
       │ 1. User clicks "Send"
       │
       ▼
┌─────────────────┐
│ React Component │
│ MessageInput.tsx│
│                 │
│ - Validate text │
│ - Generate UUID │  ← Optimistic update starts here
│ - Show in UI    │    (message appears instantly)
└────────┬────────┘
         │
         │ 2. WebSocket push to "conversation:123" channel
         │    Payload: {content: "hey!", temp_id: "abc123"}
         ▼
```

### Step 2: Server Processing

```
Phoenix Channel (ConversationChannel)
         │
         │ 3. Receives "new_message" event
         ▼
┌─────────────────────────────────────┐
│ Message Pipeline                     │
│                                      │
│ a) Validate user is participant      │
│ b) Check rate limits (Redis)         │
│ c) Sanitize content (XSS prevention) │
│ d) Encrypt if E2EE enabled           │
│ e) Insert to PostgreSQL              │
│ f) Update conversation.updated_at    │
│ g) Increment unread_count for Bob    │
└────────────────┬────────────────────┘
                 │
                 │ 4. Broadcast to all subscribers
                 ▼
```

### Step 3: Real-time Delivery

```
Phoenix PubSub (backed by Redis for multi-node)
         │
         │ 5. Fans out to all connected clients
         │
         ├──────────────────────┬──────────────────────┐
         ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Alice's Browser │    │ Bob's Browser   │    │ Bob's Phone     │
│                 │    │                 │    │                 │
│ - Confirm sent  │    │ - Show message  │    │ - Show message  │
│ - Replace temp  │    │ - Play sound    │    │ - Push notif    │
│   ID with real  │    │ - Update unread │    │ - Badge count   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Latency Breakdown (p99)

| Step | Duration | Notes |
|------|----------|-------|
| Client → Cloudflare | 20ms | Geographic CDN helps |
| Cloudflare → Phoenix | 30ms | Direct connection |
| Message validation | 2ms | In-memory checks |
| Redis rate limit check | 1ms | Local Redis replica |
| PostgreSQL insert | 15ms | SSD-backed, indexed |
| PubSub broadcast | 3ms | Redis pub/sub |
| Phoenix → Client | 30ms | Back through CDN |
| **Total** | **~100ms** | Under our 200ms SLA |

---

## Deployment Architecture

Production runs on Fly.io for its Elixir support and global distribution:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLY.IO GLOBAL                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    PRIMARY REGION (iad)                      │    │
│  │                                                              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │    │
│  │  │ Phoenix  │  │ Phoenix  │  │ Phoenix  │  │ Phoenix  │    │    │
│  │  │  App 1   │  │  App 2   │  │  App 3   │  │  App 4   │    │    │
│  │  │ 1GB RAM  │  │ 1GB RAM  │  │ 1GB RAM  │  │ 1GB RAM  │    │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │    │
│  │                                                              │    │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐   │    │
│  │  │   PostgreSQL Primary    │  │    Redis Primary        │   │    │
│  │  │   2 vCPU / 4GB RAM      │  │    1GB RAM              │   │    │
│  │  │   100GB SSD             │  │    Persistence: RDB     │   │    │
│  │  └─────────────────────────┘  └─────────────────────────┘   │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    REPLICA REGION (lhr)                      │    │
│  │                                                              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐   │    │
│  │  │ Phoenix  │  │ Phoenix  │  │   PostgreSQL Replica     │   │    │
│  │  │  App 1   │  │  App 2   │  │   (Read-only)            │   │    │
│  │  └──────────┘  └──────────┘  └──────────────────────────┘   │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Fly.io?

1. **Built-in Elixir clustering** - Nodes discover each other automatically via libcluster
2. **Global Anycast** - Users connect to nearest region
3. **Simple scaling** - `fly scale count 8` and you're done
4. **Postgres managed** - They handle backups, failover
5. **Reasonable pricing** - Way cheaper than AWS for our scale

---

## Security Architecture

Security is a first-class concern throughout the architecture.

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION METHODS                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐      ┌─────────────────────┐               │
│  │  Email/Password     │      │  Wallet Auth        │               │
│  │                     │      │                     │               │
│  │ 1. Email + password │      │ 1. Connect wallet   │               │
│  │ 2. Bcrypt verify    │      │ 2. Sign challenge   │               │
│  │ 3. Issue JWT        │      │ 3. Verify signature │               │
│  │ 4. Set refresh tok  │      │ 4. Create/login     │               │
│  │                     │      │ 5. PIN for session  │               │
│  └──────────┬──────────┘      └──────────┬──────────┘               │
│             │                            │                           │
│             └────────────┬───────────────┘                           │
│                          ▼                                           │
│              ┌───────────────────────┐                               │
│              │    Guardian (JWT)     │                               │
│              │                       │                               │
│              │  Access Token: 15min  │                               │
│              │  Refresh Token: 7days │                               │
│              │  Algorithm: RS256     │                               │
│              └───────────────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Encryption Layers

| Layer | What's Protected | How |
|-------|------------------|-----|
| Transport | All traffic | TLS 1.3 (Cloudflare terminates) |
| Application | Sensitive fields | AES-256-GCM |
| Database | At rest | PostgreSQL native encryption |
| Backups | Backup files | GPG encrypted before S3 |
| E2EE Messages | Message content | X3DH + AES-256-GCM (industry-standard protocol) |

### E2EE Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    E2EE KEY MANAGEMENT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Client Side (Never leaves device)     Server Side (Public)    │
│   ┌─────────────────────────┐          ┌─────────────────────┐ │
│   │ Identity Private Key    │   ──▶    │ Identity Public Key │ │
│   │ (Ed25519)               │          │ (Ed25519)           │ │
│   └─────────────────────────┘          └─────────────────────┘ │
│   ┌─────────────────────────┐          ┌─────────────────────┐ │
│   │ Signed Prekey Private   │   ──▶    │ Signed Prekey Pub   │ │
│   │ (X25519)                │          │ + Signature         │ │
│   └─────────────────────────┘          └─────────────────────┘ │
│   ┌─────────────────────────┐          ┌─────────────────────┐ │
│   │ One-Time Prekey Private │   ──▶    │ One-Time Prekeys    │ │
│   │ (X25519, 100 batch)     │          │ (consumed on use)   │ │
│   └─────────────────────────┘          └─────────────────────┘ │
│                                                                  │
│   Key Exchange: X3DH (Extended Triple Diffie-Hellman)           │
│   Message Encryption: AES-256-GCM                               │
│   Implementation: Cgraph.Crypto.E2EE                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Rate Limiting Strategy

Distributed rate limiting using Redis with local ETS fallback:

```elixir
# Tiered approach based on endpoint sensitivity
# All limits enforced cluster-wide via Cgraph.RateLimiter.Distributed

# Auth endpoints - strict (prevent brute force)
plug RateLimiterV2, tier: :strict   # 20 per minute, Redis-backed

# Normal API - reasonable
plug RateLimiterV2, tier: :standard # 100 per minute, sliding window

# Search - moderate (Meilisearch is fast, but limit abuse)
plug RateLimiterV2, tier: :relaxed  # 500 per minute

# File uploads - prevent storage abuse
plug RateLimiterV2, tier: :upload   # 10 per hour, token bucket
```

**Multi-node consistency**: All rate limits are synchronized across the cluster via Redis Lua scripts. When Redis is unavailable, limits fall back to per-node ETS tables.

---

## Scalability Architecture

Enterprise-grade scalability built into the core, not bolted on later.

### Search Engine (Meilisearch)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SEARCH ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Client Request                                                      │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Cgraph.Search (Context)                                     │    │
│  │  - Routes to Meilisearch or PostgreSQL fallback              │    │
│  │  - Unified API for all search types                          │    │
│  └──────────────────────────────────────────────────────────────┘   │
│            │                              │                          │
│            ▼                              ▼                          │
│  ┌──────────────────┐          ┌──────────────────┐                 │
│  │   Meilisearch    │          │   PostgreSQL     │                 │
│  │   (Primary)      │          │   (Fallback)     │                 │
│  │                  │          │                  │                 │
│  │  • <50ms latency │          │  • ILIKE queries │                 │
│  │  • Typo-tolerant │          │  • Always works  │                 │
│  │  • Fuzzy search  │          │  • Slower        │                 │
│  └──────────────────┘          └──────────────────┘                 │
│                                                                      │
│  Performance Comparison:                                             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Message Count   │  Meilisearch  │  PostgreSQL             │    │
│  │  ───────────────────────────────────────────────────────── │    │
│  │  10,000          │  <10ms        │  ~50ms                  │    │
│  │  100,000         │  <20ms        │  ~200ms                 │    │
│  │  1,000,000       │  <50ms        │  >1s                    │    │
│  │  10,000,000      │  <100ms       │  timeout                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### WebRTC Calling

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WEBRTC ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Alice (Caller)              Server                Bob (Callee)     │
│       │                         │                       │           │
│       │  1. create_room         │                       │           │
│       │────────────────────────▶│                       │           │
│       │                         │  2. ring              │           │
│       │                         │──────────────────────▶│           │
│       │                         │                       │           │
│       │                         │  3. join_room         │           │
│       │                         │◀──────────────────────│           │
│       │                         │                       │           │
│       │  4. SDP offer           │  5. SDP offer         │           │
│       │────────────────────────▶│──────────────────────▶│           │
│       │                         │                       │           │
│       │  7. SDP answer          │  6. SDP answer        │           │
│       │◀────────────────────────│◀──────────────────────│           │
│       │                         │                       │           │
│       │◀────── ICE candidates exchanged ───────────────▶│           │
│       │                         │                       │           │
│       │◀═══════════════ P2P Media Stream ══════════════▶│           │
│                                                                      │
│  Signaling: Phoenix Channels (CgraphWeb.CallChannel)                │
│  ICE Servers: STUN (Google) + optional TURN                         │
│  Media: Direct peer-to-peer (or SFU for 3+ participants)            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Presence Sampling (Telegram-scale)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SAMPLED PRESENCE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Channel Size         Strategy              Memory Usage            │
│  ─────────────────────────────────────────────────────────────────  │
│  < 100 users          Full tracking         ~10KB                   │
│  100 - 1,000          50% sampling          ~5KB + HLL              │
│  1,000 - 10,000       10% sampling          ~1KB + HLL              │
│  10,000 - 100,000     1% sampling           ~0.1KB + HLL            │
│  > 100,000            0.1% sampling         ~12KB (HLL only)        │
│                                                                      │
│  HyperLogLog provides O(1) approximate counts with ±2% accuracy    │
│  Memory: 12KB for 1M users vs 100MB for full tracking (8000x less) │
│                                                                      │
│  Client Experience:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Small Channel:  "15 members, 7 online"     (exact)         │    │
│  │  Large Channel:  "~1.2M members, ~45K online" (approximate) │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Scalability Roadmap

Battle-tested growth strategy for CGraph, based on observed bottlenecks and industry best practices.

### Stage 1: Getting Started (100 - 1K users)

**What we run:**
- Single Phoenix node (1GB RAM)
- PostgreSQL (shared, 1GB)
- Redis (shared, 256MB)

**Monthly cost:** ~$25

**Bottlenecks to watch:**
- None yet, enjoy the calm before the storm

### Stage 2: Growing Pains (1K - 10K users)

**What changes:**
- Add second Phoenix node for redundancy
- Upgrade to dedicated Postgres (4GB)
- Add Redis persistence
- Deploy Meilisearch (256MB)

**Monthly cost:** ~$100

**Bottlenecks to watch:**
- Database connections (implement PgBouncer)
- WebSocket memory (tune hibernation)

### Stage 3: Real Scale (10K - 100K users)

**What changes:**
- 4+ Phoenix nodes behind load balancer
- PostgreSQL read replicas
- Redis cluster (3 nodes)
- Meilisearch cluster (3 nodes)
- Separate file storage to R2
- Background job workers scaled independently

**Monthly cost:** ~$500

**Bottlenecks to watch:**
- Write throughput (partition hot tables)
- Presence broadcasts (enable sampled presence)
- Push notification queues

### Stage 4: Serious Business (100K - 1M users)

**What changes:**
- Multi-region deployment
- PostgreSQL with Citus for sharding
- Meilisearch with geo-distributed replicas
- CDN for all static assets
- Separate clusters for real-time vs. API
- TURN server for restrictive networks

**Monthly cost:** ~$5,000

**What we'd need to rearchitect:**
- Message storage (time-series partitioning)
- Notification fanout (dedicated service)
- Analytics pipeline (separate from production)

---

## Third-Party Integrations

### Stripe (Payments)

```
User                    CGraph                      Stripe
  │                        │                           │
  │ 1. Click "Subscribe"   │                           │
  │───────────────────────▶│                           │
  │                        │ 2. Create checkout        │
  │                        │    session                │
  │                        │──────────────────────────▶│
  │                        │                           │
  │                        │ 3. Return session URL     │
  │                        │◀──────────────────────────│
  │ 4. Redirect to Stripe  │                           │
  │◀───────────────────────│                           │
  │                        │                           │
  │ 5. Complete payment    │                           │
  │────────────────────────────────────────────────────▶
  │                        │                           │
  │                        │ 6. Webhook: payment_intent│
  │                        │    .succeeded             │
  │                        │◀──────────────────────────│
  │                        │                           │
  │                        │ 7. Update user.premium    │
  │                        │    Send confirmation      │
  │ 8. Confirmation email  │                           │
  │◀───────────────────────│                           │
```

### Cloudflare R2 (File Storage)

R2 was chosen over S3 for zero egress fees — essential for a chat app with heavy image sharing.

```elixir
# File upload flow (simplified)
def upload_file(user, file) do
  # 1. Validate file (size, type, virus scan)
  with {:ok, validated} <- validate_file(file),
       # 2. Generate unique path
       path <- "uploads/#{user.id}/#{UUID.generate()}/#{file.filename}",
       # 3. Upload to R2
       {:ok, _} <- R2.put_object(path, file.content),
       # 4. Store metadata in Postgres
       {:ok, upload} <- create_upload_record(user, path, file) do
    {:ok, upload}
  end
end
```

### Expo Push Notifications

```
┌───────────────────────────────────────────────────────────────┐
│                    PUSH NOTIFICATION FLOW                      │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  1. User enables push ──▶ Expo SDK generates token             │
│                              │                                 │
│  2. Token sent to backend ◀──┘                                 │
│         │                                                      │
│         ▼                                                      │
│  3. Store in push_tokens table                                 │
│                                                                │
│  ═══════════════════════════════════════════════════════════  │
│                                                                │
│  4. Event occurs (new message)                                 │
│         │                                                      │
│         ▼                                                      │
│  5. Oban job queued: SendPushNotification                      │
│         │                                                      │
│         ▼                                                      │
│  6. Worker fetches user's tokens                               │
│         │                                                      │
│         ▼                                                      │
│  7. POST to Expo Push API ──▶ Expo routes to APNs/FCM          │
│                                       │                        │
│  8. User's device receives push ◀─────┘                        │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---

## Failure Modes and Recovery

### What happens when things break

| Component | What Breaks | Impact | Recovery |
|-----------|-------------|--------|----------|
| **Phoenix Node** | OOM, crash | Other nodes handle traffic | Fly auto-restarts in ~10s |
| **PostgreSQL** | Connection limit | Some requests fail | PgBouncer queues, scale up |
| **Redis** | Memory full | Rate limits fail-open | Clear cache, increase memory |
| **WebSocket** | Disconnect | Real-time updates stop | Client auto-reconnects |
| **Stripe** | API down | Payments fail | Show error, retry later |
| **R2** | Unavailable | Images don't load | Cached in CDN, retry |

### Circuit Breaker Pattern

We use Fuse for circuit breakers on external services:

```elixir
# If Stripe fails 5 times in 10 seconds, stop trying for 30 seconds
Fuse.install(:stripe_api, {{:standard, 5, 10_000}, {:reset, 30_000}})

def create_checkout_session(user) do
  case Fuse.check(:stripe_api) do
    :ok ->
      case Stripe.Session.create(params) do
        {:ok, session} -> {:ok, session}
        {:error, _} -> 
          Fuse.melt(:stripe_api)
          {:error, :payment_unavailable}
      end
    :blown ->
      {:error, :payment_temporarily_unavailable}
  end
end
```

---

## Cost Analysis

### Current Production Costs (as of Dec 2024)

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Fly.io (Phoenix x4) | $48 | 4 x 1GB RAM machines |
| Fly.io (Postgres) | $27 | 2GB RAM, 40GB SSD |
| Fly.io (Redis) | $15 | 1GB RAM |
| Cloudflare R2 | ~$20 | 100GB storage, 0 egress |
| Cloudflare Pro | $20 | WAF, analytics |
| Resend | $20 | 50K emails/month |
| Expo Push | $0 | Free tier sufficient |
| Domain | $15/year | Cloudflare registrar |
| **Total** | **~$150/month** | For ~5K active users |

### Cost Projections at Scale

| Users | Monthly Cost | Cost/User |
|-------|-------------|-----------|
| 1K | $75 | $0.075 |
| 10K | $200 | $0.020 |
| 50K | $800 | $0.016 |
| 100K | $2,500 | $0.025 |
| 500K | $10,000 | $0.020 |

Cost per user decreases with scale, stabilizing around $0.02/user/month — reasonable for a real-time platform.

---

## Roadmap

Planned for 2026:

1. **Voice/Video calls** — Evaluating LiveKit vs. Jitsi
2. **AI features** — Message summarization, smart search
3. **ActivityPub** — Federation with other platforms
4. **Double Ratchet** — Full Signal protocol with session ratcheting
5. **Self-hosting** — Docker compose for power users

### Recently Completed (v0.7.x)

- ✅ **E2EE Implementation** — XChaCha20-Poly1305 via libsodium
- ✅ **Moderation System** — Reports, bans, audit logs
- ✅ **Voice Messages** — Recording, transcoding, waveform visualization
- ✅ **Multi-backend Storage** — Local, S3, Cloudflare R2 support
- ✅ **Email System** — Transactional emails with templates
- ✅ **Push Notifications** — APNs, FCM, Expo Push support
- ✅ **Admin Dashboard** — User management, reports, analytics
- ✅ **Security Hardening** — Input validation, abuse detection

---

## Resources

- **Architecture decisions**: [ADRs](./decisions/README.md)
- **Frontend guide**: [FRONTEND.md](../guides/FRONTEND.md)
- **Deployment**: [DEPLOYMENT.md](../guides/DEPLOYMENT.md)
- **Security**: [SECURITY.md](../guides/SECURITY.md)
- **Website**: [www.cgraph.org](https://www.cgraph.org)

---

*Last updated: January 2026 | v0.7.40*

— Burca Lucas
