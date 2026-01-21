# CGraph Monitoring Guide

> Production monitoring, observability, and alerting for CGraph

**Version:** 0.9.4 | **Last Updated:** January 2026

---

## 📊 Monitoring Stack Overview

CGraph uses a comprehensive observability stack:

| Component        | Purpose                    | Location                     |
| ---------------- | -------------------------- | ---------------------------- |
| Prometheus       | Metrics collection         | `infrastructure/prometheus/` |
| Grafana          | Visualization & dashboards | `infrastructure/grafana/`    |
| Sentry           | Error tracking             | Cloud service                |
| Fly.io Metrics   | Infrastructure monitoring  | Fly.io dashboard             |
| Vercel Analytics | Frontend performance       | Vercel dashboard             |

---

## 🔧 Backend Metrics (Elixir/Phoenix)

### Setup Prometheus

```elixir
# mix.exs
defp deps do
  [
    {:prometheus_ex, "~> 3.0"},
    {:prometheus_plugs, "~> 1.1"},
    {:prometheus_phoenix, "~> 1.3"}
  ]
end
```

### Configure Metrics Endpoint

```elixir
# lib/cgraph_web/endpoint.ex
plug PrometheusExporter
plug PrometheusPipelineInstrumenter

# lib/cgraph_web/router.ex
scope "/metrics" do
  pipe_through :api
  get "/", CGraphWeb.MetricsController, :index
end
```

### Key Metrics to Track

```elixir
# lib/cgraph/metrics.ex
defmodule CGraph.Metrics do
  use Prometheus.Metric

  # Request metrics
  def setup do
    Counter.declare([
      name: :http_requests_total,
      help: "Total HTTP requests",
      labels: [:method, :path, :status]
    ])

    Histogram.declare([
      name: :http_request_duration_seconds,
      help: "HTTP request latency",
      labels: [:method, :path],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
    ])

    # Business metrics
    Counter.declare([
      name: :messages_sent_total,
      help: "Total messages sent",
      labels: [:type] # dm, channel, forum
    ])

    Gauge.declare([
      name: :active_websocket_connections,
      help: "Current active WebSocket connections"
    ])
  end

  def record_message(type) do
    Counter.inc([name: :messages_sent_total, labels: [type]])
  end
end
```

### BEAM VM Metrics

```elixir
# Track Erlang VM stats
defmodule CGraph.BEAMMetrics do
  def collect do
    %{
      memory_total: :erlang.memory(:total),
      memory_processes: :erlang.memory(:processes),
      process_count: :erlang.system_info(:process_count),
      run_queue: :erlang.statistics(:run_queue),
      reductions: :erlang.statistics(:reductions)
    }
  end
end
```

---

## 🌐 Frontend Monitoring

### Vercel Web Analytics

Already integrated - view in Vercel dashboard:

- Core Web Vitals (LCP, FID, CLS)
- Page views and unique visitors
- Geographic distribution
- Device breakdown

### Custom Performance Tracking

```typescript
// src/lib/analytics.ts
export function trackPerformance() {
  if (typeof window === 'undefined') return;

  // Report Web Vitals
  import('web-vitals').then(({ onCLS, onFID, onLCP, onFCP, onTTFB }) => {
    onCLS((metric) => reportMetric('CLS', metric.value));
    onFID((metric) => reportMetric('FID', metric.value));
    onLCP((metric) => reportMetric('LCP', metric.value));
    onFCP((metric) => reportMetric('FCP', metric.value));
    onTTFB((metric) => reportMetric('TTFB', metric.value));
  });
}

function reportMetric(name: string, value: number) {
  // Send to your analytics backend
  fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify({ name, value, timestamp: Date.now() }),
  });
}
```

### Error Tracking with Sentry

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
});

// Wrap React app
export const SentryErrorBoundary = Sentry.ErrorBoundary;
```

---

## 📈 Grafana Dashboards

### Main Dashboard Configuration

```json
// infrastructure/grafana/dashboards/cgraph-main.json
{
  "title": "CGraph Overview",
  "panels": [
    {
      "title": "Request Rate",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(http_requests_total[5m])",
          "legendFormat": "{{method}} {{path}}"
        }
      ]
    },
    {
      "title": "Response Time P95",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "P95 Latency"
        }
      ]
    },
    {
      "title": "Active Connections",
      "type": "stat",
      "targets": [
        {
          "expr": "active_websocket_connections"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
          "legendFormat": "5xx Errors"
        }
      ]
    }
  ]
}
```

### Business Metrics Dashboard

```json
{
  "title": "CGraph Business Metrics",
  "panels": [
    {
      "title": "Messages per Minute",
      "expr": "rate(messages_sent_total[1m]) * 60"
    },
    {
      "title": "Active Users (DAU)",
      "expr": "count(increase(user_activity_total[24h]) > 0)"
    },
    {
      "title": "New Registrations",
      "expr": "increase(user_registrations_total[24h])"
    },
    {
      "title": "Forum Posts per Hour",
      "expr": "rate(forum_posts_total[1h]) * 3600"
    }
  ]
}
```

---

## 🚨 Alerting

### Prometheus Alert Rules

```yaml
# infrastructure/prometheus/alerts.yml
groups:
  - name: cgraph
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'High 5xx error rate ({{ $value | printf "%.2f" }} req/s)'

      - alert: SlowResponses
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: 'P95 latency above 2s ({{ $value | printf "%.2f" }}s)'

      - alert: LowDiskSpace
        expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'Disk space below 10%'

      - alert: HighMemoryUsage
        expr:
          (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes
          > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'Memory usage above 90%'

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'Database connections nearing limit'
```

### Alert Routing

```yaml
# infrastructure/prometheus/alertmanager.yml
route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack-notifications'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/xxx'
        channel: '#cgraph-alerts'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'xxx'
```

---

## 🔍 Logging

### Structured Logging (Backend)

```elixir
# config/config.exs
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :user_id, :trace_id]

