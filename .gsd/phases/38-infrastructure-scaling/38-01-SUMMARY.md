---
plan: 38-01
phase: 38-infrastructure-scaling
title: Database Sharding
status: complete
tasks_completed: 3
tasks_total: 3
commits:
  - 30600950
  - b71c291d
  - 476f7dbd
---

# Plan 38-01: Database Sharding — Summary

## Tasks Completed

### Task 1: Consistent Hashing + Shard Router
**Commit:** `30600950`
**Files:**
- `apps/backend/lib/cgraph/sharding/consistent_hash.ex`
- `apps/backend/lib/cgraph/sharding/shard_router.ex`

**What was built:**
- `ConsistentHash` module — ring with 256 virtual nodes per shard, `add_node/2`, `remove_node/2`, `get_node/1`, `get_nodes/3` for replication
- Uses `:gb_trees` for O(log n) clockwise ring lookups with wrap-around
- `ShardRouter` — `route(table, key, mode)` returns `{:ok, repo}` for the correct shard
- Read replica support via `:read` mode with fallback to primary
- `route!/3` for graceful fallback when sharding isn't configured (migration path)
- `all_shards/1` for scatter-gather queries across all shards

### Task 2: Shard Manager GenServer
**Commit:** `b71c291d`
**Files:**
- `apps/backend/lib/cgraph/sharding/shard_manager.ex`
- `apps/backend/config/runtime.exs`

**What was built:**
- `ShardManager` GenServer — init from `:cgraph, :sharding` config
- Builds per-table consistent hash rings on startup
- Health checks every 30s (configurable via `SHARD_HEALTH_CHECK_INTERVAL`)
- Auto-failover to read replica after 3 consecutive health check failures
- Telemetry events: `[:cgraph, :sharding, :shard, :added|:removed|:failover|:recovered]`
- Runtime config in `runtime.exs` with env var overrides:
  - `SHARDING_ENABLED`, `MESSAGES_SHARD_COUNT` (default 16), `POSTS_SHARD_COUNT` (default 8)
  - `SHARD_HEALTH_CHECK_INTERVAL`, `SHARD_FAILOVER_ENABLED`

### Task 3: Migration Tools + Schema Changes
**Commit:** `476f7dbd`
**Files:**
- `apps/backend/lib/cgraph/sharding/shard_migration.ex`
- `apps/backend/priv/repo/migrations/20260727100000_add_shard_key_to_messages_and_posts.exs`

**What was built:**
- `ShardMigration.split_shard/2` — live shard splitting with dual-write → backfill → cutover strategy
- `ShardMigration.merge_shards/2` — merge multiple shards into one
- `ShardMigration.verify_integrity/1` — row count, distribution coefficient of variation, orphan check
- `ShardMigration.backfill_shard_keys/2` — batch-update existing rows using `hashtext()` for stable hashing
- Migration adds `shard_key` integer column to `messages` (16 shards) and `posts` (8 shards)
- Hash index on `shard_key` for fast routing, composite indexes for shard-scoped queries
- Backfill in migration: `abs(hashtext(partition_col::text)) % shard_count`

## Compilation
All modules compile cleanly (`mix compile` — no errors from sharding modules).

## Deviations
- Fixed `ConsistentHash` guard clause: `:gb_trees.empty()` cannot be used in Elixir guards; switched to `gb_trees.is_empty/1` with conditional branching.
- Shards currently route to `CGraph.Repo` (logical sharding via `shard_key` column). Physical multi-database routing is architecture-ready but not activated.

## Architecture Notes
- **Logical sharding first**: All shards use the single `CGraph.Repo` with `shard_key` for partitioning. This avoids operational complexity while establishing the routing layer.
- **Physical sharding ready**: `ShardManager` topology maps shard IDs to repo modules. When ready to scale to separate databases, create per-shard Ecto Repos and update topology config.
- **Zero-downtime migration path**: `split_shard/2` and `merge_shards/2` support dual-write strategies for live resharding.
