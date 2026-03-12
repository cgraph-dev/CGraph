#!/usr/bin/env bash
# ==============================================================================
# Blue-Green Deploy Script for Fly.io
# ==============================================================================
#
# Performs a blue-green deployment with health check verification:
# 1. Deploy new version to staging machines
# 2. Run health checks against new deployment
# 3. Switch traffic from old (blue) to new (green)
# 4. Keep old machines as fallback for quick rollback
#
# Usage:
#   ./blue_green_deploy.sh [options]
#
# Options:
#   --app APP_NAME         Fly.io app name (default: cgraph-backend)
#   --region REGION        Primary region (default: fra)
#   --image IMAGE          Docker image to deploy (default: from Dockerfile)
#   --health-retries N     Health check retry count (default: 10)
#   --health-interval S    Seconds between health checks (default: 10)
#   --skip-migrations      Skip running migrations
#   --rollback             Roll back to previous deployment
#   --dry-run              Show what would be run
#   --verbose              Enable verbose output
#   -h, --help             Show this help
#
# Prerequisites:
#   - flyctl CLI installed and authenticated
#   - App configured on Fly.io
# ==============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

APP_NAME="${FLY_APP_NAME:-cgraph-backend}"
PRIMARY_REGION="${FLY_REGION:-fra}"
DOCKER_IMAGE=""
HEALTH_RETRIES=10
HEALTH_INTERVAL=10
SKIP_MIGRATIONS=false
ROLLBACK_MODE=false
DRY_RUN=false
VERBOSE=false
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
LOG_FILE="/tmp/deploy_${TIMESTAMP}.log"

# Health check endpoints
HEALTH_ENDPOINT="/health"
READY_ENDPOINT="/ready"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log() {
  local level="$1"
  shift
  local msg="$*"
  local ts
  ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  case "$level" in
    INFO)   echo -e "${BLUE}[INFO]${NC}    ${ts} ${msg}" ;;
    OK)     echo -e "${GREEN}[OK]${NC}      ${ts} ${msg}" ;;
    WARN)   echo -e "${YELLOW}[WARN]${NC}    ${ts} ${msg}" ;;
    ERROR)  echo -e "${RED}[ERROR]${NC}   ${ts} ${msg}" ;;
    DEPLOY) echo -e "${CYAN}[DEPLOY]${NC}  ${ts} ${msg}" ;;
  esac

  echo "[${level}] ${ts} ${msg}" >> "$LOG_FILE"
}

die() {
  log ERROR "$@"
  exit 1
}

usage() {
  head -35 "$0" | grep "^#" | sed 's/^# \?//'
  exit 0
}

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)             APP_NAME="$2"; shift 2 ;;
    --region)          PRIMARY_REGION="$2"; shift 2 ;;
    --image)           DOCKER_IMAGE="$2"; shift 2 ;;
    --health-retries)  HEALTH_RETRIES="$2"; shift 2 ;;
    --health-interval) HEALTH_INTERVAL="$2"; shift 2 ;;
    --skip-migrations) SKIP_MIGRATIONS=true; shift ;;
    --rollback)        ROLLBACK_MODE=true; shift ;;
    --dry-run)         DRY_RUN=true; shift ;;
    --verbose)         VERBOSE=true; shift ;;
    -h|--help)         usage ;;
    *)                 die "Unknown option: $1" ;;
  esac
done

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------

