defmodule CGraph.Repo.Migrations.AddEncryptionMetadataToUploads do
  use Ecto.Migration

  def change do
    alter table(:files) do
      add :encrypted_key, :text
      add :encryption_iv, :text
      add :key_algorithm, :string, default: "aes-256-gcm"
      add :sender_device_id, :string
      add :is_encrypted, :boolean, default: false
    end

    create index(:files, [:is_encrypted], where: "is_encrypted = true")
  end
end
