defmodule Cgraph.Repo.Migrations.CreateConversationsAndMessages do
  use Ecto.Migration

  def up do
    # Conversations (1:1 DMs)
    create table(:conversations, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :user_one_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :user_two_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :last_message_at, :utc_datetime
      add :is_encrypted, :boolean, default: true

      timestamps(type: :utc_datetime)
    end

    create unique_index(:conversations, [:user_one_id, :user_two_id])
    create index(:conversations, [:user_two_id])
    create index(:conversations, [:last_message_at])

    # Conversation participants (for per-user settings)
    create table(:conversation_participants, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :conversation_id, references(:conversations, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :unread_count, :integer, default: 0
      add :last_read_at, :utc_datetime
      add :is_muted, :boolean, default: false
      add :muted_until, :utc_datetime
      add :is_archived, :boolean, default: false
      add :is_pinned, :boolean, default: false
      add :nickname, :string
      add :public_key, :text
      add :encrypted_private_key, :text

      timestamps(type: :utc_datetime)
    end

    create unique_index(:conversation_participants, [:conversation_id, :user_id])
    create index(:conversation_participants, [:user_id])

    # Messages
    create table(:messages, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :content, :text, null: false
      add :content_type, :string, default: "text"
      add :is_encrypted, :boolean, default: false
      add :is_edited, :boolean, default: false
      add :edit_count, :integer, default: 0
      add :deleted_at, :utc_datetime
      add :deleted_for_everyone, :boolean, default: false

      # File attachments
      add :file_url, :string
      add :file_name, :string
      add :file_size, :bigint
      add :file_mime_type, :string
      add :thumbnail_url, :string

      # Link preview
      add :link_preview, :map

      # References
      add :sender_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :conversation_id, references(:conversations, type: :binary_id, on_delete: :delete_all)
      add :reply_to_id, references(:messages, type: :binary_id, on_delete: :nilify_all)
      # channel_id will be added in groups migration

      timestamps(type: :utc_datetime)
    end

    create index(:messages, [:conversation_id, :inserted_at])
    create index(:messages, [:sender_id])
    create index(:messages, [:reply_to_id])
    create index(:messages, [:deleted_at])

    # Reactions
    create table(:reactions, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :emoji, :string, null: false
      add :message_id, references(:messages, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create unique_index(:reactions, [:message_id, :user_id, :emoji])
    create index(:reactions, [:message_id])

    # Read receipts
    create table(:read_receipts, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :read_at, :utc_datetime, null: false
      add :message_id, references(:messages, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create unique_index(:read_receipts, [:message_id, :user_id])

    # Message edits (history)
    create table(:message_edits, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :previous_content, :text, null: false
      add :edit_number, :integer, null: false
      add :message_id, references(:messages, type: :binary_id, on_delete: :delete_all), null: false
      add :edited_by_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:message_edits, [:message_id])
  end

  def down do
    drop table(:message_edits)
    drop table(:read_receipts)
    drop table(:reactions)
    drop table(:messages)
    drop table(:conversation_participants)
    drop table(:conversations)
  end
end
