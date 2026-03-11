# CGraph Forums Infrastructure: Enterprise-Grade Stack for 1M+ Users
**Status:** Production Architecture v1.0  
**Date:** March 11, 2026  
**Scope:** Infrastructure, database, caching, and optimization strategy for 1M+ concurrent forum users  
**Baseline:** Current Fly.io + Supabase setup → Next-gen sharded architecture

---

## EXECUTIVE SUMMARY

Your current infrastructure (Fly.io backend + Supabase Postgres + optional Redis) **will collapse at 100K+ concurrent users** with forums due to:

1. **N+1 query explosion** (every post needs nameplate data: user + borders + badges + titles)
2. **Forum read amplification** (forums = read-heavy, not chat-heavy; 10:1 reads vs writes)
3. **Unsharded PostgreSQL** (single DB instance becomes bottleneck)
4. **Flat caching strategy** (no per-forum or per-user cache locality)
5. **WebSocket presence overhead** (millions of "who's online" events)

This document details a **professionally-scaled architecture** designed for:
- **1M+ concurrent users** (500K reading forums, 200K in groups/DMs, 300K idle)
- **10M posts/day** at peak
- **99.99% availability** (multiple AZs, auto-failover)
- **<200ms P99 latency** for forum reads
- **Cost-efficient** (not running Google-scale infra)

---

## PART 1: DATABASE ARCHITECTURE

### Current Setup (Problematic at Scale)

```
Supabase PostgreSQL (single RW instance)
├── All users
├── All forums
├── All posts (with cosmetics join)
└── All groups/channels
```

**Problems:**
- Single connection pool (300 total, 30 per app instance)
- All writes bottleneck on WAL
- No read replicas for heavy forum reads
- Cosmetics joins require 4-5 table scans per post
- Replication lag on hot data

### Target Architecture: Multi-Tier Database

```
┌─────────────────────────────────────────────────────────┐
│                  LOGICAL DATABASES                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ FORUMS OLTP (PostgreSQL, dedicated shards)      │   │
│  │ - forum_boards, forum_threads, forum_posts      │   │
│  │ - Hot partition (today's posts)                 │   │
│  │ - Archive partition (older posts)               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ COSMETICS OLTP (PostgreSQL, replicated)         │   │
│  │ - cosmetic_nameplates, borders, badges, titles  │   │
│  │ - user_cosmetic_inventory                        │   │
│  │ - user_nameplates (active selections)           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ACCOUNTS OLTP (PostgreSQL, existing)            │   │
│  │ - users, sessions, auth tokens                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ MESSAGING OLTP (PostgreSQL, dedicated)          │   │
│  │ - conversations, messages, groups               │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ANALYTICS OLAP (TimescaleDB or Clickhouse)      │   │
│  │ - forum_activity_stats, user_actions            │   │
│  │ - Append-only, columnar, time-series            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
         ↓              ↓              ↓              ↓
    WRITE POOL     REPLICA POOL   CACHE LAYER    SEARCH
    (Primary)       (Read-only)    (Redis/ETS)    (Meilisearch)
```

### Implementation: PostgreSQL Sharding

**Strategy: Shard by Forum ID (not user)**

```elixir
# Why shard by forum? 
# - Forums are isolated communities (rare cross-forum queries)
# - Queries naturally scoped to single forum
# - Each shard gets dedicated resources
# - Easier to scale popular forums independently

defmodule CGraph.Repo.Router do
  def get_shard(forum_id) do
    shard_num = rem(forum_id, num_shards)
    get_pool("cgraph_forum_shard_#{shard_num}")
  end
end

# Usage in context
def get_posts_in_thread(thread_id, forum_id) do
  shard = CGraph.Repo.Router.get_shard(forum_id)
  
  from(p in Post,
    where: p.thread_id == ^thread_id,
    preload: [:user_nameplate, :reactions]
  )
  |> shard.all()
end
```

**Shard Configuration (for 1M users):**

