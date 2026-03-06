defmodule CGraph.Repo.Migrations.CreateCompetitiveFeatures do
  use Ecto.Migration

  def change do
    # Scheduled messages
    create table(:scheduled_messages, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :sender_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :conversation_id, references(:conversations, type: :binary_id, on_delete: :delete_all), null: false
      add :content, :text, null: false
      add :content_type, :string, default: "text"
      add :is_encrypted, :boolean, default: false
      add :scheduled_at, :utc_datetime, null: false
      add :status, :string, default: "pending"
      add :sent_at, :utc_datetime
      add :cancelled_at, :utc_datetime

      timestamps(type: :utc_datetime_usec)
    end

    create index(:scheduled_messages, [:scheduled_at],
      where: "status = 'pending'",
      name: :idx_scheduled_messages_fire)
    create index(:scheduled_messages, [:sender_id, :conversation_id])

    # Chat polls (separate from forum polls which use `polls` table)
    create table(:chat_polls, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :conversation_id, references(:conversations, type: :binary_id, on_delete: :delete_all), null: false
      add :creator_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :question, :text, null: false
      add :options, :map, null: false
      add :multiple_choice, :boolean, default: false
      add :anonymous, :boolean, default: false
      add :closes_at, :utc_datetime
      add :closed, :boolean, default: false

      timestamps(type: :utc_datetime_usec)
    end

    create index(:chat_polls, [:conversation_id])

    # Chat poll votes
    create table(:chat_poll_votes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :poll_id, references(:chat_polls, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :option_id, :string, null: false

      timestamps(type: :utc_datetime_usec, updated_at: false)
    end

    create unique_index(:chat_poll_votes, [:poll_id, :user_id, :option_id])
    create index(:chat_poll_votes, [:poll_id])

    # Chat themes
    create table(:chat_themes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :conversation_id, references(:conversations, type: :binary_id, on_delete: :delete_all), null: false
      add :theme, :map, null: false, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:chat_themes, [:user_id, :conversation_id])
  end
end
