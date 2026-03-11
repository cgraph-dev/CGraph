defmodule CGraph.Repo.Migrations.CreateUserInventory do
  use Ecto.Migration

  def change do
    create table(:user_inventory, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :item_type, :string, null: false
      add :item_id, :binary_id, null: false
      add :equipped_at, :utc_datetime_usec
      add :obtained_at, :utc_datetime_usec, null: false
      add :obtained_via, :string, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:user_inventory, [:user_id, :item_type, :item_id])
    create index(:user_inventory, [:user_id])
    create index(:user_inventory, [:item_type])
    create index(:user_inventory, [:user_id, :item_type])
  end
end
