# Load Test Results

> **Status**: Infrastructure ready, pending first staging run  
> **Last Updated**: 2025-02-15  
> **Scripts**: [`infrastructure/load-tests/k6/`](../infrastructure/load-tests/k6/)

## Test Suite Overview

CGraph uses [k6](https://k6.io/) for load testing with 5 test profiles covering HTTP APIs, WebSocket
channels, and write-heavy workloads.

| Test          | Cadence            | Peak VUs | Duration | Purpose                                   |
| ------------- | ------------------ | -------- | -------- | ----------------------------------------- |
| **Smoke**     | Every PR → staging | 10       | 60s      | Validate core APIs work                   |
| **Load**      | Weekly             | 100      | ~5 min   | Sustained-load regression detection       |
| **Stress**    | Monthly            | 500      | ~10 min  | Find breaking points                      |
| **WebSocket** | On demand          | ~330     | ~5 min   | Connection stability & message throughput |
| **Writes**    | On demand          | ~130     | ~4.5 min | DB write throughput & connection pool     |

## Endpoint Coverage

| Endpoint                                   | Smoke | Load | Stress | WS  | Writes |
| ------------------------------------------ | :---: | :--: | :----: | :-: | :----: |
| `GET /health`                              |   ✓   |      |   ✓    |     |        |
| `GET /ready`                               |   ✓   |      |   ✓    |     |        |
| `POST /api/v1/auth/login`                  |   ✓   |  ✓   |   ✓    |  ✓  |   ✓    |
| `GET /api/v1/me`                           |       |  ✓   |        |     |        |
| `PATCH /api/v1/me`                         |       |      |        |     |   ✓    |
| `GET /api/v1/groups`                       |   ✓   |  ✓   |   ✓    |     |        |
| `GET /api/v1/groups/discover`              |       |  ✓   |   ✓    |     |        |
| `GET /api/v1/search`                       |   ✓   |  ✓   |   ✓    |     |        |
| `GET /api/v1/conversations`                |       |  ✓   |        |     |        |
| `GET /api/v1/conversations/{id}/messages`  |       |  ✓   |        |     |        |
| `POST /api/v1/conversations/{id}/messages` |       |      |        |     |   ✓    |
| `POST /api/v1/forums/{id}/posts`           |       |      |        |     |   ✓    |
| `WSS /socket/websocket`                    |       |  ✓   |        |  ✓  |        |

## Thresholds (SLOs)

### Smoke Test

| Metric                  | Target   |
| ----------------------- | -------- |
| `http_req_duration` p95 | < 500ms  |
| `http_req_duration` p99 | < 1000ms |
| `auth_duration` p95     | < 300ms  |
| `message_duration` p95  | < 500ms  |
| `forum_duration` p95    | < 400ms  |
| Error rate              | < 1%     |

### Load Test

| Metric                  | Target  |
| ----------------------- | ------- |
| `http_req_duration` p95 | < 400ms |
| `http_req_duration` p99 | < 500ms |
| `search_duration` p99   | < 500ms |
| Error rate              | < 1%    |

### Stress Test

| Metric                   | Target   |
| ------------------------ | -------- |
| `http_req_duration` p95  | < 1000ms |
| Error rate               | < 5%     |
| `http_req_failed` (hard) | < 10%    |

### WebSocket Test

| Metric                    | Target   |
| ------------------------- | -------- |
| `ws_connect_duration` p95 | < 2000ms |
| `ws_connect_duration` p99 | < 5000ms |
| `ws_message_latency` p95  | < 200ms  |
| `ws_message_latency` p99  | < 500ms  |
| `ws_errors` rate          | < 5%     |

### Write-Heavy Test

| Metric                        | Target   |
| ----------------------------- | -------- |
| `message_send_duration` p95   | < 300ms  |
| `message_send_duration` p99   | < 1000ms |
| `post_create_duration` p95    | < 500ms  |
| `post_create_duration` p99    | < 2000ms |
| `profile_update_duration` p95 | < 200ms  |
| `profile_update_duration` p99 | < 500ms  |
| `write_errors` rate           | < 2%     |

## Running Load Tests

### Prerequisites

```bash
# Install k6
brew install grafana/k6/k6   # macOS
# or: https://k6.io/docs/get-started/installation/

# Set environment variables
export BASE_URL=https://staging.cgraph.app
export TEST_EMAIL=loadtest@cgraph.app
export TEST_PASSWORD=<staging-password>
```

### Commands

```bash
# Smoke test (run on every PR)
k6 run infrastructure/load-tests/k6/smoke.js

# Load test (weekly)
k6 run infrastructure/load-tests/k6/load.js

# Stress test (monthly, run against staging only)
k6 run infrastructure/load-tests/k6/stress.js

# WebSocket stability
k6 run infrastructure/load-tests/k6/websocket.js

# Write throughput
k6 run infrastructure/load-tests/k6/writes.js
```

### Outputting Results to Grafana

```bash
k6 run --out influxdb=http://localhost:8086/k6 infrastructure/load-tests/k6/load.js
```

Grafana dashboards are configured at [`infrastructure/grafana/`](../infrastructure/grafana/).

## Results Log

> Populate after each test run. Template below.

### YYYY-MM-DD — [Test Name]

| Metric      | Result   | Threshold | Pass? |
| ----------- | -------- | --------- | :---: |
| p95 latency | \_ms     | \_ms      |       |
| p99 latency | \_ms     | \_ms      |       |
| Error rate  | \_%      | \_%       |       |
| Throughput  | \_ req/s | —         |       |

**Environment**: Fly.io (iad), N× app instances, PgBouncer pool size N  
**Notes**: —
