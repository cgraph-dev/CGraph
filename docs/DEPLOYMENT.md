# CGraph Deployment Guide

> "It works on my machine" is not a deployment strategy.  
> — Every DevOps engineer, ever

This document covers deploying CGraph to production, from your first deploy to scaling for millions of users. We use Fly.io primarily, but the concepts apply to other platforms too.

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Setup](#environment-setup)
3. [First Deployment](#first-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Database Migrations](#database-migrations)
6. [Blue-Green Deployments](#blue-green-deployments)
7. [Rollback Procedures](#rollback-procedures)
8. [Scaling Guide](#scaling-guide)
9. [Monitoring Setup](#monitoring-setup)
10. [Incident Response](#incident-response)
11. [Cost Optimization](#cost-optimization)

---

## Deployment Overview

Our production architecture:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              PRODUCTION STACK                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CLOUDFLARE                                    │   │
│  │  • CDN for static assets                                            │   │
│  │  • WAF / DDoS protection                                            │   │
│  │  • SSL termination                                                  │   │
│  │  • Rate limiting at edge                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         FLY.IO (Backend)                             │   │
│  │                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │   │
│  │  │ Phoenix  │ │ Phoenix  │ │ Phoenix  │ │ Phoenix  │               │   │
│  │  │  Node 1  │ │  Node 2  │ │  Node 3  │ │  Node 4  │               │   │
│  │  │  (iad)   │ │  (iad)   │ │  (lhr)   │ │  (lhr)   │               │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  PostgreSQL (iad primary + lhr replica) │ Redis Cluster     │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CLOUDFLARE PAGES (Web)                          │   │
│  │  • Static React app                                                  │   │
│  │  • Preview deploys for PRs                                          │   │
│  │  • Automatic from GitHub                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    EXTERNAL SERVICES                                 │   │
│  │  Stripe │ Cloudflare R2 │ Resend │ Expo Push │ Sentry              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Environment Setup

### Required Accounts

Before deploying, you'll need accounts with:

| Service | Purpose | Free Tier? |
|---------|---------|------------|
| [Fly.io](https://fly.io) | Backend hosting | Yes (limited) |
| [Cloudflare](https://cloudflare.com) | CDN, DNS, Pages | Yes |
| [Stripe](https://stripe.com) | Payments | Yes (test mode) |
| [Resend](https://resend.com) | Transactional email | Yes (100/day) |
| [Sentry](https://sentry.io) | Error tracking | Yes (limited) |
| [Expo](https://expo.dev) | Push notifications | Yes |

### Installing CLI Tools

```bash
# Fly.io CLI
curl -L https://fly.io/install.sh | sh
fly auth login

# Cloudflare Wrangler (for Pages)
pnpm add -g wrangler
wrangler login
```

### Production Environment Variables

Create a secrets file (NEVER commit this):

```bash
# .env.production.local (gitignored)

# Database
DATABASE_URL=ecto://user:pass@db.internal:5432/cgraph

# Application
SECRET_KEY_BASE=<generate with: mix phx.gen.secret>
GUARDIAN_SECRET=<generate with: mix phx.gen.secret>
PHX_HOST=api.cgraph.org

# Redis
REDIS_URL=redis://default:password@redis.internal:6379

# External Services
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
SENTRY_DSN=https://...@sentry.io/...

# Storage
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=cgraph-uploads
R2_ENDPOINT=https://....r2.cloudflarestorage.com

# Push Notifications
EXPO_ACCESS_TOKEN=...
```

---

## First Deployment

### Step 1: Create Fly.io App

```bash
cd apps/backend

# Create a new Fly app
fly launch --no-deploy

# This creates fly.toml—review and edit it
```

Edit `fly.toml`:

```toml
app = "cgraph-api"
primary_region = "iad"

[build]
  dockerfile = "../../infrastructure/docker/Dockerfile.backend"

[env]
  PHX_HOST = "api.cgraph.org"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 2
  
  [http_service.concurrency]
    type = "connections"
    hard_limit = 1000
    soft_limit = 800

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024
```

### Step 2: Create Database

```bash
# Create a Postgres cluster
fly postgres create --name cgraph-db --region iad

# Attach it to your app (creates DATABASE_URL secret)
fly postgres attach cgraph-db --app cgraph-api
```

### Step 3: Create Redis

```bash
# Create Redis via Upstash (Fly.io integration)
fly redis create --name cgraph-redis --region iad

# Or use Fly's managed Redis
fly redis attach cgraph-redis --app cgraph-api
```

### Step 4: Set Secrets

```bash
# Set all production secrets
fly secrets set \
  SECRET_KEY_BASE="$(mix phx.gen.secret)" \
  GUARDIAN_SECRET="$(mix phx.gen.secret)" \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  RESEND_API_KEY="re_..." \
  R2_ACCESS_KEY_ID="..." \
  R2_SECRET_ACCESS_KEY="..." \
  R2_BUCKET="cgraph-uploads" \
  R2_ENDPOINT="https://....r2.cloudflarestorage.com"
```

### Step 5: Deploy

```bash
# Deploy the app
fly deploy

# Watch the logs
fly logs

# Check status
fly status
```

### Step 6: Run Migrations

```bash
# SSH into a running machine
fly ssh console

# Run migrations
/app/bin/cgraph eval "CGraph.Release.migrate()"
```

### Step 7: Deploy Web Frontend

```bash
cd apps/web

# Build for production
pnpm build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=cgraph-web
```

---

## CI/CD Pipeline

Our GitHub Actions workflow handles everything automatically.

### Backend Pipeline (`.github/workflows/backend.yml`)

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'apps/backend/**'
      - '.github/workflows/backend.yml'
  pull_request:
    branches: [main]
    paths:
      - 'apps/backend/**'

env:
  FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
  MIX_ENV: test

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: cgraph_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Elixir
        uses: erlef/setup-beam@v1
        with:
          elixir-version: '1.15'
          otp-version: '26'
      
      - name: Cache deps
        uses: actions/cache@v3
        with:
          path: |
            apps/backend/deps
            apps/backend/_build
          key: ${{ runner.os }}-mix-${{ hashFiles('apps/backend/mix.lock') }}
      
      - name: Install dependencies
        working-directory: apps/backend
        run: mix deps.get
      
      - name: Check formatting
        working-directory: apps/backend
        run: mix format --check-formatted
      
      - name: Run Credo
        working-directory: apps/backend
        run: mix credo --strict
      
      - name: Run tests
        working-directory: apps/backend
        env:
          DATABASE_URL: ecto://postgres:postgres@localhost/cgraph_test
          REDIS_URL: redis://localhost:6379
        run: mix test --cover
      
      - name: Check for security issues
        working-directory: apps/backend
        run: mix sobelow --config

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Fly
        uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy to Fly.io
        working-directory: apps/backend
        run: flyctl deploy --remote-only
      
      - name: Run migrations
        run: |
          flyctl ssh console -C "/app/bin/cgraph eval 'CGraph.Release.migrate()'"
      
      # Optional: Notify on success via webhook
      # - name: Notify Webhook
      #   if: success()
      #   run: |
      #     curl -X POST ${{ secrets.DEPLOY_WEBHOOK_URL }} \
      #       -H "Content-Type: application/json" \
      #       -d '{"text": "Backend deployed by ${{ github.actor }}"}'
```

### Web Pipeline (`.github/workflows/web.yml`)

```yaml
name: Web CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/**'
      - 'packages/**'
  pull_request:
    branches: [main]
    paths:
      - 'apps/web/**'
      - 'packages/**'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Run tests
        run: pnpm test --coverage
      
      - name: Build
        run: pnpm build
        env:
          VITE_API_URL: https://api.cgraph.org
          VITE_WS_URL: wss://api.cgraph.org
      
      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: web-dist
          path: apps/web/dist

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifact
        uses: actions/download-artifact@v3
        with:
          name: web-dist
          path: apps/web/dist
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: cgraph-web
          directory: apps/web/dist
```

---

## Database Migrations

### Safe Migration Strategy

We use a **two-phase deployment** for database changes:

**Phase 1: Deploy backward-compatible changes**
```elixir
# Add new column as nullable
def change do
  alter table(:users) do
    add :phone_number, :string, null: true  # nullable!
  end
end
```

**Phase 2: Deploy code that uses new column**
```elixir
# Now code can write to phone_number
```

**Phase 3 (optional): Add constraints**
```elixir
# After backfilling data, add NOT NULL if needed
def change do
  alter table(:users) do
    modify :phone_number, :string, null: false
  end
end
```

### Running Migrations in Production

```bash
# Method 1: Via SSH
fly ssh console
/app/bin/cgraph eval "CGraph.Release.migrate()"

# Method 2: Via flyctl
fly ssh console -C "/app/bin/cgraph eval 'CGraph.Release.migrate()'"

# Method 3: Automatic in release (our approach)
# In rel/env.sh.eex:
# /app/bin/cgraph eval "CGraph.Release.migrate()"
```

### Rollback a Migration

```bash
fly ssh console
/app/bin/cgraph eval "CGraph.Release.rollback(CGraph.Repo, 20240115000000)"
```

### Checking Migration Status

```bash
fly ssh console
/app/bin/cgraph eval "Ecto.Migrator.migrations(CGraph.Repo)"
```

---

## Blue-Green Deployments

Fly.io does this automatically with their rolling deployments, but here's how to do it manually for major changes:

### Step 1: Deploy to Canary

```bash
# Scale up an extra machine
fly scale count 5

# Deploy new version—Fly will do rolling deploy
fly deploy

# Watch error rates in monitoring
# If something's wrong, roll back immediately
```

### Step 2: Validate

```bash
# Check logs for errors
fly logs

# Hit the health endpoint
curl https://api.cgraph.org/api/health

# Check error rates in Sentry
# Monitor response times
```

### Step 3: Complete or Rollback

```bash
# If everything looks good, you're done!
# The old machines have already been replaced

# If something's wrong:
fly deploy --image registry.fly.io/cgraph-api:previous-sha
```

---

## Rollback Procedures

### Quick Rollback (< 5 minutes)

```bash
# Find the previous deployment
fly releases

# Roll back to it
fly deploy --image registry.fly.io/cgraph-api:<previous-sha>
```

### Rollback with Database Changes

This is trickier. If your migration was destructive:

1. **Stop all traffic** (if critical)
   ```bash
   fly scale count 0
   ```

2. **Restore database from backup**
   ```bash
   fly postgres restore --time "2024-01-15T14:30:00Z"
   ```

3. **Deploy previous code version**
   ```bash
   fly deploy --image registry.fly.io/cgraph-api:<previous-sha>
   ```

4. **Scale back up**
   ```bash
   fly scale count 4
   ```

---

## Scaling Guide

### Horizontal Scaling (More Machines)

```bash
# Add more Phoenix nodes
fly scale count 8 --region iad

# Or distribute across regions
fly scale count 4 --region iad
fly scale count 4 --region lhr
```

### Vertical Scaling (Bigger Machines)

```bash
# Upgrade machine size
fly scale vm shared-cpu-2x  # 2 shared CPUs, 512MB
fly scale vm dedicated-cpu-1x  # 1 dedicated CPU, 2GB
fly scale memory 2048  # 2GB RAM
```

### When to Scale What

| Symptom | Solution |
|---------|----------|
| High CPU across nodes | Add more machines |
| High memory on single node | Increase RAM or add machines |
| Database connection exhausted | Add PgBouncer, increase pool |
| Slow database queries | Add read replica, optimize queries |
| Redis memory full | Increase Redis size or add cluster |

### Auto-Scaling (Experimental)

```toml
# In fly.toml
[http_service]
  auto_stop_machines = false  # Keep at least min running
  auto_start_machines = true  # Start more on demand
  min_machines_running = 2
  
  [http_service.concurrency]
    type = "connections"
    hard_limit = 1000  # Start new machine if exceeded
    soft_limit = 800
```

---

## Monitoring Setup

### Sentry (Error Tracking)

Already configured in the app. Errors are automatically sent.

```elixir
# In config/runtime.exs
config :sentry,
  dsn: System.get_env("SENTRY_DSN"),
  environment_name: config_env(),
  enable_source_code_context: true,
  root_source_code_paths: [File.cwd!()]
```

### Fly.io Metrics

```bash
# View real-time metrics
fly dashboard

# Or via CLI
fly status
fly logs
```

### Custom Metrics with Telemetry

```elixir
# lib/cgraph/telemetry.ex
defmodule CGraph.Telemetry do
  use Supervisor
  import Telemetry.Metrics

  def start_link(arg) do
    Supervisor.start_link(__MODULE__, arg, name: __MODULE__)
  end

  def init(_arg) do
    children = [
      {:telemetry_poller, measurements: periodic_measurements(), period: 10_000}
    ]
    Supervisor.init(children, strategy: :one_for_one)
  end

  def metrics do
    [
      # Phoenix metrics
      summary("phoenix.endpoint.stop.duration", unit: {:native, :millisecond}),
      summary("phoenix.router_dispatch.stop.duration", unit: {:native, :millisecond}),
      
      # Database metrics  
      summary("cgraph.repo.query.total_time", unit: {:native, :millisecond}),
      counter("cgraph.repo.query.count"),
      
      # Custom business metrics
      counter("cgraph.messages.sent.count"),
      counter("cgraph.users.registered.count"),
      last_value("cgraph.websockets.connected.count")
    ]
  end

  defp periodic_measurements do
    [
      {__MODULE__, :count_websockets, []}
    ]
  end
  
  def count_websockets do
    count = Phoenix.PubSub.count_subscribers(CGraph.PubSub, "users:*")
    :telemetry.execute([:cgraph, :websockets, :connected], %{count: count})
  end
end
```

### Grafana Dashboard (Optional)

If you want pretty graphs, export metrics to Grafana Cloud:

```elixir
# Add to deps
{:telemetry_metrics_prometheus, "~> 1.1"}

# Expose /metrics endpoint
# See docs for full setup
```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **SEV1** | Complete outage | < 15 min | Site is down |
| **SEV2** | Major degradation | < 1 hour | Login broken, messages failing |
| **SEV3** | Minor issue | < 4 hours | Slow response times, UI glitch |
| **SEV4** | Cosmetic/Low priority | Next business day | Typo, minor styling issue |

### Incident Response Playbook

**SEV1: Complete Outage**

1. **Acknowledge** - Post in #incidents Slack channel
2. **Investigate** - Check in this order:
   - Fly.io status page (is it them?)
   - `fly status` - Are machines running?
   - `fly logs` - Any crash loops?
   - Cloudflare dashboard - DNS/CDN issues?
   - Database - `fly postgres connect` - Is it reachable?

3. **Mitigate** - Quick fixes:
   ```bash
   # Restart all machines
   fly machines restart
   
   # Roll back if recent deploy
   fly deploy --image <previous-sha>
   
   # Scale up if overloaded
   fly scale count 8
   ```

4. **Communicate** - Update status page, tweet, Slack

5. **Resolve** - Fix the root cause

6. **Post-mortem** - Write up what happened within 48 hours

### Common Incidents and Fixes

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| 502 errors | App crashed | `fly machines restart` |
| Very slow | Database overloaded | Check slow queries, add replicas |
| WebSocket fails | Too many connections | Scale up machines |
| Can't login | Auth service down | Check Guardian config, secrets |
| No emails | Resend API issue | Check Resend dashboard |

### On-Call Rotation

We use PagerDuty for on-call:
- Week 1: @chen
- Week 2: @marcus  
- Week 3: @aisha
- Week 4: Rotate

On-call responsibilities:
- Respond to SEV1/SEV2 within 15 minutes
- Have laptop and internet access
- Know how to deploy/rollback
- Escalate if you can't fix it

---

## Cost Optimization

### Current Monthly Costs (as of Dec 2024)

| Service | Cost | Notes |
|---------|------|-------|
| Fly.io Machines (4x shared-cpu-1x) | $23 | ~$6/machine |
| Fly.io Postgres | $27 | 2GB, HA enabled |
| Fly.io Redis | $15 | 1GB |
| Cloudflare Pro | $20 | Could use free tier |
| Resend | $20 | 50K emails/month |
| R2 Storage | ~$15 | Varies with usage |
| Sentry | $0 | Free tier |
| **Total** | **~$120/month** | For ~5K users |

### Optimization Tips

**1. Right-size your machines**
```bash
# Check actual resource usage
fly scale show

# Downgrade if underutilized
fly scale vm shared-cpu-1x
fly scale memory 512
```

**2. Use auto-stop for non-production**
```toml
# For staging/preview environments
[http_service]
  auto_stop_machines = true
  min_machines_running = 0
```

**3. Use R2 instead of S3**
- Zero egress fees (huge savings for file-heavy apps)

**4. Batch operations**
```elixir
# Instead of many small inserts
Enum.each(items, fn item -> Repo.insert!(item) end)

# Do one batch insert
Repo.insert_all(Item, items)
```

**5. Cache aggressively**
```elixir
# Cache expensive queries
def get_trending_posts do
  Cachex.fetch(:posts_cache, "trending", fn ->
    {:commit, do_expensive_query()}
  end)
end
```

---

## Checklist: Pre-Deploy

Before every production deploy:

- [ ] All tests pass in CI
- [ ] Code reviewed and approved
- [ ] Migrations are backward-compatible
- [ ] No secrets in code
- [ ] Monitoring dashboards ready
- [ ] Rollback plan clear
- [ ] On-call person aware (for major changes)

---

## Emergency Contacts

| Issue | Contact |
|-------|---------|
| Infrastructure | @chen (Slack, phone in PagerDuty) |
| Backend/Database | @marcus |
| Frontend | @aisha |
| Security | security@cgraph.org |
| Fly.io Support | support@fly.io |
| Cloudflare Support | Via dashboard |

---

*Last updated: December 2024. If you find something wrong, please fix it and open a PR!*
