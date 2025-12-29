defmodule Cgraph.Repo.Migrations.FixForumModeratorsPermissions do
  @moduledoc """
  Fixes the permissions column in forum_moderators table.
  
  The original migration created permissions as :bigint (for bitmask storage),
  but the Moderator schema defines it as {:array, :string}.
  
  This migration:
  1. Removes the old bigint permissions column
  2. Adds a new text[] permissions column matching the schema definition
  3. Removes the is_full_mod column that was related to the bitmask approach
  
  NOTE: This is a breaking change if permissions data exists.
  Since this is a dev fix, we're dropping and recreating.
  """
  use Ecto.Migration

  def up do
    # Drop the old integer column
    alter table(:forum_moderators) do
      remove :permissions, :bigint
      remove_if_exists :is_full_mod, :boolean
    end
    
    # Add the new array column matching the schema
    alter table(:forum_moderators) do
      add :permissions, {:array, :string}, default: []
      add :added_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :notes, :string
    end
  end

  def down do
    alter table(:forum_moderators) do
      remove :permissions
      remove_if_exists :added_by_id
      remove_if_exists :notes
    end
    
    alter table(:forum_moderators) do
      add :permissions, :bigint, default: 0
      add :is_full_mod, :boolean, default: false
    end
  end
end
