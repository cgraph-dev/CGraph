defmodule CGraph.Repo.Migrations.CreateGroupEmojis do
  use Ecto.Migration

  def change do
    create table(:group_emojis, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :image_url, :string, null: false
      add :animated, :boolean, default: false, null: false
      add :group_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false
      add :uploaded_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime_usec)
    end

    create index(:group_emojis, [:group_id])
    create unique_index(:group_emojis, [:group_id, :name])
  end
end
