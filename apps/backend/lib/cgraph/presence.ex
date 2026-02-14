defmodule CGraph.Presence do
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
  │   │                    CGraph.Presence                        │  │
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
    pubsub_server: CGraph.PubSub

  require Logger

  alias CGraph.Presence.Sampled

  @typing_timeout_ms 5_000
  @last_seen_ttl_ms 604_800_000
  # Idle timeout is 5 minutes (300_000ms) - used for auto-away detection

  @valid_statuses ~w(online away busy invisible offline)

  # Redis keys for scalable global presence (avoids loading full CRDT state)
  @online_set_key "presence:online_set"
  @online_zset_key "presence:online_zset"

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

    # Use track/4 with PID for Phoenix.Tracker compatibility
    # Phoenix.Presence's track/3 variant uses (socket, key, meta) but that
    # requires the socket's topic. For custom topics, use track/4 with PID.
    pid = socket.channel_pid
    room_topic = room_topic(room_id)

    # Track in the room-specific topic
    result = __MODULE__.track(pid, room_topic, user_id, full_meta)

    # Also track in global presence
    __MODULE__.track(pid, "users:online", user_id, full_meta)

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
    pid = if is_pid(socket), do: socket, else: socket.channel_pid

    result = update(pid, topic, user_id, fn meta ->
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
    pid = if is_pid(socket), do: socket, else: socket.channel_pid

    result = update(pid, topic, user_id, fn meta ->
      Map.merge(meta, %{
        status: status,
        status_changed_at: DateTime.utc_now(),
        last_active: DateTime.utc_now()
      })
    end)

    # Also update global presence
    update(pid, "users:online", user_id, fn meta ->
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
    pid = if is_pid(socket), do: socket, else: socket.channel_pid

    update(pid, topic, user_id, fn meta ->
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
    pid = if is_pid(socket), do: socket, else: socket.channel_pid

    update(pid, room_topic(room_id), user_id, fn meta ->
      Map.put(meta, :status_message, safe_message)
    end)
  end

  # ---------------------------------------------------------------------------
  # Queries
  # ---------------------------------------------------------------------------

  @doc """
  Get all online users in a room.

  For channels with >100 users, delegates to Sampled presence for efficiency.
  Returns map of user_id => presence metadata.
  """
  def list_room_users(room_id) do
    # Try sampled presence first for large channels
    case Sampled.get_summary(room_id) do
      {:ok, %{online: online}} when online > 100 ->
        case Sampled.list_online(room_id) do
          {:ok, users} -> users
          _error -> list(room_topic(room_id)) |> transform_presence_list()
        end

      _small_or_error ->
        list(room_topic(room_id)) |> transform_presence_list()
    end
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

  Uses Sampled presence HyperLogLog for O(1) approximate counts in large channels.
  Falls back to CRDT list for small channels.
  """
  def count_room_users(room_id) do
    case Sampled.approximate_count(room_id) do
      {:ok, count} when count > 0 -> count
      _fallback -> list(room_topic(room_id)) |> map_size()
    end
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

  Uses Redis SET membership check — O(1) instead of loading all users.
  """
  def user_online?(user_id) do
    user_key = to_string(user_id)

    case CGraph.Redis.command(["SISMEMBER", @online_set_key, user_key]) do
      {:ok, 1} -> true
      {:ok, 0} -> false
      _ -> false
    end
  rescue
    _ -> false
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

  WARNING: This still loads the full CRDT state. Prefer `list_online_users/1`
  (paginated) or specific lookups like `user_online?/1`, `bulk_status/1`.
  Kept for backward compatibility but should be avoided at scale.
  """
  def list_online_users do
    list("users:online")
    |> transform_presence_list()
  end

  @doc """
  Get online user IDs globally.

  Uses Redis SET for O(N) scan instead of materializing full CRDT with metadata.
  For large sets, prefer paginated endpoints.
  """
  def list_online_user_ids do
    case CGraph.Redis.command(["SMEMBERS", @online_set_key]) do
      {:ok, ids} when is_list(ids) -> ids
      _ -> list("users:online") |> Map.keys()
    end
  rescue
    _ -> list("users:online") |> Map.keys()
  end

  @doc """
  Get a user's current status. O(1) via Redis hash lookup.
  """
  def get_user_status(user_id) do
    user_key = to_string(user_id)

    case CGraph.Redis.command(["HGET", presence_meta_key(user_key), "status"]) do
      {:ok, nil} -> "offline"
      {:ok, status} when is_binary(status) -> status
      _ -> "offline"
    end
  rescue
    _ -> "offline"
  end

  @doc """
  Get detailed user presence info. O(1) via Redis hash lookup.
  """
  def get_user_presence(user_id) do
    user_key = to_string(user_id)

    case CGraph.Redis.command(["HGETALL", presence_meta_key(user_key)]) do
      {:ok, fields} when is_list(fields) and fields != [] ->
        redis_hash_to_presence(fields)

      _ ->
        nil
    end
  rescue
    _ -> nil
  end

  @doc """
  Get status of multiple users at once. O(N) via pipelined Redis lookups.

  Returns map of user_id => status.
  """
  def bulk_status(user_ids) when is_list(user_ids) do
    if user_ids == [] do
      %{}
    else
      commands = Enum.map(user_ids, fn user_id ->
        ["HGET", presence_meta_key(to_string(user_id)), "status"]
      end)

      case CGraph.Redis.pipeline(commands) do
        {:ok, results} ->
          user_ids
          |> Enum.zip(results)
          |> Map.new(fn {user_id, status} ->
            {user_id, if(is_binary(status), do: status, else: "offline")}
          end)

        _ ->
          Map.new(user_ids, fn user_id -> {user_id, "offline"} end)
      end
    end
  rescue
    _ -> Map.new(user_ids, fn user_id -> {user_id, "offline"} end)
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

  For the global "users:online" topic, maintains Redis data structures
  for O(1) lookups and O(log N) pagination instead of loading the full CRDT.
  """
  @impl true
  def handle_metas("users:online" = topic, %{joins: joins, leaves: leaves}, presences, state) do
    # Sync joins to Redis
    for {user_id, %{metas: metas}} <- joins do
      meta = List.first(metas) || %{}
      sync_presence_join(user_id, meta)
      Logger.debug("presence_global_joined", user_id: user_id, topic: topic)
      emit_telemetry(:join, user_id, %{topic: topic, metas: metas})
    end

    # Sync leaves to Redis — only remove if user fully offline (no remaining sessions)
    for {user_id, %{metas: metas}} <- leaves do
      # presences contains current metas for this user key after the diff.
      # If empty/nil, user has disconnected all devices.
      still_online? = presences != nil and presences != [] and presences != %{}

      unless still_online? do
        sync_presence_leave(user_id)
      end

      record_last_seen(user_id)
      Logger.debug("presence_global_left", user_id: user_id, topic: topic)
      emit_telemetry(:leave, user_id, %{topic: topic, metas: metas})
    end

    {:ok, state}
  end

  def handle_metas(topic, %{joins: joins, leaves: leaves}, _presences, state) do
    # Extract room_id from topic for sampled presence tracking
    room_id = topic |> String.replace_prefix("room:", "")

    for {user_id, presence} <- joins do
      Logger.debug("presence_room_joined", user_id: user_id, topic: topic)
      emit_telemetry(:join, user_id, %{topic: topic, metas: presence.metas})
      # Track in sampled presence for large-channel efficiency
      Sampled.track(room_id, user_id, %{})
    end

    for {user_id, presence} <- leaves do
      Logger.debug("presence_room_left", user_id: user_id, topic: topic)
      record_last_seen(user_id)
      emit_telemetry(:leave, user_id, %{topic: topic, metas: presence.metas})
      Sampled.untrack(room_id, user_id)
    end

    {:ok, state}
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp room_topic(room_id), do: "room:#{room_id}"

  # ---------------------------------------------------------------------------
  # Extended Presence Functions for REST API
  # ---------------------------------------------------------------------------

  @doc """
  List online users with real server-side pagination via Redis sorted set.

  Uses ZREVRANGE for O(log N + M) where M is the page size,
  instead of loading all users into memory.
  """
  def list_online_users(opts) when is_list(opts) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)
    offset = (page - 1) * per_page

    # Get total count — O(1) via ZCARD
    total_count = case CGraph.Redis.command(["ZCARD", @online_zset_key]) do
      {:ok, count} when is_integer(count) -> count
      _ -> 0
    end

    # Get page of user IDs from sorted set (newest joins first) — O(log N + M)
    user_ids = case CGraph.Redis.command([
      "ZREVRANGE", @online_zset_key,
      to_string(offset), to_string(offset + per_page - 1)
    ]) do
      {:ok, ids} when is_list(ids) -> ids
      _ -> []
    end

    # Fetch metadata for each user in the page via pipeline — O(M)
    users = if user_ids != [] do
      commands = Enum.map(user_ids, fn id -> ["HGETALL", presence_meta_key(id)] end)

      case CGraph.Redis.pipeline(commands) do
        {:ok, results} ->
          Enum.zip(user_ids, results)
          |> Enum.map(fn {user_id, fields} ->
            meta = if is_list(fields) and fields != [],
              do: redis_hash_to_presence(fields),
              else: %{status: "online"}

            Map.merge(%{id: user_id}, meta)
          end)

        _ ->
          Enum.map(user_ids, fn id -> %{id: id, status: "online"} end)
      end
    else
      []
    end

    total_pages = if total_count > 0, do: ceil(total_count / per_page), else: 0

    pagination = %{
      page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: total_pages
    }

    {users, pagination}
  rescue
    _ ->
      # Fallback to Phoenix.Presence if Redis is completely unavailable
      fallback_list_online_users(opts)
  end

  # Fallback when Redis is unavailable (uses full CRDT load — only for resilience)
  defp fallback_list_online_users(opts) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 50)

    all_users = list_online_users()
    |> Map.to_list()
    |> Enum.map(fn {user_id, presence} ->
      Map.merge(%{id: user_id}, presence)
    end)

    total_count = length(all_users)
    offset = (page - 1) * per_page

    users = all_users
    |> Enum.drop(offset)
    |> Enum.take(per_page)

    pagination = %{
      page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: if(total_count > 0, do: ceil(total_count / per_page), else: 0)
    }

    {users, pagination}
  end

  @doc """
  Count guests (users not logged in).
  This is an estimate based on connected sockets without user tracking.
  """
  def count_guests do
    # For now, return 0 - would need WebSocket tracking of anonymous connections
    0
  end

  @doc """
  Update user presence from REST API heartbeat.
  """
  def update_presence(user_id, location) do
    # Update last seen
    record_last_seen(user_id)

    # Store location in cache
    Cachex.put(:cgraph_cache, "presence:location:#{user_id}", location, ttl: 300_000)

    {:ok, :updated}
  end

  @doc """
  Get presence statistics. O(1) via Redis SCARD instead of loading all users.
  """
  def get_stats do
    users_online = case CGraph.Redis.command(["SCARD", @online_set_key]) do
      {:ok, count} when is_integer(count) -> count
      _ -> 0
    end

    %{
      users_online: users_online,
      guests_online: count_guests(),
      invisible_users: 0,
      total_online: users_online + count_guests(),
      most_online: get_most_online_record(),
      most_online_date: get_most_online_date(),
      users_today: get_users_today_count(),
      bots_online: 0
    }
  rescue
    _ ->
      %{
        users_online: 0, guests_online: 0, invisible_users: 0,
        total_online: 0, most_online: 0, most_online_date: nil,
        users_today: 0, bots_online: 0
      }
  end

  @doc """
  Get users at a specific location.
  """
  def get_users_at_location(_location) do
    # Would need to be implemented with location tracking
    []
  end

  @doc """
  Get user status for a specific user (for viewing by another user).
  """
  def get_user_status(user_id, _viewer) do
    status = get_user_status(user_id)
    last_online = last_seen(user_id)

    location = case Cachex.get(:cgraph_cache, "presence:location:#{user_id}") do
      {:ok, loc} -> loc
      _ -> nil
    end

    {:ok, %{
      user_id: user_id,
      is_online: status != "offline",
      is_invisible: status == "invisible",
      last_online_at: last_online,
      current_location: location,
      status_text: nil
    }}
  end

  @doc """
  Update visibility (online vs invisible).
  """
  def update_visibility(_user_id, _visible) do
    # Would need socket access to update presence
    {:ok, :updated}
  end

  defp get_most_online_record do
    case Cachex.get(:cgraph_cache, "presence:most_online") do
      {:ok, nil} -> 0
      {:ok, count} -> count
      _ -> 0
    end
  end

  defp get_most_online_date do
    case Cachex.get(:cgraph_cache, "presence:most_online_date") do
      {:ok, nil} -> nil
      {:ok, date} -> date
      _ -> nil
    end
  end

  defp get_users_today_count do
    # Use Redis SCARD for O(1) count instead of loading all users
    case CGraph.Redis.command(["SCARD", @online_set_key]) do
      {:ok, count} when is_integer(count) -> count
      _ -> 0
    end
  rescue
    _ -> 0
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

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

  @doc """
  Merge presence metadata across multiple devices into a single unified view.
  """
  def merge_multi_device_presence(metas) when is_list(metas) do
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

  # ---------------------------------------------------------------------------
  # Redis Presence Sync (scalable global presence backing store)
  # ---------------------------------------------------------------------------

  defp presence_meta_key(user_id), do: "presence:meta:#{user_id}"

  @doc false
  defp sync_presence_join(user_id, meta) do
    user_key = to_string(user_id)
    timestamp = System.system_time(:second)
    status = to_string(meta[:status] || "online")
    device = to_string(meta[:device] || "web")

    online_at = case meta[:online_at] do
      %DateTime{} = dt -> DateTime.to_iso8601(dt)
      _ -> DateTime.to_iso8601(DateTime.utc_now())
    end

    meta_key = presence_meta_key(user_key)

    CGraph.Redis.pipeline([
      ["SADD", @online_set_key, user_key],
      ["ZADD", @online_zset_key, "NX", to_string(timestamp), user_key],
      ["HSET", meta_key, "status", status, "device", device, "online_at", online_at],
      # Auto-expire metadata after 24h as safety net (heartbeats refresh it)
      ["EXPIRE", meta_key, "86400"]
    ])

    # Update most-online record
    update_most_online_record()

    :ok
  rescue
    _ -> :ok
  end

  defp sync_presence_leave(user_id) do
    user_key = to_string(user_id)
    meta_key = presence_meta_key(user_key)

    CGraph.Redis.pipeline([
      ["SREM", @online_set_key, user_key],
      ["ZREM", @online_zset_key, user_key],
      ["DEL", meta_key]
    ])

    :ok
  rescue
    _ -> :ok
  end

  defp update_most_online_record do
    case CGraph.Redis.command(["SCARD", @online_set_key]) do
      {:ok, current_count} when is_integer(current_count) ->
        current_record = get_most_online_record()

        if current_count > current_record do
          today = Date.to_iso8601(Date.utc_today())
          Cachex.put(:cgraph_cache, "presence:most_online", current_count)
          Cachex.put(:cgraph_cache, "presence:most_online_date", today)
        end

      _ ->
        :ok
    end
  rescue
    _ -> :ok
  end

  defp redis_hash_to_presence(fields) when is_list(fields) do
    fields
    |> Enum.chunk_every(2)
    |> Enum.reduce(%{}, fn
      [key, value], acc -> Map.put(acc, String.to_existing_atom(key), value)
      _, acc -> acc
    end)
  end
  defp redis_hash_to_presence(_), do: %{}
end
