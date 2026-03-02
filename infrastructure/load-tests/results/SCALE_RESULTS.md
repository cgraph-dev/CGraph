# CGraph Scale Test Results

> **Infrastructure validation for 10,000+ concurrent users**
>
> Tests run against: Fly.io staging (2 vCPU, 4GB RAM, single node)
>
> Date: 2026-03-02 (placeholder — actual test run pending)

---

## Test Suite Overview

| Test Script | Focus | Duration | Peak VUs |
|---|---|---|---|
| `websocket-10k.js` | WebSocket connection scaling | 12 min | 10,000 |
| `realistic-traffic.js` | User journey simulation | 17 min | 500 |
| `rich-media.js` | Phase 18 media features | 5 min | 370 (arrival rate) |

---

## 1. WebSocket 10K Test (`websocket-10k.js`)

Tests 10,000 concurrent WebSocket connections with realistic behavior distribution:
- 80% idle (8,000 VUs) — connected, receive-only
- 15% active chatters (1,500 VUs) — messages every 5-30s
- 5% heavy users (500 VUs) — messages every 1-5s, channel switching

### Results

| Metric | Value | Threshold | Pass |
|---|---|---|---|
| Peak connections | _TBD_ | 10,000 | ⏳ |
| p95 connect time | _TBD_ ms | < 3,000 ms | ⏳ |
| p99 connect time | _TBD_ ms | < 5,000 ms | ⏳ |
| p95 message latency | _TBD_ ms | < 200 ms | ⏳ |
| p99 message latency | _TBD_ ms | < 500 ms | ⏳ |
| Total WS errors | _TBD_ | < 50 | ⏳ |
| Connection fail rate | _TBD_ % | < 1% | ⏳ |
| Messages sent | _TBD_ | — | — |
| Messages received | _TBD_ | — | — |
| Reconnections | _TBD_ | — | — |

### Connection Ramp Profile

```
VUs
10K ─────────────────────────────────────┐
     ╱                                    │
    ╱                                     │
   ╱                                      │
  ╱                                       │
 ╱                                        ╲
──────┼────────┼────────┼────────┼────────┼──
   0m      2m      5m      10m     12m
```

---

## 2. Realistic Traffic Test (`realistic-traffic.js`)

Models complete user journeys as a state machine:
login → browse → message burst → search → idle → disconnect

### Results

| Metric | Value | Threshold | Pass |
|---|---|---|---|
| Peak VUs | _TBD_ | 500 | ⏳ |
| Login p95 | _TBD_ ms | < 2,000 ms | ⏳ |
| Browse conversations p95 | _TBD_ ms | < 1,000 ms | ⏳ |
| Message send p95 | _TBD_ ms | < 500 ms | ⏳ |
| Search p95 | _TBD_ ms | < 1,000 ms | ⏳ |
| WS connect p95 | _TBD_ ms | < 3,000 ms | ⏳ |
| WS message latency p95 | _TBD_ ms | < 200 ms | ⏳ |
| WS message latency p99 | _TBD_ ms | < 500 ms | ⏳ |
| Journey error rate | _TBD_ % | < 5% | ⏳ |
| Journeys completed | _TBD_ | — | — |
| HTTP req duration p95 | _TBD_ ms | < 2,000 ms | ⏳ |

### State Machine Flow

```
┌───────┐   ┌────────┐   ┌───────────┐   ┌────────┐   ┌──────┐   ┌────────────┐
│ Login │──►│ Browse │──►│ Messaging │──►│ Search │──►│ Idle │──►│ Disconnect │
└───────┘   └────────┘   └───────────┘   └────────┘   └──────┘   └────────────┘
  HTTP        HTTP          WS+HTTP        HTTP         WS only      WS close
  1-3s        2-5s          ~30s+          2-5s         1-3min
```

---

## 3. Rich Media Test (`rich-media.js`)

Tests Phase 18 features at sustained arrival rates:

### Results

| Scenario | Rate | p95 Latency | Threshold | Pass |
|---|---|---|---|---|
| Voice upload | 10/s | _TBD_ ms | < 2,000 ms | ⏳ |
| File upload | 20/s | _TBD_ ms | < 3,000 ms | ⏳ |
| GIF search | 50/s | _TBD_ ms | < 500 ms | ⏳ |
| Scheduled CRUD | 5/s | _TBD_ ms | < 300 ms | ⏳ |

