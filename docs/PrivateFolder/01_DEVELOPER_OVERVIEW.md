# CGraph Developer Overview

This document explains everything you need to know about CGraph from scratch. Written for the solo developer who built this thing and might forget how it all works six months from now.

---

## What Is CGraph?

CGraph is a real-time communication platform combining:

- **Direct messaging** (like Discord DMs)
- **Group chat** (like Discord servers with channels)
- **Community forums** (like Reddit with voting)
- **Mobile apps** (iOS and Android via React Native)

Think of it as Discord meets Reddit, built to be self-hosted or run as a SaaS.

---

## The Tech Stack (What We Actually Use)

### Backend (The Brain)

**Language:** Elixir  
**Framework:** Phoenix 1.7.21  
**Database:** PostgreSQL 15+ (via Neon in production)  
**Real-time:** Phoenix Channels (WebSockets)  
**Background Jobs:** Oban  
**Auth:** Guardian (JWT tokens)  
**Password Hashing:** Argon2  

Why Elixir? Because it handles concurrent connections like a champ. A single server can handle 2 million+ WebSocket connections. That means cheap infrastructure for real-time features.

### Web Frontend

**Language:** TypeScript  
**Framework:** React 18  
**Build Tool:** Vite 5  
**Styling:** Tailwind CSS  
**State Management:** Zustand  
**Routing:** React Router v6  
**Real-time:** Phoenix Channels client  

### Mobile Apps

**Language:** TypeScript  
**Framework:** React Native 0.73  
**Tooling:** Expo 50  
**Navigation:** React Navigation  
**Real-time:** Same Phoenix Channels client  

### Infrastructure

**Container:** Docker + docker-compose  
**Hosting:** Fly.io (backend + Postgres)  
**CDN/Storage:** Cloudflare R2  
**Email:** Resend  
**Push Notifications:** Expo Push Service  

---

## Project Structure

```
CGraph/
├── apps/
│   ├── backend/           # Elixir/Phoenix API server
│   │   ├── lib/
│   │   │   ├── cgraph/    # Business logic (contexts)
│   │   │   └── cgraph_web/# HTTP/WebSocket layer
│   │   ├── priv/
│   │   │   └── repo/migrations/
│   │   └── config/
│   │
│   ├── web/               # React web app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── stores/    # Zustand state
│   │   │   └── lib/       # API client, utils
│   │   └── public/
│   │
│   └── mobile/            # React Native app
│       └── src/
│           ├── components/
│           ├── screens/
│           ├── navigation/
│           └── lib/
│
├── packages/              # Shared code (monorepo)
│   ├── shared-types/      # TypeScript interfaces
│   ├── ui/               # Shared UI components
│   ├── utils/            # Common utilities
│   └── config/           # Shared config
│
├── infrastructure/
│   ├── docker/           # Dockerfiles
│   ├── fly/              # Fly.io configs
│   ├── terraform/        # IaC (optional)
│   └── scripts/          # Helper scripts
│
└── docs/                 # Documentation
```

---

## How Everything Connects

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENTS                               │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐         │
│  │  Web App   │    │ Mobile iOS │    │Mobile Droid│         │
│  │  (React)   │    │   (Expo)   │    │   (Expo)   │         │
│  └─────┬──────┘    └─────┬──────┘    └─────┬──────┘         │
└────────┼─────────────────┼─────────────────┼─────────────────┘
         │                 │                 │
         │    HTTPS/WSS    │                 │
         └────────┬────────┴────────┬────────┘
                  │                 │
                  ▼                 ▼
         ┌────────────────────────────────────┐
         │        Phoenix Backend             │
         │  ┌──────────┐  ┌──────────┐       │
         │  │ REST API │  │ Channels │       │
         │  │ (HTTPS)  │  │  (WSS)   │       │
         │  └────┬─────┘  └────┬─────┘       │
         │       │             │              │
         │       └──────┬──────┘              │
         │              ▼                     │
         │      ┌──────────────┐             │
         │      │   Contexts   │             │
         │      │ (Biz Logic)  │             │
         │      └──────┬───────┘             │
         │             │                      │
         │  ┌──────────┴──────────┐          │
         │  ▼          ▼          ▼          │
         │ ┌────┐   ┌─────┐   ┌──────┐      │
         │ │ DB │   │Oban │   │ R2/  │      │
         │ │    │   │Jobs │   │ S3   │      │
         │ └────┘   └─────┘   └──────┘      │
         └────────────────────────────────────┘
