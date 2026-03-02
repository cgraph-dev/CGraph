defmodule CGraph.Repo.Migrations.FixSubscriptionFields do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :stripe_subscription_id, :string
      add :cancel_at_period_end, :boolean, default: false
      add :subscription_grace_until, :utc_datetime
      add :iap_provider, :string
      add :iap_transaction_id, :string
      add :stripe_connect_id, :string
      add :creator_status, :string, default: "none"
      add :creator_onboarded_at, :utc_datetime
    end
  end
end
