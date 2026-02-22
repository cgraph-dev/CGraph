defmodule CGraphWeb.API.V1.NotificationController do
  @moduledoc """
  Handles user notifications.
  Supports listing, marking as read, and managing notification preferences.
  """
  use CGraphWeb, :controller
  import CGraphWeb.Helpers.ParamParser
  import CGraphWeb.ControllerHelpers, only: [render_data: 2]

  alias CGraph.Notifications

  action_fallback CGraphWeb.FallbackController

  @max_per_page 50

  @doc """
  List user's notifications.
  GET /api/v1/notifications
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    user = conn.assigns.current_user
    page = parse_int(params["page"], 1, min: 1)
    per_page = parse_int(params["per_page"], 20, min: 1, max: @max_per_page)
    filter = Map.get(params, "filter", "all") # all, unread
    type = Map.get(params, "type") # Optional: message, mention, friend, group, forum

    {notifications, meta} = Notifications.list_notifications(user,
      page: page,
      per_page: per_page,
      filter: filter,
      type: type
    )

    render(conn, :index, notifications: notifications, meta: meta)
  end

  @doc """
  Get a specific notification.
  GET /api/v1/notifications/:id
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => notification_id}) do
    user = conn.assigns.current_user

    with {:ok, notification} <- Notifications.get_notification(user, notification_id) do
      render(conn, :show, notification: notification)
    end
  end

  @doc """
  Mark a notification as read.
  PUT /api/v1/notifications/:id/read
  """
  @spec mark_read(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def mark_read(conn, %{"id" => notification_id}) do
    user = conn.assigns.current_user

    with {:ok, notification} <- Notifications.get_notification(user, notification_id),
         {:ok, updated} <- Notifications.mark_as_read(notification) do
      render(conn, :show, notification: updated)
    end
  end

  @doc """
  Mark a notification as unread.
  DELETE /api/v1/notifications/:id/read
  """
  @spec mark_unread(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def mark_unread(conn, %{"id" => notification_id}) do
    user = conn.assigns.current_user

    with {:ok, notification} <- Notifications.get_notification(user, notification_id),
         {:ok, updated} <- Notifications.mark_as_unread(notification) do
      render(conn, :show, notification: updated)
    end
  end

  @doc """
  Mark all notifications as read.
  PUT /api/v1/notifications/read_all
  """
  @spec mark_all_read(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def mark_all_read(conn, params) do
    user = conn.assigns.current_user
    type = Map.get(params, "type") # Optional filter

    {:ok, count} = Notifications.mark_all_as_read(user, type: type)

    render_data(conn, %{marked_count: count})
  end

  @doc """
  Delete a notification.
  DELETE /api/v1/notifications/:id
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"id" => notification_id}) do
    user = conn.assigns.current_user

    with {:ok, notification} <- Notifications.get_notification(user, notification_id),
         {:ok, _} <- Notifications.delete_notification(notification) do
      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Delete all notifications.
  DELETE /api/v1/notifications
  """
  @spec delete_all(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete_all(conn, params) do
    user = conn.assigns.current_user
    type = Map.get(params, "type")

    {:ok, count} = Notifications.delete_all_notifications(user, type: type)

    render_data(conn, %{deleted_count: count})
  end

  @doc """
  Get unread notification count.
  GET /api/v1/notifications/unread_count
  """
  @spec unread_count(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def unread_count(conn, _params) do
    user = conn.assigns.current_user

    counts = Notifications.get_unread_counts(user)

    render_data(conn, %{
      total: counts.total,
      by_type: counts.by_type
    })
  end

  @doc """
  Get notification settings.
  GET /api/v1/notifications/settings
  """
  @spec settings(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def settings(conn, _params) do
    user = conn.assigns.current_user

    settings = Notifications.get_notification_settings(user)
    render(conn, :settings, settings: settings)
  end

  @doc """
  Update notification settings.
  PUT /api/v1/notifications/settings
  """
  @spec update_settings(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update_settings(conn, params) do
    user = conn.assigns.current_user
    settings_params = Map.get(params, "settings", %{})

    with {:ok, settings} <- Notifications.update_notification_settings(user, settings_params) do
      render(conn, :settings, settings: settings)
    end
  end
end
