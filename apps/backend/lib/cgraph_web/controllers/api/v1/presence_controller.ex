defmodule CGraphWeb.API.V1.PresenceController do
  @moduledoc """
  Controller for Presence/Online Status system.
  Real-time user presence tracking with heartbeat.

  ## Features
  - Online users list
  - Heartbeat for presence
  - Presence statistics
  - Location tracking (who's viewing what)
  """
  use CGraphWeb, :controller

  alias CGraph.Presence

  action_fallback CGraphWeb.FallbackController

  @max_per_page 200

  @doc """
  Get list of online users.
  """
  def online_users(conn, params) do
    opts = [
      page: parse_int(params["page"], 1),
      per_page: min(parse_int(params["per_page"], 50), @max_per_page),
      include_invisible: false,
      location: params["location"],
      forum_id: params["forum_id"],
      thread_id: params["thread_id"]
    ]

    {users, pagination} = Presence.list_online_users(opts)
    guests = Presence.count_guests()

    render(conn, :online,
      users: users,
      pagination: pagination,
      guests: guests,
      total_online: pagination[:total_count] + guests
    )
  end

  @doc """
  Send heartbeat to maintain presence.
  """
  def heartbeat(conn, params) do
    user = conn.assigns.current_user

    location = %{
      page: params["page"],
      forum_id: params["forum_id"],
      thread_id: params["thread_id"],
      action: params["action"]
    }

    with {:ok, _} <- Presence.update_presence(user.id, location) do
      json(conn, %{status: "ok", timestamp: DateTime.utc_now()})
    end
  end

  @doc """
  Get presence statistics.
  """
  def stats(conn, _params) do
    stats = Presence.get_stats()
    render(conn, :stats, stats: stats)
  end

  @doc """
  Get who's viewing a specific page/resource.
  """
  def whos_here(conn, params) do
    location = %{
      forum_id: params["forum_id"],
      thread_id: params["thread_id"],
      page: params["page"]
    }

    users = Presence.get_users_at_location(location)
    render(conn, :whos_here, users: users, location: location)
  end

  @doc """
  Get user's current location/status.
  """
  def user_status(conn, %{"user_id" => user_id}) do
    current_user = conn.assigns[:current_user]

    with {:ok, status} <- Presence.get_user_status(user_id, current_user) do
      render(conn, :user_status, status: status)
    end
  end

  @doc """
  Update visibility settings (online/invisible).
  """
  def update_visibility(conn, %{"visible" => visible}) do
    user = conn.assigns.current_user

    with {:ok, _} <- Presence.update_visibility(user.id, parse_bool(visible, true)) do
      json(conn, %{status: "ok", visible: parse_bool(visible, true)})
    end
  end

  # ========================================
  # HELPERS
  # ========================================

  defp parse_int(nil, default), do: default
  defp parse_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {int, _} -> int
      :error -> default
    end
  end
  defp parse_int(val, _default) when is_integer(val), do: val
  defp parse_int(_, default), do: default

  defp parse_bool(nil, default), do: default
  defp parse_bool("true", _), do: true
  defp parse_bool("false", _), do: false
  defp parse_bool(true, _), do: true
  defp parse_bool(false, _), do: false
  defp parse_bool(_, default), do: default
end
