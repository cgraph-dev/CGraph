defmodule CGraph.Repo.Migrations.AddPerformanceIndexes do
  @moduledoc """
  Adds missing indexes identified by the EXPLAIN ANALYZE query performance audit.

  Most critical indexes (threads, posts, groups, users trigram, notifications partial,
  conversation_participants, messages updated_at) already exist from prior migrations.

  This migration adds:
  1. Functional index on lower(username) for case-insensitive login lookups
     (credentials.ex uses fragment("lower(?)", u.username) on every login)
  2. pg_trgm extension (idempotent, required for existing trigram indexes)

  All indexes are created concurrently to avoid table locks in production.
  """

  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def up do
    # Enable pg_trgm extension (required for existing GIN trigram indexes)
    # This is idempotent — no-op if already enabled
    execute "CREATE EXTENSION IF NOT EXISTS pg_trgm"

    # Functional index on lower(username) for case-insensitive login
    # Without this, `WHERE lower(username) = $1` does a sequential scan on users
    # This is called on every login attempt via credentials.ex
    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS users_lower_username_idx
    ON users (lower(username))
    """
  end

  def down do
    execute "DROP INDEX IF EXISTS users_lower_username_idx"
  end
end
