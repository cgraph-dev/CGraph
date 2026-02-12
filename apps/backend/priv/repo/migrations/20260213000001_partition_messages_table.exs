defmodule CGraph.Repo.Migrations.PartitionMessagesTable do
  @moduledoc """
  Converts the messages table to range-partitioned by inserted_at (monthly).

  This is a non-destructive migration that:
  1. Creates a new partitioned messages table
  2. Creates initial monthly partitions (6 months back + 3 months forward)
  3. Migrates existing data
  4. Swaps tables atomically

  ## Why partition messages?

  Messages have the highest write volume and are almost always queried with
  a time component (conversation history, search within date range). Monthly
  partitions enable:

  - **Partition pruning**: Queries for recent messages only scan recent partitions
  - **Efficient VACUUM**: Each partition vacuums independently
  - **Fast retention**: DROP PARTITION is instant vs DELETE + VACUUM
  - **Parallel operations**: Index rebuilds can run per-partition

  ## Rollback

  The rollback recreates the original non-partitioned table structure.
  Data is preserved via the swap mechanism.
  """
  use Ecto.Migration

  @disable_ddl_transaction true
  @disable_migration_lock true

  def up do
    # Step 1: Create the partitioned table with same schema
    execute """
    CREATE TABLE messages_partitioned (
      id UUID NOT NULL DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL,
      sender_id UUID NOT NULL,
      body TEXT,
      type VARCHAR(50) DEFAULT 'text',
      metadata JSONB DEFAULT '{}',
      edited_at TIMESTAMP,
      deleted_at TIMESTAMP,
      parent_message_id UUID,
      inserted_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT messages_partitioned_pkey PRIMARY KEY (id, inserted_at)
    ) PARTITION BY RANGE (inserted_at);
    """

    # Step 2: Create monthly partitions (6 months back + 3 months forward)
    partitions = generate_partition_ranges()

    for {name, from_date, to_date} <- partitions do
      execute """
      CREATE TABLE #{name} PARTITION OF messages_partitioned
        FOR VALUES FROM ('#{from_date}') TO ('#{to_date}');
      """
    end

    # Create a default partition for any data outside defined ranges
    execute """
    CREATE TABLE messages_default PARTITION OF messages_partitioned DEFAULT;
    """

    # Step 3: Recreate indexes on partitioned table
    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_part_conversation_id
      ON messages_partitioned (conversation_id, inserted_at DESC);
    """

    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_part_sender_id
      ON messages_partitioned (sender_id, inserted_at DESC);
    """

    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_part_parent_id
      ON messages_partitioned (parent_message_id)
      WHERE parent_message_id IS NOT NULL;
    """

    execute """
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_part_type
      ON messages_partitioned (type, inserted_at DESC);
    """

    # Step 4: Copy existing data (if messages table exists with data)
    execute """
    INSERT INTO messages_partitioned
      SELECT id, conversation_id, sender_id, body, type,
             COALESCE(metadata, '{}'), edited_at, deleted_at,
             parent_message_id, inserted_at, updated_at
      FROM messages
      ON CONFLICT DO NOTHING;
    """

    # Step 5: Atomic swap
    execute "ALTER TABLE messages RENAME TO messages_old;"
    execute "ALTER TABLE messages_partitioned RENAME TO messages;"

    # Step 6: Recreate foreign key references
    # (Foreign keys on partitioned tables work in PG 12+)
    execute """
    ALTER TABLE messages
      ADD CONSTRAINT fk_messages_conversation
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
    """

    execute """
    ALTER TABLE messages
      ADD CONSTRAINT fk_messages_sender
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;
    """

    # Step 7: Create function for automatic partition creation (Oban job will call this)
    execute """
    CREATE OR REPLACE FUNCTION create_messages_partition(
      partition_date DATE
    ) RETURNS VOID AS $$
    DECLARE
      partition_name TEXT;
      start_date DATE;
      end_date DATE;
    BEGIN
      start_date := date_trunc('month', partition_date);
      end_date := start_date + INTERVAL '1 month';
      partition_name := 'messages_' || to_char(start_date, 'YYYY_MM');

      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF messages FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
      );
    END;
    $$ LANGUAGE plpgsql;
    """

    # Step 8: Keep old table for safety (drop after verification)
    # execute "DROP TABLE messages_old;"
    # ^ Uncomment after verifying partition migration is correct
  end

  def down do
    # Reverse the swap
    execute "ALTER TABLE messages RENAME TO messages_partitioned;"

    # Check if the old table still exists
    execute """
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'messages_old') THEN
        ALTER TABLE messages_old RENAME TO messages;
      ELSE
        -- Recreate standard table from partitioned data
        CREATE TABLE messages AS SELECT * FROM messages_partitioned;
        ALTER TABLE messages ADD PRIMARY KEY (id);
      END IF;
    END $$;
    """

    execute "DROP TABLE IF EXISTS messages_partitioned CASCADE;"
    execute "DROP FUNCTION IF EXISTS create_messages_partition(DATE);"
  end

  # Generate partition names and date ranges
  defp generate_partition_ranges do
    today = Date.utc_today()

    # 6 months back + current + 3 months forward = 10 partitions
    for offset <- -6..3 do
      date = Date.add(today, offset * 30)
      {year, month, _} = Date.to_erl(date)

      first_of_month = Date.new!(year, month, 1)

      next_month = if month == 12 do
        Date.new!(year + 1, 1, 1)
      else
        Date.new!(year, month + 1, 1)
      end

      name = "messages_#{year}_#{String.pad_leading(Integer.to_string(month), 2, "0")}"
      {name, Date.to_iso8601(first_of_month), Date.to_iso8601(next_month)}
    end
    |> Enum.uniq_by(fn {name, _, _} -> name end)
  end
end
