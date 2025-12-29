defmodule Cgraph.Repo.Migrations.CreateWalletChallenges do
  use Ecto.Migration

  def change do
    create table(:wallet_challenges, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :wallet_address, :string, null: false
      add :nonce, :string, null: false
      add :expires_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:wallet_challenges, [:wallet_address])
  end
end
