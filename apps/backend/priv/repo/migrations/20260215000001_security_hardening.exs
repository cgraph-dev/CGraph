defmodule CGraph.Repo.Migrations.SecurityHardening do
  use Ecto.Migration

  def up do
    # 1. Remove plaintext recovery_codes from users table.
    # Recovery codes are now stored as hashed values in the recovery_codes table
    # (see CGraph.Accounts.RecoveryCode schema).
    alter table(:users) do
      remove_if_exists :recovery_codes, {:array, :string}
    end

    # 2. Change default for is_encrypted on messages to true.
    # All new messages should be encrypted by default.
    alter table(:messages) do
      modify :is_encrypted, :boolean, default: true
    end
  end

  def down do
    alter table(:users) do
      add :recovery_codes, {:array, :string}, default: []
    end

    alter table(:messages) do
      modify :is_encrypted, :boolean, default: false
    end
  end
end
