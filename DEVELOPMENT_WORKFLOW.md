# CGraph Development Workflow Guide

> **Last Updated**: December 30, 2024
> 
> **Status**: ✅ Backend: 216 tests passing | ✅ Web: Builds successfully | ✅ Mobile: TypeScript compiles | ✅ All APIs working

This document contains all commands to test, run, and develop CGraph - a real-time communication platform combining Discord-style chat with Reddit-style forums.

---

## Current System Status

| Component | Status | Test Results | Notes |
|-----------|--------|--------------|-------|
| **Backend (Elixir/Phoenix)** | ✅ Working | 216 tests, 0 failures | All tests passing |
| **Web Frontend (React/Vite)** | ✅ Working | Builds in 3.5s | ESLint 9 config added |
| **Mobile (React Native/Expo)** | ✅ Compiles | TypeScript passes | Ready for development |
| **Database (PostgreSQL)** | ✅ Running | All migrations applied | Docker container |
| **API Authentication** | ✅ Working | JWT + Wallet auth | Guardian integration |

---

## Table of Contents

1. [Quick Start Commands](#quick-start-commands)
2. [Environment Setup](#environment-setup)
3. [Running Development Servers](#running-development-servers)
4. [Testing Commands](#testing-commands)
5. [Database Management](#database-management)
6. [Docker Development](#docker-development)
7. [Code Quality & Linting](#code-quality--linting)
8. [Development Tools & URLs](#development-tools--urls)
9. [Project Structure](#project-structure)
10. [Implementation Status](#implementation-status)
11. [Recent Bug Fixes](#recent-bug-fixes)
12. [Git Workflow](#git-workflow)
13. [What's Left To Do](#whats-left-to-do)

---

## Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/cgraph-dev/CGraph.git && cd CGraph
./infrastructure/scripts/setup-dev.sh

# Start all services (recommended)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis
pnpm install

# Run individually
cd apps/backend && mix phx.server   # Backend: http://localhost:4000
cd apps/web && pnpm dev             # Frontend: http://localhost:3001
cd apps/mobile && npx expo start    # Mobile: Expo DevTools
```

---

## Environment Setup

### Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| **Node.js** | 18+ | `nvm install 18` |
| **pnpm** | 8+ | `npm install -g pnpm` |
| **Elixir** | 1.14+ | `asdf install elixir 1.14.5` |
| **Erlang** | 25+ | `asdf install erlang 25.3` |
| **PostgreSQL** | 15+ | `docker-compose up -d postgres` or local install |
| **Redis** | 7+ | `docker-compose up -d redis` or local install |
| **Docker** | Latest | [Docker Install](https://docs.docker.com/get-docker/) |

### Initial Setup

```bash
# 1. Install all dependencies
npm install

# 2. Create environment files
cp apps/backend/config/dev.exs.example apps/backend/config/dev.exs  # if exists
# Or ensure dev.exs has correct database credentials

# 3. Setup backend
cd apps/backend
mix deps.get
mix ecto.setup  # Creates database, runs migrations, seeds

# 4. Setup frontend packages
cd ../../
npm install

# 5. Verify everything compiles
cd apps/backend && mix compile
cd ../web && npm run typecheck
```

### Environment Variables

**Backend** (`apps/backend/config/dev.exs` & `config/runtime.exs`):
```elixir
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cgraph_dev

# Redis
REDIS_URL=redis://localhost:6379

# Guardian (JWT)
GUARDIAN_SECRET_KEY=your-secret-key-here

# S3/File Uploads (optional for dev)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=cgraph-dev
```

**Frontend** (`apps/web/.env`):
```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000/socket
```

---

## Running Development Servers

### All Services Together (Turborepo)

```bash
# From project root
npm run dev              # Starts all services via Turborepo
```

### Individual Services

#### Backend (Elixir/Phoenix)

```bash
cd apps/backend

# Standard server
mix phx.server           # http://localhost:4000

# With interactive console
iex -S mix phx.server    # REPL + server

# Debug mode
ELIXIR_ERL_OPTIONS="-kernel shell_history enabled" iex -S mix phx.server
```

#### Web Frontend (Vite + React)

```bash
cd apps/web

npm run dev              # http://localhost:3000 (Vite HMR)
npm run build            # Production build
npm run preview          # Preview production build
```

#### Mobile (Expo + React Native)

```bash
cd apps/mobile

npx expo start           # Expo DevTools
npx expo start --ios     # iOS Simulator
npx expo start --android # Android Emulator
npx expo start --web     # Web version

# Development builds
npx expo run:ios         # Native iOS build
npx expo run:android     # Native Android build
```

---

## Testing Commands

### Backend Tests (ExUnit)

```bash
cd apps/backend

# Run all tests
mix test

# Run with coverage
mix test --cover
mix coveralls            # Detailed coverage
mix coveralls.html       # HTML report (open cover/excoveralls.html)

# Run specific tests
mix test test/cgraph/accounts_test.exs
mix test test/cgraph_web/controllers/auth_controller_test.exs

# Run tests matching a pattern
mix test --only tag_name
mix test test/path:line_number

# Watch mode (requires mix_test_watch)
mix test.watch

# Run tests with verbose output
mix test --trace

# Run tests in parallel (default)
mix test --max-cases 8
```

### Frontend Tests (Vitest)

```bash
cd apps/web

npm test                 # Run tests once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm run test:ui          # Vitest UI (interactive)

# Run specific test file
npm test src/components/Button.test.tsx

# Run tests matching pattern
npm test -- --grep "should render"
```

### Mobile Tests

```bash
cd apps/mobile

npm test                 # Jest tests
npm run test -- --watch  # Watch mode
npm run test:coverage    # Coverage report

# Run specific test
npm test __tests__/screens/LoginScreen.test.tsx
```

### End-to-End Tests

```bash
# If configured with Playwright/Cypress
cd apps/web
npm run e2e              # Run E2E tests
npm run e2e:headed       # With browser visible
```

---

## Database Management

### Mix Ecto Commands

```bash
cd apps/backend

# Create database
mix ecto.create

# Run migrations
mix ecto.migrate

# Rollback last migration
mix ecto.rollback

# Rollback specific version
mix ecto.rollback --step 2
mix ecto.rollback --to 20240101120000

# Reset (drop + create + migrate)
mix ecto.reset

# Full setup (create + migrate + seed)
mix ecto.setup

# Generate new migration
mix ecto.gen.migration create_users

# Check migration status
mix ecto.migrations

# Drop database (CAUTION!)
mix ecto.drop
```

### Database Utility Script

```bash
./infrastructure/scripts/db.sh

# Commands:
./infrastructure/scripts/db.sh migrate     # Run migrations
./infrastructure/scripts/db.sh rollback    # Rollback one step
./infrastructure/scripts/db.sh reset       # Reset database
./infrastructure/scripts/db.sh seed        # Run seeds
./infrastructure/scripts/db.sh backup      # Create backup
./infrastructure/scripts/db.sh console     # psql console
```

### Direct PostgreSQL Access

```bash
# Via Docker
docker exec -it cgraph-postgres-1 psql -U postgres -d cgraph_dev

# Local psql
psql -U postgres -d cgraph_dev

# Common queries
\dt                      # List tables
\d users                 # Describe table
\di                      # List indexes
SELECT count(*) FROM users;
```

---

## Docker Development

### Development Environment

```bash
# Start dependencies only (recommended for local development)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis

# Start everything in Docker
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Start specific services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis mailhog

# View logs
docker-compose logs -f
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (CLEAN START)
docker-compose down -v
```

### Docker Build Commands

```bash
# Build images
docker build -f infrastructure/docker/Dockerfile.backend -t cgraph-backend .
docker build -f infrastructure/docker/Dockerfile.web -t cgraph-web .

# Run production-like locally
docker run -p 4000:4000 cgraph-backend
```

### Useful Docker Commands

```bash
# Check container status
docker-compose ps

# Enter container shell
docker exec -it cgraph-backend-1 /bin/bash
docker exec -it cgraph-postgres-1 /bin/bash

# Check container logs
docker logs cgraph-backend-1 --tail 100 -f

# Prune unused resources
docker system prune -a
```

---

## Code Quality & Linting

### Backend (Elixir)

```bash
cd apps/backend

# Static analysis with Credo
mix credo                     # All checks
mix credo --strict            # Strict mode
mix credo suggest             # Suggestions only
mix credo explain Credo.Check.Readability.ModuleDoc

# Type analysis with Dialyzer
mix dialyzer                  # Full analysis (slow first run)
mix dialyzer --plt            # Build PLT only

# Code formatting
mix format                    # Format all files
mix format --check-formatted  # Check only (CI)

# Security analysis (if Sobelow installed)
mix sobelow                   # Security scan
```

### Frontend (TypeScript/ESLint)

```bash
cd apps/web

# ESLint
npm run lint             # Check for issues
npm run lint:fix         # Auto-fix issues

# TypeScript
npm run typecheck        # Type checking
npm run typecheck:watch  # Watch mode

# Prettier (if configured)
npm run format           # Format code
npm run format:check     # Check formatting
```

### Mobile (React Native)

```bash
cd apps/mobile

npm run lint             # ESLint
npm run lint:fix         # Auto-fix
npm run typecheck        # TypeScript check
```

### All Packages (Turborepo)

```bash
# From project root
npm run lint             # Lint all packages
npm run typecheck        # Typecheck all packages
npm run build            # Build all packages
```

---

## Development Tools & URLs

### Local Services

| Service | URL | Notes |
|---------|-----|-------|
| **Backend API** | http://localhost:4000 | Phoenix server |
| **Web Frontend** | http://localhost:3000 | Vite dev server |
| **API Docs** | http://localhost:4000/dev/dashboard | Phoenix dashboard |
| **WebSocket** | ws://localhost:4000/socket | Phoenix channels |

### Docker Services (when running)

| Service | URL | Credentials |
|---------|-----|-------------|
| **PostgreSQL** | localhost:5432 | `postgres:postgres` |
| **Redis** | localhost:6379 | - |
| **pgAdmin** | http://localhost:5050 | `admin@admin.com:admin` |
| **Redis Commander** | http://localhost:8081 | - |
| **Mailhog** | http://localhost:8025 | Email testing UI |

### API Testing Tools

```bash
# Health check
curl http://localhost:4000/health

# API request example
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# With JWT token
curl http://localhost:4000/api/v1/users/me \
  -H "Authorization: Bearer <token>"
```

---

## Project Structure

```
CGraph/
├── apps/
│   ├── backend/           # Elixir/Phoenix API
│   │   ├── lib/
│   │   │   ├── cgraph/    # Business logic
│   │   │   └── cgraph_web/# Web layer (controllers, channels)
│   │   ├── priv/
│   │   │   └── repo/migrations/
│   │   └── test/
│   ├── web/               # React + Vite frontend
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── stores/
│   │       └── lib/
│   └── mobile/            # React Native + Expo
│       └── src/
│           ├── components/
│           ├── screens/
│           ├── navigation/
│           └── context/
├── packages/
│   ├── shared-types/      # TypeScript types
│   ├── config/            # Shared config
│   ├── utils/             # Utility functions
│   └── ui/                # Shared UI components
├── infrastructure/
│   ├── docker/            # Docker files
│   ├── fly/               # Fly.io deployment
│   ├── terraform/         # Infrastructure as code
│   └── scripts/           # Utility scripts
└── docs/                  # Documentation
```

---

## Implementation Status

### ✅ Completed (~85%)

#### Backend Modules
| Module | Description | Status |
|--------|-------------|--------|
| **accounts/** | User auth, sessions, wallets, friends | ✅ Complete |
| **messaging/** | DMs, reactions, read receipts | ✅ Complete |
| **forums/** | Posts, comments, voting, moderation | ✅ Complete |
| **groups/** | Discord-style groups, channels, roles | ✅ Complete |
| **notifications/** | Push & in-app notifications | ✅ Complete |
| **Infrastructure** | Caching, jobs, rate limiting, telemetry | ✅ Complete |

#### API Endpoints
- ✅ Auth (register, login, wallet, password reset)
- ✅ Users (profile, settings, avatar)
- ✅ Conversations & Messages
- ✅ Groups, Channels, Members, Roles
- ✅ Forums, Posts, Comments
- ✅ Notifications, Search, Uploads
- ✅ WebSocket channels for real-time

#### Web Frontend
- ✅ Authentication pages (Login, Register, Forgot Password)
- ✅ Messages page with conversations
- ✅ Groups with channels
- ✅ Forums with posts
- ✅ Settings page
- ✅ Zustand state management
- ✅ Phoenix socket integration

#### Mobile App
- ✅ Full navigation structure
- ✅ Auth screens
- ✅ Messages/Conversations
- ✅ Groups/Channels
- ✅ Forums/Posts
- ✅ Settings screens

---

## Git Workflow

### Initial Setup

The repository is initialized with a comprehensive `.gitignore` to prevent sensitive data exposure.

```bash
# Clone the repository
git clone https://github.com/cgraph-dev/CGraph.git
cd CGraph

# Configure git identity
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

### Branch Strategy

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Create a bugfix branch
git checkout -b fix/bug-description

# Switch back to main
git checkout main
```

### Commit Messages

Follow conventional commits:

```bash
# Features
git commit -m "feat: Add user profile editing"

# Bug fixes
git commit -m "fix: Resolve login redirect issue"

# Documentation
git commit -m "docs: Update API reference"

# Refactoring
git commit -m "refactor: Simplify auth logic"

# Tests
git commit -m "test: Add message controller tests"
```

### Pre-commit Checks

Always run tests before committing:

```bash
# Backend tests
cd apps/backend && mix test

# Web build check
cd apps/web && npx vite build

# Mobile TypeScript check
cd apps/mobile && npx tsc --noEmit

# Check for sensitive files
git status | grep -E '\.(pem|key|crt|env)$' && echo "WARNING: Sensitive files!" || echo "OK"
```

### Security Reminders

**NEVER commit these files:**
- `.env` files (use `.env.example` as templates)
- `*.pem`, `*.key`, `*.crt` files
- Keystore files (`*.jks`, `*.keystore`)
- Firebase/Google service account JSON files
- Terraform state files (`*.tfstate`)

The `.gitignore` is configured to exclude all sensitive patterns automatically.

---

## What's Left To Do

### 🔴 Not Started (Priority: High)

| Feature | Description | Files Needed |
|---------|-------------|--------------|
| **Voice/Video Calls** | LiveKit/Jitsi integration | New module, WebRTC setup |
| **AI Features** | Message summarization, smart search | New Oban workers |
| **ActivityPub** | Federation with Mastodon | Full new module |
| **Admin Dashboard UI** | Admin panel frontend | `apps/web/src/pages/Admin/` |

### 🟡 Partially Complete (Priority: Medium)

| Feature | Status | What's Left |
|---------|--------|-------------|
| **E2E Encryption** | Schema exists | Full Signal Protocol implementation |
| **Polls** | Schema exists (`poll.ex`) | Controller, endpoints, UI |
| **Custom Emoji** | Schema exists | Upload endpoints, picker UI |
| **Pinned Posts** | ✅ COMPLETE | Backend endpoints + web/mobile UI |
| **Payment/Stripe** | Architecture defined | Implementation |

### 🟢 Polish & Testing (Priority: Medium)

| Task | Description | Status |
|------|-------------|--------|
| **Test Coverage** | Backend & frontend test completion | ⏳ |
| **Error Handling** | Comprehensive error states in UI | ✅ ErrorState, EmptyState components |
| **Loading States** | Skeleton loaders, optimistic updates | ✅ Web + Mobile skeletons |
| **Accessibility** | ARIA labels, keyboard navigation | ✅ Skip links, ARIA labels, focus rings |
| **i18n** | Internationalization setup | ⏳ |
| **Dark Mode** | Complete dark theme support | ✅ |
| **Toast Notifications** | User feedback system | ✅ Toast component |

### 🔵 Infrastructure (Priority: Low)

| Task | Description |
|------|-------------|
| **PgBouncer** | Connection pooling for production |
| **Multi-region** | Geographic distribution |
| **Meilisearch** | Full-text search upgrade |
| **Self-hosting docs** | Complete Docker deployment guide |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    CGraph Quick Commands                     │
├─────────────────────────────────────────────────────────────┤
│ START EVERYTHING                                             │
│   docker-compose -f docker-compose.yml \                    │
│     -f docker-compose.dev.yml up -d postgres redis          │
│   pnpm dev                                                  │
├─────────────────────────────────────────────────────────────┤
│ BACKEND                                                      │
│   cd apps/backend                                           │
│   mix phx.server          → Run server                      │
│   mix test                → Run tests                       │
│   mix ecto.migrate        → Run migrations                  │
│   mix credo               → Code analysis                   │
├─────────────────────────────────────────────────────────────┤
│ FRONTEND                                                     │
│   cd apps/web                                               │
│   npm run dev             → Dev server (3000)               │
│   npm test                → Run tests                       │
│   npm run lint:fix        → Fix lint issues                 │
│   npm run typecheck       → TypeScript check                │
├─────────────────────────────────────────────────────────────┤
│ MOBILE                                                       │
│   cd apps/mobile                                            │
│   npx expo start          → Start Expo                      │
│   npx expo start --ios    → iOS Simulator                   │
│   npx expo start --android→ Android Emulator                │
├─────────────────────────────────────────────────────────────┤
│ DATABASE                                                     │
│   mix ecto.reset          → Reset database                  │
│   mix ecto.migrate        → Run migrations                  │
│   mix ecto.rollback       → Rollback migration              │
├─────────────────────────────────────────────────────────────┤
│ URLS                                                         │
│   http://localhost:4000   → Backend API                     │
│   http://localhost:3000   → Web Frontend                    │
│   http://localhost:8025   → Mailhog (email testing)         │
│   http://localhost:5050   → pgAdmin                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Common Issues

**Database connection failed**
```bash
# Ensure PostgreSQL is running
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
# Check connection - use correct credentials
psql -U cgraph -h localhost -p 5432 -d cgraph_dev  # Password: cgraph_dev_password
```

**Redis connection failed**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d redis
redis-cli ping  # Should return PONG
# If port 6379 in use, Redis may already be running locally
redis-cli INFO | head -5
```

**Compilation errors after pulling**
```bash
cd apps/backend
mix deps.get
mix compile --force
```

**Frontend build issues**
```bash
rm -rf node_modules
npm install
cd apps/web && rm -rf node_modules && npm install
```

**Port already in use**
```bash
# Find process using port
lsof -i :4000
kill -9 <PID>
```

### Fixes Applied (December 2024)

The following issues were identified and fixed during development setup:

#### 1. Database Credential Mismatch
**Symptom**: `connection refused` or `authentication failed` errors
**Fix**: Updated `apps/backend/config/dev.exs` to use Docker container credentials:
```elixir
config :cgraph, Cgraph.Repo,
  username: "cgraph",
  password: "cgraph_dev_password",
  hostname: "localhost",
  database: "cgraph_dev"
```

#### 2. Missing Database Columns
**Symptom**: `ERROR 42703 (undefined_column) column u0.status_message does not exist`
**Fix**: Created migration `20251228234501_add_missing_user_fields.exs`:
```bash
cd apps/backend
mix ecto.migrate
```

#### 3. Missing AuthJSON Module
**Symptom**: `no "auth_response" json template defined for CgraphWeb.API.V1.AuthJSON`
**Fix**: Created `lib/cgraph_web/controllers/api/v1/auth_json.ex` with proper JSON rendering functions.

#### 4. Presence Module Callbacks
**Symptom**: `undefined callback function init/1` for Cgraph.Presence
**Fix**: Added required callback to `lib/cgraph/presence.ex`:
```elixir
@impl true
def init(_opts), do: {:ok, %{}}
```

#### 5. DateTime Precision Mismatch
**Symptom**: `microseconds are not supported` Ecto errors
**Fix**: Changed all schemas from `:utc_datetime` to `:utc_datetime_usec`:
```elixir
@timestamps_opts [type: :utc_datetime_usec]
```

#### 6. Oban Background Jobs
**Symptom**: Missing Oban tables
**Fix**: Created migration `20251228231006_add_oban_jobs.exs`:
```elixir
def up, do: Oban.Migration.up(version: 12)
def down, do: Oban.Migration.down(version: 1)
```

### API Testing Commands

Test the backend API after starting the Phoenix server:

```bash
# Health check
curl http://localhost:4000/health

# Register new user
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"user": {"email":"test@example.com","username":"testuser","password":"Password123!","password_confirmation":"Password123!"}}'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Test with token (replace with actual token)
TOKEN="your-jwt-token"
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/v1/users/me
```

---

## Additional Resources

- **API Reference**: `docs/API_REFERENCE.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Database Schema**: `docs/DATABASE.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **Security Hardening**: `docs/SECURITY_HARDENING.md`
- **Developer Operations**: `docs/DEVELOPER_OPERATIONS.md`

---

## UI Review Checklist

Use this checklist when reviewing the frontend UI at http://localhost:3000:

### Authentication Flow
- [ ] Login page renders correctly with email/password fields
- [ ] "Connect Wallet" button present for MetaMask login
- [ ] Registration page with username, email, password
- [ ] Forgot password flow
- [ ] Error states display properly
- [ ] Loading spinners during auth

### Messages Section (`/messages`)
- [ ] Conversations list sidebar
- [ ] Search/filter conversations
- [ ] New conversation button
- [ ] Message input with emoji picker
- [ ] Real-time message updates (requires backend)
- [ ] Read receipts display
- [ ] Typing indicators
- [ ] Message reactions

### Groups Section (`/groups`)
- [ ] Groups list sidebar
- [ ] Channel list within groups
- [ ] Group settings/members
- [ ] Role management
- [ ] Channel messages
- [ ] Invite system

### Forums Section (`/forums`)
- [ ] Forum categories list
- [ ] Posts with upvote/downvote
- [ ] Comments on posts
- [ ] Create new post
- [ ] Sorting (hot, new, top)
- [ ] Moderator actions

### Settings Section (`/settings`)
- [ ] Profile editing
- [ ] Avatar upload
- [ ] Notification preferences
- [ ] Privacy settings
- [ ] Appearance/theme toggle
- [ ] Account security (2FA)
- [ ] Connected wallets

### General UI
- [ ] Dark theme consistency
- [ ] Responsive design (mobile)
- [ ] Navigation highlighting
- [ ] Empty states
- [ ] Error boundaries
- [ ] Loading skeletons

---

## Backend API Verification

Test these endpoints to verify backend functionality:

```bash
# Health check
curl http://localhost:4000/health

# Register a user
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Password123!"
  }'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'

# Get current user (with token)
curl http://localhost:4000/api/v1/users/me \
  -H "Authorization: Bearer <token>"

# List conversations
curl http://localhost:4000/api/v1/conversations \
  -H "Authorization: Bearer <token>"

# List groups
curl http://localhost:4000/api/v1/groups \
  -H "Authorization: Bearer <token>"

# List forums
curl http://localhost:4000/api/v1/forums \
  -H "Authorization: Bearer <token>"
```

---

## Recent Bug Fixes (December 29, 2024)

This section documents all the fixes applied to get the test suite passing.

### 1. Rate Limiting Disabled for Tests

**Problem:** Tests were failing with 429 (Too Many Requests) errors due to rate limiting.

**Solution:** Added configuration option to disable rate limiting in test environment.

**Files Changed:**
- `lib/cgraph/rate_limiter.ex` - Added `enabled?/0` function
- `lib/cgraph_web/plugs/rate_limiter_v2.ex` - Added bypass when disabled  
- `config/test.exs` - Added `config :cgraph, Cgraph.RateLimiter, enabled: false`

### 2. Push Token Platform Mapping

**Problem:** Controller validated platforms as "ios/android/web" but schema expected "apns/fcm/web".

**Solution:** Added platform mapping in controller: ios→apns, android→fcm.

**Files Changed:**
- `lib/cgraph_web/controllers/api/v1/push_token_controller.ex` - Platform mapping added
- `lib/cgraph_web/controllers/api/v1/push_token_json.ex` - Removed non-existent `device_name` field

### 3. Push Token Upsert Constraint

**Problem:** `register_push_token/2` used `on_conflict` with non-existent database constraint.

**Solution:** Changed to find-or-create pattern.

**Files Changed:**
- `lib/cgraph/notifications/notifications.ex` - Replaced upsert with explicit check

### 4. HTTP Status Code Corrections

**Problem:** Token validation errors returned 400 instead of 422.

**Solution:** Changed `:bad_request` to `:unprocessable_entity` for validation errors.

**Files Changed:**
- `lib/cgraph_web/controllers/fallback_controller.ex` - Fixed `:token_required` and `:invalid_platform` handlers

### 5. Test Assertion Fixes

**Problem:** Various tests had incorrect expectations.

**Fixes Applied:**
- Invite join test: Changed expected status from 200 to 201 (Created)
- Username uniqueness test: Fixed error response path (`["error"]["details"]["username"]`)
- User profile test: Added bio update after creation (registration doesn't include bio)
- Reaction test: Fixed `add_reaction` argument order and used API-based setup

**Files Changed:**
- `test/cgraph_web/controllers/api/v1/channel_role_invite_test.exs`
- `test/cgraph_web/controllers/api/v1/user_controller_test.exs`
- `test/cgraph_web/controllers/api/v1/misc_controllers_test.exs`

### 6. ESLint 9 Configuration

**Problem:** Web frontend linting failed due to missing ESLint 9 flat config.

**Solution:** Created `eslint.config.js` with proper TypeScript and React rules.

**Files Created:**
- `apps/web/eslint.config.js`

> 📖 **For detailed technical documentation of each fix, see [docs/BUGFIX_LOG.md](docs/BUGFIX_LOG.md)**

---

## Development Priority Matrix

### Immediate (This Sprint)
| Task | Effort | Impact |
|------|--------|--------|
| Test coverage for existing code | High | High |
| Error handling polish | Medium | High |
| Loading states & skeletons | Medium | Medium |
| Form validation feedback | Low | Medium |

### Short-term (Next Sprint)
| Task | Effort | Impact |
|------|--------|--------|
| Admin dashboard UI | High | High |
| Polls implementation | Medium | Medium |
| Custom emoji upload | Medium | Low |
| Pinned messages | Low | Medium |

### Medium-term (Month)
| Task | Effort | Impact |
|------|--------|--------|
| E2E encryption | Very High | High |
| Voice/video calls | Very High | High |
| i18n/localization | High | Medium |
| Accessibility audit | Medium | Medium |

### Long-term (Quarter)
| Task | Effort | Impact |
|------|--------|--------|
| AI features | Very High | High |
| ActivityPub federation | Very High | Medium |
| Multi-region deployment | High | Medium |

---

*Generated for the CGraph development team. Keep this document updated as the project evolves.*
