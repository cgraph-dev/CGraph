# CGraph Service Level Objectives (SLOs)

> Last updated: 2026-02-13

## Overview

SLOs define the reliability targets for CGraph's user-facing services. These follow the Google SRE
model: we measure **Service Level Indicators (SLIs)**, set **SLO targets**, and manage **error
budgets** to balance reliability with feature velocity.

## SLO Summary

| Service          | SLI                     | Target         | Measurement Window |
| ---------------- | ----------------------- | -------------- | ------------------ |
| API Availability | Success rate (non-5xx)  | **99.9%**      | 30 days rolling    |
| Message Delivery | p99 latency             | **< 1 second** | 5 min rolling      |
| Forum Feed       | p99 latency             | **< 200ms**    | 5 min rolling      |
| Search           | p99 latency             | **< 500ms**    | 5 min rolling      |
| WebSocket        | Connection success rate | **99.5%**      | 30 days rolling    |
| Auth             | Login p99 latency       | **< 300ms**    | 5 min rolling      |

## Detailed SLO Definitions

### 1. API Availability — 99.9%

**What it means**: 43.8 minutes of downtime allowed per month.

**SLI Formula**:

```
availability = 1 - (count(HTTP 5xx responses) / count(all HTTP responses))
```

**Measurement**: Prometheus recording rule `cgraph:api_availability:ratio_30d`

**Exclusions**:

- Health check endpoints (`/health`, `/ready`)
- Load test traffic (identified by `X-Load-Test` header)
- Planned maintenance windows (announced 48h in advance)

**Error Budget**:

- Monthly budget: 0.1% = ~43.8 minutes
- Burn rate alert at **14.4x** (critical) = 2% budget consumed in 1 hour
- Burn rate alert at **1x** sustained 30min (warning)

### 2. Message Delivery — p99 < 1 second

**What it means**: 99% of messages are delivered to recipients within 1 second of being sent.

**SLI Formula**:

```
delivery_latency = time(message_received_by_all_connected_recipients) - time(message_sent)
```

**Measurement**: Prometheus recording rule `cgraph:message_delivery:latency_p99`

**Includes**:

- API processing time
- Database write
- WebSocket broadcast to connected clients
- Phoenix PubSub fanout

**Does NOT include**:

- Push notification delivery (separate SLO)
- Offline user delivery (queued, not real-time)

### 3. Forum Feed — p99 < 200ms

**What it means**: Loading a forum's post feed completes in under 200ms for 99% of requests.

**SLI Formula**:

```
feed_latency = time(response_sent) - time(request_received)
```

**Measurement**: Prometheus recording rule `cgraph:forum_feed:latency_p99`

**Scope**: `GET /api/v1/forums/:id/posts` with default pagination (20 items).

### 4. Search — p99 < 500ms

**What it means**: Search queries return results within 500ms for 99% of requests.

**SLI Formula**:

```
search_latency = time(response_sent) - time(request_received)
```

**Measurement**: Prometheus recording rule `cgraph:search:latency_p99`

**Includes**:

- MeiliSearch query time
- PostgreSQL fallback time (when MeiliSearch is unavailable)
- Result formatting and response serialization

### 5. WebSocket Connection — 99.5%

**What it means**: WebSocket upgrade requests succeed 99.5% of the time.

**SLI**: `successful_ws_connections / total_ws_connection_attempts`

**Note**: Lower target than HTTP because WebSocket connections are more sensitive to network
conditions, and clients automatically reconnect.

### 6. Auth Login — p99 < 300ms

**What it means**: Login endpoint responds within 300ms for 99% of requests.

**Includes**: bcrypt verification, JWT generation, session setup.

## Error Budget Policy

### Budget Remaining > 50%

- Normal feature development velocity
- Deploy at will
- Standard code review process

### Budget Remaining 25-50%

- Prioritize reliability improvements
- Extra review for risky changes
- Consider feature flag protection for new features

### Budget Remaining 10-25%

- **Freeze non-critical deployments**
- Focus engineering on reliability
- Daily error budget review in standup

### Budget Remaining < 10%

- **Emergency: freeze all deployments**
- All hands on reliability
- Post-incident review required before resuming deploys
- Escalate to team lead

## Alerting Rules

Alerts are defined in `infrastructure/prometheus/rules/cgraph-slo-rules.yml`.

