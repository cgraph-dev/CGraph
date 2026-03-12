# Plan 38-03 Summary: Queues, Search & Presence

**Phase:** 38-infrastructure-scaling
**Plan:** 03
**Wave:** 2
**Status:** COMPLETE
**Date:** 2026-03-12

## Tasks Completed: 3/3

### Task 1: Priority Queue + Dead Letter Queue
**Commit:** `7494d8ae` — feat(38-03): priority queue and dead letter queue

**Files created:**
- `apps/backend/lib/cgraph/queue/priority_queue.ex` — PriorityQueue module
- `apps/backend/lib/cgraph/queue/dead_letter_queue.ex` — DeadLetterQueue module

**Key details:**
- PriorityQueue wraps Oban with named priority levels: critical=0, high=1, normal=2, low=3
- `enqueue/3` and `enqueue_many/4` with telemetry emission
- DeadLetterQueue is a GenServer + ETS for fast in-memory failed job capture
- Admin query API: `list_failures/1` with filters (queue, worker, since), `retry/1`, `purge/1`
- Auto-eviction of oldest 10% when at 10,000 entry capacity

### Task 2: Search Infrastructure
**Commit:** `28386800` — feat(38-03): search infrastructure with elastic adapter

**Files created:**
- `apps/backend/lib/cgraph/search/elastic_adapter.ex` — ElasticAdapter module
- `apps/backend/lib/cgraph/search/search_indexer.ex` — SearchIndexer module

**Files modified:**
- `apps/backend/lib/cgraph/workers/search_index_worker.ex` — extended with elastic operations

**Key details:**
- ElasticAdapter: behaviour-based search abstraction with `search/2`, `index/3`, `delete/2`, `bulk/2`
- Configurable backend: Elasticsearch, OpenSearch, or PostgreSQL tsvector fallback
- SearchIndexer: new module (`CGraph.Search.SearchIndexer`) alongside existing `CGraph.Search.Indexer`
  - `Indexer` → Meilisearch via `CGraph.Search.Engine`
  - `SearchIndexer` → Elasticsearch/OpenSearch via `ElasticAdapter`
- SearchIndexWorker extended with `elastic_index`, `elastic_delete`, `elastic_bulk` operations
- Batch telemetry for bulk operations

### Task 3: Distributed Presence
**Commit:** `b4207207` — feat(38-03): distributed presence tracking across cluster nodes

**Files created:**
- `apps/backend/lib/cgraph/presence/distributed_presence.ex` — DistributedPresence module

**Key details:**
- GenServer with `:net_kernel.monitor_nodes/2` for cluster topology awareness
- `list_online/0`, `is_online?/1` with ghost mode exclusion
- CRDT-style conflict resolution: last-writer-wins with status priority merging (online > away > busy > invisible)
- `get_user_presence/1` returns multi-device session info with node attribution
- `cluster_stats/0` for monitoring, `bulk_online?/1` for batch checks
- Telemetry on node joins/leaves, conflict resolution, and periodic stats emission (30s interval)

## Compilation

All modules compile cleanly. No new warnings introduced.

## Deviations from Plan

- **SearchIndexer**: Created as new module `CGraph.Search.SearchIndexer` alongside existing `CGraph.Search.Indexer` (different module, different backend target) — as instructed
- **SearchIndexWorker**: Extended existing worker with new `elastic_*` operation clauses rather than replacing
- **ElasticAdapter**: Uses `Req` HTTP client (already a project dependency) for Elasticsearch communication
- **DeadLetterQueue**: Uses ETS rather than a dedicated database table for performance; integrates with existing `CGraph.Workers.DeadLetterWorker` conceptually

## Artifacts Produced

| File | Status |
|------|--------|
| `apps/backend/lib/cgraph/queue/priority_queue.ex` | Created |
| `apps/backend/lib/cgraph/queue/dead_letter_queue.ex` | Created |
| `apps/backend/lib/cgraph/search/elastic_adapter.ex` | Created |
| `apps/backend/lib/cgraph/search/search_indexer.ex` | Created |
| `apps/backend/lib/cgraph/workers/search_index_worker.ex` | Modified |
| `apps/backend/lib/cgraph/presence/distributed_presence.ex` | Created |
