# CGraph Monitoring Guide

> Production monitoring, observability, and alerting for CGraph

**Version:** 0.9.33 | **Last Updated:** February 20, 2026

---

## 📊 Monitoring Stack Overview

CGraph uses Grafana Cloud for production observability, with Grafana Alloy as the metrics shipper:

| Component              | Purpose                     | Location / URL                             |
| ---------------------- | --------------------------- | ------------------------------------------ |
| **Grafana Cloud**      | Dashboards & alerting       | `cgraphdev.grafana.net`                    |
| **Grafana Alloy**      | Metrics collection/shipping | Fly.io sidecar (`apps/backend/alloy/`)     |
| **Prometheus (Cloud)** | Metrics storage             | Remote write via Alloy                     |
| **Sentry**             | Error tracking              | Cloud service (DSN in `SENTRY_DSN` secret) |
| **Fly.io Metrics**     | Infrastructure monitoring   | Fly.io dashboard                           |
| **Vercel Analytics**   | Frontend performance        | Vercel dashboard                           |

### Architecture Flow

```
Phoenix App (:4000/metrics)
    │
    ▼
Grafana Alloy (sidecar, scrapes every 15s)
    │  adds labels: fly_region, fly_app, environment=production
    ▼
Grafana Cloud Prometheus (remote write)
    │
    ▼
Grafana Cloud Dashboards + Alerts
```

### Key Files

| File                                                           | Purpose                                       |
| -------------------------------------------------------------- | --------------------------------------------- |
| `apps/backend/alloy/config.alloy`                              | Fly.io Alloy sidecar config                   |
| `apps/backend/alloy/start-with-app.sh`                         | Combined entrypoint: Alloy bg + Phoenix fg    |
| `apps/backend/alloy/start.sh`                                  | Standalone Alloy start script (dev use)       |
| `apps/backend/lib/cgraph_web/telemetry.ex`                     | Telemetry supervisor — all metric definitions |
| `infrastructure/grafana/dashboards/cgraph-cloud-overview.json` | Production dashboard (10 panels)              |
| `infrastructure/grafana/alerts/cgraph-alerts.yml`              | Alert rules (6 rules, 3 groups)               |
| `infrastructure/grafana/alloy-config.alloy`                    | Dev server Alloy config (includes Loki)       |
| `infrastructure/grafana/alloy-env.example`                     | Template for Alloy environment variables      |

---

## 🔧 Backend Metrics (Elixir/Phoenix)

### How Metrics Work

CGraph uses `TelemetryMetricsPrometheus.Core` to expose a Prometheus-compatible `/metrics` endpoint.
The telemetry supervisor is defined in `CGraphWeb.Telemetry` and started in the application
supervision tree.

```elixir
# lib/cgraph_web/telemetry.ex — Supervisor
children = [
  {TelemetryMetricsPrometheus.Core, [
    metrics: metrics(),
    name: :cgraph_prometheus_metrics
  ]}
]
Supervisor.init(children, strategy: :one_for_one)
```

### Metrics Endpoint

```
GET /metrics
```

Returns Prometheus text format. Scraped by Alloy every 15 seconds in production.

### All Defined Metrics (64+)

**Phoenix HTTP:**

- `phoenix.endpoint.stop.duration` — Request duration (distribution + counter)
- `phoenix.router.dispatch.stop.duration` — Route dispatch time (summary)

**Ecto (Database):**

- `cgraph.repo.query.decode_time` — Result decode time
- `cgraph.repo.query.query_time` — Actual query execution time
- `cgraph.repo.query.queue_time` — Connection pool wait time
- `cgraph.repo.query.total_time` — Total query time

**Oban (Background Jobs):**

- `oban.job.stop.duration` — Job execution time (distribution + counter)
- `oban.job.exception.duration` — Failed job counter (counts exception events)

**Business:**

- `cgraph.messaging.message.sent.count` — Messages sent (by channel_type)
- `cgraph.rate_limiter.exceeded.count` — Rate limit violations (by tier, path)

**WebSocket / Channel:**

