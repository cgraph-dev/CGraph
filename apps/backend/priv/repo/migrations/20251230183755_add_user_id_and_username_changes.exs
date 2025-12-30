defmodule Cgraph.Repo.Migrations.AddUserIdAndUsernameChanges do
  @moduledoc """
  Adds unique numeric user_id for display purposes and username change tracking.
  
  - user_id: Unique sequential number displayed as #0001
  - username_changed_at: Tracks when username was last changed (14-day cooldown)
  - Makes username optional (NULL allowed) for new registrations
  """
  use Ecto.Migration

  def up do
    # Add sequence for generating unique user IDs
    execute "CREATE SEQUENCE IF NOT EXISTS user_id_seq START WITH 1 INCREMENT BY 1"

    alter table(:users) do
      # Unique numeric ID displayed as #0001, #0002, etc.
      add :user_id, :integer
      # Track when username was last changed for cooldown
      add :username_changed_at, :utc_datetime
    end

    # Populate existing users with sequential user_ids
    execute """
    UPDATE users 
    SET user_id = nextval('user_id_seq')
    WHERE user_id IS NULL
    """

    # Make user_id NOT NULL and unique after populating
    execute "ALTER TABLE users ALTER COLUMN user_id SET DEFAULT nextval('user_id_seq')"
    execute "ALTER TABLE users ALTER COLUMN user_id SET NOT NULL"
    
    create unique_index(:users, [:user_id])

    # Make username nullable (optional)
    execute "ALTER TABLE users ALTER COLUMN username DROP NOT NULL"
    
    # Drop the old unique constraint on username and recreate allowing nulls
    execute "DROP INDEX IF EXISTS users_username_index"
    create unique_index(:users, [:username], where: "username IS NOT NULL")
  end

  def down do
    # Restore username NOT NULL constraint
    execute "UPDATE users SET username = CONCAT('user_', user_id) WHERE username IS NULL"
    execute "ALTER TABLE users ALTER COLUMN username SET NOT NULL"
    
    drop index(:users, [:username])
    create unique_index(:users, [:username])
    
    alter table(:users) do
      remove :user_id
      remove :username_changed_at
    end

    execute "DROP SEQUENCE IF EXISTS user_id_seq"
  end
end