```yaml
# config/runtime.exs
num_shards: 16                          # 16 independent forum DB instances
shard_pool_size: 50                     # Connections per shard
total_connections: 16 * 50 = 800        # vs. 300 single DB

shard_topology:
  shard_0:                              # forums 0, 16, 32, 48...
    primary: postgres://...-shard0:5432
    replicas:
      - postgres://...-shard0-r1:5432
      - postgres://...-shard0-r2:5432
  shard_1:
    primary: postgres://...-shard1:5432
    replicas:
      - postgres://...-shard1-r1:5432
      - postgres://...-shard1-r2:5432
  # ... 14 more shards
```

**Why This Works:**
- ✓ Writes distributed across 16 primaries (16x throughput)
- ✓ Reads spread across 48 replicas (dedicated read capacity)
- ✓ Each shard ~63K forums (manageable dataset size)
- ✓ Replication lag: <50ms per shard
- ✓ Failure: one shard down = 1/16 forums affected

### Cosmetics Database (Shared, Replicated)

```sql
-- High replication for cosmetics (read-heavy, write-rare)
CREATE TABLE cosmetic_nameplates (
  id BIGINT PRIMARY KEY,
  -- ... schema ...
  INDEX(theme_id, rarity),
  INDEX(created_at DESC)  -- Popular cosmetics query
);

-- Replicate to:
-- - Primary (write)
-- - 5 read replicas (distributed geographically)
-- - Replication lag: <10ms
-- - Cache: Redis + ETS (TTL: 1 hour)
```

### Accounts Database (Single Primary, Replicas)

Keep accounts DB as-is but add replicas:
```
Primary (RW): auth writes + user updates
Replicas (RO):
  - Replica 1: user lookups, profile reads
  - Replica 2: session validation
  - Replica 3: cosmetics inventory reads
```

### Archive/Cold Storage Strategy

```elixir
# Posts older than 30 days → TimescaleDB (hypertable)
# Hot tier: Latest 30 days in main shard
# Warm tier: 30-90 days in TimescaleDB (columnar)
# Cold tier: >90 days in S3 (Parquet files)

defmodule CGraph.Forums.Post.Archival do
  def archive_old_posts(forum_id, days_threshold \\ 30) do
    cutoff_date = DateTime.utc_now() |> DateTime.add(-days_threshold, :day)
    
    # Move posts older than cutoff to TimescaleDB
    from(p in Post,
      where: p.created_at < ^cutoff_date and p.forum_id == ^forum_id
    )
    |> Repo.stream()
    |> Stream.chunk_every(10000)
    |> Enum.each(fn chunk ->
      TimescaleDB.insert_many(chunk)
      Repo.delete_all(from p in Post, where: p.id in ^Enum.map(chunk, & &1.id))
    end)
  end
end

# Query interface (automatic routing)
def get_post(post_id, forum_id) do
  case Repo.get(Post, post_id) do
    nil -> TimescaleDB.get_post(post_id)  # Check archive
    post -> post
  end
end
```

---

## PART 2: CACHING LAYER

### Three-Tier Caching Strategy

```
┌──────────────────────────────────────────────────────┐
│ TIER 1: Application Memory (ETS)                     │
│ - In-process, zero-latency                           │
│ - Cosmetics, themes, user nameplates                 │
│ - TTL: 1 hour (cosmetics rarely change)              │
│ - Size: ~500MB per app instance                      │
├──────────────────────────────────────────────────────┤
│ TIER 2: Redis (Distributed Cache)                    │
│ - Forums: thread list, board list, top posts         │
│ - Accounts: user profiles, sessions                  │
│ - TTL: 5 minutes (forum data fresher)                │
│ - Size: 100GB cluster (8x16GB nodes)                 │
├──────────────────────────────────────────────────────┤
│ TIER 3: Database Replicas (Query Cache)              │
│ - Direct reads from read replicas                    │
│ - No separate cache needed                           │
│ - TTL: Replication lag (~50ms)                       │
└──────────────────────────────────────────────────────┘
```

