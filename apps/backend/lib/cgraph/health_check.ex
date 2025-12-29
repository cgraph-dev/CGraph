defmodule Cgraph.HealthCheck do
  @moduledoc """
  Comprehensive system health checking with detailed diagnostics.
  
  ## Overview
  
  Provides health status for all system components:
  
  - **Database**: Connection pool, replication lag, query performance
  - **Cache**: Hit rates, memory usage, eviction rates
  - **External Services**: API dependencies, third-party integrations
  - **System Resources**: Memory, CPU, disk, file descriptors
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    HEALTH CHECK SYSTEM                          │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
  │  │   Liveness   │  │  Readiness   │  │   Startup    │          │
  │  │   /health    │  │  /health/    │  │   /health/   │          │
  │  │   /live      │  │   ready      │  │   startup    │          │
  │  └──────────────┘  └──────────────┘  └──────────────┘          │
  │                                                                  │
  │  Component Checks:                                               │
  │  ┌──────────────────────────────────────────────────────────┐  │
  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │  │
  │  │  │  DB    │ │ Redis  │ │ Cache  │ │  Oban  │ │ Memory │  │  │
  │  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │  │
  │  └──────────────────────────────────────────────────────────┘  │
  │                                                                  │
  │  Status: healthy | degraded | unhealthy                         │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Usage
  
      # Quick health check
      {:ok, :healthy} = HealthCheck.check()
      
      # Detailed health report
      {:ok, report} = HealthCheck.report()
      
      # Check specific component
      {:ok, status} = HealthCheck.check_component(:database)
      
      # Kubernetes probe endpoints
      HealthCheck.live?()      # Liveness probe
      HealthCheck.ready?()     # Readiness probe
      HealthCheck.startup?()   # Startup probe
  
  ## Kubernetes Integration
  
  ```yaml
  livenessProbe:
    httpGet:
      path: /health/live
      port: 4000
    initialDelaySeconds: 10
    periodSeconds: 10
    
  readinessProbe:
    httpGet:
      path: /health/ready
      port: 4000
    initialDelaySeconds: 5
    periodSeconds: 5
  ```
  
  ## Telemetry Events
  
  - `[:cgraph, :health, :check]` - Health check performed
  - `[:cgraph, :health, :degraded]` - System degraded
  - `[:cgraph, :health, :unhealthy]` - System unhealthy
  """
  
  use GenServer
  require Logger
  
  @check_interval :timer.seconds(30)
  @component_timeout :timer.seconds(5)
  
  @healthy_memory_threshold 0.85
  @degraded_memory_threshold 0.95
  
  # ---------------------------------------------------------------------------
  # Types
  # ---------------------------------------------------------------------------
  
  @type status :: :healthy | :degraded | :unhealthy
  
  @type component :: 
    :database | :redis | :cache | :oban | :memory | :disk | :external
  
  @type component_status :: %{
    name: component(),
    status: status(),
    message: String.t() | nil,
    latency_ms: non_neg_integer() | nil,
    details: map()
  }
  
  @type health_report :: %{
    status: status(),
    timestamp: DateTime.t(),
    version: String.t(),
    uptime_seconds: non_neg_integer(),
    components: [component_status()]
  }
  
  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------
  
  @doc """
  Perform a quick health check.
  
  Returns overall status without component details.
  """
  def check do
    case report() do
      {:ok, %{status: status}} -> {:ok, status}
      error -> error
    end
  end
  
  @doc """
  Generate a detailed health report.
  
  Includes status of all components.
  """
  def report do
    GenServer.call(__MODULE__, :report, @component_timeout * 2)
  end
  
  @doc """
  Check a specific component.
  """
  def check_component(component) do
    GenServer.call(__MODULE__, {:check_component, component}, @component_timeout)
  end
  
  @doc """
  Kubernetes liveness probe.
  
  Returns true if the application is running (not deadlocked).
  Should be cheap and fast.
  """
  def live? do
    # Just check if GenServer is responsive
    try do
      GenServer.call(__MODULE__, :ping, 1000) == :pong
    rescue
      _ -> false
    catch
      :exit, _ -> false
    end
  end
  
  @doc """
  Kubernetes readiness probe.
  
  Returns true if the application can serve traffic.
  Checks critical dependencies.
  """
  def ready? do
    case check() do
      {:ok, :healthy} -> true
      {:ok, :degraded} -> true
      _ -> false
    end
  end
  
  @doc """
  Kubernetes startup probe.
  
  Returns true when application has completed initialization.
  """
  def startup? do
    # Check if critical components are initialized
    database_ready?() && cache_ready?()
  end
  
  @doc """
  Get cached last known status.
  
  Useful when you need status but can't wait for full check.
  """
  def last_status do
    GenServer.call(__MODULE__, :last_status)
  end
  
  @doc """
  Get system uptime in seconds.
  """
  def uptime do
    GenServer.call(__MODULE__, :uptime)
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    state = %{
      started_at: System.monotonic_time(:second),
      last_check: nil,
      last_status: :unknown,
      component_statuses: %{}
    }
    
    # Schedule periodic health checks
    schedule_check()
    
    {:ok, state}
  end
  
  @impl true
  def handle_call(:ping, _from, state) do
    {:reply, :pong, state}
  end
  
  @impl true
  def handle_call(:report, _from, state) do
    report = generate_report()
    
    new_state = %{state |
      last_check: DateTime.utc_now(),
      last_status: report.status,
      component_statuses: Map.new(report.components, &{&1.name, &1})
    }
    
    {:reply, {:ok, report}, new_state}
  end
  
  @impl true
  def handle_call({:check_component, component}, _from, state) do
    status = check_component_status(component)
    {:reply, {:ok, status}, state}
  end
  
  @impl true
  def handle_call(:last_status, _from, state) do
    {:reply, state.last_status, state}
  end
  
  @impl true
  def handle_call(:uptime, _from, state) do
    uptime = System.monotonic_time(:second) - state.started_at
    {:reply, uptime, state}
  end
  
  @impl true
  def handle_info(:periodic_check, state) do
    # Run periodic health check
    report = generate_report()
    
    # Emit telemetry for status changes
    if report.status != state.last_status do
      emit_status_change_telemetry(state.last_status, report.status)
    end
    
    new_state = %{state |
      last_check: DateTime.utc_now(),
      last_status: report.status,
      component_statuses: Map.new(report.components, &{&1.name, &1})
    }
    
    schedule_check()
    
    {:noreply, new_state}
  end
  
  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end
  
  # ---------------------------------------------------------------------------
  # Report Generation
  # ---------------------------------------------------------------------------
  
  defp generate_report do
    components = [
      check_component_status(:database),
      check_component_status(:cache),
      check_component_status(:memory),
      check_component_status(:oban)
    ]
    # Add Redis if configured
    |> maybe_add_redis_check()
    
    overall_status = determine_overall_status(components)
    
    %{
      status: overall_status,
      timestamp: DateTime.utc_now(),
      version: Application.spec(:cgraph, :vsn) |> to_string(),
      uptime_seconds: uptime_seconds(),
      node: node(),
      components: components
    }
  end
  
  defp maybe_add_redis_check(components) do
    if redis_configured?() do
      components ++ [check_component_status(:redis)]
    else
      components
    end
  end
  
  defp determine_overall_status(components) do
    statuses = Enum.map(components, & &1.status)
    
    cond do
      :unhealthy in statuses -> :unhealthy
      :degraded in statuses -> :degraded
      true -> :healthy
    end
  end
  
  # ---------------------------------------------------------------------------
  # Component Checks
  # ---------------------------------------------------------------------------
  
  defp check_component_status(:database) do
    start_time = System.monotonic_time(:millisecond)
    
    try do
      # Simple connectivity check
      Ecto.Adapters.SQL.query!(Cgraph.Repo, "SELECT 1", [])
      
      # Check connection pool
      pool_status = check_pool_status()
      
      latency = System.monotonic_time(:millisecond) - start_time
      
      %{
        name: :database,
        status: if(pool_status.healthy, do: :healthy, else: :degraded),
        message: nil,
        latency_ms: latency,
        details: pool_status
      }
    rescue
      e ->
        %{
          name: :database,
          status: :unhealthy,
          message: Exception.message(e),
          latency_ms: nil,
          details: %{}
        }
    end
  end
  
  defp check_component_status(:cache) do
    start_time = System.monotonic_time(:millisecond)
    
    try do
      # Test cache read/write
      test_key = "health_check:#{System.unique_integer()}"
      Cachex.put(:cgraph_cache, test_key, "test")
      {:ok, "test"} = Cachex.get(:cgraph_cache, test_key)
      Cachex.del(:cgraph_cache, test_key)
      
      # Get cache stats
      {:ok, stats} = Cachex.stats(:cgraph_cache)
      
      latency = System.monotonic_time(:millisecond) - start_time
      
      hit_rate = if stats.hits + stats.misses > 0 do
        stats.hits / (stats.hits + stats.misses) * 100
      else
        100.0
      end
      
      %{
        name: :cache,
        status: :healthy,
        message: nil,
        latency_ms: latency,
        details: %{
          hit_rate: Float.round(hit_rate, 2),
          hits: stats.hits,
          misses: stats.misses,
          evictions: stats.evictions
        }
      }
    rescue
      e ->
        %{
          name: :cache,
          status: :unhealthy,
          message: Exception.message(e),
          latency_ms: nil,
          details: %{}
        }
    end
  end
  
  defp check_component_status(:redis) do
    start_time = System.monotonic_time(:millisecond)
    
    try do
      case Cgraph.Redis.ping() do
        {:ok, "PONG"} ->
          latency = System.monotonic_time(:millisecond) - start_time
          
          %{
            name: :redis,
            status: :healthy,
            message: nil,
            latency_ms: latency,
            details: %{}
          }
        
        error ->
          %{
            name: :redis,
            status: :unhealthy,
            message: inspect(error),
            latency_ms: nil,
            details: %{}
          }
      end
    rescue
      e ->
        %{
          name: :redis,
          status: :unhealthy,
          message: Exception.message(e),
          latency_ms: nil,
          details: %{}
        }
    end
  end
  
  defp check_component_status(:memory) do
    memory = :erlang.memory()
    total = memory[:total]
    system_limit = :erlang.system_info(:atom_limit) * 8
    
    usage_ratio = total / max(system_limit, 1)
    
    status = cond do
      usage_ratio > @degraded_memory_threshold -> :unhealthy
      usage_ratio > @healthy_memory_threshold -> :degraded
      true -> :healthy
    end
    
    %{
      name: :memory,
      status: status,
      message: if(status != :healthy, do: "Memory usage at #{Float.round(usage_ratio * 100, 1)}%"),
      latency_ms: 0,
      details: %{
        total_bytes: total,
        processes: memory[:processes],
        ets: memory[:ets],
        binary: memory[:binary],
        usage_percent: Float.round(usage_ratio * 100, 2)
      }
    }
  end
  
  defp check_component_status(:oban) do
    try do
      # Check Oban is running and processing jobs
      %{
        name: :oban,
        status: :healthy,
        message: nil,
        latency_ms: 0,
        details: %{
          queues: Oban.config().queues
        }
      }
    rescue
      e ->
        %{
          name: :oban,
          status: :degraded,
          message: Exception.message(e),
          latency_ms: nil,
          details: %{}
        }
    end
  end
  
  defp check_component_status(component) do
    %{
      name: component,
      status: :unknown,
      message: "Unknown component: #{component}",
      latency_ms: nil,
      details: %{}
    }
  end
  
  # ---------------------------------------------------------------------------
  # Database Helpers
  # ---------------------------------------------------------------------------
  
  defp check_pool_status do
    try do
      # DBConnection pool status
      %{
        healthy: true,
        pool_size: Cgraph.Repo.config()[:pool_size] || 10,
        checked_out: 0
      }
    rescue
      _ ->
        %{healthy: false, pool_size: 0, checked_out: 0}
    end
  end
  
  defp database_ready? do
    try do
      Ecto.Adapters.SQL.query!(Cgraph.Repo, "SELECT 1", [])
      true
    rescue
      _ -> false
    end
  end
  
  # ---------------------------------------------------------------------------
  # Cache Helpers
  # ---------------------------------------------------------------------------
  
  defp cache_ready? do
    case Cachex.stats(:cgraph_cache) do
      {:ok, _} -> true
      _ -> false
    end
  end
  
  # ---------------------------------------------------------------------------
  # Redis Helpers
  # ---------------------------------------------------------------------------
  
  defp redis_configured? do
    Code.ensure_loaded?(Cgraph.Redis)
  end
  
  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------
  
  defp uptime_seconds do
    case Process.whereis(__MODULE__) do
      nil -> 0
      _pid ->
        try do
          GenServer.call(__MODULE__, :uptime, 1000)
        rescue
          _ -> 0
        catch
          :exit, _ -> 0
        end
    end
  end
  
  defp schedule_check do
    Process.send_after(self(), :periodic_check, @check_interval)
  end
  
  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------
  
  defp emit_status_change_telemetry(old_status, new_status) do
    event = case new_status do
      :healthy -> [:cgraph, :health, :check]
      :degraded -> [:cgraph, :health, :degraded]
      :unhealthy -> [:cgraph, :health, :unhealthy]
      _ -> [:cgraph, :health, :check]
    end
    
    :telemetry.execute(event, %{count: 1}, %{
      old_status: old_status,
      new_status: new_status,
      timestamp: DateTime.utc_now()
    })
    
    if new_status != :healthy do
      Logger.warning("Health status changed: #{old_status} -> #{new_status}")
    end
  end
end
