defmodule CGraph.Repo.Migrations.CreateSearchHistory do
  use Ecto.Migration

  def change do
    create table(:search_history, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :query, :string, null: false
      add :result_count, :integer, default: 0

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:search_history, [:user_id, :inserted_at])
    create unique_index(:search_history, [:user_id, :query])
  end
end