| Metric | Value | Threshold | Pass |
|---|---|---|---|
| Voice upload p99 | _TBD_ ms | < 4,000 ms | ⏳ |
| File upload p99 | _TBD_ ms | < 5,000 ms | ⏳ |
| GIF search p99 | _TBD_ ms | < 1,000 ms | ⏳ |
| Scheduled CRUD p99 | _TBD_ ms | < 500 ms | ⏳ |
| Error rate | _TBD_ % | < 5% | ⏳ |
| Upload errors | _TBD_ | — | — |
| Search errors | _TBD_ | — | — |
| CRUD errors | _TBD_ | — | — |

---

## Infrastructure Configuration

### WebSocket Backpressure

| Setting | Value | Source |
|---|---|---|
| `max_connections` | 15,000 | `runtime.exs` transport_options |
| `num_acceptors` | 100 | `runtime.exs` transport_options |
| `backlog` | 2,048 | `runtime.exs` socket_opts |
| `MAX_WS_CONNECTIONS` | 10,000 | env var → ConnectionMonitor |
| `WS_CAPACITY_THRESHOLD` | 0.9 | env var → ConnectionMonitor |
| Socket timeout | 10,000 ms | `endpoint.ex` |
| Socket compression | enabled | `endpoint.ex` |

### Rate Limiting

| Tier | Multiplier | Example: API (1000/hr) |
|---|---|---|
| Free | 1x | 1,000 req/hr |
| Premium | 2x | 2,000 req/hr |
| Enterprise | 5x | 5,000 req/hr |

All pipelines confirmed rate-limited via `RateLimiterV2`:
- `:api` → standard tier
- `:api_auth_strict` → strict tier
- `:api_relaxed` → relaxed tier
- `:api_auth` → standard tier
- `:api_admin` → standard tier

### Feature Flags

| Component | Status |
|---|---|
| Backend API (CRUD + history) | ✅ |
| Feature flag admin panel (web) | ✅ |
| useFeatureFlag hook (web) | ✅ |
| useFeatureFlag hook (mobile) | ✅ |
| featureFlagStore (web + mobile) | ✅ |
| 5-min cache + AsyncStorage offline | ✅ |

---

## Recommendations

Based on configuration and expected test results:

- [ ] **Multi-node scaling**: If p99 > 500ms on single node, scale to 2-node cluster on Fly.io
- [ ] **Redis rate limiting**: Enable Redis-backed rate limiter for distributed rate state across nodes
- [ ] **CDN for static files**: Offload file upload serving to Cloudflare R2 CDN for reduced latency
- [ ] **Connection pooling**: Deploy PgBouncer in front of PostgreSQL for connection multiplexing
- [ ] **Read replica**: Enable read replica for leaderboard/analytics queries under high load
- [ ] **Horizontal WebSocket**: Implement Phoenix PubSub Redis adapter for multi-node presence
- [ ] **Voice transcoding**: Move Opus transcoding to background workers (Oban) to avoid blocking uploads

## Running the Tests

```bash
# Install k6
brew install grafana/k6/k6         # macOS
# or: apt install k6               # Ubuntu

# Run individual tests
k6 run --env BASE_URL=https://staging.cgraph.org infrastructure/load-tests/k6/websocket-10k.js
k6 run --env BASE_URL=https://staging.cgraph.org infrastructure/load-tests/k6/realistic-traffic.js
k6 run --env BASE_URL=https://staging.cgraph.org infrastructure/load-tests/k6/rich-media.js

# Run with JSON output for analysis
k6 run --out json=results/ws-10k.json --env BASE_URL=https://staging.cgraph.org k6/websocket-10k.js

# Run all via script
./infrastructure/load-tests/run-load-test.sh staging
```

---

_Generated: 2026-03-02_
_Tests: websocket-10k.js, realistic-traffic.js, rich-media.js_
_Environment: Fly.io staging (2 vCPU, 4GB RAM, single node)_
