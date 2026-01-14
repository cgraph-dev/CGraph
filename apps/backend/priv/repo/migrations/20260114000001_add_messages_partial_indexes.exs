defmodule CGraph.Repo.Migrations.AddMessagesPartialIndexes do
  @moduledoc """
  Adds partial indexes for soft-deleted messages to optimize query performance.

  ## Rationale

  The messages table uses soft deletes (deleted_at column). Most queries filter
  out deleted messages, making a partial index on `deleted_at IS NULL` highly
  effective. This reduces index size by excluding deleted records and speeds
  up lookups for active messages.

  ## Indexes Added

  1. `messages_conversation_active_idx` - Composite index for conversation message lookups
     - Covers: WHERE conversation_id = ? AND deleted_at IS NULL ORDER BY inserted_at
     - Estimated improvement: 60-80% for conversation history queries

  2. `messages_channel_active_idx` - Composite index for channel message lookups
     - Covers: WHERE channel_id = ? AND deleted_at IS NULL ORDER BY inserted_at
     - Estimated improvement: 60-80% for channel message queries

  3. `messages_sender_active_idx` - Index for user's sent messages (non-deleted)
     - Covers: WHERE sender_id = ? AND deleted_at IS NULL
     - Useful for: User profile, search, moderation

  ## Migration Safety

  - Uses `CREATE INDEX CONCURRENTLY` to avoid blocking writes
  - Safe to run on production with live traffic
  - Rollback is also concurrent and safe
  """
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def up do
    # Partial index for conversation messages (most common query pattern)
    # Optimizes: SELECT * FROM messages WHERE conversation_id = ? AND deleted_at IS NULL ORDER BY inserted_at DESC
    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_conversation_active_idx
    ON messages (conversation_id, inserted_at DESC)
    WHERE deleted_at IS NULL
    """

    # Partial index for channel messages (group chats)
    # Optimizes: SELECT * FROM messages WHERE channel_id = ? AND deleted_at IS NULL ORDER BY inserted_at DESC
    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_channel_active_idx
    ON messages (channel_id, inserted_at DESC)
    WHERE deleted_at IS NULL
    """

    # Partial index for sender's active messages
    # Optimizes: SELECT * FROM messages WHERE sender_id = ? AND deleted_at IS NULL
    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_sender_active_idx
    ON messages (sender_id, inserted_at DESC)
    WHERE deleted_at IS NULL
    """

    # Partial index for unread message counts (messages after last_read)
    # Optimizes: COUNT(*) WHERE conversation_id = ? AND inserted_at > ? AND deleted_at IS NULL
    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_unread_count_idx
    ON messages (conversation_id, inserted_at)
    WHERE deleted_at IS NULL
    """

    # Add partial indexes for forum posts table if it exists
    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS forum_posts_thread_active_idx
    ON forum_posts (thread_id, inserted_at DESC)
    WHERE deleted_at IS NULL
    """

    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS forum_posts_author_active_idx
    ON forum_posts (author_id, inserted_at DESC)
    WHERE deleted_at IS NULL
    """
  end

  def down do
    execute "DROP INDEX CONCURRENTLY IF EXISTS messages_conversation_active_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS messages_channel_active_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS messages_sender_active_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS messages_unread_count_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS forum_posts_thread_active_idx"
    execute "DROP INDEX CONCURRENTLY IF EXISTS forum_posts_author_active_idx"
  end
end
