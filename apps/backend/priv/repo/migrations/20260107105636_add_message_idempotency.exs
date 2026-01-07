defmodule Cgraph.Repo.Migrations.AddMessageIdempotency do
  @moduledoc """
  Adds idempotency support to messages to prevent duplicate message creation.
  
  When a client sends a message, it includes a unique client_message_id (UUID).
  If the same client_message_id is sent again (e.g., due to network retry),
  the server returns the existing message instead of creating a duplicate.
  
  This is essential for mobile apps where network conditions are unreliable.
  """
  use Ecto.Migration

  def change do
    alter table(:messages) do
      # Client-generated UUID for idempotency
      add :client_message_id, :string, size: 64
    end

    # Unique index on client_message_id per conversation
    # Allows the same client_message_id in different conversations
    create unique_index(:messages, [:conversation_id, :client_message_id],
      where: "client_message_id IS NOT NULL",
      name: :messages_conversation_idempotency_idx
    )

    # Also support channel messages
    create unique_index(:messages, [:channel_id, :client_message_id],
      where: "client_message_id IS NOT NULL AND channel_id IS NOT NULL",
      name: :messages_channel_idempotency_idx
    )
  end
end
