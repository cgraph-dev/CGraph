defmodule CGraph.Repo.Migrations.AddEphemeralMessageSupport do
  @moduledoc """
  Add expires_at to messages and message_ttl to conversations
  for ephemeral/disappearing message support.
  """
  use Ecto.Migration

  def change do
    # Add expires_at to messages for per-message expiry
    alter table(:messages) do
      add_if_not_exists :expires_at, :utc_datetime_usec
    end

    # Partial index for efficient cleanup of expired messages
    create_if_not_exists index(:messages, [:expires_at],
      where: "expires_at IS NOT NULL",
      name: :messages_expires_at_partial_idx
    )

    # Add message_ttl to conversations for conversation-level auto-expiry
    alter table(:conversations) do
      add_if_not_exists :message_ttl, :integer  # seconds, null = no auto-delete
    end
  end
end
