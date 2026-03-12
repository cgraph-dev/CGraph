---
phase: 38-infrastructure-scaling
plan: "02"
title: Caching and Archival
status: complete
completed: 2026-03-12
tasks_completed: 3
tasks_total: 3
---

# 38-02 Caching and Archival — Summary

## Audit Results

**Existing cache system (14 files):**
- `l1.ex` — ETS-based local cache (sub-µs lookups)
- `l2.ex` — Cachex-based distributed cache (ms lookups, pattern scanning)
- `l3.ex` — Redis-based remote cache (`:erlang.term_to_binary` serialization)
- `tiered.ex` — L1→L2→L3 cascading read with single default TTL, promotion
- `unified.ex` — Namespace-based API, backend abstraction (Cachex/ETS), basic `warm/2`
- `distributed.ex` — Another multi-tier layer (L1 ETS + L2 Redis), stampede prevention
- `stampede.ex` — Redis-lock-based stampede protection with exponential backoff
- `tags.ex` — Tag-based bulk invalidation via L2
- `telemetry.ex` — `:telemetry` event emission for cache ops
- `redis_pool.ex` — Pooled Redis connections (20 default), round-robin
- `distributed/{l1,l2,stampede_prevention}.ex` — Sub-modules of distributed cache

**Gaps identified (genuine):**
- No per-tier TTL configuration (all tiers used same TTL)
- No `{module}:{id}:{version}` key convention
- No systematic cache warming (only a basic `warm/2` on `unified.ex`)
- No PubSub-driven invalidation
- No Oban-based periodic warming

**Existing archival:**
- `message_archival_worker.ex` — Archives to R2 cold storage (object store), daily cron
- No table-to-table archival existed

## Tasks Completed

### Task 1: Audit + extend existing cache system
- Created `multi_tier_cache.ex` wrapping L1/L2/L3 with per-tier TTLs
  - L1: 1 min (ETS), L2: 15 min (Cachex), L3: 24 h (Redis)
  - `{module}:{id}:{version}` key convention via `build_key/3`
  - Cascading read with upward promotion on lower-tier hits
  - Telemetry on every hit/miss per tier
  - `fetch/4` cache-aside, bulk ops, pattern invalidation

### Task 2: Cache warmer + invalidator
- `cache_warmer.ex` — `warm_on_boot/0` loads top 1000 users, active conversations (24h), hot threads (7d) concurrently via `Task.async`
- `cache_invalidator.ex` — GenServer subscribing to `CGraph.PubSub` on 4 topics, pattern-matched handlers for user/message/thread mutations
- `cache_warmer_worker.ex` — Oban worker (hourly), dispatches per-category warming with duration/count telemetry

### Task 3: Archival system
- `archive_policy.ex` — Struct with `days_threshold` (365), `target_table`, `archive_table`, `batch_size` (1000), `conditions`
- `archival.ex` — Context: `archive_by_policy/1`, `restore/2`, `list_archives/1`, convenience wrappers `archive_old_messages/1`, `archive_inactive_threads/1`
- `archival_worker.ex` — Oban monthly cron, iterates default policies, batch-moves with telemetry, dry_run support
- Migration `20260312400001`: `archive_messages` + `archive_forum_posts` via `LIKE source INCLUDING ALL`, optional TimescaleDB hypertable conversion

## Files Created

| File | Purpose |
|------|---------|
| `apps/backend/lib/cgraph/cache/multi_tier_cache.ex` | Multi-tier cache with per-tier TTLs |
| `apps/backend/lib/cgraph/cache/cache_warmer.ex` | Boot + on-demand cache warming |
| `apps/backend/lib/cgraph/cache/cache_invalidator.ex` | PubSub-driven cache invalidation |
| `apps/backend/lib/cgraph/workers/cache_warmer_worker.ex` | Oban hourly cache warming |
| `apps/backend/lib/cgraph/archival/archive_policy.ex` | Archive policy struct |
| `apps/backend/lib/cgraph/archival/archival.ex` | Archival context |
| `apps/backend/lib/cgraph/workers/archival_worker.ex` | Oban monthly archival worker |
| `apps/backend/priv/repo/migrations/20260312400001_create_archive_tables.exs` | Archive table migration |

## Compilation

Pre-existing compilation error in `consistent_hash.ex` (unrelated). All new modules compile without errors.

## Deviations

1. **Did NOT replace `tiered.ex` or `unified.ex`** — created `multi_tier_cache.ex` as an additive layer. The existing modules serve different callers.
2. **Did NOT rename `message_archival_worker.ex`** — it archives to R2 (object store), while the new `archival_worker.ex` moves rows between Postgres tables. Both serve different purposes and coexist.
3. **L3 TTL set to 24h** instead of "permanent" — unbounded Redis keys are a memory risk. 24h provides the "permanent-ish" semantics needed.
4. **PubSub name is `CGraph.PubSub`** (not `CGraphWeb.PubSub` as stated in plan key_links). Used the actual name from `application.ex`.