### Cache Implementation

```elixir
# Tier 1: ETS Cache (Cosmetics)
defmodule CGraph.Cosmetics.Cache do
  @cache_ttl 3600  # 1 hour
  
  def load_all_cosmetics() do
    case :ets.lookup(:cosmetics_cache, "all") do
      [{_, cosmetics, expiry}] when expiry > System.monotonic_time() ->
        {:ok, cosmetics}
      _ ->
        cosmetics = Repo.all(Cosmetic)
        :ets.insert(:cosmetics_cache, {"all", cosmetics, System.monotonic_time() + @cache_ttl})
        {:ok, cosmetics}
    end
  end
  
  def invalidate() do
    :ets.delete(:cosmetics_cache, "all")
  end
end

# Tier 2: Redis Cache (Forum Data)
defmodule CGraph.Forums.RedisCache do
  def get_board_threads(board_id, page \\ 1) do
    cache_key = "board:#{board_id}:threads:#{page}"
    
    case Redis.get(cache_key) do
      {:ok, data} when data != nil -> 
        {:ok, Jason.decode!(data)}
      _ ->
        threads = get_fresh_threads(board_id, page)
        Redis.setex(cache_key, 300, Jason.encode!(threads))  # 5 min TTL
        {:ok, threads}
    end
  end
  
  def invalidate_board_cache(board_id) do
    Redis.del("board:#{board_id}:*")
  end
end

# Query patterns to cache aggressively
cache_patterns = [
  "board:LIST",              # All boards in forum (< 100 items)
  "thread:COUNT",            # Total threads per board
  "user:nameplate",          # User's active nameplate
  "cosmetics:by_theme",      # Shop inventory per theme
  "reputation:leaderboard",  # Top 100 users per forum
]
```

### Cache Invalidation Strategy

```elixir
# Event-driven invalidation (NOT time-based only)
defmodule CGraph.Forums.Events do
  def post_created(post_event) do
    # Invalidate related caches
    Thread.invalidate_cache(post_event.thread_id)
    Board.invalidate_cache(post_event.board_id)
    UserReputation.recalculate_async(post_event.user_id)
    
    # Broadcast via WebSocket (connected users see update instantly)
    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "thread:#{post_event.thread_id}",
      {:post_created, post_event}
    )
  end
  
  def cosmetic_purchased(purchase_event) do
    Cache.invalidate_user_nameplates(purchase_event.user_id)
    # User's nameplate might change → invalidate everywhere it appears
  end
end
```

---

## PART 3: MESSAGE QUEUE & ASYNC PROCESSING

### Current Oban Setup (Single Queue)
**Problem:** All jobs compete: emails, webhooks, forum notifications, cosmetics processing.

### Improved: Multi-Queue Oban

```elixir
# config/runtime.exs
config :cgraph, Oban,
  engine: Oban.Engines.Basic,
  queues: [
    # Forum processing (high throughput, lower priority)
    forum_indexing: [limit: 100, max_concurrent: 10],      # Full-text search
    forum_stats: [limit: 50, max_concurrent: 5],           # Stats aggregation
    
    # User actions (medium throughput, medium priority)
    reputation_calc: [limit: 50, max_concurrent: 5],      # Reputation recalc
    user_notifications: [limit: 100, max_concurrent: 10], # Push/email
    
    # Critical path (low throughput, high priority)
    critical: [limit: 10, max_concurrent: 3],             # Auth, security
    payments: [limit: 20, max_concurrent: 5],             # Stripe webhooks
    
    # Batch operations (overnight)
    batch: [limit: 5, max_concurrent: 1, schedule_in: {1800, :seconds}],
  ],
  repo: CGraph.Repo
```

### Async Forum Operations

