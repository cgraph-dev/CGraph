## CGraph System Architecture

> Last updated: January 2026 | Version 0.6.4  
> This doc gets outdated fast—if something looks wrong, check the CHANGELOG.

---

## Executive Summary

CGraph is a real-time communication platform that combines instant messaging with deep forum discussions. We built it because existing solutions either excel at quick conversations OR long-form discussions, but never both.

The platform serves three core use cases: (1) instant messaging between individuals and groups with end-to-end encryption, (2) persistent forum discussions with voting, threading, and customizable communities, and (3) a friends system that ties everything together. Users can authenticate traditionally with email/password or anonymously via crypto wallets—we don't judge.

Our tech stack prioritizes developer happiness and real-time performance. Elixir/Phoenix handles the backend because OTP makes WebSocket connections almost embarrassingly easy to scale. React powers both web (Vite) and mobile (React Native) frontends, sharing types and utilities through a monorepo structure. PostgreSQL stores everything important, with Cachex/ETS handling the ephemeral stuff like presence and rate limiting.

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Web App (React 18 + Vite)     │    Mobile (React Native + Expo)   │
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
│  PostgreSQL 15              │  Redis 7                              │
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

### Version Numbers (as of Dec 2025)

| Component | Version | Why This Version |
|-----------|---------|------------------|
| Erlang/OTP | 28.3 | Latest stable, JIT performance |
| Elixir | 1.19.4 | Latest stable, set-theoretic types |
| Phoenix | 1.8.3 | Latest stable, LiveView 1.x |
| Phoenix LiveView | 1.1.19 | Major improvements |
| Ecto SQL | 3.13.4 | Latest stable |
| Postgrex | 0.21.1 | PostgreSQL 16 support |
| Oban | 2.20.2 | Background job processing |
| Cachex | 4.1.1 | In-memory caching |
| Bandit | 1.10.0 | HTTP server (replaces Cowboy) |
| PostgreSQL | 16 | JSONB improvements |
| Node.js | 22 LTS | For frontend builds |
| React | 18.2 | Concurrent features |
| React Native | 0.73 | New architecture |
| Expo | 50 | Stable SDK |

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
