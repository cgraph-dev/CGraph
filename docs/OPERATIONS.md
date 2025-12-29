# CGraph Operations Guide

> Keep the lights on. Make it boring.  
> — The best compliment for any ops team

This document covers day-to-day operations, maintenance procedures, troubleshooting, and keeping CGraph running smoothly in production.

---

## Table of Contents

1. [Daily Health Checks](#daily-health-checks)
2. [Weekly Maintenance](#weekly-maintenance)
3. [Monthly Tasks](#monthly-tasks)
4. [Quarterly Reviews](#quarterly-reviews)
5. [Log Analysis](#log-analysis)
6. [Performance Troubleshooting](#performance-troubleshooting)
7. [Database Maintenance](#database-maintenance)
8. [Security Operations](#security-operations)
9. [GDPR Compliance](#gdpr-compliance)
10. [User Support Procedures](#user-support-procedures)
11. [Disaster Recovery](#disaster-recovery)

---

## Daily Health Checks

### Morning Checklist (5 minutes)

Run these checks every morning (or automate with a cron job):

```bash
#!/bin/bash
# scripts/daily-health-check.sh

echo "=== CGraph Daily Health Check ==="
echo "Date: $(date)"
echo ""

# 1. Check all Fly machines are running
echo "📦 Fly.io Machine Status:"
fly status -a cgraph-api

# 2. Check API health endpoint
echo ""
echo "🏥 API Health:"
curl -s https://api.cgraph.org/api/health | jq

# 3. Check database connections
echo ""
echo "🗄️ Database Status:"
fly postgres connect -a cgraph-db -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"

# 4. Check Redis
echo ""
echo "🔴 Redis Status:"
fly redis status cgraph-redis

# 5. Check error rate in last 24h (from logs)
echo ""
echo "❌ Errors in last 24h:"
fly logs -a cgraph-api | grep -c "ERROR" | tail -1

# 6. Quick metrics summary
echo ""
echo "📊 Quick Metrics:"
echo "- Active WebSocket connections: $(curl -s https://api.cgraph.org/api/health | jq -r '.websocket_count // "N/A"')"
echo "- Database pool usage: $(curl -s https://api.cgraph.org/api/health | jq -r '.db_pool_usage // "N/A"')"

echo ""
echo "=== Health Check Complete ==="
```

### Automated Health Monitoring

We use Fly.io's built-in health checks plus external monitoring:

```toml
# In fly.toml
[[services.http_checks]]
  interval = 10000          # 10 seconds
  grace_period = "10s"
  method = "GET"
  path = "/api/health"
  protocol = "http"
  restart_limit = 3         # Restart after 3 failed checks
  timeout = 2000
  tls_skip_verify = false
```

**External monitoring with Better Stack (formerly Logtail):**
- Ping `/api/health` every minute
- Alert if response time > 2s
- Alert if status != 200

---

## Weekly Maintenance

### Monday Tasks

1. **Review error trends**
   ```bash
   # Check Sentry for new issues
   # Look for patterns, recurring errors
   # Prioritize fixes for next sprint
   ```

2. **Check disk usage**
   ```bash
   fly ssh console -a cgraph-api -c "df -h"
   fly postgres connect -a cgraph-db -c "SELECT pg_database_size('cgraph');"
   ```

3. **Review slow queries**
   ```sql
   -- Top 10 slowest queries this week
   SELECT query, 
          calls,
          mean_time,
          total_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

### Wednesday Tasks

4. **Dependency security scan**
   ```bash
   # Backend
   cd apps/backend
   mix sobelow --config
   mix deps.audit
   
   # Frontend
   pnpm audit
   ```

### Friday Tasks

5. **Backup verification**
   ```bash
   # List recent backups
   fly postgres list-snapshots -a cgraph-db
   
   # Verify latest backup is < 24h old
   ```

6. **Capacity planning review**
   ```bash
   # Check resource usage trends
   fly scale show -a cgraph-api
   fly postgres show -a cgraph-db
   ```

---

## Monthly Tasks

### First Week of Month

1. **Update dependencies**
   ```bash
   # Backend
   cd apps/backend
   mix deps.update --all
   mix test
   
   # Frontend
   pnpm update
   pnpm test
   ```

2. **Rotate secrets (if policy requires)**
   ```bash
   # Generate new secrets
   NEW_SECRET=$(mix phx.gen.secret)
   
   # Update in Fly
   fly secrets set SECRET_KEY_BASE=$NEW_SECRET -a cgraph-api
   ```

3. **Review access logs**
   - Check for unusual access patterns
   - Verify no unauthorized admin access
   - Review API rate limit hits

### Third Week of Month

4. **Full disaster recovery test**
   - Test backup restoration to staging
   - Verify data integrity
   - Document any issues

5. **Security patch review**
   - Check Erlang/Elixir security advisories
   - Review OWASP Top 10 for any applicable issues
   - Update WAF rules if needed

---

## Quarterly Reviews

### Q1, Q2, Q3, Q4 Tasks

1. **Full infrastructure audit**
   - Review all Fly.io costs
   - Right-size machines based on actual usage
   - Archive old data if applicable

2. **Dependency major version updates**
   - Plan Phoenix version upgrades
   - Test in staging thoroughly
   - Schedule maintenance window

3. **Security penetration test**
   - Internal or external pentest
   - Fix critical findings immediately
   - Plan remediation for medium/low

4. **Documentation review**
   - Update all docs for accuracy
   - Remove outdated information
   - Add new sections as needed

---

## Log Analysis

### Accessing Logs

```bash
# Real-time logs
fly logs -a cgraph-api

# Filter by level
fly logs -a cgraph-api | grep "ERROR"

# Specific time range (use log aggregator for this)
```

### Common Log Patterns

**Normal operation:**
```
[info] GET /api/health - 200 in 2ms
[info] WebSocket connected: user_id=123
[debug] Query OK db=2.1ms queue=0.5ms
```

**Warning signs:**
```
[warn] Database pool exhausted, waiting for connection
[warn] Rate limit hit for IP 1.2.3.4
[warn] JWT token expired for user_id=456
```

**Errors requiring attention:**
```
[error] Postgrex.Protocol disconnected
[error] ** (FunctionClauseError) no function clause matching
[error] SIGTERM received, shutting down
```

### Log Aggregation with Fly.io + Logtail

```toml
# In fly.toml
[experimental]
  cmd = ["/app/bin/server"]

[env]
  LOG_LEVEL = "info"  # debug in staging
```

Send to Logtail (Better Stack):
```bash
fly logs | logtail-agent
```

Or use Vector for more complex pipelines:
```toml
[sources.fly_logs]
type = "fly_logs"

[sinks.logtail]
type = "http"
inputs = ["fly_logs"]
uri = "https://in.logs.betterstack.com"
encoding.codec = "json"
```

---

## Performance Troubleshooting

### Slow Response Times

**Step 1: Identify the bottleneck**

```elixir
# Add timing to your controller
def index(conn, params) do
  {time_db, data} = :timer.tc(fn -> MyApp.Repo.all(MyQuery) end)
  {time_render, result} = :timer.tc(fn -> render(conn, "index.json", data: data) end)
  
  Logger.info("DB: #{time_db/1000}ms, Render: #{time_render/1000}ms")
  result
end
```

**Step 2: Check database**

```sql
-- Currently running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Kill a stuck query
SELECT pg_cancel_backend(pid);
```

**Step 3: Check for N+1 queries**

```elixir
# Bad - N+1
posts = Repo.all(Post)
Enum.map(posts, fn post -> post.author.name end)  # Hits DB for each post

# Good - Preload
posts = Repo.all(from p in Post, preload: [:author])
Enum.map(posts, fn post -> post.author.name end)  # Single query
```

### High Memory Usage

**Step 1: Check for leaks**

```bash
fly ssh console -a cgraph-api
/app/bin/cgraph remote

# In IEx
:erlang.memory()
```

**Step 2: Check for large processes**

```elixir
# Find processes using most memory
:recon.proc_count(:memory, 10)

# Check specific process
:recon.info(pid, [:memory, :message_queue_len, :current_function])
```

**Step 3: Force garbage collection (temporary fix)**

```elixir
:erlang.garbage_collect()
```

### WebSocket Connection Issues

**Check connection count:**
```bash
fly ssh console -a cgraph-api -c "netstat -an | grep :8080 | grep ESTABLISHED | wc -l"
```

**Check Phoenix Channels:**
```elixir
# In IEx
Phoenix.PubSub.count_subscribers(CGraph.PubSub, "room:lobby")
```

**Common issues:**
- Too many connections → Scale up machines
- Connections dropping → Check for long GC pauses
- Can't connect → Check firewall, Cloudflare WebSocket settings

---

## Database Maintenance

### Regular Maintenance

```sql
-- Run weekly: Update statistics for query planner
ANALYZE;

-- Run monthly: Reclaim space from deleted rows
VACUUM ANALYZE;

-- Check table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Index Maintenance

```sql
-- Find unused indexes (safe to drop)
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey';

-- Find missing indexes (queries doing seq scans)
SELECT schemaname, tablename, seq_scan, idx_scan,
       round(100 * idx_scan / (seq_scan + idx_scan), 2) as idx_ratio
FROM pg_stat_user_tables
WHERE seq_scan + idx_scan > 100
ORDER BY seq_scan DESC;

-- Rebuild bloated indexes
REINDEX INDEX CONCURRENTLY index_name;
```

### Connection Management

```sql
-- Check connection usage
SELECT count(*) as total,
       count(*) FILTER (WHERE state = 'active') as active,
       count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity
WHERE datname = 'cgraph';

-- Kill idle connections over 10 minutes
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'cgraph'
  AND state = 'idle'
  AND state_change < now() - interval '10 minutes';
```

### Backup Procedures

**Automated backups (Fly.io handles this):**
- Continuous WAL archiving
- Daily full backups
- 7-day retention (configurable)

**Manual backup:**
```bash
fly postgres backup create -a cgraph-db
```

**Restore from backup:**
```bash
# List available snapshots
fly postgres list-snapshots -a cgraph-db

# Restore to a new database
fly postgres restore --snapshot-id <id> -a cgraph-db-restored

# Point your app at the new database
fly secrets set DATABASE_URL=<new-url> -a cgraph-api
```

---

## Security Operations

### Daily Security Checks

1. **Review auth failures**
   ```bash
   fly logs -a cgraph-api | grep "authentication failed" | tail -20
   ```

2. **Check for suspicious activity**
   - Unusual login locations
   - Brute force attempts
   - API abuse patterns

### Weekly Security Tasks

1. **Review rate limit hits**
   ```bash
   fly logs -a cgraph-api | grep "rate limit" | wc -l
   ```

2. **Check for new CVEs**
   - Erlang security advisories
   - Phoenix security announcements
   - Dependency vulnerabilities

### Incident Response for Security

**If you suspect a breach:**

1. **Isolate** - Don't delete evidence
   ```bash
   # Scale to 0 if critical
   fly scale count 0 -a cgraph-api
   ```

2. **Preserve logs**
   ```bash
   fly logs -a cgraph-api > incident-logs-$(date +%Y%m%d).txt
   ```

3. **Investigate**
   - What was accessed?
   - When did it start?
   - How did they get in?

4. **Remediate**
   - Rotate all secrets
   - Patch vulnerability
   - Reset affected user passwords

5. **Communicate**
   - Notify affected users (GDPR requires within 72h)
   - Update status page
   - Post-mortem

---

## GDPR Compliance

### Data Subject Access Request (DSAR)

When a user requests their data:

```elixir
defmodule CGraph.GDPR do
  @doc "Export all data for a user"
  def export_user_data(user_id) do
    %{
      user: get_user(user_id),
      messages: get_user_messages(user_id),
      posts: get_user_posts(user_id),
      friendships: get_user_friendships(user_id),
      settings: get_user_settings(user_id),
      exported_at: DateTime.utc_now()
    }
    |> Jason.encode!()
  end
  
  defp get_user(user_id) do
    Repo.get(User, user_id)
    |> Map.from_struct()
    |> Map.drop([:__meta__, :password_hash])
  end
  
  # ... other functions
end
```

**Process:**
1. Verify user identity (require logged-in request)
2. Generate export within 30 days (we aim for 24 hours)
3. Provide as downloadable JSON
4. Log the request

### Right to Deletion (Right to be Forgotten)

```elixir
def delete_user_data(user_id) do
  Repo.transaction(fn ->
    # Anonymize messages (keep for conversation integrity)
    from(m in Message, where: m.sender_id == ^user_id)
    |> Repo.update_all(set: [sender_id: nil, content: "[deleted]"])
    
    # Delete personal data
    Repo.delete_all(from s in UserSettings, where: s.user_id == ^user_id)
    Repo.delete_all(from n in Notification, where: n.user_id == ^user_id)
    Repo.delete_all(from f in Friendship, where: f.user_id == ^user_id or f.friend_id == ^user_id)
    
    # Delete or anonymize user record
    user = Repo.get!(User, user_id)
    user
    |> User.changeset(%{
      email: "deleted-#{user_id}@deleted.local",
      username: "deleted-#{user_id}",
      password_hash: nil,
      deleted_at: DateTime.utc_now()
    })
    |> Repo.update!()
  end)
end
```

**Process:**
1. Verify identity with extra confirmation
2. 30-day grace period (allow recovery)
3. After grace period, execute deletion
4. Retain only what's legally required (e.g., billing records)

### Data Retention Policy

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Active user data | While account active | Service provision |
| Deleted account | 30 days | Recovery period |
| Messages | 2 years | User expectation |
| Audit logs | 7 years | Legal requirement |
| Error logs | 90 days | Debugging |
| Analytics | 2 years | Service improvement |

---

## User Support Procedures

### Support Tiers

| Tier | Response Time | Examples |
|------|---------------|----------|
| **Critical** | < 1 hour | Can't access account, security breach |
| **High** | < 4 hours | Feature completely broken |
| **Normal** | < 24 hours | Bug, confusion, feature request |
| **Low** | < 72 hours | Questions, suggestions |

### Common Support Issues

**"I can't log in"**
1. Check if account exists: 
   ```elixir
   Repo.get_by(User, email: "user@example.com")
   ```
2. Check for too many failed attempts (rate limited)
3. Send password reset if requested
4. Check for account suspension

**"My messages aren't sending"**
1. Check WebSocket connection status
2. Verify recipient exists and isn't blocked
3. Check for rate limiting
4. Review error logs for that user

**"I want to delete my account"**
1. Direct to Settings → Account → Delete Account
2. Explain 30-day grace period
3. Process as GDPR deletion request

### Admin Tools

```elixir
# In IEx console
# Find user
user = CGraph.Accounts.get_user_by_email("user@example.com")

# Check recent activity
CGraph.Messaging.list_recent_messages(user.id, 10)

# Temporarily suspend (for abuse)
CGraph.Accounts.update_user(user, %{suspended_at: DateTime.utc_now()})

# Unlock rate-limited user
CGraph.RateLimiter.reset(user.id)
```

---

## Disaster Recovery

### Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Single machine failure | 0 (auto-recovered) | 0 |
| Region outage | 5 minutes | 0 |
| Database failure | 15 minutes | < 1 hour |
| Complete data center loss | 1 hour | < 1 hour |
| Accidental data deletion | 1 hour | < 24 hours |

### Disaster Recovery Procedures

**Scenario 1: Database corruption**

```bash
# 1. Stop the app
fly scale count 0 -a cgraph-api

# 2. List available backups
fly postgres list-snapshots -a cgraph-db

# 3. Create new database from backup
fly postgres create --snapshot-id <id> --name cgraph-db-restored

# 4. Update app to use new database
fly secrets set DATABASE_URL=<new-url> -a cgraph-api

# 5. Restart app
fly scale count 4 -a cgraph-api
```

**Scenario 2: Region outage**

```bash
# Fly.io automatically routes to healthy regions
# But if needed, manually shift traffic:

fly regions remove iad
fly regions add lhr syd

# Scale up in healthy regions
fly scale count 4 --region lhr
```

**Scenario 3: Accidental deployment broke everything**

```bash
# 1. Immediately roll back
fly deploy --image registry.fly.io/cgraph-api:<previous-sha>

# 2. If database migration was the issue:
fly ssh console -a cgraph-api
/app/bin/cgraph eval "CGraph.Release.rollback(CGraph.Repo, 20240115000000)"
```

### Runbook Locations

Keep these runbooks up to date and accessible:

- `/CGraph/docs/DEPLOYMENT.md` - Deploy procedures
- `/CGraph/docs/OPERATIONS.md` - This file
- Internal wiki - Incident post-mortems
- PagerDuty - Escalation policies

---

## Monitoring Dashboards

### Key Metrics to Watch

| Metric | Warning | Critical |
|--------|---------|----------|
| API response time (p99) | > 500ms | > 2000ms |
| Error rate | > 0.1% | > 1% |
| Database connections | > 80% pool | > 95% pool |
| Memory usage | > 70% | > 90% |
| WebSocket connections | > 5000/machine | > 8000/machine |
| Background job queue | > 1000 | > 10000 |

### Alerting Rules

**PagerDuty alerts for:**
- SEV1: Page immediately, any time
- SEV2: Page during business hours only
- SEV3+: Slack notification only

**Example alert configuration:**
```yaml
alerts:
  - name: HighErrorRate
    condition: error_rate > 0.01
    duration: 5m
    severity: sev2
    notify: pagerduty
    
  - name: DatabaseConnectionsHigh
    condition: db_connections > 0.9
    duration: 2m
    severity: sev1
    notify: pagerduty
    
  - name: SlowResponses
    condition: p99_latency > 2000
    duration: 10m
    severity: sev3
    notify: slack
```

---

## Operational Checklist

### Before Going on Vacation

- [ ] Hand off on-call to teammate
- [ ] Document any in-progress work
- [ ] Check no major deploys scheduled
- [ ] Ensure monitoring is working
- [ ] Share emergency contact info

### Before Major Feature Launch

- [ ] Load test the feature
- [ ] Feature flag in place
- [ ] Rollback plan documented
- [ ] Monitoring dashboards updated
- [ ] On-call team briefed
- [ ] Status page ready for updates

### After an Incident

- [ ] Write post-mortem within 48 hours
- [ ] Create tickets for action items
- [ ] Update runbooks if needed
- [ ] Share learnings with team
- [ ] Thank responders

---

*"The best incident is the one that never happens. The second best is the one we learn from."*

*Last updated: December 2024*
