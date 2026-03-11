defmodule CGraph.Cosmetics.ProfileEffect do
  @moduledoc """
  Schema for profile effects that users can unlock and equip.

  Profile effects are visual enhancements (particle, aura, trail) applied
  to user profiles, using the unified 7-tier rarity system with JSONB
  configuration for flexible rendering parameters.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Cosmetics.Rarity

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @effect_types ~w(particle aura trail)

  schema "profile_effects" do
    field :slug, :string
    field :name, :string
    field :type, :string
    field :config, :map, default: %{}
    field :rarity, :string
    field :preview_url, :string
    field :sort_order, :integer, default: 0
    field :is_active, :boolean, default: true

    timestamps()
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(effect, attrs) do
    effect
    |> cast(attrs, [
      :slug, :name, :type, :config, :rarity,
      :preview_url, :sort_order, :is_active
    ])
    |> validate_required([:slug, :name, :type, :rarity])
    |> validate_inclusion(:rarity, Rarity.string_values())
    |> validate_inclusion(:type, @effect_types)
    |> unique_constraint(:slug)
  end

  @doc "Returns the list of available rarity levels."
  @spec rarities() :: [String.t()]
  def rarities, do: Rarity.string_values()

  @doc "Returns the list of available effect types."
  @spec effect_types() :: [String.t()]
  def effect_types, do: @effect_types
end
