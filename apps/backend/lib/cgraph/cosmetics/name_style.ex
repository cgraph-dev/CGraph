defmodule CGraph.Cosmetics.NameStyle do
  @moduledoc """
  Schema for name display styles that users can equip.

  Name styles control how a user's display name appears in chat,
  profiles, and leaderboards — including font family, color scheme
  (gradient stops, primary/secondary colors), and optional animations.

  The manifest defines 50 name styles across all rarity tiers.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Cosmetics.Rarity

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "name_styles" do
    field :slug, :string
    field :name, :string
    field :font_family, :string
    field :color_scheme, :map, default: %{}
    field :animation, :string
    field :rarity, :string
    field :previewable, :boolean, default: true
    field :sort_order, :integer, default: 0
    field :is_active, :boolean, default: true

    timestamps()
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(name_style, attrs) do
    name_style
    |> cast(attrs, [:slug, :name, :font_family, :color_scheme, :animation, :rarity, :previewable, :sort_order, :is_active])
    |> validate_required([:slug, :name, :font_family, :rarity])
    |> validate_inclusion(:rarity, Rarity.string_values())
    |> unique_constraint(:slug)
  end
end
