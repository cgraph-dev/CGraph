defmodule CGraph.Repo.Migrations.CreateForumThreadTemplates do
  use Ecto.Migration

  def change do
    create table(:forum_thread_templates, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :structure, :map, default: %{}, null: false
      add :is_default, :boolean, default: false, null: false
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:forum_thread_templates, [:forum_id])
    create unique_index(:forum_thread_templates, [:forum_id, :name])
  end
end
