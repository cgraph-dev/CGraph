defmodule CGraph.Forums.ForumMonetizationTier do
  @moduledoc """
  Schema for forum_monetization_tiers table.

  Represents a subscription tier within a forum's monetization setup.
  Each forum can have up to 3 tiers with different pricing and features.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @derive {Jason.Encoder, only: [
    :id, :name, :monthly_price_nodes, :yearly_price_nodes,
    :features, :sort_order, :inserted_at, :updated_at
  ]}

  schema "forum_monetization_tiers" do
    belongs_to :forum, CGraph.Forums.Forum

    field :name, :string
    field :monthly_price_nodes, :integer
    field :yearly_price_nodes, :integer
    field :features, :map, default: %{}
    field :sort_order, :integer, default: 0

    timestamps()
  end

  @doc false
  def changeset(tier, attrs) do
    tier
    |> cast(attrs, [:forum_id, :name, :monthly_price_nodes, :yearly_price_nodes, :features, :sort_order])
    |> validate_required([:forum_id, :name, :monthly_price_nodes])
    |> validate_number(:monthly_price_nodes, greater_than: 0)
    |> validate_number(:yearly_price_nodes, greater_than: 0)
    |> validate_length(:name, min: 1, max: 50)
    |> unique_constraint([:forum_id, :name])
    |> foreign_key_constraint(:forum_id)
  end
end
