defmodule CGraph.Repo.Migrations.CreateNotificationPreferences do
  use Ecto.Migration

  def change do
    create table(:notification_preferences, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :target_type, :string, null: false
      add :target_id, :binary_id, null: false
      add :mode, :string, null: false, default: "all"
      add :muted_until, :utc_datetime

      timestamps()
    end

    create unique_index(:notification_preferences, [:user_id, :target_type, :target_id])
    create index(:notification_preferences, [:user_id])
    create index(:notification_preferences, [:target_type, :target_id])
  end
end
