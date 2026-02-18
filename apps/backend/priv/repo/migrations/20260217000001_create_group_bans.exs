defmodule CGraph.Repo.Migrations.CreateGroupBans do
  use Ecto.Migration

  def change do
    create table(:group_bans, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :group_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false
      add :reason, :text
      add :banned_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :expires_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:group_bans, [:user_id, :group_id])
    create index(:group_bans, [:group_id])
    create index(:group_bans, [:expires_at])
  end
end
