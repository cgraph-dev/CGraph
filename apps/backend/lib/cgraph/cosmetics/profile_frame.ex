defmodule CGraph.Cosmetics.ProfileFrame do
  @moduledoc """
  Schema for profile frames that users can unlock and equip.

  Profile frames are decorative borders for user profile cards.
  The cosmetic manifest includes 55 frame designs across all rarity tiers,
  using the unified 7-tier rarity system.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Cosmetics.Rarity

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @unlock_types ~w(default achievement level purchase event season gift prestige)

  schema "profile_frames" do
    field :slug, :string
    field :name, :string
    field :frame_url, :string
    field :animated, :boolean, default: false
    field :rarity, :string
    field :unlock_type, :string
    field :unlock_condition, :map, default: %{}
    field :sort_order, :integer, default: 0
    field :is_active, :boolean, default: true

    timestamps()
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(frame, attrs) do
    frame
    |> cast(attrs, [
      :slug, :name, :frame_url, :animated, :rarity,
      :unlock_type, :unlock_condition, :sort_order, :is_active
    ])
    |> validate_required([:slug, :name, :rarity, :unlock_type])
    |> validate_inclusion(:rarity, Rarity.string_values())
    |> validate_inclusion(:unlock_type, @unlock_types)
    |> unique_constraint(:slug)
  end

  @doc "Returns the list of available rarity levels."
  @spec rarities() :: [String.t()]
  def rarities, do: Rarity.string_values()

  @doc "Returns the list of available unlock types."
  @spec unlock_types() :: [String.t()]
  def unlock_types, do: @unlock_types
end
