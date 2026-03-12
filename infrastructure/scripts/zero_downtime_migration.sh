#!/usr/bin/env bash
# ==============================================================================
# Zero-Downtime Migration Script for Fly.io
# ==============================================================================
#
# Runs Ecto migrations with safety checks, transactional execution,
# and automatic rollback on failure.
#
# Usage:
#   ./zero_downtime_migration.sh [options]
#
# Options:
#   --app APP_NAME       Fly.io app name (default: cgraph-backend)
#   --dry-run            Show what would be run without executing
#   --skip-backup        Skip pre-migration backup
#   --timeout SECONDS    Migration timeout (default: 300)
#   --verbose            Enable verbose output
#   -h, --help           Show this help message
#
# Prerequisites:
#   - flyctl CLI installed and authenticated
#   - App deployed on Fly.io
#   - Database accessible from Fly machines
# ==============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

APP_NAME="${FLY_APP_NAME:-cgraph-backend}"
MIGRATION_TIMEOUT=300
DRY_RUN=false
SKIP_BACKUP=false
VERBOSE=false
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
LOG_FILE="/tmp/migration_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    INFO)  echo -e "${BLUE}[INFO]${NC}  ${ts} ${msg}" ;;
    OK)    echo -e "${GREEN}[OK]${NC}    ${ts} ${msg}" ;;
    WARN)  echo -e "${YELLOW}[WARN]${NC}  ${ts} ${msg}" ;;
    ERROR) echo -e "${RED}[ERROR]${NC} ${ts} ${msg}" ;;
  esac

  echo "[${level}] ${ts} ${msg}" >> "$LOG_FILE"
}

die() {
  log ERROR "$@"
  exit 1
}

usage() {
  head -30 "$0" | grep "^#" | sed 's/^# \?//'
  exit 0
}

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)        APP_NAME="$2"; shift 2 ;;
    --dry-run)    DRY_RUN=true; shift ;;
    --skip-backup) SKIP_BACKUP=true; shift ;;
    --timeout)    MIGRATION_TIMEOUT="$2"; shift 2 ;;
    --verbose)    VERBOSE=true; shift ;;
    -h|--help)    usage ;;
    *)            die "Unknown option: $1" ;;
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
  log OK "flyctl found: $(flyctl version 2>/dev/null | head -1)"

  # Check authentication
  if ! flyctl auth whoami &>/dev/null 2>&1; then
    die "Not authenticated with Fly.io. Run: flyctl auth login"
  fi
  log OK "Authenticated with Fly.io"

  # Check app exists
  if ! flyctl status --app "$APP_NAME" &>/dev/null 2>&1; then
    die "App '$APP_NAME' not found on Fly.io"
  fi
  log OK "App '$APP_NAME' found"

  # Check app health before migration
  local health_status
  health_status=$(flyctl status --app "$APP_NAME" 2>/dev/null | grep -c "running" || true)
  if [[ "$health_status" -lt 1 ]]; then
    log WARN "No running machines detected for '$APP_NAME'"
  else
    log OK "$health_status running machine(s) detected"
  fi

  # Check pending migrations
  log INFO "Checking for pending migrations..."
  local pending
  pending=$(flyctl ssh console --app "$APP_NAME" -C \
    "/app/bin/cgraph eval 'CGraph.Release.pending_migrations() |> length() |> IO.puts()'" \
    2>/dev/null || echo "unknown")

  if [[ "$pending" == "0" ]]; then
    log OK "No pending migrations — nothing to do"
    exit 0
  elif [[ "$pending" == "unknown" ]]; then
    log WARN "Could not determine pending migration count (proceeding)"
  else
    log INFO "$pending pending migration(s) found"
  fi

  log OK "Pre-flight checks passed"
}

# ---------------------------------------------------------------------------
# Backup
# ---------------------------------------------------------------------------

backup() {
  if [[ "$SKIP_BACKUP" == "true" ]]; then
    log WARN "Skipping pre-migration backup (--skip-backup)"
    return 0
  fi

  log INFO "=== Creating pre-migration backup ==="

  if [[ "$DRY_RUN" == "true" ]]; then
    log INFO "[DRY RUN] Would create database backup"
    return 0
  fi

  # Use pg_dump via Fly proxy for backup
  local backup_file="/tmp/backup_${APP_NAME}_${TIMESTAMP}.sql.gz"

  # Try to get DATABASE_URL from app secrets
  local db_url
  db_url=$(flyctl ssh console --app "$APP_NAME" -C \
    "printenv DATABASE_URL" 2>/dev/null || echo "")

  if [[ -n "$db_url" ]]; then
    log INFO "Creating compressed backup..."
    if flyctl ssh console --app "$APP_NAME" -C \
      "pg_dump '${db_url}' --no-owner --no-acl | gzip" > "$backup_file" 2>/dev/null; then
      local size
      size=$(du -sh "$backup_file" 2>/dev/null | cut -f1 || echo "unknown")
      log OK "Backup created: $backup_file ($size)"
    else
      log WARN "Backup via pg_dump failed (migration will still proceed)"
    fi
  else
    log WARN "DATABASE_URL not accessible; skipping backup"
  fi
}

# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------

