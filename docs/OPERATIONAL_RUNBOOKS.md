# CGraph Operational Runbooks

> **Version: 1.1.0** | Last Updated: March 2026

Step-by-step guides for common operational tasks and incident response.

---

## Table of Contents

1. [Deployment Procedures](#deployment-procedures)
2. [Incident Response](#incident-response)
3. [Database Operations](#database-operations)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Rollback Procedures](#rollback-procedures)
6. [On-Call Playbook](#on-call-playbook)
7. [Redis Failure](#redis-failure)
8. [MeiliSearch Failure](#meilisearch-failure)
9. [Circuit Breaker Management](#circuit-breaker-management)
10. [SLO & Error Budget](#slo--error-budget)
11. [Operations Toolkit](#operations-toolkit)

---

## Operations Toolkit

> Code modules in `apps/backend/lib/cgraph/operations/` provide automated
> operational procedures. See individual module docs for full API details.

### Runbook Framework

**Module:** [`CGraph.Operations.Runbook`](../apps/backend/lib/cgraph/operations/runbook.ex)

Executable runbook steps as functions with prerequisite checks and automatic rollback.

**Built-in runbooks:**

| Runbook              | Description                              | Steps |
| -------------------- | ---------------------------------------- | ----- |
| `:scale_up`          | Increase Fly.io instance count           | 4     |
| `:scale_down`        | Decrease instances with connection drain | 4     |
| `:rotate_credentials`| Rotate secrets and API keys              | 4     |
| `:clear_cache`       | Flush Redis + ETS caches                 | 4     |

```elixir
# Execute a built-in runbook
{:ok, result} = CGraph.Operations.Runbook.execute(:scale_up, %{target_count: 4})

# List available runbooks
CGraph.Operations.Runbook.list_runbooks()

# Dry-run validation
{:ok, steps} = CGraph.Operations.Runbook.dry_run(:scale_up)
```

### Capacity Planner

**Module:** [`CGraph.Operations.CapacityPlanner`](../apps/backend/lib/cgraph/operations/capacity_planner.ex)

Growth forecasting (linear regression) and scaling recommendations.

```elixir
# Forecast growth from historical data
{:ok, forecast} = CGraph.Operations.CapacityPlanner.forecast_growth(:daily_active_users,
  data: historical_data_points)

# Get scaling recommendations
recs = CGraph.Operations.CapacityPlanner.recommend_scaling(%{
  cpu_percent: 72, memory_percent: 68, db_connections_percent: 45
})

# Full capacity report
report = CGraph.Operations.CapacityPlanner.generate_report()
```

### Disaster Recovery

**Module:** [`CGraph.Operations.DisasterRecovery`](../apps/backend/lib/cgraph/operations/disaster_recovery.ex)
**Script:** [`infrastructure/scripts/dr_failover.sh`](../infrastructure/scripts/dr_failover.sh)

Automated failover with manual verification gates.

```elixir
# Full failover sequence (Elixir)
{:ok, result} = CGraph.Operations.DisasterRecovery.initiate_failover(%{
  primary_app: "cgraph-db",
  replica_app: "cgraph-db-replica",
  backend_app: "cgraph-backend"
})

# Verify replica health
{:ok, status} = CGraph.Operations.DisasterRecovery.verify_replica(%{
  primary_app: "cgraph-db",
  replica_app: "cgraph-db-replica"
})

# Restore from backup
{:ok, result} = CGraph.Operations.DisasterRecovery.restore_from_backup(
  "backup-id", %{source_app: "cgraph-db", target_app: "cgraph-db-restored"})
```

```bash
# Shell-based failover (interactive)
./infrastructure/scripts/dr_failover.sh

# Automated failover (CI/scripts)
./infrastructure/scripts/dr_failover.sh --auto

# Dry run (validate only)
./infrastructure/scripts/dr_failover.sh --dry-run
```

### Performance Profiler

**Module:** [`CGraph.Operations.PerformanceProfiler`](../apps/backend/lib/cgraph/operations/performance_profiler.ex)

CPU profiling, slow query analysis, and memory inspection. Complements
`CGraph.Performance.QueryOptimizer` (per-query EXPLAIN) and `CGraph.Performance.SLO` (runtime tracking).

```elixir
# CPU profiling with flame graph data
{:ok, profile} = CGraph.Operations.PerformanceProfiler.flame_graph(fn ->
  MyApp.heavy_computation()
end, profiler: :eprof, top: 20)

# Slow query report from pg_stat_statements
{:ok, report} = CGraph.Operations.PerformanceProfiler.slow_query_report(
  limit: 20, sort_by: :mean_time, min_calls: 10)

# BEAM memory analysis
{:ok, analysis} = CGraph.Operations.PerformanceProfiler.memory_analysis(
  top_processes: 20)
```

---

## Deployment Procedures

### Web App Deployment (Vercel)

**Trigger:** Push to `main` branch

**Automatic Steps:**

1. CI runs (lint, typecheck, test, build)
2. Vercel builds preview
3. Preview URL available in PR
4. Merge to main triggers production deploy

**Manual Verification:**

```bash
# 1. Check deployment status
curl -s https://app.cgraph.org/health | jq

# 2. Verify version
curl -s https://app.cgraph.org/api/version

# 3. Check error rates in Vercel dashboard
# https://vercel.com/cgraph/web/analytics
```

**Rollback:**

```bash
# Via Vercel CLI
vercel rollback --project=web

# Or via dashboard: Deployments → Previous → Promote to Production
```

---

### Backend Deployment (Fly.io)

**Trigger:** Push to `main` branch or manual deploy

**Pre-Deploy Checklist:**

- [ ] Migrations reviewed for backward compatibility
- [ ] Feature flags ready for gradual rollout
- [ ] Rollback plan documented

**Deploy Steps:**

```bash
cd apps/backend

# 1. Deploy to staging first
fly deploy --app cgraph-backend-staging

# 2. Run smoke tests
mix run priv/scripts/smoke_test.exs

# 3. Deploy to production
fly deploy

# 4. Run migrations (if needed)
fly ssh console -C "bin/cgraph eval 'CGraph.Release.migrate()'"
```

**Verify:**

```bash
# Check app health
fly status

# Check logs
fly logs --app cgraph

# Verify version
curl -s https://cgraph-backend.fly.dev/health
```

---

### Database Migration

**Before Migrating:**

1. Test migration on staging with production-like data
2. Estimate migration duration
3. Schedule maintenance window if >5 minutes
4. Notify team in #backend

**Safe Migration Pattern:**

```elixir
# Always make migrations reversible
def change do
  # Add column with default (no lock)
  alter table(:users) do
    add :new_field, :string, default: ""
  end
end

# For large tables, use batches
def up do
  execute """
  ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb
  """
end
```

**Run Migration:**

```bash
# Staging
fly ssh console --app cgraph-staging \
  -C "bin/cgraph eval 'CGraph.Release.migrate()'"

# Production
fly ssh console --app cgraph \
  -C "bin/cgraph eval 'CGraph.Release.migrate()'"
```

**Rollback Migration:**

```bash
fly ssh console -C "bin/cgraph eval 'CGraph.Release.rollback(CGraph.Repo, 1)'"
```

---

## Incident Response

### Severity Levels

| Level    | Definition        | Response Time     | Examples                         |
| -------- | ----------------- | ----------------- | -------------------------------- |
| **SEV1** | Service down      | 15 minutes        | API unreachable, data loss       |
| **SEV2** | Major degradation | 30 minutes        | High error rates, slow responses |
| **SEV3** | Minor issue       | 4 hours           | Feature broken, non-critical bug |
| **SEV4** | Low priority      | Next business day | UI glitch, minor inconvenience   |

### SEV1 Incident Playbook

**1. Acknowledge (within 5 min)**

```
@here SEV1 incident declared: [brief description]
Incident Commander: [your name]
Status page: Updating now
```

**2. Assess**

- Check Fly.io dashboard: https://fly.io/apps/cgraph
- Check Vercel status: https://vercel.com/cgraph
- Check Postgres: `fly postgres connect -a cgraph-db`
- Check Redis: `fly ssh console -C "redis-cli ping"`

**3. Mitigate**

```bash
# Scale up if load-related
fly scale count 5

# Rollback if deploy-related
fly releases list
fly deploy --image registry.fly.io/cgraph:v1.2.3

# Enable maintenance mode
fly secrets set MAINTENANCE_MODE=true
```

**4. Communicate**

- Update status page every 15 minutes
- Post in #incidents channel
- Prepare customer communication if extended

**5. Resolve**

- Confirm service restored
- Run verification tests
- Update status page to "Resolved"

**6. Post-Incident**

- Create post-mortem document within 48 hours
- Schedule blameless review meeting
- Track action items

### Post-Mortem Template

Use this template (create in `docs/postmortems/YYYY-MM-DD-<incident-slug>.md`):

```markdown
# Post-Mortem: [Incident Title]

**Date**: YYYY-MM-DD **Duration**: HH:MM – HH:MM UTC (X hours Y minutes) **Severity**: P1 / P2 / P3
**Author**: [Name] **Status**: Draft / Reviewed / Finalized

## Summary

One-paragraph description of the incident and its impact.

## Impact

- **Users affected**: N / percentage
- **Revenue impact**: $X / none
- **Data loss**: Yes (describe) / No
- **SLO budget consumed**: X%

## Timeline (UTC)

| Time  | Event                   |
| ----- | ----------------------- |
| HH:MM | First alert fired       |
| HH:MM | On-call acknowledged    |
| HH:MM | Root cause identified   |
| HH:MM | Fix deployed            |
| HH:MM | Service fully recovered |

## Root Cause

Detailed technical explanation of what went wrong.

## Detection

How was the incident detected? Alert name, dashboard, user report?

**Time to detect (TTD)**: X minutes

## Resolution

Step-by-step description of what was done to resolve the incident.

**Time to resolve (TTR)**: X minutes

## Lessons Learned

### What went well

- Item

### What went poorly

- Item

### Where we got lucky

- Item

## Action Items

| Action                  | Owner  | Priority | Due Date   | Status |
| ----------------------- | ------ | -------- | ---------- | ------ |
| [Preventive action]     | [Name] | P1       | YYYY-MM-DD | Open   |
| [Detection improvement] | [Name] | P2       | YYYY-MM-DD | Open   |
| [Process improvement]   | [Name] | P3       | YYYY-MM-DD | Open   |

## References

- Relevant PRs, issues, dashboards, alerts, logs queries
```

---

### High Error Rate Alert

**Symptoms:** Error rate >1% for 5 minutes

**Investigation:**

```bash
# 1. Check recent logs
fly logs --app cgraph | grep -i error | tail -50

# 2. Check recent deploys
fly releases list | head -5

# 3. Check database connections
fly postgres connect -a cgraph-db -c "SELECT count(*) FROM pg_stat_activity;"

# 4. Check specific endpoints
curl -w "%{http_code}" https://cgraph-backend.fly.dev/api/v1/health
```

**Common Causes:** | Symptom | Likely Cause | Fix | |---------|--------------|-----| | 500 errors
spike after deploy | Bad code | Rollback | | Connection timeouts | DB overload | Scale DB or add
replicas | | Memory errors | Memory leak | Restart instances | | Rate limit errors | Traffic spike |
Scale up |

---

### Database Connection Exhaustion

**Symptoms:** "too many connections" errors

**Immediate Fix:**

```bash
# 1. Check active connections
fly postgres connect -a cgraph-db -c "
SELECT count(*), state
FROM pg_stat_activity
GROUP BY state;
"

# 2. Kill idle connections
fly postgres connect -a cgraph-db -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < now() - interval '10 minutes';
"

# 3. Restart app to reset connection pool
fly apps restart cgraph
```

**Long-term Fix:**

- Increase `pool_size` in config
- Add PgBouncer for connection pooling
- Optimize long-running queries

---

## Database Operations

### Backup and Restore

**Check Backup Status:**

```bash
fly postgres backup list -a cgraph-db
```

**Create Manual Backup:**

```bash
fly postgres backup create -a cgraph-db
```

**Restore from Backup:**

```bash
# List available backups
fly postgres backup list -a cgraph-db

# Restore (creates new database cluster)
fly postgres backup restore \
  -a cgraph-db \
  --backup-id <backup-id> \
  --target-app cgraph-db-restored
```

### Performance Investigation

**Slow Query Investigation:**

```sql
-- Enable pg_stat_statements if not enabled
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries
SELECT
  query,
  calls,
  total_exec_time / 1000 as total_seconds,
  mean_exec_time / 1000 as mean_seconds
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Table Bloat Check:**

```sql
SELECT
  schemaname,
  relname,
  n_dead_tup,
  n_live_tup,
  round(n_dead_tup::numeric / nullif(n_live_tup, 0) * 100, 2) as dead_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC
LIMIT 10;
```

**Run VACUUM if needed:**

```sql
VACUUM ANALYZE messages;
```

---

## Monitoring & Alerts

### Key Metrics

| Metric         | Warning | Critical | Action          |
| -------------- | ------- | -------- | --------------- |
| Error rate     | >0.5%   | >1%      | Check logs      |
| P95 latency    | >500ms  | >1000ms  | Scale/optimize  |
| CPU usage      | >70%    | >90%     | Scale up        |
| Memory usage   | >80%    | >95%     | Restart/scale   |
| DB connections | >80%    | >95%     | Kill idle/scale |
| Disk usage     | >70%    | >85%     | Cleanup/expand  |

### Setting Up Alerts

**Fly.io Metrics:**

```bash
# View current metrics
fly metrics

# Set up alert (via Fly dashboard)
# https://fly.io/apps/cgraph/monitoring
```

**Custom Alerting (via Telemetry):**

```elixir
# In application.ex
:telemetry.attach(
  "error-rate-alert",
  [:phoenix, :endpoint, :stop],
  &CGraph.Alerts.handle_request/4,
  nil
)
```

---

## Rollback Procedures

### Web App Rollback (Vercel)

```bash
# Option 1: CLI
vercel rollback --project=web

# Option 2: Dashboard
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "..." → "Promote to Production"
```

### Backend Rollback (Fly.io)

```bash
# 1. List releases
fly releases list

# 2. Identify last working version
# Look for version before issue started

# 3. Rollback to specific image
fly deploy --image registry.fly.io/cgraph:v123

# 4. If migration needs rollback
fly ssh console -C "bin/cgraph eval 'CGraph.Release.rollback(CGraph.Repo, 1)'"
```

### Feature Flag Rollback

```elixir
# Disable feature via console
fly ssh console

# In IEx
iex> CGraph.FeatureFlags.disable(:new_feature)
:ok
```

---

## On-Call Playbook

### On-Call Responsibilities

1. **Monitor** alerts during shift
2. **Acknowledge** pages within 5 minutes
3. **Escalate** if unable to resolve within 30 minutes
4. **Document** all incidents
5. **Handoff** to next on-call with status update

### Escalation Path

| Level | Contact          | When                       |
| ----- | ---------------- | -------------------------- |
| L1    | On-call engineer | First responder            |
| L2    | Team lead        | After 30 min or SEV1       |
| L3    | CTO              | SEV1 > 1 hour or data loss |

### Shift Handoff Template

```
# On-Call Handoff

## Active Issues
- None / [list any ongoing issues]

## Recent Incidents
- [date] SEV3: Brief description, resolved

## Upcoming Risks
- Deploy scheduled for [date]
- Maintenance window: [date]

## Notes for Next On-Call
- [Any context needed]
```

---

## Emergency Contacts

| Role           | Contact             | Availability   |
| -------------- | ------------------- | -------------- |
| On-Call        | PagerDuty           | 24/7           |
| Backend Lead   | Slack @backend-lead | Business hours |
| Security       | security@cgraph.app | 24/7 for SEV1  |
| Fly.io Support | support@fly.io      | 24/7           |
| Vercel Support | support@vercel.com  | Business hours |

---

<sub>**CGraph Operational Runbooks** • Version 1.1.0 • Last updated: March 2026</sub>

---

## Redis Failure

### Symptoms

- `CGraph.Redis.circuit_status()` returns `:blown`
- Increased latency on cached endpoints
- Rate limiting stops (graceful degradation to ETS)

### Automatic Mitigation

The Fuse circuit breaker opens after 5 consecutive failures (30s auto-reset):

- Cache misses fall through to database (~2-5x latency increase)
- Rate limiting falls back to per-node ETS counters
- Leaderboards temporarily unavailable
- Phoenix PubSub uses pg2, NOT Redis — real-time unaffected

### Manual Resolution

```bash
# Check circuit breaker status
fly ssh console -a cgraph-backend -C "bin/cgraph rpc 'CGraph.Redis.circuit_status()'"

# After Redis recovers, force-reset the circuit breaker
fly ssh console -a cgraph-backend -C "bin/cgraph rpc 'CGraph.Redis.reset_circuit()'"

# Check Redis health
fly ssh console -a cgraph-backend -C "bin/cgraph rpc 'CGraph.Redis.ping()'"

# Check Redis memory usage
fly ssh console -a cgraph-backend -C "bin/cgraph rpc 'CGraph.Redis.info(\"memory\")'"
```

---

## MeiliSearch Failure

### Symptoms

- Search latency p99 > 500ms (Prometheus alert: `CGraphSearchLatencySLOBreach`)
- MeiliSearch health check failing

### Automatic Mitigation

Search falls back to PostgreSQL ILIKE queries automatically. Users see slower results (~100-400ms)
but search remains functional.

### Manual Resolution

```bash
# Check MeiliSearch health
curl -s http://localhost:7700/health

# Restart MeiliSearch
fly machine restart -a cgraph-meilisearch

# Reindex after recovery
fly ssh console -a cgraph-backend -C "bin/cgraph rpc 'Mix.Tasks.Search.Reindex.run([])'"
```

### Search Performance by Mode

| Mode                | p50 Latency | p99 Latency | Fuzzy Search    |
| ------------------- | ----------- | ----------- | --------------- |
| MeiliSearch         | ~15ms       | ~50ms       | Yes             |
| PostgreSQL fallback | ~80ms       | ~400ms      | No (ILIKE only) |

---

## Circuit Breaker Management

### Active Circuit Breakers

| Name                     | Type         | Protects                      | Auto-Reset   |
| ------------------------ | ------------ | ----------------------------- | ------------ |
| `:redis_circuit_breaker` | Fuse         | Redis commands                | 30 seconds   |
| HTTP Middleware CB       | Tesla/Fuse   | External HTTP APIs            | 30 seconds   |
| `CGraph.CircuitBreaker`  | Fuse wrapper | Generic (install per service) | Configurable |

### Deprecated (scheduled for removal in v2.0)

- `CGraph.Services.CircuitBreaker` — GenServer-based, zero callers
- `CGraph.Performance.CircuitBreaker` — ETS-based, zero callers

### Commands

```elixir
# Check Redis circuit
CGraph.Redis.circuit_status()  # :ok | :blown | {:error, :not_found}

# Reset Redis circuit
CGraph.Redis.reset_circuit()

# Generic circuit breaker
CGraph.CircuitBreaker.status(:service_name)  # :ok | :blown
CGraph.CircuitBreaker.reset(:service_name)
```

---

## SLO & Error Budget

### Quick Status Check

1. Open Grafana SLO dashboard
2. Check `cgraph:api_error_budget:remaining` metric
3. Check burn rate: `cgraph:api_error_budget:burn_rate_1h`

### Decision Matrix

| Budget Remaining | Action                      |
| ---------------- | --------------------------- |
| > 50%            | Normal development          |
| 25-50%           | Prioritize reliability      |
| 10-25%           | Freeze non-critical deploys |
| < 10%            | **FREEZE ALL DEPLOYS**      |

### SLO Targets

| Service              | Target  | Alert Threshold                                        |
| -------------------- | ------- | ------------------------------------------------------ |
| API Availability     | 99.9%   | Burn rate > 14.4x (critical), > 1x sustained (warning) |
| Message Delivery p99 | < 1s    | > 1s for 5min                                          |
| Forum Feed p99       | < 200ms | > 200ms for 5min                                       |
| Search p99           | < 500ms | > 500ms for 5min                                       |

See [SLO_DOCUMENT.md](SLO_DOCUMENT.md) for full details.
