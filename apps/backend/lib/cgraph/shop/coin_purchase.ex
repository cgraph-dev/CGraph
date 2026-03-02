defmodule CGraph.Shop.CoinPurchase do
  @moduledoc """
  Schema for coin purchase records.

  Tracks every real-money coin bundle purchase through Stripe.
  The `stripe_session_id` unique index provides idempotency —
  duplicate webhook deliveries cannot create duplicate records.

  ## Statuses

  - `pending` — Checkout session created, awaiting payment
  - `completed` — Payment confirmed and coins awarded
  - `failed` — Payment or session creation failed
  - `refunded` — Payment was refunded (coins should be deducted)
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "coin_purchases" do
    field :user_id, :binary_id
    field :bundle_id, :string
    field :coins_awarded, :integer
    field :price_cents, :integer
    field :currency, :string, default: "usd"
    field :stripe_session_id, :string
    field :stripe_payment_intent_id, :string
    field :status, :string, default: "pending"
    field :fulfilled_at, :utc_datetime

    timestamps()
  end

  @required_fields ~w(user_id bundle_id coins_awarded price_cents status)a
  @optional_fields ~w(currency stripe_session_id stripe_payment_intent_id fulfilled_at)a

  @doc false
  def changeset(purchase, attrs) do
    purchase
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, ~w(pending completed failed refunded))
    |> validate_number(:coins_awarded, greater_than: 0)
    |> validate_number(:price_cents, greater_than: 0)
    |> unique_constraint(:stripe_session_id, name: :coin_purchases_stripe_session_id_unique)
  end
end
