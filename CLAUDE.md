# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CGraph is an enterprise messaging platform combining real-time chat, community forums, and decentralized identity. Features include Signal Protocol encryption (X3DH + AES-256-GCM), Ethereum wallet authentication, voice/video calls, and a karma-based forum system.

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

### Database
PostgreSQL with Ecto. Migrations in `apps/backend/priv/repo/migrations/`.
Uses ULID for IDs, supports full-text search.

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

### API
- REST endpoints at `/api/v1/*`
- JWT tokens in Authorization header
- Wallet auth via challenge/signature flow at `/api/v1/auth/wallet/*`

## Environment Setup

Required:
- Node.js 22+, pnpm 10+
- Elixir 1.17+, Erlang/OTP 28+
- PostgreSQL 16+
- Redis (for caching/rate limiting)

Copy `.env.example` to `.env` in `apps/backend/` and configure database credentials and secrets.
