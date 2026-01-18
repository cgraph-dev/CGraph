defmodule CGraphWeb.API.V1.ThemeController do
  @moduledoc """
  Theme API Controller - User theme preferences endpoints.

  Allows users to:
  - Get their current theme
  - Update theme preferences
  - Reset to defaults
  - Get other users' themes (for display)
  - Batch fetch themes (for chat/forums)
  """

  use CGraphWeb, :controller

  alias CGraph.Themes

  plug :require_auth

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/users/:id/theme
  Get a user's theme preferences.
  """
  def show(conn, %{"id" => user_id}) do
    theme = Themes.get_theme(user_id)
    json(conn, %{theme: theme})
  end

  @doc """
  PUT /api/v1/users/:id/theme
  Update the current user's theme preferences.
  """
  def update(conn, %{"id" => user_id} = params) do
    current_user = conn.assigns.current_user

    # Users can only update their own theme
    if current_user.id != user_id do
      conn
      |> put_status(403)
      |> json(%{error: "You can only update your own theme"})
    else
      theme_params = params["theme"] || params

      case Themes.update_theme(user_id, theme_params) do
        {:ok, theme} ->
          json(conn, %{theme: theme})

        {:error, :user_not_found} ->
          conn
          |> put_status(404)
          |> json(%{error: "User not found"})

        {:error, reason} ->
          conn
          |> put_status(400)
          |> json(%{error: inspect(reason)})
      end
    end
  end

  @doc """
  POST /api/v1/users/:id/theme/reset
  Reset user's theme to defaults.
  """
  def reset(conn, %{"id" => user_id}) do
    current_user = conn.assigns.current_user

    if current_user.id != user_id do
      conn
      |> put_status(403)
      |> json(%{error: "You can only reset your own theme"})
    else
      case Themes.reset_theme(user_id) do
        {:ok, theme} ->
          json(conn, %{theme: theme, reset: true})

        {:error, reason} ->
          conn
          |> put_status(400)
          |> json(%{error: inspect(reason)})
      end
    end
  end

  @doc """
  POST /api/v1/users/themes/batch
  Batch fetch themes for multiple users.
  """
  def batch(conn, %{"user_ids" => user_ids}) when is_list(user_ids) do
    themes = Themes.get_themes_batch(user_ids)
    json(conn, %{themes: themes})
  end

  def batch(conn, _params) do
    conn
    |> put_status(400)
    |> json(%{error: "user_ids must be a list"})
  end

  @doc """
  GET /api/v1/themes/default
  Get the default theme configuration.
  """
  def default(conn, _params) do
    json(conn, %{theme: Themes.default_theme()})
  end

  @doc """
  GET /api/v1/themes/presets
  Get all available theme presets and options.
  """
  def presets(conn, _params) do
    json(conn, %{
      colorPresets: [
        "emerald", "purple", "cyan", "orange", "pink", 
        "gold", "crimson", "arctic", "sunset", "midnight", 
        "forest", "ocean"
      ],
      avatarBorders: [
        %{id: "none", label: "None", premium: false},
        %{id: "static", label: "Static", premium: false},
        %{id: "glow", label: "Glow", premium: false},
        %{id: "pulse", label: "Pulse", premium: false},
        %{id: "rotate", label: "Rotate", premium: false},
        %{id: "fire", label: "Fire", premium: true},
        %{id: "ice", label: "Ice", premium: true},
        %{id: "electric", label: "Electric", premium: true},
        %{id: "legendary", label: "Legendary", premium: true},
        %{id: "mythic", label: "Mythic", premium: true}
      ],
      chatBubbleStyles: [
        "default", "rounded", "sharp", "cloud", 
        "modern", "retro", "bubble", "glassmorphism"
      ],
      visualEffects: [
        %{id: "minimal", label: "Minimal", premium: false},
        %{id: "glassmorphism", label: "Glassmorphism", premium: false},
        %{id: "neon", label: "Neon", premium: true},
        %{id: "holographic", label: "Holographic", premium: true},
        %{id: "aurora", label: "Aurora", premium: true},
        %{id: "cyberpunk", label: "Cyberpunk", premium: true}
      ],
      entranceAnimations: ["slide", "fade", "scale", "bounce", "flip", "none"],
      animationSpeeds: ["slow", "normal", "fast"]
    })
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp require_auth(conn, _opts) do
    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(401)
        |> json(%{error: "Authentication required"})
        |> halt()

      _user ->
        conn
    end
  end
end