# Usage
Logger.info("Message sent",
  user_id: user.id,
  channel_id: channel.id,
  message_type: "text"
)
```

### Log Aggregation

For production, logs flow to:

1. **Fly.io**: `flyctl logs -a cgraph-backend`
2. **Papertrail/Logflare**: For long-term storage
3. **Grafana Loki**: For log querying

```elixir
# config/runtime.exs
config :logger,
  backends: [:console, {LoggerBackendJsonLoki, :loki}]

config :logger, :loki,
  url: System.get_env("LOKI_URL"),
  labels: %{app: "cgraph", env: System.get_env("RELEASE_ENV")}
```

---

## 📱 Health Checks

### Backend Health Endpoint

```elixir
# lib/cgraph_web/controllers/health_controller.ex
defmodule CGraphWeb.HealthController do
  use CGraphWeb, :controller

  def index(conn, _params) do
    checks = %{
      status: "healthy",
      timestamp: DateTime.utc_now(),
      version: Application.spec(:cgraph, :vsn) |> to_string(),
      checks: %{
        database: check_database(),
        redis: check_redis(),
        memory: check_memory()
      }
    }

    status = if all_healthy?(checks.checks), do: 200, else: 503
    json(conn |> put_status(status), checks)
  end

  defp check_database do
    case Ecto.Adapters.SQL.query(CGraph.Repo, "SELECT 1") do
      {:ok, _} -> %{status: "healthy", latency_ms: 1}
      {:error, _} -> %{status: "unhealthy"}
    end
  end

  defp check_memory do
    memory = :erlang.memory(:total)
    max_memory = 512 * 1024 * 1024 # 512MB

    %{
      status: if(memory < max_memory, do: "healthy", else: "warning"),
      used_mb: round(memory / 1024 / 1024)
    }
  end
end
```

### Kubernetes/Fly.io Probes

```toml
# fly.toml
[[services]]
  internal_port = 4000

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    path = "/api/v1/health"
    method = "GET"

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
```

---

## 📉 Performance Budgets

### Frontend Performance Targets

| Metric                         | Target  | Alert Threshold |
| ------------------------------ | ------- | --------------- |
| LCP (Largest Contentful Paint) | < 2.5s  | > 4s            |
| FID (First Input Delay)        | < 100ms | > 300ms         |
| CLS (Cumulative Layout Shift)  | < 0.1   | > 0.25          |
| Time to Interactive            | < 3s    | > 5s            |
| Bundle Size (gzipped)          | < 200KB | > 300KB         |

### Backend Performance Targets

| Metric                    | Target  | Alert Threshold |
| ------------------------- | ------- | --------------- |
| API Response Time (P95)   | < 200ms | > 500ms         |
| API Response Time (P99)   | < 500ms | > 1s            |
| WebSocket Latency         | < 50ms  | > 100ms         |
| Database Query Time (P95) | < 50ms  | > 200ms         |
| Error Rate                | < 0.1%  | > 1%            |

---

## 🔄 Runbooks

### High Error Rate Response

1. Check recent deployments: `flyctl releases -a cgraph-backend`
2. View error logs: `flyctl logs -a cgraph-backend | grep ERROR`
3. Check database health: Query Fly.io dashboard
4. Rollback if needed: `flyctl deploy --image <previous-image>`

### High Latency Response

1. Check active connections:
   `flyctl ssh console -C "bin/cgraph rpc":erlang.system_info(:process_count).`
2. View slow queries in database
3. Check resource usage in Fly.io dashboard
4. Scale if needed: `flyctl scale count 2`

### Memory Leak Investigation

1. Get BEAM memory stats: `flyctl ssh console -C "bin/cgraph rpc :erlang.memory"`
2. Check process memory: `flyctl ssh console -C "bin/cgraph rpc :recon.proc_count(:memory, 10)"`
3. Analyze heap: `flyctl ssh console -C "bin/cgraph rpc :observer_cli.start"`

---

## 📚 Resources

- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [BEAM Telemetry](https://github.com/beam-telemetry/telemetry)
- [Sentry for Elixir](https://docs.sentry.io/platforms/elixir/)
- [Fly.io Metrics](https://fly.io/docs/reference/metrics/)

---

_Last updated: January 2026_
