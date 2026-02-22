defmodule CGraph.HealthCheck do
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

  ## Submodules

  - `CGraph.HealthCheck.Checks`   — individual component checks
  - `CGraph.HealthCheck.Reporter` — report aggregation and telemetry

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

  alias CGraph.HealthCheck.Checks
  alias CGraph.HealthCheck.Reporter

  @check_interval :timer.seconds(30)
  @component_timeout :timer.seconds(5)

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
  @spec check() :: {:ok, status()} | {:error, term()}
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
  @spec report() :: {:ok, health_report()} | {:error, term()}
  def report do
    GenServer.call(__MODULE__, :report, @component_timeout * 2)
  end

  @doc """
  Check a specific component.
  """
  @spec check_component(component()) :: {:ok, component_status()}
  def check_component(component) do
    GenServer.call(__MODULE__, {:check_component, component}, @component_timeout)
  end

  @doc """
  Kubernetes liveness probe.

  Returns true if the application is running (not deadlocked).
  Should be cheap and fast.
  """
  @spec live?() :: boolean()
  def live? do
    # Just check if GenServer is responsive
    GenServer.call(__MODULE__, :ping, 1000) == :pong
  rescue
    _ -> false
  catch
    :exit, _ -> false
  end

  @doc """
  Kubernetes readiness probe.

  Returns true if the application can serve traffic.
  Checks critical dependencies.
  """
  @spec ready?() :: boolean()
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
  @spec startup?() :: boolean()
  def startup? do
    # Check if critical components are initialized
    Checks.database_ready?() && Checks.cache_ready?()
  end

  @doc """
  Get cached last known status.

  Useful when you need status but can't wait for full check.
  """
  @spec last_status() :: status() | :unknown
  def last_status do
    GenServer.call(__MODULE__, :last_status)
  end

  @doc """
  Get system uptime in seconds.
  """
  @spec uptime() :: non_neg_integer()
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
    report = Reporter.generate_report(state.started_at)

    new_state = %{
      state
      | last_check: DateTime.utc_now(),
        last_status: report.status,
        component_statuses: Map.new(report.components, &{&1.name, &1})
    }

    {:reply, {:ok, report}, new_state}
  end

  @impl true
  def handle_call({:check_component, component}, _from, state) do
    status = Checks.check_component_status(component)
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
    report = Reporter.generate_report(state.started_at)

    # Emit telemetry for status changes
    if report.status != state.last_status do
      Reporter.emit_status_change_telemetry(state.last_status, report.status)
    end

    new_state = %{
      state
      | last_check: DateTime.utc_now(),
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
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp schedule_check do
    Process.send_after(self(), :periodic_check, @check_interval)
  end
end
