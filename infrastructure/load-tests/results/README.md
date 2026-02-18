# Load Test Results

This directory stores k6 load test results in JSON format.

## Running Tests

```bash
# From repo root:
./infrastructure/load-tests/run-load-test.sh smoke    # Quick validation
./infrastructure/load-tests/run-load-test.sh load     # Standard load test
./infrastructure/load-tests/run-load-test.sh all      # Smoke + load

# Against staging:
BASE_URL=https://staging.cgraph.org ./infrastructure/load-tests/run-load-test.sh smoke
```

## Result Files

| File Pattern | Description |
|-------------|-------------|
| `smoke-YYYYMMDD_HHMMSS.json` | Timestamped smoke test results |
| `smoke-latest.json` | Most recent smoke test |
| `load-latest.json` | Most recent load test |

## Thresholds

| Test | p95 | p99 | Error Rate |
|------|-----|-----|------------|
| Smoke | < 500ms | < 1000ms | < 1% |
| Load | < 400ms | < 500ms | < 0.5% |
