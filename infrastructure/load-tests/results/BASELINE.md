# k6 Load Test Baseline

> **Date**: February 20, 2026 **k6 Version**: v1.6.1 (go1.25.7, linux/amd64) **Status**: Tooling
> Validated — Pending Staging Environment

## Verification Run

```
k6 run --duration 3s --vus 1 --env BASE_URL=http://localhost:4000 smoke.js
→ 1891 iterations completed in 3s
→ All requests failed (expected: no backend running locally)
→ k6 binary, scripts, and output format working correctly
```

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

## Next Steps

1. Deploy backend to staging environment (`BASE_URL=https://staging.cgraph.org`)
2. Create load test user accounts (`loadtest+{1..10}@cgraph.org`)
3. Run: `./run-load-test.sh smoke https://staging.cgraph.org`
4. Run: `./run-load-test.sh load https://staging.cgraph.org`
5. Record results in this directory as timestamped JSON files
