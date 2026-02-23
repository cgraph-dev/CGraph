defmodule CGraphWeb.CustomizationJSON do
  @moduledoc """
  Renders user customizations as JSON.
  """

  alias CGraph.Customizations.UserCustomization

  @doc """
  Renders a single user_customization.
  """
  @spec show(map()) :: map()
  def show(%{customizations: customizations}) do
    %{data: data(customizations)}
  end

  defp data(%UserCustomization{} = customizations) do
    %{
      id: customizations.id,
      user_id: customizations.user_id,
      # Identity
      avatar_border_id: customizations.avatar_border_id,
      title_id: customizations.title_id,
      equipped_badges: customizations.equipped_badges || [],
      profile_layout: customizations.profile_layout,
      # Themes
      profile_theme: customizations.profile_theme,
      chat_theme: customizations.chat_theme,
      forum_theme: customizations.forum_theme,
      app_theme: customizations.app_theme,
      # Chat Styling
      bubble_style: customizations.bubble_style,
      message_effect: customizations.message_effect,
      reaction_style: customizations.reaction_style,
      # Chat Styling - Bubble Appearance
      bubble_color: customizations.bubble_color,
      bubble_opacity: customizations.bubble_opacity,
      bubble_radius: customizations.bubble_radius,
      bubble_shadow: customizations.bubble_shadow,
      # Chat Styling - Typography
      text_color: customizations.text_color,
      text_size: customizations.text_size,
      text_weight: customizations.text_weight,
      font_family: customizations.font_family,
      # Chat Styling - Animations
      entrance_animation: customizations.entrance_animation,
      hover_effect: customizations.hover_effect,
      animation_intensity: customizations.animation_intensity,
      # Chat Styling - Advanced Effects
      glass_effect: customizations.glass_effect,
      border_style: customizations.border_style,
      sound_effect: customizations.sound_effect,
      voice_visualizer_theme: customizations.voice_visualizer_theme,
      # Accessibility
      haptic_feedback: customizations.haptic_feedback,
      # Effects
      particle_effect: customizations.particle_effect,
      background_effect: customizations.background_effect,
      animation_speed: customizations.animation_speed,
      # Extensibility
      custom_config: customizations.custom_config,
      preset_name: customizations.preset_name,
      last_updated_at: customizations.last_updated_at,
      # Timestamps
      inserted_at: customizations.inserted_at,
      updated_at: customizations.updated_at
    }
  end
end
