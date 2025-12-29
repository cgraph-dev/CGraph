#!/bin/bash
# CGraph Database Management Script
# Handles database migrations, backups, and maintenance

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Load environment
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Parse DATABASE_URL or use individual vars
if [ -n "$DATABASE_URL" ]; then
    # Parse DATABASE_URL
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:\/]*\).*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
else
    DB_USER="${POSTGRES_USER:-cgraph}"
    DB_PASS="${POSTGRES_PASSWORD:-cgraph_dev_password}"
    DB_HOST="${POSTGRES_HOST:-localhost}"
    DB_PORT="${POSTGRES_PORT:-5432}"
    DB_NAME="${POSTGRES_DB:-cgraph_dev}"
fi

print_help() {
    echo "CGraph Database Management"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  migrate          Run pending migrations"
    echo "  rollback         Rollback last migration"
    echo "  reset            Drop and recreate database"
    echo "  seed             Run database seeds"
    echo "  backup           Create database backup"
    echo "  restore <file>   Restore from backup file"
    echo "  status           Show migration status"
    echo "  console          Open psql console"
    echo ""
}

run_migrate() {
    echo -e "${BLUE}Running database migrations...${NC}"
    cd apps/backend
    mix ecto.migrate
    cd ../..
    echo -e "${GREEN}✓${NC} Migrations complete"
}

run_rollback() {
    echo -e "${YELLOW}Rolling back last migration...${NC}"
    cd apps/backend
    mix ecto.rollback
    cd ../..
    echo -e "${GREEN}✓${NC} Rollback complete"
}

run_reset() {
    echo -e "${RED}WARNING: This will delete all data!${NC}"
    read -p "Are you sure? (y/N) " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        cd apps/backend
        mix ecto.reset
        cd ../..
        echo -e "${GREEN}✓${NC} Database reset complete"
    else
        echo "Cancelled."
    fi
}

run_seed() {
    echo -e "${BLUE}Running database seeds...${NC}"
    cd apps/backend
    mix run priv/repo/seeds.exs
    cd ../..
    echo -e "${GREEN}✓${NC} Seeding complete"
}

run_backup() {
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$TIMESTAMP.sql.gz"
    
    echo -e "${BLUE}Creating backup: $BACKUP_FILE${NC}"
    
    PGPASSWORD="$DB_PASS" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-acl \
        -Fc | gzip > "$BACKUP_FILE"
    
    echo -e "${GREEN}✓${NC} Backup created: $BACKUP_FILE"
    echo "Size: $(du -h $BACKUP_FILE | cut -f1)"
}

run_restore() {
    BACKUP_FILE="$1"
    
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: Please specify a backup file${NC}"
        exit 1
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    echo -e "${RED}WARNING: This will replace all data!${NC}"
    read -p "Are you sure? (y/N) " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo -e "${BLUE}Restoring from: $BACKUP_FILE${NC}"
        
        gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASS" pg_restore \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --clean \
            --if-exists
        
        echo -e "${GREEN}✓${NC} Restore complete"
    else
        echo "Cancelled."
    fi
}

run_status() {
    echo -e "${BLUE}Migration status:${NC}"
    cd apps/backend
    mix ecto.migrations
    cd ../..
}

run_console() {
    echo -e "${BLUE}Connecting to database...${NC}"
    PGPASSWORD="$DB_PASS" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME"
}

# Main
case "${1:-help}" in
    migrate)
        run_migrate
        ;;
    rollback)
        run_rollback
        ;;
    reset)
        run_reset
        ;;
    seed)
        run_seed
        ;;
    backup)
        run_backup
        ;;
    restore)
        run_restore "$2"
        ;;
    status)
        run_status
        ;;
    console)
        run_console
        ;;
    help|--help|-h)
        print_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        print_help
        exit 1
        ;;
esac
