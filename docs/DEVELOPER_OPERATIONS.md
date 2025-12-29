# CGraph Developer Operations Guide

> Everything you need to run, maintain, and deploy CGraph in production

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Local Development Setup](#local-development-setup)
3. [Running the Application](#running-the-application)
4. [Environment Configuration](#environment-configuration)
5. [Database Operations](#database-operations)
6. [Deployment](#deployment)
7. [Monitoring & Observability](#monitoring--observability)
8. [Backup & Recovery](#backup--recovery)
9. [Security Hardening](#security-hardening)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

CGraph is a monorepo containing three main applications and shared packages:

```
┌─────────────────────────────────────────────────────────────────────┐
│                            CLIENTS                                   │
├─────────────────┬─────────────────┬─────────────────────────────────┤
│   Web (React)   │  Mobile (RN)    │        (Future: Desktop)        │
│   Port: 3000    │  Expo: 19000    │                                 │
└────────┬────────┴────────┬────────┴─────────────────────────────────┘
         │                 │
         │    HTTPS/WSS    │
         ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     LOAD BALANCER (Nginx)                           │
│                     Port: 80/443                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Phoenix/Elixir)                         │
│                    Port: 4000                                       │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐     │
│  │   REST API   │  WebSocket   │   Channels   │    Oban      │     │
│  │   /api/v1    │   /socket    │  (Presence)  │   (Jobs)     │     │
│  └──────────────┴──────────────┴──────────────┴──────────────┘     │
└────────┬──────────────────────────────┬─────────────────────────────┘
         │                              │
         ▼                              ▼
┌────────────────────┐      ┌────────────────────────────────────────┐
│   PostgreSQL 16    │      │              Redis 7.2                  │
│   Port: 5432       │      │              Port: 6379                 │
│   Primary + Read   │      │   ┌──────────┬───────────┬──────────┐  │
│   Replicas         │      │   │  Cache   │  PubSub   │ Sessions │  │
│                    │      │   └──────────┴───────────┴──────────┘  │
└────────────────────┘      └────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Backend | Elixir + Phoenix | 1.17 / 1.7.11 | API, WebSockets, Business Logic |
| Web Frontend | React + Vite | 18.2 / 5.0 | Browser Application |
| Mobile | React Native + Expo | 0.73 / SDK 54 | iOS/Android Apps |
| Database | PostgreSQL | 16 | Primary Data Store |
| Cache | Redis | 7.2 | Caching, Sessions, PubSub |
| Job Queue | Oban | 2.17 | Background Jobs |
| Auth | Guardian + Argon2 | - | JWT Authentication |

---

## Local Development Setup

### Prerequisites

Before you begin, ensure you have installed:

| Tool | Minimum Version | Check Command |
|------|-----------------|---------------|
| Node.js | 20.0.0 | `node --version` |
| pnpm | 8.0.0 | `pnpm --version` |
| Elixir | 1.17.0 | `elixir --version` |
| Erlang/OTP | 27.0 | `erl -version` |
| PostgreSQL | 16.0 | `psql --version` |
| Redis | 7.0 | `redis-cli --version` |
| Docker | 24.0 | `docker --version` |
| Git | 2.40 | `git --version` |

### Quick Start (Automated)

The fastest way to get started:

```bash
# Clone the repository
git clone https://github.com/cgraph-dev/CGraph.git
cd CGraph

# Run the setup script
chmod +x infrastructure/scripts/setup-dev.sh
./infrastructure/scripts/setup-dev.sh
```

This script will:
1. Check all prerequisites
2. Install JavaScript dependencies (pnpm)
3. Install Elixir dependencies (mix)
4. Start PostgreSQL and Redis via Docker
5. Create and migrate the database
6. Display startup instructions

### Manual Setup

If you prefer manual control:

**Step 1: Clone and enter the repository**
```bash
git clone https://github.com/cgraph-dev/CGraph.git
cd CGraph
```

**Step 2: Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Step 3: Install JavaScript dependencies**
```bash
pnpm install
```

**Step 4: Install Elixir dependencies**
```bash
cd apps/backend
mix deps.get
mix deps.compile
cd ../..
```

**Step 5: Start databases**
```bash
# Using Docker (recommended)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis

# Or use local installations if you prefer
```

**Step 6: Set up the database**
```bash
cd apps/backend
mix ecto.create
mix ecto.migrate
mix run priv/repo/seeds.exs  # Optional: seed sample data
cd ../..
```

---

## Running the Application

### Development Mode

Open three terminal windows and run:

**Terminal 1: Backend (Phoenix)**
```bash
cd apps/backend
mix phx.server
# Backend available at http://localhost:4000
# API available at http://localhost:4000/api/v1
# WebSocket at ws://localhost:4000/socket
```

**Terminal 2: Web Frontend (Vite)**
```bash
pnpm --filter @cgraph/web dev
# Web app available at http://localhost:3000
```

**Terminal 3: Mobile (Expo)**
```bash
cd apps/mobile
npx expo start
# Scan QR code with Expo Go app on your phone
# Or press 'i' for iOS simulator, 'a' for Android emulator
```

### Using Turborepo (All at once)

```bash
pnpm dev  # Starts all apps in parallel
```

### Docker Development

Run everything in containers:

```bash
# Start all services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Start specific services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up backend-dev postgres redis

# View logs
docker-compose logs -f backend-dev

# Stop all services
docker-compose down
```

### Available Dev Tools (Docker)

When using `docker-compose.dev.yml`:

| Tool | URL | Purpose |
|------|-----|---------|
| pgAdmin | http://localhost:5050 | Database management UI |
| Redis Commander | http://localhost:8081 | Redis browser |
| Mailhog | http://localhost:8025 | Email testing |

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# =============================================================================
# APPLICATION
# =============================================================================
APP_ENV=development          # development | staging | production
APP_NAME=CGraph
APP_VERSION=1.0.0

# =============================================================================
# PHOENIX BACKEND
# =============================================================================
MIX_ENV=dev                  # dev | test | prod
PHX_SERVER=true
PHX_HOST=localhost
PORT=4000

# CRITICAL: Generate with `mix phx.gen.secret`
SECRET_KEY_BASE=your-64-character-secret-key-here

# CRITICAL: Generate with `mix guardian.gen.secret`
GUARDIAN_SECRET=your-guardian-secret-key-here

# =============================================================================
# DATABASE
# =============================================================================
DATABASE_URL=ecto://cgraph:password@localhost:5432/cgraph_dev
DATABASE_POOL_SIZE=10

# =============================================================================
# REDIS
# =============================================================================
REDIS_URL=redis://localhost:6379/0

# =============================================================================
# JWT TOKENS
# =============================================================================
JWT_ACCESS_TOKEN_TTL=7200    # 2 hours in seconds
JWT_REFRESH_TOKEN_TTL=2592000 # 30 days in seconds

# =============================================================================
# FILE UPLOADS
# =============================================================================
MAX_FILE_SIZE=26214400       # 25MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf

# =============================================================================
# EMAIL (Development: Mailhog)
# =============================================================================
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=noreply@cgraph.dev
```

### Environment-Specific Configs

**Development:**
- Hot reloading enabled
- Debug logging
- Detailed error messages
- CORS allows localhost

**Staging:**
- Production-like but with debug tools
- Staging database
- Test payment gateway

**Production:**
- Optimized builds
- Minimal logging
- Strict CORS
- Rate limiting enabled

---

## Database Operations

### Using the Database Script

We provide a convenient script for common database tasks:

```bash
# Make it executable (first time only)
chmod +x infrastructure/scripts/db.sh

# Run migrations
./infrastructure/scripts/db.sh migrate

# Rollback last migration
./infrastructure/scripts/db.sh rollback

# Reset database (drops and recreates)
./infrastructure/scripts/db.sh reset

# Run seed data
./infrastructure/scripts/db.sh seed

# Check migration status
./infrastructure/scripts/db.sh status

# Create backup
./infrastructure/scripts/db.sh backup

# Restore from backup
./infrastructure/scripts/db.sh restore ./backups/cgraph_dev_20251228.sql.gz

# Open psql console
./infrastructure/scripts/db.sh console
```

### Creating Migrations

```bash
cd apps/backend

# Generate a migration
mix ecto.gen.migration add_friends_table

# Edit the migration file in priv/repo/migrations/
# Then run it
mix ecto.migrate
```

### Migration Best Practices

1. **Always test migrations locally first**
2. **Make migrations reversible when possible**
3. **Never modify a deployed migration** - create a new one instead
4. **Use transactions for data migrations**
5. **Test rollbacks before deploying**

Example migration with rollback:

```elixir
defmodule CGraph.Repo.Migrations.AddFriendsTable do
  use Ecto.Migration

  def up do
    create table(:friendships, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :friend_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :status, :string, null: false, default: "pending"
      timestamps()
    end

    create index(:friendships, [:user_id])
    create index(:friendships, [:friend_id])
    create unique_index(:friendships, [:user_id, :friend_id])
  end

  def down do
    drop table(:friendships)
  end
end
```

---

## Deployment

### Fly.io Deployment (Recommended)

**Initial Setup:**

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Create the app (first time only)
flyctl apps create cgraph

# Set secrets
flyctl secrets set SECRET_KEY_BASE=$(mix phx.gen.secret)
flyctl secrets set GUARDIAN_SECRET=$(mix guardian.gen.secret)
flyctl secrets set DATABASE_URL="your-production-db-url"
flyctl secrets set REDIS_URL="your-production-redis-url"
```

**Deploying:**

```bash
# Deploy backend
./infrastructure/scripts/deploy-fly.sh

# Or manually
flyctl deploy --config infrastructure/fly/fly.toml
```

**Post-Deployment:**

```bash
# Run migrations
flyctl ssh console -C "/app/bin/cgraph eval 'CGraph.Release.migrate()'"

# Check status
flyctl status

# View logs
flyctl logs

# Scale up
flyctl scale count 3  # Run 3 instances
```

### Docker Production Build

```bash
# Build production images
docker build -f infrastructure/docker/Dockerfile.backend -t cgraph-backend:latest .
docker build -f infrastructure/docker/Dockerfile.web -t cgraph-web:latest .

# Run with docker-compose
docker-compose up -d
```

### Health Checks

```bash
# Run health check script
./infrastructure/scripts/health-check.sh

# Manual checks
curl http://localhost:4000/health  # Backend
curl http://localhost:3000/health  # Web frontend
```

---

## Monitoring & Observability

### Logging

**Backend (Elixir):**
- Logs are written to stdout
- Format: JSON in production, human-readable in dev
- Levels: debug, info, warn, error

```elixir
# In code
require Logger
Logger.info("User registered", user_id: user.id)
```

**View logs:**
```bash
# Docker
docker-compose logs -f backend

# Fly.io
flyctl logs -a cgraph
```

### Metrics

Key metrics to monitor:

| Metric | Threshold | Action if Exceeded |
|--------|-----------|-------------------|
| API Response Time (p95) | > 200ms | Optimize queries, add caching |
| Error Rate | > 1% | Check logs, investigate errors |
| Memory Usage | > 80% | Scale up, check for leaks |
| DB Connections | > 80% pool | Increase pool size |
| WebSocket Connections | > 10k/server | Add more instances |

### Recommended Tools

- **Sentry**: Error tracking (set `SENTRY_DSN` env var)
- **Prometheus + Grafana**: Metrics and dashboards
- **PostHog**: User analytics
- **Papertrail**: Log aggregation

---

## Backup & Recovery

### Automated Backups

Set up a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add this line (runs at 2 AM daily)
0 2 * * * /path/to/CGraph/infrastructure/scripts/db.sh backup
```

### Manual Backup

```bash
./infrastructure/scripts/db.sh backup
# Creates: ./backups/cgraph_dev_20251228_143052.sql.gz
```

### Restore from Backup

```bash
# Warning: This replaces all existing data!
./infrastructure/scripts/db.sh restore ./backups/cgraph_dev_20251228_143052.sql.gz
```

### Disaster Recovery Plan

1. **Daily backups**: Automated, retained for 30 days
2. **Point-in-time recovery**: Enable WAL archiving for PostgreSQL
3. **Cross-region replication**: Replicate to secondary region
4. **Recovery Time Objective (RTO)**: < 1 hour
5. **Recovery Point Objective (RPO)**: < 1 hour of data loss

---

## Security Hardening

### Pre-Deployment Checklist

- [ ] All secrets are in environment variables, not code
- [ ] `SECRET_KEY_BASE` is at least 64 characters
- [ ] HTTPS is enforced (HSTS enabled)
- [ ] CORS is restricted to production domains only
- [ ] Rate limiting is enabled
- [ ] File upload validation is configured
- [ ] Database uses strong passwords
- [ ] Redis requires authentication in production
- [ ] Debug endpoints are disabled
- [ ] Error messages don't leak sensitive info

### Security Headers

Our Nginx config sets these headers automatically:

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
```

### Vulnerability Scanning

```bash
# JavaScript dependencies
pnpm audit

# Elixir dependencies
cd apps/backend
mix deps.audit
mix sobelow --config
```

---

## Troubleshooting

### Common Issues

**"Cannot connect to PostgreSQL"**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check connection
psql -h localhost -U cgraph -d cgraph_dev -c "SELECT 1"

# Check DATABASE_URL format
echo $DATABASE_URL
# Should be: ecto://user:password@host:port/database
```

**"Phoenix won't start"**
```bash
# Check for compile errors
cd apps/backend
mix compile --warnings-as-errors

# Check if port is in use
lsof -i :4000

# Try a clean build
mix deps.clean --all
mix deps.get
mix compile
```

**"WebSocket connection failed"**
```bash
# Check if endpoint is configured correctly
grep -r "socket" apps/backend/lib/cgraph_web/

# Verify CORS settings allow WebSocket origin
# Check browser console for CORS errors
```

**"Migrations failed"**
```bash
# Check migration status
mix ecto.migrations

# Look at the specific error
mix ecto.migrate --log-sql

# If stuck, try rolling back
mix ecto.rollback
```

### Getting Help

1. Check the logs first: `docker-compose logs -f`
2. Search existing GitHub issues
3. Ask in the community Discord
4. Open a new GitHub issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, versions)
   - Relevant logs

---

## Quick Reference

### Useful Commands

```bash
# Start everything
pnpm dev

# Run tests
pnpm test                    # All packages
cd apps/backend && mix test  # Backend only

# Lint code
pnpm lint
cd apps/backend && mix credo

# Format code
pnpm format
cd apps/backend && mix format

# Build for production
pnpm build

# Deploy
./infrastructure/scripts/deploy-fly.sh
```

### File Locations

| Item | Location |
|------|----------|
| Backend code | `apps/backend/lib/` |
| Web frontend | `apps/web/src/` |
| Mobile app | `apps/mobile/src/` |
| Database migrations | `apps/backend/priv/repo/migrations/` |
| API routes | `apps/backend/lib/cgraph_web/router.ex` |
| Docker configs | `infrastructure/docker/` |
| Deploy configs | `infrastructure/fly/` |
| Scripts | `infrastructure/scripts/` |

---

*Last updated: December 2025*
