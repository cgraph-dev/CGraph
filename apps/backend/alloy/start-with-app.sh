#!/bin/sh
# Combined entrypoint: starts Grafana Alloy as a background sidecar,
# then runs the Phoenix application in the foreground.
#
# Fly.io runs each process on a separate machine, so Alloy must share
# the same machine as the app to scrape localhost:4000/metrics.

set -e

# ---------------------------------------------------------------------------
# 1. Start Alloy in the background (if Grafana secrets are set)
# ---------------------------------------------------------------------------
if [ -n "$GRAFANA_CLOUD_PROMETHEUS_URL" ] && [ -n "$GRAFANA_CLOUD_PROMETHEUS_USER" ] && [ -n "$GRAFANA_CLOUD_API_KEY" ]; then
  echo "[app+alloy] Starting Grafana Alloy sidecar in background..."
  echo "[app+alloy] Prometheus remote write → $GRAFANA_CLOUD_PROMETHEUS_URL"

  export HOSTNAME="${FLY_ALLOC_ID:-${HOSTNAME:-cgraph-prod}}"
  export GRAFANA_CLOUD_LOKI_URL="${GRAFANA_CLOUD_LOKI_URL:-}"
  export GRAFANA_CLOUD_LOKI_USER="${GRAFANA_CLOUD_LOKI_USER:-}"

  /usr/local/bin/alloy run \
    /etc/alloy/config.alloy \
    --storage.path=/tmp/alloy-data \
    --server.http.listen-addr=0.0.0.0:12345 \
    --stability.level=generally-available &

  ALLOY_PID=$!
  echo "[app+alloy] Alloy started (PID $ALLOY_PID)"

  # Ensure Alloy is cleaned up when the app stops
  trap "kill $ALLOY_PID 2>/dev/null || true" EXIT TERM INT
else
  echo "[app+alloy] GRAFANA_CLOUD_* secrets not set, skipping Alloy"
fi

# ---------------------------------------------------------------------------
# 2. Start Phoenix application (foreground — this is the main process)
# ---------------------------------------------------------------------------
echo "[app+alloy] Starting Phoenix application..."
exec bin/cgraph start
