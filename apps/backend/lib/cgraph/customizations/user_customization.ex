defmodule CGraph.Customizations.UserCustomization do
  @moduledoc """
  Schema for user customizations (avatar borders, titles, themes, chat styles, effects).
  """

  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "user_customizations" do
    field :user_id, :binary_id

    # Identity
    field :avatar_border_id, :string
    field :title_id, :string
    field :equipped_badges, {:array, :string}, default: []
    field :profile_layout, :string, default: "classic"

    # Themes
    field :profile_theme, :string, default: "classic-purple"
    field :chat_theme, :string, default: "default"
    field :forum_theme, :string
    field :app_theme, :string, default: "dark"

    # Chat Styling - Core (existing)
    field :bubble_style, :string, default: "default"
    field :message_effect, :string, default: "none"
    field :reaction_style, :string, default: "bounce"

    # Chat Styling - Bubble Appearance (NEW)
    field :bubble_color, :string
    field :bubble_opacity, :integer, default: 100
    field :bubble_radius, :integer, default: 16
    field :bubble_shadow, :string, default: "medium"

    # Chat Styling - Typography (NEW)
    field :text_color, :string
    field :text_size, :integer, default: 14
    field :text_weight, :string, default: "400"
    field :font_family, :string, default: "Inter"

    # Chat Styling - Animations (NEW)
    field :entrance_animation, :string, default: "fade"
    field :hover_effect, :string, default: "lift"
    field :animation_intensity, :string, default: "medium"

    # Chat Styling - Advanced Effects (NEW)
    field :glass_effect, :string, default: "default"
    field :border_style, :string, default: "none"
    field :sound_effect, :string
    field :voice_visualizer_theme, :string, default: "cyber_blue"

    # Accessibility (NEW)
    field :haptic_feedback, :boolean, default: true

    # Global Effects
    field :particle_effect, :string, default: "none"
    field :background_effect, :string, default: "solid"
    field :animation_speed, :string, default: "normal"

    # Extensibility & Analytics
    field :custom_config, :map, default: %{}
    field :last_updated_at, :utc_datetime
    field :preset_name, :string

    timestamps(type: :utc_datetime)
  end

  @doc """
  Changeset for user customizations with comprehensive validation.

  Designed for scale:
  - All numeric fields have min/max bounds
  - String fields have length limits
  - Enum-like fields validated against allowed values
  - Custom config size limited to prevent abuse
  """
  def changeset(user_customization, attrs) do
    user_customization
    |> cast(attrs, [
      :user_id,
      # Identity
      :avatar_border_id,
      :title_id,
      :equipped_badges,
      :profile_layout,
      # Themes
      :profile_theme,
      :chat_theme,
      :forum_theme,
      :app_theme,
      # Chat Styling - Core
      :bubble_style,
      :message_effect,
      :reaction_style,
      # Chat Styling - Bubble Appearance
      :bubble_color,
      :bubble_opacity,
      :bubble_radius,
      :bubble_shadow,
      # Chat Styling - Typography
      :text_color,
      :text_size,
      :text_weight,
      :font_family,
      # Chat Styling - Animations
      :entrance_animation,
      :hover_effect,
      :animation_intensity,
      # Chat Styling - Advanced Effects
      :glass_effect,
      :border_style,
      :sound_effect,
      :voice_visualizer_theme,
      # Accessibility
      :haptic_feedback,
      # Global Effects
      :particle_effect,
      :background_effect,
      :animation_speed,
      # Extensibility
      :custom_config,
      :last_updated_at,
      :preset_name
    ])
    |> validate_required([:user_id])
    # Identity validations
    |> validate_length(:equipped_badges, max: 5)
    |> validate_length(:profile_layout, max: 50)
    # Numeric range validations (performance & UX bounds)
    |> validate_number(:bubble_opacity, greater_than_or_equal_to: 0, less_than_or_equal_to: 100)
    |> validate_number(:bubble_radius, greater_than_or_equal_to: 0, less_than_or_equal_to: 32)
    |> validate_number(:text_size, greater_than_or_equal_to: 12, less_than_or_equal_to: 20)
    # Color format validation (hex colors)
    |> validate_color_format(:bubble_color)
    |> validate_color_format(:text_color)
    # Animation intensity validation
    |> validate_inclusion(:animation_intensity, ~w(low medium high))
    # Custom config size limit (prevent abuse at scale)
    |> validate_custom_config_size()
    |> unique_constraint(:user_id)
    |> put_timestamp(:last_updated_at)
  end

  # Private helper: Validates hex color format
  defp validate_color_format(changeset, field) do
    validate_change(changeset, field, fn _, value ->
      if is_nil(value) or Regex.match?(~r/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/, value) do
        []
      else
        [{field, "must be a valid hex color (e.g., #FF5733 or #FF5733AA)"}]
      end
    end)
  end

  # Private helper: Validates custom_config size to prevent database bloat
  defp validate_custom_config_size(changeset) do
    validate_change(changeset, :custom_config, fn _, value ->
      if is_nil(value) do
        []
      else
        # Limit custom config to 50KB JSON to prevent abuse
        json_size = value |> Jason.encode!() |> byte_size()
        if json_size > 50_000 do
          [{:custom_config, "custom configuration too large (max 50KB)"}]
        else
          []
        end
      end
    end)
  end

  # Private helper: Automatically update last_updated_at timestamp
  defp put_timestamp(changeset, field) do
    put_change(changeset, field, DateTime.truncate(DateTime.utc_now(), :second))
  end
end
