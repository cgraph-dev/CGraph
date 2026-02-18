#!/usr/bin/env bash
# ============================================================================
# CGraph Load Test Runner
# ============================================================================
# Runs k6 smoke/load/stress tests against the backend API.
#
# Prerequisites:
#   - k6 installed (https://k6.io/docs/get-started/installation/)
#   - Backend running (mix phx.server or docker-compose)
#
# Usage:
#   ./run-load-test.sh smoke          # Quick validation (10 VUs, 60s)
#   ./run-load-test.sh load           # Standard load (ramp 50→100 VUs, 5 min)
#   ./run-load-test.sh stress         # Stress test (ramp to 200+ VUs)
#   ./run-load-test.sh websocket      # WebSocket load test
#   ./run-load-test.sh writes         # Write-heavy test
#   ./run-load-test.sh all            # Run smoke + load sequentially
#
# Environment:
#   BASE_URL    - Target URL (default: http://localhost:4000)
#   K6_OUT      - Output format (default: json)
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K6_DIR="${SCRIPT_DIR}/k6"
RESULTS_DIR="${SCRIPT_DIR}/results"
BASE_URL="${BASE_URL:-http://localhost:4000}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ── Helpers ──────────────────────────────────────────────────

check_k6() {
  if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: k6 is not installed${NC}"
    echo ""
    echo "Install k6:"
    echo "  macOS:  brew install k6"
    echo "  Linux:  sudo gpg -k"
    echo "          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68"
    echo '          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list'
    echo "          sudo apt-get update && sudo apt-get install k6"
    echo "  Docker: docker run -i grafana/k6 run - <${K6_DIR}/smoke.js"
    echo ""
    exit 1
  fi
}

check_backend() {
  echo -e "${YELLOW}Checking backend at ${BASE_URL}...${NC}"
  if curl -sf "${BASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is reachable${NC}"
  elif curl -sf "${BASE_URL}/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is reachable (via /api/health)${NC}"
  else
    echo -e "${RED}✗ Backend is not reachable at ${BASE_URL}${NC}"
    echo "  Start the backend first:"
    echo "    cd apps/backend && mix phx.server"
    echo "  Or use docker-compose:"
    echo "    docker-compose up -d"
    echo ""
    echo "  Override URL: BASE_URL=https://staging.cgraph.org $0 $*"
    exit 1
  fi
}

run_test() {
  local test_name="$1"
  local script="${K6_DIR}/${test_name}.js"
  local result_file="${RESULTS_DIR}/${test_name}-${TIMESTAMP}.json"

  if [ ! -f "$script" ]; then
    echo -e "${RED}Error: Test script not found: ${script}${NC}"
    exit 1
  fi

  mkdir -p "$RESULTS_DIR"

  echo ""
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}  Running: ${test_name} test${NC}"
  echo -e "${YELLOW}  Target:  ${BASE_URL}${NC}"
  echo -e "${YELLOW}  Output:  ${result_file}${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
  echo ""

  k6 run \
    --env "BASE_URL=${BASE_URL}" \
    --out "json=${result_file}" \
    --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
    "$script"

  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ ${test_name} test PASSED${NC}"
  else
    echo ""
    echo -e "${RED}✗ ${test_name} test FAILED (exit code: ${exit_code})${NC}"
  fi

  # Copy latest result for easy reference
  cp "$result_file" "${RESULTS_DIR}/${test_name}-latest.json" 2>/dev/null || true

  return $exit_code
}

# ── Main ─────────────────────────────────────────────────────

main() {
  local test_type="${1:-smoke}"

  check_k6

  case "$test_type" in
    smoke|load|stress|websocket|writes)
      check_backend
      run_test "$test_type"
      ;;
    all)
      check_backend
      echo -e "${YELLOW}Running smoke + load tests...${NC}"
      run_test "smoke"
      echo ""
      run_test "load"
      ;;
    --help|-h)
      echo "Usage: $0 [smoke|load|stress|websocket|writes|all]"
      echo ""
      echo "Tests:"
      echo "  smoke      Quick validation (10 VUs, 60s)"
      echo "  load       Standard load test (ramp 50→100 VUs, 5 min)"
      echo "  stress     Stress test (high VU count)"
      echo "  websocket  WebSocket connection test"
      echo "  writes     Write-heavy workload"
      echo "  all        Run smoke + load sequentially"
      echo ""
      echo "Environment:"
      echo "  BASE_URL   Target URL (default: http://localhost:4000)"
      ;;
    *)
      echo -e "${RED}Unknown test type: ${test_type}${NC}"
      echo "Run '$0 --help' for usage"
      exit 1
      ;;
  esac
}

main "$@"
