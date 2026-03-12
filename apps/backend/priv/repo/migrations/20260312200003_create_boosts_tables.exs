defmodule CGraph.Repo.Migrations.CreateBoostsTables do
  use Ecto.Migration

  def change do
    create table(:boosts, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :target_type, :string, null: false
      add :target_id, :binary_id, null: false
      add :boost_type, :string, null: false
      add :duration_hours, :integer, null: false
      add :nodes_spent, :integer, null: false
      add :started_at, :utc_datetime, null: false
      add :expires_at, :utc_datetime, null: false
      add :status, :string, null: false, default: "active"

      timestamps(type: :utc_datetime)
    end

    create index(:boosts, [:user_id])
    create index(:boosts, [:target_type, :target_id])
    create index(:boosts, [:status])
    create index(:boosts, [:expires_at])

    create table(:boost_effects, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :boost_id, references(:boosts, type: :binary_id, on_delete: :delete_all), null: false
      add :effect_type, :string, null: false
      add :magnitude, :decimal, null: false
      add :applied_at, :utc_datetime, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:boost_effects, [:boost_id])
  end
end
