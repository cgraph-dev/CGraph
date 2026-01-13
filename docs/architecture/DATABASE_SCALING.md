# CGraph Database Scaling Guide

> How to grow your database from 1,000 to 100,000,000 users

---

## Table of Contents

1. [Understanding Your Growth Stage](#understanding-your-growth-stage)
2. [Stage 1: Getting Started (0-10K Users)](#stage-1-getting-started-0-10k-users)
3. [Stage 2: Growing Pains (10K-100K Users)](#stage-2-growing-pains-10k-100k-users)
4. [Stage 3: Serious Scale (100K-1M Users)](#stage-3-serious-scale-100k-1m-users)
5. [Stage 4: Massive Scale (1M-10M Users)](#stage-4-massive-scale-1m-10m-users)
6. [Stage 5: Internet Scale (10M-100M+ Users)](#stage-5-internet-scale-10m-100m-users)
7. [Performance Optimization Techniques](#performance-optimization-techniques)
8. [Monitoring Database Health](#monitoring-database-health)
9. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## Understanding Your Growth Stage

Before scaling, understand where you are:

| Stage | Users | Typical DB Size | Monthly Messages | Server Config |
|-------|-------|-----------------|------------------|---------------|
| 1 | 0-10K | < 10 GB | < 1M | Single server |
| 2 | 10K-100K | 10-100 GB | 1-10M | Primary + 1 replica |
| 3 | 100K-1M | 100 GB - 1 TB | 10-100M | Primary + 2+ replicas |
| 4 | 1M-10M | 1-10 TB | 100M-1B | Sharded + replicas |
| 5 | 10M-100M+ | 10+ TB | 1B+ | Distributed sharding |

**Key Metrics to Track:**
- Queries per second (QPS)
- Average query latency (p50, p95, p99)
- Database CPU and memory usage
- Connection pool utilization
- Disk I/O wait time

---

## Stage 1: Getting Started (0-10K Users)

At this stage, keep it simple. A single PostgreSQL instance handles everything.

### Recommended Setup

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: cgraph
      POSTGRES_PASSWORD: secure_password_here
      POSTGRES_DB: cgraph_production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

### Server Specs
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **Connections**: 100 max

### Configuration (postgresql.conf)

```ini
# Memory
shared_buffers = 1GB              # 25% of RAM
effective_cache_size = 3GB        # 75% of RAM
work_mem = 16MB
maintenance_work_mem = 256MB

# Connections
max_connections = 100

# Write-Ahead Log
wal_buffers = 64MB
checkpoint_completion_target = 0.9

# Query Planner
random_page_cost = 1.1            # SSD optimization
effective_io_concurrency = 200
```

### What to Do Now

1. **Set up automated backups** - Daily, retained 7 days
2. **Add essential indexes** - We've included these in migrations
3. **Enable slow query logging** - Catch problems early

```sql
-- Enable slow query logging (queries > 1 second)
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

---

## Stage 2: Growing Pains (10K-100K Users)

You'll start noticing slowdowns during peak hours. Time for read replicas.

### The Problem

Your single database is handling:
- User logins (reads)
- Message sending (writes)
- Message loading (reads) ← This is 80% of your load
- Forum browsing (reads)
- Search queries (reads)

Most operations are reads. Let's offload them.

### Adding a Read Replica

**Step 1: Upgrade Primary Server**
```yaml
# Increase resources
postgres:
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 8G
```

**Step 2: Enable Replication on Primary**

```ini
# postgresql.conf on PRIMARY
wal_level = replica
max_wal_senders = 5
wal_keep_size = 1GB
```

```ini
# pg_hba.conf on PRIMARY (allow replica to connect)
host replication replicator replica_ip/32 scram-sha-256
```

**Step 3: Create Replication User**

```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secure_replication_password';
```

**Step 4: Set Up Replica**

```bash
# On the replica server
pg_basebackup -h primary_host -D /var/lib/postgresql/data -U replicator -P -R
```

**Step 5: Configure Ecto for Read Replicas**

```elixir
# config/prod.exs
config :cgraph, CGraph.Repo,
  url: System.get_env("DATABASE_URL"),
  pool_size: 20

config :cgraph, CGraph.RepoReplica,
  url: System.get_env("DATABASE_REPLICA_URL"),
  pool_size: 30

# lib/cgraph/repo_replica.ex
defmodule CGraph.RepoReplica do
  use Ecto.Repo,
    otp_app: :cgraph,
    adapter: Ecto.Adapters.Postgres,
    read_only: true
end
```

**Step 6: Route Reads to Replica**

```elixir
# For read-heavy queries, use the replica
def list_messages(conversation_id) do
  Message
  |> where(conversation_id: ^conversation_id)
  |> order_by([m], desc: m.inserted_at)
  |> limit(50)
  |> CGraph.RepoReplica.all()  # Read from replica
end

# For writes, always use primary
def create_message(attrs) do
  %Message{}
  |> Message.changeset(attrs)
  |> CGraph.Repo.insert()  # Write to primary
end
```

### Connection Pooling with PgBouncer

When you have many app servers, connection pooling becomes critical.

```yaml
# Add PgBouncer to docker-compose
pgbouncer:
  image: edoburu/pgbouncer:latest
  environment:
    DATABASE_URL: postgres://cgraph:password@postgres:5432/cgraph_production
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 50
  ports:
    - "6432:6432"
```

Connect your app to PgBouncer instead of PostgreSQL directly:

```bash
DATABASE_URL=ecto://cgraph:password@pgbouncer:6432/cgraph_production
```

---

## Stage 3: Serious Scale (100K-1M Users)

You need more than one replica, and caching becomes essential.

### Multiple Read Replicas

```
                    ┌─────────────────┐
                    │   PRIMARY       │
                    │   (Writes)      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ Replica1 │   │ Replica2 │   │ Replica3 │
       │ (Reads)  │   │ (Reads)  │   │ (Reads)  │
       └──────────┘   └──────────┘   └──────────┘
```

### Implementing Redis Caching

Cache frequently accessed data to reduce database load.

```elixir
# lib/cgraph/cache.ex
defmodule CGraph.Cache do
  @cache_ttl 300  # 5 minutes

  def get_user(user_id) do
    cache_key = "user:#{user_id}"
    
    case Redix.command(:redix, ["GET", cache_key]) do
      {:ok, nil} ->
        # Cache miss - fetch from database
        user = CGraph.Repo.get(User, user_id)
        if user do
          Redix.command(:redix, ["SETEX", cache_key, @cache_ttl, Jason.encode!(user)])
        end
        user
        
      {:ok, cached} ->
        # Cache hit
        Jason.decode!(cached, keys: :atoms)
    end
  end

  def invalidate_user(user_id) do
    Redix.command(:redix, ["DEL", "user:#{user_id}"])
  end
end
```

### What to Cache

| Data | TTL | Invalidation Trigger |
|------|-----|---------------------|
| User profiles | 5 min | Profile update |
| Group details | 10 min | Group settings change |
| Forum rankings | 1 min | New votes |
| Unread counts | Real-time | New messages (PubSub) |
| Permission checks | 5 min | Role changes |

### Partitioning Large Tables

Messages and posts grow fastest. Partition them by time:

```sql
-- Partition messages by month
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT,
    inserted_at TIMESTAMP NOT NULL
) PARTITION BY RANGE (inserted_at);

-- Create partitions for each month
CREATE TABLE messages_2025_01 PARTITION OF messages
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE messages_2025_02 PARTITION OF messages
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Automate partition creation with pg_partman extension
```

Benefits:
- Queries for recent messages only scan recent partitions
- Old partitions can be archived or dropped
- Maintenance (VACUUM) is faster on smaller tables

---

## Stage 4: Massive Scale (1M-10M Users)

Time for horizontal sharding. One database can't handle everything.

### Sharding Strategy

We'll shard by `user_id` - this keeps all of a user's data together.

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROUTER / COORDINATOR                        │
│                    (Determines which shard)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │ Shard 0 │         │ Shard 1 │         │ Shard 2 │
   │ Users   │         │ Users   │         │ Users   │
   │ A-H     │         │ I-P     │         │ Q-Z     │
   └─────────┘         └─────────┘         └─────────┘
```

### Implementing Sharding in Elixir

```elixir
# lib/cgraph/shard_router.ex
defmodule CGraph.ShardRouter do
  @shards [
    CGraph.Repo.Shard0,
    CGraph.Repo.Shard1,
    CGraph.Repo.Shard2,
    CGraph.Repo.Shard3
  ]
  
  def repo_for_user(user_id) do
    # Consistent hashing by user_id
    shard_index = :erlang.phash2(user_id, length(@shards))
    Enum.at(@shards, shard_index)
  end
  
  def get_user(user_id) do
    repo = repo_for_user(user_id)
    repo.get(User, user_id)
  end
  
  def create_message(user_id, attrs) do
    repo = repo_for_user(user_id)
    %Message{}
    |> Message.changeset(attrs)
    |> repo.insert()
  end
end
```

### Cross-Shard Queries

Some queries need data from multiple shards:

```elixir
# Searching for a user by username (don't know which shard)
def find_user_by_username(username) do
  @shards
  |> Task.async_stream(fn repo ->
    repo.get_by(User, username: username)
  end)
  |> Enum.find_value(fn
    {:ok, nil} -> nil
    {:ok, user} -> user
  end)
end
```

### Global Tables

Some data must exist on all shards:

- System settings
- Feature flags
- Global announcements

Use database replication or a separate "global" database for these.

---

## Stage 5: Internet Scale (10M-100M+ Users)

Welcome to the big leagues. You'll need:

### Citus for Distributed PostgreSQL

Citus extends PostgreSQL with distributed tables:

```sql
-- On the coordinator node
SELECT create_distributed_table('messages', 'sender_id');
SELECT create_distributed_table('reactions', 'user_id');

-- Reference tables (replicated to all nodes)
SELECT create_reference_table('settings');
```

### Architecture at Scale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CDN (Cloudflare)                           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                          LOAD BALANCER                                   │
└──────────┬─────────────────┬─────────────────┬─────────────────┬────────┘
           ▼                 ▼                 ▼                 ▼
      ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐
      │ API 1   │       │ API 2   │       │ API 3   │       │ API N   │
      └────┬────┘       └────┬────┘       └────┬────┘       └────┬────┘
           │                 │                 │                 │
           └─────────────────┴────────┬────────┴─────────────────┘
                                      │
                              ┌───────▼───────┐
                              │   PgBouncer   │
                              │   Cluster     │
                              └───────┬───────┘
                                      │
     ┌────────────────┬───────────────┼───────────────┬────────────────┐
     ▼                ▼               ▼               ▼                ▼
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│Citus    │     │ Shard   │     │ Shard   │     │ Shard   │     │ Shard   │
│Coord.   │────▶│   0     │     │   1     │     │   2     │     │   N     │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
```

### Multi-Region Deployment

For global users, deploy in multiple regions:

```
US-East (Primary)          EU-West              Asia-Pacific
     │                        │                      │
     │◀──── Replication ─────▶│◀──── Replication ───▶│
     │                        │                      │
  Primary               Read Replica           Read Replica
  Writes                Reads (EU)             Reads (APAC)
```

Route users to the nearest region for reads, route all writes to primary.

---

## Performance Optimization Techniques

### 1. Query Optimization

**Find slow queries:**
```sql
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

**Analyze query plans:**
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM messages
WHERE conversation_id = 'uuid-here'
ORDER BY inserted_at DESC
LIMIT 50;
```

### 2. Indexing Strategy

**Essential indexes we've already added:**

```sql
-- User lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);

-- Message queries
CREATE INDEX idx_messages_conversation ON messages(conversation_id, inserted_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- Full-text search
CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('english', content));

-- Partial indexes (only index what you need)
CREATE INDEX idx_messages_unread ON messages(conversation_id)
WHERE read_at IS NULL;
```

### 3. Connection Pool Tuning

```elixir
# config/prod.exs
config :cgraph, CGraph.Repo,
  pool_size: 20,          # Connections per Repo instance
  queue_target: 50,       # Target queue time in ms
  queue_interval: 1000    # How often to check queue
```

**Formula:** `pool_size = (num_cores * 2) + effective_spindle_count`

For SSD: `pool_size ≈ num_cores * 4`

### 4. Vacuum and Maintenance

```sql
-- Check for bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size,
       n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Configure autovacuum aggressively for high-write tables
ALTER TABLE messages SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);
```

---

## Monitoring Database Health

### Key Metrics Dashboard

Set up Grafana dashboards for:

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Connection utilization
SELECT 
  count(*) as total,
  max_conn as max_connections,
  round(count(*)::numeric / max_conn * 100, 2) as utilization_pct
FROM pg_stat_activity, (SELECT setting::int as max_conn FROM pg_settings WHERE name = 'max_connections') s
GROUP BY max_conn;

-- Cache hit ratio (should be > 99%)
SELECT 
  round(sum(blks_hit)::numeric / (sum(blks_hit) + sum(blks_read)) * 100, 2) as cache_hit_ratio
FROM pg_stat_database;

-- Replication lag
SELECT 
  client_addr,
  state,
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) as lag_bytes
FROM pg_stat_replication;
```

### Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Connection utilization | > 70% | > 90% |
| Cache hit ratio | < 99% | < 95% |
| Replication lag | > 1 MB | > 100 MB |
| Disk usage | > 70% | > 85% |
| Query duration (p99) | > 500ms | > 2000ms |
| Dead tuples | > 10M | > 50M |

---

## Common Pitfalls & Solutions

### Pitfall 1: N+1 Queries

**Problem:**
```elixir
# BAD: This runs 1 query per message
messages = Repo.all(Message)
Enum.map(messages, fn msg ->
  sender = Repo.get(User, msg.sender_id)  # N more queries!
  {msg, sender}
end)
```

**Solution:**
```elixir
# GOOD: Single query with preload
messages = 
  Message
  |> preload(:sender)
  |> Repo.all()
```

### Pitfall 2: Missing Indexes

**Symptom:** Queries get slower as data grows

**Solution:**
```sql
-- Find queries doing sequential scans
SELECT schemaname, tablename, seq_scan, seq_tup_read,
       idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_tup_read DESC;
```

### Pitfall 3: Long-Running Transactions

**Problem:** Locks held too long, blocking other queries

**Solution:**
```sql
-- Find long-running transactions
SELECT pid, now() - xact_start as duration, query, state
FROM pg_stat_activity
WHERE (now() - xact_start) > interval '5 minutes';

-- Kill if necessary
SELECT pg_terminate_backend(pid);
```

### Pitfall 4: Connection Exhaustion

**Symptom:** "too many connections" errors

**Solutions:**
1. Use PgBouncer for connection pooling
2. Reduce application pool sizes
3. Set statement_timeout to kill runaway queries
4. Increase max_connections (last resort)

### Pitfall 5: Write Amplification

**Problem:** Too many indexes slow down writes

**Solution:** Audit and remove unused indexes:
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public';
```

---

## Quick Reference: Scaling Commands

```bash
# Check database size
psql -c "SELECT pg_size_pretty(pg_database_size('cgraph_production'));"

# Check table sizes
psql -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text)) 
         FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(tablename::text) DESC;"

# Check index usage
psql -c "SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch 
         FROM pg_stat_user_indexes ORDER BY idx_scan DESC LIMIT 20;"

# Check for locks
psql -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Check replication status
psql -c "SELECT * FROM pg_stat_replication;"

# Force vacuum on a table
psql -c "VACUUM (VERBOSE, ANALYZE) messages;"
```

---

*Remember: Don't optimize prematurely. Scale when you need to, not before. Monitor your metrics and let the data guide your decisions.*

*Last updated: December 2025*
