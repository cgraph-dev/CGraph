defmodule CGraph.Repo.Migrations.AddIdentityKeyIdToPrekeys do
  use Ecto.Migration

  @moduledoc """
  Adds identity_key_id foreign key to one_time_prekeys and kyber_prekeys tables
  to enable per-device scoping of prekey deletion.

  Previously, remove_device/2 deleted ALL user prekeys across all devices because
  these tables lacked a device/identity_key link. This migration fixes that by
  associating each prekey with the identity key (device) that uploaded it.
  """

  def change do
    # Add identity_key_id to one-time prekeys
    alter table(:e2ee_one_time_prekeys) do
      add :identity_key_id, references(:e2ee_identity_keys, type: :binary_id, on_delete: :delete_all)
    end

    create index(:e2ee_one_time_prekeys, [:identity_key_id])

    # Add identity_key_id to Kyber prekeys
    alter table(:e2ee_kyber_prekeys) do
      add :identity_key_id, references(:e2ee_identity_keys, type: :binary_id, on_delete: :delete_all)
    end

    create index(:e2ee_kyber_prekeys, [:identity_key_id])
  end
end
