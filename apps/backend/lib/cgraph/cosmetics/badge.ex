defmodule CGraph.Cosmetics.Badge do
  @moduledoc """
  Schema for badges that users can unlock through achievements and progression.

  Badges represent accomplishments and milestones across various categories
  and tracks, using the unified 7-tier rarity system.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Cosmetics.Rarity

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @unlock_types ~w(default achievement level purchase event season gift prestige)
  @categories ~w(social competitive creative milestone seasonal event special)

  @type t :: %__MODULE__{}

  schema "badges" do
    field :slug, :string
    field :name, :string
    field :description, :string
    field :icon_url, :string
    field :rarity, :string
    field :category, :string
    field :track, :string
    field :unlock_type, :string
    field :unlock_condition, :map, default: %{}
    field :nodes_cost, :integer, default: 0
    field :stackable, :boolean, default: false
    field :sort_order, :integer, default: 0
    field :is_active, :boolean, default: true

    timestamps()
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(badge, attrs) do
    badge
    |> cast(attrs, [
      :slug, :name, :description, :icon_url, :rarity,
      :category, :track, :unlock_type, :unlock_condition,
      :nodes_cost, :stackable, :sort_order, :is_active
    ])
    |> validate_required([:slug, :name, :rarity, :category, :unlock_type])
    |> validate_inclusion(:rarity, Rarity.string_values())
    |> validate_inclusion(:unlock_type, @unlock_types)
    |> validate_inclusion(:category, @categories)
    |> validate_number(:nodes_cost, greater_than_or_equal_to: 0)
    |> unique_constraint(:slug)
  end

  @doc "Returns the list of available rarity levels."
  @spec rarities() :: [String.t()]
  def rarities, do: Rarity.string_values()

  @doc "Returns the list of available categories."
  @spec categories() :: [String.t()]
  def categories, do: @categories

  @doc "Returns the list of available unlock types."
  @spec unlock_types() :: [String.t()]
  def unlock_types, do: @unlock_types
end
