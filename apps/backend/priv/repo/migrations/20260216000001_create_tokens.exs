defmodule Cgraph.Repo.Migrations.CreateTokens do
  use Ecto.Migration

  def up do
    create table(:tokens, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :token, :binary, null: false
      add :type, :string, null: false
      add :expires_at, :utc_datetime
      add :used_at, :utc_datetime
      add :revoked_at, :utc_datetime
      add :metadata, :map, default: %{}
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:tokens, [:user_id])
    create index(:tokens, [:token])
    create index(:tokens, [:type])
    create index(:tokens, [:expires_at])
    create unique_index(:tokens, [:token, :type])
  end

  def down do
    drop table(:tokens)
  end
end
