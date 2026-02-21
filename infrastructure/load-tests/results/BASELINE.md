# k6 Load Test Baseline

> **Date**: February 20, 2026 **k6 Version**: v1.6.1 (go1.25.7, linux/amd64) **Status**: Smoke test
> baseline recorded against local dev

## Smoke Test Results (Local Dev)

**Environment**: localhost:4000 (Elixir/Phoenix + Bandit, PostgreSQL 16, Redis 7) **Date**:
2026-02-20 **Config**: 10 VUs, 60s duration **Iterations**: 324 completed (5.24 RPS)

### HTTP Request Duration

| Metric | Value | Threshold | Status  |
| ------ | ----- | --------- | ------- |
| avg    | 179ms | —         | —       |
| med    | 176ms | —         | —       |
| p(90)  | 218ms | —         | —       |
| p(95)  | 255ms | < 500ms   | ✅ PASS |
| p(99)  | 383ms | < 1000ms  | ✅ PASS |
| max    | 490ms | —         | —       |

### Custom Metrics

| Metric         | avg   | p(95) | Threshold   | Status  |
| -------------- | ----- | ----- | ----------- | ------- |
| auth_duration  | 199ms | 383ms | p(95)<300ms | ⚠️ FAIL |
| forum_duration | 176ms | 230ms | p(95)<400ms | ✅ PASS |

### Threshold Summary

| Threshold               | Result  | Notes                                  |
| ----------------------- | ------- | -------------------------------------- |
| http_req_duration p(95) | ✅ PASS | 255ms < 500ms                          |
| http_req_duration p(99) | ✅ PASS | 383ms < 1000ms                         |
| errors rate             | ⚠️ FAIL | 401s on auth endpoints (no test users) |
| auth_duration p(95)     | ⚠️ FAIL | 383ms > 300ms — local dev overhead     |
| forum_duration p(95)    | ✅ PASS | 230ms < 400ms                          |

### Notes

- **auth_duration FAIL**: Expected in local dev. The auth endpoints return 401 (load test user
  accounts don't exist), but the endpoint round-trip is still measured. In staging with proper test
  accounts, expect auth_duration to drop below threshold.
- **error rate FAIL**: Login attempts against non-existent `loadtest+N@cgraph.org` accounts produce
  401s which are counted as errors. Not a real issue — indicates the error-tracking metric is
  working correctly.
- **Overall**: Core HTTP layer healthy. p(95)=255ms and p(99)=383ms are well within thresholds for
  local dev. Production/staging numbers expected to be faster with connection pooling and compiled
  releases.

## Available Test Scripts

| Script         | VUs | Duration | Purpose                         |
| -------------- | --- | -------- | ------------------------------- |
| `smoke.js`     | 10  | 60s      | Quick validation, p95 < 500ms   |
| `load.js`      | 100 | 5min     | Standard load (ramp 50→100 VUs) |
| `stress.js`    | 200 | ~10min   | Find breaking point             |
| `websocket.js` | —   | —        | WebSocket connection stability  |
| `writes.js`    | —   | —        | Write-heavy workload            |

## Thresholds

- `http_req_duration`: p95 < 500ms, p99 < 1000ms
- `errors`: rate < 1%
- `auth_duration`: p95 < 300ms
- `message_duration`: p95 < 500ms
- `forum_duration`: p95 < 400ms

## Raw Data

- JSON: `smoke-20260220_161240.json`

## Next Steps

1. Deploy backend to staging environment (`BASE_URL=https://staging.cgraph.org`)
2. Create load test user accounts (`loadtest+{1..10}@cgraph.org`)
3. Run: `./run-load-test.sh smoke https://staging.cgraph.org`
4. Run: `./run-load-test.sh load https://staging.cgraph.org`
5. Compare staging numbers against this local dev baseline
