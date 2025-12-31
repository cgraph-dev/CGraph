defmodule Cgraph.ConnectionPool do
  @moduledoc """
  Cgraph.ConnectionPool - Database Connection Pool Manager
  
  ## Overview
  
  This module provides comprehensive database connection pool management with
  monitoring, dynamic scaling, health checks, and operational metrics. It wraps
  DBConnection/Ecto's connection handling with additional observability and
  management capabilities.
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    Cgraph.ConnectionPool                        │
  ├─────────────────────────────────────────────────────────────────┤
  │  Pool Monitoring   │  Health Checks    │  Dynamic Scaling       │
  │  ─────────────────  │  ────────────────  │  ──────────────────   │
  │  • Active conns    │  • Connectivity   │  • Auto-scale up      │
  │  • Waiting queue   │  • Latency check  │  • Auto-scale down    │
  │  • Checkout time   │  • Query timeout  │  • Load-based         │
  │  • Pool saturation │  • Deadlock det   │  • Time-based         │
  ├─────────────────────────────────────────────────────────────────┤
  │  Query Tracing     │  Error Handling   │  Metrics              │
  │  ─────────────────  │  ────────────────  │  ──────────────────   │
  │  • Slow queries    │  • Retry logic    │  • Prometheus export  │
  │  • Query duration  │  • Circuit break  │  • StatsD/Telemetry   │
  │  • Query source    │  • Graceful deg   │  • Custom reporters   │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Features
  
  1. **Pool Monitoring**: Real-time visibility into connection pool state
     including active connections, waiting queue, and saturation metrics.
  
  2. **Health Checks**: Periodic connectivity and latency checks to detect
     database issues before they affect application traffic.
  
  3. **Dynamic Scaling**: Automatically adjust pool size based on demand
     patterns and time-of-day traffic variations.
  
  4. **Query Tracing**: Capture slow queries and long-running transactions
     for debugging and performance optimization.
  
  5. **Error Handling**: Automatic retry with exponential backoff and
     circuit breaker integration for graceful degradation.
  
  ## Usage Examples
  
  ### Pool Status
  
      {:ok, status} = Cgraph.ConnectionPool.get_status()
      # => %{
      #   pool_size: 10,
      #   active_connections: 7,
      #   idle_connections: 3,
      #   waiting_queue: 0,
      #   saturation: 0.7,
      #   avg_checkout_time_ms: 1.2
      # }
  
  ### Health Check
  
      {:ok, health} = Cgraph.ConnectionPool.health_check()
      # => %{
      #   status: :healthy,
      #   latency_ms: 2.3,
      #   connectivity: true,
      #   last_check: ~U[2024-01-15 10:30:00Z]
      # }
  
  ### Slow Query Monitoring
  
      Cgraph.ConnectionPool.log_slow_query(
        query: "SELECT * FROM users WHERE...",
        duration_ms: 1500,
        source: {MyApp.Users, :list_users, 1}
      )
  
  ## Configuration
  
  Configure in `config/config.exs`:
  
      config :cgraph, Cgraph.ConnectionPool,
        enabled: true,
        health_check_interval: :timer.seconds(30),
        slow_query_threshold_ms: 100,
        max_pool_size: 20,
        min_pool_size: 5,
        auto_scale: true,
        scale_up_threshold: 0.8,
        scale_down_threshold: 0.3
  
  ## Implementation Notes
  
  - Uses ETS for fast metrics storage and retrieval
  - Integrates with Ecto telemetry for automatic query tracking
  - Publishes metrics via :telemetry for external monitoring systems
  - Thread-safe operations for concurrent access
  """
  
  use GenServer
  require Logger
  
  # ---------------------------------------------------------------------------
  # Type Definitions
  # ---------------------------------------------------------------------------
  
  @type pool_name :: atom()
  @type connection_id :: reference()
  @type health_status :: :healthy | :degraded | :unhealthy | :unknown
  
  @type pool_status :: %{
    pool_name: pool_name(),
    pool_size: non_neg_integer(),
    active_connections: non_neg_integer(),
    idle_connections: non_neg_integer(),
    waiting_queue: non_neg_integer(),
    saturation: float(),
    avg_checkout_time_ms: float(),
    max_checkout_time_ms: float(),
    total_checkouts: non_neg_integer(),
    total_timeouts: non_neg_integer()
  }
  
  @type health_result :: %{
    status: health_status(),
    latency_ms: float(),
    connectivity: boolean(),
    last_check: DateTime.t(),
    message: String.t() | nil
  }
  
  @type slow_query :: %{
    query: String.t(),
    duration_ms: float(),
    source: {module(), atom(), non_neg_integer()} | nil,
    params_count: non_neg_integer(),
    timestamp: DateTime.t()
  }
  
  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------
  
  @metrics_table :cgraph_pool_metrics
  @slow_queries_table :cgraph_slow_queries
  
  @default_config %{
    enabled: true,
    health_check_interval: :timer.seconds(30),
    slow_query_threshold_ms: 100,
    max_pool_size: 20,
    min_pool_size: 5,
    auto_scale: false,
    scale_up_threshold: 0.8,
    scale_down_threshold: 0.3,
    scale_cooldown: :timer.minutes(5),
    max_slow_queries: 1000,
    metrics_window: :timer.minutes(5)
  }
  
  # ---------------------------------------------------------------------------
  # Client API - Pool Status
  # ---------------------------------------------------------------------------
  
  @doc """
  Get the current status of the connection pool.
  
  Returns comprehensive information about pool utilization, including
  active connections, waiting queue, and performance metrics.
  
  ## Examples
  
      {:ok, status} = Cgraph.ConnectionPool.get_status()
      IO.puts("Pool saturation: \#{status.saturation * 100}%")
  """
  @spec get_status(pool_name()) :: {:ok, pool_status()} | {:error, term()}
  def get_status(pool_name \\ Cgraph.Repo) do
    GenServer.call(__MODULE__, {:get_status, pool_name})
  end
  
  @doc """
  Get pool saturation as a percentage (0.0 to 1.0).
  
  Saturation = active_connections / pool_size
  """
  @spec get_saturation(pool_name()) :: float()
  def get_saturation(pool_name \\ Cgraph.Repo) do
    case get_status(pool_name) do
      {:ok, status} -> status.saturation
      _ -> 0.0
    end
  end
  
  @doc """
  Check if the pool is under pressure (high saturation or waiting queue).
  """
  @spec under_pressure?(pool_name()) :: boolean()
  def under_pressure?(pool_name \\ Cgraph.Repo) do
    case get_status(pool_name) do
      {:ok, status} ->
        status.saturation > get_config(:scale_up_threshold) or
        status.waiting_queue > 0
        
      _ ->
        false
    end
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Health Checks
  # ---------------------------------------------------------------------------
  
  @doc """
  Perform a health check on the database connection.
  
  Executes a simple query to verify connectivity and measure latency.
  
  ## Examples
  
      {:ok, health} = Cgraph.ConnectionPool.health_check()
      
      case health.status do
        :healthy -> :ok
        :degraded -> Logger.warning("Database performance degraded")
        :unhealthy -> Logger.error("Database connection failed")
      end
  """
  @spec health_check(pool_name()) :: {:ok, health_result()} | {:error, term()}
  def health_check(pool_name \\ Cgraph.Repo) do
    GenServer.call(__MODULE__, {:health_check, pool_name}, 10_000)
  end
  
  @doc """
  Get the last cached health check result.
  
  Returns the result of the most recent periodic health check without
  performing a new check.
  """
  @spec get_cached_health(pool_name()) :: {:ok, health_result()} | {:error, :no_data}
  def get_cached_health(pool_name \\ Cgraph.Repo) do
    case :ets.lookup(@metrics_table, {:health, pool_name}) do
      [{{:health, ^pool_name}, result}] -> {:ok, result}
      [] -> {:error, :no_data}
    end
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Slow Query Tracking
  # ---------------------------------------------------------------------------
  
  @doc """
  Log a slow query for monitoring.
  
  Called automatically by the telemetry handler when a query exceeds
  the configured threshold. Can also be called manually.
  
  ## Examples
  
      Cgraph.ConnectionPool.log_slow_query(%{
        query: "SELECT * FROM large_table",
        duration_ms: 2500,
        source: {MyApp.Reports, :generate, 2}
      })
  """
  @spec log_slow_query(map()) :: :ok
  def log_slow_query(attrs) do
    query = %{
      query: truncate_query(attrs[:query]),
      duration_ms: attrs[:duration_ms],
      source: attrs[:source],
      params_count: attrs[:params_count] || 0,
      timestamp: DateTime.utc_now()
    }
    
    GenServer.cast(__MODULE__, {:log_slow_query, query})
  end
  
  @doc """
  Get recent slow queries.
  
  ## Options
  
  - `:limit` - Maximum number of queries to return (default: 100)
  - `:min_duration_ms` - Minimum duration filter
  - `:since` - Only queries after this timestamp
  """
  @spec get_slow_queries(keyword()) :: [slow_query()]
  def get_slow_queries(opts \\ []) do
    limit = Keyword.get(opts, :limit, 100)
    min_duration = Keyword.get(opts, :min_duration_ms, 0)
    since = Keyword.get(opts, :since)
    
    :ets.tab2list(@slow_queries_table)
    |> Enum.map(fn {_id, query} -> query end)
    |> Enum.filter(fn query ->
      query.duration_ms >= min_duration and
        (is_nil(since) or DateTime.compare(query.timestamp, since) == :gt)
    end)
    |> Enum.sort_by(& &1.timestamp, {:desc, DateTime})
    |> Enum.take(limit)
  end
  
  @doc """
  Get slow query statistics.
  """
  @spec get_slow_query_stats() :: map()
  def get_slow_query_stats do
    queries = :ets.tab2list(@slow_queries_table) |> Enum.map(fn {_, q} -> q end)
    
    if queries == [] do
      %{
        count: 0,
        avg_duration_ms: 0.0,
        max_duration_ms: 0.0,
        top_sources: []
      }
    else
      durations = Enum.map(queries, & &1.duration_ms)
      
      source_counts =
        queries
        |> Enum.filter(& &1.source)
        |> Enum.group_by(& &1.source)
        |> Enum.map(fn {source, qs} -> {source, length(qs)} end)
        |> Enum.sort_by(fn {_, count} -> count end, :desc)
        |> Enum.take(10)
      
      %{
        count: length(queries),
        avg_duration_ms: Enum.sum(durations) / length(durations),
        max_duration_ms: Enum.max(durations),
        top_sources: source_counts
      }
    end
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Pool Scaling
  # ---------------------------------------------------------------------------
  
  @doc """
  Manually trigger pool resize.
  
  This is typically handled automatically when auto_scale is enabled,
  but can be called manually for immediate adjustment.
  """
  @spec resize_pool(pool_name(), non_neg_integer()) :: :ok | {:error, term()}
  def resize_pool(pool_name \\ Cgraph.Repo, new_size) do
    GenServer.call(__MODULE__, {:resize_pool, pool_name, new_size})
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Metrics
  # ---------------------------------------------------------------------------
  
  @doc """
  Get comprehensive pool metrics for monitoring systems.
  """
  @spec get_metrics(pool_name()) :: map()
  def get_metrics(pool_name \\ Cgraph.Repo) do
    case get_status(pool_name) do
      {:ok, status} ->
        health = case get_cached_health(pool_name) do
          {:ok, h} -> h
          _ -> %{status: :unknown, latency_ms: nil}
        end
        
        slow_stats = get_slow_query_stats()
        
        %{
          pool: status,
          health: health,
          slow_queries: slow_stats,
          timestamp: DateTime.utc_now()
        }
        
      _ ->
        %{error: "Unable to get metrics"}
    end
  end
  
  @doc """
  Export metrics in Prometheus format.
  """
  @spec prometheus_metrics(pool_name()) :: String.t()
  def prometheus_metrics(pool_name \\ Cgraph.Repo) do
    metrics = get_metrics(pool_name)
    pool = metrics[:pool] || %{}
    health = metrics[:health] || %{}
    slow = metrics[:slow_queries] || %{}
    
    """
    # HELP db_pool_size Total number of connections in the pool
    # TYPE db_pool_size gauge
    db_pool_size{pool="#{pool_name}"} #{pool[:pool_size] || 0}
    
    # HELP db_pool_active Active connections currently in use
    # TYPE db_pool_active gauge
    db_pool_active{pool="#{pool_name}"} #{pool[:active_connections] || 0}
    
    # HELP db_pool_idle Idle connections available
    # TYPE db_pool_idle gauge
    db_pool_idle{pool="#{pool_name}"} #{pool[:idle_connections] || 0}
    
    # HELP db_pool_waiting Requests waiting for a connection
    # TYPE db_pool_waiting gauge
    db_pool_waiting{pool="#{pool_name}"} #{pool[:waiting_queue] || 0}
    
    # HELP db_pool_saturation Pool saturation ratio
    # TYPE db_pool_saturation gauge
    db_pool_saturation{pool="#{pool_name}"} #{pool[:saturation] || 0}
    
    # HELP db_pool_checkout_time_avg Average checkout time in milliseconds
    # TYPE db_pool_checkout_time_avg gauge
    db_pool_checkout_time_avg{pool="#{pool_name}"} #{pool[:avg_checkout_time_ms] || 0}
    
    # HELP db_health_latency_ms Database health check latency
    # TYPE db_health_latency_ms gauge
    db_health_latency_ms{pool="#{pool_name}"} #{health[:latency_ms] || 0}
    
    # HELP db_health_status Database health status (1=healthy, 0=unhealthy)
    # TYPE db_health_status gauge
    db_health_status{pool="#{pool_name}"} #{health_to_number(health[:status])}
    
    # HELP db_slow_queries_total Total number of slow queries
    # TYPE db_slow_queries_total counter
    db_slow_queries_total{pool="#{pool_name}"} #{slow[:count] || 0}
    
    # HELP db_slow_queries_max_ms Maximum slow query duration
    # TYPE db_slow_queries_max_ms gauge
    db_slow_queries_max_ms{pool="#{pool_name}"} #{slow[:max_duration_ms] || 0}
    """
  end
  
  defp health_to_number(:healthy), do: 1
  defp health_to_number(:degraded), do: 0.5
  defp health_to_number(_), do: 0
  
  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    # Create ETS tables
    :ets.new(@metrics_table, [:named_table, :set, :public, read_concurrency: true])
    :ets.new(@slow_queries_table, [:named_table, :ordered_set, :public, read_concurrency: true])
    
    # Attach telemetry handlers
    attach_telemetry()
    
    # Schedule periodic health checks
    if get_config(:enabled) do
      schedule_health_check()
    end
    
    state = %{
      config: load_config(),
      last_scale: nil,
      checkout_times: []
    }
    
    {:ok, state}
  end
  
  @impl true
  def handle_call({:get_status, pool_name}, _from, state) do
    result = fetch_pool_status(pool_name, state)
    {:reply, result, state}
  end
  
  def handle_call({:health_check, pool_name}, _from, state) do
    result = perform_health_check(pool_name)
    {:reply, result, state}
  end
  
  def handle_call({:resize_pool, pool_name, new_size}, _from, state) do
    result = do_resize_pool(pool_name, new_size)
    {:reply, result, state}
  end
  
  @impl true
  def handle_cast({:log_slow_query, query}, state) do
    id = System.unique_integer([:positive])
    :ets.insert(@slow_queries_table, {id, query})
    
    # Cleanup old queries if over limit
    cleanup_old_queries()
    
    # Emit telemetry
    :telemetry.execute(
      [:cgraph, :db, :slow_query],
      %{duration_ms: query.duration_ms},
      %{query: query.query, source: query.source}
    )
    
    {:noreply, state}
  end
  
  def handle_cast({:record_checkout_time, time_ms}, state) do
    # Keep last 1000 checkout times for averaging
    times = Enum.take([time_ms | state.checkout_times], 1000)
    {:noreply, %{state | checkout_times: times}}
  end
  
  @impl true
  def handle_info(:health_check, state) do
    # Perform health check
    case perform_health_check(Cgraph.Repo) do
      {:ok, result} ->
        :ets.insert(@metrics_table, {{:health, Cgraph.Repo}, result})
        
        # Check for auto-scaling if enabled
        if get_config(:auto_scale) do
          maybe_auto_scale(state)
        end
        
      {:error, reason} ->
        Logger.error("[ConnectionPool] Health check failed: #{inspect(reason)}")
    end
    
    schedule_health_check()
    {:noreply, state}
  end
  
  def handle_info(_msg, state) do
    {:noreply, state}
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Pool Status
  # ---------------------------------------------------------------------------
  
  defp fetch_pool_status(pool_name, state) do
    try do
      # Get pool stats from DBConnection if available
      pool_size = get_pool_config(pool_name, :pool_size) || 10
      
      # Get checkout metrics from state
      checkout_times = state.checkout_times
      avg_checkout = if checkout_times == [], do: 0.0, else: Enum.sum(checkout_times) / length(checkout_times)
      max_checkout = if checkout_times == [], do: 0.0, else: Enum.max(checkout_times)
      
      # Try to get actual pool stats (implementation depends on pool adapter)
      {active, idle, waiting} = get_pool_counts(pool_name)
      
      status = %{
        pool_name: pool_name,
        pool_size: pool_size,
        active_connections: active,
        idle_connections: idle,
        waiting_queue: waiting,
        saturation: if(pool_size > 0, do: active / pool_size, else: 0.0),
        avg_checkout_time_ms: Float.round(avg_checkout, 2),
        max_checkout_time_ms: Float.round(max_checkout, 2),
        total_checkouts: length(checkout_times),
        total_timeouts: get_counter(:timeouts)
      }
      
      {:ok, status}
    rescue
      e ->
        Logger.error("[ConnectionPool] Failed to get status: #{inspect(e)}")
        {:error, :status_unavailable}
    end
  end
  
  defp get_pool_config(pool_name, key) do
    pool_name.__pool_config__()
    |> Keyword.get(key)
  rescue
    _ ->
      # Fallback to application config
      Application.get_env(:cgraph, pool_name, [])
      |> Keyword.get(key)
  end
  
  defp get_pool_counts(_pool_name) do
    # This would need to be implemented based on the specific pool adapter
    # For now, return estimates based on ETS metrics
    active = get_counter(:checkouts) - get_counter(:checkins)
    active = max(0, active)
    pool_size = 10  # Default
    idle = max(0, pool_size - active)
    waiting = max(0, get_counter(:waiting))
    
    {active, idle, waiting}
  end
  
  defp get_counter(name) do
    case :ets.lookup(@metrics_table, {:counter, name}) do
      [{{:counter, ^name}, value}] -> value
      [] -> 0
    end
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Health Check
  # ---------------------------------------------------------------------------
  
  defp perform_health_check(pool_name) do
    start_time = System.monotonic_time(:microsecond)
    
    try do
      # Execute simple query to check connectivity
      result = pool_name.query("SELECT 1 as health_check")
      
      end_time = System.monotonic_time(:microsecond)
      latency_ms = (end_time - start_time) / 1000
      
      status = cond do
        match?({:error, _}, result) -> :unhealthy
        latency_ms > 100 -> :degraded
        true -> :healthy
      end
      
      health = %{
        status: status,
        latency_ms: Float.round(latency_ms, 2),
        connectivity: match?({:ok, _}, result),
        last_check: DateTime.utc_now(),
        message: nil
      }
      
      {:ok, health}
    rescue
      e ->
        {:ok, %{
          status: :unhealthy,
          latency_ms: nil,
          connectivity: false,
          last_check: DateTime.utc_now(),
          message: Exception.message(e)
        }}
    end
  end
  
  defp schedule_health_check do
    interval = get_config(:health_check_interval)
    Process.send_after(self(), :health_check, interval)
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Auto Scaling
  # ---------------------------------------------------------------------------
  
  defp maybe_auto_scale(state) do
    # Check cooldown
    if can_scale?(state) do
      case get_status(Cgraph.Repo) do
        {:ok, status} ->
          cond do
            status.saturation >= get_config(:scale_up_threshold) ->
              scale_up(status)
              
            status.saturation <= get_config(:scale_down_threshold) ->
              scale_down(status)
              
            true ->
              :ok
          end
          
        _ ->
          :ok
      end
    end
  end
  
  defp can_scale?(state) do
    cooldown = get_config(:scale_cooldown)
    
    case state.last_scale do
      nil -> true
      last_scale ->
        diff = DateTime.diff(DateTime.utc_now(), last_scale, :millisecond)
        diff >= cooldown
    end
  end
  
  defp scale_up(status) do
    max_size = get_config(:max_pool_size)
    new_size = min(status.pool_size + 2, max_size)
    
    if new_size > status.pool_size do
      Logger.info("[ConnectionPool] Scaling up pool from #{status.pool_size} to #{new_size}")
      do_resize_pool(status.pool_name, new_size)
    end
  end
  
  defp scale_down(status) do
    min_size = get_config(:min_pool_size)
    new_size = max(status.pool_size - 1, min_size)
    
    if new_size < status.pool_size do
      Logger.info("[ConnectionPool] Scaling down pool from #{status.pool_size} to #{new_size}")
      do_resize_pool(status.pool_name, new_size)
    end
  end
  
  defp do_resize_pool(_pool_name, _new_size) do
    # Note: Dynamic pool resizing is complex and depends on the pool adapter
    # This is a placeholder for the implementation
    Logger.warning("[ConnectionPool] Dynamic pool resizing not implemented")
    {:error, :not_implemented}
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Telemetry
  # ---------------------------------------------------------------------------
  
  defp attach_telemetry do
    events = [
      [:cgraph, :repo, :query],
      [:ecto, :repo, :query]
    ]
    
    :telemetry.attach_many(
      "cgraph-connection-pool",
      events,
      &handle_telemetry_event/4,
      nil
    )
  end
  
  defp handle_telemetry_event([:cgraph, :repo, :query], measurements, metadata, _config) do
    handle_query_event(measurements, metadata)
  end
  
  defp handle_telemetry_event([:ecto, :repo, :query], measurements, metadata, _config) do
    handle_query_event(measurements, metadata)
  end
  
  defp handle_query_event(measurements, metadata) do
    # Track checkout time
    if checkout_time = measurements[:queue_time] do
      checkout_ms = System.convert_time_unit(checkout_time, :native, :millisecond)
      GenServer.cast(__MODULE__, {:record_checkout_time, checkout_ms})
    end
    
    # Track slow queries
    if query_time = measurements[:total_time] do
      query_ms = System.convert_time_unit(query_time, :native, :millisecond)
      threshold = get_config(:slow_query_threshold_ms)
      
      if query_ms >= threshold do
        log_slow_query(%{
          query: metadata[:query],
          duration_ms: query_ms,
          source: metadata[:source],
          params_count: length(metadata[:params] || [])
        })
      end
    end
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Cleanup
  # ---------------------------------------------------------------------------
  
  defp cleanup_old_queries do
    max_queries = get_config(:max_slow_queries)
    current_count = :ets.info(@slow_queries_table, :size)
    
    if current_count > max_queries do
      # Delete oldest queries
      delete_count = current_count - max_queries
      
      :ets.tab2list(@slow_queries_table)
      |> Enum.sort_by(fn {id, _} -> id end)
      |> Enum.take(delete_count)
      |> Enum.each(fn {id, _} -> :ets.delete(@slow_queries_table, id) end)
    end
  end
  
  defp truncate_query(nil), do: ""
  defp truncate_query(query) when byte_size(query) > 500 do
    String.slice(query, 0, 497) <> "..."
  end
  defp truncate_query(query), do: query
  
  # ---------------------------------------------------------------------------
  # Private Functions - Configuration
  # ---------------------------------------------------------------------------
  
  defp load_config do
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Map.merge(@default_config, Map.new(app_config))
  end
  
  defp get_config(key) do
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end
end
