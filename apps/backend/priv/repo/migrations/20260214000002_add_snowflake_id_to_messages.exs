defmodule CGraph.Repo.Migrations.AddSnowflakeIdToMessages do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      # Snowflake ID for chronological ordering.
      # Nullable to preserve existing messages — backfill via batch job.
      # New messages automatically get a Snowflake ID from the generator.
      add :snowflake_id, :bigint
    end

    # Index for future cursor-based pagination optimization: WHERE snowflake_id > ?
    # Currently cursor pagination uses inserted_at; these indexes prepare for migration
    create index(:messages, [:snowflake_id],
      where: "snowflake_id IS NOT NULL",
      name: :messages_snowflake_id_idx)

    # Conversation messages ordered by Snowflake (replaces conversation_id + inserted_at)
    create index(:messages, [:conversation_id, :snowflake_id],
      where: "snowflake_id IS NOT NULL",
      name: :messages_conversation_snowflake_idx)

    # Channel messages ordered by Snowflake
    create index(:messages, [:channel_id, :snowflake_id],
      where: "snowflake_id IS NOT NULL",
      name: :messages_channel_snowflake_idx)
  end
end
