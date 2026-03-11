defmodule CGraph.Gamification.ProfileTheme do
  @moduledoc """
  Schema for profile themes that users can customize.

  Supports 22+ preset themes with:
  - Custom color schemes
  - Background effects (gradients, images, particles, video)
  - Card layout configurations
  - Typography settings
  - Hover animations
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Cosmetics.Rarity

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @presets ~w(minimalist-dark minimalist-light gradient-aurora cyberpunk-neon fantasy-castle space-explorer ocean-deep forest-mystic retro-arcade kawaii-pastel dark-gothic royal-purple nature-zen sunset-warm arctic-frost volcanic-fire galaxy-dream steampunk-brass cherry-blossom neon-city holographic custom)
  @layout_types ~w(minimal compact detailed gaming social creator custom)
  @hover_effects ~w(none scale tilt glow border-animate parallax float)
  @unlock_types ~w(default achievement level purchase event season)

  schema "profile_themes" do
    field :slug, :string
    field :name, :string
    field :description, :string
    field :preset, :string
    field :rarity, :string

    # Color configuration
    field :colors, :map, default: %{
      "primary" => "#22c55e",
      "secondary" => "#4ade80",
      "accent" => "#86efac",
      "background" => "#0a0a0f",
      "surface" => "#1a1a2e",
      "text" => "#ffffff"
    }

    # Background configuration
    field :background_type, :string, default: "solid"
    field :background_config, :map, default: %{}

    # Card layout
    field :layout_type, :string, default: "detailed"
    field :layout_config, :map, default: %{}

    # Effects
    field :hover_effect, :string, default: "scale"
    field :glassmorphism, :map, default: %{}
    field :border_radius, :string, default: "md"
    field :effects_config, :map, default: %{}

    # Typography
    field :font_family, :string, default: "Inter"
    field :typography_config, :map, default: %{}

    # Unlock configuration
    field :unlock_type, :string
    field :unlock_requirement, :map
    field :is_purchasable, :boolean, default: false
    field :coin_cost, :integer, default: 0
    field :gem_cost, :integer, default: 0

    # Meta
    field :sort_order, :integer, default: 0
    field :is_active, :boolean, default: true
    field :preview_url, :string

    has_many :user_profile_themes, CGraph.Gamification.UserProfileTheme, foreign_key: :theme_id

    timestamps(type: :utc_datetime)
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(theme, attrs) do
    theme
    |> cast(attrs, [
      :slug, :name, :description, :preset, :rarity,
      :colors, :background_type, :background_config,
      :layout_type, :layout_config, :hover_effect, :glassmorphism, :border_radius,
      :effects_config, :font_family, :typography_config,
      :unlock_type, :unlock_requirement, :is_purchasable, :coin_cost, :gem_cost,
      :sort_order, :is_active, :preview_url
    ])
    |> validate_required([:slug, :name, :preset, :rarity, :unlock_type])
    |> validate_inclusion(:rarity, Rarity.string_values())
    |> validate_inclusion(:preset, @presets)
    |> validate_inclusion(:layout_type, @layout_types)
    |> validate_inclusion(:hover_effect, @hover_effects)
    |> validate_inclusion(:unlock_type, @unlock_types)
    |> validate_number(:coin_cost, greater_than_or_equal_to: 0)
    |> validate_number(:gem_cost, greater_than_or_equal_to: 0)
    |> unique_constraint(:slug)
  end

  @doc "Returns the list of available rarity levels."
  @spec rarities() :: [String.t()]
  def rarities, do: Rarity.string_values()
  @doc "Returns the list of available theme presets."
  @spec presets() :: [String.t()]
  def presets, do: @presets
  @doc "Returns the list of available layout types."
  @spec layout_types() :: [String.t()]
  def layout_types, do: @layout_types
  @doc "Returns the list of available hover effects."
  @spec hover_effects() :: [String.t()]
  def hover_effects, do: @hover_effects
  @doc "Returns the list of available unlock types."
  @spec unlock_types() :: [String.t()]
  def unlock_types, do: @unlock_types
end
