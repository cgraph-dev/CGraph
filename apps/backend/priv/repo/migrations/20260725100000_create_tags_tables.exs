defmodule CGraph.Repo.Migrations.CreateTagsTables do
  use Ecto.Migration

  def change do
    create table(:forum_tag_categories, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :color, :string
      add :icon, :string
      add :max_per_thread, :integer, default: 3
      add :required, :boolean, default: false
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:forum_tag_categories, [:forum_id, :name])
    create index(:forum_tag_categories, [:forum_id])

    create table(:forum_thread_tags, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :tag_name, :string, null: false
      add :applied_at, :utc_datetime
      add :applied_by, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :thread_id, references(:threads, type: :binary_id, on_delete: :delete_all), null: false
      add :tag_category_id, references(:forum_tag_categories, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:forum_thread_tags, [:thread_id, :tag_name])
    create index(:forum_thread_tags, [:thread_id])
    create index(:forum_thread_tags, [:tag_category_id])
  end
end
