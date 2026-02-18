#!/usr/bin/env bash
# CGraph Chaos Engineering Test Suite
# Tests system resilience by injecting controlled failures
#
# Usage:
#   ./chaos-test.sh <scenario>
#
# Scenarios:
#   kill-backend     Kill the backend and verify recovery
#   kill-redis       Kill Redis and verify circuit breaker activation
#   kill-db          Kill PostgreSQL and verify graceful degradation
#   network-delay    Add 500ms latency to backend requests
#   cpu-stress       Stress CPU and verify SLO adherence
#   all              Run all scenarios sequentially
#
# Prerequisites:
#   - Docker Compose dev stack running
#   - curl, jq installed
#   - docker CLI access

set -euo pipefail

# ─── Configuration ──────────────────────────────────────────────
BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
BACKEND_CONTAINER="${BACKEND_CONTAINER:-cgraph-backend}"
REDIS_CONTAINER="${REDIS_CONTAINER:-cgraph-redis}"
DB_CONTAINER="${DB_CONTAINER:-cgraph-postgres}"
RECOVERY_TIMEOUT="${RECOVERY_TIMEOUT:-60}"
RESULTS_DIR="$(dirname "$0")/../load-tests/results/chaos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─── Helpers ────────────────────────────────────────────────────
log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_pass()  { echo -e "${GREEN}[PASS]${NC}  $*"; }
log_fail()  { echo -e "${RED}[FAIL]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_step()  { echo -e "\n${BLUE}━━━ $* ━━━${NC}"; }

# Check if backend is healthy
check_health() {
  local url="${1:-$BACKEND_URL/api/health}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 5 2>/dev/null || echo "000")
  [[ "$status" -ge 200 && "$status" -lt 400 ]]
}

# Wait for backend to become healthy
wait_for_recovery() {
  local timeout="${1:-$RECOVERY_TIMEOUT}"
  local start=$SECONDS

  while ! check_health; do
    if (( SECONDS - start >= timeout )); then
      return 1
    fi
    sleep 2
  done

  echo $(( SECONDS - start ))
}

# Record result to JSON
record_result() {
  local scenario="$1" result="$2" recovery_time="${3:-N/A}" notes="${4:-}"
  mkdir -p "$RESULTS_DIR"

  local file="$RESULTS_DIR/chaos_${TIMESTAMP}.jsonl"
  jq -n \
    --arg scenario "$scenario" \
    --arg result "$result" \
    --arg recovery_time "$recovery_time" \
    --arg notes "$notes" \
    --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{timestamp: $timestamp, scenario: $scenario, result: $result, recovery_time_seconds: $recovery_time, notes: $notes}' \
    >> "$file"
}

PASS_COUNT=0
FAIL_COUNT=0

# ─── Scenario: Kill Backend ────────────────────────────────────
scenario_kill_backend() {
  log_step "Scenario: Kill Backend Process"

  # Pre-check
  if ! check_health; then
    log_warn "Backend not healthy before test — skipping"
    record_result "kill-backend" "skipped" "" "Backend not healthy before test"
    return
  fi
  log_info "Pre-check: Backend is healthy"

  # Inject failure
  log_info "Killing backend container: $BACKEND_CONTAINER"
  docker kill "$BACKEND_CONTAINER" 2>/dev/null || {
    log_warn "Could not kill container (may not be running via Docker)"
    record_result "kill-backend" "skipped" "" "Container not found"
    return
  }

  # Verify failure
  sleep 2
  if check_health; then
    log_fail "Backend still responding after kill — unexpected"
    record_result "kill-backend" "fail" "" "Backend did not stop"
    ((FAIL_COUNT++))
    return
  fi
  log_info "Confirmed: Backend is down"

  # Restart
  log_info "Restarting backend container..."
  docker start "$BACKEND_CONTAINER"

  # Measure recovery
  log_info "Waiting for recovery (timeout: ${RECOVERY_TIMEOUT}s)..."
  local recovery_time
  if recovery_time=$(wait_for_recovery); then
    log_pass "Backend recovered in ${recovery_time}s"
    record_result "kill-backend" "pass" "$recovery_time" "Full recovery"

    if (( recovery_time <= 30 )); then
      log_pass "Recovery time within SLO (<=30s)"
    else
      log_warn "Recovery time exceeds 30s target"
    fi
    ((PASS_COUNT++))
  else
    log_fail "Backend failed to recover within ${RECOVERY_TIMEOUT}s"
    record_result "kill-backend" "fail" "$RECOVERY_TIMEOUT" "Recovery timeout"
    ((FAIL_COUNT++))
  fi
}

# ─── Scenario: Kill Redis ──────────────────────────────────────
scenario_kill_redis() {
  log_step "Scenario: Kill Redis (Circuit Breaker Test)"

  if ! check_health; then
    log_warn "Backend not healthy — skipping"
    record_result "kill-redis" "skipped" "" "Backend not healthy"
    return
  fi

  log_info "Killing Redis container: $REDIS_CONTAINER"
  docker kill "$REDIS_CONTAINER" 2>/dev/null || {
    log_warn "Could not kill Redis container"
    record_result "kill-redis" "skipped" "" "Redis container not found"
    return
  }

  sleep 3

  # Backend should still respond (degraded, circuit breaker open)
  log_info "Checking if backend degrades gracefully..."
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health" --max-time 10 2>/dev/null || echo "000")

  if [[ "$status" -ge 200 && "$status" -lt 500 ]]; then
    log_pass "Backend responds without Redis (status: $status) — circuit breaker working"
    record_result "kill-redis" "pass" "" "Backend gracefully degraded (HTTP $status)"
    ((PASS_COUNT++))
  elif [[ "$status" == "000" ]]; then
    log_fail "Backend completely unresponsive without Redis"
    record_result "kill-redis" "fail" "" "Backend crashed (no response)"
    ((FAIL_COUNT++))
  else
    log_warn "Backend returned error $status — partial degradation"
    record_result "kill-redis" "warn" "" "HTTP $status without Redis"
    ((PASS_COUNT++))
  fi

  # Restore Redis
  log_info "Restoring Redis..."
  docker start "$REDIS_CONTAINER"
  sleep 5

  if check_health; then
    log_pass "Backend fully recovered after Redis restore"
  else
    log_warn "Backend not fully recovered after Redis restore — may need time"
  fi
}

# ─── Scenario: Kill Database ──────────────────────────────────
scenario_kill_db() {
  log_step "Scenario: Kill PostgreSQL (Graceful Degradation Test)"

  if ! check_health; then
    log_warn "Backend not healthy — skipping"
    record_result "kill-db" "skipped" "" "Backend not healthy"
    return
  fi

  log_info "Killing PostgreSQL container: $DB_CONTAINER"
  docker kill "$DB_CONTAINER" 2>/dev/null || {
    log_warn "Could not kill PostgreSQL container"
    record_result "kill-db" "skipped" "" "DB container not found"
    return
  }

  sleep 3

  # Check that API returns proper error codes (not crash)
  log_info "Checking graceful degradation..."
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health" --max-time 10 2>/dev/null || echo "000")

  if [[ "$status" == "503" || "$status" == "500" ]]; then
    log_pass "Backend returns $status (graceful error response)"
    record_result "kill-db" "pass" "" "Graceful degradation (HTTP $status)"
    ((PASS_COUNT++))
  elif [[ "$status" == "000" ]]; then
    log_fail "Backend completely crashed without database"
    record_result "kill-db" "fail" "" "Process crash — no HTTP response"
    ((FAIL_COUNT++))
  else
    log_pass "Backend still responding (status: $status)"
    record_result "kill-db" "pass" "" "HTTP $status"
    ((PASS_COUNT++))
  fi

  # Restore database
  log_info "Restoring PostgreSQL..."
  docker start "$DB_CONTAINER"
  sleep 10

  log_info "Waiting for backend recovery after DB restore..."
  if recovery_time=$(wait_for_recovery 60); then
    log_pass "Backend recovered in ${recovery_time}s after DB restore"
  else
    log_warn "Backend slow to recover after DB restore"
  fi
}

# ─── Scenario: Network Delay ──────────────────────────────────
scenario_network_delay() {
  log_step "Scenario: Network Latency Injection (500ms delay)"

  if ! command -v tc &>/dev/null; then
    log_warn "tc (traffic control) not available — skipping"
    record_result "network-delay" "skipped" "" "tc not available"
    return
  fi

  if ! check_health; then
    log_warn "Backend not healthy — skipping"
    record_result "network-delay" "skipped" "" "Backend not healthy"
    return
  fi

  # Measure baseline latency
  local baseline
  baseline=$(curl -s -o /dev/null -w "%{time_total}" "$BACKEND_URL/api/health" --max-time 10)
  log_info "Baseline latency: ${baseline}s"

  # Inject 500ms delay on the backend container
  log_info "Injecting 500ms network delay..."
  docker exec "$BACKEND_CONTAINER" tc qdisc add dev eth0 root netem delay 500ms 2>/dev/null || {
    log_warn "Could not inject network delay (tc may not be in container)"
    record_result "network-delay" "skipped" "" "tc not available in container"
    return
  }

  sleep 2

  # Measure degraded latency
  local degraded
  degraded=$(curl -s -o /dev/null -w "%{time_total}" "$BACKEND_URL/api/health" --max-time 15)
  log_info "Degraded latency: ${degraded}s"

  # Check if latency is within acceptable bounds (< 2s for p99 SLO)
  local degraded_ms
  degraded_ms=$(echo "$degraded * 1000" | bc | cut -d. -f1)

  if (( degraded_ms < 2000 )); then
    log_pass "Latency under 2s SLO even with 500ms injection (${degraded_ms}ms)"
    record_result "network-delay" "pass" "" "Latency: ${degraded_ms}ms"
    ((PASS_COUNT++))
  else
    log_fail "Latency exceeded 2s SLO (${degraded_ms}ms)"
    record_result "network-delay" "fail" "" "Latency: ${degraded_ms}ms"
    ((FAIL_COUNT++))
  fi

  # Remove delay
  log_info "Removing network delay..."
  docker exec "$BACKEND_CONTAINER" tc qdisc del dev eth0 root 2>/dev/null || true
}

# ─── Scenario: CPU Stress ──────────────────────────────────────
scenario_cpu_stress() {
  log_step "Scenario: CPU Stress Test (30s)"

  if ! check_health; then
    log_warn "Backend not healthy — skipping"
    record_result "cpu-stress" "skipped" "" "Backend not healthy"
    return
  fi

  log_info "Starting 30s CPU stress on backend container..."
  docker exec -d "$BACKEND_CONTAINER" sh -c 'for i in $(seq 1 $(nproc)); do while :; do :; done & done; sleep 30; kill $(jobs -p)' 2>/dev/null || {
    log_warn "Could not stress CPU in container"
    record_result "cpu-stress" "skipped" "" "Could not exec in container"
    return
  }

  # Check health during stress (every 5s for 30s)
  local fails=0
  for i in $(seq 1 6); do
    sleep 5
    if check_health; then
      log_info "  Health check $i/6: OK"
    else
      log_warn "  Health check $i/6: FAILED"
      ((fails++))
    fi
  done

  if (( fails == 0 )); then
    log_pass "Backend remained healthy under CPU stress (0/6 failures)"
    record_result "cpu-stress" "pass" "" "0 health check failures"
    ((PASS_COUNT++))
  elif (( fails <= 2 )); then
    log_warn "Backend had $fails/6 health check failures under CPU stress"
    record_result "cpu-stress" "warn" "" "$fails/6 health check failures"
    ((PASS_COUNT++))
  else
    log_fail "Backend had $fails/6 health check failures under CPU stress"
    record_result "cpu-stress" "fail" "" "$fails/6 health check failures"
    ((FAIL_COUNT++))
  fi
}

# ─── Main ──────────────────────────────────────────────────────
usage() {
  echo "Usage: $0 <scenario>"
  echo ""
  echo "Scenarios:"
  echo "  kill-backend     Kill backend and verify recovery"
  echo "  kill-redis       Kill Redis and verify circuit breaker"
  echo "  kill-db          Kill PostgreSQL and verify degradation"
  echo "  network-delay    Add 500ms latency"
  echo "  cpu-stress       Stress CPU for 30s"
  echo "  all              Run all scenarios"
  exit 1
}

SCENARIO="${1:-}"
[[ -z "$SCENARIO" ]] && usage

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════╗"
echo "║         CGraph Chaos Engineering Suite           ║"
echo "║         $(date -u +%Y-%m-%d\ %H:%M:%S\ UTC)              ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

case "$SCENARIO" in
  kill-backend)   scenario_kill_backend ;;
  kill-redis)     scenario_kill_redis ;;
  kill-db)        scenario_kill_db ;;
  network-delay)  scenario_network_delay ;;
  cpu-stress)     scenario_cpu_stress ;;
  all)
    scenario_kill_backend
    scenario_kill_redis
    scenario_kill_db
    scenario_network_delay
    scenario_cpu_stress
    ;;
  *) usage ;;
esac

echo ""
echo -e "${BLUE}━━━ Summary ━━━${NC}"
echo -e "  Passed: ${GREEN}${PASS_COUNT}${NC}"
echo -e "  Failed: ${RED}${FAIL_COUNT}${NC}"
echo ""

RESULTS_FILE="$RESULTS_DIR/chaos_${TIMESTAMP}.jsonl"
if [[ -f "$RESULTS_FILE" ]]; then
  echo "Results written to: $RESULTS_FILE"
fi

if (( FAIL_COUNT > 0 )); then
  exit 1
fi
