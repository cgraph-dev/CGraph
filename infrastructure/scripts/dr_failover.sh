#!/usr/bin/env bash
#
# CGraph Disaster Recovery Failover Script
#
# Automated failover from primary PostgreSQL to replica on Fly.io.
# Includes automated checks + manual verification gates at critical points.
#
# Usage:
#   ./dr_failover.sh                         # Interactive mode (prompts for confirmation)
#   ./dr_failover.sh --auto                  # Automated mode (skips confirmations)
#   ./dr_failover.sh --dry-run               # Validate without executing
#   ./dr_failover.sh --primary cgraph-db --replica cgraph-db-replica
#
# Prerequisites:
#   - flyctl installed and authenticated
#   - Access to both primary and replica Fly apps
#   - curl available for health checks
#
# Environment Variables:
#   PRIMARY_APP     - Primary DB app name (default: cgraph-db)
#   REPLICA_APP     - Replica DB app name (default: cgraph-db-replica)
#   BACKEND_APP     - Backend app name (default: cgraph-backend)
#   HEALTH_URL      - Health check endpoint
#   MAX_LAG_MB      - Maximum acceptable replication lag in MB (default: 16)
#   HEALTH_RETRIES  - Number of health check retries (default: 10)
#   HEALTH_DELAY    - Seconds between health checks (default: 5)

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────

PRIMARY_APP="${PRIMARY_APP:-cgraph-db}"
REPLICA_APP="${REPLICA_APP:-cgraph-db-replica}"
BACKEND_APP="${BACKEND_APP:-cgraph-backend}"
HEALTH_URL="${HEALTH_URL:-https://${BACKEND_APP}.fly.dev/api/v1/health}"
MAX_LAG_MB="${MAX_LAG_MB:-16}"
HEALTH_RETRIES="${HEALTH_RETRIES:-10}"
HEALTH_DELAY="${HEALTH_DELAY:-5}"

AUTO_MODE=false
DRY_RUN=false
LOG_FILE="/tmp/cgraph_dr_failover_$(date +%Y%m%d_%H%M%S).log"

# ── Colors & Logging ─────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

log() {
  local level="$1"
  shift
  local msg="$*"
  local timestamp
  timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

  case "$level" in
    INFO)    echo -e "${GREEN}[${timestamp}] [INFO]${NC} ${msg}" ;;
    WARN)    echo -e "${YELLOW}[${timestamp}] [WARN]${NC} ${msg}" ;;
    ERROR)   echo -e "${RED}[${timestamp}] [ERROR]${NC} ${msg}" ;;
    CRITICAL)echo -e "${RED}[${timestamp}] [CRITICAL]${NC} ${msg}" ;;
    STEP)    echo -e "${BLUE}[${timestamp}] [STEP]${NC} ${msg}" ;;
    GATE)    echo -e "${MAGENTA}[${timestamp}] [MANUAL GATE]${NC} ${msg}" ;;
  esac

  echo "[${timestamp}] [${level}] ${msg}" >> "$LOG_FILE"
}

die() {
  log ERROR "$@"
  echo ""
  log ERROR "Failover ABORTED. See log: ${LOG_FILE}"
  exit 1
}

# ── Argument Parsing ─────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --auto)
      AUTO_MODE=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --primary)
      PRIMARY_APP="$2"
      shift 2
      ;;
    --replica)
      REPLICA_APP="$2"
      shift 2
      ;;
    --backend)
      BACKEND_APP="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [--auto] [--dry-run] [--primary APP] [--replica APP] [--backend APP]"
      echo ""
      echo "Options:"
      echo "  --auto       Skip manual confirmation gates"
      echo "  --dry-run    Validate without executing changes"
      echo "  --primary    Primary DB Fly app name (default: cgraph-db)"
      echo "  --replica    Replica DB Fly app name (default: cgraph-db-replica)"
      echo "  --backend    Backend Fly app name (default: cgraph-backend)"
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

# ── Manual Verification Gate ────────────────────────────────

manual_gate() {
  local gate_name="$1"
  local message="$2"

  if [[ "${AUTO_MODE}" == "true" ]]; then
    log GATE "${gate_name}: AUTO_MODE enabled, proceeding automatically"
    return 0
  fi

  echo ""
  echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${MAGENTA}║  MANUAL VERIFICATION GATE: ${gate_name}${NC}"
  echo -e "${MAGENTA}║  ${message}${NC}"
  echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""

  read -r -p "Proceed? (yes/no): " response
  if [[ "${response}" != "yes" ]]; then
    die "Operator declined at gate: ${gate_name}"
  fi

  log GATE "${gate_name}: Operator confirmed, proceeding"
}

# ── Pre-flight Checks ────────────────────────────────────────

