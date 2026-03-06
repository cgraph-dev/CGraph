defmodule CGraph.Repo.Migrations.CreateFileTransfers do
  use Ecto.Migration

  def change do
    create table(:file_transfers, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :conversation_id, :binary_id
      add :message_id, :binary_id
      add :file_name, :string, null: false
      add :file_size, :integer, null: false
      add :file_mime_type, :string, null: false
      add :file_extension, :string
      add :storage_key, :string
      add :thumbnail_key, :string
      add :status, :string, default: "pending", null: false
      add :upload_type, :string, default: "direct", null: false
      add :chunks_total, :integer
      add :chunks_uploaded, :integer, default: 0
      add :upload_id, :string
      add :checksum_sha256, :string
      add :is_encrypted, :boolean, default: false
      add :encrypted_metadata, :binary
      add :download_count, :integer, default: 0
      add :expires_at, :utc_datetime_usec

      timestamps(type: :utc_datetime_usec)
    end

    create index(:file_transfers, [:user_id])
    create index(:file_transfers, [:conversation_id])
    create index(:file_transfers, [:status])
    create index(:file_transfers, [:expires_at], where: "expires_at IS NOT NULL")
  end
end
