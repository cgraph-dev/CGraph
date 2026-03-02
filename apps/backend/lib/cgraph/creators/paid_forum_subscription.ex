defmodule CGraph.Creators.PaidForumSubscription do
  @moduledoc """
  Schema for paid forum subscriptions.

  Tracks users who have subscribed to a paid forum, including their
  Stripe subscription ID, billing period, and status.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  schema "paid_forum_subscriptions" do
    belongs_to :forum, CGraph.Forums.Forum
    belongs_to :subscriber, CGraph.Accounts.User
    belongs_to :creator, CGraph.Accounts.User

    field :stripe_subscription_id, :string
    field :status, :string, default: "active"
    field :price_cents, :integer
    field :current_period_start, :utc_datetime
    field :current_period_end, :utc_datetime
    field :canceled_at, :utc_datetime

    timestamps()
  end

  @required_fields ~w(forum_id subscriber_id creator_id price_cents)a
  @optional_fields ~w(stripe_subscription_id status current_period_start current_period_end canceled_at)a

  @doc "Builds a changeset for a paid forum subscription."
  def changeset(subscription, attrs) do
    subscription
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, ~w(active canceled past_due expired))
    |> unique_constraint([:forum_id, :subscriber_id])
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:subscriber_id)
    |> foreign_key_constraint(:creator_id)
  end
end
