defmodule CGraph.Repo.Migrations.CreateE2eeKyberPrekeys do
  use Ecto.Migration

  @moduledoc """
  Creates the e2ee_kyber_prekeys table for ML-KEM-768 post-quantum key storage.

  Stores the KEM public key, ECDSA signature, and key ID for each user's
  Kyber prekey. Secret keys are stored only on the client device.

  ## Key Sizes
  - public_key: 1184 bytes (ML-KEM-768 public key)
  - signature: 64 bytes (ECDSA P-256 signature over the public key)
  """

  def change do
    create table(:e2ee_kyber_prekeys, primary_key: false) do
      add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :public_key, :binary, null: false
      add :signature, :binary, null: false
      add :key_id, :integer, null: false
      add :is_current, :boolean, default: true, null: false
      add :used_at, :utc_datetime
      add :used_by_id, :binary_id

      timestamps(type: :utc_datetime_usec)
    end

    create index(:e2ee_kyber_prekeys, [:user_id])
    create unique_index(:e2ee_kyber_prekeys, [:user_id, :key_id])
    create index(:e2ee_kyber_prekeys, [:user_id, :is_current])
  end
end
