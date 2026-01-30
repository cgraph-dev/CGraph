# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

> **MANDATORY**: Before writing ANY code, read `docs/CODE_SIMPLIFICATION_GUIDELINES.md`. All code
> must follow industry best practices (Google, Meta, Telegram, Discord standards). No exceptions.

## Technology-Specific Guidelines

The guidelines document (v4.0) includes CGraph-specific patterns for:

| Technology          | Section         | Key Patterns                                      |
| ------------------- | --------------- | ------------------------------------------------- |
| **Oban**            | Background Jobs | Queue config, unique constraints, error handling  |
| **Stripe**          | Payments        | Webhook handling, idempotency, tier management    |
| **Signal Protocol** | E2EE            | X3DH, Double Ratchet, prekey bundles              |
| **WebRTC**          | Voice/Video     | Peer connections, ICE servers, quality monitoring |
| **React 19**        | Frontend        | `use()`, `useFormStatus`, `useOptimistic`         |
| **Expo 54**         | Mobile          | Push notifications, deep linking, offline support |
| **Phoenix 1.8**     | Backend         | Verified routes, socket handling, LiveView        |
| **Fly.io**          | Deployment      | Health checks, secrets, multi-region              |

See `docs/CODE_SIMPLIFICATION_GUIDELINES.md` Part 8-9 for implementation details.

## Industry Standards We Follow

| Company      | Users | Tech Stack       | What We Adopted                                                         |
| ------------ | ----- | ---------------- | ----------------------------------------------------------------------- |
| **Google**   | 4B+   | Various          | SRE (SLO/SLI/Error Budgets), TypeScript Style Guide, structured logging |
| **Meta**     | 3.4B  | PHP, C++         | TAO caching, multi-region architecture, request coalescing              |
| **Telegram** | 1B+   | C++, custom      | Event-driven architecture, minimal payloads, lean engineering           |
| **Discord**  | 200M+ | **Elixir**, Rust | Gateway sharding, Rust NIFs, session resumption, lazy presence          |

> **Discord** uses the same stack as CGraph (Elixir/Phoenix). Their patterns are directly
> applicable.

## Project Overview

CGraph is a **proprietary** enterprise messaging platform combining real-time chat, community
forums, and gamification. Features include Signal Protocol encryption (X3DH + Double Ratchet with
AES-256-GCM), OAuth authentication (Google, Apple, Facebook), voice/video calls, and a karma-based
forum system.

**Version**: 0.9.8  
**Last Updated**: January 2026  
**License**: Proprietary (see LICENSE)

## Key Features

- **End-to-End Encryption**: Signal Protocol (X3DH + Double Ratchet) with AES-256-GCM
- **Multi-Auth Support**: Email/password, OAuth (Google, Apple, Facebook, TikTok)
- **Real-time Messaging**: Phoenix Channels with WebSocket, presence tracking
- **Forums & Groups**: Reddit-style karma, Discord-style servers with channels
- **Gamification**: Achievements, leaderboards, XP system, seasonal events
- **Push Notifications**: Expo (mobile), Web Push API (browser), email digests
- **Subscription Tiers**: free (5), starter (10), pro (50), business (unlimited), enterprise
- **Payments**: Stripe integration for subscription management

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

### Multi-App Architecture (Discord-Style)

CGraph uses a **Discord-style dual-app architecture** for separation of concerns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION DEPLOYMENT                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   cgraph.org                              app.cgraph.org                     │
│   ┌──────────────────┐                   ┌──────────────────────────────┐   │
│   │   LANDING APP    │                   │         WEB APP              │   │
│   │   (apps/landing) │                   │       (apps/web)             │   │
│   │                  │                   │                              │   │
│   │  • Marketing     │    Login/         │  • Authenticated users only  │   │
│   │  • Features      │    Register       │  • Messages, Groups, Forums  │   │
│   │  • Pricing       │  ─────────────►   │  • Settings, Profile         │   │
│   │  • Legal pages   │                   │  • Voice/Video calls         │   │
│   │  • Company info  │                   │  • All app functionality     │   │
│   └──────────────────┘                   └──────────────────────────────┘   │
│           │                                           │                      │
│           │ Unauthenticated users                     │ Authenticated users  │
│           ▼                                           ▼                      │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │                       BACKEND API                                  │     │
│   │                   api.cgraph.org (Fly.io)                         │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why this architecture?**

- **Like Discord**: `discord.com` (landing) vs `app.discord.com` (authenticated app)
- **Performance**: Landing page is lightweight, app loads full functionality
- **SEO**: Landing app optimized for search engines
- **Security**: Authenticated app doesn't expose unnecessary endpoints
- **Caching**: Landing can be aggressively cached, app is dynamic

### Landing App (`apps/landing`)

Marketing and public-facing content:

```
apps/landing/
├── src/
│   ├── pages/
│   │   ├── LandingPage.tsx        # Main marketing page (GSAP animations)
│   │   ├── auth/                  # Login, Register, ForgotPassword
│   │   ├── legal/                 # Privacy, Terms, Cookies, GDPR
│   │   └── company/               # About, Careers, Contact, Press
│   └── main.tsx                   # Router with all routes
├── package.json
└── vite.config.ts
```

