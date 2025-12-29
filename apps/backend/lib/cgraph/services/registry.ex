defmodule Cgraph.Services.Registry do
  @moduledoc """
  Service registry for dependency management and health monitoring.
  
  ## Overview
  
  Provides centralized service discovery and health tracking:
  
  - **Service Registration**: Register internal and external services
  - **Health Monitoring**: Periodic health checks with state tracking
  - **Dependency Graph**: Understand service dependencies
  - **Graceful Degradation**: Know which services are available
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     SERVICE REGISTRY                            │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
  │   │  Database   │     │    Redis    │     │   Storage   │       │
  │   │    (PG)     │     │   (Cache)   │     │    (S3)     │       │
  │   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘       │
  │          │                   │                   │              │
  │          └───────────────────┼───────────────────┘              │
  │                              │                                  │
  │                       ┌──────┴──────┐                          │
  │                       │   Registry  │                          │
  │                       │   GenServer │                          │
  │                       └──────┬──────┘                          │
  │                              │                                  │
  │          ┌───────────────────┼───────────────────┐             │
  │          │                   │                   │             │
  │   ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐     │
  │   │    Email    │     │   Payment   │     │     SMS     │     │
  │   │   Service   │     │   Gateway   │     │   Provider  │     │
  │   └─────────────┘     └─────────────┘     └─────────────┘     │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Service Types
  
  | Type | Description | Examples |
  |------|-------------|----------|
  | `:internal` | In-process services | Oban, Cachex |
  | `:database` | Database connections | PostgreSQL, Redis |
  | `:external` | External APIs | Payment, Email, SMS |
  | `:optional` | Non-critical services | Analytics, Logging |
  
  ## Health States
  
  | State | Description |
  |-------|-------------|
  | `:healthy` | Service responding normally |
  | `:degraded` | Slow or partial responses |
  | `:unhealthy` | Not responding |
  | `:unknown` | Not yet checked |
  
  ## Usage
  
      # Register a service
      Registry.register("payment_gateway", %{
        type: :external,
        url: "https://api.stripe.com",
        health_check: &PaymentGateway.health_check/0,
        critical: true
      })
      
      # Check service health
      {:ok, :healthy} = Registry.status("payment_gateway")
      
      # Get all services
      services = Registry.all()
      
      # Check if system is healthy
      true = Registry.system_healthy?()
  
  ## Telemetry
  
  - `[:cgraph, :service, :health_check]` - Health check results
  - `[:cgraph, :service, :state_change]` - Service state changes
  """
  
  use GenServer
  require Logger
  
  @type service_name :: String.t()
  @type service_type :: :internal | :database | :external | :optional
  @type health_state :: :healthy | :degraded | :unhealthy | :unknown
  
  @type service :: %{
    name: service_name(),
    type: service_type(),
    critical: boolean(),
    health_check: (-> health_state()) | nil,
    check_interval: pos_integer(),
    state: health_state(),
    last_check: DateTime.t() | nil,
    last_error: String.t() | nil,
    consecutive_failures: non_neg_integer(),
    dependencies: [service_name()]
  }
  
  @default_check_interval :timer.seconds(30)
  @degraded_threshold_ms 1000
  # @failure_threshold - Used for escalation logic (reserved for future use)

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Start the service registry.
  """
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @doc """
  Register a service with the registry.
  
  ## Config
  
  - `:type` - Service type (:internal, :database, :external, :optional)
  - `:critical` - Whether service is required for system health
  - `:health_check` - Function that returns health state
  - `:check_interval` - How often to check health (ms)
  - `:dependencies` - List of service names this depends on
  
  ## Example
  
      Registry.register("postgres", %{
        type: :database,
        critical: true,
        health_check: fn -> 
          case Repo.query("SELECT 1") do
            {:ok, _} -> :healthy
            _ -> :unhealthy
          end
        end
      })
  """
  def register(name, config) do
    GenServer.call(__MODULE__, {:register, name, config})
  end
  
  @doc """
  Deregister a service.
  """
  def deregister(name) do
    GenServer.call(__MODULE__, {:deregister, name})
  end
  
  @doc """
  Get the current status of a service.
  """
  def status(name) do
    GenServer.call(__MODULE__, {:status, name})
  end
  
  @doc """
  Get detailed information about a service.
  """
  def get(name) do
    GenServer.call(__MODULE__, {:get, name})
  end
  
  @doc """
  Get all registered services.
  """
  def all do
    GenServer.call(__MODULE__, :all)
  end
  
  @doc """
  Check if the overall system is healthy.
  
  Returns true if all critical services are healthy.
  """
  def system_healthy? do
    GenServer.call(__MODULE__, :system_healthy?)
  end
  
  @doc """
  Get system health summary.
  """
  def health_summary do
    GenServer.call(__MODULE__, :health_summary)
  end
  
  @doc """
  Manually trigger health check for a service.
  """
  def check_health(name) do
    GenServer.call(__MODULE__, {:check_health, name})
  end
  
  @doc """
  Manually trigger health checks for all services.
  """
  def check_all do
    GenServer.call(__MODULE__, :check_all)
  end
  
  @doc """
  Get the dependency graph as a map.
  """
  def dependency_graph do
    GenServer.call(__MODULE__, :dependency_graph)
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(_opts) do
    state = %{
      services: %{},
      check_refs: %{}
    }
    
    # Register built-in services
    {:ok, state, {:continue, :register_builtin}}
  end
  
  @impl true
  def handle_continue(:register_builtin, state) do
    # Register core services
    builtin_services = [
      {"postgres", %{
        type: :database,
        critical: true,
        health_check: &check_postgres/0
      }},
      {"redis", %{
        type: :database,
        critical: false,
        health_check: &check_redis/0
      }},
      {"cachex", %{
        type: :internal,
        critical: false,
        health_check: &check_cachex/0
      }},
      {"oban", %{
        type: :internal,
        critical: false,
        health_check: &check_oban/0
      }}
    ]
    
    state = Enum.reduce(builtin_services, state, fn {name, config}, acc ->
      do_register(acc, name, config)
    end)
    
    {:noreply, state}
  end
  
  @impl true
  def handle_call({:register, name, config}, _from, state) do
    state = do_register(state, name, config)
    {:reply, :ok, state}
  end
  
  @impl true
  def handle_call({:deregister, name}, _from, state) do
    # Cancel any scheduled checks
    state = cancel_check(state, name)
    
    services = Map.delete(state.services, name)
    {:reply, :ok, %{state | services: services}}
  end
  
  @impl true
  def handle_call({:status, name}, _from, state) do
    result = case Map.get(state.services, name) do
      nil -> {:error, :not_found}
      service -> {:ok, service.state}
    end
    {:reply, result, state}
  end
  
  @impl true
  def handle_call({:get, name}, _from, state) do
    result = case Map.get(state.services, name) do
      nil -> {:error, :not_found}
      service -> {:ok, service}
    end
    {:reply, result, state}
  end
  
  @impl true
  def handle_call(:all, _from, state) do
    {:reply, state.services, state}
  end
  
  @impl true
  def handle_call(:system_healthy?, _from, state) do
    healthy = state.services
    |> Enum.filter(fn {_, service} -> service.critical end)
    |> Enum.all?(fn {_, service} -> service.state in [:healthy, :degraded] end)
    
    {:reply, healthy, state}
  end
  
  @impl true
  def handle_call(:health_summary, _from, state) do
    summary = %{
      total: map_size(state.services),
      healthy: count_by_state(state.services, :healthy),
      degraded: count_by_state(state.services, :degraded),
      unhealthy: count_by_state(state.services, :unhealthy),
      unknown: count_by_state(state.services, :unknown),
      critical_healthy: critical_healthy?(state.services),
      services: Enum.map(state.services, fn {name, service} ->
        %{
          name: name,
          type: service.type,
          state: service.state,
          critical: service.critical,
          last_check: service.last_check,
          consecutive_failures: service.consecutive_failures
        }
      end)
    }
    
    {:reply, summary, state}
  end
  
  @impl true
  def handle_call({:check_health, name}, _from, state) do
    case Map.get(state.services, name) do
      nil -> 
        {:reply, {:error, :not_found}, state}
      service ->
        {new_state, result} = perform_health_check(state, name, service)
        {:reply, {:ok, result}, new_state}
    end
  end
  
  @impl true
  def handle_call(:check_all, _from, state) do
    new_state = Enum.reduce(state.services, state, fn {name, service}, acc ->
      {updated, _} = perform_health_check(acc, name, service)
      updated
    end)
    
    {:reply, :ok, new_state}
  end
  
  @impl true
  def handle_call(:dependency_graph, _from, state) do
    graph = state.services
    |> Enum.map(fn {name, service} ->
      {name, service.dependencies}
    end)
    |> Map.new()
    
    {:reply, graph, state}
  end
  
  @impl true
  def handle_info({:check_health, name}, state) do
    case Map.get(state.services, name) do
      nil -> 
        {:noreply, state}
      service ->
        {new_state, _} = perform_health_check(state, name, service)
        # Schedule next check
        new_state = schedule_check(new_state, name, service.check_interval)
        {:noreply, new_state}
    end
  end
  
  # ---------------------------------------------------------------------------
  # Internal Functions
  # ---------------------------------------------------------------------------
  
  defp do_register(state, name, config) do
    service = %{
      name: name,
      type: Map.get(config, :type, :external),
      critical: Map.get(config, :critical, false),
      health_check: Map.get(config, :health_check),
      check_interval: Map.get(config, :check_interval, @default_check_interval),
      state: :unknown,
      last_check: nil,
      last_error: nil,
      consecutive_failures: 0,
      dependencies: Map.get(config, :dependencies, [])
    }
    
    services = Map.put(state.services, name, service)
    state = %{state | services: services}
    
    # Perform initial health check
    {state, _} = if service.health_check do
      perform_health_check(state, name, service)
    else
      {state, :unknown}
    end
    
    # Schedule periodic checks
    if service.health_check do
      schedule_check(state, name, service.check_interval)
    else
      state
    end
  end
  
  defp perform_health_check(state, name, service) do
    start_time = System.monotonic_time(:millisecond)
    
    {new_state, result} = try do
      case service.health_check do
        nil -> 
          {state, :unknown}
        check_fn ->
          result = check_fn.()
          duration = System.monotonic_time(:millisecond) - start_time
          
          # Adjust state based on response time
          final_state = cond do
            result == :unhealthy -> :unhealthy
            duration > @degraded_threshold_ms -> :degraded
            true -> result
          end
          
          emit_health_check(name, final_state, duration)
          
          updated_service = update_service_state(service, final_state)
          
          # Emit state change if different
          if service.state != final_state do
            emit_state_change(name, service.state, final_state)
          end
          
          services = Map.put(state.services, name, updated_service)
          {%{state | services: services}, final_state}
      end
    rescue
      e ->
        Logger.warning("Health check failed for #{name}: #{inspect(e)}")
        
        updated_service = update_service_state(service, :unhealthy, inspect(e))
        services = Map.put(state.services, name, updated_service)
        
        emit_health_check(name, :unhealthy, 0)
        
        {%{state | services: services}, :unhealthy}
    end
    
    {new_state, result}
  end
  
  defp update_service_state(service, new_state, error \\ nil) do
    consecutive_failures = if new_state == :unhealthy do
      service.consecutive_failures + 1
    else
      0
    end
    
    %{service |
      state: new_state,
      last_check: DateTime.utc_now(),
      last_error: error,
      consecutive_failures: consecutive_failures
    }
  end
  
  defp schedule_check(state, name, interval) do
    # Cancel existing timer
    state = cancel_check(state, name)
    
    # Schedule new check
    ref = Process.send_after(self(), {:check_health, name}, interval)
    check_refs = Map.put(state.check_refs, name, ref)
    
    %{state | check_refs: check_refs}
  end
  
  defp cancel_check(state, name) do
    case Map.get(state.check_refs, name) do
      nil -> state
      ref ->
        Process.cancel_timer(ref)
        check_refs = Map.delete(state.check_refs, name)
        %{state | check_refs: check_refs}
    end
  end
  
  defp count_by_state(services, target_state) do
    services
    |> Enum.count(fn {_, service} -> service.state == target_state end)
  end
  
  defp critical_healthy?(services) do
    services
    |> Enum.filter(fn {_, service} -> service.critical end)
    |> Enum.all?(fn {_, service} -> service.state in [:healthy, :degraded] end)
  end
  
  # ---------------------------------------------------------------------------
  # Built-in Health Checks
  # ---------------------------------------------------------------------------
  
  defp check_postgres do
    case Cgraph.Repo.query("SELECT 1") do
      {:ok, _} -> :healthy
      _ -> :unhealthy
    end
  rescue
    _ -> :unhealthy
  end
  
  defp check_redis do
    case Cgraph.Redis.command(["PING"]) do
      {:ok, "PONG"} -> :healthy
      _ -> :unhealthy
    end
  rescue
    _ -> :unhealthy
  end
  
  defp check_cachex do
    case Cachex.stats(:cgraph_cache) do
      {:ok, _} -> :healthy
      _ -> :unhealthy
    end
  rescue
    _ -> :unhealthy
  end
  
  defp check_oban do
    # Check if Oban is running
    if Process.whereis(Oban) do
      :healthy
    else
      :unhealthy
    end
  rescue
    _ -> :unhealthy
  end
  
  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------
  
  defp emit_health_check(name, state, duration) do
    :telemetry.execute(
      [:cgraph, :service, :health_check],
      %{duration: duration},
      %{service: name, state: state}
    )
  end
  
  defp emit_state_change(name, from, to) do
    :telemetry.execute(
      [:cgraph, :service, :state_change],
      %{system_time: System.system_time()},
      %{service: name, from: from, to: to}
    )
    
    # Log significant state changes
    if to == :unhealthy do
      Logger.warning("Service #{name} became unhealthy (was: #{from})")
    else if from == :unhealthy do
      Logger.info("Service #{name} recovered (now: #{to})")
    end
    end
  end
end
