defmodule CGraph.Presence.DistributedPresence do
  @moduledoc """
  Distributed presence tracking across cluster nodes.

  Extends `CGraph.Presence` (Phoenix.Presence) with multi-node awareness,
  CRDT-style conflict resolution, and cross-node presence queries.

  ## Architecture

  Phoenix.Presence already uses a CRDT-based mechanism for syncing presence
  state across nodes via PubSub. This module adds:

  - **Cluster-aware queries**: `list_online/0`, `is_online?/1` that aggregate
    presence across all connected nodes
  - **Node health tracking**: monitors node connections/disconnections
  - **Presence change telemetry**: emits events on joins, leaves, and conflicts
  - **Conflict resolution**: last-writer-wins with device priority merging

  ## How It Works

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                  DISTRIBUTED PRESENCE                           │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   Node A ◄──── PubSub CRDT Sync ────► Node B                   │
  │   ┌────────┐                          ┌────────┐                │
  │   │User 1  │                          │User 1  │  ← same user, │
  │   │User 2  │                          │User 3  │    2 devices   │
  │   └────────┘                          └────────┘                │
  │                                                                  │
  │   DistributedPresence.list_online/0                              │
  │   → [User 1, User 2, User 3]  (merged across nodes)            │
  │                                                                  │
  │   DistributedPresence.is_online?("user_1")                       │
  │   → true (present on Node A AND Node B)                         │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```

  ## Usage

      # Check if user is online across the cluster
      DistributedPresence.is_online?("user-123")

      # List all online users (merged across nodes)
      DistributedPresence.list_online()

      # Get user presence with device info
      DistributedPresence.get_user_presence("user-123")

      # Get cluster presence stats
      DistributedPresence.cluster_stats()

  ## Telemetry Events

  - `[:cgraph, :distributed_presence, :online_count]` — periodic online count
  - `[:cgraph, :distributed_presence, :node_joined]` — new node connected
  - `[:cgraph, :distributed_presence, :node_left]` — node disconnected
  - `[:cgraph, :distributed_presence, :conflict_resolved]` — CRDT conflict resolved
  """

  use GenServer

  require Logger

  alias CGraph.Presence
  alias CGraph.Presence.{Queries, Store, GhostMode}

  @online_topic "users:online"
  @stats_interval :timer.seconds(30)

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @doc "Start the distributed presence GenServer."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  List all online users across the cluster.

  Aggregates Phoenix.Presence state (already CRDT-synced across nodes)
  and merges multi-device sessions into a single entry per user.

  Ghost mode users are excluded from results.
  """
  @spec list_online() :: [map()]
  def list_online do
    Presence.list(@online_topic)
    |> Enum.map(fn {user_id, %{metas: metas}} ->
      merged = resolve_presence(user_id, metas)
      Map.put(merged, :user_id, user_id)
    end)
    |> Enum.reject(&ghost_user?/1)
  end

  @doc """
  List online user IDs across the cluster.
  """
  @spec list_online_ids() :: [String.t()]
  def list_online_ids do
    Presence.list(@online_topic)
    |> Map.keys()
    |> Enum.reject(&GhostMode.is_ghost?/1)
  end

  @doc """
  Check if a specific user is online on any node in the cluster.

  Uses Redis SET membership first (O(1)), falls back to CRDT state.
  Respects ghost mode — ghost users always appear offline.
  """
  @spec is_online?(String.t()) :: boolean()
  def is_online?(user_id) do
    if GhostMode.is_ghost?(user_id) do
      false
    else
      Queries.user_online?(user_id)
    end
  end

  @doc """
  Get detailed presence for a user across all their devices/sessions.

  Returns merged presence with all device metas and the resolved
  "effective" status.
  """
  @spec get_user_presence(String.t()) :: {:ok, map()} | {:error, :offline}
  def get_user_presence(user_id) do
    if GhostMode.is_ghost?(user_id) do
      {:error, :offline}
    else
      case Presence.list(@online_topic) do
        %{^user_id => %{metas: metas}} when metas != [] ->
          presence = resolve_presence(user_id, metas)

          {:ok,
           Map.merge(presence, %{
             user_id: user_id,
             devices: Enum.map(metas, &Map.get(&1, :device, "unknown")),
             session_count: length(metas),
             nodes: metas |> Enum.map(&Map.get(&1, :node)) |> Enum.uniq() |> Enum.reject(&is_nil/1)
           })}

        _ ->
          {:error, :offline}
      end
    end
  end

  @doc """
  Track a user with distributed awareness.

  Adds the current node name to metadata for cross-node tracking.
  """
  @spec track(pid(), String.t(), String.t(), map()) ::
          {:ok, binary()} | {:error, term()}
  def track(pid, user_id, room_id, meta \\ %{}) do
    enhanced_meta =
      Map.merge(meta, %{
        node: node(),
        tracked_at: DateTime.utc_now()
      })

    Presence.Tracker.track_user_serverside(pid, user_id, room_id, enhanced_meta)
  end

  @doc """
  Get cluster-wide presence statistics.
  """
  @spec cluster_stats() :: map()
  def cluster_stats do
    presences = Presence.list(@online_topic)
    total_users = map_size(presences)

    total_sessions =
      presences
      |> Enum.map(fn {_user_id, %{metas: metas}} -> length(metas) end)
      |> Enum.sum()

    nodes_with_presence =
      presences
      |> Enum.flat_map(fn {_user_id, %{metas: metas}} ->
        Enum.map(metas, &Map.get(&1, :node))
      end)
      |> Enum.uniq()
      |> Enum.reject(&is_nil/1)

    %{
      total_users: total_users,
      total_sessions: total_sessions,
      nodes: nodes_with_presence,
      node_count: length(nodes_with_presence),
      cluster_nodes: Node.list([:this, :visible]),
      timestamp: DateTime.utc_now()
    }
  end

  @doc """
  Bulk check online status for multiple users.
  Returns a map of user_id => boolean.
  """
  @spec bulk_online?([String.t()]) :: %{String.t() => boolean()}
  def bulk_online?(user_ids) when is_list(user_ids) do
    presences = Presence.list(@online_topic)

    Map.new(user_ids, fn user_id ->
      online? =
        Map.has_key?(presences, user_id) and not GhostMode.is_ghost?(user_id)

      {user_id, online?}
    end)
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @impl GenServer
  def init(_opts) do
    # Monitor node connections/disconnections
    :net_kernel.monitor_nodes(true, node_type: :visible)

    # Schedule periodic stats emission
    schedule_stats()

    Logger.info("distributed_presence_started",
      node: node(),
      cluster_nodes: Node.list()
    )

    {:ok, %{node_count: length(Node.list()) + 1}}
  end

  @impl GenServer
  def handle_info({:nodeup, new_node, _info}, state) do
    new_count = length(Node.list()) + 1

    Logger.info("distributed_presence_node_joined",
      node: new_node,
      cluster_size: new_count
    )

    emit_telemetry(:node_joined, %{
      node: new_node,
      cluster_size: new_count
    })

    {:noreply, %{state | node_count: new_count}}
  end

  @impl GenServer
  def handle_info({:nodedown, down_node, _info}, state) do
    new_count = length(Node.list()) + 1

    Logger.warning("distributed_presence_node_left",
      node: down_node,
      cluster_size: new_count
    )

    emit_telemetry(:node_left, %{
      node: down_node,
      cluster_size: new_count
    })

    {:noreply, %{state | node_count: new_count}}
  end

  @impl GenServer
  def handle_info(:emit_stats, state) do
    stats = cluster_stats()

    emit_telemetry(:online_count, %{
      total_users: stats.total_users,
      total_sessions: stats.total_sessions,
      node_count: stats.node_count
    })

    schedule_stats()
    {:noreply, state}
  end

  @impl GenServer
  def handle_info(_msg, state), do: {:noreply, state}

  # ---------------------------------------------------------------------------
  # CRDT Conflict Resolution
  # ---------------------------------------------------------------------------

  @doc """
  Resolve presence conflicts when a user has multiple sessions.

  Uses last-writer-wins with device priority:
  1. Most recently active session wins for status
  2. All devices are tracked
  3. Online > Away > Busy > Invisible for effective status
  """
  @spec resolve_presence(String.t(), [map()]) :: map()
  def resolve_presence(user_id, metas) when is_list(metas) and metas != [] do
    # Sort by last_active descending — most recent session first
    sorted =
      Enum.sort_by(metas, &(Map.get(&1, :last_active) || Map.get(&1, :online_at)), fn a, b ->
        case {a, b} do
          {nil, _} -> false
          {_, nil} -> true
          {a, b} -> DateTime.compare(a, b) != :lt
        end
      end)

    primary = List.first(sorted)

    # Effective status: highest priority status across all sessions
    effective_status = resolve_status(metas)

    if effective_status != Map.get(primary, :status) do
      emit_telemetry(:conflict_resolved, %{
        user_id: user_id,
        session_count: length(metas),
        resolved_status: effective_status
      })
    end

    %{
      status: effective_status,
      last_active: Map.get(primary, :last_active),
      online_at: Map.get(primary, :online_at),
      typing: Enum.any?(metas, &(Map.get(&1, :typing, false) == true)),
      device: Map.get(primary, :device, "unknown")
    }
  end

  def resolve_presence(_user_id, _metas), do: %{status: "offline"}

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  @status_priority %{
    "online" => 0,
    "away" => 1,
    "busy" => 2,
    "invisible" => 3,
    "offline" => 4
  }

  defp resolve_status(metas) do
    metas
    |> Enum.map(&(Map.get(&1, :status, "offline") |> to_string()))
    |> Enum.min_by(&Map.get(@status_priority, &1, 99))
  end

  defp ghost_user?(%{user_id: user_id}), do: GhostMode.is_ghost?(user_id)
  defp ghost_user?(_), do: false

  defp schedule_stats do
    Process.send_after(self(), :emit_stats, @stats_interval)
  end

  defp emit_telemetry(event, metadata) do
    :telemetry.execute(
      [:cgraph, :distributed_presence, event],
      %{count: 1, timestamp: System.system_time(:millisecond)},
      metadata
    )
  end
end
