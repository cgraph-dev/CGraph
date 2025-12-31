# Current Limitations and How to Scale

Honest assessment of what the system can handle and what to do when it can't.

---

## Current Capacity Estimates

Based on the current architecture:

| Metric | Current Limit | Bottleneck |
|--------|--------------|------------|
| Concurrent users | ~5,000 | WebSocket connections |
| Messages per second | ~1,000 | Database writes |
| Active conversations | ~50,000 | Memory (PubSub) |
| Forum posts | ~1 million | Database queries |
| File storage | Unlimited | S3/R2 |
| API requests/sec | ~10,000 | Rate limiter |

These are rough estimates. Actual limits depend on server specs and query patterns.

---

## Known Limitations

### 1. Single Database

We currently run a single PostgreSQL instance.

**Impact:**
- All reads and writes go to one server
- No horizontal read scaling
- Single point of failure (even with backups)

**When it becomes a problem:**
- High read load (many concurrent queries)
- Write contention (many users writing simultaneously)
- Data size exceeds single server capacity

**How to fix:**
- Add read replicas for read scaling
- Use connection pooler (PgBouncer) for connection limits
- Consider sharding for massive scale (complex)

### 2. WebSocket Scaling

Phoenix Channels are powerful but single-node by default.

**Impact:**
- Can't just add more servers without PubSub setup
- All channel state is in-memory
- Server restart loses all connections

**When it becomes a problem:**
- More than ~10,000 concurrent WebSocket connections
- Need to deploy multiple backend servers

**How to fix:**
- Already configured: Phoenix PubSub with PostgreSQL adapter
- Can switch to Redis PubSub for better performance
- Consider dedicated real-time service (e.g., Ably, Pusher) for massive scale

### 3. Background Job Processing

Oban runs on PostgreSQL.

**Impact:**
- Jobs compete with main app for database connections
- No job priority across multiple queues
- Complex workflows need careful design

**When it becomes a problem:**
- Many jobs backed up
- Jobs causing database load

**How to fix:**
- Dedicated Oban database connection pool
- Separate worker nodes for job processing
- Consider Redis-based job queue (Exq, Verk) for extreme scale

### 4. Search

No dedicated search engine.

**Impact:**
- Full-text search uses PostgreSQL's built-in features
- Large text searches can be slow
- Limited relevance ranking

**When it becomes a problem:**
- Millions of forum posts
- Users expect Google-like search

**How to fix:**
- Add Elasticsearch or Meilisearch
- Keep PostgreSQL for simple queries
- Sync data to search engine asynchronously

### 5. File Storage

Currently all uploads go to S3/R2.

**Impact:**
- Good: Infinitely scalable storage
- Issue: No CDN configured by default

**How to fix:**
- Add CloudFlare CDN in front of R2
- Use CloudFront for S3
- Configure proper cache headers

### 6. Rate Limiting

In-memory rate limiting with Cachex.

**Impact:**
- Rate limits are per-server
- If running multiple servers, limits aren't shared

**How to fix:**
- Switch to Redis-based rate limiting
- Use distributed Cachex configuration

---

## Scaling Strategies

### Vertical Scaling (Scale Up)

The easiest first step. Just get a bigger server.

| Component | How to scale |
|-----------|-------------|
| Backend | More CPU cores, more RAM |
| Database | Bigger instance, more IOPS |
| Redis | More memory |

**When to use:** You're not at scale yet. A beefy server handles a lot.

**Limits:** Eventually hits hardware ceiling or cost becomes prohibitive.

### Horizontal Scaling (Scale Out)

Add more servers behind a load balancer.

```
                    ┌──────────┐
                    │   Load   │
                    │ Balancer │
                    └────┬─────┘
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         ┌────────┐ ┌────────┐ ┌────────┐
         │Backend │ │Backend │ │Backend │
         │  #1    │ │  #2    │ │  #3    │
         └───┬────┘ └───┬────┘ └───┬────┘
             │          │          │
             └──────────┼──────────┘
                        ▼
                   ┌─────────┐
                   │ Primary │
                   │   DB    │
                   └─────────┘
```

