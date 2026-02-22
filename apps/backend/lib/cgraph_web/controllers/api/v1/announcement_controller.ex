defmodule CGraphWeb.API.V1.AnnouncementController do
  @moduledoc """
  Controller for Announcements.
  Implements MyBB-style announcements system with global and forum-specific announcements.

  ## Features
  - Global announcements
  - Forum-specific announcements
  - Read tracking
  - Dismissible announcements
  - Visibility by user group
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2]

  alias CGraph.Announcements

  action_fallback CGraphWeb.FallbackController

  @doc """
  List all active announcements for the current user.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    user = conn.assigns.current_user

    opts = [
      forum_id: Map.get(params, "forum_id"),
      include_global: Map.get(params, "include_global", "true") == "true",
      include_dismissed: Map.get(params, "include_dismissed", "false") == "true"
    ]

    announcements = Announcements.list_for_user(user, opts)
    render(conn, :index, announcements: announcements)
  end

  @doc """
  Get a single announcement.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, announcement} <- Announcements.get(id),
         :ok <- authorize_view(announcement, user) do
      render(conn, :show, announcement: announcement)
    end
  end

  @doc """
  Mark an announcement as read.
  """
  @spec mark_read(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def mark_read(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, announcement} <- Announcements.get(id),
         {:ok, _} <- Announcements.mark_read(announcement, user) do
      render_data(conn, %{success: true, read_at: DateTime.utc_now()})
    end
  end

  @doc """
  Dismiss an announcement (won't show again).
  """
  @spec dismiss(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def dismiss(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    with {:ok, announcement} <- Announcements.get(id),
         {:ok, _} <- Announcements.dismiss(announcement, user) do
      render_data(conn, %{success: true, dismissed_at: DateTime.utc_now()})
    end
  end

  # ========================================
  # HELPERS
  # ========================================

  defp authorize_view(announcement, user) do
    if Announcements.visible_to_user?(announcement, user) do
      :ok
    else
      {:error, :not_found}
    end
  end
end
