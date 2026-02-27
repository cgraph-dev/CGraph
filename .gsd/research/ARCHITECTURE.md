# ARCHITECTURE Research — CGraph Encrypted Messaging + Community Platform

> Generated: 2026-02-27 | Dimension: ARCHITECTURE | Project Type: BROWNFIELD

---

## 1. Component Integration Map

### 1.1 Current System Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER                                    │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │
│  │  React 19     │    │  React Native │    │  @cgraph/* packages      │   │
│  │  Web (Vite)   │    │  Expo 54      │    │  ┌─────────────────┐    │   │
│  │               │    │               │    │  │ crypto (E2EE)   │    │   │
│  │  Zustand      │    │  Zustand      │    │  │ socket (Phoenix)│    │   │
│  │  TanStack Q   │    │  TanStack Q   │    │  │ api-client      │    │   │
│  │  Radix UI     │    │  Reanimated   │    │  │ shared-types    │    │   │
│  │               │    │  WatermelonDB │    │  │ utils           │    │   │
│  └──────┬────────┘    └──────┬────────┘    │  │ anim-constants  │    │   │
│         │                    │              │  └─────────────────┘    │   │
│         └────────┬───────────┘              └──────────────────────────┘   │
│                  │                                                        │
└──────────────────┼────────────────────────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    ┌────▼────┐         ┌────▼─────┐
    │  HTTPS  │         │ WebSocket │
    │  REST   │         │ Phoenix   │
    │  API    │         │ Channels  │
    └────┬────┘         └────┬──────┘
         │                   │
┌────────┼───────────────────┼────────────────────────────────────────────┐
│        │    API TIER       │                                             │
│  ┌─────▼───────────────────▼──────────────────────────────────────────┐  │
│  │              CGraphWeb (Phoenix 1.8)                                │  │
│  │                                                                     │  │
│  │  Router ──► Plugs (Auth, Rate Limit, CORS, Idempotency)           │  │
│  │    │                                                                │  │
│  │    ├─► Controllers/       ─►  Domain Contexts (business logic)     │  │
│  │    │   (API v1, Admin)         │                                    │  │
│  │    │                           ▼                                    │  │
│  │    └─► Channels/          Accounts │ Messaging │ Groups │ Forums   │  │
│  │        (conversation,     Gamification │ Encryption │ WebRTC       │  │
│  │         call, group,      Notifications │ Search │ Moderation     │  │
│  │         forum, user,      Subscriptions │ AI │ Collaboration      │  │
│  │         presence,         Presence │ Cache │ Security             │  │
│  │         gamification,     Webhooks │ DataExport │ Storage         │  │
│  │         ai, document)     OAuth │ Audit │ FeatureFlags            │  │
│  │                                                                     │  │
│  └───────────┬─────────────┬──────────────┬───────────────────────────┘  │
│              │             │              │                               │
└──────────────┼─────────────┼──────────────┼───────────────────────────────┘
               │             │              │
┌──────────────┼─────────────┼──────────────┼───────────────────────────────┐
│   DATA TIER  │             │              │                                │
│              │             │              │                                │
│  ┌───────────▼──┐  ┌──────▼──────┐  ┌───▼──────────┐  ┌──────────────┐  │
│  │ PostgreSQL 16│  │  Redis 7    │  │  MeiliSearch  │  │  S3/R2       │  │
│  │  + PgBouncer │  │  Cache L3   │  │  Full-text    │  │  File storage│  │
│  │  + Read      │  │  Pub/Sub    │  │  Search       │  │  Uploads     │  │
│  │    Replica   │  │  Rate Limit │  │               │  │              │  │
│  │              │  │  Token      │  │               │  │              │  │
│  │              │  │  Blacklist  │  │               │  │              │  │
│  └──────────────┘  └─────────────┘  └───────────────┘  └──────────────┘  │
│                                                                           │
│  ┌──────────────┐  ┌─────────────┐                                       │
│  │ Oban (PG)    │  │ ETS + Cachex│                                       │
│  │ Background   │  │ Cache L1/L2 │                                       │
│  │ Jobs         │  │ In-process  │                                       │
│  └──────────────┘  └─────────────┘                                       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Integration Points — What Connects to What

| Source                        | Target              | Mechanism                                                        | Status               |
| ----------------------------- | ------------------- | ---------------------------------------------------------------- | -------------------- |
| Web/Mobile → Backend          | REST API            | `@cgraph/api-client` → Phoenix Controllers                       | ✅ Built             |
| Web/Mobile → Backend          | WebSocket           | `@cgraph/socket` → Phoenix Channels (UserSocket)                 | ✅ Built             |
| Auth Store → Socket           | Token handoff       | `useAuthStore` token → `SocketManager.connect(token)`            | ⚠️ Needs integration |
| Auth Store → E2EE             | Identity keys       | Auth completion → `@cgraph/crypto` key generation                | ⚠️ Needs wiring      |
| E2EE → Message Send           | Encrypt before send | `TripleRatchetEngine.encrypt()` → message payload → Channel push | ⚠️ Needs pipeline    |
| Message Receive → E2EE        | Decrypt on receive  | Channel event → `TripleRatchetEngine.decrypt()` → display        | ⚠️ Needs pipeline    |
| E2EE → Backend                | Key management      | E2EE controller ↔ `CGraph.Crypto.E2EE` context                   | ✅ Built             |
| WebRTC → Call Channel         | Signaling           | `webrtcService.ts` ↔ `CGraphWeb.CallChannel`                     | ✅ Built             |
| Forum Post → Gamification     | XP award            | `CGraph.Forums` → `CGraph.Gamification` (backend event)          | ⚠️ Needs event bus   |
| Stripe → Subscriptions        | Webhooks            | `StripeWebhookController` → `CGraph.Subscriptions`               | ✅ Built             |
| Subscriptions → Feature Gates | Tier checking       | `CGraph.Subscriptions.TierLimits` → all contexts                 | ✅ Built             |
| Backend → Clients             | Real-time events    | `Phoenix.PubSub` → `Endpoint.broadcast!()` → Channels            | ✅ Built             |
| Backend Nodes → Backend Nodes | Clustering          | `DNSCluster` → Erlang distribution → PubSub sync                 | ✅ Built             |

### 1.3 Key Disconnection Points (the 15% gap)

1. **Auth → E2EE bootstrap**: After login, client must fetch prekey bundles and establish ratchet
   sessions before sending E2EE messages. This initialization pipeline is NOT connected end-to-end.
2. **Message send → E2EE encrypt → Channel**: The `ConversationChannel` accepts plaintext message
   events. The E2EE encrypt step must happen client-side BEFORE the channel push, but the
   integration between `@cgraph/crypto` TripleRatchet and the chat module's send flow is incomplete.
3. **Forum → Gamification event bus**: `CGraph.Forums` and `CGraph.Gamification` are separate
   contexts. The cross-context event that awards XP on forum actions (post, vote, comment) needs a
   domain event dispatch mechanism.
4. **Mobile offline → Sync**: WatermelonDB local storage exists but the sync protocol with backend
   `sync_routes.ex` needs full integration.
5. **Stripe webhook → real-time UI**: Stripe webhook arrives → subscription updated in DB, but the
   real-time channel notification to the user's `UserChannel` for instant UI update is missing.

---

## 2. Data Flow Diagrams for Key Features

### 2.1 Sending an End-to-End Encrypted (E2EE) Message

**Reference architecture**: Signal Protocol (used by Signal, WhatsApp). CGraph implements a Triple
Ratchet variant with post-quantum PQXDH.

```
┌─────────────┐                    ┌──────────────────┐                  ┌─────────────┐
│  Sender      │                    │    Backend        │                  │  Recipient   │
│  (Alice)     │                    │    (Phoenix)      │                  │  (Bob)       │
└──────┬───────┘                    └────────┬──────────┘                  └──────┬───────┘
       │                                     │                                    │
       │  ── FIRST-TIME SESSION SETUP ──     │                                    │
       │                                     │                                    │
       │  1. GET /api/v1/e2ee/prekeys/:bob   │                                    │
       │────────────────────────────────────►│                                    │
       │                                     │ CGraph.Crypto.E2EE fetches         │
       │     PreKey Bundle (identity_key,    │ Bob's bundle from DB               │
       │     signed_prekey, one_time_prekey, │◄────────────────────────           │
       │     kyber_prekey)                   │                                    │
       │◄────────────────────────────────────│                                    │
       │                                     │                                    │
       │  2. PQXDH Key Agreement (client)    │                                    │
       │  ┌──────────────────────────────┐   │                                    │
       │  │ pqxdhInitiate(bobBundle)     │   │                                    │
       │  │ → shared_secret (P-256 + KEM)│   │                                    │
       │  │ → splitTripleRatchetSecret() │   │                                    │
       │  │ → TripleRatchetEngine.init() │   │                                    │
       │  └──────────────────────────────┘   │                                    │
       │                                     │                                    │
       │  3. POST /api/v1/e2ee/sessions      │                                    │
       │  { recipientId, ephemeralKey,       │                                    │
       │    kemCiphertext, initialMessage }  │                                    │
       │────────────────────────────────────►│                                    │
       │                                     │ Store session metadata              │
       │                                     │ Notify Bob via UserChannel:         │
       │                                     │ "e2ee:session_established"          │
       │                                     │────────────────────────────────────►│
       │                                     │                                    │
       │  ── SENDING AN E2EE MESSAGE ──      │                                    │
       │                                     │                                    │
       │  4. Encrypt (client-side)           │                                    │
       │  ┌──────────────────────────────┐   │                                    │
       │  │ tripleRatchet.encrypt(       │   │                                    │
       │  │   plaintext_message          │   │                                    │
       │  │ )                            │   │                                    │
       │  │ → { header, ciphertext,      │   │                                    │
       │  │     ecHeader, spqrHeader }   │   │                                    │
       │  └──────────────────────────────┘   │                                    │
       │                                     │                                    │
       │  5. Push to ConversationChannel:    │                                    │
       │  "new_message" {                    │                                    │
       │    encrypted: true,                 │                                    │
       │    ciphertext: base64(...),         │                                    │
       │    header: { ecHeader, spqrHeader,  │                                    │
       │              messageNumber, pn },   │                                    │
       │    snowflake_id: <generated>        │                                    │
       │  }                                  │                                    │
       │────────────────────────────────────►│                                    │
       │                                     │                                    │
       │                                     │  6. Backend processes:              │
       │                                     │  • Validate sender auth             │
       │                                     │  • Store ciphertext in messages     │
       │                                     │    table (NEVER decrypted server-   │
       │                                     │    side)                            │
       │                                     │  • Assign Snowflake ID for ordering │
       │                                     │  • broadcast! to conversation topic │
       │                                     │  • Oban: notification_worker for    │
       │                                     │    push notification                │
       │                                     │                                    │
       │                                     │  7. Channel broadcast:              │
       │                                     │  "new_message" { ...ciphertext }    │
       │                                     │────────────────────────────────────►│
       │                                     │                                    │
       │                                     │                     8. Decrypt:     │
       │                                     │    ┌──────────────────────────────┐ │
       │                                     │    │ tripleRatchet.decrypt(       │ │
       │                                     │    │   ciphertext, header         │ │
       │                                     │    │ )                            │ │
       │                                     │    │ → plaintext_message          │ │
       │                                     │    └──────────────────────────────┘ │
       │                                     │                                    │
       │  ◄── "delivery_receipt" ────────────│◄───── "ack" ───────────────────────│
       │                                     │                                    │
```

**Key architectural decisions (matching Signal's approach):**

- Server is **zero-knowledge** — only stores ciphertext, never sees plaintext
- PQXDH adds post-quantum resistance via ML-KEM-768 (Kyber) on top of X3DH
- Triple Ratchet = EC Double Ratchet ∥ SPQR, combined via KDF_HYBRID (forward secrecy +
  post-quantum)
- One-time prekeys are consumed on use (Signal pattern) — server must notify user to replenish
- Snowflake IDs provide globally-ordered, time-sortable message IDs without coordination

### 2.2 Making a Voice/Video Call

**Reference architecture**: Discord (WebRTC SFU model for groups), Signal (P2P for 1:1). CGraph uses
P2P via CallChannel signaling.

```
┌─────────────┐                    ┌─────────────────┐                   ┌─────────────┐
│  Caller      │                    │   Backend         │                   │  Callee      │
│  (Alice)     │                    │   (Phoenix)       │                   │  (Bob)       │
└──────┬───────┘                    └────────┬──────────┘                   └──────┬───────┘
       │                                     │                                     │
       │  1. POST /api/v1/calls/initiate     │                                     │
       │  { callee_id, media: {audio, video}}│                                     │
       │────────────────────────────────────►│                                     │
       │                                     │ CGraph.WebRTC.Calls.create_room()   │
       │                                     │ → room_id, TURN/STUN credentials    │
       │  { room_id, ice_servers }           │                                     │
       │◄────────────────────────────────────│                                     │
       │                                     │                                     │
       │                                     │  2. Notify via UserChannel:          │
       │                                     │  "call:incoming" { room_id,          │
       │                                     │    caller_id, caller_name, media }   │
       │                                     │────────────────────────────────────►│
       │                                     │                                     │
       │  3. Join "call:{room_id}"           │     4. Bob accepts, joins channel   │
       │────────────────────────────────────►│◄────────────────────────────────────│
       │                                     │                                     │
       │                                     │  "participant:joined" {bob}          │
       │◄────────────────────────────────────│────────────────────────────────────►│
       │                                     │                                     │
       │  5. Create RTCPeerConnection        │          Create RTCPeerConnection   │
       │     + getUserMedia()                │          + getUserMedia()            │
       │                                     │                                     │
       │  6. "signal:offer" {sdp}            │                                     │
       │────────────────────────────────────►│  relay to Bob                       │
       │                                     │────────────────────────────────────►│
       │                                     │                                     │
       │                                     │  7. "signal:answer" {sdp}            │
       │◄────────────────────────────────────│◄────────────────────────────────────│
       │                                     │                                     │
       │  8. ICE candidate exchange          │                                     │
       │  "signal:ice_candidate" ◄──────────►│◄──────────────────────────────────►│
       │          (multiple rounds)          │                                     │
       │                                     │                                     │
       │  ═══════════════════════════════════════════════════════════════════════   │
       │  ║  9. P2P Media Stream (WebRTC)  — bypasses server entirely          ║   │
       │  ═══════════════════════════════════════════════════════════════════════   │
       │                                     │                                     │
       │  10. "media:update" {muted: true}   │  relay to Bob                       │
       │────────────────────────────────────►│────────────────────────────────────►│
       │                                     │                                     │
       │  11. "call:leave"                   │                                     │
       │────────────────────────────────────►│  "participant:left"                 │
       │                                     │────────────────────────────────────►│
       │                                     │                                     │
       │                                     │  CGraph.WebRTC.CallHistory.record() │
       │                                     │  (duration, participants, type)     │
```

**Scale considerations for calls:**

- **1:1 calls**: Pure P2P, server only handles signaling → near-zero backend load
- **Group calls (3+)**: Mesh P2P up to ~4 participants, then requires SFU (Selective Forwarding
  Unit). Discord uses custom SFU; CGraph should evaluate LiveKit or mediasoup as SFU options for
  groups >4.
- **TURN relay**: Needed when P2P fails (symmetric NAT). Fly.io regions should each run a TURN
  server (coturn) to minimize latency.

### 2.3 Forum Post with Gamification XP Award

**Reference architecture**: Discourse (trust levels + gamification), Reddit (karma system). CGraph
extends with full RPG-style gamification.

```
┌─────────────┐                    ┌──────────────────────────────────────────────────┐
│  User        │                    │                 Backend (Phoenix)                 │
│  (Alice)     │                    │                                                   │
└──────┬───────┘                    │  ┌─────────┐  ┌──────────┐  ┌──────────────────┐ │
       │                            │  │ Forums  │  │ Gamific. │  │ Notifications    │ │
       │                            │  │ Context │  │ Context  │  │ Context          │ │
       │                            │  └────┬────┘  └────┬─────┘  └────┬─────────────┘ │
       │                            └───────┼────────────┼─────────────┼────────────────┘
       │                                    │            │             │
       │  1. POST /api/v1/forums/:id/posts  │            │             │
       │  { title, body, board_id }         │            │             │
       │───────────────────────────────────►│            │             │
       │                                    │            │             │
       │                    2. Forums.create_post()      │             │
       │                       → validate, insert        │             │
       │                       → index in MeiliSearch    │             │
       │                       → RankingEngine.score()   │             │
       │                                    │            │             │
       │                    3. DOMAIN EVENT: │            │             │
       │                       {:post_created,           │             │
       │                        user_id, post_id,        │             │
       │                        board_id}                │             │
       │                                    │            │             │
       │                    ────────────────►│            │             │
       │                                    ║            │             │
       │                    4. Gamification handles event:│             │
       │                       XP.award(user, :forum_post, 15)         │
       │                       │ Achievement.check(:first_post)        │
       │                       │ Quest.progress(:community_voice)      │
       │                       │ Reputation.update(user, +2)           │
       │                                    ║            │             │
       │                                    ║   5. If XP crosses level │
       │                                    ║      threshold → level_up│
       │                                    ║      → unlock rewards    │
       │                                    ║            │             │
       │                    6. Notifications:║            │             │
       │                       ┌────────────╨────────────┤             │
       │                       │ Push: "New post in X"   │             │
       │                       │ (to board subscribers)  ├────────────►│
       │                       │ XP: "+15 XP earned"     │  Oban jobs  │
       │                       │ Achievement: "unlocked" │  for async  │
       │                       └─────────────────────────┘  delivery   │
       │                                    │                          │
       │  7. Real-time responses:           │                          │
       │                                    │                          │
       │  ◄─ ForumChannel: "new_post"  ─────│                          │
       │  ◄─ UserChannel: "xp_gained" ─────│                          │
       │  ◄─ GamificationChannel:      ─────│                          │
       │     "achievement_unlocked"         │                          │
       │                                    │                          │
```

**Cross-context event bus pattern (recommended implementation):**

```elixir
# Option A: Phoenix.PubSub domain events (lightweight, already available)
defmodule CGraph.Events do
  @pubsub CGraph.PubSub

  def dispatch(event_type, payload) do
    Phoenix.PubSub.broadcast(@pubsub, "domain_events", {event_type, payload})
  end
end

# In Gamification context - subscribe to domain events:
defmodule CGraph.Gamification.EventHandler do
  use GenServer

  def init(_) do
    Phoenix.PubSub.subscribe(CGraph.PubSub, "domain_events")
    {:ok, %{}}
  end

  def handle_info({:post_created, %{user_id: uid, post_id: pid}}, state) do
    CGraph.Gamification.award_xp(uid, :forum_post, 15)
    CGraph.Gamification.AchievementSystem.check_event(uid, :post_created)
    {:noreply, state}
  end
end
```

```elixir
# Option B: Oban job for guaranteed processing (preferred for XP/currency)
defmodule CGraph.Workers.GamificationEventWorker do
  use Oban.Worker, queue: :gamification, max_attempts: 3

  @impl true
  def perform(%Oban.Job{args: %{"event" => "post_created", "user_id" => uid}}) do
    CGraph.Gamification.award_xp(uid, :forum_post, 15)
    :ok
  end
end

# Dispatched from Forums context:
%{"event" => "post_created", "user_id" => user_id, "post_id" => post_id}
|> CGraph.Workers.GamificationEventWorker.new()
|> Oban.insert()
```

**Recommendation**: Use **Oban jobs** for gamification events. XP/currency transactions must be
idempotent and durable — Oban provides exactly-once semantics via unique jobs, retry on failure, and
dead-letter handling. Use PubSub for real-time UI notifications that can be lossy.

---

## 3. Suggested Build Order (Reconnection Sequence)

### Rationale

The 85% that exists is disconnected. The build order is determined by **dependency chains** — later
features depend on earlier ones being functional.

```
WAVE 1: Foundation (Auth + Real-time)         ← Everything depends on this
  │
  ├── WAVE 2: Core Messaging (E2EE Pipeline)  ← Primary product value
  │     │
  │     ├── WAVE 3: Social Features (Groups, Forums, Gamification)
  │     │     │
  │     │     └── WAVE 4: Premium + Advanced Features (Stripe, AI, Calls)
  │     │
  │     └── WAVE 3b: Mobile Parity
  │
  └── Infrastructure (continuous: observability, scaling)
```

### Detailed Build Order

| Wave     | System                     | Tasks                                                                                                                                                                    | Dependencies                      | Effort |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- | ------ |
| **1.1**  | **Auth Flow**              | Wire `useAuthStore` → token refresh → API client headers → socket reconnect                                                                                              | None (foundation)                 | S      |
| **1.2**  | **Socket Connection**      | Connect `SocketManager.connect()` to auth completion. Handle reconnects, backoff. UserChannel must auto-join on connect                                                  | Auth (1.1)                        | S      |
| **1.3**  | **Presence**               | Wire `PresenceChannel` join on socket connect. Integrate `presenceManager` with friend list UI                                                                           | Socket (1.2)                      | S      |
| **2.1**  | **E2EE Key Bootstrap**     | On registration: generate identity keypair, signed prekey, one-time prekeys, Kyber prekeys. Upload via `/api/v1/e2ee/keys`. Store in secure storage (IndexedDB/Keychain) | Auth (1.1)                        | M      |
| **2.2**  | **E2EE Session Setup**     | On first message to new recipient: fetch prekey bundle → PQXDH → TripleRatchet init. Store session in `e2eeStore`                                                        | Key Bootstrap (2.1)               | L      |
| **2.3**  | **E2EE Message Pipeline**  | Intercept message send: encrypt → channel push. Intercept receive: channel event → decrypt → display. Handle out-of-order messages (skipped message keys)                | Session Setup (2.2), Socket (1.2) | L      |
| **2.4**  | **E2EE Key Rotation**      | Periodic signed prekey rotation (Signal: every 7 days). One-time prekey replenishment when server supply < threshold                                                     | Message Pipeline (2.3)            | M      |
| **3.1**  | **Groups Real-time**       | Wire `GroupChannel` join/leave. Group message broadcasts. Member presence                                                                                                | Socket (1.2)                      | M      |
| **3.2**  | **Forums Real-time**       | Wire `ForumChannel` + `ThreadChannel`. Live comments, votes, viewers count                                                                                               | Socket (1.2)                      | M      |
| **3.3**  | **Gamification Events**    | Implement cross-context event bus (Oban). Wire forum/messaging actions → XP awards → achievement checks → real-time notifications                                        | Forums (3.2), Socket (1.2)        | M      |
| **3.4**  | **Notifications Pipeline** | Connect `NotificationWorker` → push service → `UserChannel` broadcast. Push tokens (FCM/APNs)                                                                            | Socket (1.2)                      | M      |
| **3b.1** | **Mobile Auth**            | Mirror web auth flow in React Native with biometric support, secure token storage (Keychain/Keystore)                                                                    | Auth (1.1)                        | M      |
| **3b.2** | **Mobile E2EE**            | Same `@cgraph/crypto` package. RN-specific: secure storage via `expo-secure-store` instead of IndexedDB                                                                  | E2EE Pipeline (2.3)               | M      |
| **3b.3** | **Mobile Offline Sync**    | WatermelonDB ↔ backend sync protocol via `/api/v1/sync` endpoints. Conflict resolution (last-write-wins with vector clocks)                                              | Auth (1.1)                        | L      |
| **4.1**  | **Stripe Integration**     | Webhook processing → subscription state → tier limits → feature gates → real-time UserChannel notification                                                               | Auth (1.1), Socket (1.2)          | M      |
| **4.2**  | **Voice/Video Calls**      | Connect `webrtcService` ↔ `CallChannel`. ICE/SDP flow. Incoming call handler via UserChannel                                                                             | Socket (1.2)                      | L      |
| **4.3**  | **AI Features**            | Wire `aiService.ts` → AI endpoints. Smart replies, sentiment, moderation. Streaming responses via `AiChannel`                                                            | Auth (1.1)                        | M      |

**Effort**: S = 1-2 days, M = 3-5 days, L = 1-2 weeks

---

## 4. Scale Architecture (10K+ Concurrent Users)

### 4.1 Reference Benchmarks

| Platform     | Users     | Architecture                                      | Notes                                       |
| ------------ | --------- | ------------------------------------------------- | ------------------------------------------- |
| **Signal**   | 40M+ DAU  | Erlang-based (custom), SGX enclaves               | Minimalist server, no group features        |
| **Discord**  | 200M+ MAU | Elixir (early), Rust (current guilds), Go (calls) | Guild sharding, custom Erlang-based gateway |
| **Telegram** | 900M+ MAU | C++ MTProto, distributed DC clusters              | Custom protocol, heavy client-side caching  |

CGraph's Elixir/Phoenix stack is architecturally closest to early Discord. Key: Discord scaled to
millions before switching guilds to Rust. Elixir comfortably handles 10K-100K concurrent.

### 4.2 Phoenix Channel Scaling

**Current**: Single-node Phoenix, PubSub pool_size derived from `System.schedulers_online()`.

**For 10K concurrent WebSocket connections:**

```
Target: 10,000 concurrent WebSocket connections
Each user ≈ 2-5 channel subscriptions (user, conversation, group, presence, forum)
Total channel memberships ≈ 30,000-50,000

Phoenix handles this easily on a single 4-CPU Fly.io machine.
Erlang was designed for millions of lightweight processes.
```

**Configuration recommendations:**

```elixir
# config/runtime.exs

# PubSub: partition for parallel dispatch
config :cgraph, CGraph.PubSub,
  pool_size: System.schedulers_online()  # Typically 4-8 on Fly.io

# Endpoint: WebSocket transport tuning
config :cgraph, CGraphWeb.Endpoint,
  http: [port: 4000, transport_options: [
    # Max concurrent connections (per Fly machine)
    max_connections: 16_384,
    # Socket acceptor pool
    num_acceptors: 100
  ]],
  url: [host: "cgraph.app", port: 443],
  # WebSocket configuration
  socket: [
    websocket: [
      # Increase timeout for mobile connections
      timeout: 60_000,
      # Compress WebSocket frames (reduces bandwidth 60-80%)
      compress: true,
      # Max frame size (1MB for file transfers)
      max_frame_size: 1_048_576
    ]
  ]
```

**Multi-node scaling (Fly.io):**

```
┌──────────────────────────────────────────────────────┐
│  Fly.io Multi-Region                                  │
│                                                       │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐          │
│  │ IAD-1   │    │ IAD-2   │    │ SJC-1   │          │
│  │ Phoenix │◄──►│ Phoenix │◄──►│ Phoenix │          │
│  │ Node    │    │ Node    │    │ Node    │          │
│  └────┬────┘    └────┬────┘    └────┬────┘          │
│       │              │              │                 │
│       └──────────────┼──────────────┘                 │
│              Erlang Distribution                      │
│              (DNSCluster auto-discovery)              │
│              PubSub syncs across nodes                │
│                      │                                │
│                ┌─────▼──────┐                         │
│                │ PostgreSQL │ (primary in IAD)         │
│                │  + replica │ (read replica in SJC)    │
│                └────────────┘                         │
└──────────────────────────────────────────────────────┘
```

- **Erlang distribution** handles PubSub sync across nodes automatically — a message broadcast on
  IAD-1 reaches subscribers on SJC-1 via Erlang's built-in messaging.
- At 10K concurrent, **2-3 Fly machines** in the primary region + 1 per additional region is
  sufficient.
- **Horizontal scaling is nearly linear** with Phoenix because:
  - No shared mutable state (each process is isolated)
  - PubSub is partitioned and distributed
  - Presence uses CRDTs for eventually consistent state

### 4.3 PgBouncer Configuration (current + recommended)

**Current** (from `infrastructure/pgbouncer/pgbouncer.ini`):

```ini
pool_mode = transaction           # ✅ Correct for Ecto (supports prepared: :unnamed)
max_client_conn = 200             # ✅ OK for 2 machines
default_pool_size = 25            # ⚠️ May need increase
reserve_pool_size = 5             # ✅ Good burst handling
```

**Recommended for 10K concurrent users:**

```ini
# Each concurrent user ≈ 0.1-0.3 DB queries/second average
# 10K users × 0.2 qps = 2,000 queries/sec
# With transaction pooling, each query holds connection ~5ms
# Needed connections = 2000 × 0.005 = 10 concurrent connections
# But spikes can 10x → need 100 connections available

max_client_conn = 500             # Allow more app-to-pgbouncer connections
default_pool_size = 40            # More actual PG connections in the pool
min_pool_size = 10                # Keep more warm
reserve_pool_size = 10            # Larger burst capacity
```

**Ecto pool size** (in `runtime.exs`):

```elixir
# Primary repo: write-heavy operations
config :cgraph, CGraph.Repo,
  pool_size: 20                   # Per Fly machine → PgBouncer → PG

# Read replica: read-heavy operations (conversation lists, search, forums)
config :cgraph, CGraph.ReadRepo,
  pool_size: 15                   # Lighter, mostly reads
```

**Rule of thumb**: Ecto pool_size × number_of_machines ≤ PgBouncer default_pool_size.

### 4.4 Redis Scaling

**Current role**: L3 cache, rate limiting, token blacklist.

**For 10K concurrent:**

```
Redis memory estimation:
- Cache entries: ~50K entries × 2KB avg = 100MB
- Rate limit windows: 10K users × 200B = 2MB
- Token blacklist: ~1K revoked tokens × 100B = 100KB
- Presence: 10K users × 50B = 500KB
Total: ~105MB — a single Redis instance handles this easily

Redis operations:
- Cache reads: ~5K ops/sec
- Rate limiting: ~2K ops/sec
- Pub/Sub: ~500 msgs/sec (for cross-process invalidation)
Total: ~7.5K ops/sec — well within single-instance capacity (100K+ ops/sec)
```

**Recommendation**: Single Redis instance (Fly.io managed or Upstash) is sufficient for 10K. At
50K+, consider Redis Cluster or separate instances for cache vs. rate-limiting.

### 4.5 3-Tier Cache Strategy

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  L1: ETS        │────►│  L2: Cachex      │────►│  L3: Redis     │
│  Per-process    │miss │  Per-node         │miss │  Shared cluster│
│  ~0.1μs read    │     │  ~1μs read        │     │  ~0.5ms read   │
│  No coordination│     │  Local + TTL      │     │  Distributed   │
│  Hot data only  │     │  LRU eviction     │     │  Full dataset  │
└─────────────────┘     └──────────────────┘     └────────────────┘

Cache usage by feature:
- User profiles:     L1 (10s) → L2 (60s) → L3 (5min) → DB
- Conversation list: L2 (30s) → L3 (2min) → DB
- Forum boards:      L2 (60s) → L3 (5min) → DB
- Rate limit state:  L3 only (Redis sliding window)
- Permission checks: L1 (30s) → L2 (5min) → DB
- Tier limits:       L1 (60s) → L2 (10min) → DB (warm on deploy)
```

**Stampede protection** (already implemented in `CGraph.Cache.Stampede`): Uses probabilistic early
expiration to prevent thundering herd on cache miss.

### 4.6 Message Table Partitioning

Migration `20260213000001_partition_messages_table.exs` indicates time-based partitioning is already
planned. For 10K concurrent:

```
Messages/day estimate:
10K concurrent × 50 msgs/user/day = 500K messages/day
500K × 365 = 182M messages/year

Partitioning strategy:
- Partition by month (created_at range)
- Keep hot partitions (last 3 months) on fast storage
- Archive older partitions to cold storage
- Snowflake IDs provide natural ordering within partitions
```

---

## 5. Mobile-Web Code Sharing Strategy

### 5.1 Current Package Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     @cgraph/* Shared Packages                        │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │ @cgraph/crypto │  │ @cgraph/socket │  │ @cgraph/shared-types   │  │
│  │                │  │                │  │                        │  │
│  │ Signal Triple  │  │ PhoenixClient  │  │ User, Message, Group,  │  │
│  │ Ratchet, PQXDH │  │ Typed channels │  │ Forum, Event types     │  │
│  │ AES-256-GCM    │  │ Backoff logic  │  │ API request/response   │  │
│  │ ML-KEM-768     │  │ Reconnection   │  │ Tier definitions       │  │
│  └────────────────┘  └────────────────┘  └────────────────────────┘  │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │ @cgraph/       │  │ @cgraph/utils  │  │ @cgraph/animation-     │  │
│  │ api-client     │  │                │  │ constants              │  │
│  │                │  │ Format, valid- │  │                        │  │
│  │ CircuitBreaker │  │ ation (Zod),   │  │ Durations, easings,    │  │
│  │ Retry, Timeout │  │ permissions,   │  │ springs, stagger       │  │
│  │                │  │ HTTP factory   │  │                        │  │
│  └────────────────┘  └────────────────┘  └────────────────────────┘  │
│                                                                       │
└────────────────────────────┬──────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼────┐  ┌─────▼────┐  ┌─────▼────┐
        │  Web App │  │ Mobile   │  │ Landing  │
        │  (Vite)  │  │ (Expo)   │  │ (Vite)   │
        └──────────┘  └──────────┘  └──────────┘
```

### 5.2 Recommended Code Sharing Tiers

**Tier 1 — Fully Shared (packages, 100% reuse)**

| Package                       | What's Shared                       | Platform Adaptation                        |
| ----------------------------- | ----------------------------------- | ------------------------------------------ |
| `@cgraph/shared-types`        | All TypeScript interfaces           | None needed                                |
| `@cgraph/crypto`              | Full E2EE protocol                  | `crypto.subtle` (Web) vs RN polyfill       |
| `@cgraph/api-client`          | Resilience layer                    | `fetch` is universal                       |
| `@cgraph/socket`              | Phoenix channel client              | `phoenix` library is universal             |
| `@cgraph/utils`               | Validation, formatting, permissions | None needed                                |
| `@cgraph/animation-constants` | Duration/easing values              | Used by Framer (web) + Reanimated (mobile) |

**Tier 2 — Shared Logic, Different UI (hooks/stores pattern)**

```
Recommended: Extract platform-agnostic hooks into shared packages

Current (duplicated):
  web/src/modules/auth/hooks/useAuth.ts
  mobile/src/hooks/useAuth.ts         ← Different but same logic

Target (shared):
  packages/shared-hooks/src/
    useAuth.ts          ← Pure logic, no UI imports
    useMessages.ts      ← Message CRUD, pagination
    useConversation.ts  ← Conversation management
    useE2EE.ts          ← E2EE session management
    useGamification.ts  ← XP, achievements, quests
    usePresence.ts      ← Online status tracking
```

**Pattern for platform-agnostic hooks:**

```typescript
// packages/shared-hooks/src/useMessages.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Message, Conversation } from '@cgraph/shared-types';

// This hook works identically on web and mobile
// because TanStack Query, Zustand, and fetch are universal
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();

  const messages = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api.getMessages(conversationId),
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) => api.sendMessage(conversationId, content),
    onSuccess: (msg) => {
      queryClient.setQueryData(['messages', conversationId], (old: Message[]) => [...old, msg]);
    },
  });

  return { messages, sendMessage };
}
```

**Tier 3 — Platform-Specific (UI components, navigation)**

| Aspect     | Web                     | Mobile                                  | Sharing Strategy                                  |
| ---------- | ----------------------- | --------------------------------------- | ------------------------------------------------- |
| Components | Radix UI + Tailwind     | React Native core + Reanimated          | No sharing (different paradigms)                  |
| Navigation | React Router            | React Navigation                        | No sharing                                        |
| Gestures   | CSS/Framer Motion       | React Native Gesture Handler            | Share constants via `@cgraph/animation-constants` |
| Storage    | IndexedDB, localStorage | AsyncStorage, SecureStore, WatermelonDB | Abstract behind storage interface                 |
| Push       | Web Push API            | Expo Notifications (FCM/APNs)           | Separate implementations                          |
| Biometrics | WebAuthn                | expo-local-authentication               | Separate implementations                          |

### 5.3 Zustand Store Sharing Strategy

**Current state**: Web and mobile have separate but near-identical Zustand stores.

**Recommendation**: Create a `@cgraph/shared-stores` package with platform-agnostic store slices:

```typescript
// packages/shared-stores/src/authStore.ts
import { create } from 'zustand';
import type { User } from '@cgraph/shared-types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

// Factory function — platforms provide their own persist middleware
export const createAuthStore = (persistMiddleware?: any) =>
  create<AuthState>()(
    (persistMiddleware ?? ((fn: any) => fn))((set: any) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token: string, user: User) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      updateUser: (updates: Partial<User>) =>
        set((state: AuthState) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }))
  );
```

```typescript
// apps/web/src/stores/authStore.ts
import { createAuthStore } from '@cgraph/shared-stores';
import { persist } from 'zustand/middleware';

export const useAuthStore = createAuthStore((fn) =>
  persist(fn, { name: 'cgraph-auth', storage: localStorage })
);

// apps/mobile/src/stores/authStore.ts
import { createAuthStore } from '@cgraph/shared-stores';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = createAuthStore((fn) =>
  persist(fn, { name: 'cgraph-auth', storage: AsyncStorage })
);
```

### 5.4 API Layer Sharing

**Current**: Both platforms have their own `lib/api.ts`. Both use `@cgraph/api-client` under the
hood.

**Recommendation**: Consolidate API call definitions into shared modules:

```
packages/shared-api/src/
  auth.ts          → login(), register(), refreshToken()
  messages.ts      → getMessages(), sendMessage(), deleteMessage()
  conversations.ts → getConversations(), createConversation()
  groups.ts        → getGroups(), createGroup(), joinGroup()
  forums.ts        → getBoards(), createThread(), createPost()
  gamification.ts  → getXP(), getAchievements(), getQuests()
  e2ee.ts          → uploadKeys(), fetchPrekeys(), createSession()
  users.ts         → getProfile(), updateSettings(), searchUsers()
```

Each function takes an `ApiClient` instance (from `@cgraph/api-client`) as a parameter, making it
platform-agnostic.

---

## 6. Stripe Integration Architecture

### 6.1 Current Stripe Integration Points

CGraph already has Stripe infrastructure:

- **Config**: `apps/backend/config/stripe.exs` + `runtime.exs` (API keys, price IDs)
- **Library**: `stripity_stripe` (Elixir Stripe SDK)
- **Webhook**: `CGraphWeb.StripeWebhookController`
- **Context**: `CGraph.Subscriptions` (tier management, feature gating)
- **Controllers**: `PaymentController`, `SubscriptionController`
- **Client**: `apps/web/src/lib/stripe.tsx` (Stripe.js integration)
- **Mobile**: `apps/mobile/src/lib/payment.ts`

### 6.2 Payment Architecture Flow

```
┌─────────────┐     ┌────────────────────┐     ┌──────────────┐
│ Client       │     │ Backend (Phoenix)  │     │ Stripe       │
│ (Web/Mobile) │     │                    │     │              │
└──────┬───────┘     └────────┬───────────┘     └──────┬───────┘
       │                      │                        │
       │  1. Select tier      │                        │
       │  (Premium/Enterprise)│                        │
       │                      │                        │
       │  2. POST /api/v1/    │                        │
       │  subscriptions/create│                        │
       │────────────────────►│                        │
       │                      │  3. Stripe.Session.    │
       │                      │  create(              │
       │                      │   price: price_id,    │
       │                      │   customer: stripe_id)│
       │                      │───────────────────────►│
       │                      │                        │
       │                      │  4. { session_id,      │
       │                      │    checkout_url }      │
       │                      │◄───────────────────────│
       │  5. { checkout_url } │                        │
       │◄─────────────────────│                        │
       │                      │                        │
       │  6. Redirect to      │                        │
       │  Stripe Checkout     │                        │
       │─────────────────────────────────────────────►│
       │                      │                        │
       │  7. User pays        │                        │
       │                      │                        │
       │                      │  8. Webhook:            │
       │                      │  checkout.session.      │
       │                      │  completed              │
       │                      │◄───────────────────────│
       │                      │                        │
       │                      │  9. Process:            │
       │                      │  Subscriptions.         │
       │                      │  activate_subscription()│
       │                      │  → Update user tier     │
       │                      │  → TierLimits.refresh() │
       │                      │  → Cache invalidation   │
       │                      │                        │
       │  10. UserChannel:    │                        │
       │  "subscription:      │                        │
       │   activated"         │                        │
       │◄─────────────────────│                        │
       │                      │                        │
       │  11. UI updates:     │                        │
       │  unlock premium      │                        │
       │  features instantly  │                        │
       │                      │                        │
```

### 6.3 Stripe Webhook Events to Handle

| Event                           | Action                                  |
| ------------------------------- | --------------------------------------- |
| `checkout.session.completed`    | Activate subscription, update tier      |
| `invoice.paid`                  | Record payment, extend subscription     |
| `invoice.payment_failed`        | Notify user, grace period starts        |
| `customer.subscription.updated` | Tier change (upgrade/downgrade)         |
| `customer.subscription.deleted` | Deactivate premium, revert to free tier |
| `charge.refunded`               | Deactivate premium if within window     |
| `charge.dispute.created`        | Flag account, notify admin              |

### 6.4 Where Stripe Fits in Context Architecture

```
CGraph.Subscriptions (existing context)
├── subscriptions.ex          — Context facade
├── tier_limits.ex            — Feature gating per tier
├── tier_limits/              — Limit definitions per feature
│   ├── messaging_limits.ex   — Max DMs, group size, file size
│   ├── forum_limits.ex       — Max boards, poll options
│   ├── gamification_limits.ex — Shop discounts, XP boosts
│   └── storage_limits.ex     — Upload quota
├── tier_feature.ex           — Feature unlock schema
├── tier_limit.ex             — Limit value schema
└── user_tier_override.ex     — Admin overrides

Integration points with other contexts:
- Accounts       → user.subscription_tier field
- Messaging      → TierLimits.check(:messaging, :max_group_size, user)
- Groups         → TierLimits.check(:groups, :max_channels, user)
- Forums         → TierLimits.check(:forums, :max_boards, user)
- Gamification   → Premium XP multiplier, exclusive shop items
- Storage/Uploads → File size limits, total quota
```

---

## 7. Industry Architecture Reference Patterns

### 7.1 Signal Architecture Patterns (Applicable to CGraph)

| Pattern                   | Signal Implementation                         | CGraph Equivalent                                                       |
| ------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| **Zero-knowledge server** | Server stores only ciphertext + metadata      | Same — `@cgraph/crypto` encrypts client-side, backend stores ciphertext |
| **Prekey bundles**        | Upload N one-time prekeys, server distributes | `CGraph.Crypto.E2EE` + prekey replenishment                             |
| **Sealed sender**         | Metadata protection via encrypted envelope    | Future enhancement — not yet needed for 10K scale                       |
| **Key transparency**      | CONIKS-like key directory                     | Future — start with TOFU (Trust On First Use)                           |
| **Double Ratchet**        | EC Diffie-Hellman + HKDF chain                | Extended to **Triple Ratchet** with ML-KEM-768 (post-quantum)           |

### 7.2 Discord Architecture Patterns (Applicable to CGraph)

| Pattern             | Discord Implementation                | CGraph Equivalent                                            |
| ------------------- | ------------------------------------- | ------------------------------------------------------------ |
| **Guild sharding**  | Each guild on specific server/cluster | Not needed <100K — Erlang distribution handles it            |
| **Gateway**         | WebSocket gateway for event dispatch  | Phoenix Channels + PubSub (simpler, equally effective)       |
| **Lazy loading**    | Only load visible guild members       | Implement in `GroupChannel` — paginated member lists         |
| **Event-driven**    | All changes → events → subscribers    | Phoenix PubSub + Channel broadcasts (already built)          |
| **Message fan-out** | Write to DB, fan-out to subscribers   | `Endpoint.broadcast!()` to channel topics                    |
| **Rate limiting**   | Per-route + per-user sliding window   | `rate_limiter_v2.ex` — tiered sliding window (already built) |

### 7.3 Telegram Architecture Patterns (Applicable to CGraph)

| Pattern                 | Telegram Implementation                  | CGraph Equivalent                                           |
| ----------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| **MTProto**             | Custom binary protocol                   | Phoenix Channels (WebSocket) — simpler, well-supported      |
| **Multi-DC**            | Data replicated across DCs               | Fly.io multi-region + DNSCluster                            |
| **Offline queue**       | Server queues messages for offline users | Oban jobs for push notifications + `sync_routes` for mobile |
| **File CDN**            | Dedicated file servers                   | S3/R2 with Cloudflare CDN                                   |
| **Client-side caching** | Aggressive local caching                 | TanStack Query (web) + WatermelonDB (mobile)                |

---

## 8. Risk Assessment & Mitigations

| Risk                                  | Likelihood | Impact   | Mitigation                                                                            |
| ------------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------- |
| E2EE key loss (user loses device)     | High       | Critical | Recovery codes (already in `recovery_code.ex`), key backup to encrypted cloud storage |
| Ratchet state desync                  | Medium     | High     | Message key caching for skipped messages (Signal pattern), session reset protocol     |
| WebSocket connection storms on deploy | Medium     | Medium   | Staggered reconnect with exponential backoff + jitter (`@cgraph/socket` backoff.ts)   |
| PostgreSQL connection exhaustion      | Low        | Critical | PgBouncer transaction pooling (already configured), circuit breaker on Ecto           |
| Redis single point of failure         | Low        | Medium   | ETS fallback for rate limiting (already built), Cachex for L2 cache                   |
| Mobile app backgrounding kills socket | High       | Medium   | Reconnect on app foreground + push notification fallback for critical messages        |
| Cross-context event ordering          | Medium     | Medium   | Oban unique jobs with idempotency keys for gamification events                        |

---

## 9. Summary of Recommendations

1. **Build order**: Auth → Socket → E2EE pipeline → Social features → Premium. This minimizes
   blocked dependencies.

2. **Cross-context events**: Use **Oban jobs** for durable events (XP awards, notifications) and
   **Phoenix.PubSub** for real-time UI updates. Don't build a custom event bus — leverage what's
   already in the stack.

3. **E2EE pipeline**: The `@cgraph/crypto` package with Triple Ratchet + PQXDH is comprehensive. The
   gap is the **integration layer** — intercepting message send/receive in the chat module to
   encrypt/decrypt transparently. This is the highest-complexity integration task.

4. **Scaling**: The current architecture (Phoenix + PgBouncer + Redis + DNSCluster) handles 10K
   concurrent users with minimal changes. Tune PgBouncer pool sizes, enable WebSocket compression,
   and ensure PubSub pool_size matches CPU cores.

5. **Mobile-web parity**: Extract shared stores and hooks into new `@cgraph/shared-stores` and
   `@cgraph/shared-hooks` packages. Keep UI components platform-specific. Share API call
   definitions.

6. **Stripe**: Already well-integrated. Main gap is the real-time webhook → UserChannel notification
   for instant UI updates when subscription state changes.

7. **Voice calls**: P2P via CallChannel is sufficient for 1:1. Plan for SFU (LiveKit/mediasoup) if
   group calls >4 participants are needed.
