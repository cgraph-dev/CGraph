defmodule CGraph.Presence.Tracker do
  @moduledoc """
  User presence tracking operations.

  Handles tracking, untracking, and updating user presence in rooms
  and the global "users:online" topic via `CGraph.Presence` (Phoenix.Presence).
  """

  require Logger

  alias CGraph.Presence

  @valid_statuses ~w(online away busy invisible offline)

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
  @spec track_user(Phoenix.Socket.t(), String.t(), String.t(), map()) :: {:ok, binary()} | {:error, term()}
  def track_user(socket, user_id, room_id, meta \\ %{}) do
    now = DateTime.utc_now()

    full_meta =
      Map.merge(
        %{
          user_id: user_id,
          online_at: now,
          last_active: now,
          typing: false,
          status: "online",
          device: Map.get(meta, :device, "web")
        },
        meta
      )

    # Use track/4 with PID for Phoenix.Tracker compatibility
    # Phoenix.Presence's track/3 variant uses (socket, key, meta) but that
    # requires the socket's topic. For custom topics, use track/4 with PID.
    pid = socket.channel_pid
    room_topic = Presence.room_topic(room_id)

    # Track in the room-specific topic
    result = Presence.track(pid, room_topic, user_id, full_meta)

    # Also track in global presence
    Presence.track(pid, "users:online", user_id, full_meta)

    Presence.emit_telemetry(:join, user_id, full_meta)

    result
  end

  @doc """
  Track user without socket (for server-side tracking).
  """
  @spec track_user_serverside(pid(), String.t(), String.t(), map()) :: {:ok, binary()} | {:error, term()}
  def track_user_serverside(pid, user_id, room_id, meta \\ %{}) do
    now = DateTime.utc_now()

    full_meta =
      Map.merge(
        %{
          user_id: user_id,
          online_at: now,
          last_active: now,
          typing: false,
          status: "online",
          device: "server"
        },
        meta
      )

    Presence.track(pid, Presence.room_topic(room_id), user_id, full_meta)
  end

  @doc """
  Untrack user from a room.
  """
  @spec untrack_user(Phoenix.Socket.t(), String.t(), String.t()) :: :ok
  def untrack_user(socket, user_id, room_id) do
    Presence.untrack(socket, Presence.room_topic(room_id), user_id)
  end

  # ---------------------------------------------------------------------------
  # Status Updates
  # ---------------------------------------------------------------------------

  @doc """
  Update typing indicator for a user.

  Auto-expires after 5 seconds if not refreshed.
  """
  @spec update_typing(Phoenix.Socket.t() | pid(), String.t(), String.t(), boolean()) :: {:ok, binary()} | {:error, term()}
  def update_typing(socket, user_id, room_id, is_typing) do
    topic = Presence.room_topic(room_id)
    pid = if is_pid(socket), do: socket, else: socket.channel_pid

    result =
      Presence.update(pid, topic, user_id, fn meta ->
        Map.merge(meta, %{
          typing: is_typing,
          typing_at: if(is_typing, do: DateTime.utc_now(), else: nil),
          last_active: DateTime.utc_now()
        })
      end)

    Presence.emit_telemetry(:typing, user_id, %{room_id: room_id, typing: is_typing})

    result
  end

  @doc """
  Update user status.

  Valid statuses: online, away, busy, invisible, offline
  """
  @spec update_status(Phoenix.Socket.t() | pid(), String.t(), String.t(), String.t()) :: {:ok, binary()} | {:error, term()}
  def update_status(socket, user_id, room_id, status) when status in @valid_statuses do
    topic = Presence.room_topic(room_id)
    pid = if is_pid(socket), do: socket, else: socket.channel_pid

    result =
      Presence.update(pid, topic, user_id, fn meta ->
        Map.merge(meta, %{
          status: status,
          status_changed_at: DateTime.utc_now(),
          last_active: DateTime.utc_now()
        })
      end)

    # Also update global presence
    Presence.update(pid, "users:online", user_id, fn meta ->
      Map.put(meta, :status, status)
    end)

    Presence.emit_telemetry(:update, user_id, %{status: status})

    result
  end

  def update_status(_socket, _user_id, _room_id, invalid_status) do
    {:error, {:invalid_status, invalid_status, @valid_statuses}}
  end

  @doc """
  Record heartbeat to keep user active.
  """
  @spec heartbeat(Phoenix.Socket.t() | pid(), String.t(), String.t()) :: {:ok, binary()} | {:error, term()}
  def heartbeat(socket, user_id, room_id) do
    topic = Presence.room_topic(room_id)
    pid = if is_pid(socket), do: socket, else: socket.channel_pid

    Presence.update(pid, topic, user_id, fn meta ->
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
  @spec set_status_message(Phoenix.Socket.t() | pid(), String.t(), String.t(), String.t()) :: {:ok, binary()} | {:error, term()}
  def set_status_message(socket, user_id, room_id, message) when is_binary(message) do
    # Limit message length
    safe_message = String.slice(message, 0, 100)
    pid = if is_pid(socket), do: socket, else: socket.channel_pid

    Presence.update(pid, Presence.room_topic(room_id), user_id, fn meta ->
      Map.put(meta, :status_message, safe_message)
    end)
  end
end
