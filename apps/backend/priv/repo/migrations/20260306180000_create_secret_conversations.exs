defmodule CGraph.Repo.Migrations.CreateSecretConversations do
  @moduledoc """
  Creates secret chat tables: secret_conversations, secret_messages.

  Secret chats are Telegram-style device-bound encrypted conversations.
  The server only stores opaque ciphertext — no plaintext ever touches the DB.
  """
  use Ecto.Migration

  def change do
    create table(:secret_conversations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :initiator_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :recipient_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :status, :string, null: false, default: "active"
      add :self_destruct_seconds, :integer
      add :initiator_device_id, :string
      add :recipient_device_id, :string
      add :initiator_fingerprint, :string
      add :recipient_fingerprint, :string
      add :terminated_at, :utc_datetime_usec
      add :terminated_by, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps()
    end

    # Only one active secret chat per pair (either direction)
    create unique_index(:secret_conversations, [:initiator_id, :recipient_id],
      where: "status = 'active'",
      name: :secret_conversations_active_pair_index
    )

    create index(:secret_conversations, [:initiator_id])
    create index(:secret_conversations, [:recipient_id])
    create index(:secret_conversations, [:status])

    create table(:secret_messages, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :secret_conversation_id,
        references(:secret_conversations, type: :binary_id, on_delete: :delete_all),
        null: false
      add :sender_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :ciphertext, :binary, null: false
      add :content_type, :string, null: false, default: "text"
      add :nonce, :binary
      add :ratchet_header, :binary
      add :expires_at, :utc_datetime_usec
      add :read_at, :utc_datetime_usec
      add :file_metadata, :map

      timestamps(updated_at: false)
    end

    create index(:secret_messages, [:secret_conversation_id, :inserted_at])
    create index(:secret_messages, [:expires_at],
      where: "expires_at IS NOT NULL",
      name: :secret_messages_expiry_index
    )
  end
end
