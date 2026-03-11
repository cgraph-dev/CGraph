# ADR-005: PostgreSQL as Primary Database

## Status

**Accepted**

## Date

2025-06-15

## Authors

- @cgraph-dev/backend-team

## Context

CGraph needs a database that can handle:

- Complex relational data (users, messages, forums, servers, roles, permissions)
- High write throughput (real-time messaging)
- Strong consistency (financial transactions, permissions)
- Full-text search (message/forum search)
- JSON flexibility (settings, metadata)
- Horizontal scalability (read replicas, sharding future)

## Decision Drivers

- ACID compliance (critical for payments, permissions)
- Performance at scale (millions of messages)
- Ecosystem maturity
- Elixir/Ecto integration
- Operational familiarity
- Cost efficiency

## Considered Options

### Option 1: PostgreSQL

**Description**: Advanced open-source relational database.

**Pros**:

- ACID compliant with strong consistency
- Excellent Ecto integration (first-class support)
- Built-in full-text search
- JSONB for flexible schema
- Mature ecosystem and tooling
- Read replicas for scaling reads
- Extensions (pg_stat_statements, pgvector future)

**Cons**:

- Vertical scaling has limits
- Sharding requires third-party tools (Citus)
- Not optimized for time-series data

### Option 2: MySQL/MariaDB

**Description**: Popular open-source relational database.

**Pros**:

- Wide adoption
- Good performance
- Familiar to many developers

**Cons**:

- Less advanced features than PostgreSQL
- JSONB support less mature
- Ecto has first-class PostgreSQL preference

### Option 3: MongoDB

**Description**: Document-oriented NoSQL database.

**Pros**:

- Flexible schema
- Good for hierarchical data
- Native sharding

**Cons**:

- Eventual consistency by default
- Not ideal for relational data
- Ecto doesn't have native support
- Less suitable for financial transactions

### Option 4: CockroachDB

**Description**: Distributed SQL database.

**Pros**:

- Horizontally scalable SQL
- Strong consistency
- PostgreSQL wire protocol

**Cons**:

- Higher operational complexity
- More expensive
- Overkill for current scale

## Decision

**Chosen option: PostgreSQL 16**

We chose PostgreSQL because:

1. **Ecto integration**: Elixir's Ecto ORM has best-in-class PostgreSQL support
2. **Features**: JSONB, full-text search, CTEs, window functions
3. **Reliability**: ACID compliance critical for payments and permissions
4. **Ecosystem**: pg_stat_statements, pg_trgm, pgvector for future AI
5. **Scalability path**: Read replicas now, Citus/sharding later if needed

## Schema Statistics

| Metric         | Value |
| -------------- | ----- |
| Total tables   | 91    |
| Core tables    | 15    |
| Feature tables | 76    |
| Indexes        | 200+  |
| Migrations     | 150+  |

## Key Design Patterns

### UUIDs for Primary Keys

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ...
);
```

Rationale: No sequential ID leaking, distributed generation possible.

### Soft Deletes

```sql
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_posts_active ON posts (id) WHERE deleted_at IS NULL;
```

Rationale: Audit trail, easy recovery, moderation support.

### JSONB for Flexible Data

```sql
CREATE TABLE user_settings (
    user_id UUID REFERENCES users(id),
    settings JSONB DEFAULT '{}'::jsonb
);
```

Rationale: Schema flexibility for user preferences without migrations.

## Consequences

### Positive

- Strong consistency for all operations
- Excellent query performance with proper indexing
- Full-text search built-in (no external service needed)
- JSONB flexibility reduces migration frequency

### Negative

- 91 tables requires careful schema management
- Write scaling limited to single primary
- Full-text search less powerful than Elasticsearch

### Neutral

- Requires connection pooling (PgBouncer or built-in)
- Regular VACUUM maintenance needed

## Scaling Strategy

1. **Current**: Single primary, connection pooling
2. **Phase 2**: Read replicas for query distribution
3. **Phase 3**: Partitioning for large tables (messages)
4. **Phase 4**: Citus for horizontal sharding (if needed)

## Related Decisions

- ADR-006: Redis for caching
- ADR-007: Oban for background jobs

## References

- [PostgreSQL 16 Documentation](https://www.postgresql.org/docs/16/)
- [Ecto PostgreSQL Adapter](https://hexdocs.pm/ecto_sql/Ecto.Adapters.Postgres.html)
- [Schema Ownership](../../SCHEMA_OWNERSHIP.md)