- `cgraph.websocket.connections.active` — Active WebSocket connections (gauge)
- `cgraph.websocket.connect.total` — Total connections established
- `cgraph.websocket.disconnect.total` — Disconnections (by reason)
- `cgraph.websocket.message.in.total` — Messages received (by event_type)
- `cgraph.websocket.message.out.total` — Messages sent (by event_type)
- `cgraph.channel.join.duration` — Channel join latency (distribution)

**Rate Limiter:**

- `cgraph.rate_limiter.check.total` — All rate limit checks (by tier, result)
- `cgraph.rate_limiter.check.duration` — Check latency (distribution)

**Security / Auth:**

- `cgraph.auth.login.success.total` — Successful logins (by method)
- `cgraph.auth.login.failure.total` — Failed logins (by method, reason)
- `cgraph.auth.token.created.total` — Tokens created (by type)
- `cgraph.auth.token.refreshed.total` — Token refreshes
- `cgraph.auth.token.revoked.total` — Token revocations (by reason)
- `cgraph.auth.account.locked.total` — Account lockouts (by reason)
- `cgraph.auth.account.unlocked.total` — Account unlocks

**BEAM VM:**

- `vm.memory.total` — Total VM memory (bytes)
- `vm.memory.processes` — Process memory (bytes)
- `vm.memory.ets` — ETS table memory (bytes)
- `vm.total_run_queue_lengths.total` — Scheduler run queue
- `vm.total_run_queue_lengths.cpu` — CPU run queue
- `vm.total_run_queue_lengths.io` — IO run queue
- `vm.system_counts.process_count` — BEAM process count

### Event Handler Groups

The telemetry supervisor attaches 6 handler groups:

1. **cgraph-phoenix-handlers** — Slow request logging (>100ms)
2. **cgraph-ecto-handlers** — Slow query logging (>100ms)
3. **cgraph-oban-handlers** — Failed job tracking
4. **cgraph-business-handlers** — Auth success/failure, messaging, rate limiting
5. **cgraph-websocket-handlers** — WebSocket connect/disconnect/message events
6. **cgraph-security-handlers** — Token lifecycle, account lockout events

### Adding New Metrics

1. Define the metric in `CGraphWeb.Telemetry.metrics/0`
2. If custom handling is needed, add a handler function and attach it in `init/1`
3. Emit telemetry events from your business logic:

```elixir
:telemetry.execute(
  [:cgraph, :your_module, :your_event],
  %{duration: duration},
  %{tag_key: "tag_value"}
)
```

4. Deploy — Alloy will automatically pick up new metrics from `/metrics`

> **Note:** `TelemetryMetricsPrometheus.Core` transforms metric names to Prometheus format: dots
> become underscores, and type suffixes are appended. For example, `cgraph.auth.login.success.total`
> → `cgraph_auth_login_success_total`. Distribution metrics get `_bucket`/`_sum`/`_count` suffixes.
> Use `curl localhost:4000/metrics` to verify actual metric names.

---

## 🚀 Grafana Alloy (Fly.io Sidecar)

### How It Works

Alloy runs as a background process inside the `app` machine on Fly.io (co-located with Phoenix).
This is required because Fly.io runs each process definition on a separate machine — a standalone
Alloy machine cannot reach `localhost:4000`.

```toml
# fly.toml
[processes]
  app = "/usr/local/bin/start-with-app.sh"  # starts Alloy bg + Phoenix fg
  pgbouncer = "/usr/local/bin/start-pgbouncer.sh"
```

The combined script (`alloy/start-with-app.sh`) starts Alloy in the background, then `exec`s the
Phoenix release as the foreground process. Alloy is optional — if `GRAFANA_CLOUD_*` secrets are not
set, only Phoenix starts.

### Required Fly.io Secrets

```bash
fly secrets set \
  GRAFANA_CLOUD_PROMETHEUS_URL="https://prometheus-prod-XX-prod-REGION.grafana.net/api/prom/push" \
  GRAFANA_CLOUD_PROMETHEUS_USER="YOUR_USER_ID" \
  GRAFANA_CLOUD_API_KEY="YOUR_API_KEY"
```

