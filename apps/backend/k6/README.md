# k6 Load Tests for CGraph Backend

Load test scripts using [k6](https://k6.io/) to validate API performance under load.

## Prerequisites

Install k6:

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker
docker pull grafana/k6
```

## Quick Start

```bash
# 1. Smoke test — verify the API is alive
k6 run k6/smoke.js

# 2. Auth flow test
k6 run k6/auth-login.js

# 3. Forum browsing test
k6 run k6/forum-browse.js

# 4. Search test
k6 run k6/search.js

# 5. Full combined load test (all scenarios)
k6 run k6/load.js
```

## Configuration

Override defaults via environment variables:

```bash
# Target a deployed instance
K6_BASE_URL=https://cgraph-backend.fly.dev k6 run k6/load.js

# Use custom test credentials
K6_TEST_EMAIL=test@example.com K6_TEST_PASSWORD=secretpass k6 run k6/auth-login.js
```

| Variable | Default | Description |
|---|---|---|
| `K6_BASE_URL` | `http://localhost:4000` | Target API URL |
| `K6_TEST_EMAIL` | `loadtest@example.com` | Test user email |
| `K6_TEST_PASSWORD` | `LoadTest123!` | Test user password |
| `K6_TEST_USERNAME` | `loadtester` | Test user username |

## Test Scripts

| Script | Description | Key Thresholds |
|---|---|---|
| `smoke.js` | Health/readiness check | p95 < 200ms |
| `auth-login.js` | Login + token verification | p95 < 300ms |
| `forum-browse.js` | Forums → threads → posts | p95 < 500ms |
| `search.js` | Full-text search queries | p95 < 400ms |
| `load.js` | Combined multi-scenario | See per-scenario thresholds |

## Running Against Production

1. **Create a test user** on the target environment
2. Set the environment variables
3. Start with a smoke test to verify connectivity
4. Run the full load test

```bash
export K6_BASE_URL=https://cgraph-backend.fly.dev
export K6_TEST_EMAIL=loadtest@cgraph.org
export K6_TEST_PASSWORD=your_secure_password

k6 run k6/smoke.js          # Verify first
k6 run k6/load.js           # Full load
```

## Output & Reporting

```bash
# Output to JSON for post-processing
k6 run --out json=results.json k6/load.js

# Output to Grafana Cloud k6
K6_CLOUD_TOKEN=your_token k6 cloud k6/load.js

# Custom summary
k6 run --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" k6/load.js
```

## Architecture

```
k6/
├── config.js         # Shared config, auth helper, thresholds
├── smoke.js          # Health check (GET /health, /ready, /metrics)
├── auth-login.js     # POST /auth/login + GET /auth/me
├── forum-browse.js   # GET /forums → /threads → /posts
├── search.js         # GET /search?q=...
├── load.js           # Combined multi-scenario orchestrator
└── README.md         # This file
```
