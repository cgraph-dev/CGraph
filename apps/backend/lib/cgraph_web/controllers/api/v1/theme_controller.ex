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
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Themes
  alias CGraphWeb.ErrorHelpers

  plug :require_auth

  action_fallback CGraphWeb.FallbackController

  @doc """
  GET /api/v1/me/theme
  Get the current user's theme preferences.
  """
  @spec me_show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def me_show(conn, _params) do
    user_id = conn.assigns.current_user.id
    theme = Themes.get_theme(user_id)
    render_data(conn, %{theme: theme})
  end

  @doc """
  PUT /api/v1/me/theme
  Update the current user's theme preferences.
  """
  @spec me_update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def me_update(conn, params) do
    user_id = conn.assigns.current_user.id
    theme_params = params["theme"] || params

    case Themes.update_theme(user_id, theme_params) do
      {:ok, theme} ->
        render_data(conn, %{theme: theme})

      {:error, :user_not_found} ->
        render_error(conn, 404, "User not found")

      {:error, reason} ->
        render_error(conn, 400, ErrorHelpers.safe_error_message(reason, context: "theme_update"))
    end
  end

  @doc """
  GET /api/v1/users/:id/theme
  Get a user's theme preferences.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => user_id}) do
    theme = Themes.get_theme(user_id)
    render_data(conn, %{theme: theme})
  end

  @doc """
  PUT /api/v1/users/:id/theme
  Update the current user's theme preferences.
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"id" => user_id} = params) do
    current_user = conn.assigns.current_user

    # Users can only update their own theme
    if current_user.id != user_id do
      render_error(conn, 403, "You can only update your own theme")
    else
      theme_params = params["theme"] || params

      case Themes.update_theme(user_id, theme_params) do
        {:ok, theme} ->
          render_data(conn, %{theme: theme})

        {:error, :user_not_found} ->
          render_error(conn, 404, "User not found")

        {:error, reason} ->
          render_error(conn, 400, ErrorHelpers.safe_error_message(reason, context: "theme_update"))
      end
    end
  end

  @doc """
  POST /api/v1/users/:id/theme/reset
  Reset user's theme to defaults.
  """
  @spec reset(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def reset(conn, %{"id" => user_id}) do
    current_user = conn.assigns.current_user

    if current_user.id != user_id do
      render_error(conn, 403, "You can only reset your own theme")
    else
      case Themes.reset_theme(user_id) do
        {:ok, theme} ->
          render_data(conn, %{theme: theme, reset: true})

        {:error, reason} ->
          render_error(conn, 400, ErrorHelpers.safe_error_message(reason, context: "theme_reset"))
      end
    end
  end

  @doc """
  POST /api/v1/users/themes/batch
  Batch fetch themes for multiple users.
  """
  @spec batch(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def batch(conn, %{"user_ids" => user_ids}) when is_list(user_ids) do
    themes = Themes.get_themes_batch(user_ids)
    render_data(conn, %{themes: themes})
  end

  def batch(conn, _params) do
    render_error(conn, 400, "user_ids must be a list")
  end

  @doc """
  GET /api/v1/themes/default
  Get the default theme configuration.
  """
  @spec default(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def default(conn, _params) do
    render_data(conn, %{theme: Themes.default_theme()})
  end

  @doc """
  GET /api/v1/themes/presets
  Get all available theme presets and options.
  """
  @spec presets(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def presets(conn, _params) do
    render_data(conn, %{
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
        |> render_error(401, "Authentication required")
        |> halt()

      _user ->
        conn
    end
  end
end
