defmodule CGraph.Repo.Migrations.AddCreatorMonetization do
  use Ecto.Migration

  def change do
    # ── Forum monetization columns ──────────────────────────────
    # NOTE: stripe_connect_id, creator_status, creator_onboarded_at
    # are already on users table from 17-01 migration (20260302600001).
    alter table(:forums) do
      add :monetization_enabled, :boolean, default: false
      add :subscription_price_cents, :integer
      add :subscription_currency, :string, default: "usd"
    end

    # ── Paid forum subscriptions ────────────────────────────────
    create table(:paid_forum_subscriptions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all), null: false
      add :subscriber_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :creator_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :stripe_subscription_id, :string
      add :status, :string, default: "active"
      add :price_cents, :integer
      add :current_period_start, :utc_datetime
      add :current_period_end, :utc_datetime
      add :canceled_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:paid_forum_subscriptions, [:forum_id, :subscriber_id])
    create index(:paid_forum_subscriptions, [:subscriber_id])
    create index(:paid_forum_subscriptions, [:creator_id])
    create index(:paid_forum_subscriptions, [:stripe_subscription_id])

    # ── Creator earnings ledger ─────────────────────────────────
    create table(:creator_earnings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :creator_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :forum_id, references(:forums, type: :binary_id, on_delete: :delete_all)
      add :subscriber_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :paid_forum_subscription_id, references(:paid_forum_subscriptions, type: :binary_id, on_delete: :nilify_all)
      add :gross_amount_cents, :integer, null: false
      add :platform_fee_cents, :integer, null: false
      add :net_amount_cents, :integer, null: false
      add :currency, :string, default: "usd"
      add :stripe_payment_intent_id, :string
      add :period_start, :utc_datetime
      add :period_end, :utc_datetime

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:creator_earnings, [:creator_id])
    create index(:creator_earnings, [:forum_id])

    # ── Creator payouts ─────────────────────────────────────────
    create table(:creator_payouts, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :creator_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :amount_cents, :integer, null: false
      add :currency, :string, default: "usd"
      add :stripe_transfer_id, :string
      add :status, :string, default: "pending"
      add :requested_at, :utc_datetime, default: fragment("now()")
      add :completed_at, :utc_datetime
      add :failure_reason, :string

      timestamps(type: :utc_datetime)
    end

    create index(:creator_payouts, [:creator_id])
    create index(:creator_payouts, [:stripe_transfer_id])
  end
end
