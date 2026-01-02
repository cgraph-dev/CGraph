defmodule Cgraph.Performance.CircuitBreaker do
  @moduledoc """
  Circuit breaker pattern for external service calls.
  
  ## Overview
  
  Prevents cascading failures by failing fast when external services are down.
  
  States:
  - `:closed` - Normal operation, requests pass through
  - `:open` - Service is down, fail immediately
  - `:half_open` - Testing if service recovered
  
  ## Usage
  
      # Wrap external calls
      case CircuitBreaker.call(:payment_service, fn ->
        PaymentAPI.charge(amount)
      end) do
        {:ok, result} -> handle_success(result)
        {:error, :circuit_open} -> show_degraded_experience()
        {:error, reason} -> handle_error(reason)
      end
  
      # Check status
      CircuitBreaker.status(:payment_service)
      # => %{state: :closed, failures: 0, last_failure: nil}
  
      # Force reset (admin use)
      CircuitBreaker.reset(:payment_service)
  
  ## Configuration
  
      # In config.exs
      config :cgraph, Cgraph.Performance.CircuitBreaker,
        services: %{
          payment_service: %{
            failure_threshold: 5,
            recovery_time: 30_000,
            timeout: 10_000
          },
          email_service: %{
            failure_threshold: 3,
            recovery_time: 60_000,
            timeout: 5_000
          }
        }
  """
  
  use GenServer
  require Logger
  
  @table :circuit_breakers
  @default_failure_threshold 5
  @default_recovery_time 30_000  # 30 seconds
  @default_timeout 10_000       # 10 seconds
  @default_success_threshold 3  # Successes needed in half-open to close
  
  @type service :: atom()
  @type state :: :closed | :open | :half_open
  @type circuit_state :: %{
    state: state(),
    failures: non_neg_integer(),
    successes: non_neg_integer(),
    last_failure: DateTime.t() | nil,
    opened_at: DateTime.t() | nil,
    config: map()
  }
  
  # ---------------------------------------------------------------------------
  # Client API
  # ---------------------------------------------------------------------------
  
  @doc """
  Start the circuit breaker process.
  """
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @doc """
  Execute a function through the circuit breaker.
  
  ## Options
  
  - `:timeout` - Override default timeout for this call
  - `:fallback` - Function to call if circuit is open
  
  ## Returns
  
  - `{:ok, result}` - Function succeeded
  - `{:error, :circuit_open}` - Circuit is open, call rejected
  - `{:error, :timeout}` - Call timed out
  - `{:error, reason}` - Function failed with reason
  """
  @spec call(service(), (() -> term()), keyword()) :: 
    {:ok, term()} | {:error, term()}
  def call(service, fun, opts \\ []) do
    case get_state(service) do
      :open ->
        handle_open_circuit(service, opts)
      
      state when state in [:closed, :half_open] ->
        execute_with_protection(service, fun, opts)
    end
  end
  
  @doc """
  Get the current status of a circuit.
  """
  @spec status(service()) :: circuit_state() | nil
  def status(service) do
    case :ets.lookup(@table, service) do
      [{^service, state}] -> state
      [] -> nil
    end
  end
  
  @doc """
  Get status of all circuits.
  """
  @spec all_status() :: %{service() => circuit_state()}
  def all_status do
    @table
    |> :ets.tab2list()
    |> Map.new()
  end
  
  @doc """
  Manually reset a circuit to closed state.
  """
  @spec reset(service()) :: :ok
  def reset(service) do
    GenServer.call(__MODULE__, {:reset, service})
  end
  
  @doc """
  Manually open a circuit (for maintenance windows).
  """
  @spec force_open(service()) :: :ok
  def force_open(service) do
    GenServer.call(__MODULE__, {:force_open, service})
  end
  
  @doc """
  Register a new service with the circuit breaker.
  """
  @spec register(service(), keyword()) :: :ok
  def register(service, opts \\ []) do
    GenServer.call(__MODULE__, {:register, service, opts})
  end
  
  @doc """
  Check if a service is healthy (circuit closed).
  """
  @spec healthy?(service()) :: boolean()
  def healthy?(service) do
    get_state(service) == :closed
  end
  
  # ---------------------------------------------------------------------------
  # Server Callbacks
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(_opts) do
    # Create ETS table for fast reads
    :ets.new(@table, [:named_table, :public, :set, 
      read_concurrency: true, write_concurrency: true])
    
    # Load configured services
    config = Application.get_env(:cgraph, __MODULE__, [])
    services = Keyword.get(config, :services, %{})
    
    Enum.each(services, fn {service, service_config} ->
      init_service(service, service_config)
    end)
    
    # Schedule periodic cleanup
    schedule_cleanup()
    
    {:ok, %{services: Map.keys(services)}}
  end
  
  @impl true
  def handle_call({:register, service, opts}, _from, state) do
    config = %{
      failure_threshold: Keyword.get(opts, :failure_threshold, @default_failure_threshold),
      recovery_time: Keyword.get(opts, :recovery_time, @default_recovery_time),
      timeout: Keyword.get(opts, :timeout, @default_timeout),
      success_threshold: Keyword.get(opts, :success_threshold, @default_success_threshold)
    }
    
    init_service(service, config)
    
    {:reply, :ok, %{state | services: [service | state.services]}}
  end
  
  @impl true
  def handle_call({:reset, service}, _from, state) do
    case :ets.lookup(@table, service) do
      [{^service, circuit}] ->
        reset_circuit = %{circuit | 
          state: :closed, 
          failures: 0, 
          successes: 0,
          opened_at: nil
        }
        :ets.insert(@table, {service, reset_circuit})
        Logger.info("[CircuitBreaker] #{service} manually reset to closed")
      [] ->
        :ok
    end
    
    {:reply, :ok, state}
  end
  
  @impl true
  def handle_call({:force_open, service}, _from, state) do
    case :ets.lookup(@table, service) do
      [{^service, circuit}] ->
        opened_circuit = %{circuit | 
          state: :open, 
          opened_at: DateTime.utc_now()
        }
        :ets.insert(@table, {service, opened_circuit})
        Logger.warning("[CircuitBreaker] #{service} manually opened")
      [] ->
        :ok
    end
    
    {:reply, :ok, state}
  end
  
  @impl true
  def handle_info(:cleanup, state) do
    # Check for circuits that should transition from open to half-open
    now = DateTime.utc_now()
    
    Enum.each(state.services, fn service ->
      case :ets.lookup(@table, service) do
        [{^service, %{state: :open, opened_at: opened_at, config: config} = circuit}] ->
          recovery_time = Map.get(config, :recovery_time, @default_recovery_time)
          
          if DateTime.diff(now, opened_at, :millisecond) >= recovery_time do
            half_open_circuit = %{circuit | state: :half_open, successes: 0}
            :ets.insert(@table, {service, half_open_circuit})
            Logger.info("[CircuitBreaker] #{service} transitioned to half-open")
          end
        _ ->
          :ok
      end
    end)
    
    schedule_cleanup()
    {:noreply, state}
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------
  
  defp init_service(service, config) do
    circuit = %{
      state: :closed,
      failures: 0,
      successes: 0,
      last_failure: nil,
      opened_at: nil,
      config: config
    }
    
    :ets.insert(@table, {service, circuit})
  end
  
  defp get_state(service) do
    case :ets.lookup(@table, service) do
      [{^service, %{state: state}}] -> state
      [] -> :closed  # Unknown service defaults to closed
    end
  end
  
  defp handle_open_circuit(service, opts) do
    case Keyword.get(opts, :fallback) do
      nil ->
        {:error, :circuit_open}
      
      fallback when is_function(fallback, 0) ->
        Logger.debug("[CircuitBreaker] #{service} circuit open, using fallback")
        try do
          {:ok, fallback.()}
        rescue
          e -> {:error, e}
        end
    end
  end
  
  defp execute_with_protection(service, fun, opts) do
    timeout = Keyword.get(opts, :timeout)
    
    config = case :ets.lookup(@table, service) do
      [{^service, %{config: c}}] -> c
      [] -> %{}
    end
    
    effective_timeout = timeout || Map.get(config, :timeout, @default_timeout)
    
    task = Task.async(fn ->
      try do
        {:ok, fun.()}
      rescue
        e -> {:error, {e, __STACKTRACE__}}
      catch
        kind, reason -> {:error, {kind, reason}}
      end
    end)
    
    case Task.yield(task, effective_timeout) || Task.shutdown(task, :brutal_kill) do
      {:ok, {:ok, result}} ->
        record_success(service)
        {:ok, result}
      
      {:ok, {:error, reason}} ->
        record_failure(service, reason)
        {:error, reason}
      
      nil ->
        record_failure(service, :timeout)
        {:error, :timeout}
    end
  end
  
  defp record_success(service) do
    case :ets.lookup(@table, service) do
      [{^service, %{state: :half_open, config: config} = circuit}] ->
        new_successes = circuit.successes + 1
        success_threshold = Map.get(config, :success_threshold, @default_success_threshold)
        
        if new_successes >= success_threshold do
          # Transition to closed
          closed_circuit = %{circuit | 
            state: :closed, 
            failures: 0, 
            successes: 0,
            opened_at: nil
          }
          :ets.insert(@table, {service, closed_circuit})
          Logger.info("[CircuitBreaker] #{service} transitioned to closed after recovery")
        else
          :ets.insert(@table, {service, %{circuit | successes: new_successes}})
        end
      
      [{^service, %{state: :closed} = circuit}] ->
        # Reset failure count on success
        if circuit.failures > 0 do
          :ets.insert(@table, {service, %{circuit | failures: 0}})
        end
      
      _ ->
        :ok
    end
  end
  
  defp record_failure(service, reason) do
    case :ets.lookup(@table, service) do
      [{^service, %{state: state, config: config} = circuit}] ->
        now = DateTime.utc_now()
        new_failures = circuit.failures + 1
        failure_threshold = Map.get(config, :failure_threshold, @default_failure_threshold)
        
        Logger.warning("[CircuitBreaker] #{service} failure ##{new_failures}: #{inspect(reason)}")
        
        cond do
          state == :half_open ->
            # Any failure in half-open immediately opens
            opened_circuit = %{circuit | 
              state: :open, 
              failures: new_failures,
              last_failure: now,
              opened_at: now,
              successes: 0
            }
            :ets.insert(@table, {service, opened_circuit})
            Logger.warning("[CircuitBreaker] #{service} reopened after half-open failure")
          
          new_failures >= failure_threshold ->
            # Threshold reached, open circuit
            opened_circuit = %{circuit | 
              state: :open, 
              failures: new_failures,
              last_failure: now,
              opened_at: now
            }
            :ets.insert(@table, {service, opened_circuit})
            Logger.error("[CircuitBreaker] #{service} opened after #{new_failures} failures")
          
          true ->
            # Record failure but stay closed
            updated_circuit = %{circuit | 
              failures: new_failures,
              last_failure: now
            }
            :ets.insert(@table, {service, updated_circuit})
        end
      
      [] ->
        # Service not registered, create with one failure
        init_service(service, %{})
        record_failure(service, reason)
    end
  end
  
  defp schedule_cleanup do
    # Check every 5 seconds
    Process.send_after(self(), :cleanup, 5_000)
  end
end
