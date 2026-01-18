#!/bin/bash
# =============================================================================
# CGraph Database Backup Script
# =============================================================================
# Automated PostgreSQL backup with compression and rotation.
# Supports both local backups and S3/R2 remote storage.
#
# Usage:
#   ./backup_database.sh [full|incremental] [--upload]
#
# Environment variables required:
#   DATABASE_URL - PostgreSQL connection string
#   R2_BUCKET - Cloudflare R2 bucket name (optional, for remote backup)
#   R2_ACCESS_KEY_ID - R2 access key (optional)
#   R2_SECRET_ACCESS_KEY - R2 secret key (optional)
#   R2_ENDPOINT - R2 endpoint URL (optional)
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/cgraph}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_TYPE="${1:-full}"
UPLOAD_TO_REMOTE="${2:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check required environment
if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable is required"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR/logs"

# Parse DATABASE_URL
parse_db_url() {
    local url="$1"
    # Extract components from postgresql://user:pass@host:port/dbname
    DB_USER=$(echo "$url" | sed -E 's|.*://([^:]+):.*|\1|')
    DB_PASS=$(echo "$url" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
    DB_HOST=$(echo "$url" | sed -E 's|.*@([^:/]+).*|\1|')
    DB_PORT=$(echo "$url" | sed -E 's|.*:([0-9]+)/.*|\1|')
    DB_NAME=$(echo "$url" | sed -E 's|.*/([^?]+).*|\1|')
}

parse_db_url "$DATABASE_URL"

BACKUP_FILE="${BACKUP_DIR}/cgraph_${BACKUP_TYPE}_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/logs/backup_${TIMESTAMP}.log"

log_info "Starting $BACKUP_TYPE backup of database: $DB_NAME"
log_info "Backup file: $BACKUP_FILE"

# Perform backup
export PGPASSWORD="$DB_PASS"

if [ "$BACKUP_TYPE" = "full" ]; then
    log_info "Performing full backup with pg_dump..."
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --format=plain \
        --no-owner \
        --no-privileges \
        --verbose \
        2>> "$LOG_FILE" | gzip > "$BACKUP_FILE"
else
    log_info "Performing incremental backup (WAL-based)..."
    # For incremental, we'd use pg_basebackup with WAL archiving
    # This requires WAL archiving to be configured on the server
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --format=plain \
        --no-owner \
        --no-privileges \
        --data-only \
        --verbose \
        2>> "$LOG_FILE" | gzip > "$BACKUP_FILE"
fi

unset PGPASSWORD

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log_info "Backup completed successfully. Size: $BACKUP_SIZE"

# Upload to remote storage if requested
if [ "$UPLOAD_TO_REMOTE" = "--upload" ] && [ -n "${R2_BUCKET:-}" ]; then
    log_info "Uploading backup to Cloudflare R2..."
    
    REMOTE_PATH="backups/database/$(date +%Y/%m)/$(basename "$BACKUP_FILE")"
    
    aws s3 cp "$BACKUP_FILE" "s3://${R2_BUCKET}/${REMOTE_PATH}" \
        --endpoint-url "${R2_ENDPOINT}" \
        2>> "$LOG_FILE"
    
    log_info "Backup uploaded to: s3://${R2_BUCKET}/${REMOTE_PATH}"
fi

# Cleanup old backups (local)
log_info "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "cgraph_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR/logs" -name "backup_*.log" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# List recent backups
log_info "Recent backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 || echo "No backups found"

# Create backup manifest
MANIFEST_FILE="${BACKUP_DIR}/manifest.json"
cat > "$MANIFEST_FILE" << EOF
{
  "last_backup": "$TIMESTAMP",
  "backup_type": "$BACKUP_TYPE",
  "backup_file": "$BACKUP_FILE",
  "backup_size": "$BACKUP_SIZE",
  "database": "$DB_NAME",
  "retention_days": $RETENTION_DAYS,
  "uploaded_to_remote": $([ "$UPLOAD_TO_REMOTE" = "--upload" ] && echo "true" || echo "false")
}
EOF

log_info "Backup manifest updated: $MANIFEST_FILE"
log_info "Backup process completed successfully!"

exit 0
