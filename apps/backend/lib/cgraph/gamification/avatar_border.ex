defmodule CGraph.Gamification.AvatarBorder do
  @moduledoc """
  Schema for avatar borders that users can unlock and equip.
  
  Features 150+ border styles across 20+ themes including:
  - Animated gradients, particles, glows
  - Theme-specific effects (cyberpunk, fantasy, retro, etc.)
  - Rarity tiers with visual indicators
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @rarities ~w(common uncommon rare epic legendary mythic unique seasonal event)
  @themes ~w(basic gradient glow animated retro neon cyberpunk fantasy minimal nature ocean space fire ice pixel vaporwave 8bit steampunk anime cosmic ethereal)
  @animation_types ~w(none static pulse rotate shimmer wave breathe spin rainbow particles glow flow spark)
  @unlock_types ~w(default achievement level purchase event season gift prestige)

  schema "avatar_borders" do
    field :slug, :string
    field :name, :string
    field :description, :string
    field :theme, :string
    field :rarity, :string
    
    # Visual configuration
    field :border_style, :map, default: %{}
    field :animation_type, :string, default: "none"
    field :animation_speed, :float, default: 1.0
    field :animation_intensity, :float, default: 1.0
    field :colors, {:array, :string}, default: []
    field :particle_config, :map, default: %{}
    field :glow_config, :map, default: %{}
    
    # Unlock configuration
    field :unlock_type, :string
    field :unlock_requirement, :string
    field :is_purchasable, :boolean, default: false
    field :coin_cost, :integer, default: 0
    field :gem_cost, :integer, default: 0
    
    # Seasonal/event
    field :season_id, :binary_id
    field :event_id, :binary_id
    field :available_from, :utc_datetime
    field :available_until, :utc_datetime
    
    # Meta
    field :sort_order, :integer, default: 0
    field :is_active, :boolean, default: true
    field :preview_url, :string
    
    has_many :user_avatar_borders, CGraph.Gamification.UserAvatarBorder

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(border, attrs) do
    border
    |> cast(attrs, [
      :slug, :name, :description, :theme, :rarity,
      :border_style, :animation_type, :animation_speed, :animation_intensity,
      :colors, :particle_config, :glow_config,
      :unlock_type, :unlock_requirement, :is_purchasable, :coin_cost, :gem_cost,
      :season_id, :event_id, :available_from, :available_until,
      :sort_order, :is_active, :preview_url
    ])
    |> validate_required([:slug, :name, :theme, :rarity, :unlock_type])
    |> validate_inclusion(:rarity, @rarities)
    |> validate_inclusion(:theme, @themes)
    |> validate_inclusion(:animation_type, @animation_types)
    |> validate_inclusion(:unlock_type, @unlock_types)
    |> validate_number(:coin_cost, greater_than_or_equal_to: 0)
    |> validate_number(:gem_cost, greater_than_or_equal_to: 0)
    |> validate_number(:animation_speed, greater_than: 0, less_than_or_equal_to: 5)
    |> validate_number(:animation_intensity, greater_than_or_equal_to: 0, less_than_or_equal_to: 1)
    |> unique_constraint(:slug)
  end

  def rarities, do: @rarities
  def themes, do: @themes
  def animation_types, do: @animation_types
  def unlock_types, do: @unlock_types
end