### Alloy Config Highlights

- Scrapes `localhost:4000/metrics` every 15s
- Adds labels: `environment=production`, `service=cgraph`, `fly_region`, `fly_app`
- WAL-based queue: 5000 capacity, truncate every 2h
- Self-monitoring dashboard on `:12345/metrics`
- Start script waits up to 30s for Phoenix `/health` before starting

### Troubleshooting Alloy

```bash
# Check Alloy process status
fly status -a cgraph-backend

# View Alloy logs
fly logs -a cgraph-backend | grep alloy

# SSH into machine to inspect
fly ssh console -a cgraph-backend -s -C "wget -qO- http://localhost:12345/metrics | head"

# Verify Phoenix metrics endpoint
fly ssh console -a cgraph-backend -s -C "wget -qO- http://localhost:4000/metrics | head"
```

---

## 📈 Grafana Cloud Dashboards

### Production Overview Dashboard

File: `infrastructure/grafana/dashboards/cgraph-cloud-overview.json`

**10 panels:**

1. HTTP Request Rate — `rate(phoenix_endpoint_stop_duration_milliseconds_count[5m])`
2. HTTP P99 Latency — `histogram_quantile(0.99, ...)`
3. Error Rate — 5xx percentage
4. WebSocket Active Connections — `cgraph_websocket_connections_active`
5. Rate Limiter — Allowed vs denied checks
6. Auth Attempts — Login success/failure rates
7. Ecto Query Time — P95 database latency
8. BEAM Memory — Total, processes, ETS
9. BEAM Run Queue Length — Scheduler run queue depth (lower is better)
10. Oban Jobs — Success/failure rates

### Import Dashboard

1. Go to `cgraphdev.grafana.net` → Dashboards → New → Import
2. Upload `infrastructure/grafana/dashboards/cgraph-cloud-overview.json`
3. Select `grafanacloud-prom` as the Prometheus datasource
4. Click Import

---

## 🚨 Alerting

### Grafana Cloud Alert Rules

File: `infrastructure/grafana/alerts/cgraph-alerts.yml`

| Alert                   | Condition              | Duration | Severity |
| ----------------------- | ---------------------- | -------- | -------- |
| High 5xx Error Rate     | Error rate > 1%        | 5 min    | Critical |
| High P99 Latency        | P99 > 500ms            | 5 min    | Warning  |
| Rate Limit Denial Spike | > 100 denials/min      | 3 min    | Warning  |
| Account Lockout Spike   | > 10 lockouts in 5 min | 1 min    | Critical |
| High BEAM Memory        | > 3 GB                 | 10 min   | Warning  |
| Slow DB Queries         | P95 > 100ms            | 5 min    | Warning  |

### Import Alert Rules

1. Go to `cgraphdev.grafana.net` → Alerting → Alert rules
2. Import `infrastructure/grafana/alerts/cgraph-alerts.yml`
3. Configure notification channels (email, Slack, PagerDuty) as needed

---

## 🔍 Logging

### Structured Logging (Backend)

CGraph uses structured JSON logging in production:

```elixir
# All logs include these metadata fields:
Logger.info("Message sent",
  user_id: user.id,
  channel_id: channel.id,
  message_type: "text"
)
# Output: {"message":"Message sent","user_id":"...","channel_id":"...","level":"info","timestamp":"...","service":"cgraph"}
```

### Viewing Logs

```bash
# Live logs
fly logs -a cgraph-backend

# Filter by process
fly logs -a cgraph-backend | grep "app\["     # Phoenix app
fly logs -a cgraph-backend | grep "alloy\["   # Alloy metrics
fly logs -a cgraph-backend | grep "pgbouncer"  # PgBouncer

# Search for errors
fly logs -a cgraph-backend | grep '"level":"error"'
```

---

## 📱 Health Checks

### Endpoints

| Endpoint      | Purpose                                                | Check Interval |
| ------------- | ------------------------------------------------------ | -------------- |
| `GET /health` | Liveness probe — always returns 200 if BEAM is running | 15s            |
| `GET /ready`  | Readiness probe — checks DB + Redis connectivity       | 5s             |

