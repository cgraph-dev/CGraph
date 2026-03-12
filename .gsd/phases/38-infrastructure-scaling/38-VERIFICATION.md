# Phase 38 — Infrastructure Scaling: Verification Report

**Date**: 2026-02-21
**Verifier**: GSD Verifier (automated codebase audit)
**Plans Verified**: 5 (38-01 through 38-05)
**Errors Found**: 12 (4 P0, 6 P1, 2 P2)
**Errors Fixed**: 12/12 (100%)

---

## Verification Methodology

1. Read all 5 plan files + context document
2. Deep codebase exploration via 2 parallel subagents covering:
   - Repo/sharding/partitioning/config infrastructure
   - Cache/search/presence/monitoring/operations/workers/uploads/infra scripts
3. Cross-referenced every `key_links`, `files_modified`, `pre_tasks`, and task action against actual
   codebase
4. Applied fixes and re-validated all corrected plans

---

## Error Catalog

### P0 — Critical (wrong paths/names → execution failure)

| # | Plan | Location | Error | Fix |
|---|------|----------|-------|-----|
| 1 | 38-01 | key_links | Path `apps/backend/lib/cgraph/chat/message.ex` — directory `chat/` does not exist | Fixed → `messaging/message.ex` (CGraph.Messaging.Message) |
| 2 | 38-01 | key_links | Claims `partition_manager.ex` already exists → "audit before building" | Fixed → removed false claim, added accurate warnings about existing monthly range partitioning (migration 20260213000001) and ReadRepo read/write split |
| 3 | 38-02 | files_modified, key_links, pre_tasks, Task 1 action | Lists 4 non-existent cache files: `warming.ex`, `stats.ex`, `policy.ex`, `invalidation.ex` in "10 files" claim | Fixed → corrected to actual 14 files: l1.ex, l2.ex, l3.ex, tiered.ex, unified.ex, distributed.ex, stampede.ex, tags.ex, telemetry.ex, redis_pool.ex + distributed/ subdir (3 files) + cache.ex at parent. Noted 4 missing files as genuine gaps |
| 4 | 38-03 | key_links | References `apps/backend/lib/cgraph/forums/advanced_search.ex` — file does not exist (carried over from Phase 37 error) | Fixed → `forums/search.ex` (CGraph.Forums.Search, full-text search with tsvector/tsquery) |

### P1 — High (missing warnings → duplication risk)

| # | Plan | Location | Error | Fix |
|---|------|----------|-------|-----|
| 5 | 38-02 | files_modified | `cache_warmer.ex` marked `(update)` — says "warming.ex already exists. EXTEND" but warming.ex does NOT exist | Fixed → `(new — no warming.ex exists in cache/. Create fresh cache warming module)` |
| 6 | 38-02 | files_modified | `cache_invalidator.ex` marked `(update)` — says "invalidation.ex already exists. EXTEND" but invalidation.ex does NOT exist | Fixed → `(new — no invalidation.ex exists in cache/. Create fresh cache invalidation module)` |
| 7 | 38-03 | files_modified + key_links | No warning about existing presence/ directory with 5 modules: tracker.ex, queries.ex, store.ex (Redis sync + last-seen), sampled.ex (HyperLogLog), ghost_mode.ex. Phoenix.Presence CRDT already provides cross-node sync | Fixed → added ⚠️ warning to files_modified, key_links (2 entries), and new MANDATORY AUDIT pre_task |
| 8 | 38-04 | files_modified + key_links + Task 2 | No warning about existing health_check/ directory (checks.ex with DB/Redis/Oban/cache/memory checks, reporter.ex, health_check.ex GenServer). /health endpoint already served by health_controller.ex | Fixed → added ⚠️ warning to files_modified, key_links, pre_tasks, and Task 2 action |
| 9 | 38-04 | files_modified + key_links + Task 2 | No warning about existing CGraph.Metrics GenServer (metrics.ex) + CGraphWeb.Telemetry + telemetry/handlers.ex + telemetry/metrics.ex that already provide Prometheus metrics | Fixed → added ⚠️ warning to files_modified, key_links, pre_tasks, and Task 2 action |
| 10 | 38-05 | files_modified + key_links | No warning about existing performance/ directory (slo.ex, query_optimizer.ex, request_coalescing.ex). performance_profiler.ex scope could overlap with query_optimizer.ex | Fixed → added ⚠️ warning to files_modified, key_links, and new MANDATORY AUDIT pre_task |

### P2 — Medium (inaccurate counts/vague references)

