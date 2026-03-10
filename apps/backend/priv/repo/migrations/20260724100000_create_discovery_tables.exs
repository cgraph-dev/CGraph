defmodule CGraph.Repo.Migrations.CreateDiscoveryTables do
  use Ecto.Migration

  def change do
    # Topics table
    create table(:topics, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, size: 100, null: false
      add :icon, :string, size: 10, null: false
      add :slug, :string, size: 100, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:topics, [:name])
    create unique_index(:topics, [:slug])

    # User frequencies — composite PK
    create table(:user_frequencies, primary_key: false) do
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false,
        primary_key: true
      add :topic_id, references(:topics, type: :binary_id, on_delete: :delete_all), null: false,
        primary_key: true
      add :weight, :integer, default: 50, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:user_frequencies, [:user_id])

    # Post metrics
    create table(:post_metrics, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :thread_id, references(:threads, type: :binary_id, on_delete: :delete_all), null: false
      add :weighted_resonates, :decimal, precision: 10, scale: 2, default: 0
      add :reply_depth_avg, :decimal, precision: 5, scale: 2, default: 0
      add :read_time_signal, :decimal, precision: 5, scale: 2, default: 0
      add :cross_community_refs, :integer, default: 0

      timestamps(type: :utc_datetime)
    end

    create unique_index(:post_metrics, [:thread_id])

    # Seed initial 12 topics
    flush()

    now = DateTime.utc_now() |> DateTime.truncate(:second) |> DateTime.to_naive()

    topics = [
      %{name: "Photography", icon: "📸", slug: "photography"},
      %{name: "Gaming", icon: "🎮", slug: "gaming"},
      %{name: "Finance", icon: "📈", slug: "finance"},
      %{name: "Design", icon: "🎨", slug: "design"},
      %{name: "Science", icon: "🔬", slug: "science"},
      %{name: "Film", icon: "🎬", slug: "film"},
      %{name: "Tech", icon: "💻", slug: "tech"},
      %{name: "Music", icon: "🎵", slug: "music"},
      %{name: "Travel", icon: "🌍", slug: "travel"},
      %{name: "Fitness", icon: "🏋️", slug: "fitness"},
      %{name: "Books", icon: "📚", slug: "books"},
      %{name: "Food", icon: "🍕", slug: "food"}
    ]

    for topic <- topics do
      execute """
      INSERT INTO topics (id, name, icon, slug, inserted_at, updated_at)
      VALUES (gen_random_uuid(), '#{topic.name}', '#{topic.icon}', '#{topic.slug}', '#{now}', '#{now}')
      """
    end
  end
end