preflight_checks() {
  log STEP "1/7 — Pre-flight checks"

  # Check flyctl
  if ! command -v fly &> /dev/null; then
    die "flyctl (fly) is not installed. Install: https://fly.io/docs/flyctl/install/"
  fi
  log INFO "flyctl found: $(fly version 2>/dev/null || echo 'unknown version')"

  # Check curl
  if ! command -v curl &> /dev/null; then
    die "curl is not installed"
  fi

  # Verify Fly auth
  if ! fly auth whoami &> /dev/null; then
    die "Not authenticated with Fly.io. Run: fly auth login"
  fi
  log INFO "Fly.io authenticated as: $(fly auth whoami 2>/dev/null)"

  # Check apps exist
  if ! fly apps list 2>/dev/null | grep -q "${PRIMARY_APP}"; then
    log WARN "Could not verify primary app '${PRIMARY_APP}' in fly apps list"
  fi

  if ! fly apps list 2>/dev/null | grep -q "${REPLICA_APP}"; then
    log WARN "Could not verify replica app '${REPLICA_APP}' in fly apps list"
  fi

  log INFO "Pre-flight checks passed"
}

# ── Step 1: Detect Primary Failure ────────────────────────────

detect_primary_failure() {
  log STEP "2/7 — Detecting primary database status"

  local primary_status
  primary_status=$(fly status --app "${PRIMARY_APP}" 2>&1 || true)

  if echo "$primary_status" | grep -qi "running"; then
    log WARN "Primary appears to be running. Failover may not be necessary."
    manual_gate "PRIMARY_RUNNING" "Primary DB appears healthy. Confirm failover anyway?"
  else
    log CRITICAL "Primary database is NOT running or unreachable"
    log INFO "Primary status: ${primary_status}"
  fi

  # Try connecting to primary
  local pg_check
  pg_check=$(fly postgres connect --app "${PRIMARY_APP}" -c "SELECT 1;" 2>&1 || true)

  if echo "$pg_check" | grep -q "1"; then
    log WARN "Primary database is still accepting connections"
  else
    log CRITICAL "Primary database is not accepting connections"
    log INFO "Connection check result: ${pg_check}"
  fi
}

# ── Step 2: Verify Replica Health ─────────────────────────────

