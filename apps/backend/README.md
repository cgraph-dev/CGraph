# CGraph Backend

> Elixir/Phoenix API server for CGraph messaging platform (v0.9.31)

## Quick Start

### Prerequisites

- Elixir 1.17+ with Erlang/OTP 27+ (production uses 1.17.3/OTP 27.1.2; local dev uses 1.19.4/OTP
  28.3)
- PostgreSQL 16+
- Redis (optional, for distributed rate limiting)

### Local Development

```bash
# Install dependencies
mix deps.get

# Create and configure environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
mix ecto.setup

# Start the server
mix phx.server
```

The API will be available at http://localhost:4000

### Running Tests

```bash
mix test                    # Run all tests (1633 tests, 0 failures)
mix test path/file.exs      # Run single test file
mix test --only tag         # Run tests with specific tag
mix credo                   # Static analysis
mix dialyzer                # Type checking
mix sobelow                 # Security scan
```

> **Note**: Tests require `TokenBlacklist`, `AccountLockout`, and `KeyRotation` GenServers to be
> running. These start automatically via the supervision tree in test mode. If you see
> `** (EXIT) no process` errors, ensure `CGraph.Application` starts correctly.

---

## Production Deployment (Fly.io)

### Current Setup

| Component | Value                          |
| --------- | ------------------------------ |
| App Name  | `cgraph-backend`               |
| Region    | Frankfurt (fra)                |
| URL       | https://cgraph-backend.fly.dev |
| Database  | Supabase (Europe)              |

### Deploy Changes

```bash
# From apps/backend directory
fly deploy

# View logs
fly logs

# SSH into running instance
fly ssh console

# Run migrations
fly ssh console -C "/app/bin/cgraph eval 'CGraph.Release.migrate()'"
```

### Manage Secrets

```bash
# List secrets
fly secrets list

# Set a secret
fly secrets set KEY=value

# Required secrets:
# - DATABASE_URL     (Supabase connection string)
# - DATABASE_SSL     (true)
# - SECRET_KEY_BASE  (generate with: mix phx.gen.secret)
# - JWT_SECRET       (for Guardian)
# - ENCRYPTION_KEY   (for sensitive data)
# - PHX_HOST         (api.cgraph.org or cgraph-backend.fly.dev)
```

### Scale

```bash
# Check current machines
fly machine list

# Scale to 2 machines
fly scale count 2

# Increase memory
fly scale memory 1024
```

---

## Environment Variables

### Required

| Variable          | Description              | Example                            |
| ----------------- | ------------------------ | ---------------------------------- |
| `DATABASE_URL`    | Ecto connection string   | `ecto://user:pass@host:5432/db`    |
| `SECRET_KEY_BASE` | Phoenix secret           | Generate with `mix phx.gen.secret` |
| `JWT_SECRET`      | Guardian JWT signing key | Generate with `mix phx.gen.secret` |

### Optional

| Variable       | Description                         | Default                  |
| -------------- | ----------------------------------- | ------------------------ |
| `DATABASE_SSL` | Enable SSL for database             | `false`                  |
| `REDIS_URL`    | Redis for distributed rate limiting | Not set (uses local ETS) |
| `PHX_HOST`     | Hostname for URLs                   | `localhost`              |
| `PORT`         | HTTP port                           | `4000`                   |
| `POOL_SIZE`    | Database connection pool size       | `10`                     |

### External Services

| Variable                | Description            |
| ----------------------- | ---------------------- |
| `STRIPE_SECRET_KEY`     | Stripe API key         |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing |
| `RESEND_API_KEY`        | Email delivery         |
| `SENTRY_DSN`            | Error tracking         |
| `R2_*`                  | Cloudflare R2 storage  |

---

## API Endpoints

### Health Checks

```
GET /health  → {"status":"ok","version":"0.9.31","service":"cgraph-api"}
GET /ready   → {"status":"ready","checks":{"database":"ok","cache":"ok","redis":"not_configured"}}
```

### Authentication

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
DELETE /api/v1/auth/logout

# Wallet authentication
POST /api/v1/auth/wallet/challenge
POST /api/v1/auth/wallet/verify
```

### Core Resources

```
# Users
GET    /api/v1/users/me
PATCH  /api/v1/users/me

# Messaging
GET    /api/v1/conversations
POST   /api/v1/conversations
GET    /api/v1/conversations/:id/messages

# Forums
GET    /api/v1/forums
POST   /api/v1/forums
GET    /api/v1/forums/:id/posts