**Routes**:

- `/` - Marketing landing page with features, pricing, testimonials
- `/login`, `/register`, `/forgot-password` - Authentication flows
- `/privacy`, `/terms`, `/cookies`, `/gdpr` - Legal pages
- `/about`, `/careers`, `/contact`, `/press` - Company pages

### Web App (`apps/web`)

Full application for authenticated users:

```
apps/web/
├── src/
│   ├── pages/
│   │   ├── messages/              # Direct messages
│   │   ├── groups/                # Discord-style servers
│   │   ├── forums/                # Reddit-style forums
│   │   ├── settings/              # User settings
│   │   └── LandingPage.tsx        # Fallback for unauthenticated
│   ├── stores/                    # Zustand state management
│   ├── components/                # Shared components
│   └── App.tsx                    # Main router
├── package.json
└── vite.config.ts
```

**Route behavior** (Discord-style):

- Authenticated users visiting `/` → Redirected to `/messages`
- Unauthenticated users visiting `/` → See landing page (or redirect to landing app)
- All protected routes require authentication

### Local Development

```bash
# Terminal 1: Landing app (port 5174)
cd apps/landing && pnpm dev

# Terminal 2: Web app (port 5173)
cd apps/web && pnpm dev

# Terminal 3: Backend API (port 4000)
cd apps/backend && mix phx.server
```

### Vercel Deployment (Two Projects)

**Project 1: Landing (cgraph.org)**

```json
{
  "name": "cgraph-landing",
  "rootDirectory": "apps/landing",
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist"
}
```

**Project 2: Web App (app.cgraph.org)**

```json
{
  "name": "cgraph-web",
  "rootDirectory": "apps/web",
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist"
}
```

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
- `crypto/` - E2EE key management (X3DH, prekeys, identity keys)
- `moderation.ex` - Content moderation, reports
- `search.ex` - Full-text search across entities
- `gamification.ex` - XP, achievements, quests, leaderboards
- `subscriptions/` - Stripe payment integration
- `referrals.ex` - Referral codes, rewards, tracking
- `rate_limiter/` - Distributed rate limiting with Redis

### Backend Web Layer (apps/backend/lib/cgraph_web/)

- `router.ex` - All API routes under `/api/v1`
- `controllers/` - REST endpoints (85+ controllers)
- `channels/` - Phoenix channels for real-time features
- `plugs/` - Authentication, rate limiting, CORS, security headers

### Key Plugs (Middleware)

- `RateLimiterV2` - Distributed rate limiting (standard, strict, relaxed, burst tiers)
- `CookieAuth` - HTTP-only cookie JWT extraction (XSS-safe)
- `AuthPipeline` - Guardian JWT verification
- `SecurityHeaders` - HSTS, CSP, X-Frame-Options, etc.
- `CurrentUser` - Load authenticated user into conn

### Real-time Communication

- Phoenix PubSub for server-side event broadcasting
- WebSocket channels: `user:*`, `conversation:*`, `group:*`, `forum:*`, `presence:*`, `call:*`
- Presence tracking for online status across devices
- Per-user channels for notifications and contact presence updates

### Security Architecture

- **Authentication**: Guardian JWT with JTI revocation, HTTP-only cookies
- **Rate Limiting**: Redis-backed distributed limiter with trusted proxy enforcement
- **E2EE**: Server stores only public keys; encryption/decryption client-side
- **Upload Security**: Magic byte MIME sniffing, content-type verification
- **IP Protection**: Only trusts X-Forwarded-For from Cloudflare/private CIDRs

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

## Code Quality Standards (MANDATORY)

**IMPORTANT**: All agents and developers MUST follow the guidelines in
`docs/CODE_SIMPLIFICATION_GUIDELINES.md`.

### Google TypeScript Naming (Mandatory)

```
PascalCase:     Classes, Interfaces, Types, Enums, React Components
camelCase:      Variables, functions, methods, properties
CONSTANT_CASE:  True constants (MAX_SIZE, API_URL)
kebab-case:     File names (user-service.ts, api-utils.ts)
```

### Quick Rules - NEVER Do These

1. **No nested ternaries** - Max one `?` per expression
2. **No duplicate code** - If copying, extract to a function
3. **No functions inside components** - Pure functions go at module level
4. **No switch for simple mappings** - Use `Record<K, V>` objects instead
5. **No magic numbers/strings** - Use named constants
6. **No `any` type** - Use `unknown` with type guards
7. **No deeply nested if/else** - Use early returns
8. **No type assertions** - Use type guards instead of `as`
9. **No offset pagination** - Use cursor-based pagination
10. **No N+1 queries** - Always preload associations

### Quick Rules - ALWAYS Do These

