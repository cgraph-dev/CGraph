# Query Performance Audit

> **Status: PENDING** — Real EXPLAIN ANALYZE output required from staging database.
>
> This document will contain actual query execution plans from PostgreSQL once
> run against a staging environment with representative data volumes.

## TODO

- [ ] Set up staging database with representative data (~50k users, ~200k messages)
- [ ] Run `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` for each critical query path
- [ ] Document real execution times, index usage, and scan types
- [ ] Identify any sequential scans on large tables
- [ ] Verify N+1 queries are eliminated via `preload`/batch loading
- [ ] Add composite index recommendations based on actual query plans

## Critical Paths to Audit

1. **Authentication** — user lookup by email, session token validation
2. **Messaging** — conversation message pagination, unread counts
3. **Forums** — post listing with sorting, thread pagination
4. **Groups** — channel message loading, member listing
5. **Notifications** — unread notification queries
6. **Search** — full-text search queries

## How to Run

```bash
# Connect to staging database
mix run priv/scripts/query_audit.exs

# Or manually:
psql $DATABASE_URL -c "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM users WHERE email = 'test@example.com';"
```

> **Note**: Previous version of this document contained estimated timings that were
> not derived from actual EXPLAIN ANALYZE output. This has been replaced with a
> honest TODO list pending real audit execution.
