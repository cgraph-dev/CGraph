defmodule Cgraph.Repo.Migrations.ConvertUserIdToRandomUid do
  @moduledoc """
  Converts sequential user_id (integer) to random 10-digit UID (string).
  
  Security improvements:
  - Prevents user enumeration attacks
  - Hides total user count from competitors
  - Makes it harder to iterate through all users
  - Doesn't expose account creation order
  
  Format: 10 random digits (e.g., "4829173650")
  Display: #4829173650
  """
  use Ecto.Migration

  def up do
    # Step 1: Add new uid column as string
    alter table(:users) do
      add :uid, :string, size: 10
    end

    # Step 2: Generate random 10-digit UIDs for existing users
    # Using a PL/pgSQL function to ensure uniqueness
    execute """
    CREATE OR REPLACE FUNCTION generate_random_uid() RETURNS TEXT AS $$
    DECLARE
      new_uid TEXT;
      done BOOL;
    BEGIN
      done := FALSE;
      WHILE NOT done LOOP
        -- Generate 10 random digits (first digit 1-9 to avoid leading zeros)
        new_uid := (1 + floor(random() * 9))::TEXT || 
                   lpad(floor(random() * 1000000000)::TEXT, 9, '0');
        -- Check if unique
        done := NOT EXISTS (SELECT 1 FROM users WHERE uid = new_uid);
      END LOOP;
      RETURN new_uid;
    END;
    $$ LANGUAGE plpgsql;
    """

    # Step 3: Populate existing users with random UIDs
    execute """
    UPDATE users 
    SET uid = generate_random_uid()
    WHERE uid IS NULL
    """

    # Step 4: Make uid NOT NULL and unique
    execute "ALTER TABLE users ALTER COLUMN uid SET NOT NULL"
    create unique_index(:users, [:uid])

    # Step 5: Create trigger for new users
    execute """
    CREATE OR REPLACE FUNCTION set_user_uid() RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.uid IS NULL THEN
        NEW.uid := generate_random_uid();
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """

    execute """
    CREATE TRIGGER users_set_uid_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_user_uid();
    """

    # Note: We keep the old user_id column for backward compatibility
    # but uid is now the public-facing identifier
  end

  def down do
    # Remove trigger
    execute "DROP TRIGGER IF EXISTS users_set_uid_trigger ON users"
    execute "DROP FUNCTION IF EXISTS set_user_uid()"
    execute "DROP FUNCTION IF EXISTS generate_random_uid()"

    # Remove uid column
    drop_if_exists index(:users, [:uid])
    
    alter table(:users) do
      remove :uid
    end
  end
end
