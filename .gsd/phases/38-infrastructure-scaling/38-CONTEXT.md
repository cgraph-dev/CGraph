# Phase 38: Infrastructure Scaling - Context

**Gathered:** 2026-03-11 **Status:** Ready for execution

<domain>
## Phase Boundary

Scale from 100K to 1M+ concurrent users. Database sharding (16 forum shards + cosmetics DB
separation), 3-tier caching (ETS + Redis + CDN), TimescaleDB archival, queue optimization,
Meilisearch configuration, presence batching, monitoring + alerting, dual-write migration strategy,
operational readiness. Corresponds to ATOMIC_PLAN v2.1 Phase 5 (Tasks 5.1–5.30).

Version target: v1.5.0

</domain>

<decisions>
## Implementation Decisions

### Database Sharding

- `Repo.Router` module: `get_shard/1` with `rem(forum_id, 16)`
- 16 dynamic `Repo.ShardN` repos
- Forum context shard-aware queries
- Cosmetics DB: dedicated replicated Postgres instance
- 3 read replicas per shard (48 total)
- Connection pool: 300 → 800 + PgBouncer reconfiguration

### Caching Layer

- **L1 (Hot):** ETS cosmetics cache — TTL 1hr, ~500MB per instance
- **L2 (Warm):** Redis forum data cache — TTL 5min (boards, threads, top posts)
- **L3 (Edge):** CDN (R2) — immutable SVG 1yr, CSS 1hr, PNG 30d
- Event-driven invalidation on post/thread/board changes
- Cache warming on startup with documented key naming convention

### Archival & Storage Tiers

- TimescaleDB hypertable for 30-90 day posts
- S3 cold archival: posts >90 days → Parquet format
- Transparent query routing by post age (hot/warm/cold)
- Forum post archival worker: Oban nightly

### Queue Optimization

- 7 dedicated Oban queues from Infrastructure doc
- High-concurrency forum notification worker
- Selective Meilisearch indexer: 4 conditions (not deleted, <30d, not archived, has engagement)
- Meilisearch: maxTotalHits 10000, typoTolerance, 5000 chunk bulk indexing, 4 CPU / 16GB RAM

### Presence Optimization

- Sharded presence: partition by forum/channel
- Presence batching: batch diffs, reduce WS frame count

### Migration Strategy

- Dual-write: mirror → dual-write → gradual cutover by forum ID range
- Instant rollback: reads revert to main DB
- Test mode: single DB with shard-aware queries

### Monitoring

- Prometheus: 6 metric groups
- Grafana: dashboards per concern
- 11 alerting rules: 5 infra + 6 SLO-specific
- SLO dashboard + burn rate alerts

</decisions>

<specifics>
## Specific Ideas

- R2 bucket paths: `cosmetics-borders/`, `cosmetics-badges/`, `cosmetics-nameplates/`,
  `cosmetics-themes/`
- Error budget policy documentation
- Pre-launch checklist: 13 formalized launch gates
- Operational runbook: daily/weekly/monthly/quarterly tasks
- Cost model: ~$75K/month breakdown + optimization paths
- DR drills with RPO/RTO targets

</specifics>

<deferred>
## Deferred Ideas

- Multi-region deployment (Phase 39 data residency)
- Automated scaling policies (Kubernetes HPA)
- Database partitioning beyond forums

</deferred>

---

_Phase: 38-infrastructure-scaling_ _Context gathered: 2026-03-11_
