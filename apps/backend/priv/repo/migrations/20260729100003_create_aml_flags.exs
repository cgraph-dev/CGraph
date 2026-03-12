defmodule CGraph.Repo.Migrations.CreateAmlFlags do
  use Ecto.Migration

  def change do
    create table(:aml_flags, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :pattern_type, :string, null: false
      add :details, :map
      add :severity, :string, null: false
      add :status, :string, null: false, default: "open"
      add :reviewed_by, :binary_id
      add :reviewed_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:aml_flags, [:user_id, :status])
  end
end
