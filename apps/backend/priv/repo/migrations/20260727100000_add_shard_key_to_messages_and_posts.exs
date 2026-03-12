defmodule CGraph.Repo.Migrations.AddShardKeyToMessagesAndPosts do
  @moduledoc """
  Add shard_key column to messages and posts tables for horizontal sharding.

  The shard_key is an integer computed as:
    abs(hashtext(partition_column::text)) % shard_count

  For messages:  partition_column = conversation_id, shard_count = 16
  For posts:     partition_column = forum_id,        shard_count = 8

  A hash index on shard_key enables fast shard-local queries.
  """
  use Ecto.Migration

  @disable_ddl_transaction false

  def up do
    # ── Messages table: shard_key for 16-shard distribution ──
    alter table(:messages) do
      add :shard_key, :integer
    end

    # Hash index for fast shard routing lookups
    create index(:messages, [:shard_key], using: "hash", comment: "Shard routing index (16 shards by conversation_id)")

    # Composite index for shard-scoped queries
    create index(:messages, [:shard_key, :conversation_id, :inserted_at],
      comment: "Shard-scoped conversation message ordering"
    )

    # Backfill existing rows: shard_key = abs(hashtext(conversation_id::text)) % 16
    execute """
    UPDATE messages
    SET shard_key = abs(hashtext(conversation_id::text)) % 16
    WHERE conversation_id IS NOT NULL AND shard_key IS NULL
    """

    # ── Posts table: shard_key for 8-shard distribution ──
    alter table(:posts) do
      add :shard_key, :integer
    end

    # Hash index for fast shard routing lookups
    create index(:posts, [:shard_key], using: "hash", comment: "Shard routing index (8 shards by forum_id)")

    # Composite index for shard-scoped queries
    create index(:posts, [:shard_key, :forum_id, :inserted_at],
      comment: "Shard-scoped forum post ordering"
    )

    # Backfill existing rows: shard_key = abs(hashtext(forum_id::text)) % 8
    execute """
    UPDATE posts
    SET shard_key = abs(hashtext(forum_id::text)) % 8
    WHERE forum_id IS NOT NULL AND shard_key IS NULL
    """
  end

  def down do
    # Remove indexes first
    drop_if_exists index(:messages, [:shard_key, :conversation_id, :inserted_at])
    drop_if_exists index(:messages, [:shard_key])

    alter table(:messages) do
      remove :shard_key
    end

    drop_if_exists index(:posts, [:shard_key, :forum_id, :inserted_at])
    drop_if_exists index(:posts, [:shard_key])

    alter table(:posts) do
      remove :shard_key
    end
  end
end