**Requirements for horizontal scaling:**
1. Stateless backend (we're already there)
2. Shared session storage (database or Redis)
3. Distributed PubSub (configured)
4. Shared rate limiting (need Redis)

### Database Scaling

**Read replicas:**
```elixir
# config/prod.exs
config :cgraph, Cgraph.Repo,
  primary: [
    hostname: "primary.db.example.com",
    port: 5432
  ],
  replicas: [
    [hostname: "replica1.db.example.com"],
    [hostname: "replica2.db.example.com"]
  ]
```

**Connection pooling:**
```bash
# Use PgBouncer in front of PostgreSQL
# Handles 1000s of connections with few actual DB connections
```

**Partitioning:**
For tables like messages or notifications that grow forever:
```sql
-- Partition by month
CREATE TABLE messages (
    id UUID,
    content TEXT,
    inserted_at TIMESTAMP
) PARTITION BY RANGE (inserted_at);

CREATE TABLE messages_2024_01 PARTITION OF messages
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

## Performance Benchmarks

### API Endpoints (single server, 4 cores)

Tested with k6:

| Endpoint | RPS | P95 Latency |
|----------|-----|-------------|
| GET /health | 50,000 | 2ms |
| GET /me | 5,000 | 15ms |
| GET /conversations | 2,000 | 45ms |
| POST /messages | 1,000 | 80ms |
| GET /forums/:slug/posts | 1,500 | 60ms |

### WebSocket

| Metric | Value |
|--------|-------|
| Connections per server | 10,000 |
| Messages broadcast/sec | 50,000 |
| Memory per connection | ~10KB |

---

## Cost Scaling

Rough estimates for different scales:

### Small (1,000 users)

| Resource | Spec | Monthly Cost |
|----------|------|-------------|
| Backend | 2 vCPU, 4GB RAM | $20-40 |
| Database | 2 vCPU, 4GB RAM | $30-50 |
| Storage | 50GB S3/R2 | $1-5 |
| **Total** | | **$50-100** |

### Medium (50,000 users)

| Resource | Spec | Monthly Cost |
|----------|------|-------------|
| Backend (x3) | 4 vCPU, 8GB RAM | $150-300 |
| Load Balancer | | $20-50 |
| Database | 8 vCPU, 32GB RAM | $200-400 |
| Redis | 2GB | $30-50 |
| Storage | 500GB | $10-25 |
| CDN | | $50-100 |
| **Total** | | **$500-1000** |

### Large (500,000+ users)

This requires proper infrastructure planning. Talk to cloud architects.

---

## What We Don't Support Yet

Things that would need significant work:

1. **Multi-region deployment** - No active-active database setup
2. **Microservices** - Monolithic architecture (not necessarily bad)
3. **Event sourcing** - Traditional CRUD pattern
4. **Real-time analytics** - Would need separate analytics pipeline
5. **Machine learning** - No ML infrastructure
6. **End-to-end encryption** - Messages stored in plaintext

---

## Monitoring for Scale Issues

Signs you're hitting limits:

### Database

- Connection pool exhausted errors
- Query times increasing
- Lock wait timeouts
- Disk I/O maxed

### Backend

- Response times creeping up
- Memory usage climbing
- CPU consistently high
- WebSocket disconnects

### What to monitor

```elixir
# Already set up: Telemetry metrics
# Check Prometheus/Grafana for:
# - http.request.duration
# - phoenix.channel.join.duration
# - ecto.query.total_time
# - vm.memory.total
```

---

## When to Scale

Don't optimize prematurely. Scale when:

1. **Metrics show problems** - Not just "we might need it"
2. **Users complaining** - Real performance issues
3. **Cost-effective** - Scaling costs less than the problem costs
4. **You understand the bottleneck** - Don't guess, measure

Start with:
1. Add monitoring first
2. Identify actual bottleneck
3. Fix that specific thing
4. Repeat

---

## Emergency Scaling

If things are melting:

### Quick wins

1. **Add caching** - Cache hot queries with Cachex
2. **Rate limit harder** - Reduce API limits temporarily
3. **Disable features** - Turn off expensive features (search, etc.)
4. **Increase server size** - Throw money at it temporarily

### Temporary measures

```elixir
# Emergency cache for hot data
def get_forum(slug) do
  Cachex.fetch(:forums, slug, fn _ ->
    {:commit, Repo.get_by(Forum, slug: slug)}
  end)
end
```

```bash
# Quick vertical scale on Fly.io
fly scale vm dedicated-cpu-4x --memory 8192
```

---

*Last updated: December 31, 2025*
