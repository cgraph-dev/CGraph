defmodule CGraph.Repo.Migrations.AddForumRanks do
  use Ecto.Migration

  def change do
    create table(:forum_ranks, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false

      add :name, :string, null: false, size: 50
      add :min_score, :integer, null: false, default: 0
      add :max_score, :integer
      add :image_url, :string
      add :color, :string, null: false, size: 7
      add :position, :integer, null: false, default: 0
      add :is_default, :boolean, null: false, default: false

      timestamps(type: :utc_datetime)
    end

    create index(:forum_ranks, [:forum_id])
    create unique_index(:forum_ranks, [:forum_id, :position])
    create index(:forum_ranks, [:forum_id, :min_score])

    # Table for tracking daily XP from forum activity (used for daily cap)
    create table(:forum_xp_daily_totals, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :date, :date, null: false
      add :total_xp, :integer, null: false, default: 0

      timestamps(type: :utc_datetime)
    end

    create unique_index(:forum_xp_daily_totals, [:user_id, :forum_id, :date])
    create index(:forum_xp_daily_totals, [:user_id, :date])
  end
end
