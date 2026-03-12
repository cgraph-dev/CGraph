defmodule CGraph.Creators.SubscriptionTier do
  @moduledoc """
  Schema for creator subscription tiers within a forum.

  Creators can define multiple tiers with different pricing and benefits,
  allowing subscribers to access premium content at various levels.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  schema "subscription_tiers" do
    belongs_to :creator, CGraph.Accounts.User
    belongs_to :forum, CGraph.Forums.Forum

    field :name, :string
    field :price_monthly_nodes, :integer
    field :benefits, :map
    field :max_subscribers, :integer
    field :active, :boolean, default: true

    timestamps()
  end

  @required_fields ~w(creator_id forum_id name price_monthly_nodes)a
  @optional_fields ~w(benefits max_subscribers active)a

  def changeset(tier, attrs) do
    tier
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:name, min: 1, max: 100)
    |> validate_number(:price_monthly_nodes, greater_than: 0)
    |> validate_number(:max_subscribers, greater_than: 0)
    |> foreign_key_constraint(:creator_id)
    |> foreign_key_constraint(:forum_id)
  end
end
