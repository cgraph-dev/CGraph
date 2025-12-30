defmodule Cgraph.Repo.Migrations.AddForumVoting do
  @moduledoc """
  Add forum-level voting for Reddit-style competition.
  
  Forums can now be upvoted/downvoted to compete for popularity.
  Adds score, upvotes, downvotes, and hot_score fields.
  Creates forum_votes join table for user votes.
  """
  use Ecto.Migration

  def up do
    # Add voting fields to forums
    alter table(:forums) do
      add :score, :integer, default: 0
      add :upvotes, :integer, default: 0
      add :downvotes, :integer, default: 0
      add :hot_score, :float, default: 0.0
      add :weekly_score, :integer, default: 0  # For weekly leaderboards
      add :featured, :boolean, default: false  # Featured forums
    end

    # Create forum votes table
    create table(:forum_votes, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :value, :integer, null: false  # 1 or -1
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime_usec)
    end

    # Each user can only vote once per forum
    create unique_index(:forum_votes, [:user_id, :forum_id], name: :forum_votes_user_forum_unique)
    create index(:forum_votes, [:forum_id])
    create index(:forum_votes, [:user_id])

    # Index for leaderboard queries
    create index(:forums, [:score], where: "deleted_at IS NULL")
    create index(:forums, [:hot_score], where: "deleted_at IS NULL")
    create index(:forums, [:weekly_score], where: "deleted_at IS NULL")
    create index(:forums, [:featured, :hot_score], where: "deleted_at IS NULL")
  end

  def down do
    drop_if_exists index(:forums, [:featured, :hot_score])
    drop_if_exists index(:forums, [:weekly_score])
    drop_if_exists index(:forums, [:hot_score])
    drop_if_exists index(:forums, [:score])
    drop_if_exists table(:forum_votes)

    alter table(:forums) do
      remove :score
      remove :upvotes
      remove :downvotes
      remove :hot_score
      remove :weekly_score
      remove :featured
    end
  end
end
