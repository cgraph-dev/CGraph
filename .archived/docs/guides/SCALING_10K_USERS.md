# CGraph: Scaling to 10,000 Users

> A practical checklist and configuration guide for supporting 10K concurrent users

---

## Table of Contents

1. [Current Architecture Review](#current-architecture-review)
2. [Pre-Launch Checklist](#pre-launch-checklist)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Optimization](#frontend-optimization)
5. [Database Preparation](#database-preparation)
6. [WebSocket Scaling](#websocket-scaling)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Load Testing](#load-testing)

---

## Current Architecture Review

### Components

| Component   | Service          | Current Config      | 10K Ready?             |
| ----------- | ---------------- | ------------------- | ---------------------- |
| Backend API | Fly.io           | 1 machine, 512MB    | ⚠️ Needs scaling       |
| Landing     | Vercel           | Edge + CDN          | ✅ Ready               |
| Web App     | Fly.io (IAD)     | WIP deployment      | ⚠️ Needs setup         |
| Database    | Supabase         | Shared              | ⚠️ Monitor closely     |
| Redis       | Upstash/Fly      | Single instance     | ⚠️ May need upgrade    |
| WebSockets  | Phoenix Channels | Included in backend | ⚠️ Needs more machines |

### Bottlenecks at 10K Users

1. **Backend Machines**: Single instance can't handle 10K WebSocket connections
2. **Database Connections**: Connection pool limits
3. **Redis Memory**: Rate limiting + presence data
4. **WebSocket State**: User presence across nodes

---

## Pre-Launch Checklist

### Critical (Must Do)

- [ ] **Scale Fly.io machines to 3+ instances**
- [ ] **Enable Redis for distributed state**
- [ ] **Configure database connection pooling (PgBouncer)**
- [ ] **Set up health monitoring with alerts**
- [ ] **Run load tests to validate capacity**
- [ ] **Enable CDN caching for static assets**

### Important (Should Do)

- [ ] Configure auto-scaling rules on Fly.io
- [ ] Set up error tracking with Sentry DSN
- [ ] Enable database slow query logging
- [ ] Configure log aggregation
- [ ] Document runbook for common issues

### Nice to Have

- [ ] Multi-region backend deployment
- [ ] Read replicas for database
- [ ] Dedicated Redis cluster

---

## Backend Configuration

### Fly.io Scaling (fly.toml)

Update your `fly.toml` for 10K users:

```toml
# CGraph Backend Fly.io Configuration - 10K Users
app = "cgraph-backend"
primary_region = "fra"
kill_signal = "SIGTERM"
kill_timeout = "30s"

[experimental]
  auto_rollback = true

[build]
  dockerfile = "Dockerfile"

[env]
  MIX_ENV = "prod"
  PHX_SERVER = "true"
  PORT = "4000"
  ECTO_IPV6 = "true"
  ERL_AFLAGS = "-proto_dist inet6_tcp"
  # Optimized for multi-core: use all available CPUs
  ELIXIR_ERL_OPTIONS = "+S 4:4 +SDcpu 4:4 +sbwt short +swt low +stbt ts"
  ERL_CRASH_DUMP_SECONDS = "10"
  # Cluster configuration
  FLY_REGION = "${FLY_REGION}"
  RELEASE_COOKIE = "your-secure-cookie-here"

[http_service]
  internal_port = 4000
  force_https = true
  auto_stop_machines = false  # Keep machines running for WebSockets
  auto_start_machines = true
  min_machines_running = 3    # Minimum 3 for redundancy
  processes = ["app"]

  [http_service.concurrency]
    type = "connections"
    hard_limit = 2000         # Increased for WebSockets
    soft_limit = 1800

  [[http_service.checks]]
    interval = "15s"          # More frequent health checks
    timeout = "3s"
    grace_period = "30s"
    method = "GET"
    path = "/health"

[[vm]]
  cpu_kind = "performance"    # Dedicated CPU for consistent performance
  cpus = 2
  memory = "2gb"              # 2GB RAM per machine

# Auto-scaling based on connections
[http_service.autoscaling]
  min_machines = 3
  max_machines = 10
  [http_service.autoscaling.metrics]
    target = 500              # Target 500 connections per machine
```

### Deploy Commands

```bash
# Scale to 3 machines
fly scale count 3

# Scale memory
fly scale memory 2048

# Use performance CPUs
fly scale vm performance-2x

# Check current scale
fly scale show
```

### Elixir/Phoenix Configuration

In `config/runtime.exs`, ensure these settings:

```elixir
# Connection pool for 10K users
config :cgraph, CGraph.Repo,
  pool_size: 20,              # Per machine - total 60 across cluster
  queue_target: 1000,         # 1 second queue target
  queue_interval: 5000        # 5 second queue interval

# WebSocket configuration
config :cgraph, CGraphWeb.Endpoint,
  http: [
    port: String.to_integer(System.get_env("PORT") || "4000"),
    transport_options: [
      max_connections: 16_384,  # Max connections per machine
      num_acceptors: 100        # Acceptor pool size
    ]
  ],
  url: [host: host, port: 443, scheme: "https"],
  pubsub_server: CGraph.PubSub

# Redis for distributed PubSub
config :cgraph, CGraph.PubSub,
  name: CGraph.PubSub,
  adapter: Phoenix.PubSub.Redis,
  redis_url: System.get_env("REDIS_URL")
```

---

## Frontend Optimization

### Vercel Configuration (Landing Page)

The landing page `vercel.json` is optimized with:

- API rewrites to backend
- WebSocket proxy
- Security headers
- Asset caching

### Additional Optimizations

1. **Bundle Size**: Keep main bundle < 200KB gzipped
2. **Code Splitting**: Lazy load non-critical routes
3. **Image Optimization**: Use WebP/AVIF formats
4. **Service Worker**: Cache static assets

### Check Bundle Size

```bash
cd apps/web
pnpm build
# Check .next/analyze or vite build output
```

---

## Database Preparation

### Connection Pooling

For 10K users with 3 backend machines:

- 3 machines × 20 connections = 60 connections to DB
- Supabase Pro allows 60 direct connections (perfect fit)

If you exceed this:

1. Upgrade Supabase plan
2. Use PgBouncer (built into Supabase)

### Essential Indexes

Ensure these indexes exist (check migrations):

```sql
-- Most critical for message-heavy apps
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_messages_conversation_created
  ON messages (conversation_id, inserted_at DESC);

-- User lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_users_username_lower
  ON users (LOWER(username));

-- Forum browsing
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_posts_forum_created
  ON posts (forum_id, inserted_at DESC);

-- Active conversations
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_conversations_updated
  ON conversations (updated_at DESC)
  WHERE archived = false;
```

### Enable Slow Query Logging

```sql
-- Log queries taking > 500ms
ALTER SYSTEM SET log_min_duration_statement = 500;
SELECT pg_reload_conf();
```

---

## WebSocket Scaling

### Challenge

10K concurrent WebSocket connections require:

- Multiple backend nodes
- Distributed PubSub (Redis)
- Presence tracking across nodes

### Solution: Phoenix Tracker with Redis

Ensure Redis is configured for PubSub:

```elixir
# In application.ex supervisor children
{Phoenix.PubSub, name: CGraph.PubSub, adapter: Phoenix.PubSub.Redis, redis_url: redis_url}
```

### Connection Distribution

With 3 machines:

- ~3,333 WebSocket connections per machine
- Each machine handles ~1,100 connections for presence + messages + notifications

### Heartbeat Configuration

```javascript
// Frontend socket configuration
const socket = new Phoenix.Socket('/socket', {
  params: { token },
  heartbeatIntervalMs: 30000, // 30 seconds
  reconnectAfterMs: (tries) => Math.min(tries * 1000, 30000),
});
```

---

## Monitoring & Alerting

### Critical Metrics to Watch

| Metric                | Warning     | Critical    | Action             |
| --------------------- | ----------- | ----------- | ------------------ |
| CPU Usage             | > 70%       | > 90%       | Scale up machines  |
| Memory Usage          | > 80%       | > 95%       | Check for leaks    |
| DB Connections        | > 50        | > 55        | Add pooling        |
| WS Connections        | > 3000/node | > 4000/node | Add nodes          |
| Request Latency (p95) | > 500ms     | > 1000ms    | Profile & optimize |
| Error Rate            | > 1%        | > 5%        | Investigate        |

### Fly.io Metrics

```bash
# View real-time metrics
fly dashboard

# Check logs
fly logs --app cgraph-backend
```

### Grafana Dashboards

Located at `/infrastructure/grafana/`:

- Backend performance
- Database health
- WebSocket connections
- Rate limiting stats

---

## Load Testing

### k6 Script

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { WebSocket } from 'k6/experimental/websockets';

export const options = {
  stages: [
    { duration: '2m', target: 1000 }, // Ramp to 1K
    { duration: '5m', target: 5000 }, // Ramp to 5K
    { duration: '10m', target: 10000 }, // Ramp to 10K
    { duration: '5m', target: 10000 }, // Hold at 10K
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% failure
  },
};

export default function () {
  // Simulate typical user flow
  const res = http.get('https://cgraph-backend.fly.dev/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### Run Load Test

```bash
# Install k6
brew install k6

# Run test
k6 run load-test.js
```

### Expected Results at 10K

- Request latency p95: < 500ms
- WebSocket connect time: < 1s
- Error rate: < 0.5%
- Zero downtime during test

---

## Emergency Runbook

### High CPU (> 90%)

1. Scale up machines: `fly scale count 5`
2. Check for runaway queries in logs
3. Enable database query logging

### High Memory (> 95%)

1. Check for WebSocket connection leaks
2. Review ETS table sizes
3. Restart affected machines: `fly machines restart`

### Database Connection Exhaustion

1. Check pool configuration
2. Look for connection leaks (long-running transactions)
3. Temporarily reduce pool size per machine
4. Enable PgBouncer in Supabase

### WebSocket Storm (Mass Reconnections)

1. Implement exponential backoff in client
2. Add jitter to reconnection timing
3. Consider rate limiting reconnections per IP

---

## Cost Estimation

| Component            | Service       | Plan                | Monthly Cost        |
| -------------------- | ------------- | ------------------- | ------------------- |
| Backend (3 machines) | Fly.io        | Performance 2x, 2GB | ~$60                |
| Database             | Supabase      | Pro                 | ~$25                |
| Redis                | Upstash       | Pay-as-go           | ~$10-20             |
| Landing Page         | Vercel        | Pro                 | ~$20                |
| Web App              | Fly.io        | Shared w/ backend   | (included above)    |
| Monitoring           | Grafana Cloud | Free tier           | $0                  |
| **Total**            |               |                     | **~$115-125/month** |

---

## Summary

For 10,000 users, you need:

1. ✅ **3+ Backend Machines** on Fly.io with 2GB RAM each
2. ✅ **Redis** for distributed PubSub and rate limiting
3. ✅ **Supabase Pro** with PgBouncer enabled
4. ✅ **Monitoring** with alerts on critical metrics
5. ✅ **Load Testing** to validate before launch

The current architecture is designed to scale. Following this guide will prepare CGraph for 10,000
concurrent users with headroom for growth.
