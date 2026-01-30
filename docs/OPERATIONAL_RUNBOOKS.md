# CGraph Operational Runbooks

> **Version: 0.9.8** | Last Updated: January 2026

Step-by-step guides for common operational tasks and incident response.

---

## Table of Contents

1. [Deployment Procedures](#deployment-procedures)
2. [Incident Response](#incident-response)
3. [Database Operations](#database-operations)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Rollback Procedures](#rollback-procedures)
6. [On-Call Playbook](#on-call-playbook)

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
fly deploy --config fly.staging.toml

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
curl -s https://api.cgraph.org/health
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
curl -w "%{http_code}" https://api.cgraph.org/api/v1/health
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

<sub>**CGraph Operational Runbooks** • Version 0.9.8 • Last updated: January 2026</sub>
