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
  │   ┌─────────────────────────────────────────────────────────────┐  │
  │   │                    CGraph.Presence                        │  │
  │   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │  │
  │   │  │ Track   │  │ Update  │  │  List   │  │ Typing  │     │  │
  │   │  │ User    │  │ Status  │  │ Online  │  │ Indicator│     │  │
  │   │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │  │
  │   └─────────────────────────────────────────────────────────────┘  │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```

  ## Submodules

  - `CGraph.Presence.Tracker` — track/untrack users, typing, status updates
  - `CGraph.Presence.Queries` — read-only presence lookups and bulk queries
  - `CGraph.Presence.Store`   — Redis sync, last-seen, stats, REST helpers
  - `CGraph.Presence.Sampled` — HyperLogLog sampling for large channels

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

  alias CGraph.Presence.{Queries, Sampled, Store, Tracker}

  # ---------------------------------------------------------------------------
  # Delegated Public API — Tracker
  # ---------------------------------------------------------------------------

  defdelegate track_user(socket, user_id, room_id, meta \\ %{}), to: Tracker
  defdelegate track_user_serverside(pid, user_id, room_id, meta \\ %{}), to: Tracker
  defdelegate untrack_user(socket, user_id, room_id), to: Tracker
  defdelegate update_typing(socket, user_id, room_id, is_typing), to: Tracker
  defdelegate update_status(socket, user_id, room_id, status), to: Tracker
  defdelegate heartbeat(socket, user_id, room_id), to: Tracker
  defdelegate set_status_message(socket, user_id, room_id, message), to: Tracker

  # ---------------------------------------------------------------------------
  # Delegated Public API — Queries
  # ---------------------------------------------------------------------------

  defdelegate list_room_users(room_id), to: Queries
  defdelegate list_room_user_ids(room_id), to: Queries
  defdelegate count_room_users(room_id), to: Queries
  defdelegate list_typing_users(room_id), to: Queries
  defdelegate user_online?(user_id), to: Queries
  defdelegate user_online_in_room?(user_id, room_id), to: Queries
  defdelegate list_online_users(), to: Queries
  defdelegate list_online_user_ids(), to: Queries
  defdelegate get_user_status(user_id), to: Queries
  defdelegate get_user_presence(user_id), to: Queries
  defdelegate bulk_status(user_ids), to: Queries
  defdelegate merge_multi_device_presence(metas), to: Queries

  # ---------------------------------------------------------------------------
  # Delegated Public API — Store
  # ---------------------------------------------------------------------------

  defdelegate last_seen(user_id), to: Store
  defdelegate record_last_seen(user_id), to: Store
  defdelegate bulk_last_seen(user_ids), to: Store
  defdelegate list_online_users(opts), to: Store
  defdelegate count_guests(), to: Store
  defdelegate update_presence(user_id, location), to: Store
  defdelegate get_stats(), to: Store
  defdelegate get_users_at_location(location), to: Store
  defdelegate get_user_status(user_id, viewer), to: Store
  defdelegate update_visibility(user_id, visible), to: Store

  # ---------------------------------------------------------------------------
  # Phoenix.Presence Callbacks
  # ---------------------------------------------------------------------------

  @doc """
  Initialize presence state.
  Required when implementing handle_metas/4 callback.
  """
  @impl true
  def init(_opts) do
    {:ok, %{}}
  end

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
      Store.sync_presence_join(user_id, meta)
      Logger.debug("presence_global_joined", user_id: user_id, topic: topic)
      emit_telemetry(:join, user_id, %{topic: topic, metas: metas})
    end

    # Sync leaves to Redis — only remove if user fully offline (no remaining sessions)
    for {user_id, %{metas: metas}} <- leaves do
      # presences contains current metas for this user key after the diff.
      # If empty/nil, user has disconnected all devices.
      still_online? = presences != nil and presences != [] and presences != %{}

      unless still_online? do
        Store.sync_presence_leave(user_id)
      end

      Store.record_last_seen(user_id)
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
      Store.record_last_seen(user_id)
      emit_telemetry(:leave, user_id, %{topic: topic, metas: presence.metas})
      Sampled.untrack(room_id, user_id)
    end

    {:ok, state}
  end

  # ---------------------------------------------------------------------------
  # Shared Helpers (used by submodules)
  # ---------------------------------------------------------------------------

  @doc false
  def room_topic(room_id), do: "room:#{room_id}"

  @doc false
  def emit_telemetry(event, user_id, metadata) do
    :telemetry.execute(
      [:cgraph, :presence, event],
      %{count: 1, timestamp: System.system_time(:millisecond)},
      Map.merge(%{user_id: user_id}, metadata)
    )
  end
end
