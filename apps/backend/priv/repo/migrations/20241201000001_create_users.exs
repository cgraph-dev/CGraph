defmodule Cgraph.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def up do
    # Enable required extensions
    execute "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\""
    execute "CREATE EXTENSION IF NOT EXISTS citext"
    execute "CREATE EXTENSION IF NOT EXISTS pg_trgm"

    create table(:users, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("uuid_generate_v4()")
      add :username, :string, null: false
      add :display_name, :string
      add :email, :citext
      add :password_hash, :string

      # Wallet authentication
      add :wallet_address, :string
      add :wallet_nonce, :string

      # Profile
      add :avatar_url, :string
      add :banner_url, :string
      add :bio, :text
      add :status, :string, default: "online"
      add :custom_status, :string

      # Account status
      add :is_verified, :boolean, default: false
      add :is_premium, :boolean, default: false
      add :is_admin, :boolean, default: false
      add :karma, :integer, default: 0

      # 2FA
      add :totp_secret, :string
      add :totp_enabled, :boolean, default: false
      add :recovery_codes, {:array, :string}, default: []

      # Tracking
      add :last_seen_at, :utc_datetime
      add :email_verified_at, :utc_datetime
      add :deleted_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:username])
    create unique_index(:users, [:email], where: "email IS NOT NULL")
    create unique_index(:users, [:wallet_address], where: "wallet_address IS NOT NULL")
    create index(:users, [:deleted_at])
    
    # Trigram index for fuzzy search
    execute "CREATE INDEX users_username_trgm_idx ON users USING gin (username gin_trgm_ops)"
  end

  def down do
    drop table(:users)
  end
end
