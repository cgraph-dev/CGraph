#!/bin/sh
# Grafana Alloy entrypoint for Fly.io sidecar deployment
# Ships Phoenix metrics to Grafana Cloud
set -e

# Validate required environment variables
for var in GRAFANA_CLOUD_PROMETHEUS_URL GRAFANA_CLOUD_PROMETHEUS_USER GRAFANA_CLOUD_API_KEY; do
  eval val=\$$var
  if [ -z "$val" ]; then
    echo "[alloy] ERROR: $var is not set"
    exit 1
  fi
done

# Set defaults
export GRAFANA_CLOUD_LOKI_URL="${GRAFANA_CLOUD_LOKI_URL:-}"
export GRAFANA_CLOUD_LOKI_USER="${GRAFANA_CLOUD_LOKI_USER:-}"
export HOSTNAME="${FLY_ALLOC_ID:-${HOSTNAME:-cgraph-prod}}"

echo "[alloy] Starting Grafana Alloy"
echo "[alloy] Prometheus remote write → $GRAFANA_CLOUD_PROMETHEUS_URL"
echo "[alloy] Instance: $HOSTNAME"
echo "[alloy] Region: ${FLY_REGION:-unknown}"

# Wait for Phoenix to be ready before scraping
echo "[alloy] Waiting for Phoenix on :4000..."
for i in $(seq 1 30); do
  if wget -q --spider http://localhost:4000/health 2>/dev/null; then
    echo "[alloy] Phoenix is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[alloy] WARNING: Phoenix not ready after 30s, starting anyway"
  fi
  sleep 1
done

exec /usr/local/bin/alloy run \
  /etc/alloy/config.alloy \
  --storage.path=/tmp/alloy-data \
  --server.http.listen-addr=0.0.0.0:12345 \
  --stability.level=generally-available
