defmodule Cgraph.Repo.Migrations.AddAcceptedAtToFriendships do
  @moduledoc """
  Adds accepted_at timestamp to friendships table.
  
  This field tracks when a friendship was accepted, enabling:
  - Sorting friends by how recently they connected
  - Analytics on friendship acceptance times
  - Distinguishing old friends from new connections
  """
  use Ecto.Migration

  def change do
    alter table(:friendships) do
      add :accepted_at, :utc_datetime, comment: "When the friendship was accepted"
    end
    
    # Index for ordering friends by acceptance date
    create index(:friendships, [:user_id, :accepted_at])
  end
end
