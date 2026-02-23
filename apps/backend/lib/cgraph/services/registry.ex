defmodule CGraph.Services.Registry do
  @moduledoc """
  Service registry for dependency management and health monitoring.

  ## Overview

  Provides centralized service discovery and health tracking:

  - **Service Registration**: Register internal and external services
  - **Health Monitoring**: Periodic health checks with state tracking
  - **Dependency Graph**: Understand service dependencies
  - **Graceful Degradation**: Know which services are available

  Service types: `:internal`, `:database`, `:external`, `:optional`.
  Health states: `:healthy`, `:degraded`, `:unhealthy`, `:unknown`.

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

  ## Submodules

  - `CGraph.Services.Registry.HealthChecks` — Health check execution, built-in checks, and telemetry
  """

  use GenServer
  require Logger

  alias CGraph.Services.Registry.HealthChecks

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

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Start the service registry.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Register a service with the registry.

  Config keys: `:type`, `:critical`, `:health_check`, `:check_interval`, `:dependencies`.
  """
  @spec register(String.t(), map()) :: :ok
  def register(name, config) do
    GenServer.call(__MODULE__, {:register, name, config})
  end

  @doc """
  Deregister a service.
  """
  @spec deregister(String.t()) :: :ok
  def deregister(name) do
    GenServer.call(__MODULE__, {:deregister, name})
  end

  @doc """
  Get the current status of a service.
  """
  @spec status(String.t()) :: {:ok, health_state()} | {:error, :not_found}
  def status(name) do
    GenServer.call(__MODULE__, {:status, name})
  end

  @doc """
  Get detailed information about a service.
  """
  @spec get(String.t()) :: {:ok, service()} | {:error, :not_found}
  def get(name) do
    GenServer.call(__MODULE__, {:get, name})
  end

  @doc """
  Get all registered services.
  """
  @spec all() :: map()
  def all do
    GenServer.call(__MODULE__, :all)
  end

  @doc """
  Check if the overall system is healthy.

  Returns true if all critical services are healthy.
  """
  @spec system_healthy?() :: boolean()
  def system_healthy? do
    GenServer.call(__MODULE__, :system_healthy?)
  end

  @doc """
  Get system health summary.
  """
  @spec health_summary() :: map()
  def health_summary do
    GenServer.call(__MODULE__, :health_summary)
  end

  @doc """
  Manually trigger health check for a service.
  """
  @spec check_health(String.t()) :: {:ok, health_state()} | {:error, :not_found}
  def check_health(name) do
    GenServer.call(__MODULE__, {:check_health, name})
  end

  @doc """
  Manually trigger health checks for all services.
  """
  @spec check_all() :: :ok
  def check_all do
    GenServer.call(__MODULE__, :check_all)
  end

  @doc """
  Get the dependency graph as a map.
  """
  @spec dependency_graph() :: map()
  def dependency_graph do
    GenServer.call(__MODULE__, :dependency_graph)
  end

  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------

  @doc "Initializes the service registry GenServer state."
  @spec init(keyword()) :: {:ok, map(), {:continue, :register_builtin}}
  @impl true
  def init(_opts) do
    state = %{
      services: %{},
      check_refs: %{}
    }

    {:ok, state, {:continue, :register_builtin}}
  end

  @doc "Handles continuation to register built-in services."
  @spec handle_continue(atom(), map()) :: {:noreply, map()}
  @impl true
  def handle_continue(:register_builtin, state) do
    state =
      Enum.reduce(HealthChecks.builtin_services(), state, fn {name, config}, acc ->
        do_register(acc, name, config)
      end)

    {:noreply, state}
  end

  @doc "Handles synchronous service registration, status queries, and health checks."
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  @impl true
  def handle_call({:register, name, config}, _from, state) do
    state = do_register(state, name, config)
    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:deregister, name}, _from, state) do
    state = cancel_check(state, name)
    services = Map.delete(state.services, name)
    {:reply, :ok, %{state | services: services}}
  end

  @impl true
  def handle_call({:status, name}, _from, state) do
    result =
      case Map.get(state.services, name) do
        nil -> {:error, :not_found}
        service -> {:ok, service.state}
      end

    {:reply, result, state}
  end

  @impl true
  def handle_call({:get, name}, _from, state) do
    result =
      case Map.get(state.services, name) do
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
    healthy = HealthChecks.critical_healthy?(state.services)
    {:reply, healthy, state}
  end

  @impl true
  def handle_call(:health_summary, _from, state) do
    summary = %{
      total: map_size(state.services),
      healthy: HealthChecks.count_by_state(state.services, :healthy),
      degraded: HealthChecks.count_by_state(state.services, :degraded),
      unhealthy: HealthChecks.count_by_state(state.services, :unhealthy),
      unknown: HealthChecks.count_by_state(state.services, :unknown),
      critical_healthy: HealthChecks.critical_healthy?(state.services),
      services:
        Enum.map(state.services, fn {name, service} ->
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
        {new_state, result} = HealthChecks.perform_health_check(state, name, service)
        {:reply, {:ok, result}, new_state}
    end
  end

  @impl true
  def handle_call(:check_all, _from, state) do
    new_state =
      Enum.reduce(state.services, state, fn {name, service}, acc ->
        {updated, _} = HealthChecks.perform_health_check(acc, name, service)
        updated
      end)

    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call(:dependency_graph, _from, state) do
    graph =
      state.services
      |> Enum.map(fn {name, service} -> {name, service.dependencies} end)
      |> Map.new()

    {:reply, graph, state}
  end

  @doc "Handles periodic health check messages for registered services."
  @spec handle_info(term(), map()) :: {:noreply, map()}
  @impl true
  def handle_info({:check_health, name}, state) do
    case Map.get(state.services, name) do
      nil ->
        {:noreply, state}

      service ->
        {new_state, _} = HealthChecks.perform_health_check(state, name, service)
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

    {state, _} =
      if service.health_check do
        HealthChecks.perform_health_check(state, name, service)
      else
        {state, :unknown}
      end

    if service.health_check do
      schedule_check(state, name, service.check_interval)
    else
      state
    end
  end

  defp schedule_check(state, name, interval) do
    state = cancel_check(state, name)
    ref = Process.send_after(self(), {:check_health, name}, interval)
    check_refs = Map.put(state.check_refs, name, ref)
    %{state | check_refs: check_refs}
  end

  defp cancel_check(state, name) do
    case Map.get(state.check_refs, name) do
      nil ->
        state

      ref ->
        Process.cancel_timer(ref)
        check_refs = Map.delete(state.check_refs, name)
        %{state | check_refs: check_refs}
    end
  end
end
