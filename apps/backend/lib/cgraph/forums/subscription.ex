defmodule Cgraph.Forums.Subscription do
  @moduledoc """
  Schema for forum subscriptions.
  
  Tracks user subscriptions to forums for personalized feeds
  and notification preferences.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "forum_subscriptions" do
    field :notification_level, :string, default: "all"  # all, mentions, none

    belongs_to :forum, Cgraph.Forums.Forum
    belongs_to :user, Cgraph.Accounts.User

    timestamps()
  end

  @doc """
  Create a subscription.
  """
  def changeset(subscription, attrs) do
    subscription
    |> cast(attrs, [:forum_id, :user_id, :notification_level])
    |> validate_required([:forum_id, :user_id])
    |> validate_inclusion(:notification_level, ["all", "mentions", "none"])
    |> unique_constraint([:forum_id, :user_id])
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:user_id)
  end
end
