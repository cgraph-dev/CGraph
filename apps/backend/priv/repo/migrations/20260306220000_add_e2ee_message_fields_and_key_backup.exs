defmodule CGraph.Repo.Migrations.AddE2eeMessageFieldsAndKeyBackup do
  use Ecto.Migration

  def change do
    # Add ratchet_header and session_id to messages for E2EE triple ratchet support
    alter table(:messages) do
      add :ratchet_header, :map
      add :session_id, :string
    end

    # Encrypted key backup for cross-device key sync
    create table(:e2ee_key_backups, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :device_id, :string, null: false
      add :encrypted_backup, :binary, null: false

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:e2ee_key_backups, [:user_id, :device_id])
    create index(:e2ee_key_backups, [:user_id])
  end
end
