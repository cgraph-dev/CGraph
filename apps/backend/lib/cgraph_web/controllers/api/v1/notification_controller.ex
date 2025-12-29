defmodule CgraphWeb.API.V1.NotificationController do
  @moduledoc """
  Handles user notifications.
  Supports listing, marking as read, and managing notification preferences.
  """
  use CgraphWeb, :controller

  alias Cgraph.Notifications

  action_fallback CgraphWeb.FallbackController

  @doc """
  List user's notifications.
  GET /api/v1/notifications
  """
  def index(conn, params) do
    user = conn.assigns.current_user
    page = Map.get(params, "page", "1") |> String.to_integer()
    per_page = Map.get(params, "per_page", "20") |> String.to_integer() |> min(50)
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
  def mark_all_read(conn, params) do
    user = conn.assigns.current_user
    type = Map.get(params, "type") # Optional filter
    
    {:ok, count} = Notifications.mark_all_as_read(user, type: type)
    
    json(conn, %{data: %{marked_count: count}})
  end

  @doc """
  Delete a notification.
  DELETE /api/v1/notifications/:id
  """
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
  def delete_all(conn, params) do
    user = conn.assigns.current_user
    type = Map.get(params, "type")
    
    {:ok, count} = Notifications.delete_all_notifications(user, type: type)
    
    json(conn, %{data: %{deleted_count: count}})
  end

  @doc """
  Get unread notification count.
  GET /api/v1/notifications/unread_count
  """
  def unread_count(conn, _params) do
    user = conn.assigns.current_user
    
    counts = Notifications.get_unread_counts(user)
    
    json(conn, %{
      data: %{
        total: counts.total,
        by_type: counts.by_type
      }
    })
  end

  @doc """
  Get notification settings.
  GET /api/v1/notifications/settings
  """
  def settings(conn, _params) do
    user = conn.assigns.current_user
    
    settings = Notifications.get_notification_settings(user)
    render(conn, :settings, settings: settings)
  end

  @doc """
  Update notification settings.
  PUT /api/v1/notifications/settings
  """
  def update_settings(conn, params) do
    user = conn.assigns.current_user
    settings_params = Map.get(params, "settings", %{})
    
    with {:ok, settings} <- Notifications.update_notification_settings(user, settings_params) do
      render(conn, :settings, settings: settings)
    end
  end
end
