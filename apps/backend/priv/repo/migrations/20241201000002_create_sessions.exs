defmodule Cgraph.Repo.Migrations.CreateSessions do
  use Ecto.Migration

  def up do
    create table(:sessions, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :token_hash, :string, null: false
      add :device_name, :string
      add :device_type, :string
      add :ip_address, :string
      add :user_agent, :text
      add :location, :string
      add :last_active_at, :utc_datetime
      add :expires_at, :utc_datetime, null: false
      add :revoked_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:sessions, [:user_id])
    create index(:sessions, [:token_hash])
    create index(:sessions, [:expires_at])
  end

  def down do
    drop table(:sessions)
  end
end
