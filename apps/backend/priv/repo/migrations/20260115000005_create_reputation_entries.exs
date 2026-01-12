defmodule Cgraph.Repo.Migrations.CreateReputationEntries do
  @moduledoc """
  Ensures reputation_entries table exists with proper indexes.
  The table may already exist with columns: from_user_id, to_user_id, value, post_id, comment.
  """
  use Ecto.Migration

  def change do
    # Table already exists in the database with columns:
    # id, from_user_id, to_user_id, post_id, forum_id, value, comment, inserted_at, updated_at
    # We'll just ensure indexes exist
    
    create_if_not_exists index(:reputation_entries, [:from_user_id])
    create_if_not_exists index(:reputation_entries, [:to_user_id])
    create_if_not_exists index(:reputation_entries, [:post_id])
    create_if_not_exists index(:reputation_entries, [:inserted_at])

    # Add reputation column to users if not exists
    alter table(:users) do
      add_if_not_exists :reputation, :integer, default: 0
    end

    create_if_not_exists index(:users, [:reputation])
  end
end
