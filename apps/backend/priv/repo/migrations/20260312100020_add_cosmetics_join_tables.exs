defmodule CGraph.Repo.Migrations.AddCosmeticsJoinTables do
  use Ecto.Migration

  def change do
    create table(:cosmetics_unlock_log, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :item_type, :string, null: false
      add :item_id, :binary_id, null: false
      add :unlocked_at, :utc_datetime_usec, null: false, default: fragment("now()")
      add :via, :string, null: false
    end

    create index(:cosmetics_unlock_log, [:user_id, :item_type])
    create unique_index(:cosmetics_unlock_log, [:user_id, :item_type, :item_id])
  end
end
