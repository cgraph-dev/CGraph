defmodule CGraph.Repo.Migrations.CreateContentReports do
  use Ecto.Migration

  def change do
    create table(:content_reports, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :reporter_id, references(:users, type: :binary_id, on_delete: :set_null)
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false

      # Polymorphic target: post, comment, or user
      add :target_type, :string, null: false
      add :target_id, :binary_id, null: false

      add :reason, :string, null: false
      add :description, :text
      add :status, :string, null: false, default: "pending"

      add :reviewed_by_id, references(:users, type: :binary_id, on_delete: :set_null)
      add :reviewed_at, :utc_datetime
      add :resolution_note, :text

      timestamps(type: :utc_datetime)
    end

    create index(:content_reports, [:forum_id, :status])
    create index(:content_reports, [:target_type, :target_id])
    create index(:content_reports, [:reporter_id])
    create index(:content_reports, [:status, :inserted_at])
  end
end
