defmodule Cgraph.Presence do
  @moduledoc """
  Real-time user presence tracking with multi-device support.
  
  ## Overview
  
  Tracks online users and their status across distributed nodes:
  
  - **Online/Offline Status**: Real-time online detection
  - **Typing Indicators**: Per-conversation typing with auto-timeout
  - **Last Seen**: Track last activity timestamp
  - **Multi-Device**: Aggregate presence across devices
  - **Custom Status**: User-defined status messages
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     PRESENCE SYSTEM                             │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   Node A                                    Node B              │
  │   ┌─────────────────────┐    CRDT          ┌──────────────────┐│
  │   │ Phoenix.Presence    │◄──Sync──────────►│ Phoenix.Presence ││
  │   │  ├── user_1: {...}  │                  │  ├── user_3: {..}││
  │   │  └── user_2: {...}  │                  │  └── user_4: {..}││
  │   └─────────────────────┘                  └──────────────────┘│
  │                                                                  │
  │   ┌─────────────────────────────────────────────────────────┐  │
  │   │                    Cgraph.Presence                        │  │
  │   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │  │
  │   │  │ Track   │  │ Update  │  │  List   │  │ Typing  │     │  │
  │   │  │ User    │  │ Status  │  │ Online  │  │ Indicator│     │  │
  │   │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │  │
  │   └─────────────────────────────────────────────────────────┘  │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Usage
  
      # Track user as online in a room
      Presence.track_user(socket, user_id, room_id, %{status: "online"})
      
      # Update typing status
      Presence.update_typing(socket, user_id, room_id, true)
      
      # Get online users in a room
      users = Presence.list_room_users(room_id)
      
      # Check if user is online globally
      true = Presence.user_online?(user_id)
      
      # Get bulk status
      statuses = Presence.bulk_status(["user1", "user2", "user3"])
  
  ## Status Types
  
  | Status | Description |
  |--------|-------------|
  | `online` | User is active |
  | `away` | User is idle (>5 min inactivity) |
  | `busy` | Do not disturb |
  | `invisible` | Appear offline to others |
  | `offline` | Not connected |
  
  ## Telemetry Events
  
  - `[:cgraph, :presence, :join]` - User came online
  - `[:cgraph, :presence, :leave]` - User went offline
  - `[:cgraph, :presence, :update]` - Status changed
  - `[:cgraph, :presence, :typing]` - Typing indicator changed
  """
  
  use Phoenix.Presence,
    otp_app: :cgraph,
    pubsub_server: Cgraph.PubSub

  require Logger
  
  @typing_timeout_ms 5_000
  @last_seen_ttl_ms 604_800_000
  # Idle timeout is 5 minutes (300_000ms) - used for auto-away detection
  
  @valid_statuses ~w(online away busy invisible offline)
  
  # ---------------------------------------------------------------------------
  # Required Callbacks for Phoenix.Presence
  # ---------------------------------------------------------------------------
  
  @doc """
  Initialize presence state.
  Required when implementing handle_metas/4 callback.
  """
  @impl true
  def init(_opts) do
    {:ok, %{}}
  end
  
  # ---------------------------------------------------------------------------
  # User Tracking
  # ---------------------------------------------------------------------------
  
  @doc """
  Track a user's online status in a specific room.
  
  ## Parameters
  
  - `socket` - Phoenix.Socket
  - `user_id` - User identifier
  - `room_id` - Room/conversation identifier
  - `meta` - Optional metadata (status, device, etc.)
  
  ## Examples
  
      Presence.track_user(socket, "user_123", "room_456", %{
        status: "online",
        device: "web"
      })
  """
  def track_user(socket, user_id, room_id, meta \\ %{}) do
    now = DateTime.utc_now()
    
    full_meta = Map.merge(%{
      user_id: user_id,
      online_at: now,
      last_active: now,
      typing: false,
      status: "online",
      device: Map.get(meta, :device, "web")
    }, meta)
    
    result = track(socket, room_topic(room_id), user_id, full_meta)
    
    # Also track in global presence
    track(socket, "users:online", user_id, full_meta)
    
    emit_telemetry(:join, user_id, full_meta)
    
    result
  end
  
  @doc """
  Track user without socket (for server-side tracking).
  """
  def track_user_serverside(pid, user_id, room_id, meta \\ %{}) do
    now = DateTime.utc_now()
    
    full_meta = Map.merge(%{
      user_id: user_id,
      online_at: now,
      last_active: now,
      typing: false,
      status: "online",
      device: "server"
    }, meta)
    
    track(pid, room_topic(room_id), user_id, full_meta)
  end
  
  @doc """
  Untrack user from a room.
  """
  def untrack_user(socket, user_id, room_id) do
    untrack(socket, room_topic(room_id), user_id)
  end

  # ---------------------------------------------------------------------------
  # Status Updates
  # ---------------------------------------------------------------------------

  @doc """
  Update typing indicator for a user.
  
  Auto-expires after 5 seconds if not refreshed.
  """
  def update_typing(socket, user_id, room_id, is_typing) do
    topic = room_topic(room_id)
    
    result = update(socket, topic, user_id, fn meta ->
      Map.merge(meta, %{
        typing: is_typing,
        typing_at: if(is_typing, do: DateTime.utc_now(), else: nil),
        last_active: DateTime.utc_now()
      })
    end)
    
    emit_telemetry(:typing, user_id, %{room_id: room_id, typing: is_typing})
    
    result
  end
  
  @doc """
  Update user status.
  
  Valid statuses: online, away, busy, invisible, offline
  """
  def update_status(socket, user_id, room_id, status) when status in @valid_statuses do
    topic = room_topic(room_id)
    
    result = update(socket, topic, user_id, fn meta ->
      Map.merge(meta, %{
        status: status,
        status_changed_at: DateTime.utc_now(),
        last_active: DateTime.utc_now()
      })
    end)
    
    # Also update global presence
    update(socket, "users:online", user_id, fn meta ->
      Map.put(meta, :status, status)
    end)
    
    emit_telemetry(:update, user_id, %{status: status})
    
    result
  end
  
  def update_status(_socket, _user_id, _room_id, invalid_status) do
    {:error, {:invalid_status, invalid_status, @valid_statuses}}
  end
  
  @doc """
  Record heartbeat to keep user active.
  """
  def heartbeat(socket, user_id, room_id) do
    topic = room_topic(room_id)
    
    update(socket, topic, user_id, fn meta ->
      new_status = if meta.status == "away", do: "online", else: meta.status
      Map.merge(meta, %{
        last_active: DateTime.utc_now(),
        status: new_status
      })
    end)
  end
  
  @doc """
  Set custom status message.
  """
  def set_status_message(socket, user_id, room_id, message) when is_binary(message) do
    # Limit message length
    safe_message = String.slice(message, 0, 100)
    
    update(socket, room_topic(room_id), user_id, fn meta ->
      Map.put(meta, :status_message, safe_message)
    end)
  end

  # ---------------------------------------------------------------------------
  # Queries
  # ---------------------------------------------------------------------------

  @doc """
  Get all online users in a room.
  
  Returns map of user_id => presence metadata.
  """
  def list_room_users(room_id) do
    list(room_topic(room_id))
    |> transform_presence_list()
  end
  
  @doc """
  Get online user IDs in a room.
  """
  def list_room_user_ids(room_id) do
    list(room_topic(room_id))
    |> Map.keys()
  end
  
  @doc """
  Count online users in a room.
  """
  def count_room_users(room_id) do
    list(room_topic(room_id))
    |> map_size()
  end
  
  @doc """
  Get users currently typing in a room.
  """
  def list_typing_users(room_id) do
    now = DateTime.utc_now()
    
    list(room_topic(room_id))
    |> Enum.filter(fn {_user_id, %{metas: metas}} ->
      Enum.any?(metas, fn meta ->
        meta.typing && typing_still_valid?(meta.typing_at, now)
      end)
    end)
    |> Enum.map(fn {user_id, _} -> user_id end)
  end

  @doc """
  Check if a specific user is online.
  """
  def user_online?(user_id) do
    presences = list("users:online")
    
    case Map.get(presences, to_string(user_id)) do
      nil -> false
      %{metas: metas} ->
        Enum.any?(metas, fn meta ->
          meta.status != "invisible" && meta.status != "offline"
        end)
    end
  end
  
  @doc """
  Check if user is online in a specific room.
  """
  def user_online_in_room?(user_id, room_id) do
    presences = list(room_topic(room_id))
    Map.has_key?(presences, to_string(user_id))
  end
  
  @doc """
  List all currently online users globally.
  """
  def list_online_users do
    list("users:online")
    |> transform_presence_list()
  end
  
  @doc """
  Get online user IDs globally.
  """
  def list_online_user_ids do
    list("users:online")
    |> Map.keys()
  end
  
  @doc """
  Get a user's current status.
  """
  def get_user_status(user_id) do
    case list("users:online") do
      %{^user_id => %{metas: metas}} ->
        metas
        |> Enum.map(& &1.status)
        |> best_status()
      _ ->
        "offline"
    end
  end
  
  @doc """
  Get detailed user presence info.
  """
  def get_user_presence(user_id) do
    case list("users:online") do
      %{^user_id => %{metas: metas}} ->
        merge_multi_device_presence(metas)
      _ ->
        nil
    end
  end
  
  @doc """
  Get status of multiple users at once.
  
  Returns map of user_id => status.
  """
  def bulk_status(user_ids) when is_list(user_ids) do
    presences = list("users:online")
    
    Map.new(user_ids, fn user_id ->
      user_key = to_string(user_id)
      status = case Map.get(presences, user_key) do
        nil -> "offline"
        %{metas: metas} ->
          metas
          |> Enum.map(& &1.status)
          |> best_status()
      end
      {user_id, status}
    end)
  end

  # ---------------------------------------------------------------------------
  # Last Seen Tracking
  # ---------------------------------------------------------------------------
  
  @doc """
  Get when user was last seen.
  """
  def last_seen(user_id) do
    case Cachex.get(:cgraph_cache, last_seen_key(user_id)) do
      {:ok, nil} -> nil
      {:ok, timestamp} -> timestamp
      _ -> nil
    end
  end
  
  @doc """
  Record user's last seen timestamp.
  """
  def record_last_seen(user_id) do
    now = DateTime.utc_now()
    Cachex.put(:cgraph_cache, last_seen_key(user_id), now, ttl: @last_seen_ttl_ms)
    now
  end
  
  @doc """
  Get last seen for multiple users.
  """
  def bulk_last_seen(user_ids) when is_list(user_ids) do
    Map.new(user_ids, fn user_id ->
      {user_id, last_seen(user_id)}
    end)
  end

  # ---------------------------------------------------------------------------
  # Presence Callbacks
  # ---------------------------------------------------------------------------
  
  @doc """
  Callback to enrich presence data when fetched.
  """
  @impl true
  def fetch(_topic, presences) do
    presences
  end
  
  @doc """
  Handle presence diff for broadcasting.
  """
  @impl true
  def handle_metas(topic, %{joins: joins, leaves: leaves}, _presences, state) do
    for {user_id, presence} <- joins do
      Logger.debug("User #{user_id} joined #{topic}")
      emit_telemetry(:join, user_id, %{topic: topic, metas: presence.metas})
    end
    
    for {user_id, presence} <- leaves do
      Logger.debug("User #{user_id} left #{topic}")
      record_last_seen(user_id)
      emit_telemetry(:leave, user_id, %{topic: topic, metas: presence.metas})
    end
    
    {:ok, state}
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------
  
  defp room_topic(room_id), do: "room:#{room_id}"
  
  defp last_seen_key(user_id), do: "presence:last_seen:#{user_id}"
  
  defp typing_still_valid?(nil, _now), do: false
  defp typing_still_valid?(typing_at, now) do
    diff = DateTime.diff(now, typing_at, :millisecond)
    diff < @typing_timeout_ms
  end
  
  defp transform_presence_list(presences) do
    Map.new(presences, fn {user_id, %{metas: metas}} ->
      {user_id, merge_multi_device_presence(metas)}
    end)
  end
  
  defp merge_multi_device_presence(metas) when is_list(metas) do
    base = %{
      devices: [],
      status: "offline",
      online_at: nil,
      last_active: nil,
      typing: false
    }
    
    Enum.reduce(metas, base, fn meta, acc ->
      %{acc |
        devices: [meta[:device] | acc.devices] |> Enum.uniq() |> Enum.reject(&is_nil/1),
        status: best_status([acc.status, meta[:status] || "online"]),
        online_at: earliest_time(acc.online_at, meta[:online_at]),
        last_active: latest_time(acc.last_active, meta[:last_active]),
        typing: acc.typing || meta[:typing] || false
      }
    end)
  end
  
  defp best_status(statuses) do
    cond do
      "online" in statuses -> "online"
      "busy" in statuses -> "busy"
      "away" in statuses -> "away"
      "invisible" in statuses -> "invisible"
      true -> "offline"
    end
  end
  
  defp earliest_time(nil, b), do: b
  defp earliest_time(a, nil), do: a
  defp earliest_time(a, b) do
    if DateTime.compare(a, b) == :lt, do: a, else: b
  end
  
  defp latest_time(nil, b), do: b
  defp latest_time(a, nil), do: a
  defp latest_time(a, b) do
    if DateTime.compare(a, b) == :gt, do: a, else: b
  end
  
  defp emit_telemetry(event, user_id, metadata) do
    :telemetry.execute(
      [:cgraph, :presence, event],
      %{count: 1, timestamp: System.system_time(:millisecond)},
      Map.merge(%{user_id: user_id}, metadata)
    )
  end
end