```elixir
# Forum post → async chain (not blocking response)
defmodule CGraph.Forums.PostCreationFlow do
  def create_post(params, user) do
    case Repo.insert(Post.changeset(params, user)) do
      {:ok, post} ->
        # Respond to user immediately
        {:ok, post}
        
        # Then queue async work
        |> then(fn post ->
          # Lower priority: index for search
          SearchIndexWorker.new(%{"post_id" => post.id})
          |> Oban.insert()
          
          # Medium priority: update reputation (may unlock badges)
          ReputationCalcWorker.new(%{"user_id" => user.id, "forum_id" => post.forum_id})
          |> Oban.insert(wait: 60)  # Wait 1 min (batch updates)
          
          # Critical: update thread stats (users see updated count)
          UpdateThreadStatsWorker.new(%{"thread_id" => post.thread_id})
          |> Oban.insert()
          
          {:ok, post}
        end)
      
      {:error, changeset} -> {:error, changeset}
    end
  end
end
```

---

## PART 4: SEARCH & INDEXING

### Current: Meilisearch (Good for 1M users, needs tuning)

**Problem:** Re-indexing entire forum on every post = slow + expensive.

### Improved: Selective Indexing

```elixir
# Only index "important" posts (avoid index bloat)
defmodule CGraph.Search.Indexer do
  def should_index_post?(post) do
    # Only index if:
    # 1. Post is recent (< 30 days)
    # 2. Thread is not archived
    # 3. Post has engagement (reactions, replies)
    # 4. Not duplicate content
    
    now = DateTime.utc_now()
    
    not is_deleted?(post) and
    DateTime.diff(now, post.created_at, :day) < 30 and
    not post.thread.archived? and
    (post.reply_count > 0 or post.reaction_count > 0)
  end
  
  def bulk_index_posts(forum_id) do
    from(p in Post,
      where: p.forum_id == ^forum_id and p.created_at > ago(30, "day"),
      select: %{
        id: p.id,
        thread_id: p.thread_id,
        title: p.thread.title,
        content: p.content,
        username: p.user.username,
        created_at: p.created_at,
        reactions: p.reaction_count
      }
    )
    |> Repo.stream()
    |> Stream.filter(&should_index_post?/1)
    |> Stream.chunk_every(5000)
    |> Enum.each(&Meilisearch.index/1)
  end
end
```

### Meilisearch Configuration for 1M Posts

```yaml
# docker-compose or Kubernetes
meilisearch:
  image: getmeili/meilisearch:v1.12
  environment:
    MEILI_ENV: production
    MEILI_MASTER_KEY: ${MEILI_KEY}
    MEILI_MAX_INDEX_SIZE: 100GB    # Large enough for 1M posts
    MEILI_SNAPSHOT_DIR: /snapshots
  volumes:
    - meilisearch_data:/meili_data
  resources:
    requests:
      cpu: 4000m      # 4 CPU cores
      memory: 16Gi    # 16GB RAM
    limits:
      cpu: 8000m
      memory: 32Gi

# Index configuration
{
  "indexName": "forum_posts",
  "primaryKey": "id",
  "searchableAttributes": ["title", "content", "username"],
  "displayedAttributes": ["id", "title", "username", "created_at"],
  "filterableAttributes": ["forum_id", "created_at", "username"],
  "sortableAttributes": ["created_at", "reactions"],
  "pagination": {
    "maxTotalHits": 10000
  },
  "typoTolerance": {
    "enabled": true,
    "minWordSizeForTypos": {
      "oneTypo": 5,
      "twoTypos": 9
    }
  }
}
```

---

## PART 5: WEBSOCKET & REAL-TIME ARCHITECTURE

### Current: Single WebSocket Pool
**Problem:** 500K concurrent connections on single Fly.io instance = overload.

### Improved: Multi-Region WebSocket Mesh

