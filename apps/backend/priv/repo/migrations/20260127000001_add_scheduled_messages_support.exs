defmodule CGraph.Repo.Migrations.AddScheduledMessagesSupport do
  @moduledoc """
  Adds message scheduling support with scheduled_at timestamp and status field.

  Enables users to schedule messages for future delivery with timezone-aware
  scheduling, cancellation, and rescheduling capabilities.

  ## Changes
  - Add scheduled_at field to messages table (nullable timestamp)
  - Add schedule_status field ('immediate', 'scheduled', 'sent', 'cancelled')
  - Add index on scheduled_at for efficient worker queries
  - Add index on schedule_status for status filtering

  ## Performance
  - Partial index on scheduled_at WHERE schedule_status = 'scheduled'
  - Allows worker to efficiently query pending scheduled messages
  """
  use Ecto.Migration

  def up do
    # Add scheduled_at field to messages table
    alter table(:messages) do
      add :scheduled_at, :utc_datetime_usec,
        comment: "When this message should be sent (NULL = send immediately)"

      add :schedule_status, :string,
        default: "immediate",
        null: false,
        comment: "Status: immediate, scheduled, sent, cancelled"
    end

    # Partial index for efficient worker queries - only index scheduled messages
    create index(:messages, [:scheduled_at],
             where: "schedule_status = 'scheduled' AND scheduled_at IS NOT NULL",
             name: :messages_scheduled_pending_idx
           )

    # Index for status filtering
    create index(:messages, [:schedule_status])

    # Composite index for conversation + scheduled status
    create index(:messages, [:conversation_id, :schedule_status])
  end

  def down do
    drop_if_exists index(:messages, [:conversation_id, :schedule_status])
    drop_if_exists index(:messages, [:schedule_status])
    drop_if_exists index(:messages, [:scheduled_at], name: :messages_scheduled_pending_idx)

    alter table(:messages) do
      remove :scheduled_at
      remove :schedule_status
    end
  end
end
