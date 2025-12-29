defmodule Cgraph.Services.CircuitBreaker do
  @moduledoc """
  Production-grade circuit breaker for external service resilience.
  
  ## Overview
  
  Implements the Circuit Breaker pattern to protect the system from cascading
  failures when external services become unavailable or slow. This is critical
  for maintaining system stability during partial outages.
  
  ## States
  
  The circuit breaker operates in three states:
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     CIRCUIT BREAKER STATES                       │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │    ┌──────────┐     failure threshold     ┌──────────┐          │
  │    │  CLOSED  │ ──────────────────────► │   OPEN   │          │
  │    │ (normal) │                           │ (failing)│          │
  │    └──────────┘                           └──────────┘          │
  │         ▲                                       │               │
  │         │ success                    timeout    │               │
  │         │                                       ▼               │
  │         │                              ┌──────────────┐         │
  │         └───────────────────────────── │  HALF-OPEN   │         │
  │                                        │  (testing)   │         │
  │                                        └──────────────┘         │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  - **Closed**: Normal operation, requests pass through
  - **Open**: Circuit tripped, requests fail fast without calling service
  - **Half-Open**: Testing if service has recovered
  
  ## Configuration
  
  Each service can have custom thresholds:
  
  | Option | Default | Description |
  |--------|---------|-------------|
  | `:failure_threshold` | 5 | Failures before opening |
  | `:success_threshold` | 2 | Successes to close from half-open |
  | `:timeout_ms` | 30000 | Time before trying half-open |
  | `:call_timeout_ms` | 5000 | Individual call timeout |
  
  ## Usage
  
      # Register a service
      CircuitBreaker.register("email_service", failure_threshold: 3)
      
      # Execute with protection
      CircuitBreaker.call("email_service", fn ->
        EmailProvider.send(email)
      end)
      
      # Check status
      {:ok, :closed} = CircuitBreaker.status("email_service")
  
  ## Telemetry
  
  Emits the following telemetry events:
  
  - `[:cgraph, :circuit_breaker, :call, :start]`
  - `[:cgraph, :circuit_breaker, :call, :stop]`
  - `[:cgraph, :circuit_breaker, :state_change]`
  - `[:cgraph, :circuit_breaker, :rejected]`
  """
  
  use GenServer
  require Logger
  
  @type state :: :closed | :open | :half_open
  @type service_name :: String.t()
  
  @default_config %{
    failure_threshold: 5,
    success_threshold: 2,
    timeout_ms: 30_000,
    call_timeout_ms: 5_000
  }
  
  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------
  
  @doc """
  Start the circuit breaker GenServer.
  """
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @doc """
  Register a new service with the circuit breaker.
  
  ## Options
  
  - `:failure_threshold` - Number of failures before opening (default: 5)
  - `:success_threshold` - Successes needed to close from half-open (default: 2)
  - `:timeout_ms` - Time before retrying after open (default: 30000)
  - `:call_timeout_ms` - Timeout for individual calls (default: 5000)
  
  ## Example
  
      CircuitBreaker.register("payment_gateway",
        failure_threshold: 3,
        timeout_ms: 60_000
      )
  """
  def register(service_name, opts \\ []) do
    GenServer.call(__MODULE__, {:register, service_name, opts})
  end
  
  @doc """
  Execute a function with circuit breaker protection.
  
  If the circuit is open, returns `{:error, :circuit_open}` immediately.
  If the function succeeds, records success.
  If the function fails or times out, records failure.
  
  ## Example
  
      case CircuitBreaker.call("email_service", fn ->
        EmailProvider.send(email)
      end) do
        {:ok, result} -> result
        {:error, :circuit_open} -> {:error, :service_unavailable}
        {:error, reason} -> {:error, reason}
      end
  """
  def call(service_name, fun) when is_function(fun, 0) do
    GenServer.call(__MODULE__, {:call, service_name, fun}, :infinity)
  end
  
  @doc """
  Execute with fallback when circuit is open.
  
  ## Example
  
      CircuitBreaker.call_with_fallback("email_service",
        fn -> EmailProvider.send(email) end,
        fn -> {:ok, :queued_for_retry} end
      )
  """
  def call_with_fallback(service_name, fun, fallback) 
      when is_function(fun, 0) and is_function(fallback, 0) do
    case call(service_name, fun) do
      {:error, :circuit_open} -> fallback.()
      result -> result
    end
  end
  
  @doc """
  Get the current state of a service's circuit breaker.
  """
  def status(service_name) do
    GenServer.call(__MODULE__, {:status, service_name})
  end
  
  @doc """
  Get detailed stats for a service.
  """
  def stats(service_name) do
    GenServer.call(__MODULE__, {:stats, service_name})
  end
  
  @doc """
  Get status of all registered services.
  """
  def all_status do
    GenServer.call(__MODULE__, :all_status)
  end
  
  @doc """
  Manually reset a circuit breaker to closed state.
  
  Use with caution - typically used for testing or manual intervention.
  """
  def reset(service_name) do
    GenServer.call(__MODULE__, {:reset, service_name})
  end
  
  @doc """
  Manually trip a circuit breaker to open state.
  
  Use for maintenance or when you know a service is down.
  """
  def trip(service_name) do
    GenServer.call(__MODULE__, {:trip, service_name})
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(_opts) do
    {:ok, %{services: %{}}}
  end
  
  @impl true
  def handle_call({:register, name, opts}, _from, state) do
    config = Map.merge(@default_config, Map.new(opts))
    
    service_state = %{
      state: :closed,
      config: config,
      failure_count: 0,
      success_count: 0,
      last_failure_time: nil,
      last_success_time: nil,
      total_calls: 0,
      total_failures: 0,
      total_rejections: 0,
      opened_at: nil
    }
    
    services = Map.put(state.services, name, service_state)
    
    Logger.info("Circuit breaker registered",
      service: name,
      config: config
    )
    
    {:reply, :ok, %{state | services: services}}
  end
  
  @impl true
  def handle_call({:call, name, fun}, _from, state) do
    case Map.get(state.services, name) do
      nil ->
        {:reply, {:error, :not_registered}, state}
        
      service ->
        {result, new_service} = execute_call(name, service, fun)
        services = Map.put(state.services, name, new_service)
        {:reply, result, %{state | services: services}}
    end
  end
  
  @impl true
  def handle_call({:status, name}, _from, state) do
    case Map.get(state.services, name) do
      nil -> {:reply, {:error, :not_found}, state}
      service -> {:reply, {:ok, service.state}, state}
    end
  end
  
  @impl true
  def handle_call({:stats, name}, _from, state) do
    case Map.get(state.services, name) do
      nil -> 
        {:reply, {:error, :not_found}, state}
      service -> 
        stats = %{
          state: service.state,
          failure_count: service.failure_count,
          success_count: service.success_count,
          total_calls: service.total_calls,
          total_failures: service.total_failures,
          total_rejections: service.total_rejections,
          last_failure: service.last_failure_time,
          last_success: service.last_success_time,
          opened_at: service.opened_at,
          config: service.config
        }
        {:reply, {:ok, stats}, state}
    end
  end
  
  @impl true
  def handle_call(:all_status, _from, state) do
    status = Enum.map(state.services, fn {name, service} ->
      {name, %{
        state: service.state,
        failure_count: service.failure_count,
        total_calls: service.total_calls
      }}
    end)
    |> Map.new()
    
    {:reply, {:ok, status}, state}
  end
  
  @impl true
  def handle_call({:reset, name}, _from, state) do
    case Map.get(state.services, name) do
      nil -> 
        {:reply, {:error, :not_found}, state}
      service ->
        new_service = %{service | 
          state: :closed,
          failure_count: 0,
          success_count: 0,
          opened_at: nil
        }
        
        emit_state_change(name, service.state, :closed, :manual_reset)
        
        services = Map.put(state.services, name, new_service)
        {:reply, :ok, %{state | services: services}}
    end
  end
  
  @impl true
  def handle_call({:trip, name}, _from, state) do
    case Map.get(state.services, name) do
      nil -> 
        {:reply, {:error, :not_found}, state}
      service ->
        new_service = %{service | 
          state: :open,
          opened_at: DateTime.utc_now()
        }
        
        emit_state_change(name, service.state, :open, :manual_trip)
        
        services = Map.put(state.services, name, new_service)
        {:reply, :ok, %{state | services: services}}
    end
  end
  
  # ---------------------------------------------------------------------------
  # Core Logic
  # ---------------------------------------------------------------------------
  
  defp execute_call(name, service, fun) do
    # Check if we should transition from open to half-open
    service = maybe_transition_to_half_open(name, service)
    
    case service.state do
      :open ->
        # Circuit is open - fail fast
        emit_rejection(name)
        
        new_service = %{service | 
          total_rejections: service.total_rejections + 1
        }
        
        {{:error, :circuit_open}, new_service}
        
      state when state in [:closed, :half_open] ->
        # Attempt the call
        start_time = System.monotonic_time(:millisecond)
        emit_call_start(name, state)
        
        result = try do
          timeout = service.config.call_timeout_ms
          
          task = Task.async(fn -> fun.() end)
          
          case Task.yield(task, timeout) || Task.shutdown(task) do
            {:ok, result} -> {:ok, result}
            nil -> {:error, :timeout}
          end
        rescue
          e -> {:error, {:exception, e}}
        catch
          :exit, reason -> {:error, {:exit, reason}}
        end
        
        duration = System.monotonic_time(:millisecond) - start_time
        emit_call_stop(name, state, result, duration)
        
        handle_result(name, service, result)
    end
  end
  
  defp maybe_transition_to_half_open(name, %{state: :open} = service) do
    timeout = service.config.timeout_ms
    opened_at = service.opened_at
    
    if opened_at && DateTime.diff(DateTime.utc_now(), opened_at, :millisecond) >= timeout do
      Logger.info("Circuit breaker transitioning to half-open",
        service: name
      )
      
      emit_state_change(name, :open, :half_open, :timeout)
      
      %{service | state: :half_open, success_count: 0}
    else
      service
    end
  end
  
  defp maybe_transition_to_half_open(_name, service), do: service
  
  defp handle_result(name, service, result) do
    case result do
      {:ok, _} = success ->
        handle_success(name, service, success)
        
      {:error, _} = error ->
        handle_failure(name, service, error)
    end
  end
  
  defp handle_success(name, service, result) do
    now = DateTime.utc_now()
    
    new_service = %{service |
      success_count: service.success_count + 1,
      last_success_time: now,
      total_calls: service.total_calls + 1
    }
    
    new_service = case service.state do
      :half_open ->
        if new_service.success_count >= service.config.success_threshold do
          # Enough successes - close the circuit
          Logger.info("Circuit breaker closing after recovery",
            service: name,
            success_count: new_service.success_count
          )
          
          emit_state_change(name, :half_open, :closed, :recovery)
          
          %{new_service | 
            state: :closed,
            failure_count: 0,
            success_count: 0,
            opened_at: nil
          }
        else
          new_service
        end
        
      :closed ->
        # Reset failure count on success
        %{new_service | failure_count: 0}
    end
    
    {result, new_service}
  end
  
  defp handle_failure(name, service, error) do
    now = DateTime.utc_now()
    
    new_service = %{service |
      failure_count: service.failure_count + 1,
      last_failure_time: now,
      total_calls: service.total_calls + 1,
      total_failures: service.total_failures + 1
    }
    
    new_service = case service.state do
      :half_open ->
        # Any failure in half-open state opens the circuit
        Logger.warning("Circuit breaker re-opening after failure in half-open state",
          service: name,
          error: inspect(error)
        )
        
        emit_state_change(name, :half_open, :open, :failure)
        
        %{new_service | 
          state: :open,
          opened_at: now,
          success_count: 0
        }
        
      :closed ->
        if new_service.failure_count >= service.config.failure_threshold do
          # Threshold exceeded - open the circuit
          Logger.warning("Circuit breaker opening after threshold exceeded",
            service: name,
            failure_count: new_service.failure_count,
            threshold: service.config.failure_threshold
          )
          
          emit_state_change(name, :closed, :open, :threshold)
          
          %{new_service | 
            state: :open,
            opened_at: now
          }
        else
          new_service
        end
    end
    
    {error, new_service}
  end
  
  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------
  
  defp emit_call_start(service, state) do
    :telemetry.execute(
      [:cgraph, :circuit_breaker, :call, :start],
      %{system_time: System.system_time()},
      %{service: service, state: state}
    )
  end
  
  defp emit_call_stop(service, state, result, duration) do
    status = case result do
      {:ok, _} -> :success
      {:error, _} -> :failure
    end
    
    :telemetry.execute(
      [:cgraph, :circuit_breaker, :call, :stop],
      %{duration: duration},
      %{service: service, state: state, status: status}
    )
  end
  
  defp emit_state_change(service, from, to, reason) do
    :telemetry.execute(
      [:cgraph, :circuit_breaker, :state_change],
      %{system_time: System.system_time()},
      %{service: service, from: from, to: to, reason: reason}
    )
  end
  
  defp emit_rejection(service) do
    :telemetry.execute(
      [:cgraph, :circuit_breaker, :rejected],
      %{count: 1},
      %{service: service}
    )
  end
end