```
┌─────────────────────────────────────────────────┐
│ CloudFlare Durable Objects (Edge Compute)       │
│ - Handle WebSocket connection upgrades          │
│ - Regional routing (users → nearest region)     │
│ - Presence aggregation (who's online where)     │
└─────────────────────────────────────────────────┘
         ↓           ↓           ↓           ↓
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │Fly.io   │ │Fly.io   │ │Fly.io   │ │Fly.io   │
    │Region1  │ │Region2  │ │Region3  │ │Region4  │
    │ fra     │ │sjc      │ │sin      │ │syd      │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘
         ↓           ↓           ↓           ↓
    (125K users per region)
         ↓           ↓           ↓           ↓
       PostgreSQL Shards + Redis Mesh
```

### WebSocket Connection Strategy

```elixir
# Limit connections per Fly instance
defmodule CGraph.WebSocket.ConnectionManager do
  @max_connections_per_instance 50_000
  
  def handle_incoming_connection(socket) do
    current = count_active_connections()
    
    if current >= @max_connections_per_instance do
      # Gracefully reject, client reconnects to different region
      {:error, :instance_full, 
       "Connecting to nearest available region..."}
    else
      # Accept connection, assign to board/thread channel
      {:ok, socket}
    end
  end
end

# Presence optimizations
defmodule CGraph.Forums.Presence do
  @presence_sample_rate 0.1  # Only track 10% of connections locally
  
  def track_user(socket, user_id, thread_id) do
    # Sample: don't broadcast every single presence change
    if :random.uniform() < @presence_sample_rate do
      Phoenix.Presence.track(socket, user_id, %{
        thread_id: thread_id,
        timestamp: System.monotonic_time()
      })
    end
  end
  
  # Aggregate presence server-side (not per client)
  def get_thread_presence(thread_id) do
    Redis.get("presence:#{thread_id}:count")
    # vs. summing all individual presence events
  end
end
```

### PubSub Channel Optimization

```elixir
# Don't subscribe to global channel (explosion at scale)
# Subscribe to specific scopes instead

defmodule CGraph.Forums.ThreadChannel do
  def join("thread:" <> thread_id, _payload, socket) do
    # Subscribe to specific thread only
    Phoenix.PubSub.subscribe(CGraph.PubSub, "thread:#{thread_id}:posts")
    Phoenix.PubSub.subscribe(CGraph.PubSub, "thread:#{thread_id}:reactions")
    
    # Don't subscribe to "thread:presence" (too noisy)
    # Instead, query presence on demand
    
    {:ok, socket}
  end
  
  def handle_info({:post_created, post}, socket) do
    # Only push to relevant thread subscribers
    push(socket, "new_post", post)
    {:noreply, socket}
  end
end
```

---

## PART 6: CDN & STATIC ASSET OPTIMIZATION

### Cosmetic Assets (SVG/PNG Borders, Badges, Frames)

```
Cloudflare → R2 Bucket → Origin
  ↓          ↓           ↓
Edge        Permanent   Source
(cache)     Storage     Truth

- Borders: cosmetics-borders/border-123.svg
- Badges: cosmetics-badges/badge-456.png
- Nameplates: cosmetics-nameplates/nameplate-789.svg
- Themes: cosmetics-themes/theme-10.css

Cache headers:
  - SVG assets: 1 year (immutable, versioned in URL)
  - CSS themes: 1 hour (may be updated)
  - PNG images: 30 days
```

### Avatar + Cosmetics Composite Generation

```typescript
// Client-side composite (avoid server load)
// Avatar + Border + Badge overlay
//
// Option 1 (recommended): SVG overlay on client
// <svg>
//   <circle r="50" fill="url(#avatar)" />
//   <use href="border-123.svg" />  <!-- Border cached from CDN -->
// </svg>

// Option 2 (if needed): Server-side image generation
// Use: sharp (Node.js image processing)
// Generate: avatar + border composite
// Cache: Redis with 24h TTL
// Store: R2 temporary
```

---

## PART 7: MONITORING & OBSERVABILITY

### Key Metrics for Forums at Scale