| # | Plan | Location | Error | Fix |
|---|------|----------|-------|-----|
| 11 | 38-02 | multiple | File count "10 files" wrong — actual 14 files with completely different names | Fixed (covered by P0 #3 fix — corrected all 5 locations) |
| 12 | 38-02 | key_links | PubSub entry "invalidation.ex may already do this" — invalidation.ex doesn't exist | Fixed → "No dedicated invalidation module exists yet — cache_invalidator.ex will be a new module" |

---

## Codebase State Summary

### What Actually Exists (verified)

| System | Files | Key Details |
|--------|-------|-------------|
| **Repo** | repo.ex, read_repo.ex | Single primary repo + read replica. No sharding. ReadRepo NOT in ecto_repos list |
| **Partitioning** | 1 migration | Messages table monthly range partition by inserted_at. 10 active partitions. Composite PK |
| **Snowflake** | snowflake.ex | 64-bit IDs (42-bit timestamp, 5-bit node, 5-bit worker, 12-bit sequence). CGraph epoch 2026-01-01 |
| **Cache** | 14 files | l1.ex, l2.ex, l3.ex, tiered.ex, unified.ex, distributed.ex + distributed/ (3 files) + stampede.ex, tags.ex, telemetry.ex, redis_pool.ex. **Missing**: warming, stats, policy, invalidation |
| **Search** | 7 files + 2 adapters | search_engine.ex, backend.ex, indexer.ex, users.ex, messages.ex + meilisearch_adapter.ex, postgres_adapter.ex |
| **Presence** | 7 files | presence.ex (Phoenix.Presence CRDT), tracker.ex, queries.ex, store.ex (Redis), sampled.ex (HLL), ghost_mode.ex + cgraph_web/presence.ex |
| **Health** | 3 files | health_check.ex (GenServer), checks.ex (component checks), reporter.ex (aggregation) |
| **Metrics** | 4 files | metrics.ex (GenServer), telemetry.ex (supervisor), telemetry/handlers.ex, telemetry/metrics.ex |
| **Performance** | 3 files | slo.ex, query_optimizer.ex, request_coalescing.ex |
| **Workers** | 34+ files | dead_letter_worker.ex, message_archival_worker.ex, search_index_worker.ex (all in workers/) |
| **Uploads** | 2 files | image_optimizer.ex (ImageMagick), encryption_metadata.ex |
| **Oban** | 28 queues | Dev + prod configs with 13 cron jobs |
| **Infra Scripts** | 8 files | backup, restore, chaos-test, deploy-fly, health-check, setup-dev, etc. |
| **Dependencies** | Verified | ✅ redix, cachex present. ❌ mogrify/vix, elasticsearch/elastix NOT present |

### Directories That DO NOT Exist Yet

- `apps/backend/lib/cgraph/sharding/` — Plan 38-01 creates this
- `apps/backend/lib/cgraph/monitoring/` — Plan 38-04 creates this
- `apps/backend/lib/cgraph/operations/` — Plan 38-05 creates this
- `apps/backend/lib/cgraph/cdn/` — Plan 38-04 creates this
- `apps/backend/lib/cgraph/archival/` — Plan 38-02 creates this
- `apps/backend/lib/cgraph/queue/` — Plan 38-03 creates this

---

## Cross-Plan Dependency Verification

| Dependency | Valid? | Notes |
|-----------|--------|-------|
| 38-01 depends_on 37-06 | ✅ | Phase 37 complete |
| 38-02 depends_on 37-06 | ✅ | Phase 37 complete |
| 38-03 depends_on 38-01, 38-02 | ✅ | Wave 2 after Wave 1 |
| 38-04 depends_on 38-01, 38-02 | ✅ | Wave 2 after Wave 1 |
| 38-05 depends_on 38-03, 38-04 | ✅ | Wave 3 after Wave 2 |
| Wave execution order | ✅ | Wave 1 (01, 02) → Wave 2 (03, 04) → Wave 3 (05) |

---

## Pre-task Audit (all plans)

| Plan | Pre-tasks Present | Added? | Coverage |
|------|------------------|--------|----------|
| 38-01 | ❌ None (but key_links have warnings) | — | Adequate via key_links |
| 38-02 | ✅ 2 MANDATORY AUDITs | Updated | Cache 14-file audit + archival worker audit |
| 38-03 | ✅ 2 → 3 | +1 added | Elasticsearch dep + search audit + **NEW: presence audit** |
| 38-04 | ✅ 2 → 4 | +2 added | Image dep + uploads audit + **NEW: health_check audit + metrics audit** |
| 38-05 | ✅ 0 → 1 | +1 added | **NEW: performance/ directory audit** |

---

## Verdict

All 12 errors fixed. Plans are now accurate against the actual codebase state. Key improvements:

1. **All file paths verified** — no phantom references remain
2. **All existing-system warnings added** — 5 new MANDATORY AUDIT pre_tasks prevent duplication
3. **Cache file inventory corrected** — from wrong 10-file list to accurate 14-file inventory
4. **Presence system fully documented** — 5+ module existing system now warned about
5. **Health/metrics overlap flagged** — existing health_check/ + metrics.ex + telemetry/ system
   documented with audit requirements

Plans are ready for execution.
