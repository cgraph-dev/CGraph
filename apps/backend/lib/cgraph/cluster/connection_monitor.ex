defmodule CGraph.Cluster.ConnectionMonitor do
  @moduledoc """
  WebSocket Connection Monitor

  Tracks active WebSocket connections per node and provides
  capacity checks for connection backpressure. When the node
  reaches capacity (configurable max), new connections are
  gracefully rejected with WebSocket close code 1013 (Try Again Later).

  ## Configuration

      config :cgraph, CGraph.Cluster.ConnectionMonitor,
        max_connections: 10_000,
        capacity_threshold: 0.9

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────┐
  │              CONNECTION MONITOR                          │
  ├─────────────────────────────────────────────────────────┤
  │                                                          │
  │  WebSocket Connect ──► Check Capacity ──► Accept/Reject │
  │                             │                            │
  │                    ┌────────▼────────┐                   │
  │                    │  ETS Counter    │                   │
  │                    │  (atomic incr)  │                   │
  │                    └─────────────────┘                   │
  │                                                          │
  │  Metrics:                                                │
  │  - :telemetry active_connections gauge                   │
  │  - :telemetry connections_rejected counter               │
  │                                                          │
  └─────────────────────────────────────────────────────────┘
  ```
  """

  use GenServer
  require Logger

  @ets_table :cgraph_ws_connections
  @default_max_connections 10_000
  @default_threshold 0.9

  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------

  @doc "Starts the ConnectionMonitor GenServer."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Register a new WebSocket connection. Returns :ok or {:error, :at_capacity}."
  @spec register_connection() :: :ok | {:error, :at_capacity}
  def register_connection do
    if at_capacity?() do
      emit_rejection_telemetry()
      {:error, :at_capacity}
    else
      :ets.update_counter(@ets_table, :active, {2, 1}, {:active, 0})

      emit_telemetry()
      :ok
    end
  end

  @doc "Unregister a WebSocket connection (on disconnect)."
  @spec unregister_connection() :: :ok
  def unregister_connection do
    try do
      :ets.update_counter(@ets_table, :active, {2, -1, 0, 0}, {:active, 0})
    rescue
      ArgumentError -> :ok
    end

    emit_telemetry()
    :ok
  end

  @doc "Get the current number of active WebSocket connections."
  @spec connection_count() :: non_neg_integer()
  def connection_count do
    case :ets.lookup(@ets_table, :active) do
      [{:active, count}] -> max(count, 0)
      [] -> 0
    end
  rescue
    ArgumentError -> 0
  end

  @doc "Check if the node is at or above capacity threshold."
  @spec at_capacity?(float()) :: boolean()
  def at_capacity?(threshold \\ nil) do
    threshold = threshold || config(:capacity_threshold, @default_threshold)
    max = max_connections()
    count = connection_count()

    count / max >= threshold
  end

  @doc "Get the configured maximum WebSocket connections."
  @spec max_connections() :: pos_integer()
  def max_connections do
    config(:max_connections, @default_max_connections)
  end

  @doc "Get connection stats as a map."
  @spec stats() :: map()
  def stats do
    max = max_connections()
    count = connection_count()

    %{
      active_connections: count,
      max_connections: max,
      utilization: Float.round(count / max, 3),
      at_capacity: at_capacity?()
    }
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @impl true
  def init(_opts) do
    # Create ETS table for atomic counter operations
    :ets.new(@ets_table, [
      :named_table,
      :public,
      :set,
      {:read_concurrency, true},
      {:write_concurrency, true}
    ])

    # Initialize counter
    :ets.insert(@ets_table, {:active, 0})

    # Schedule periodic stats logging
    schedule_stats_report()

    Logger.info(
      "ConnectionMonitor started: max_connections=#{max_connections()}, " <>
        "threshold=#{config(:capacity_threshold, @default_threshold)}"
    )

    {:ok, %{}}
  end

  @impl true
  def handle_info(:report_stats, state) do
    stats = stats()

    if stats.utilization > 0.7 do
      Logger.warning(
        "WebSocket capacity warning: #{stats.active_connections}/#{stats.max_connections} " <>
          "(#{Float.round(stats.utilization * 100, 1)}%)"
      )
    end

    :telemetry.execute(
      [:cgraph, :websocket, :capacity],
      %{
        active: stats.active_connections,
        max: stats.max_connections,
        utilization: stats.utilization
      },
      %{node: node()}
    )

    schedule_stats_report()
    {:noreply, state}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp config(key, default) do
    Application.get_env(:cgraph, __MODULE__, [])
    |> Keyword.get(key, default)
  end

  defp schedule_stats_report do
    Process.send_after(self(), :report_stats, 30_000)
  end

  defp emit_telemetry do
    :telemetry.execute(
      [:cgraph, :websocket, :connections],
      %{count: connection_count()},
      %{node: node()}
    )
  end

  defp emit_rejection_telemetry do
    :telemetry.execute(
      [:cgraph, :websocket, :rejected],
      %{count: 1},
      %{reason: :at_capacity, node: node()}
    )
  end
end
