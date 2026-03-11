defmodule CGraph.Repo.Migrations.CreateNameplateSettings do
  use Ecto.Migration

  def change do
    create table(:nameplate_settings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :nameplate_id, :binary_id, null: false
      add :custom_text_color, :string
      add :custom_border_color, :string
      add :layout, :string, default: "default"

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:nameplate_settings, [:user_id, :nameplate_id])
    create index(:nameplate_settings, [:user_id])
  end
end
