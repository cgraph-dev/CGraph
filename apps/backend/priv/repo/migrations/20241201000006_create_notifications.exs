defmodule Cgraph.Repo.Migrations.CreateNotificationsAndPushTokens do
  use Ecto.Migration

  def up do
    # Push tokens
    create table(:push_tokens, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :token, :string, null: false
      add :platform, :string, null: false
      add :device_id, :string
      add :is_active, :boolean, default: true
      add :last_used_at, :utc_datetime

      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:push_tokens, [:user_id, :token])
    create index(:push_tokens, [:user_id])

    # Notifications
    create table(:notifications, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :type, :string, null: false
      add :title, :string
      add :body, :text
      add :data, :map
      add :is_read, :boolean, default: false
      add :read_at, :utc_datetime

      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :actor_id, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:notifications, [:user_id, :inserted_at])
    create index(:notifications, [:user_id, :is_read])
  end

  def down do
    drop table(:notifications)
    drop table(:push_tokens)
  end
end
