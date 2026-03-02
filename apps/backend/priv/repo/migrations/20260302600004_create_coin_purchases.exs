defmodule CGraph.Repo.Migrations.CreateCoinPurchases do
  use Ecto.Migration

  def change do
    create table(:coin_purchases, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :bundle_id, :string, null: false
      add :coins_awarded, :integer, null: false
      add :price_cents, :integer, null: false
      add :currency, :string, default: "usd", null: false
      add :stripe_session_id, :string
      add :stripe_payment_intent_id, :string
      add :status, :string, default: "pending", null: false
      add :fulfilled_at, :utc_datetime

      timestamps()
    end

    create unique_index(:coin_purchases, [:stripe_session_id],
      where: "stripe_session_id IS NOT NULL",
      name: :coin_purchases_stripe_session_id_unique
    )

    create index(:coin_purchases, [:user_id])
    create index(:coin_purchases, [:status])
  end
end
