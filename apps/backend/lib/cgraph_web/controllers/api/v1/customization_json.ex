defmodule CGraphWeb.API.V1.CustomizationJSON do
  @moduledoc """
  Renders user customizations as JSON for the V1 API.
  """

  alias CGraph.Customizations.UserCustomization

  @spec show(map()) :: map()
  def show(%{customizations: nil}) do
    %{data: nil}
  end

  def show(%{customizations: customizations}) do
    %{data: data(customizations)}
  end

  defp data(%UserCustomization{} = c) do
    %{
      id: c.id,
      user_id: c.user_id,
      avatar_border_id: c.avatar_border_id,
      title_id: c.title_id,
      equipped_badges: c.equipped_badges || [],
      profile_layout: c.profile_layout,
      profile_theme: c.profile_theme,
      chat_theme: c.chat_theme,
      forum_theme: c.forum_theme,
      app_theme: c.app_theme,
      bubble_style: c.bubble_style,
      message_effect: c.message_effect,
      reaction_style: c.reaction_style,
      bubble_color: c.bubble_color,
      bubble_opacity: c.bubble_opacity,
      bubble_radius: c.bubble_radius,
      bubble_shadow: c.bubble_shadow,
      text_color: c.text_color,
      text_size: c.text_size,
      text_weight: c.text_weight,
      font_family: c.font_family,
      entrance_animation: c.entrance_animation,
      hover_effect: c.hover_effect,
      animation_intensity: c.animation_intensity,
      glass_effect: c.glass_effect,
      border_style: c.border_style,
      sound_effect: c.sound_effect,
      voice_visualizer_theme: c.voice_visualizer_theme,
      haptic_feedback: c.haptic_feedback,
      particle_effect: c.particle_effect,
      background_effect: c.background_effect,
      animation_speed: c.animation_speed,
      custom_config: c.custom_config,
      preset_name: c.preset_name,
      last_updated_at: c.last_updated_at,
      inserted_at: c.inserted_at,
      updated_at: c.updated_at
    }
  end

  defp data(other) when is_map(other), do: other
  defp data(nil), do: nil
end
