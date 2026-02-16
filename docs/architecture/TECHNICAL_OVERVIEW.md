# CGraph Technical Overview

> Comprehensive technical reference for the CGraph platform  
> Version 0.9.28 | January 2026

---

## Table of Contents

1. [Platform Architecture](#platform-architecture)
2. [Technology Stack](#technology-stack)
3. [Core Subsystems](#core-subsystems)
4. [Data Flow & Communication](#data-flow--communication)
5. [Security Architecture](#security-architecture)
6. [Scalability & Performance](#scalability--performance)
7. [Development Workflow](#development-workflow)

---

## Platform Architecture

### High-Level Overview

CGraph is built as a monorepo containing three primary applications sharing common code and
infrastructure:

```
CGraph/
├── apps/
│   ├── backend/          # Elixir/Phoenix API server
│   │   ├── lib/
│   │   │   ├── cgraph/         # Business logic contexts
│   │   │   ├── cgraph_web/     # Web layer (controllers, channels)
│   │   │   └── cgraph.ex
│   │   ├── priv/
│   │   │   └── repo/migrations/  # Database migrations
│   │   ├── config/               # Runtime configuration
│   │   └── mix.exs
│   │
│   ├── web/              # React web application
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── pages/          # Route pages
│   │   │   ├── lib/            # API, crypto, utils
│   │   │   ├── stores/         # Zustand state management
│   │   │   └── main.tsx
│   │   ├── public/             # Static assets
│   │   └── package.json
│   │
│   └── mobile/           # React Native mobile app
│       ├── src/
│       │   ├── screens/        # Mobile screens
│       │   ├── components/     # React Native components
│       │   ├── lib/            # API, storage, crypto
│       │   └── navigation/     # Navigation config
│       ├── app.json            # Expo configuration
│       └── package.json
│
├── packages/             # Shared code across apps
│   ├── shared-types/     # TypeScript interfaces
│   ├── config/           # Shared config
│   ├── ui/               # Common UI components
│   └── utils/            # Utility functions
│
├── infrastructure/       # DevOps & deployment
│   ├── docker/           # Dockerfile configs
│   ├── fly/              # Fly.io deployment
│   ├── terraform/        # IaC definitions
│   └── scripts/          # Automation scripts
│
└── docs/                 # Documentation
```

### Communication Flow

```
┌─────────────┐          ┌─────────────┐
│   Browser   │          │   Mobile    │
│  (React 19) │          │ (RN + Expo) │
└──────┬──────┘          └──────┬──────┘
       │                        │
       │ HTTPS/WSS              │ HTTPS/WSS
       │                        │
       └────────────┬───────────┘
                    │
            ┌───────▼────────┐
            │   Cloudflare   │
            │  CDN + WAF     │
            └───────┬────────┘
                    │
            ┌───────▼────────┐
            │  Phoenix API   │
            │  (Elixir/OTP)  │
            └───────┬────────┘
                    │
        ┌───────────┼───────────┐
        │                       │
┌───────▼────────┐     ┌───────▼────────┐
│   PostgreSQL   │     │  Phoenix       │
│   (Primary     │     │  Presence      │
│    Storage)    │     │  (CRDT)        │
└────────────────┘     └────────────────┘
```

---

## Technology Stack

### Backend (Elixir/Phoenix)

**Why Elixir?**

- Built on Erlang VM (BEAM) designed for soft real-time systems
- Lightweight processes (2KB) enable millions of concurrent connections
- OTP provides battle-tested fault tolerance and supervision trees
- Pattern matching and immutability reduce bugs
- Hot code reloading for zero-downtime deployments

**Key Libraries:**

- **Phoenix Framework 1.8.3** - Web framework with WebSocket channels
- **Ecto 3.13** - Database wrapper and query DSL
- **Guardian 2.4** - JWT-based authentication
- **Oban 2.20** - Background job processing with Cron support
- **CGraph.Presence.Sampled** - Tiered presence for million-user channels
- **CGraph.RateLimiter.Distributed** - Redis-backed rate limiting with Lua scripts
- **Cachex 4.1** - High-performance in-memory caching
- **Argon2** - Secure password hashing (OWASP recommended)
- **Bandit 1.10** - Pure Elixir HTTP/2 server
- **Meilisearch** - Sub-50ms typo-tolerant full-text search
- **WebRTC** - Peer-to-peer voice and video calling

**Project Structure:**

```elixir
# Context-based architecture
lib/cgraph/
  ├── accounts/           # User management
  ├── messaging/          # DMs and conversations
  ├── groups/             #  groups
  ├── forums/             #  forums
  ├── friends/            # Friend relationships
  └── notifications/      # Push & email notifications

lib/cgraph_web/
  ├── controllers/        # REST API endpoints
  ├── channels/           # WebSocket handlers
  ├── plugs/              # Middleware
  └── router.ex           # Route definitions
```

### Frontend Web (React + Vite)

**Why React 19?**

- Concurrent rendering for smooth UI during heavy loads
- Automatic batching reduces unnecessary re-renders
- Server Components (future-proofing)
- Largest ecosystem and community support

**Key Technologies:**

- **Vite 6.4** - Lightning-fast HMR, optimized builds
- **TypeScript 5.8** - Type safety across the entire codebase
- **TailwindCSS 3.5** - Utility-first styling
- **Zustand** - Lightweight state management
- **React Query** - Server state synchronization
- **Phoenix Channels JS** - WebSocket client
- **Web Crypto API** - E2EE encryption in browser

**Key Patterns:**

```typescript
// Centralized API client
import { api } from '@/lib/api';

// Zustand store for auth state
const useAuthStore = create<AuthState>(
  persist((set) => ({
    user: null,
    login: async (email, password) => {
      /* ... */
    },
    logout: async () => {
      /* ... */
    },
  }))
);

// Type-safe API calls
interface Message {
  id: string;
  content: string;
  sender_id: string;
}

const messages = await api.get<Message[]>('/api/v1/messages');
```

### Frontend Mobile (React Native + Expo)

**Why React Native?**

- Code sharing with web (80%+ shared business logic)
- Native performance with JavaScript flexibility
- Expo simplifies complex native modules
- Over-the-air updates via Expo

**Key Technologies:**

- **Expo SDK 54** - Managed workflow with native modules
- **React Navigation 7** - Native navigation patterns
- **Expo Secure Store** - Encrypted token storage
- **Expo Notifications** - Push notification handling
- **Phoenix Channels** - Same WebSocket library as web
- **Expo Crypto** - Native E2EE encryption

**Mobile-Specific Features:**

```typescript
// Biometric authentication
import * as LocalAuthentication from 'expo-local-authentication';

const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Authenticate to access CGraph',
  fallbackLabel: 'Use PIN',
});

// Secure token storage
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('auth_token', token);
const token = await SecureStore.getItemAsync('auth_token');
```

### Database (PostgreSQL 16)

**Schema Design Principles:**

- UUID primary keys for distributed systems
- JSONB columns for flexible metadata
- Proper foreign key constraints with cascading deletes
- GiST indexes for full-text search
- Partial indexes for common queries

**Key Tables:**

```sql
users                    -- User accounts (email, wallet, oauth)
conversations            -- 1:1 DM containers
conversation_participants -- Many-to-many join table
messages                 -- All messages (DMs + channels)
groups                   --  servers
channels                 -- Text/voice channels in groups
forums                   --  communities
posts                    -- Forum posts with voting
comments                 -- Nested forum comments
friendships              -- Friend relationships
notifications            -- User notifications
```

---

## Core Subsystems

### 1. Authentication System

**Multiple Authentication Modes:**

**Email/Password:**

```elixir
# Registration
{:ok, user} = Accounts.create_user(%{
  email: "user@example.com",
  username: "alice",
  password: "SecurePass123!",
  password_confirmation: "SecurePass123!"
})

# Login with Argon2 verification
{:ok, user} = Accounts.authenticate_by_identifier(identifier, password)
{:ok, token, _claims} = Guardian.encode_and_sign(user)
```

**OAuth 2.0 (Google, Apple, Facebook, TikTok):**

```elixir
# OAuth callback
{:ok, %{user: user, tokens: tokens}} =
  OAuth.callback(provider, code, state)

# Automatically creates user or links to existing account
```

**Web3 Wallet Authentication:**

```elixir
# Challenge-response flow
{:ok, challenge} = WalletAuth.generate_challenge(wallet_address)

# User signs challenge with MetaMask
signature = await window.ethereum.request({
  method: 'personal_sign',
  params: [challenge, wallet_address]
})

# Backend verifies signature
{:ok, user} = Accounts.verify_wallet_signature(wallet_address, signature)
```

**Token Management:**

- Access tokens (JWT): 1 hour expiry
- Refresh tokens: 30 day expiry
- Stored in HttpOnly cookies (web) or Secure Store (mobile)
- Token blacklisting for logout

### 2. Real-Time Messaging

**Phoenix Channels Architecture:**

```elixir
# User connects to socket
defmodule CgraphWeb.UserSocket do
  use Phoenix.Socket

  def connect(%{"token" => token}, socket, _connect_info) do
    case Guardian.decode_and_verify(token) do
      {:ok, %{"sub" => user_id}} ->
        {:ok, assign(socket, :user_id, user_id)}
      {:error, _} ->
        :error
    end
  end
end

# Join conversation channel
defmodule CgraphWeb.ConversationChannel do
  use Phoenix.Channel

  def join("conversation:" <> conversation_id, _params, socket) do
    # Verify user is participant
    if authorized?(socket, conversation_id) do
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_in("new_message", %{"content" => content}, socket) do
    # Create message
    {:ok, message} = Messaging.create_message(...)

    # Broadcast to all participants
    broadcast!(socket, "new_message", %{message: message})
    {:reply, {:ok, message}, socket}
  end
end
```

**Client Integration:**

```typescript
// Web client
import { Socket } from 'phoenix';

const socket = new Socket('ws://localhost:4000/socket', {
  params: { token: authToken },
});

socket.connect();

const channel = socket.channel(`conversation:${conversationId}`);

channel
  .join()
  .receive('ok', () => console.log('Joined'))
  .receive('error', (err) => console.error(err));

channel.on('new_message', (payload) => {
  // Update UI with new message
});

channel.push('new_message', { content: 'Hello!' });
```

### 3. Phoenix Presence (Online Status)

**CRDT-Based Distributed Tracking:**

```elixir
defmodule CgraphWeb.Presence do
  use Phoenix.Presence,
    otp_app: :cgraph,
    pubsub_server: Cgraph.PubSub
end

# Track user when they join
def join("conversation:" <> id, _params, socket) do
  send(self(), :after_join)
  {:ok, socket}
end

def handle_info(:after_join, socket) do
  Presence.track(socket, socket.assigns.user_id, %{
    online_at: DateTime.utc_now(),
    username: socket.assigns.username
  })

  push(socket, "presence_state", Presence.list(socket))
  {:noreply, socket}
end
```

**Client receives presence updates:**

```typescript
// Subscribe to presence
channel.on('presence_state', (state) => {
  const onlineUsers = Object.keys(state);
  // Update UI with online users
});

channel.on('presence_diff', (diff) => {
  // Handle joins/leaves
  diff.joins && console.log('Users joined:', Object.keys(diff.joins));
  diff.leaves && console.log('Users left:', Object.keys(diff.leaves));
});
```

**Recent Fix (v0.7.18):**

- Removed stale database status fallback
- Phoenix Presence is now single source of truth
- Real-time updates without database writes
- More details: [PRESENCE_FIX_2026_01_04](../guides/PRESENCE_FIX_2026_01_04.md)

### 4. End-to-End Encryption

**PQXDH + Triple Ratchet Protocol:**

```typescript
import { TripleRatchetEngine, generateIdentityKeyPair, generateSignedPreKey } from '@cgraph/crypto';

// Initialize identity keys (once per device)
const identityKey = await generateIdentityKeyPair(); // P-256 ECDSA
const signedPreKey = await generateSignedPreKey(identityKey); // P-256 ECDH
const kyberPreKey = await generateKyberPreKey(); // ML-KEM-768

// Register public keys with server
await api.post('/api/v1/keys', {
  identity_key: identityKey.publicKey,
  signed_pre_key: signedPreKey.publicKey,
  signature: signedPreKey.signature,
  kyber_pre_key: kyberPreKey.publicKey,
});

// Establish session with recipient via PQXDH
const recipientKeys = await api.get(`/api/v1/keys/${recipientId}`);
const sharedSecret = await pqxdhKeyAgreement(myKeys, recipientKeys); // P-256 ECDH + ML-KEM-768

// Initialize Triple Ratchet session
const engine = new TripleRatchetEngine({ enableAuditLog: true });
await engine.initializeAlice(sharedSecret, recipientKeys.publicKey);
```

**Message Encryption (AES-256-GCM):**

```typescript
// Encrypt message
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv, tagLength: 128 },
  encryptionKey,
  messageBytes
);

// Send encrypted message
await api.post('/api/v1/messages', {
  conversation_id: conversationId,
  content: base64(encrypted),
  is_encrypted: true,
  iv: base64(iv),
});
```

**Key Revocation (Forward Secrecy):**

When a device is lost or compromised, the user revokes their key:

```typescript
// Revoke compromised key
await api.post(`/api/v1/e2ee/keys/${keyId}/revoke`);

// Server broadcasts to all contacts via WebSocket
// Clients listen on their user channel:
userChannel.on('e2ee:key_revoked', (payload) => {
  // Invalidate cached prekey bundle for this user
  prekeyBundleCache.delete(payload.user_id);
  // Next message will fetch fresh keys
});
```

### 5. Background Jobs (Oban)

**Job Processing:**

```elixir
# Define worker
defmodule Cgraph.Workers.EmailWorker do
  use Oban.Worker, queue: :emails, max_attempts: 3

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "type" => "welcome"}}) do
    user = Accounts.get_user!(user_id)
    Email.send_welcome_email(user)
    :ok
  end
end

# Enqueue job
%{user_id: user.id, type: "welcome"}
|> EmailWorker.new()
|> Oban.insert()
```

**Scheduled Jobs:**

```elixir
# Cron configuration
config :cgraph, Oban,
  repo: Cgraph.Repo,
  queues: [default: 10, emails: 5, media: 20],
  plugins: [
    {Oban.Plugins.Cron,
     crontab: [
       {"0 2 * * *", Cgraph.Workers.CleanupWorker},  # Daily at 2 AM
       {"*/15 * * * *", Cgraph.Workers.StatsWorker},  # Every 15 min
     ]}
  ]
```

### 6. Voice Messages

**Recording & Upload (Mobile):**

```typescript
import { Audio } from 'expo-av';

// Start recording
const recording = new Audio.Recording();
await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
await recording.startAsync();

// Stop and upload
await recording.stopAndUnloadAsync();
const uri = recording.getURI();

const formData = new FormData();
formData.append('audio', {
  uri,
  type: 'audio/m4a',
  name: 'voice-message.m4a',
});

await api.post('/api/v1/voice-messages', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

**Backend Processing (FFmpeg):**

```elixir
defmodule Cgraph.Messaging.VoiceMessage do
  # Validate upload
  def validate_upload(%{path: path, content_type: content_type}) do
    cond do
      !File.exists?(path) -> {:error, :file_not_found}
      content_type not in @allowed_formats -> {:error, :unsupported_format}
      true -> :ok
    end
  end

  # Convert to standard format
  def process_audio(input_path, output_path) do
    System.cmd("ffmpeg", [
      "-i", input_path,
      "-codec:a", "libopus",
      "-b:a", "32k",
      output_path
    ])
  end
end
```

**Voice Message Data Flow:**

Voice messages follow a three-layer data normalization pattern to ensure consistent rendering across
platforms:

1. **Backend Storage**: File info stored in message fields (`file_url`, `file_name`, `file_size`,
   `file_mime_type`)
2. **JSON Serialization**: `message_json.ex` outputs data in multiple formats:
   - `metadata` object with `url`, `filename`, `size`, `mimeType`
   - Root-level `fileUrl`, `fileName`, `fileSize`, `fileMimeType`
   - `attachment` object with `url`, `filename`, `size`, `mime_type`
3. **Frontend Normalization**: `normalizeMessage()` extracts from any source:
   - Priority: `metadata.url` → `attachment.url` → `fileUrl`

**Rendering Decision (ConversationScreen.tsx):**

```typescript
{/* Voice messages render VoiceMessagePlayer if metadata.url exists */}
{(item.type === 'voice' || item.type === 'audio') && item.metadata?.url && (
  <VoiceMessagePlayer
    audioUrl={item.metadata.url}
    duration={item.metadata.duration || 0}
    waveformData={item.metadata.waveform}
    isSender={isOwnMessage}
  />
)}
{/* Text content only renders if no voice player rendered */}
{item.content && <Text>{item.content}</Text>}
```

---

## Data Flow & Communication

### Message Send Flow

```
1. User types message in UI
   │
   ├─> Client: Message component state update
   │
2. User clicks Send
   │
   ├─> Client: Validate message (length, content)
   │   ├─> If encrypted: Encrypt with AES-256-GCM
   │   └─> Build message payload
   │
3. WebSocket push to server
   │
   ├─> Phoenix Channel: handle_in("new_message")
   │   ├─> Verify user authorization
   │   ├─> Check rate limits
   │   └─> Create message in database
   │
4. Database write
   │
   ├─> Ecto inserts message
   │   ├─> Triggers update conversation.last_message_at
   │   ├─> Increments unread_count for recipients
   │   └─> Returns message with ID
   │
5. Broadcast to participants
   │
   ├─> Phoenix.PubSub broadcasts to all channel subscribers
   │   ├─> Connected clients receive instantly
   │   └─> Offline clients will sync on reconnect
   │
6. Push notification for offline users
   │
   └─> Oban enqueues notification job
       ├─> Expo Push (mobile)
       └─> Email (if configured)
```

### Presence Tracking Flow

```
1. User opens conversation
   │
   ├─> Client joins WebSocket channel
   │
2. Phoenix Channel: join callback
   │
   ├─> Presence.track(socket, user_id, metadata)
   │   ├─> CRDT merges presence state
   │   ├─> Broadcasts to all connected clients
   │   └─> No database write
   │
3. Client receives presence_state
   │
   ├─> UI updates online indicators
   │   ├─> Green dot for online users
   │   └─> Gray dot for offline
   │
4. User closes app/browser
   │
   ├─> WebSocket disconnects
   │
5. Phoenix detects disconnect
   │
   ├─> Presence automatically removes user
   │   ├─> Broadcasts presence_diff
   │   └─> All clients update UI
```

---

## Security Architecture

### Defense in Depth

**Layer 1: Network (Cloudflare)**

- DDoS protection with auto-mitigation
- WAF rules blocking common attacks (SQL injection, XSS)
- Rate limiting at edge (configurable per endpoint)
- Geographic restrictions (optional)
- SSL/TLS termination with modern cipher suites

**Layer 2: Application (Phoenix)**

- CORS policy restricts origins
- CSRF protection on state-changing requests
- Content Security Policy headers
- Rate limiting per user/IP (plug-based)
- Input sanitization and validation

**Layer 3: Authentication**

- Argon2 password hashing (time: 2, memory: 65536 KB, parallelism: 4)
- JWT tokens with short expiry (1 hour)
- Token rotation on refresh
- Token blacklist for immediate revocation
- Account lockout after 5 failed attempts (30 min)

**Layer 4: Authorization**

- Role-based access control (RBAC)
- Resource-level permissions
- Channel authorization before join
- Row-level security policies

**Layer 5: Data**

- End-to-end encryption for messages
- Encrypted database backups
- Secure credential storage (environment variables)
- Secrets rotation policy
- PII redaction in logs

### Threat Model

**Protected Against:**

- ✅ SQL Injection (Ecto parameterized queries)
- ✅ XSS (React auto-escaping, CSP headers)
- ✅ CSRF (SameSite cookies, token verification)
- ✅ Session hijacking (short-lived tokens, secure storage)
- ✅ Brute force (rate limiting, account lockout)
- ✅ Man-in-the-middle (E2EE, TLS)
- ✅ Replay attacks (nonce-based challenge-response)

**Known Limitations:**

- ⚠️ Client-side token storage (XSS can steal tokens)
  - Mitigation: Short expiry, HttpOnly cookies where possible
- ⚠️ Metadata visibility (who talks to whom, when)
  - Mitigation: Future anonymous routing
- ⚠️ Server can read unencrypted metadata
  - Mitigation: E2EE protects message content

---

## Scalability & Performance

### Current Capacity

**Single Node (4 vCPU, 8GB RAM):**

- 50,000+ concurrent WebSocket connections
- 1,000+ messages per second
- <50ms message delivery latency (same region)
- ~10,000 database queries per second

### Horizontal Scaling

**Stateless Application Layer:**

```
Load Balancer (Fly.io / Cloudflare)
           │
    ┌──────┼──────┐
    │      │      │
  Node1  Node2  Node3  (Auto-scale based on CPU/memory)
    │      │      │
    └──────┼──────┘
           │
     PostgreSQL
      (Primary)
```

**Phoenix PubSub with Redis:**

```elixir
config :cgraph, Cgraph.PubSub,
  adapter: Phoenix.PubSub.Redis,
  url: System.get_env("REDIS_URL")
```

All nodes share presence and broadcast state via Redis.

### Database Optimization

**Connection Pooling:**

```elixir
config :cgraph, Cgraph.Repo,
  pool_size: 20,  # Adjust based on load
  queue_target: 50,
  queue_interval: 1000
```

**Query Optimization:**

```elixir
# BAD: N+1 query
messages = Repo.all(Message)
Enum.map(messages, fn msg -> Repo.get(User, msg.sender_id) end)

# GOOD: Preload association
messages =
  Message
  |> preload(:sender)
  |> Repo.all()
```

**Indexes:**

```sql
CREATE INDEX idx_messages_conversation_timestamp
  ON messages(conversation_id, inserted_at DESC);

CREATE INDEX idx_messages_sender
  ON messages(sender_id);

CREATE INDEX idx_presence_conversation_user
  ON presence_logs(conversation_id, user_id);
```

### Caching Strategy

**Hot Data in Memory:**

```elixir
# User sessions (5 min TTL)
Cachex.fetch(:sessions, user_id, fn user_id ->
  {:commit, Accounts.get_user(user_id)}
end)

# Rate limit counters (1 min TTL)
Cachex.incr(:rate_limits, "#{ip}:#{endpoint}")

# Trending posts (15 min TTL)
Cachex.fetch(:trending, "forum:#{forum_id}", fn ->
  {:commit, Forums.get_trending_posts(forum_id)}
end)
```

**Cold Data in PostgreSQL:**

- Archived messages (>30 days)
- Deleted user data (soft delete)
- Audit logs

---

## Development Workflow

### Local Development

**Prerequisites:**

```bash
# Install asdf version manager (0.18+)
# Linux: download binary release
curl -fsSL https://github.com/asdf-vm/asdf/releases/download/v0.18.0/asdf-v0.18.0-linux-amd64.tar.gz | \
  tar xz -C ~/.local/bin
echo 'export PATH="$HOME/.local/bin:$HOME/.asdf/shims:$PATH"' >> ~/.bashrc
source ~/.bashrc

# macOS: use Homebrew
# brew install asdf
# echo 'export PATH="$(brew --prefix)/opt/asdf/libexec/bin:$HOME/.asdf/shims:$PATH"' >> ~/.zshrc

# Install runtimes
asdf plugin add erlang
asdf plugin add elixir
asdf plugin add nodejs

asdf install erlang 28.3
asdf install elixir 1.19.4-otp-28
asdf install nodejs 22.11.0

# Install pnpm
npm install -g pnpm
```

**Start Development Environment:**

```bash
# Terminal 1: Backend
cd apps/backend
mix deps.get
mix ecto.setup
mix phx.server

# Terminal 2: Web
cd apps/web
pnpm install
pnpm dev

# Terminal 3: Mobile
cd apps/mobile
pnpm install
pnpm start
```

### Testing Strategy

**Backend Tests (585+ tests):**

```bash
# Run all tests
mix test

# Run with coverage
mix test --cover

# Run specific test
mix test test/cgraph/messaging_test.exs:42

# Run tests matching tag
mix test --only integration
```

**Frontend Tests:**

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build validation
pnpm build
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature

# CI runs:
# - Backend tests
# - Frontend type checking
# - Linting
# - Build validation

# After approval, merge to main
# - Auto-deploy to staging
# - Manual deploy to production
```

### Database Migrations

```bash
# Create migration
mix ecto.gen.migration add_field_to_users

# Edit migration file
defmodule Cgraph.Repo.Migrations.AddFieldToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :new_field, :string
    end
  end
end

# Run migration
mix ecto.migrate

# Rollback if needed
mix ecto.rollback
```

---

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates valid
- [ ] Monitoring dashboards live
- [ ] Error tracking configured (Sentry)
- [ ] Backup strategy in place
- [ ] Load testing completed
- [ ] Rollback plan documented

### Fly.io Deployment

```bash
# Deploy backend
fly deploy

# Scale to 3 machines
fly scale count 3

# Check status
fly status

# View logs
fly logs

# Run migrations
fly ssh console -C "/app/bin/cgraph eval 'CGraph.Release.migrate()'"
```

### Monitoring

**Key Metrics:**

- Request latency (p50, p95, p99)
- WebSocket connection count
- Database query performance
- Memory usage per node
- Error rate
- Message throughput

**Alerts:**

- Error rate > 1%
- Response time > 500ms
- Memory usage > 80%
- Database connections > 90% pool

---

## Further Reading

- [API Reference](../api/API.md) - Complete API documentation
- [Deployment Guide](../guides/DEPLOYMENT.md) - Production deployment
- [Security Guide](../guides/SECURITY_HARDENING.md) - Security best practices
- [Database Guide](./DATABASE.md) - Schema and query patterns
- [Operations Guide](../guides/OPERATIONS.md) - Monitoring and maintenance

---

_Last updated: January 4, 2026_  
_For questions or corrections, please open an issue or PR._
