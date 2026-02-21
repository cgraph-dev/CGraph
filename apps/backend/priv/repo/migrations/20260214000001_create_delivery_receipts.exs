defmodule CGraph.Repo.Migrations.CreateDeliveryReceipts do
  use Ecto.Migration

  def change do
    create table(:delivery_receipts, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :status, :string, null: false, default: "sent"
      add :delivered_at, :utc_datetime_usec
      add :device_id, :string
      add :platform, :string
      add :failure_reason, :string

      # Note: messages table uses composite PK (id, inserted_at) for partitioning.
      # Postgres doesn't support FK references to partitioned tables with partial key match.
      # We use a plain column instead of `references()` and enforce integrity at the app layer.
      add :message_id, :binary_id, null: false
      add :recipient_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(updated_at: false, type: :utc_datetime_usec)
    end

    # Fast lookup: "what's the delivery status of this message for each recipient?"
    create index(:delivery_receipts, [:message_id, :recipient_id])

    # Fast lookup: "what messages haven't been delivered to this user?"
    create index(:delivery_receipts, [:recipient_id, :status],
      where: "status = 'sent'",
      name: :delivery_receipts_pending_idx)

    # Prevent duplicate receipts per message/recipient/device
    create unique_index(:delivery_receipts, [:message_id, :recipient_id, :device_id],
      name: :delivery_receipts_message_recipient_device_idx)
  end
end