### Fly.io Configuration

```toml
# fly.toml
[[http_service.checks]]
  grace_period = "30s"
  interval = "15s"
  method = "GET"
  timeout = "3s"
  path = "/health"

[[http_service.checks]]
  grace_period = "15s"
  interval = "5s"
  method = "GET"
  timeout = "2s"
  path = "/ready"
```

---

## 📉 Performance Budgets

### Backend Performance Targets

| Metric                    | Target  | Alert Threshold |
| ------------------------- | ------- | --------------- |
| API Response Time (P95)   | < 200ms | > 500ms (P99)   |
| WebSocket Latency         | < 50ms  | > 100ms         |
| Database Query Time (P95) | < 50ms  | > 100ms         |
| Error Rate                | < 0.1%  | > 1%            |
| BEAM Memory               | < 2 GB  | > 3 GB          |

### Frontend Performance Targets

| Metric                          | Target  | Alert Threshold |
| ------------------------------- | ------- | --------------- |
| LCP (Largest Contentful Paint)  | < 2.5s  | > 4s            |
| INP (Interaction to Next Paint) | < 200ms | > 500ms         |
| CLS (Cumulative Layout Shift)   | < 0.1   | > 0.25          |
| Bundle Size (gzipped)           | < 200KB | > 300KB         |

---

## 🔄 Runbooks

### High Error Rate Response

1. Check recent deployments: `fly releases -a cgraph-backend`
2. View error logs: `fly logs -a cgraph-backend | grep '"level":"error"'`
3. Check database connections:
   `fly ssh console -a cgraph-backend -s -C "cat /etc/pgbouncer/pgbouncer.ini"`
4. Check Sentry for stack traces
5. Rollback if needed: `fly deploy --image <previous-image> -a cgraph-backend`

### High Latency Response

1. Check BEAM process count:
   `fly ssh console -C "bin/cgraph rpc :erlang.system_info(:process_count)"`
2. Check run queue: `fly ssh console -C "bin/cgraph rpc :erlang.statistics(:run_queue)"`
3. View slow query logs in Fly.io logs
4. Check Grafana Cloud Ecto dashboard panel
5. Scale if needed: `fly scale count app=2 -a cgraph-backend`

### Alloy Not Shipping Metrics

1. Check Alloy is running: `fly ssh console -C "ps aux | grep alloy"` (runs inside app machine)
2. Check Alloy logs: `fly logs -a cgraph-backend | grep alloy`
3. Verify secrets are set: `fly secrets list -a cgraph-backend` (need `GRAFANA_CLOUD_*`)
4. SSH in and check Alloy health: `wget -qO- http://localhost:12345/metrics | head`
5. Restart machine (Alloy shares machine with app):
   `fly machine restart <machine-id> -a cgraph-backend`

> **Note:** Fly.io processes share a machine — you cannot restart individual processes. Use
> `fly status -a cgraph-backend` to find the **app** machine ID, then restart it (Alloy restarts
> with the app).

### Database Connection Exhaustion

1. Check PgBouncer stats: `fly logs -a cgraph-backend | grep pgbouncer`
2. Check for crashed machines consuming stale connections (wait for timeout)
3. Restart PgBouncer machine: `fly machine restart <pgbouncer-machine-id> -a cgraph-backend`
4. If persistent, increase Postgres max connections or PgBouncer pool size

---

## 📚 Resources

- [Grafana Cloud Docs](https://grafana.com/docs/grafana-cloud/)
- [Grafana Alloy Docs](https://grafana.com/docs/alloy/latest/)
- [BEAM Telemetry](https://github.com/beam-telemetry/telemetry)
- [TelemetryMetricsPrometheus](https://hexdocs.pm/telemetry_metrics_prometheus_core/)
- [Sentry for Elixir](https://docs.sentry.io/platforms/elixir/)
- [Fly.io Metrics](https://fly.io/docs/reference/metrics/)

---

_Last updated: February 20, 2026_
