defmodule Cgraph.Repo.Migrations.AddUserAccountStatusFields do
  @moduledoc """
  Add comprehensive user account status fields.
  
  This migration adds fields required for:
  - User active/inactive status tracking
  - Ban management with timestamps
  - Account suspension with reasons
  - Username change tracking
  """
  use Ecto.Migration

  def change do
    alter table(:users) do
      # Account status flags
      add_if_not_exists :is_active, :boolean, default: true
      add_if_not_exists :is_suspended, :boolean, default: false
      
      # Ban management
      add_if_not_exists :banned_at, :utc_datetime
      add_if_not_exists :banned_until, :utc_datetime
      add_if_not_exists :ban_reason, :text
      add_if_not_exists :banned_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      
      # Suspension (softer than ban)
      add_if_not_exists :suspended_at, :utc_datetime
      add_if_not_exists :suspended_until, :utc_datetime
      add_if_not_exists :suspension_reason, :text
      
      # Username change tracking (if not exists)
      add_if_not_exists :username_changed_at, :utc_datetime
      add_if_not_exists :previous_usernames, {:array, :string}, default: []
      
      # TOTP backup codes (hashed)
      add_if_not_exists :totp_backup_hashes, {:array, :string}, default: []
      
      # Wallet auth fields
      add_if_not_exists :crypto_alias, :string
      add_if_not_exists :pin_hash, :string
      add_if_not_exists :auth_type, :string, default: "email"
      
      # Last activity tracking
      add_if_not_exists :last_active_at, :utc_datetime
      add_if_not_exists :last_login_at, :utc_datetime
      add_if_not_exists :login_count, :integer, default: 0
    end

    # Indexes for efficient querying
    create_if_not_exists index(:users, [:is_active])
    create_if_not_exists index(:users, [:banned_at])
    create_if_not_exists index(:users, [:is_suspended])
    create_if_not_exists index(:users, [:last_active_at])
    create_if_not_exists index(:users, [:crypto_alias], unique: true, where: "crypto_alias IS NOT NULL")
  end
end
