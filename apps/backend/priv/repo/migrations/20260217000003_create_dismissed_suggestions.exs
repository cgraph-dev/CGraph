defmodule CGraph.Repo.Migrations.CreateDismissedSuggestions do
  use Ecto.Migration

  def change do
    create table(:dismissed_suggestions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :suggested_user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create unique_index(:dismissed_suggestions, [:user_id, :suggested_user_id])
    create index(:dismissed_suggestions, [:user_id])
  end
end
