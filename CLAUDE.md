# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

CGraph is an enterprise messaging platform combining real-time chat, community forums, and
decentralized identity. Features include Signal Protocol encryption (X3DH + AES-256-GCM), Ethereum
wallet authentication, voice/video calls, and a karma-based forum system.

**Version**: 0.9.3  
**Last Updated**: January 2026

## Key Features

- **End-to-End Encryption**: Signal Protocol (X3DH + Double Ratchet) with AES-256-GCM
- **Multi-Auth Support**: Email/password, OAuth (Google, Apple, Facebook), Ethereum wallet
- **Real-time Messaging**: Phoenix Channels with WebSocket, presence tracking
- **Forums & Groups**: Reddit-style karma, Discord-style servers with channels
- **Gamification**: Achievements, leaderboards, XP system
- **Push Notifications**: Expo (mobile), Web Push API (browser), email digests
- **Premium Tiers**: free (5 forums/groups), starter (10), pro (50), business (unlimited)

## Common Commands

### Monorepo (from root)

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Run all apps in dev mode
pnpm build                # Build all packages
pnpm test                 # Run all tests
pnpm lint                 # Lint all packages
pnpm typecheck            # Type-check all packages
pnpm web                  # Run only web app
pnpm mobile               # Run only mobile app
```

### Web App (apps/web)

```bash
pnpm dev                  # Start Vite dev server (localhost:3000)
pnpm build                # Build for production
pnpm test                 # Run vitest in watch mode
pnpm test -- --run        # Run tests once (no watch)
pnpm test -- path/file    # Run single test file
pnpm typecheck            # TypeScript check
pnpm storybook            # Component dev (localhost:6006)
```

### Mobile App (apps/mobile)

```bash
pnpm start                # Start Expo
pnpm android              # Run on Android
pnpm ios                  # Run on iOS
pnpm test                 # Run jest
pnpm typecheck            # TypeScript check
```

### Backend (apps/backend)

```bash
mix deps.get              # Install dependencies
mix ecto.setup            # Create DB + migrate + seed
mix ecto.migrate          # Run migrations
mix ecto.rollback         # Rollback last migration
mix phx.server            # Start server (localhost:4000)
mix test                  # Run all tests
mix test path/file.exs    # Run single test file
mix test --only tag       # Run tests with specific tag
mix credo                 # Static analysis
mix dialyzer              # Type checking
mix sobelow               # Security scan
```

### Fly.io Deployment (Production)

```bash
# Authentication
fly auth login            # Login to Fly.io

# Deployment (from apps/backend/)
fly deploy                # Deploy latest changes
fly deploy --build-only   # Build without deploying
fly status                # Check app status

# Logs & Debugging
fly logs                  # Stream live logs
fly logs --no-tail        # Recent logs only
fly ssh console           # SSH into running machine

# Machine Management
fly machine list          # List all machines
fly machine restart       # Restart all machines
fly scale count 2         # Scale to 2 machines

# Secrets Management
fly secrets list          # List all secrets
fly secrets set KEY=value # Set a secret
fly secrets unset KEY     # Remove a secret

