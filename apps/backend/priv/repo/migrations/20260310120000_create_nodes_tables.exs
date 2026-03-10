defmodule CGraph.Repo.Migrations.CreateNodesTables do
  use Ecto.Migration

  def change do
    # ==================== NODE WALLETS ====================

    create table(:node_wallets, primary_key: false) do
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all),
        primary_key: true, null: false

      add :available_balance, :integer, null: false, default: 0
      add :pending_balance, :integer, null: false, default: 0
      add :lifetime_earned, :integer, null: false, default: 0
      add :lifetime_spent, :integer, null: false, default: 0

      timestamps(type: :utc_datetime)
    end

    # ==================== NODE TRANSACTIONS ====================

    create table(:node_transactions, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :user_id, references(:users, type: :binary_id, on_delete: :nothing),
        null: false

      add :amount, :integer, null: false
      add :type, :string, size: 30, null: false
      add :reference_id, :binary_id
      add :reference_type, :string, size: 30
      add :platform_cut, :integer
      add :net_amount, :integer
      add :hold_until, :utc_datetime
      add :metadata, :map

      add :inserted_at, :utc_datetime, null: false, default: fragment("NOW()")
    end

    create index(:node_transactions, [:user_id, :inserted_at],
      name: :node_transactions_user_id_inserted_at_index)

    create index(:node_transactions, [:type])

    create index(:node_transactions, [:hold_until],
      where: "hold_until IS NOT NULL",
      name: :node_transactions_hold_until_pending_index)

    # ==================== WITHDRAWAL REQUESTS ====================

    create table(:withdrawal_requests, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :user_id, references(:users, type: :binary_id, on_delete: :nothing),
        null: false

      add :nodes_amount, :integer, null: false
      add :currency, :string, size: 3, null: false, default: "EUR"
      add :fiat_amount, :decimal, precision: 10, scale: 2, null: false
      add :status, :string, size: 20, null: false, default: "pending"
      add :payout_reference, :string, size: 255

      add :inserted_at, :utc_datetime, null: false, default: fragment("NOW()")
      add :completed_at, :utc_datetime
    end

    create index(:withdrawal_requests, [:user_id])
    create index(:withdrawal_requests, [:status])

    # ==================== DROP COINS COLUMN ====================

    alter table(:users) do
      remove_if_exists :coins, :integer
    end
  end
end