| Alert                                | Condition                  | Severity | Response                              |
| ------------------------------------ | -------------------------- | -------- | ------------------------------------- |
| `CGraphHighErrorBudgetBurn_Critical` | Burn rate > 14.4x for 2min | Critical | Page on-call, investigate immediately |
| `CGraphHighErrorBudgetBurn_Warning`  | Burn rate > 1x for 30min   | Warning  | Investigate within 1 hour             |
| `CGraphErrorBudgetExhausted`         | Budget < 10%               | Critical | Freeze deployments                    |
| `CGraphMessageLatencySLOBreach`      | p99 > 1s for 5min          | Warning  | Check DB, Redis, WebSocket            |
| `CGraphForumFeedLatencySLOBreach`    | p99 > 200ms for 5min       | Warning  | Check DB queries, cache               |
| `CGraphSearchLatencySLOBreach`       | p99 > 500ms for 5min       | Warning  | Check MeiliSearch, fallback           |

## Dashboards

- **Grafana SLO Dashboard**: `infrastructure/grafana/provisioning/dashboards/json/cgraph-slo.json`
- **Error Budget Dashboard**:
  `infrastructure/grafana/provisioning/dashboards/json/cgraph-backend.json` (includes error budget
  panels)

## Review Cadence

| Frequency | Activity                                      |
| --------- | --------------------------------------------- |
| Daily     | Check error budget burn rate in Grafana       |
| Weekly    | Review SLO compliance in team standup         |
| Monthly   | Full SLO review, adjust targets if needed     |
| Quarterly | Formal SLO review, update targets and budgets |

## References

- [Google SRE Book — SLOs](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Workbook — Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
- Prometheus rules: `infrastructure/prometheus/rules/cgraph-slo-rules.yml`

---

## Disaster Recovery — RTO/RPO Targets

| Component         | RPO (Recovery Point Objective) | RTO (Recovery Time Objective) | Strategy                                               |
| ----------------- | ------------------------------ | ----------------------------- | ------------------------------------------------------ |
| PostgreSQL        | **1 hour**                     | **4 hours**                   | WAL archiving + daily snapshots (Fly.io managed)       |
| Redis/Cachex      | **N/A** (ephemeral)            | **15 minutes**                | Warm restart; cache rebuilds from DB on miss           |
| File uploads (S3) | **0** (durability: 11 9s)      | **< 1 hour**                  | S3 cross-region replication                            |
| Application tier  | **N/A** (stateless)            | **5 minutes**                 | Fly.io multi-region; auto-restart on health check fail |
| Secrets/Config    | **0** (version controlled)     | **15 minutes**                | Fly.io secrets + Git-stored non-secret configs         |

### Recovery Procedures

1. **Database restore**: `fly postgres restore --app cgraph-db --target-time <ISO8601>`
2. **Full redeploy**: `fly deploy --app cgraph-backend --strategy canary`
3. **Cache warm-up**: Automatic on first request; `CGraph.Cache.CacheWarmer.warm_on_boot/0` preloads hot data
4. **DNS failover**: Cloudflare auto-failover configured with 30s health checks
5. **DR failover**: `infrastructure/scripts/dr_failover.sh` — 7-step automated failover with `--auto` mode
6. **Zero-downtime migration**: `infrastructure/scripts/zero_downtime_migration.sh` — pre-flight + backup + migrate + rollback
7. **Blue-green deploy**: `infrastructure/scripts/blue_green_deploy.sh` — staged deploy with health check gate

### Infrastructure Modules (Phase 38)

| Module | Purpose | SLO Relevance |
| --- | --- | --- |
| `CGraph.Monitoring.MetricsCollector` | Business metrics + SLO tracking (`update_slo/3`, `check_slo/1`) | Direct SLO measurement |
| `CGraph.Monitoring.Alerting` | Threshold-based alerts (Slack + PagerDuty) | SLO breach notifications |
| `CGraph.Monitoring.HealthDashboard` | Aggregated health status across all components | Availability SLI |
| `CGraph.Operations.CapacityPlanner` | Linear regression forecasting, scaling recommendations | Proactive SLO protection |
| `CGraph.Operations.DisasterRecovery` | Failover/promote/restore procedures | RTO compliance |
| `CGraph.Operations.PerformanceProfiler` | Flame graph, slow query report, memory analysis | Latency SLI debugging |

### Testing Schedule

| Test                     | Frequency  | Last Tested | Owner    |
| ------------------------ | ---------- | ----------- | -------- |
| Database restore drill   | Quarterly  | Not yet     | Backend  |
| Canary deploy rollback   | Monthly    | Not yet     | Platform |
| Full failover simulation | Biannually | Not yet     | SRE      |
