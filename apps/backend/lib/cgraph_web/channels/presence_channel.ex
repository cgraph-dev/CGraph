defmodule CGraphWeb.PresenceChannel do
  @moduledoc """
  Global presence channel for WhatsApp-style real-time user status tracking.

  Handles:
  - User online/offline state broadcasting (friends only)
  - Last seen timestamp tracking
  - Custom status messages (away, busy, etc.)
  - Multi-device presence aggregation
  - Bulk presence queries for contact lists
  - Friend-filtered presence (non-friends won't see each other's status)

  Architecture follows WhatsApp patterns:
  - Immediate online status on app foreground
  - Grace period before marking offline (handles brief disconnects)
  - Last seen persisted to cache with 7-day TTL
  - Typing indicators delegated to room-specific channels
  - Presence only visible to friends
  """
  use CGraphWeb, :channel

  alias CGraph.Accounts.Friends
  alias CGraph.Presence

  @heartbeat_interval_ms 15_000
  @offline_grace_period_ms 8_000
  @bulk_presence_batch_size 100

  @impl true
  def join("presence:lobby", _params, socket) do
    user = socket.assigns.current_user

    if user do
      send(self(), :after_join)
      {:ok, assign(socket, :tracked, false)}
    else
      {:error, %{reason: "authentication_required"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    user = socket.assigns.current_user

    # Get user's friend IDs for presence filtering
    friend_ids = get_friend_ids(user.id)

    # Track user in global presence with device metadata
    # Using "lobby" as the room_id for the global presence channel
    Presence.track_user(socket, user.id, "lobby", %{
      device_type: socket.assigns[:device_type] || "unknown",
      platform: socket.assigns[:platform] || "web",
      app_state: "foreground"
    })

    # Push presence list filtered by friends to joining user
    presence_list = build_presence_map(Presence.list("users:online"), friend_ids)
    push(socket, "presence_state", %{users: presence_list})

    # Notify friends that this user is now online
    broadcast_to_friends(user.id, friend_ids, "friend_online", %{
      user_id: user.id,
      status: "online",
      online_at: DateTime.utc_now() |> DateTime.to_iso8601()
    })

    # Schedule periodic heartbeat
    :timer.send_interval(@heartbeat_interval_ms, self(), :heartbeat_tick)

    {:noreply, assign(socket, tracked: true, friend_ids: friend_ids)}
  end

  @impl true
  def handle_info(:heartbeat_tick, socket) do
    user = socket.assigns.current_user

    if socket.assigns[:tracked] do
      Presence.heartbeat(socket, user.id, "lobby")
    end

    {:noreply, socket}
  end

  @impl true
  def handle_in("heartbeat", _params, socket) do
    user = socket.assigns.current_user
    Presence.heartbeat(socket, user.id, "lobby")
    {:reply, :ok, socket}
  end

  @impl true
  def handle_in("set_status", %{"status" => status} = params, socket) do
    user = socket.assigns.current_user
    friend_ids = socket.assigns[:friend_ids] || get_friend_ids(user.id)

    case Presence.update_status(socket, user.id, "lobby", status) do
      {:ok, _} ->
        # Broadcast status change only to friends
        broadcast_to_friends(user.id, friend_ids, "friend_status_changed", %{
          user_id: user.id,
          status: status,
          status_message: params["status_message"],
          updated_at: DateTime.utc_now() |> DateTime.to_iso8601()
        })
        {:reply, :ok, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("set_app_state", %{"state" => app_state}, socket) when app_state in ["foreground", "background"] do
    user = socket.assigns.current_user

    meta_update = %{app_state: app_state, state_changed_at: DateTime.utc_now()}

    case Presence.update(socket, user.id, fn existing_meta ->
      Map.merge(existing_meta, meta_update)
    end) do
      {:ok, _} ->
        if app_state == "background" do
          # Record potential last seen when backgrounding
          Presence.record_last_seen(user.id)
        end
        {:reply, :ok, socket}

      {:error, _} ->
        {:reply, {:error, %{reason: "update_failed"}}, socket}
    end
  end

  def handle_in("set_app_state", _params, socket) do
    {:reply, {:error, %{reason: "invalid_app_state"}}, socket}
  end

  @impl true
  def handle_in("get_user_status", %{"user_id" => target_user_id}, socket) do
    user = socket.assigns.current_user

    # Only return presence if they are friends
    if Friends.are_friends?(user.id, target_user_id) do
      presence_data = case Presence.get_user_presence(target_user_id) do
        nil ->
          # User offline - check last seen
          last_seen = Presence.last_seen(target_user_id)
          %{
            online: false,
            last_seen: last_seen && DateTime.to_iso8601(last_seen),
            status: "offline"
          }

        merged when is_map(merged) ->
          # get_user_presence returns already merged presence
          %{
            online: true,
            status: merged[:status] || "online",
            status_message: merged[:status_message],
            last_active: merged[:last_active] && DateTime.to_iso8601(merged[:last_active])
          }
      end

      {:reply, {:ok, presence_data}, socket}
    else
      {:reply, {:ok, %{online: false, status: "unknown", hidden: true}}, socket}
    end
  end

  @impl true
  def handle_in("get_bulk_status", %{"user_ids" => user_ids}, socket) when is_list(user_ids) do
    user = socket.assigns.current_user
    friend_ids = socket.assigns[:friend_ids] || get_friend_ids(user.id)
    friend_ids_set = MapSet.new(friend_ids)

    # Limit batch size to prevent abuse
    limited_ids = Enum.take(user_ids, @bulk_presence_batch_size)

    # Only return status for friends
    friend_limited_ids = Enum.filter(limited_ids, &MapSet.member?(friend_ids_set, &1))

    # bulk_status returns {user_id, status_string} map
    status_map = Presence.bulk_status(friend_limited_ids)

    # Enrich with last_seen for offline users and convert to proper format
    enriched = Enum.map(limited_ids, fn user_id ->
      if MapSet.member?(friend_ids_set, user_id) do
        status = Map.get(status_map, user_id, "offline")
        is_online = status != "offline"

        base_data = %{
          online: is_online,
          status: status
        }

        data = if is_online do
          base_data
        else
          last_seen = Presence.last_seen(user_id)
          Map.put(base_data, :last_seen, last_seen && DateTime.to_iso8601(last_seen))
        end

        {user_id, data}
      else
        # Non-friend: return hidden status
        {user_id, %{online: false, status: "unknown", hidden: true}}
      end
    end)
    |> Map.new()

    {:reply, {:ok, %{users: enriched}}, socket}
  end

  def handle_in("get_bulk_status", _params, socket) do
    {:reply, {:error, %{reason: "user_ids_required"}}, socket}
  end

  @impl true
  def handle_in("refresh_friends", _params, socket) do
    user = socket.assigns.current_user

    # Refresh friend list (useful after adding/removing friends)
    friend_ids = get_friend_ids(user.id)

    # Push updated presence list filtered by new friends
    presence_list = build_presence_map(Presence.list("users:online"), friend_ids)
    push(socket, "presence_state", %{users: presence_list})

    {:reply, :ok, assign(socket, :friend_ids, friend_ids)}
  end

  @impl true
  def terminate(_reason, socket) do
    user = socket.assigns[:current_user]

    if user && socket.assigns[:tracked] do
      Presence.record_last_seen(user.id)

      # Notify friends that this user is going offline
      friend_ids = socket.assigns[:friend_ids] || get_friend_ids(user.id)
      broadcast_to_friends(user.id, friend_ids, "friend_offline", %{
        user_id: user.id,
        last_seen: DateTime.utc_now() |> DateTime.to_iso8601()
      })

      schedule_offline_check(user.id)
    end

    :ok
  end

  defp schedule_offline_check(user_id) do
    spawn(fn ->
      Process.sleep(@offline_grace_period_ms)
      broadcast_offline_if_disconnected(user_id)
    end)
  end

  defp broadcast_offline_if_disconnected(user_id) do
    unless Presence.user_online?(user_id) do
      Phoenix.PubSub.broadcast(
        CGraph.PubSub,
        "users:online",
        {:user_offline, user_id, DateTime.utc_now()}
      )
    end
  end

  # Get list of friend user IDs for the given user
  defp get_friend_ids(user_id) do
    Friends.list_friends(user_id)
    |> Enum.map(& &1.friend_id)
  end

  # Broadcast a message to all friends of a user
  defp broadcast_to_friends(user_id, friend_ids, event, payload) do
    # Normalize payload into presence update format for user channel
    presence_update =
      payload
      |> Map.put(:from_user_id, user_id)
      |> Map.put_new(:online, event != "friend_offline")
      |> Map.put_new(:status, if(event == "friend_offline", do: "offline", else: "online"))

    # Broadcast to each friend's personal presence_updates topic
    Enum.each(friend_ids, fn friend_id ->
      Phoenix.PubSub.broadcast(
        CGraph.PubSub,
        "user:#{friend_id}:presence_updates",
        {:presence_update, user_id, presence_update}
      )
    end)
  end

  # Private helpers

  defp build_presence_map(presence_list, friend_ids) when is_map(presence_list) do
    friend_ids_set = MapSet.new(friend_ids)

    presence_list
    |> Enum.filter(fn {user_id, _} -> MapSet.member?(friend_ids_set, user_id) end)
    |> Enum.map(fn {user_id, %{metas: metas}} ->
      merged = Presence.merge_multi_device_presence(metas)
      {user_id, %{
        online: true,
        status: merged[:status] || "online",
        device_count: length(metas),
        last_active: merged[:last_active]
      }}
    end)
    |> Map.new()
  end

  defp build_presence_map(_, _), do: %{}
end
