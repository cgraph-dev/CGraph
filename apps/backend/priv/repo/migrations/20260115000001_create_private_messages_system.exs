defmodule Cgraph.Repo.Migrations.CreatePrivateMessagesSystem do
  @moduledoc """
  Creates tables for the MyBB-style Private Messaging system.
  
  Tables created:
  - pm_folders: User PM folders (Inbox, Sent, Drafts, Trash + custom)
  - private_messages: The actual private messages
  - pm_drafts: Message drafts
  """
  use Ecto.Migration

  def change do
    # PM Folders
    create table(:pm_folders, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :name, :string, null: false
      add :color, :string, default: "#6366f1"
      add :icon, :string
      add :is_system, :boolean, default: false
      add :order, :integer, default: 0

      timestamps(type: :utc_datetime)
    end

    create index(:pm_folders, [:user_id])
    create unique_index(:pm_folders, [:user_id, :name])

    # Private Messages
    create table(:private_messages, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :sender_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :recipient_id, references(:users, type: :binary_id, on_delete: :nilify_all), null: false
      add :folder_id, references(:pm_folders, type: :binary_id, on_delete: :nilify_all)
      add :subject, :string
      add :content, :text, null: false
      add :is_read, :boolean, default: false
      add :read_at, :utc_datetime
      add :is_starred, :boolean, default: false
      add :is_important, :boolean, default: false
      add :reply_to_id, :binary_id

      timestamps(type: :utc_datetime)
    end

    create index(:private_messages, [:sender_id])
    create index(:private_messages, [:recipient_id])
    create index(:private_messages, [:folder_id])
    create index(:private_messages, [:recipient_id, :is_read])
    create index(:private_messages, [:inserted_at])

    # PM Drafts
    create table(:pm_drafts, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :sender_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :recipient_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :subject, :string
      add :content, :text, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:pm_drafts, [:sender_id])
  end
end
