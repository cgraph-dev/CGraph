defmodule CGraph.Repo.Migrations.CreateForumScheduledPosts do
  use Ecto.Migration

  def change do
    create table(:forum_scheduled_posts, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :author_id, :binary_id, null: false
      add :forum_id, :binary_id, null: false
      add :content, :text, null: false
      add :scheduled_for, :utc_datetime, null: false
      add :status, :string, null: false, default: "pending"
      add :published_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create index(:forum_scheduled_posts, [:author_id])
    create index(:forum_scheduled_posts, [:forum_id])
    create index(:forum_scheduled_posts, [:status, :scheduled_for])
  end
end
