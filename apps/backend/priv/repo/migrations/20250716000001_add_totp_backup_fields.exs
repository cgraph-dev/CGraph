defmodule Cgraph.Repo.Migrations.AddTotpBackupFields do
  @moduledoc """
  Add TOTP backup codes and enabled_at fields for 2FA support.
  """
  use Ecto.Migration

  def change do
    alter table(:users) do
      add_if_not_exists :totp_enabled_at, :utc_datetime
      add_if_not_exists :totp_backup_codes, {:array, :string}, default: []
    end
    
    # Add index for finding users with 2FA enabled
    create_if_not_exists index(:users, [:totp_enabled])
  end
end
