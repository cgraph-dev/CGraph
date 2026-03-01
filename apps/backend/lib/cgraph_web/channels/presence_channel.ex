defmodule CGraphWeb.PresenceChannel do
  @moduledoc """
  Global presence channel for real-time user status tracking.

  Handles:
  - User online/offline state broadcasting (friends only)
  - Last seen timestamp tracking
  - Custom status messages (away, busy, etc.)
  - Multi-device presence aggregation
  - Bulk presence queries for contact lists
  - Friend-filtered presence (non-friends won't see each other's status)

  Architecture follows industry-standard patterns:
  - Immediate online status on app foreground
  - Grace period before marking offline (handles brief disconnects)
  - Last seen persisted to cache with 7-day TTL
  - Typing indicators delegated to room-specific channels
  - Presence only visible to friends
  """
  use CGraphWeb, :channel

  alias CGraph.Accounts.Friends
  alias CGraph.Accounts.Friends.Queries, as: FriendQueries
  alias CGraph.Accounts.User
  alias CGraph.Presence
  alias CGraph.Repo

  @heartbeat_interval_ms 15_000
  @offline_grace_period_ms 8_000
  @bulk_presence_batch_size 100

  @doc "Joins the global presence channel for real-time user status tracking."
  @impl true
  @spec join(String.t(), map(), Phoenix.Socket.t()) :: {:ok, Phoenix.Socket.t()} | {:error, map()}
  def join("presence:lobby", _params, socket) do
    user = socket.assigns.current_user

    if user do
      send(self(), :after_join)
      {:ok, assign(socket, :tracked, false)}
    else
      {:error, %{reason: "authentication_required"}}
    end
  end

  @doc "Handles asynchronous presence messages and heartbeat ticks."
  @impl true
  @spec handle_info(term(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()}
  def handle_info(:after_join, socket) do
    user = socket.assigns.current_user

    # Restore persisted status from DB on reconnect
    user = Repo.get!(User, user.id)
    {restored_status, restored_meta} = restore_persisted_status(user)

    # Get user's friend IDs for presence filtering, excluding blocked users
    friend_ids = get_friend_ids(user.id)
    blocked_ids = FriendQueries.get_blocked_user_ids(user.id)
    blocked_set = MapSet.new(blocked_ids)
    friend_ids = Enum.reject(friend_ids, &MapSet.member?(blocked_set, &1))

    # Track user in global presence with device metadata + restored status
    # Using "lobby" as the room_id for the global presence channel
    track_meta =
      %{
        device_type: socket.assigns[:device_type] || "unknown",
        platform: socket.assigns[:platform] || "web",
        app_state: "foreground"
      }
      |> Map.merge(restored_meta)

    Presence.track_user(socket, user.id, "lobby", track_meta)

    # Push presence list filtered by friends to joining user
    # Uses pipelined Redis lookups for friends only — O(F) not O(all users)
    presence_list = build_friend_presence(friend_ids)
    push(socket, "presence_state", %{users: presence_list})

    # Push restored status back to the reconnecting user so the client can hydrate
    if user.status_message || user.custom_status do
      push(socket, "status_restored", %{
        status: restored_status,
        status_message: user.status_message,
        custom_status: user.custom_status,
        status_expires_at: user.status_expires_at && DateTime.to_iso8601(user.status_expires_at)
      })
    end

    # Notify friends that this user is now online (with restored status if any)
    broadcast_to_friends(user.id, friend_ids, "friend_online", %{
      user_id: user.id,
      status: restored_status,
      status_message: user.status_message,
      custom_status: user.custom_status,
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

  # Catch-all for unhandled messages
  def handle_info(_msg, socket), do: {:noreply, socket}

  @doc "Handles incoming presence events from the client."
  @impl true
  @spec handle_in(String.t(), map(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()} | {:reply, term(), Phoenix.Socket.t()}
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
        # Persist status to database so it survives reconnections
        status_message = params["status_message"]
        custom_status = params["custom_status"]
        expires_in = params["expires_in"]

        expires_at =
          if is_integer(expires_in) and expires_in > 0 do
            DateTime.utc_now()
            |> DateTime.add(expires_in, :second)
            |> DateTime.truncate(:second)
          else
            nil
          end

        db_attrs = %{
          status: status,
          status_message: status_message,
          custom_status: custom_status,
          status_expires_at: expires_at
        }

        user
        |> Ecto.Changeset.change(db_attrs)
        |> Repo.update()

        # Broadcast status change only to friends
        broadcast_to_friends(user.id, friend_ids, "friend_status_changed", %{
          user_id: user.id,
          status: status,
          status_message: status_message,
          custom_status: custom_status,
          expires_at: expires_at && DateTime.to_iso8601(expires_at),
          updated_at: DateTime.utc_now() |> DateTime.to_iso8601()
        })
        {:reply, :ok, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("set_dnd", %{"duration_minutes" => minutes}, socket)
      when is_integer(minutes) and minutes > 0 do
    user = socket.assigns.current_user
    friend_ids = socket.assigns[:friend_ids] || get_friend_ids(user.id)

    # Save DND to settings
    CGraph.Accounts.Settings.set_dnd(user.id, minutes)

    # Update presence to "dnd"
    case Presence.update_status(socket, user.id, "lobby", "dnd") do
      {:ok, _} ->
        broadcast_to_friends(user.id, friend_ids, "friend_status_changed", %{
          user_id: user.id,
          status: "dnd",
          updated_at: DateTime.utc_now() |> DateTime.to_iso8601()
        })
        {:reply, :ok, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("set_dnd", %{"indefinite" => true}, socket) do
    user = socket.assigns.current_user
    friend_ids = socket.assigns[:friend_ids] || get_friend_ids(user.id)

    CGraph.Accounts.Settings.set_dnd(user.id, :indefinite)

    case Presence.update_status(socket, user.id, "lobby", "dnd") do
      {:ok, _} ->
        broadcast_to_friends(user.id, friend_ids, "friend_status_changed", %{
          user_id: user.id,
          status: "dnd",
          updated_at: DateTime.utc_now() |> DateTime.to_iso8601()
        })
        {:reply, :ok, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: reason}}, socket}
    end
  end

  @impl true
  def handle_in("clear_dnd", _params, socket) do
    user = socket.assigns.current_user
    friend_ids = socket.assigns[:friend_ids] || get_friend_ids(user.id)

    CGraph.Accounts.Settings.clear_dnd(user.id)

    # Restore to online status
    case Presence.update_status(socket, user.id, "lobby", "online") do
      {:ok, _} ->
        broadcast_to_friends(user.id, friend_ids, "friend_status_changed", %{
          user_id: user.id,
          status: "online",
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

    # Refresh friend list (useful after adding/removing/blocking friends)
    friend_ids = get_friend_ids(user.id)
    blocked_ids = FriendQueries.get_blocked_user_ids(user.id)
    blocked_set = MapSet.new(blocked_ids)
    friend_ids = Enum.reject(friend_ids, &MapSet.member?(blocked_set, &1))

    # Push updated presence list filtered by new friends
    # Uses pipelined Redis lookups — O(F) not O(all users)
    presence_list = build_friend_presence(friend_ids)
    push(socket, "presence_state", %{users: presence_list})

    {:reply, :ok, assign(socket, :friend_ids, friend_ids)}
  end

  # Catch-all for unhandled events
  def handle_in(_event, _params, socket) do
    {:reply, {:error, %{reason: "unhandled event"}}, socket}
  end

  @doc "Handles channel termination and broadcasts offline status to friends."
  @impl true
  @spec terminate(term(), Phoenix.Socket.t()) :: :ok
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

  @spec schedule_offline_check(String.t()) :: {:ok, pid()}
  defp schedule_offline_check(user_id) do
    Task.Supervisor.start_child(CGraph.TaskSupervisor, fn ->
      Process.sleep(@offline_grace_period_ms)
      broadcast_offline_if_disconnected(user_id)
    end)
  end

  @spec broadcast_offline_if_disconnected(String.t()) :: :ok
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
  @spec get_friend_ids(String.t()) :: list(String.t())
  defp get_friend_ids(user_id) do
    Friends.list_friends(user_id)
    |> Enum.map(& &1.friend_id)
  end

  # Restore persisted status from DB on reconnect.
  # Returns {status, metadata_map} where expired statuses are cleared.
  @spec restore_persisted_status(%User{}) :: {String.t(), map()}
  defp restore_persisted_status(user) do
    now = DateTime.utc_now()

    expired? =
      user.status_expires_at != nil and
        DateTime.compare(user.status_expires_at, now) == :lt

    if expired? do
      # Status has expired — clear from DB
      user
      |> Ecto.Changeset.change(%{
        status_message: nil,
        custom_status: nil,
        status_expires_at: nil,
        status: "online"
      })
      |> Repo.update()

      {"online", %{}}
    else
      # Restore persisted status into presence metadata
      status = user.status || "online"

      meta =
        %{}
        |> then(fn m ->
          if user.status_message, do: Map.put(m, :status_message, user.status_message), else: m
        end)
        |> then(fn m ->
          if user.custom_status, do: Map.put(m, :custom_status, user.custom_status), else: m
        end)

      {status, meta}
    end
  end

  # Broadcast a message to all friends of a user
  @spec broadcast_to_friends(String.t(), list(String.t()), String.t(), map()) :: :ok
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

  # Build presence map for friends only using pipelined Redis lookups — O(F)
  # Instead of loading ALL online users and filtering, query only friends' statuses.
  @spec build_friend_presence(list(String.t())) :: map()
  defp build_friend_presence(friend_ids) when is_list(friend_ids) and friend_ids != [] do
    statuses = Presence.bulk_status(friend_ids)

    friend_ids
    |> Enum.filter(fn fid -> Map.get(statuses, fid) not in [nil, "offline"] end)
    |> Enum.map(fn fid ->
      presence = Presence.get_user_presence(fid) || %{}
      {fid, %{
        online: true,
        status: Map.get(statuses, fid, "online"),
        last_active: presence[:last_active]
      }}
    end)
    |> Map.new()
  end
  defp build_friend_presence(_), do: %{}
end
