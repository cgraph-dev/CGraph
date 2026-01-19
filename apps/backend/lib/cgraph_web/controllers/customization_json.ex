defmodule CGraphWeb.CustomizationJSON do
  @moduledoc """
  Renders user customizations as JSON.
  """

  alias CGraph.Customizations.UserCustomization

  @doc """
  Renders a single user_customization.
  """
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
      # Effects
      particle_effect: customizations.particle_effect,
      background_effect: customizations.background_effect,
      animation_speed: customizations.animation_speed,
      # Timestamps
      inserted_at: customizations.inserted_at,
      updated_at: customizations.updated_at
    }
  end
end