```yaml
# Prometheus metrics to track
forum_posts_created_total:
  - By forum_id, board_id (cardinality explosion risk)
  - Aggregate: posts_per_minute

forum_post_latency:
  - P50, P95, P99 (target: <200ms P99)
  - By shard (identify hot shards)

database_connection_pool:
  - Available connections per shard
  - Wait time for connections (queueing)
  - Idle connections (connection bloat)

cache_hit_rates:
  - ETS hit rate (target: >95% for cosmetics)
  - Redis hit rate (target: >80% for forums)
  - Database replica lag (target: <50ms)

websocket_connections:
  - By region (load balancing check)
  - Connection churn rate (disconnects)
  - Message throughput (posts/sec)

search_index:
  - Meilisearch latency (target: <100ms P95)
  - Index size growth
  - Indexing job queue depth
```

### Observability Stack

```yaml
# Existing: Grafana Cloud ✓

# Add: Custom dashboard for Forums
dashboard_forum_operations:
  - Post creation rate (spike detection)
  - Thread creation rate (spam detection)
  - Database shard load (identify bottlenecks)
  - Cache evictions (OOM warnings)
  - Cosmetics shop activity (engagement metric)

# Add: Alerting rules
alerts:
  - Shard connection pool > 90% full
  - Cache evictions > 10/sec (OOM risk)
  - Post latency P99 > 500ms
  - Websocket connections unbalanced (regions)
  - Search index lag > 5 minutes
```

---

## PART 8: COST ESTIMATION (1M Users)

### Database Costs

```yaml
PostgreSQL Shards (16x):
  - Primary: db.r6i.2xlarge (8vCPU, 64GB RAM) × 16 = $20K/month
  - Replicas: db.r6i.xlarge (4vCPU, 32GB RAM) × 48 = $36K/month
  Total DB: $56K/month

Cosmetics DB (shared):
  - Primary: db.r6i.2xlarge = $1.25K/month
  - Replicas: db.r6i.xlarge × 5 = $3.75K/month
  Total: $5K/month

TimescaleDB (archive):
  - Archive storage: db.r6i.xlarge = $1.25K/month
  - S3 cold storage (very cheap)
  Total: $1.5K/month

Total Database: ~$62.5K/month
```

### Caching & Message Queue

```yaml
Redis Cluster (100GB):
  - 8 nodes × 16GB = $8K/month

Oban Queue Storage:
  - Included in PostgreSQL

Total Caching: ~$8K/month
```

### Compute (Application Servers)

```yaml
Fly.io Backend (scaled):
  - Current: 2 machines × shared-cpu
  - Scaled: 20 machines (2.5M requests/hour)
    - 5 regions × 4 machines
    - shared-cpu or performance (depends on load)
  - Cost: ~$3K/month

Web App (Vercel):
  - Existing: $50-200/month

Mobile CI/CD (EAS Build):
  - Usage-based: ~$500/month
  
Total Compute: ~$3.5K/month
```

### Search & Indexing

```yaml
Meilisearch (self-hosted on Fly):
  - Dedicated machine: 4 CPU, 16GB RAM = $500/month

Cloudflare CDN:
  - R2 storage (cosmetics): ~$100/month
  - Cache egress: ~$200/month

Total Search: ~$800/month
```

### **Total Monthly Infrastructure Cost: ~$75K/month**

**Optimization paths:**
- Use AWS reserved instances (-40%) → $45K/month
- Use DigitalOcean databases (-30%) → $52.5K/month
- Aggressive caching (reduce DB queries 50%) → $37.5K/month

---

## PART 9: IMPLEMENTATION PHASES

### Phase 1: Database Sharding (Weeks 1-4)

**Goal:** Prepare sharding infrastructure without migrating data yet.