```

1. **User opens app** → Connects to backend
2. **Login/Register** → REST API → JWT token returned
3. **Real-time features** → WebSocket connects with JWT
4. **Message sent** → WebSocket → Broadcast to room
5. **Background work** → Oban queues jobs (emails, push, etc.)

---

## The Database Schema (Simplified)

### Core Tables

```sql
-- Users (the humans)
users
  ├── id (UUID, primary key)
  ├── email (unique)
  ├── username (unique, optional at signup)
  ├── user_id (integer, unique, auto-generated like #1234)
  ├── password_hash (Argon2)
  ├── display_name
  ├── avatar_url
  ├── status (online/idle/dnd/offline)
  └── inserted_at, updated_at

-- Direct Messages
conversations
  ├── id
  ├── type (direct/group)
  └── participants (join table)

messages
  ├── id
  ├── conversation_id
  ├── sender_id
  ├── content
  ├── encrypted_content (for E2E)
  └── inserted_at

-- Groups (Discord-like servers)
groups
  ├── id
  ├── name
  ├── owner_id
  └── icon_url

channels (inside groups)
  ├── id
  ├── group_id
  ├── name
  └── type (text/voice/announcement)

-- Forums (Reddit-like communities)
forums
  ├── id
  ├── name
  ├── slug
  ├── owner_id
  └── is_public

posts
  ├── id
  ├── forum_id
  ├── author_id
  ├── title
  ├── content
  ├── score (upvotes - downvotes)
  └── post_type (text/link/image)

comments (threaded)
  ├── id
  ├── post_id
  ├── parent_id (for nesting)
  ├── author_id
  └── content
```

### Key Relationships

- Users have many conversations (through participants)
- Groups have many channels
- Forums have many posts
- Posts have many comments (nested via parent_id)
- Everything uses UUIDs except user_id (sequential integer for display)

---

## Authentication Flow

### Registration

```
1. User submits email + password
2. Backend creates user with:
   - Hashed password (Argon2)
   - Auto-generated user_id (#1, #2, etc.)
   - Email verification token (optional)
3. JWT access token returned
4. Frontend stores token, redirects to app
```

### Login

```
1. User submits email + password
2. Backend verifies credentials
3. Returns JWT (24h expiry) + refresh token (7d)
4. Frontend stores both, uses access token for API calls
5. On 401, uses refresh token to get new access token
```

### WebSocket Auth

```
1. Client connects with token in params
2. UserSocket.connect/3 validates JWT
3. If valid, socket assigned user_id
4. User can join channels they're authorized for
```

### JWT Structure

```json
{
  "sub": "user-uuid-here",
  "exp": 1735689600,
  "iat": 1735603200,
  "typ": "access"
}
```

---

## Real-Time System (Phoenix Channels)

### How It Works

Phoenix Channels give you WebSocket abstraction with:
- Topics (rooms like `conversation:123`)
- Events (like `new_message`, `typing`)
- Presence (who's online)

### Channel Topics We Use

```elixir
"conversation:#{conversation_id}"  # DMs and group chats
"group:#{group_id}"                # Group-wide events
"channel:#{channel_id}"            # Channel messages
"user:#{user_id}"                  # User-specific events
"forum:#{forum_id}"                # Forum updates
```

### Message Flow

```
1. User A types message, hits send
2. Frontend: socket.push("new_message", {content: "..."})
3. Backend: ConversationChannel.handle_in("new_message", ...)
4. Backend saves to DB
5. Backend broadcasts to all users in topic
6. Other clients receive via socket.on("new_message", ...)
```

### Presence Tracking

```elixir
# When user joins channel
Presence.track(socket, user_id, %{
  online_at: System.system_time(:second),
  status: "online"
})

# Frontend gets presence list
socket.presences  # => %{"user-123" => %{...}}
```

---

## Background Jobs (Oban)

### Why Oban?

- Jobs survive server restarts (stored in Postgres)
- Automatic retries with exponential backoff
- Job scheduling (run at specific time)
- Unique jobs (prevent duplicates)
- Telemetry for monitoring

### Queues We Use

```elixir
config :cgraph, Oban,
  queues: [
    default: 10,        # General tasks
    mailers: 5,         # Email sending
    notifications: 20,  # Push notifications
    backups: 1          # Database backups
  ]
```

### Example Worker

```elixir
defmodule Cgraph.Workers.SendPushNotification do
  use Oban.Worker, queue: :notifications
  
  @impl true
  def perform(%{args: %{"user_id" => user_id, "message" => msg}}) do
    # Send push via Expo
    case Notifications.send_push(user_id, msg) do
      :ok -> :ok
      {:error, reason} -> {:error, reason}  # Oban retries
    end
  end
end

# Enqueue it
%{user_id: "123", message: "Hello!"}
|> Cgraph.Workers.SendPushNotification.new()
|> Oban.insert()
```

---

## API Structure

### Base URL
- Dev: `http://localhost:4000/api/v1`
- Prod: `https://api.cgraph.io/api/v1`

### Common Endpoints

```
# Auth
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
DELETE /auth/logout

# Users
GET    /me                 # Current user
PUT    /me                 # Update profile
PUT    /me/username        # Change username (14-day cooldown)
GET    /users/:id          # Get user profile

# Friends
GET    /friends
POST   /friends            # Send request
POST   /friends/:id/accept
DELETE /friends/:id

# Conversations
GET    /conversations
POST   /conversations
GET    /conversations/:id/messages
POST   /conversations/:id/messages

# Groups
GET    /groups
POST   /groups
GET    /groups/:id
GET    /groups/:id/channels

# Forums
GET    /forums
POST   /forums
GET    /forums/:slug/posts
POST   /forums/:slug/posts
```

### Response Format

```json
{
  "data": { ... },
  "meta": { "page": 1, "total": 100 }
}
```

### Error Format

```json
{
  "error": {
    "code": "validation_error",
    "message": "Username is already taken",
    "details": { "field": "username" }
  }
}
```

---

## State Management (Frontend)

### Zustand Stores

```typescript
// stores/authStore.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: async (email, password) => { ... },
  logout: () => set({ user: null, token: null }),
}));

// stores/messageStore.ts
export const useMessageStore = create<MessageState>((set) => ({
  conversations: [],
  messages: {},
  fetchConversations: async () => { ... },
  sendMessage: async (conversationId, content) => { ... },
}));
```

### Store List

- `authStore` - User auth state
- `messageStore` - Conversations and messages
- `friendStore` - Friend list and requests
- `groupStore` - Groups and channels
- `forumStore` - Forums and posts
- `notificationStore` - Notifications
- `searchStore` - Search state

---

## Security Measures

### What's Implemented

1. **Password Security**
   - Argon2 hashing (memory-hard, GPU-resistant)
   - Minimum 8 characters enforced

2. **Rate Limiting**
   - Per-IP and per-user limits
   - Different limits for different endpoints
   - Sliding window algorithm

3. **JWT Security**
   - Short-lived access tokens (24h)
   - Refresh tokens for renewal
   - Token invalidation on logout

4. **Input Validation**
   - Ecto changesets for all data
   - HTML sanitization for user content
   - SQL injection prevention (Ecto parameterized queries)

5. **CORS**
   - Restricted to known origins in production

6. **Headers**
   - HSTS enforced
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff

---

## Testing

### Backend (Elixir)

```bash
cd apps/backend
mix test              # Run all tests
mix test --trace      # Verbose output
mix test test/cgraph/messaging_test.exs  # Single file
```

Current: **220 tests, 0 failures**

### Web (React)

```bash
cd apps/web
pnpm test            # Jest tests
pnpm test:coverage   # With coverage
```

### Mobile (React Native)

```bash
cd apps/mobile
pnpm test
```

### Type Checking

```bash
# Web
cd apps/web && npx tsc --noEmit

# Mobile
cd apps/mobile && npx tsc --noEmit
```

---

## Common Development Tasks

### Adding a New API Endpoint

1. Create controller in `lib/cgraph_web/controllers/api/v1/`
2. Add JSON view in same folder
3. Add route in `lib/cgraph_web/router.ex`
4. Write tests in `test/cgraph_web/controllers/`

### Adding a Database Table

1. Generate migration:
   ```bash
   cd apps/backend
   mix ecto.gen.migration create_things
   ```
2. Edit migration file
3. Run: `mix ecto.migrate`
4. Create schema in `lib/cgraph/`
5. Create context with CRUD functions

### Adding a Background Job

1. Create worker in `lib/cgraph/workers/`
2. Implement `perform/1` function
3. Enqueue with `Oban.insert()`

### Adding a WebSocket Event

1. Add handler in appropriate channel
2. Implement `handle_in` for incoming
3. Use `broadcast` for outgoing
4. Update frontend socket handlers

---

## Environment Variables

### Required for Production

```bash
# Database
DATABASE_URL=postgres://user:pass@host/cgraph

# Security
SECRET_KEY_BASE=64-char-random-string
JWT_SECRET=another-random-string

# External Services
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ACCOUNT_ID=...
RESEND_API_KEY=...
EXPO_ACCESS_TOKEN=...

# Optional
SENTRY_DSN=...
STRIPE_SECRET_KEY=...
```

### Development Defaults

Most things work without env vars in dev. Check `.env.example` for the full list.

---

## Deployment

### Fly.io (Recommended)

```bash
# Deploy backend
cd infrastructure/fly
fly deploy -c fly.toml

# Deploy web (separate app)
fly deploy -c fly.web.toml
```

### Docker (Self-hosted)

```bash
docker-compose -f docker-compose.yml up -d
```

### Database Migrations in Production

```bash
# On Fly.io
fly ssh console -C "bin/cgraph eval 'Cgraph.Release.migrate()'"
```

---

## Troubleshooting

### "Connection refused" to database
- Check DATABASE_URL is set
- Verify Postgres is running
- Check firewall/security groups

### WebSocket won't connect
- Verify JWT token is valid
- Check CORS settings
- Look for SSL issues (use wss:// in prod)

### Oban jobs not running
- Check Oban migration was run
- Verify queue is configured
- Look at `oban_jobs` table for errors

### Mobile app can't reach API
- Check API_URL in mobile config
- Verify network connectivity
- ngrok for local development

---

## Performance Tips

### Database
- Add indexes for frequently queried columns
- Use EXPLAIN ANALYZE for slow queries
- Consider read replicas at scale

### Backend
- Phoenix can handle millions of connections
- Tune connection pool based on CPU cores
- Use Oban for anything that can be async

### Frontend
- Lazy load routes
- Memoize expensive components
- Virtual scrolling for long lists

---

## What's Next?

Refer to `ROADMAP.md` and issues for planned features. The architecture is designed to scale, so focus on stability before adding complexity.

When in doubt, check the other docs in this folder or the public `docs/` directory.

---

*Last updated: December 31, 2025*
