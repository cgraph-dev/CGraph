defmodule CGraph.Gamification.ChatEffect do
  @moduledoc """
  Schema for chat effects including message animations, bubble styles, and typing indicators.

  Features:
  - 30+ message entrance effects
  - 15 bubble style presets
  - 8 typing indicator styles
  - Reaction animations
  - Sound effect configurations
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @rarities ~w(common uncommon rare epic legendary mythic unique)
  @effect_types ~w(message-effect bubble-style typing-indicator emoji-pack sound-effect)
  @message_effects ~w(none confetti fireworks sparkle rainbow hearts stars snow fire electric glitch matrix bubble shake bounce fade-in slide-in zoom flip typewriter neon-glow holographic plasma aurora cosmic sakura rain thunder explosion portal)
  @bubble_styles ~w(default rounded square cloud thought comic neon glass gradient outlined shadowed retro pixel futuristic organic)
  @typing_indicators ~w(dots wave bounce pulse typing-text pencil speech-bubble custom)
  @unlock_types ~w(default achievement level purchase event season)

  schema "chat_effects" do
    field :slug, :string
    field :name, :string
    field :description, :string
    field :effect_type, :string
    field :effect_id, :string  # The specific effect within the type
    field :rarity, :string

    # Effect configuration
    field :config, :map, default: %{}
    field :preview_config, :map, default: %{}

    # Unlock configuration
    field :unlock_type, :string
    field :unlock_requirement, :string
    field :is_purchasable, :boolean, default: false
    field :coin_cost, :integer, default: 0
    field :gem_cost, :integer, default: 0

    # Meta
    field :sort_order, :integer, default: 0
    field :is_active, :boolean, default: true
    field :preview_url, :string

    has_many :user_chat_effects, CGraph.Gamification.UserChatEffect, foreign_key: :effect_id

    timestamps(type: :utc_datetime)
  end

  @doc false
  @spec changeset(%__MODULE__{} | Ecto.Changeset.t(), map()) :: Ecto.Changeset.t()
  def changeset(effect, attrs) do
    effect
    |> cast(attrs, [
      :slug, :name, :description, :effect_type, :effect_id, :rarity,
      :config, :preview_config,
      :unlock_type, :unlock_requirement, :is_purchasable, :coin_cost, :gem_cost,
      :sort_order, :is_active, :preview_url
    ])
    |> validate_required([:slug, :name, :effect_type, :effect_id, :rarity, :unlock_type])
    |> validate_inclusion(:rarity, @rarities)
    |> validate_inclusion(:effect_type, @effect_types)
    |> validate_inclusion(:unlock_type, @unlock_types)
    |> validate_effect_id()
    |> validate_number(:coin_cost, greater_than_or_equal_to: 0)
    |> validate_number(:gem_cost, greater_than_or_equal_to: 0)
    |> unique_constraint(:slug)
  end

  defp validate_effect_id(changeset) do
    effect_type = get_field(changeset, :effect_type)
    effect_id = get_field(changeset, :effect_id)

    valid_ids = case effect_type do
      "message-effect" -> @message_effects
      "bubble-style" -> @bubble_styles
      "typing-indicator" -> @typing_indicators
      _ -> []
    end

    if effect_id in valid_ids or effect_type in ["emoji-pack", "sound-effect"] do
      changeset
    else
      add_error(changeset, :effect_id, "is not a valid effect for this type")
    end
  end

  @doc "Returns the list of available rarity levels."
  @spec rarities() :: [String.t()]
  def rarities, do: @rarities
  @doc "Returns the list of available effect types."
  @spec effect_types() :: [String.t()]
  def effect_types, do: @effect_types
  @doc "Returns the list of available message effects."
  @spec message_effects() :: [String.t()]
  def message_effects, do: @message_effects
  @doc "Returns the list of available bubble styles."
  @spec bubble_styles() :: [String.t()]
  def bubble_styles, do: @bubble_styles
  @doc "Returns the list of available typing indicators."
  @spec typing_indicators() :: [String.t()]
  def typing_indicators, do: @typing_indicators
  @doc "Returns the list of available unlock types."
  @spec unlock_types() :: [String.t()]
  def unlock_types, do: @unlock_types
end