```elixir
# Step 1: Deploy shard topology (read-only mirror)
- Provision 16 PostgreSQL shards (primary + 2 replicas each)
- Setup replication from main DB → shards (mirror mode)
- Deploy Elixir router (CGraph.Repo.Router)
- Test failover per shard

# Step 2: Add dual-write logic
- Code changes: write to BOTH main DB + shards
- Reads: still from main DB
- Validation: data in shards matches main DB

# Step 3: Gradual cutover (by forum ID range)
- Week 2: Forums 0-50K → read from shard 0
- Week 3: Forums 50K-150K → read from shards 1-3
- Week 4: All forums → read from shards, writes stay dual
```

**Rollback plan:** All reads revert to main DB instantly.

### Phase 2: Caching Upgrade (Weeks 5-6)

```elixir
# ETS improvements
- Load all 340 cosmetics into ETS on startup
- Set ttl-based eviction (1 hour)
- Monitor ETS memory usage

# Redis scaling
- Upgrade from optional to required
- Setup Redis cluster (8 nodes)
- Implement cache invalidation events

# Monitor: cache hit rates, eviction count, memory usage
```

### Phase 3: WebSocket Regionalization (Weeks 7-8)

```elixir
# Geographic routing
- Users connect to nearest Fly region
- Connections distributed: 125K per region × 4 = 500K

# Presence sampling
- Track only 10% of presence events
- Query presence server-side (aggregated)

# Monitor: connections per region, message latency
```

### Phase 4: Performance Testing (Weeks 9-10)

```bash
# Load test with k6
# - 500K concurrent users
# - 10M posts/day
# - 100K searches/hour
# - 1K cosmetics purchases/hour

# Monitor during test:
# - Database shard CPU/memory
# - Cache hit rates
# - WebSocket message latency
# - Application response times
```

---

## PART 10: PRODUCTION CHECKLIST

### Before Launch

- [ ] All 16 shards deployed and replicated
- [ ] Redis cluster operational (8 nodes)
- [ ] Meilisearch indexing works
- [ ] Database backup/restore tested (all shards)
- [ ] Disaster recovery plan documented
- [ ] Monitoring dashboards created
- [ ] On-call runbook written
- [ ] Load test completed (500K users)
- [ ] Failover tested per shard
- [ ] Cache invalidation working end-to-end
- [ ] WebSocket regional routing working
- [ ] Cosmetics CDN asset delivery tested
- [ ] Mobile app cosmetics caching (WatermelonDB) tested

### Ongoing Operations

```yaml
Daily:
  - Monitor shard CPU/memory usage
  - Check cache hit rates
  - Verify replication lag < 50ms per shard

Weekly:
  - Database health check (index bloat, dead tuples)
  - Archive old posts to TimescaleDB
  - Cosmetics inventory audit

Monthly:
  - Capacity planning (growth trending)
  - Cost review (optimizer opportunities)
  - Disaster recovery drill (restore from backup)
```

---

## APPENDIX: Quick Reference

### Database Shard Lookup

```elixir
defmodule CGraph.ShardRouter do
  def forum_to_shard(forum_id) do
    shard_num = rem(forum_id, 16)
    config("shard_#{shard_num}")
  end
  
  def get_primary(shard_num), do: config("shard_#{shard_num}:primary")
  def get_replicas(shard_num), do: config("shard_#{shard_num}:replicas")
end
```

### Cache Keys Pattern

```
ETS:
  cosmetics:all
  cosmetics:by_theme:#{theme_id}
  
Redis:
  board:#{board_id}:threads:#{page}
  thread:#{thread_id}:posts:#{page}
  user:#{user_id}:nameplate
  leaderboard:#{forum_id}:reputation
```

### Metrics SLO Targets

```
Forum Read: P99 < 200ms
Forum Write: P99 < 500ms
Search Query: P95 < 100ms
WebSocket Message: P99 < 100ms
Cache Hit Rate: > 85%
Database Replication Lag: < 50ms
Availability: > 99.99%
```

---

**Document Version:** 1.0  
**Last Updated:** March 11, 2026  
**Status:** Ready for database architecture review