1. **Use descriptive names** - `getUserById` not `get`, `isLoading` not `l`
2. **Extract conditional logic** - Named functions are self-documenting
3. **Use type guards** - `function isUser(x): x is User { ... }`
4. **Handle errors explicitly** - Never silently fail
5. **Keep functions small** - Under 20 lines, aim for 10
6. **Use Record types** - `Record<Status, string>` for mappings
7. **Return early** - Reduce nesting with guard clauses
8. **Explicit return types** - All functions must have return type annotations
9. **Event-driven writes** - Publish events, process async (Telegram pattern)
10. **Denormalize counts** - Store vote_count, reply_count as columns

### The 30-Second Rule

> "Would a new team member understand this code in 30 seconds?"

If no, refactor for clarity.

### SLO Targets (Google SRE)

```
API Availability:      99.9%  (43 min downtime/month)
Message Delivery:      99.95% within 1 second
Forum Feed Latency:    99.5%  under 200ms
Search Latency:        99%    under 500ms
```

### CGraph Scale Patterns (100M+ Users)

We're building for scale. Every feature must consider:

1. **Use cursor pagination** - Never offset pagination
2. **Denormalize counts** - vote_count, reply_count as columns, not computed
3. **Buffer writes** - Use Redis for views/votes, batch flush to DB
4. **Cache aggressively** - L1 (ETS) → L2 (Cachex) → L3 (Redis) → DB
5. **Minimal broadcasts** - Send IDs not full objects over WebSocket
6. **Preload associations** - Never N+1 queries

### Cache TTL Guidelines

```
users:       5 min    (slow-changing)
sessions:    15 min   (auth tokens)
messages:    1 min    (hot data)
presence:    30 sec   (real-time)
feeds:       2 min    (computed)
rate_limits: 60 sec   (counters)
```

### Reference

See `docs/CODE_SIMPLIFICATION_GUIDELINES.md` for:

**Industry Standards:**

- Google SRE practices (SLO/SLI/Error Budgets)
- Google TypeScript Style Guide
- Meta scale patterns (TAO caching, multi-region)
- Telegram architecture (event-driven, minimal payloads)
- Observability & distributed tracing

**Code Quality:**

- SOLID principles with examples
- Anti-patterns with BAD/GOOD comparisons
- React performance patterns
- State management best practices

**Backend & Scale:**

- Phoenix Channels & real-time patterns
- CGraph caching patterns (3-tier, TAO-style)
- Rate limiting patterns
- Forum system optimization
- Database query patterns for scale
- Multi-region architecture

**Quality & Security:**

- Performance budgets & SLO targets
- Security best practices
- Testing guidelines
- Code review checklist

## Code Conventions

### TypeScript (Web/Mobile)

- Strict mode enabled
- React function components with hooks
- Zustand for global state, React Query for server state
- TailwindCSS with custom design tokens in `index.css`
- **Pure helper functions at module level** (not inside components)
- **Use `Record<K, V>` for all variant/size/status mappings**
- **Use type guards instead of type assertions**

### Elixir (Backend)

- Contexts pattern (Accounts, Messaging, Forums, Groups)
- Guardian for JWT authentication
- Oban for background jobs
- Module naming: `CGraph.*` (capital G) and `CGraphWeb.*`
- **Use pattern matching in function heads** (not nested conditionals)
- **Use `with` for complex conditional flows** (not nested case)
- **Use pipelines** (`|>`) for data transformations

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

## Production Infrastructure (v0.9.8)

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

### Stripe Integration

- **Payment Processing**: Stripe Checkout for subscriptions
- **Webhooks**: `/api/webhooks/stripe` endpoint
- **Subscription Tiers**: free, starter ($4.99), pro ($9.99), business ($19.99), enterprise

### Key Configuration Files

- `apps/backend/fly.toml` - Fly.io deployment configuration
- `apps/backend/Dockerfile` - Multi-stage build (hexpm/elixir:1.17.3-erlang-27.1.2-alpine-3.20.3)
- `apps/backend/config/runtime.exs` - Runtime configuration for production

### Production Endpoints

- `/health` - Basic health check (returns version, status)
- `/ready` - Readiness check (database, cache, redis status)
- `/api/webhooks/stripe` - Stripe webhook receiver

### Environment Variables (Fly.io Secrets)

```
DATABASE_URL          - Ecto connection URL to Supabase
DATABASE_SSL          - true
SECRET_KEY_BASE       - Phoenix secret (generate with: mix phx.gen.secret)
JWT_SECRET            - Guardian JWT signing key
ENCRYPTION_KEY        - For sensitive data encryption
PHX_HOST              - api.cgraph.org (or cgraph-backend.fly.dev)
REDIS_URL             - Optional: Upstash Redis URL for distributed rate limiting
STRIPE_SECRET_KEY     - Stripe API secret key
STRIPE_WEBHOOK_SECRET - Stripe webhook signing secret
STRIPE_PRICE_IDS      - JSON map of tier -> price_id
```

### Deployment Notes

- Redis is optional - rate limiting disabled when not configured
- Fly.io handles SSL termination (no force_ssl in Phoenix)
- Uses IPv4 socket option for DNS compatibility
- CleanupWorker runs daily via Oban cron
- Sourcemaps disabled in production for code protection
