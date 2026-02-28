defmodule CGraph.Repo.Migrations.AddE2eeCrossSignatures do
  use Ecto.Migration

  def change do
    create table(:e2ee_cross_signatures, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :signer_device_id, references(:e2ee_identity_keys, type: :binary_id, on_delete: :delete_all), null: false
      add :signed_device_id, references(:e2ee_identity_keys, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :signature, :binary, null: false
      add :algorithm, :string, null: false, default: "ed25519"
      add :status, :string, null: false, default: "verified"

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:e2ee_cross_signatures, [:signer_device_id, :signed_device_id])
    create index(:e2ee_cross_signatures, [:user_id])
    create index(:e2ee_cross_signatures, [:signed_device_id])
    create index(:e2ee_cross_signatures, [:status])
  end
end
