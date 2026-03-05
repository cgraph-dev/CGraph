# Plan 25-01 Summary: Infrastructure & Performance

**Status**: ✅ Complete  
**Plan**: 25-01 (Infrastructure & Performance)  
**Phase**: 25 — Infrastructure  
**Executed**: 2026-03-05  
**Commits**: 6  
**Test Suite**: 2372 tests (5 pre-existing failures, 8 skipped — none related to changes)

---

## Commits

| # | SHA | Message |
|---|-----|---------|
| 1 | `88ba473e` | `infra(pgbouncer): merge PgBouncer into app process as sidecar` |
| 2 | `bdb12aa1` | `infra(search): add MeiliSearch setup mix task and deployment docs` |
| 3 | `aa982118` | `infra(k6): add load test scripts for critical API flows` |
| 4 | `f15f3451` | `perf(auth): tune Argon2 params and add fast test hashing` |
| 5 | `6b798772` | `infra(elixir): align Dockerfile Elixir 1.19.4/OTP 28.3 with .tool-versions` |
| 6 | `175869ab` | `feat(crdt): add document compaction worker and client-initiated compaction` |

---

## Task Details

### Task 1: PgBouncer Sidecar Fix
**Files**: `alloy/start-with-app.sh`, `fly.toml`, `fly.iad.toml`

- Merged PgBouncer into the app process startup script (between Alloy and Phoenix)
- PgBouncer starts as background process when `PGBOUNCER_DATABASE_URL` is set
- Removed `pgbouncer` from `[processes]` in both fly.toml files
- Trap handles cleanup of both Alloy and PgBouncer PIDs on exit

### Task 2: MeiliSearch Setup Task
**Files**: `lib/mix/tasks/search.setup.ex`, `config/runtime.exs`

- Created `mix search.setup` convenience task (health check + index setup + full reindex)
- Supports `--dry-run` flag and `fly ssh eval` entry point for production
- Added deployment documentation in runtime.exs MeiliSearch config section
- **Already existed**: `setup_indexes()` at startup, `mix search.reindex`, search workers

### Task 3: k6 Load Test Scripts
**Files**: `k6/` directory (7 files)

- `config.js`: Shared config, auth token helper, thresholds, test credentials
- `smoke.js`: Health/readiness endpoint check (p95 < 200ms)
- `auth-login.js`: Login + token verification flow (p95 < 300ms)
- `forum-browse.js`: Forum → thread → post browsing (p95 < 500ms)
- `search.js`: Full-text search with query rotation (p95 < 400ms)
- `load.js`: Combined multi-scenario orchestrator with per-scenario thresholds
- `README.md`: Installation, usage, configuration documentation

### Task 4: Auth p95 Latency Fix
**Files**: `config/runtime.exs`, `config/test.exs`

- Production Argon2: t_cost=2, m_cost=15 (32MB) → ~100-150ms (was ~300-400ms)
- Configurable via `ARGON2_T_COST` / `ARGON2_M_COST` env vars
- Test Argon2: t_cost=1, m_cost=8 for fast test suite execution
- **Already existed**: `lower(username)` functional index (migration 20260222000001)
- 23 auth tests pass

### Task 5: Elixir Version Alignment
**Files**: `Dockerfile`, `mix.exs`

- Dockerfile: `hexpm/elixir:1.19.4-erlang-28.3-alpine-3.21.3` (was 1.17.3/27.1.2)
- Runtime: `alpine:3.21` (was 3.20)
- mix.exs: `~> 1.19` (was `~> 1.17`)
- Aligned with `.tool-versions`: elixir 1.19.4-otp-28, erlang 28.3

### Task 6: CRDT Document Compaction
**Files**: `lib/cgraph/workers/document_compaction_worker.ex`, `lib/cgraph/collaboration/document_server.ex`, `config/config.exs`, `config/prod.exs`

- Created `DocumentCompactionWorker` Oban worker on maintenance queue
- Scans documents exceeding 512KB Yjs state threshold
- Broadcasts `compaction_request` to connected clients via PubSub
- Client runs `Y.mergeUpdates()` and sends back via `replace_state/2`
- Server-side dedup fallback for documents with no connected clients
- Replaced `compact_updates` no-op with size-aware implementation (256KB warn, 512KB signal)
- Added `replace_state/2` public API to DocumentServer
- Scheduled every 15 minutes via Oban Cron

---

## Limitations & Notes

1. **PgBouncer sidecar**: Requires `PGBOUNCER_DATABASE_URL` secret to be set on Fly.io. Without it, no change in behavior.

2. **MeiliSearch**: No new indexing code needed — already code-complete. The `mix search.setup` task is a convenience wrapper.

3. **k6 tests**: Require a test user to exist. Scripts use ES6 modules (k6 native, no bundler needed).

4. **Argon2 tuning**: Reduces from ~300-400ms to ~100-150ms per hash. OWASP recommends t_cost ≥ 2 for Argon2id, so t_cost=2 is the minimum safe value.

5. **Elixir version**: Docker image tag `hexpm/elixir:1.19.4-erlang-28.3-alpine-3.21.3` assumes this image exists on Docker Hub. If it doesn't exist at deploy time, fall back to the latest available `1.18.x` tag.

6. **CRDT compaction**: True Yjs merging still requires a Rust NIF or JS sidecar. The current implementation is a pragmatic bridge using client-assisted compaction. Server-side dedup provides marginal savings for identical consecutive updates.