# Groups
GET    /api/v1/groups
POST   /api/v1/groups
GET    /api/v1/groups/:id/channels
```

---

## Architecture

```
lib/
├── cgraph/                    # Business logic
│   ├── accounts.ex            # Users, auth, sessions
│   ├── messaging.ex           # DMs, conversations
│   ├── forums.ex              # Posts, comments, voting
│   ├── groups.ex              # Servers, channels, roles
│   ├── presence.ex            # Online status
│   ├── cache.ex               # Multi-tier caching
│   └── workers/               # Oban background jobs
├── cgraph_web/                # Web layer
│   ├── router.ex              # API routes (126 lines, 8 route modules)
│   ├── router/                # Route macro modules (8 files)
│   ├── controllers/           # REST endpoints
│   ├── channels/              # Phoenix channels
│   └── plugs/                 # Auth, rate limiting, cookies
└── release.ex                 # Release tasks
```

### Router Pipeline Architecture

The router uses 5 pipelines and 8 route macro modules evaluated in this exact order:

| Pipeline           | Key Plugs                                                             | Purpose              |
| ------------------ | --------------------------------------------------------------------- | -------------------- |
| `:api`             | SecurityHeaders, CookieAuth, RequestTracing, RateLimiterV2(:standard) | Default API          |
| `:api_auth_strict` | Same as `:api` but RateLimiterV2(:strict)                             | Auth endpoints       |
| `:api_relaxed`     | SecurityHeaders, RequestTracing, RateLimiterV2(:relaxed)              | Health checks        |
| `:api_auth`        | `:api` + RequireAuth                                                  | Authenticated routes |
| `:api_admin`       | `:api` + RequireAuth + RequireAdmin                                   | Admin only           |

**Route evaluation order** (position matters!):

1. `health_routes()` → `/health`, `/ready`
2. `auth_routes()` → `/auth/*`
3. `user_routes()` → `/users/me`, `/tiers/me`, `/emojis/favorites` ⚠️ **MUST be before
   public_routes**
4. `public_routes()` → `/tiers/:tier`, `/emojis/:id` (wildcards would shadow user_routes if ordered
   first)
5. `messaging_routes()` → `/conversations/*`
6. `forum_routes()` → `/forums/*`, `/threads/*`
7. `gamification_routes()` → `/achievements/*`
8. `admin_routes()` → `/admin/*`

### Critical Schema Knowledge

| Schema     | Field/Gotcha                              | Correct Usage                                          |
| ---------- | ----------------------------------------- | ------------------------------------------------------ |
| `User`     | `username_changed_at`                     | NOT `last_username_change` — enforces 30-day cooldown  |
| `Post`     | `score`                                   | NOT `vote_count` — field is named `score`              |
| `Message`  | `sender_id`                               | NOT `user_id` — FK to users table                      |
| `Token`    | `type` is `string`, `token` is `binary`   | SHA-256 hashes stored as binary, not hex strings       |
| `Thread`   | `board_id` (belongs_to `Board`)           | NOT `forum_id` — joins through Board for forum queries |
| `Vote`     | table: `votes`, FK to `posts`             | For post voting                                        |
| `PostVote` | table: `post_votes`, FK to `thread_posts` | For thread post voting — different schema!             |

### Key Technologies

- **Phoenix 1.8** with Bandit adapter
- **Ecto 3.13.5** for PostgreSQL (78 migrations)
- **Guardian** for JWT authentication (CookieAuth plug translates HTTP-only cookies → Bearer
  headers)
- **Oban** for background jobs
- **Cachex** for local caching
- **Redix** for Redis (optional)

### Supervision Tree

Services are grouped to isolate failures:

- **CacheSupervisor**: `cgraph_cache` (L2), `session_cache`, `token_cache`
- **WorkerSupervisor**: Oban, Presence, WebRTC, DataExport
- **SecuritySupervisor**: TokenBlacklist (fail-closed!), AccountLockout, KeyRotation

> **⚠️ TokenBlacklist is fail-closed**: If the GenServer is down, ALL token checks return
> `{:error, :token_revoked}`. This is intentional for security but means tests will fail if the
> supervision tree doesn't start properly.

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
fly ssh console -C "/app/bin/cgraph eval 'CGraph.Repo.query!(\"SELECT 1\")'"

# Check DATABASE_URL
fly secrets list
```

### Memory Issues

```bash
# Increase RAM
fly scale memory 1024

# Check BEAM memory usage
fly ssh console -C "/app/bin/cgraph eval ':erlang.memory()'"
```

### Common Deployment Errors

See [DEPLOYMENT.md](../../docs/guides/DEPLOYMENT.md#deployment-troubleshooting) for solutions to:

- Regex/Unicode errors
- NIF loading failures
- SSL configuration
- Rate limiting without Redis

---

## Related Documentation

- [DEPLOYMENT.md](../../docs/guides/DEPLOYMENT.md) - Full deployment guide
- [OPERATIONS.md](../../docs/guides/OPERATIONS.md) - Operations runbook
- [API_REFERENCE.md](../../docs/api/API_REFERENCE.md) - API documentation
- [CLAUDE.md](../../CLAUDE.md) - AI assistant guidelines

---

_Last updated: February 16, 2026 (v0.9.31) — 1633 tests, 0 failures_
