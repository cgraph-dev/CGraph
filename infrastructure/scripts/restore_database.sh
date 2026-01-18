#!/bin/bash
# =============================================================================
# CGraph Database Restore Script
# =============================================================================
# Restore PostgreSQL database from backup with safety checks.
#
# Usage:
#   ./restore_database.sh <backup_file> [--force]
#
# Environment variables required:
#   DATABASE_URL - PostgreSQL connection string
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"; }

BACKUP_FILE="${1:-}"
FORCE="${2:-}"

if [ -z "$BACKUP_FILE" ]; then
    log_error "Usage: $0 <backup_file> [--force]"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable is required"
    exit 1
fi

# Parse DATABASE_URL
parse_db_url() {
    local url="$1"
    DB_USER=$(echo "$url" | sed -E 's|.*://([^:]+):.*|\1|')
    DB_PASS=$(echo "$url" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
    DB_HOST=$(echo "$url" | sed -E 's|.*@([^:/]+).*|\1|')
    DB_PORT=$(echo "$url" | sed -E 's|.*:([0-9]+)/.*|\1|')
    DB_NAME=$(echo "$url" | sed -E 's|.*/([^?]+).*|\1|')
}

parse_db_url "$DATABASE_URL"

log_info "Restore target: $DB_NAME on $DB_HOST"
log_info "Backup file: $BACKUP_FILE"

# Safety confirmation
if [ "$FORCE" != "--force" ]; then
    log_warn "⚠️  This will REPLACE ALL DATA in database: $DB_NAME"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled."
        exit 0
    fi
fi

# Create pre-restore backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PRE_RESTORE_BACKUP="/tmp/cgraph_pre_restore_${TIMESTAMP}.sql.gz"

log_info "Creating pre-restore backup..."
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --format=plain --no-owner --no-privileges 2>/dev/null | gzip > "$PRE_RESTORE_BACKUP"
log_info "Pre-restore backup saved to: $PRE_RESTORE_BACKUP"

# Restore
log_info "Starting database restore..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --quiet --single-transaction 2>&1
else
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --quiet --single-transaction < "$BACKUP_FILE" 2>&1
fi

unset PGPASSWORD

log_info "✅ Database restore completed successfully!"
log_info "Pre-restore backup available at: $PRE_RESTORE_BACKUP"

exit 0