verify_replica() {
  log STEP "3/7 — Verifying replica health"

  # Check replica is running
  local replica_status
  replica_status=$(fly status --app "${REPLICA_APP}" 2>&1 || true)

  if ! echo "$replica_status" | grep -qi "running"; then
    die "Replica '${REPLICA_APP}' is not running: ${replica_status}"
  fi
  log INFO "Replica is running"

  # Check replication lag
  local lag_result
  lag_result=$(fly postgres connect --app "${PRIMARY_APP}" -c "
    SELECT
      COALESCE(pg_wal_lsn_diff(sent_lsn, replay_lsn), 0) AS lag_bytes
    FROM pg_stat_replication
    LIMIT 1;
  " 2>&1 || true)

  if echo "$lag_result" | grep -qE '[0-9]+'; then
    local lag_bytes
    lag_bytes=$(echo "$lag_result" | grep -oE '[0-9]+' | head -1)
    local lag_mb=$((lag_bytes / 1048576))

    log INFO "Replication lag: ${lag_bytes} bytes (${lag_mb} MB)"

    if [[ $lag_mb -gt $MAX_LAG_MB ]]; then
      log ERROR "Replication lag (${lag_mb}MB) exceeds maximum (${MAX_LAG_MB}MB)"
      manual_gate "HIGH_LAG" "Replication lag is ${lag_mb}MB (max: ${MAX_LAG_MB}MB). Proceed anyway?"
    else
      log INFO "Replication lag is within acceptable bounds"
    fi
  else
    log WARN "Could not determine replication lag (primary may be down)"
    log INFO "Lag check result: ${lag_result}"
  fi

  # Verify replica can serve queries
  local replica_check
  replica_check=$(fly postgres connect --app "${REPLICA_APP}" -c "SELECT count(*) FROM users;" 2>&1 || true)

  if echo "$replica_check" | grep -qE '[0-9]+'; then
    log INFO "Replica is serving queries successfully"
  else
    log WARN "Could not verify replica query capability: ${replica_check}"
  fi
}

# ── Step 3: Manual Confirmation Gate ──────────────────────────

confirm_failover() {
  log STEP "4/7 — Failover confirmation"

  if [[ "${DRY_RUN}" == "true" ]]; then
    log INFO "[DRY RUN] Would proceed with failover. Exiting."
    echo ""
    log INFO "Dry run complete. Log: ${LOG_FILE}"
    exit 0
  fi

  manual_gate "FAILOVER_CONFIRM" "About to promote ${REPLICA_APP} to primary and update ${BACKEND_APP}."
}

# ── Step 4: Promote Replica ───────────────────────────────────

promote_replica() {
  log STEP "5/7 — Promoting replica to primary"

  log CRITICAL "Executing: fly postgres failover --app ${REPLICA_APP}"

  local promote_result
  promote_result=$(fly postgres failover --app "${REPLICA_APP}" 2>&1 || true)

  log INFO "Promotion output: ${promote_result}"

  if echo "$promote_result" | grep -qi "error\|failed"; then
    log ERROR "Fly failover may have failed. Attempting manual promotion..."

    # Fallback: manual promotion
    local manual_result
    manual_result=$(fly postgres connect --app "${REPLICA_APP}" -c "SELECT pg_promote(true, 60);" 2>&1 || true)
    log INFO "Manual promotion result: ${manual_result}"

    if echo "$manual_result" | grep -qi "error"; then
      die "Both automatic and manual promotion failed"
    fi
  fi

  log INFO "Replica promotion initiated"

  # Wait for promotion to take effect
  log INFO "Waiting 10 seconds for promotion to stabilize..."
  sleep 10
}

# ── Step 5: Update Fly Secrets ────────────────────────────────

update_secrets() {
  log STEP "6/7 — Updating backend secrets"

  # Get the new connection string from the promoted replica
  local new_db_url
  new_db_url="postgres://${REPLICA_APP}.internal:5432/cgraph"

  log INFO "Updating DATABASE_URL for ${BACKEND_APP} to ${REPLICA_APP}"
  log CRITICAL "Executing: fly secrets set DATABASE_URL=... --app ${BACKEND_APP}"

  local secret_result
  secret_result=$(fly secrets set "DATABASE_URL=${new_db_url}" --app "${BACKEND_APP}" 2>&1 || true)

  log INFO "Secret update result: ${secret_result}"

  if echo "$secret_result" | grep -qi "error"; then
    log ERROR "Secret update may have failed: ${secret_result}"
    manual_gate "SECRET_FAILED" "DATABASE_URL update may have failed. Check manually and confirm."
  fi

  # The secret update triggers a redeploy
  log INFO "Waiting 30 seconds for backend redeploy..."
  sleep 30
}

# ── Step 6: Verify Health ─────────────────────────────────────

verify_health() {
  log STEP "7/7 — Verifying application health"

  local retries=$HEALTH_RETRIES
  local healthy=false

  while [[ $retries -gt 0 ]]; do
    log INFO "Health check attempt $((HEALTH_RETRIES - retries + 1))/${HEALTH_RETRIES}: ${HEALTH_URL}"

    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${HEALTH_URL}" 2>/dev/null || echo "000")

    if [[ "${http_code}" == "200" ]]; then
      healthy=true
      log INFO "Health check PASSED (HTTP ${http_code})"
      break
    else
      log WARN "Health check returned HTTP ${http_code}, retrying in ${HEALTH_DELAY}s..."
      retries=$((retries - 1))
      sleep "${HEALTH_DELAY}"
    fi
  done

  if [[ "${healthy}" == "true" ]]; then
    log INFO "Application is healthy on new primary"
  else
    log ERROR "Health checks exhausted. Application may not be healthy."
    manual_gate "UNHEALTHY" "Health checks failed. Manually verify ${HEALTH_URL} and confirm."
  fi
}

# ── Summary ───────────────────────────────────────────────────

print_summary() {
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                   DR FAILOVER COMPLETE                          ║${NC}"
  echo -e "${GREEN}╠══════════════════════════════════════════════════════════════════╣${NC}"
  echo -e "${GREEN}║${NC}  Old Primary:  ${PRIMARY_APP}"
  echo -e "${GREEN}║${NC}  New Primary:  ${REPLICA_APP}"
  echo -e "${GREEN}║${NC}  Backend App:  ${BACKEND_APP}"
  echo -e "${GREEN}║${NC}  Timestamp:    $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo -e "${GREEN}║${NC}  Log File:     ${LOG_FILE}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Verify the application manually: ${HEALTH_URL}"
  echo "  2. Monitor error rates for the next 30 minutes"
  echo "  3. Create a post-mortem document (see docs/OPERATIONAL_RUNBOOKS.md)"
  echo "  4. Set up a new replica for the promoted primary"
  echo "     fly postgres create --name ${PRIMARY_APP}-new-replica --region fra"
  echo ""
}

# ── Main ──────────────────────────────────────────────────────

main() {
  echo ""
  log CRITICAL "========================================="
  log CRITICAL "  CGraph Disaster Recovery Failover"
  log CRITICAL "========================================="
  log INFO "Primary:  ${PRIMARY_APP}"
  log INFO "Replica:  ${REPLICA_APP}"
  log INFO "Backend:  ${BACKEND_APP}"
  log INFO "Mode:     $(if [[ "${AUTO_MODE}" == "true" ]]; then echo "AUTOMATED"; else echo "INTERACTIVE"; fi)"
  log INFO "Dry Run:  ${DRY_RUN}"
  log INFO "Log:      ${LOG_FILE}"
  echo ""

  preflight_checks
  detect_primary_failure
  verify_replica
  confirm_failover
  promote_replica
  update_secrets
  verify_health
  print_summary

  log INFO "Failover sequence completed"
}

main "$@"
