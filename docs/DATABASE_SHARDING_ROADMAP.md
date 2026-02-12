# Database Sharding & Scaling Roadmap

> Last updated: 2026-02-13

## Current State

CGraph runs on a single PostgreSQL 16 instance (Supabase-managed) with:

- **60 migrations** — well-structured schema with proper indexes
- **Read replica** — configured via `CGraph.ReadRepo` for read-heavy queries
- **PgBouncer** — connection pooling as Fly.io sidecar
- **No partitioning** — all tables are standard heap tables
- **No sharding** — single database instance

## Scaling Phases

### Phase 1: Table Partitioning (Current)

**Target: Messages table** — highest write volume, time-series access pattern.

```
┌─────────────────────────────────────────────────────────┐
│                    messages (partitioned)                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ 2026_01     │  │ 2026_02     │  │ 2026_03     │     │
│  │ Jan msgs    │  │ Feb msgs    │  │ Mar msgs    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│  Benefits:                                               │
│  • Partition pruning on time-range queries               │
│  • Independent VACUUM per partition                      │
│  • Fast DROP PARTITION for data retention                │
│  • Parallel index builds per partition                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Implementation**: Monthly range partitions on `inserted_at`. Migration creates initial partitions
and an Oban job creates future partitions automatically.

**When to trigger**: > 10M messages or query p99 > 200ms on messages table.

### Phase 2: Additional Partitioning

**Candidates** (by write volume):

| Table             | Partition Key | Strategy             | Trigger     |
| ----------------- | ------------- | -------------------- | ----------- |
| `messages`        | `inserted_at` | Monthly range        | **Phase 1** |
| `notifications`   | `inserted_at` | Monthly range        | > 50M rows  |
| `audit_logs`      | `inserted_at` | Monthly range        | > 20M rows  |
| `presence_events` | `inserted_at` | Weekly range         | > 100M rows |
| `search_history`  | `user_id`     | Hash (16 partitions) | > 5M rows   |

### Phase 3: Read Replica Scaling

Current: 1 read replica. Scale path:

```
                    ┌──────────────┐
         Writes ───▶│   Primary    │
                    │  (Fly.io)    │
                    └──────┬───────┘
                           │ Streaming Replication
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Replica 1│ │ Replica 2│ │ Replica 3│
        │ (reads)  │ │ (search) │ │ (analytics)│
        └──────────┘ └──────────┘ └──────────┘
```

- **Replica 2**: Dedicated to search reindexing (MeiliSearch sync)
- **Replica 3**: Analytics/reporting queries (long-running, isolated)

**When to trigger**: Read replica CPU > 70% sustained.

### Phase 4: Horizontal Sharding (Discord Model)

Discord shards by `guild_id` (our `group_id`). We follow the same pattern:

```
┌─────────────────────────────────────────────────────────┐
│                     Shard Router                         │
│          shard = hash(group_id) % num_shards            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ Shard 0 │  │ Shard 1 │  │ Shard 2 │  │ Shard 3 │   │
│  │ PG inst │  │ PG inst │  │ PG inst │  │ PG inst │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                          │
│  Sharded tables:                                         │
│  • messages (by group_id)                                │
│  • channels (by group_id)                                │
│  • group_members (by group_id)                           │
│  • posts (by forum_id → group_id)                        │
│                                                          │
│  Global tables (not sharded):                            │
│  • users                                                 │
│  • groups (metadata only)                                │
│  • auth_tokens                                           │
│  • billing                                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Implementation approach** (Elixir-native):

```elixir
defmodule CGraph.ShardRouter do
  @num_shards 4

  def repo_for_group(group_id) do
    shard = :erlang.phash2(group_id, @num_shards)
    Module.concat(CGraph, :"ShardRepo#{shard}")
  end
end
```

**When to trigger**: > 100M messages OR single PostgreSQL write throughput > 80%.

### Phase 5: Citus / Distributed PostgreSQL

If horizontal sharding complexity becomes too high, consider:

- **Citus** — PostgreSQL extension for distributed tables
- **CockroachDB** — Drop-in PostgreSQL wire protocol, auto-sharding
- **Supabase supports Citus** — could enable on existing infra

**When to trigger**: > 4 shards needed OR cross-shard query complexity too high.

## Data Retention Policy

| Data Type      | Hot (fast SSD) | Warm (standard) | Cold (archive) | Delete  |
| -------------- | -------------- | --------------- | -------------- | ------- |
| Messages       | 90 days        | 1 year          | 3 years        | 5 years |
| Notifications  | 30 days        | 90 days         | —              | 1 year  |
| Audit logs     | 90 days        | 1 year          | 7 years        | Never   |
| Presence       | 7 days         | —               | —              | 30 days |
| Search history | 30 days        | —               | —              | 90 days |

Implemented via `DROP PARTITION` for partitioned tables (instant, no vacuum needed).

## Monitoring Queries

```sql
-- Table sizes (run monthly)
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) as data_size,
  pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 20;

-- Dead tuple ratio (triggers for partitioning)
SELECT relname, n_live_tup, n_dead_tup,
  ROUND(n_dead_tup::numeric / GREATEST(n_live_tup, 1) * 100, 2) as dead_pct
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;

-- Slow queries (trigger for read replica routing)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

## Decision Log

| Date       | Decision                         | Rationale                                                    |
| ---------- | -------------------------------- | ------------------------------------------------------------ |
| 2026-02-13 | Start with messages partitioning | Highest write volume, clearest time-series pattern           |
| 2026-02-13 | Monthly partitions (not weekly)  | Reduces partition count, simpler management                  |
| 2026-02-13 | Defer full sharding to Phase 4   | Single instance handles current load, premature optimization |
| 2026-02-13 | Use Elixir-native shard router   | Avoids middleware dependency, fits existing architecture     |