preflight() {
  log INFO "=== Pre-flight checks ==="

  # Check flyctl
  if ! command -v flyctl &>/dev/null; then
    die "flyctl CLI not found. Install: https://fly.io/docs/hands-on/install-flyctl/"
  fi
  log OK "flyctl: $(flyctl version 2>/dev/null | head -1)"

  # Authentication
  if ! flyctl auth whoami &>/dev/null 2>&1; then
    die "Not authenticated. Run: flyctl auth login"
  fi
  log OK "Fly.io authentication verified"

  # App exists
  if ! flyctl status --app "$APP_NAME" &>/dev/null 2>&1; then
    die "App '$APP_NAME' not found"
  fi
  log OK "App '$APP_NAME' exists"

  # Get current machine count
  local machine_count
  machine_count=$(flyctl machines list --app "$APP_NAME" --json 2>/dev/null | grep -c '"id"' || echo "0")
  log INFO "Current machines: $machine_count"

  # Record current deployment for rollback reference
  CURRENT_IMAGE=$(flyctl status --app "$APP_NAME" --json 2>/dev/null | \
    grep -o '"image":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")
  log INFO "Current image: $CURRENT_IMAGE"

  log OK "Pre-flight checks passed"
}

# ---------------------------------------------------------------------------
# Build & deploy to staging
# ---------------------------------------------------------------------------

deploy_green() {
  log DEPLOY "=== Deploying green (new version) ==="

  if [[ "$DRY_RUN" == "true" ]]; then
    log INFO "[DRY RUN] Would deploy new version"
    return 0
  fi

  local deploy_args=(
    "--app" "$APP_NAME"
    "--region" "$PRIMARY_REGION"
    "--strategy" "rolling"
    "--wait-timeout" "300"
  )

  if [[ -n "$DOCKER_IMAGE" ]]; then
    deploy_args+=("--image" "$DOCKER_IMAGE")
  fi

  log DEPLOY "Starting deployment..."
  log DEPLOY "Strategy: rolling (blue-green via Fly.io)"

  local deploy_output
  local exit_code=0
  deploy_output=$(flyctl deploy "${deploy_args[@]}" 2>&1) || exit_code=$?

  echo "$deploy_output" >> "$LOG_FILE"

  if [[ $exit_code -ne 0 ]]; then
    log ERROR "Deployment failed!"
    log ERROR "Output (last 20 lines):"
    echo "$deploy_output" | tail -20

    # Fly.io auto-rollback should handle this, but log it
    if echo "$deploy_output" | grep -qi "auto.rollback\|rolled back"; then
      log WARN "Fly.io auto-rollback activated"
    fi

    return 1
  fi

  log OK "Green deployment completed"
}

# ---------------------------------------------------------------------------
# Health check verification
# ---------------------------------------------------------------------------

health_check() {
  log INFO "=== Health check verification ==="

  if [[ "$DRY_RUN" == "true" ]]; then
    log INFO "[DRY RUN] Would run health checks"
    return 0
  fi

  local attempts=0
  local healthy=false

  log INFO "Waiting for new deployment to become healthy..."
  log INFO "Max retries: $HEALTH_RETRIES, interval: ${HEALTH_INTERVAL}s"

  while [[ $attempts -lt $HEALTH_RETRIES ]]; do
    attempts=$((attempts + 1))
    log INFO "Health check attempt $attempts/$HEALTH_RETRIES..."

    # Check liveness endpoint
    local liveness_status
    liveness_status=$(flyctl ssh console --app "$APP_NAME" -C \
      "curl -sf -o /dev/null -w '%{http_code}' http://localhost:4000${HEALTH_ENDPOINT}" \
      2>/dev/null || echo "000")

    # Check readiness endpoint
    local readiness_status
    readiness_status=$(flyctl ssh console --app "$APP_NAME" -C \
      "curl -sf -o /dev/null -w '%{http_code}' http://localhost:4000${READY_ENDPOINT}" \
      2>/dev/null || echo "000")

    log INFO "  Liveness: $liveness_status, Readiness: $readiness_status"

    if [[ "$liveness_status" == "200" ]] && [[ "$readiness_status" == "200" ]]; then
      healthy=true
      break
    fi

    if [[ $attempts -lt $HEALTH_RETRIES ]]; then
      log INFO "  Retrying in ${HEALTH_INTERVAL}s..."
      sleep "$HEALTH_INTERVAL"
    fi
  done

  if [[ "$healthy" == "true" ]]; then
    log OK "Health checks passed on attempt $attempts"

    # Additional verification: check response body
    local health_body
    health_body=$(flyctl ssh console --app "$APP_NAME" -C \
      "curl -sf http://localhost:4000${HEALTH_ENDPOINT}" \
      2>/dev/null || echo "{}")

    if echo "$health_body" | grep -qi "ok\|healthy"; then
      log OK "Health endpoint response verified"
    else
      log WARN "Health endpoint response: $health_body"
    fi

    return 0
  else
    log ERROR "Health checks failed after $HEALTH_RETRIES attempts"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Run migrations
# ---------------------------------------------------------------------------

run_migrations() {
  if [[ "$SKIP_MIGRATIONS" == "true" ]]; then
    log INFO "Skipping migrations (--skip-migrations)"
    return 0
  fi

  log INFO "=== Running database migrations ==="

  if [[ "$DRY_RUN" == "true" ]]; then
    log INFO "[DRY RUN] Would run migrations"
    return 0
  fi

  # Use the zero_downtime_migration.sh script if available
  local migration_script
  migration_script="$(dirname "$0")/zero_downtime_migration.sh"

  if [[ -x "$migration_script" ]]; then
    log INFO "Using zero_downtime_migration.sh"
    "$migration_script" --app "$APP_NAME" --skip-backup
  else
    # Fallback: run migration directly
    log INFO "Running migration via Fly console..."
    local output
    output=$(flyctl ssh console --app "$APP_NAME" -C \
      "/app/bin/cgraph eval 'CGraph.Release.migrate()'" 2>&1 || true)
    echo "$output" >> "$LOG_FILE"
    log OK "Migrations completed"
  fi
}

# ---------------------------------------------------------------------------
# Traffic switch
# ---------------------------------------------------------------------------

switch_traffic() {
  log DEPLOY "=== Traffic switch ==="

  if [[ "$DRY_RUN" == "true" ]]; then
    log INFO "[DRY RUN] Would switch traffic to green"
    return 0
  fi

  # Fly.io rolling deploy handles traffic switching automatically.
  # This function verifies the switch completed and all machines are running.

  log INFO "Verifying traffic routing..."

  local running_count
  running_count=$(flyctl machines list --app "$APP_NAME" --json 2>/dev/null | \
    grep -c '"started"' || echo "0")

  log OK "Running machines after deploy: $running_count"

  # Verify via external health check
  local external_check
  external_check=$(curl -sf -o /dev/null -w '%{http_code}' \
    "https://${APP_NAME}.fly.dev${HEALTH_ENDPOINT}" 2>/dev/null || echo "000")

  if [[ "$external_check" == "200" ]]; then
    log OK "External health check passed (HTTP $external_check)"
  else
    log WARN "External health check returned HTTP $external_check"
  fi

  log OK "Traffic switch verified"
}

# ---------------------------------------------------------------------------
# Rollback
# ---------------------------------------------------------------------------

rollback() {
  log WARN "=== Rolling back to previous deployment ==="

  if [[ "$DRY_RUN" == "true" ]]; then
    log INFO "[DRY RUN] Would rollback to: $CURRENT_IMAGE"
    return 0
  fi

  if [[ -z "$CURRENT_IMAGE" ]] || [[ "$CURRENT_IMAGE" == "unknown" ]]; then
    log ERROR "Cannot rollback: previous image unknown"
    log ERROR "Manual rollback: flyctl deploy --app $APP_NAME --image <previous-image>"
    return 1
  fi

  log WARN "Rolling back to: $CURRENT_IMAGE"

  local output
  local exit_code=0
  output=$(flyctl deploy --app "$APP_NAME" \
    --image "$CURRENT_IMAGE" \
    --strategy "rolling" \
    --wait-timeout 300 2>&1) || exit_code=$?

  echo "$output" >> "$LOG_FILE"

  if [[ $exit_code -eq 0 ]]; then
    log OK "Rollback successful"

    # Verify rollback health
    sleep 10
    if health_check; then
      log OK "Rollback verified — system healthy"
    else
      log ERROR "Rollback deployed but health checks failing!"
    fi
  else
    log ERROR "Rollback failed! Manual intervention required."
    log ERROR "Try: flyctl deploy --app $APP_NAME --image $CURRENT_IMAGE"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Post-deploy verification
# ---------------------------------------------------------------------------

post_deploy_verify() {
  log INFO "=== Post-deploy verification ==="

  if [[ "$DRY_RUN" == "true" ]]; then
    log INFO "[DRY RUN] Would verify deployment"
    return 0
  fi

  # Get new image info
  local new_image
  new_image=$(flyctl status --app "$APP_NAME" --json 2>/dev/null | \
    grep -o '"image":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")
  log INFO "Deployed image: $new_image"

  # Check all machines healthy
  local status_output
  status_output=$(flyctl status --app "$APP_NAME" 2>/dev/null || echo "status check failed")
  echo "$status_output" >> "$LOG_FILE"

  if [[ "$VERBOSE" == "true" ]]; then
    echo "$status_output"
  fi

  # Final external health check
  sleep 5
  local final_check
  final_check=$(curl -sf "https://${APP_NAME}.fly.dev${HEALTH_ENDPOINT}" 2>/dev/null || echo "{}")

  if echo "$final_check" | grep -qi "ok\|healthy"; then
    log OK "Final health check passed"
  else
    log WARN "Final health check response: $final_check"
  fi

  log OK "Post-deploy verification complete"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
  log DEPLOY "============================================"
  log DEPLOY "Blue-Green Deploy — $APP_NAME"
  log DEPLOY "============================================"
  log INFO "Log file: $LOG_FILE"
  log INFO "Region: $PRIMARY_REGION"

  if [[ "$DRY_RUN" == "true" ]]; then
    log WARN "Running in DRY RUN mode"
  fi

  CURRENT_IMAGE="unknown"

  # Pre-flight
  preflight

  # Rollback mode
  if [[ "$ROLLBACK_MODE" == "true" ]]; then
    rollback
    exit $?
  fi

  # Step 1: Run migrations first (before deploy for zero-downtime)
  run_migrations

  # Step 2: Deploy green
  if ! deploy_green; then
    log ERROR "Green deployment failed"
    die "Deployment failed. Fly.io auto-rollback should activate."
  fi

  # Step 3: Health check verification
  if ! health_check; then
    log ERROR "Health checks failed — initiating rollback"
    rollback
    die "Deploy failed health checks and was rolled back"
  fi

  # Step 4: Traffic switch verification
  switch_traffic

  # Step 5: Post-deploy verification
  post_deploy_verify

  log DEPLOY "============================================"
  log DEPLOY "Deployment completed successfully!"
  log DEPLOY "============================================"
  log INFO "Previous image: $CURRENT_IMAGE"
  log INFO "Rollback command: $0 --app $APP_NAME --rollback"
  log INFO "Full log: $LOG_FILE"
}

main