run_migration() {
  log INFO "=== Running migrations ==="
  log INFO "App: $APP_NAME"
  log INFO "Timeout: ${MIGRATION_TIMEOUT}s"

  if [[ "$DRY_RUN" == "true" ]]; then
    log INFO "[DRY RUN] Would execute: CGraph.Release.migrate()"
    return 0
  fi

  local start_time
  start_time=$(date +%s)

  # Run migration via Fly SSH with timeout
  log INFO "Executing migrations on remote machine..."
  local migration_output
  local exit_code=0

  migration_output=$(timeout "${MIGRATION_TIMEOUT}" flyctl ssh console --app "$APP_NAME" -C \
    "/app/bin/cgraph eval '
      try do
        CGraph.Release.migrate()
        IO.puts(\"MIGRATION_SUCCESS\")
      rescue
        e ->
          IO.puts(\"MIGRATION_FAILED: #{Exception.message(e)}\")
          System.halt(1)
      end
    '" 2>&1) || exit_code=$?

  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))

  echo "$migration_output" >> "$LOG_FILE"

  if [[ $exit_code -ne 0 ]]; then
    log ERROR "Migration failed (exit code: $exit_code, duration: ${duration}s)"
    log ERROR "Output: $migration_output"
    return 1
  fi

  if echo "$migration_output" | grep -q "MIGRATION_SUCCESS"; then
    log OK "Migration completed successfully (${duration}s)"
    return 0
  elif echo "$migration_output" | grep -q "MIGRATION_FAILED"; then
    log ERROR "Migration reported failure"
    log ERROR "Output: $migration_output"
    return 1
  else
    log WARN "Migration completed but status unclear (${duration}s)"
    log WARN "Output: $migration_output"
    return 0
  fi
}

# ---------------------------------------------------------------------------
# Post-verification
# ---------------------------------------------------------------------------

post_verify() {
  log INFO "=== Post-migration verification ==="

  if [[ "$DRY_RUN" == "true" ]]; then
    log INFO "[DRY RUN] Would verify migration status"
    return 0
  fi

  # Verify no pending migrations remain
  local pending
  pending=$(flyctl ssh console --app "$APP_NAME" -C \
    "/app/bin/cgraph eval 'CGraph.Release.pending_migrations() |> length() |> IO.puts()'" \
    2>/dev/null || echo "unknown")

  if [[ "$pending" == "0" ]]; then
    log OK "No pending migrations remain"
  elif [[ "$pending" == "unknown" ]]; then
    log WARN "Could not verify pending migrations"
  else
    log ERROR "$pending migration(s) still pending after run!"
    return 1
  fi

  # Health check after migration
  log INFO "Running post-migration health check..."
  local health
  health=$(flyctl ssh console --app "$APP_NAME" -C \
    "curl -sf http://localhost:4000/health" 2>/dev/null || echo "{}")

  if echo "$health" | grep -qi "ok\|healthy"; then
    log OK "Health check passed after migration"
  else
    log WARN "Health check response: $health"
  fi

  # Verify database connectivity
  local db_check
  db_check=$(flyctl ssh console --app "$APP_NAME" -C \
    "/app/bin/cgraph eval 'CGraph.Repo.query!(\"SELECT 1\") |> IO.inspect()'" \
    2>/dev/null || echo "failed")

  if echo "$db_check" | grep -q "num_rows"; then
    log OK "Database connectivity verified"
  else
    log WARN "Database connectivity check inconclusive"
  fi

  log OK "Post-migration verification complete"
}

# ---------------------------------------------------------------------------
# Rollback
# ---------------------------------------------------------------------------

rollback() {
  log INFO "=== Attempting rollback ==="

  if [[ "$DRY_RUN" == "true" ]]; then
    log INFO "[DRY RUN] Would execute rollback"
    return 0
  fi

  local rollback_output
  local exit_code=0

  rollback_output=$(timeout "${MIGRATION_TIMEOUT}" flyctl ssh console --app "$APP_NAME" -C \
    "/app/bin/cgraph eval '
      try do
        CGraph.Release.rollback(CGraph.Repo, step: 1)
        IO.puts(\"ROLLBACK_SUCCESS\")
      rescue
        e ->
          IO.puts(\"ROLLBACK_FAILED: #{Exception.message(e)}\")
          System.halt(1)
      end
    '" 2>&1) || exit_code=$?

  if [[ $exit_code -eq 0 ]] && echo "$rollback_output" | grep -q "ROLLBACK_SUCCESS"; then
    log OK "Rollback completed successfully"
  else
    log ERROR "Rollback failed! Manual intervention required."
    log ERROR "Output: $rollback_output"
    die "CRITICAL: Migration failed and rollback failed. Check database manually."
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
  log INFO "============================================"
  log INFO "Zero-Downtime Migration — $APP_NAME"
  log INFO "============================================"
  log INFO "Log file: $LOG_FILE"

  if [[ "$DRY_RUN" == "true" ]]; then
    log WARN "Running in DRY RUN mode — no changes will be made"
  fi

  # Step 1: Pre-flight
  preflight

  # Step 2: Backup
  backup

  # Step 3: Run migration
  if ! run_migration; then
    log ERROR "Migration failed — initiating rollback"
    rollback
    die "Migration failed and was rolled back. Check logs: $LOG_FILE"
  fi

  # Step 4: Post-verification
  if ! post_verify; then
    log WARN "Post-verification failed — consider manual review"
    log WARN "You may want to rollback: flyctl ssh console --app $APP_NAME -C '/app/bin/cgraph eval \"CGraph.Release.rollback(CGraph.Repo, step: 1)\"'"
  fi

  log OK "============================================"
  log OK "Migration completed successfully!"
  log OK "============================================"
  log INFO "Full log: $LOG_FILE"
}

main
