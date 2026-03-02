defmodule CGraph.Creators.CreatorEarning do
  @moduledoc """
  Schema for the creator earnings ledger.

  Each row represents a single payment event where a subscriber's payment
  was split between the creator (net) and the platform (fee).
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  schema "creator_earnings" do
    belongs_to :creator, CGraph.Accounts.User
    belongs_to :forum, CGraph.Forums.Forum
    belongs_to :subscriber, CGraph.Accounts.User
    belongs_to :paid_forum_subscription, CGraph.Creators.PaidForumSubscription

    field :gross_amount_cents, :integer
    field :platform_fee_cents, :integer
    field :net_amount_cents, :integer
    field :currency, :string, default: "usd"
    field :stripe_payment_intent_id, :string
    field :period_start, :utc_datetime
    field :period_end, :utc_datetime

    timestamps(updated_at: false)
  end

  @required_fields ~w(creator_id gross_amount_cents platform_fee_cents net_amount_cents)a
  @optional_fields ~w(forum_id subscriber_id paid_forum_subscription_id currency stripe_payment_intent_id period_start period_end)a

  @doc "Builds a changeset for a creator earning record."
  def changeset(earning, attrs) do
    earning
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_number(:gross_amount_cents, greater_than_or_equal_to: 0)
    |> validate_number(:platform_fee_cents, greater_than_or_equal_to: 0)
    |> validate_number(:net_amount_cents, greater_than_or_equal_to: 0)
    |> foreign_key_constraint(:creator_id)
  end
end
