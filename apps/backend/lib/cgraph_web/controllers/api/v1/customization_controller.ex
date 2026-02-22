defmodule CGraphWeb.API.V1.CustomizationController do
  @moduledoc """
  Manages user profile customizations.

  Provides endpoints for retrieving and updating user customizations
  including chat bubble styles, profile themes, avatar borders, and other
  visual personalization options.
  """

  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2]

  alias CGraph.Accounts
  alias CGraph.Customizations

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/users/:id/customizations
  Fetches all customizations for a user.
  """
  def show(conn, %{"id" => user_id}) do
    with {:ok, customizations} <- Customizations.get_user_customizations(user_id) do
      conn
      |> put_resp_header("cache-control", "public, max-age=300")
      |> render(:show, customizations: customizations)
    end
  end

  @doc """
  PUT /api/v1/users/:id/customizations
  Updates all customizations for a user.
  """
  def update(conn, %{"id" => user_id} = params) do
    customization_params = Map.drop(params, ["id"])

    with :ok <- authorize_customization_write(conn, user_id),
         {:ok, customizations} <- Customizations.update_user_customizations(user_id, customization_params) do
      render(conn, :show, customizations: customizations)
    end
  end

  @doc """
  PATCH /api/v1/users/:id/customizations
  Updates specific customization fields.
  """
  def patch(conn, %{"id" => user_id} = params) do
    customization_params = Map.drop(params, ["id"])

    with :ok <- authorize_customization_write(conn, user_id),
         {:ok, customizations} <- Customizations.update_user_customizations(user_id, customization_params) do
      render(conn, :show, customizations: customizations)
    end
  end

  @doc """
  DELETE /api/v1/users/:id/customizations
  Resets customizations to defaults.
  """
  def delete(conn, %{"id" => user_id}) do
    with :ok <- authorize_customization_write(conn, user_id),
         {:ok, _customizations} <- Customizations.delete_user_customizations(user_id),
         {:ok, new_customizations} <- Customizations.create_default_customizations(user_id) do
      render(conn, :show, customizations: new_customizations)
    end
  end

  @doc """
  GET /api/v1/me/customizations
  Fetches all customizations for the authenticated user.
  Optimized with caching headers for performance at scale.
  """
  def my_customizations(conn, _params) do
    user = conn.assigns.current_user

    with {:ok, customizations} <- Customizations.get_user_customizations(user.id) do
      conn
      |> put_resp_header("cache-control", "private, max-age=60")
      |> render(:show, customizations: customizations)
    end
  end

  @doc """
  PATCH /api/v1/me/customizations
  Updates specific customization fields for the authenticated user.

  Accepts ALL 20 chat customization fields:
  - Bubble appearance: bubble_style, bubble_color, bubble_opacity, bubble_radius, bubble_shadow
  - Typography: text_color, text_size, text_weight, font_family
  - Animations: entrance_animation, hover_effect, animation_intensity, message_effect
  - Effects: glass_effect, border_style, particle_effect, sound_effect, voice_visualizer_theme
  - Other: reaction_style, haptic_feedback, preset_name

  Designed for scale:
  - Validates all inputs (ranges, formats, size limits)
  - Partial updates only (unchanged fields not touched)
  - Optimistic concurrency with last_updated_at tracking
  - Returns full customization state for client sync
  """
  def update_my_customizations(conn, params) do
    user = conn.assigns.current_user

    # Whitelist allowed customization fields
    allowed_fields = [
      # Identity
      "avatar_border_id", "title_id", "equipped_badges", "profile_layout",
      # Themes
      "profile_theme", "chat_theme", "forum_theme", "app_theme",
      # Chat Styling - Core
      "bubble_style", "message_effect", "reaction_style",
      # Chat Styling - Bubble Appearance
      "bubble_color", "bubble_opacity", "bubble_radius", "bubble_shadow",
      # Chat Styling - Typography
      "text_color", "text_size", "text_weight", "font_family",
      # Chat Styling - Animations
      "entrance_animation", "hover_effect", "animation_intensity",
      # Chat Styling - Advanced Effects
      "glass_effect", "border_style", "particle_effect", "sound_effect",
      "voice_visualizer_theme",
      # Accessibility
      "haptic_feedback",
      # Global Effects
      "background_effect", "animation_speed",
      # Extensibility
      "custom_config", "preset_name"
    ]

    customization_params = Map.take(params, allowed_fields)

    with {:ok, customizations} <- Customizations.update_user_customizations(user.id, customization_params) do
      # Keep user profile avatar border in sync when updated via customizations
      case Map.get(customization_params, "avatar_border_id") do
        nil -> :ok
        border_id -> Accounts.update_user(user, %{avatar_border_id: border_id})
      end

      render_data(conn, serialize_customizations(customizations))
    end
  end

  @doc """
  DELETE /api/v1/me/customizations
  Resets the authenticated user's customizations to defaults.
  """
  def delete_my_customizations(conn, _params) do
    user = conn.assigns.current_user

    with {:ok, _customizations} <- Customizations.delete_user_customizations(user.id),
         {:ok, new_customizations} <- Customizations.create_default_customizations(user.id) do
      render_data(conn, serialize_customizations(new_customizations))
    end
  end

  defp authorize_customization_write(conn, user_id) do
    current_user = conn.assigns.current_user

    cond do
      is_nil(current_user) ->
        {:error, :unauthorized}

      current_user.id == user_id ->
        :ok

      current_user.is_admin ->
        :ok

      true ->
        {:error, :forbidden}
    end
  end

  # Serialize customizations for API response.
  # Decomposed into cohesive sections.
  defp serialize_customizations(c) do
    Map.merge(serialize_identity(c), serialize_themes(c))
    |> Map.merge(serialize_chat_styling(c))
    |> Map.merge(serialize_effects(c))
    |> Map.merge(serialize_metadata(c))
  end

  defp serialize_identity(c) do
    %{
      avatar_border_id: c.avatar_border_id,
      title_id: c.title_id,
      equipped_badges: c.equipped_badges || [],
      profile_layout: c.profile_layout
    }
  end

  defp serialize_themes(c) do
    %{
      profile_theme: c.profile_theme,
      chat_theme: c.chat_theme,
      forum_theme: c.forum_theme,
      app_theme: c.app_theme
    }
  end

  defp serialize_chat_styling(c) do
    %{
      # Core
      bubble_style: c.bubble_style,
      message_effect: c.message_effect,
      reaction_style: c.reaction_style,
      # Bubble Appearance
      bubble_color: c.bubble_color,
      bubble_opacity: c.bubble_opacity || 100,
      bubble_radius: c.bubble_radius || 16,
      bubble_shadow: c.bubble_shadow || "medium",
      # Typography
      text_color: c.text_color,
      text_size: c.text_size || 14,
      text_weight: c.text_weight || "400",
      font_family: c.font_family || "Inter",
      # Animations
      entrance_animation: c.entrance_animation || "fade",
      hover_effect: c.hover_effect || "lift",
      animation_intensity: c.animation_intensity || "medium"
    }
  end

  defp serialize_effects(c) do
    %{
      glass_effect: c.glass_effect || "default",
      border_style: c.border_style || "none",
      particle_effect: c.particle_effect,
      sound_effect: c.sound_effect,
      voice_visualizer_theme: c.voice_visualizer_theme || "cyber_blue",
      haptic_feedback: c.haptic_feedback,
      background_effect: c.background_effect || "solid",
      animation_speed: c.animation_speed || "normal",
      custom_config: c.custom_config || %{},
      preset_name: c.preset_name
    }
  end

  defp serialize_metadata(c) do
    %{
      last_updated_at: c.last_updated_at,
      updated_at: c.updated_at
    }
  end
end
