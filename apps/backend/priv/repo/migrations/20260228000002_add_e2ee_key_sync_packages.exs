defmodule CGraph.Repo.Migrations.AddE2eeKeySyncPackages do
  use Ecto.Migration

  def change do
    create table(:e2ee_key_sync_packages, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :from_device_id, references(:e2ee_identity_keys, type: :binary_id, on_delete: :delete_all), null: false
      add :to_device_id, references(:e2ee_identity_keys, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :encrypted_key_material, :binary, null: false
      add :status, :string, null: false, default: "pending"

      timestamps(type: :utc_datetime_usec)
    end

    create index(:e2ee_key_sync_packages, [:to_device_id, :status])
    create index(:e2ee_key_sync_packages, [:user_id])
    create index(:e2ee_key_sync_packages, [:from_device_id])
  end
end
