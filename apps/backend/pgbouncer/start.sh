#!/bin/sh
# PgBouncer entrypoint for Fly.io sidecar deployment
# Parses DATABASE_URL into individual components for pgbouncer.ini
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "[pgbouncer] ERROR: DATABASE_URL is not set"
  exit 1
fi

# Parse DATABASE_URL (format: postgres://user:password@host:port/dbname)
# Remove protocol prefix
DB_CONN="${DATABASE_URL#*://}"

# Extract user:password
DB_USERPASS="${DB_CONN%%@*}"
export DB_USER="${DB_USERPASS%%:*}"
export DB_PASSWORD="${DB_USERPASS#*:}"

# Extract host:port/dbname
DB_HOSTPORTDB="${DB_CONN#*@}"
DB_HOSTPORT="${DB_HOSTPORTDB%%/*}"
export DB_NAME="${DB_HOSTPORTDB#*/}"
# Remove query string if present
export DB_NAME="${DB_NAME%%\?*}"

export DB_HOST="${DB_HOSTPORT%%:*}"
export DB_PORT="${DB_HOSTPORT#*:}"

# Default port if not specified
if [ "$DB_PORT" = "$DB_HOST" ]; then
  export DB_PORT="5432"
fi

echo "[pgbouncer] Starting PgBouncer sidecar"
echo "[pgbouncer] Pool mode: transaction"
echo "[pgbouncer] Listening on 127.0.0.1:6432"
echo "[pgbouncer] Proxying to ${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Use envsubst to resolve environment variables in pgbouncer.ini
if command -v envsubst > /dev/null 2>&1; then
  envsubst < /etc/pgbouncer/pgbouncer.ini > /tmp/pgbouncer.ini
  exec pgbouncer /tmp/pgbouncer.ini
else
  # Fallback: use sed for variable substitution
  cp /etc/pgbouncer/pgbouncer.ini /tmp/pgbouncer.ini
  sed -i "s|\${DB_HOST}|${DB_HOST}|g" /tmp/pgbouncer.ini
  sed -i "s|\${DB_PORT}|${DB_PORT}|g" /tmp/pgbouncer.ini
  sed -i "s|\${DB_NAME}|${DB_NAME}|g" /tmp/pgbouncer.ini
  sed -i "s|\${DB_USER}|${DB_USER}|g" /tmp/pgbouncer.ini
  sed -i "s|\${DB_PASSWORD}|${DB_PASSWORD}|g" /tmp/pgbouncer.ini
  exec pgbouncer /tmp/pgbouncer.ini
fi
