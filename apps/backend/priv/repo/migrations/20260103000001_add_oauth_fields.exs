defmodule Cgraph.Repo.Migrations.AddOAuthFields do
  @moduledoc """
  Add OAuth authentication fields to users table.
  
  Supports Google, Apple, Facebook, and TikTok OAuth providers.
  """
  use Ecto.Migration

  def change do
    alter table(:users) do
      # Primary OAuth provider (google, apple, facebook, tiktok)
      add_if_not_exists :oauth_provider, :string
      
      # User ID from the primary OAuth provider
      add_if_not_exists :oauth_uid, :string
      
      # JSON map of all linked OAuth accounts with metadata
      # Example: {"google": {"uid": "...", "linked_at": "...", "name": "..."}}
      add_if_not_exists :oauth_data, :map, default: %{}
    end

    # Index for OAuth lookups
    create_if_not_exists index(:users, [:oauth_provider, :oauth_uid])
    
    # Index for finding users by OAuth provider
    create_if_not_exists index(:users, [:oauth_provider])
  end
end
