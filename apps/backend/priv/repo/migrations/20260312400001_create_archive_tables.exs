defmodule CGraph.Repo.Migrations.CreateArchiveTables do
  use Ecto.Migration

  @moduledoc """
  Creates archive_messages and archive_forum_posts tables.

  These tables mirror the structure of their source tables (messages, posts)
  so that `INSERT INTO archive_x SELECT * FROM x WHERE ...` works directly.
  An additional `archived_at` column records when the row was archived.
  """

  def up do
    # ── archive_messages ──────────────────────────────────────────────────
    execute """
    CREATE TABLE IF NOT EXISTS archive_messages (
      LIKE messages INCLUDING ALL
    )
    """

    execute """
    ALTER TABLE archive_messages
    ADD COLUMN IF NOT EXISTS archived_at timestamptz NOT NULL DEFAULT NOW()
    """

    execute """
    CREATE INDEX IF NOT EXISTS idx_archive_messages_archived_at
    ON archive_messages (archived_at DESC)
    """

    execute """
    CREATE INDEX IF NOT EXISTS idx_archive_messages_conversation_id
    ON archive_messages (conversation_id)
    """

    # ── archive_forum_posts ───────────────────────────────────────────────
    execute """
    CREATE TABLE IF NOT EXISTS archive_forum_posts (
      LIKE posts INCLUDING ALL
    )
    """

    execute """
    ALTER TABLE archive_forum_posts
    ADD COLUMN IF NOT EXISTS archived_at timestamptz NOT NULL DEFAULT NOW()
    """

    execute """
    CREATE INDEX IF NOT EXISTS idx_archive_forum_posts_archived_at
    ON archive_forum_posts (archived_at DESC)
    """

    execute """
    CREATE INDEX IF NOT EXISTS idx_archive_forum_posts_thread_id
    ON archive_forum_posts (thread_id)
    """

    # ── Optional: Convert to TimescaleDB hypertables if extension is available ──
    # This is wrapped in a DO block so it silently no-ops if TimescaleDB
    # is not installed.
    execute """
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
        PERFORM create_hypertable('archive_messages', 'archived_at',
                                  if_not_exists => TRUE,
                                  migrate_data => TRUE);
        PERFORM create_hypertable('archive_forum_posts', 'archived_at',
                                  if_not_exists => TRUE,
                                  migrate_data => TRUE);
      END IF;
    END
    $$;
    """
  end

  def down do
    execute "DROP TABLE IF EXISTS archive_forum_posts"
    execute "DROP TABLE IF EXISTS archive_messages"
  end
end
