## CGraph System Architecture

> Last updated: January 2026 | Version 0.7.25  
> Living documentation - Updated with security hardening and idempotency

---

## Executive Summary

CGraph is a production-ready communication platform that seamlessly integrates real-time messaging with persistent forum discussions. Built to address the limitations of platforms that either excel at ephemeral conversations or long-form discussions—but rarely both—CGraph provides a unified experience across web and mobile.

The platform serves three primary use cases: (1) encrypted instant messaging between individuals and within group channels, (2) community-driven forum discussions with voting and moderation, and (3) a comprehensive friends system with presence tracking that connects users across all features.

Authentication is flexible, supporting traditional email/password, OAuth social login (Google, Apple, Facebook, TikTok), and privacy-focused Web3 wallet authentication. Users choose their preferred identity model without compromise.

Our technology stack prioritizes real-time performance and developer productivity. Elixir/Phoenix powers the backend, leveraging OTP's actor model for managing hundreds of thousands of concurrent WebSocket connections with minimal resource overhead. React 19 drives both web (via Vite) and mobile (via React Native/Expo) clients, sharing TypeScript types and business logic through a carefully architected monorepo. PostgreSQL 16 handles persistent data with advanced JSON operations and full-text search, while Phoenix Presence (CRDT-based) tracks online status without database writes.

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
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│  PostgreSQL 16              │  Redis 7                              │
│  - Primary data store       │  - Session cache                      │
│  - Full-text search         │  - Presence tracking                  │
│  - Ecto for ORM             │  - Rate limiting                      │
│                             │  - Pub/Sub for clustering             │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
├─────────────────────────────────────────────────────────────────────┤
│  Cloudflare R2    │  Stripe       │  Resend      │  Expo Push      │
│  (File storage)   │  (Payments)   │  (Email)     │  (Mobile push)  │
└─────────────────────────────────────────────────────────────────────┘
```

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
| Oban | 2.20 | Reliable job queue with Cron scheduling |
| Cachex | 4.1 | In-memory caching with TTL and eviction |
| **Authentication & Security** |
| Guardian | 2.4 | JWT token management with refresh tokens |
| Argon2 | 4.1 | Password hashing (OWASP recommended) |
| Assent | 0.2 | OAuth 2.0/OIDC multi-provider support |
| **Frontend (Web)** |
| Node.js | 22 LTS | Active LTS until April 2027 |
| React | 19.1.0 | Latest with concurrent features |
| Vite | 6.4.1 | Lightning-fast HMR and builds |
| TailwindCSS | 3.5 | Utility-first styling |
| TypeScript | 5.8.0 | Advanced type inference |
| **Frontend (Mobile)** |
| React Native | 0.81.5 | Latest stable with Fabric renderer |
| Expo SDK | 54 | Latest stable with improved performance |
| TypeScript | 5.9.x | Matches React Native toolchain |
| **Infrastructure** |
| FFmpeg | 6.1.1 | Audio/video processing for voice messages |
| Docker | 24+ | Container runtime for deployments |

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

Let me walk you through what happens when Alice sends "hey!" to Bob. This is the flow we spent weeks optimizing, and honestly, I'm pretty proud of how snappy it feels.

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

We deploy on Fly.io because it's dead simple and has great Elixir support. Here's our production topology:

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

Security isn't an afterthought here. We've been burned before (ask me about the 2023 incident sometime), so now we're paranoid in the good way.

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

```elixir
# We use a tiered approach based on endpoint sensitivity
# These are configured in the router pipelines

# Auth endpoints - very strict
plug RateLimiter, limit: 5, window: 60_000     # 5 per minute

# Normal API - reasonable
plug RateLimiter, limit: 100, window: 60_000   # 100 per minute

# Search - moderate (expensive queries)
plug RateLimiter, limit: 30, window: 60_000    # 30 per minute

# File uploads - prevent abuse
plug RateLimiter, limit: 10, window: 60_000    # 10 per minute
```

---

## Scalability Roadmap

Here's our battle-tested plan for growing CGraph. Each stage has been designed based on actual bottlenecks we've observed (or read horror stories about on HackerNews).

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

**Monthly cost:** ~$100

**Bottlenecks to watch:**
- Database connections (implement PgBouncer)
- WebSocket memory (tune hibernation)

### Stage 3: Real Scale (10K - 100K users)

**What changes:**
- 4+ Phoenix nodes behind load balancer
- PostgreSQL read replicas
- Redis cluster (3 nodes)
- Separate file storage to R2
- Background job workers scaled independently

**Monthly cost:** ~$500

**Bottlenecks to watch:**
- Write throughput (partition hot tables)
- Search performance (add pg_trgm indexes)
- Push notification queues

### Stage 4: Serious Business (100K - 1M users)

**What changes:**
- Multi-region deployment
- PostgreSQL with Citus for sharding
- Dedicated search cluster (Meilisearch or TypeSense)
- CDN for all static assets
- Separate clusters for real-time vs. API

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

We chose R2 over S3 because of zero egress fees. For a chat app with lots of image sharing, this saves us hundreds per month.

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

The cost per user actually decreases as we scale, then stabilizes around $0.02/user/month. Not bad for a real-time platform!

---

## What's Next?

Things on our radar for 2026:

1. **Voice/Video calls** - Evaluating LiveKit vs. Jitsi
2. **AI features** - Message summarization, smart search
3. **ActivityPub** - Federation with other platforms
4. **Double Ratchet** - Full protocol with session ratcheting
5. **Self-hosting** - Docker compose for power users

### Recently Completed (v0.6.0)

- ✅ **E2EE Implementation** - X3DH key exchange, AES-256-GCM encryption
- ✅ **Voice Messages** - Recording, transcoding, waveform visualization
- ✅ **Multi-backend Storage** - Local, S3, Cloudflare R2 support
- ✅ **Email System** - Transactional emails with templates
- ✅ **Push Notifications** - APNs, FCM, Expo Push support
- ✅ **Admin Dashboard** - User management, reports, audit logs
- ✅ **Security Hardening** - Input validation, abuse detection

---

## Questions?

If something in this doc doesn't make sense or seems outdated, check the CHANGELOG or open an issue.

- **Architecture decisions**: Check docs/ARCHITECTURE.md
- **Frontend questions**: Check docs/FRONTEND.md
- **DevOps/infrastructure**: Check docs/DEPLOYMENT.md
- **Security concerns**: security@cgraph.app

---

*This document is maintained in `/docs/ARCHITECTURE.md`. PRs welcome, but please discuss major changes in #engineering first.*