# Database Migrations (via fly release command)
fly ssh console -C "/app/bin/cgraph eval 'CGraph.Release.migrate()'"
```

## Architecture

### Monorepo Structure

- **apps/web** - React 19 + Vite + Tailwind web application
- **apps/mobile** - React Native 0.81 + Expo 54 mobile app
- **apps/backend** - Elixir/Phoenix 1.8 API server
- **packages/shared-types** - TypeScript types shared between web/mobile
- **packages/ui** - Shared UI components
- **packages/utils** - Common utilities

Uses pnpm workspaces with Turborepo for task orchestration.

### Frontend State Management (Web)

Zustand stores in `apps/web/src/stores/`:

- `authStore.ts` - Authentication, user session, wallet connection
- `chatStore.ts` - Messages, conversations, WebSocket state
- `friendStore.ts` - Friend list, requests, presence
- `forumStore.ts` - Forum posts, comments, voting
- `groupStore.ts` - Servers, channels, members
- `gamificationStore.ts` - Karma, achievements, leaderboards

### Frontend Key Libraries

- **Phoenix channels** (`src/lib/socket.ts`) for real-time WebSocket communication
- **Framer Motion** for animations throughout the UI
- **React Query** for server state caching
- **Wagmi/Viem** for Ethereum wallet integration
- Path alias: `@/*` maps to `src/*`

### Backend Modules (apps/backend/lib/cgraph/)

Core business logic organized by domain:

- `accounts.ex` - User management, authentication, sessions
- `messaging.ex` - DMs, conversations, message handling
- `forums.ex` - Posts, comments, voting, karma
- `groups.ex` - Servers, channels, roles, permissions
- `presence.ex` - Online status, typing indicators
- `crypto.ex` / `encryption.ex` - E2E encryption primitives
- `moderation.ex` - Content moderation, reports
- `search.ex` - Full-text search across entities

### Backend Web Layer (apps/backend/lib/cgraph_web/)

- `router.ex` - All API routes under `/api/v1`
- `controllers/` - REST endpoints
- `channels/` - Phoenix channels for real-time features
- `plugs/` - Authentication, rate limiting, CORS

### Real-time Communication

- Phoenix PubSub for server-side event broadcasting
- WebSocket channels: `user:*`, `conversation:*`, `group:*`, `forum:*`
- Presence tracking for online status across devices

### Caching Architecture

Multi-tier caching system in `lib/cgraph/cache.ex`:

- **L1**: Process-local ETS (microseconds)
- **L2**: Shared Cachex (milliseconds)
- **L3**: Redis for distributed caching (low milliseconds)

### Circuit Breaker

Fault tolerance via `:fuse` library in `lib/cgraph/circuit_breaker.ex`:

- Automatic service isolation on failures
- Configurable thresholds and recovery

### Database

PostgreSQL with Ecto. Migrations in `apps/backend/priv/repo/migrations/`. Uses ULID for IDs,
supports full-text search.

## Code Conventions

### TypeScript (Web/Mobile)

- Strict mode enabled
- React function components with hooks
- Zustand for global state, React Query for server state
- TailwindCSS with custom design tokens in `index.css`

### Elixir (Backend)

- Contexts pattern (Accounts, Messaging, Forums, Groups)
- Guardian for JWT authentication
- Oban for background jobs
- Module naming: `CGraph.*` (capital G) and `CGraphWeb.*`

### API

- REST endpoints at `/api/v1/*`
- JWT tokens in Authorization header
- Wallet auth via challenge/signature flow at `/api/v1/auth/wallet/*`
- Push token registration at `/api/v1/push-tokens`

### Cache API

```elixir
# Get/Set with TTL
Cache.set("user:123", user_data, ttl: :timer.minutes(5))
Cache.put("user:123", user_data, :timer.minutes(5))  # Alias for set
{:ok, user} = Cache.get("user:123")

# Fetch with fallback
user = Cache.fetch("user:123", fn -> Repo.get(User, 123) end)
```

### Email API

```elixir
# Template-based emails for users
Mailer.deliver_email(user, :welcome)
Mailer.deliver_email(user, :notification, %{title: "New Message"})

# Raw email data for system emails
Mailer.send_email(%{
  to: "user@example.com",
  subject: "Your digest",
  template: "forum_digest",
  assigns: %{user_name: "John", items: [...]}
})
```

## Environment Setup

Required:

- Node.js 22+, pnpm 10+
- Elixir 1.17+, Erlang/OTP 28+
- PostgreSQL 16+
- Redis (for caching/rate limiting)

Copy `.env.example` to `.env` in `apps/backend/` and configure database credentials and secrets.

## Recent Updates (v0.9.0)

### Backend Fixes

- Added `Cache.put/3` for API compatibility with repositories
- Added `Mailer.send_email/1` for raw email data (digest emails)
- Added `User.changeset/2` generic changeset function
- Added `:fuse` dependency for circuit breaker support
- Standardized module naming: `CGraph.*` and `CGraphWeb.*`

### Frontend Fixes

- Added `"type": "module"` to root package.json for ESLint
- Updated tier limits: free=5, starter=10, pro=50, business=unlimited
- Added `maxForums` to TIER_FEATURES matching backend
- Implemented web push notification toggle with service worker

### Mobile Fixes

- Implemented push notification service with Expo
- Added `usePushNotifications` hook for auto-registration
- Integrated SettingsProvider in App.tsx

## Production Infrastructure (v0.9.3)

### Fly.io Backend

- **App Name**: `cgraph-backend`
- **Region**: Frankfurt (fra)
- **URL**: https://cgraph-backend.fly.dev
- **Resources**: 1 shared CPU, 512MB RAM
- **Auto-scaling**: auto_stop_machines enabled, min_machines_running: 0

### Supabase Database

- **Project**: Europe region
- **Connection**: Direct PostgreSQL on port 5432
- **SSL**: Required (DATABASE_SSL=true)

### Key Configuration Files

- `apps/backend/fly.toml` - Fly.io deployment configuration
- `apps/backend/Dockerfile` - Multi-stage build (hexpm/elixir:1.17.3-erlang-27.1.2-alpine-3.20.3)
- `apps/backend/config/runtime.exs` - Runtime configuration for production

### Production Endpoints

- `/health` - Basic health check (returns version, status)
- `/ready` - Readiness check (database, cache, redis status)

### Environment Variables (Fly.io Secrets)

```
DATABASE_URL     - Ecto connection URL to Supabase
DATABASE_SSL     - true
SECRET_KEY_BASE  - Phoenix secret (generate with: mix phx.gen.secret)
JWT_SECRET       - Guardian JWT signing key
ENCRYPTION_KEY   - For sensitive data encryption
PHX_HOST         - api.cgraph.org (or cgraph-backend.fly.dev)
REDIS_URL        - Optional: Upstash Redis URL for distributed rate limiting
```

### Deployment Notes

- Redis is optional - rate limiting disabled when not configured
- Fly.io handles SSL termination (no force_ssl in Phoenix)
- Uses IPv4 socket option for DNS compatibility
- CleanupWorker runs daily via Oban cron
