defmodule CGraph.Repo.Migrations.CreateIapReceipts do
  use Ecto.Migration

  def change do
    create table(:iap_receipts, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :platform, :string, null: false
      add :product_id, :string, null: false
      add :original_transaction_id, :string, null: false
      add :receipt_data, :text
      add :validation_status, :string, null: false, default: "pending"
      add :expires_at, :utc_datetime
      add :purchase_date, :utc_datetime
      add :environment, :string
      add :auto_renewing, :boolean, default: true
      add :cancellation_date, :utc_datetime

      timestamps()
    end

    create unique_index(:iap_receipts, [:platform, :original_transaction_id])
    create index(:iap_receipts, [:user_id])
    create index(:iap_receipts, [:validation_status])
  end
end
