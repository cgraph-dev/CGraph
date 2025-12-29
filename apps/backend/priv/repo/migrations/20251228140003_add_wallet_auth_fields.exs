defmodule CGraph.Repo.Migrations.AddWalletAuthFields do
  use Ecto.Migration

  def change do
    # Add wallet authentication fields to users table
    # Note: wallet_address already exists from initial migration
    alter table(:users) do
      add_if_not_exists :crypto_alias, :string, size: 50
      add_if_not_exists :pin_hash, :string
      add_if_not_exists :auth_type, :string, default: "email"
    end

    create_if_not_exists unique_index(:users, [:crypto_alias])

    # Create recovery codes table
    create_if_not_exists table(:recovery_codes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :code_hash, :string, null: false
      add :used, :boolean, default: false, null: false
      add :used_at, :utc_datetime

      timestamps()
    end

    create_if_not_exists index(:recovery_codes, [:user_id])
    create_if_not_exists index(:recovery_codes, [:user_id, :used])
  end
end
