defmodule Cgraph.Repo.Migrations.AddLeftAtToConversationParticipants do
  @moduledoc """
  Add left_at timestamp to conversation_participants table.
  
  This field tracks when a user left a conversation, allowing them to
  rejoin later while preserving conversation history. When left_at is NULL,
  the user is an active participant.
  """
  use Ecto.Migration

  def change do
    alter table(:conversation_participants) do
      add :left_at, :utc_datetime, null: true
    end

    # Index for efficient queries filtering by active participants
    create index(:conversation_participants, [:conversation_id, :left_at])
  end
end
