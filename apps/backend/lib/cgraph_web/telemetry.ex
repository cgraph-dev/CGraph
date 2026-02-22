defmodule CGraphWeb.Telemetry do
  @moduledoc """
  Telemetry supervisor for CGraphWeb.

  Delegates event handling to `CGraphWeb.Telemetry.Handlers` and metric
  definitions to `CGraphWeb.Telemetry.Metrics`. See those modules for details.

  ## Submodules

  - `CGraphWeb.Telemetry.Handlers` — Event handler callbacks for Phoenix, Ecto, Oban, etc.
  - `CGraphWeb.Telemetry.Metrics` — Metric definitions for Prometheus/StatsD exporters
  """
  use Supervisor

  require Logger

  alias CGraphWeb.Telemetry.{Handlers, Metrics}

  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    # Attach telemetry handlers on init
    attach_handlers()

    children = [
      # Prometheus metrics exporter — serves metrics via TelemetryMetricsPrometheus.Core
      # These supplement the custom CGraph.Metrics module with Telemetry.Metrics definitions
      {TelemetryMetricsPrometheus.Core, metrics: Metrics.metrics(), name: :cgraph_prometheus_metrics}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  @doc """
  Attach all telemetry event handlers.

  This function is called during application startup and sets up listeners
  for all relevant telemetry events from Phoenix, Ecto, Oban, and custom events.
  """
  def attach_handlers do
    # Attach Phoenix events
    :telemetry.attach_many(
      "cgraph-phoenix-handlers",
      [
        [:phoenix, :endpoint, :start],
        [:phoenix, :endpoint, :stop],
        [:phoenix, :router_dispatch, :start],
        [:phoenix, :router_dispatch, :stop],
        [:phoenix, :router_dispatch, :exception],
        [:phoenix, :live_view, :mount, :start],
        [:phoenix, :live_view, :mount, :stop]
      ],
      &Handlers.handle_phoenix_event/4,
      nil
    )

    # Attach Ecto events
    :telemetry.attach_many(
      "cgraph-ecto-handlers",
      [
        [:cgraph, :repo, :query]
      ],
      &Handlers.handle_ecto_event/4,
      nil
    )

    # Attach Oban events
    :telemetry.attach_many(
      "cgraph-oban-handlers",
      [
        [:oban, :job, :start],
        [:oban, :job, :stop],
        [:oban, :job, :exception]
      ],
      &Handlers.handle_oban_event/4,
      nil
    )

    # Attach custom business events
    :telemetry.attach_many(
      "cgraph-business-handlers",
      [
        [:cgraph, :messaging, :message, :sent],
        [:cgraph, :auth, :login, :success],
        [:cgraph, :auth, :login, :failure],
        [:cgraph, :rate_limiter, :check],
        [:cgraph, :rate_limiter, :exceeded]
      ],
      &Handlers.handle_business_event/4,
      nil
    )

    # Attach WebSocket/Channel events
    :telemetry.attach_many(
      "cgraph-websocket-handlers",
      [
        [:cgraph, :websocket, :connect],
        [:cgraph, :websocket, :disconnect],
        [:cgraph, :websocket, :message, :in],
        [:cgraph, :websocket, :message, :out],
        [:cgraph, :channel, :join]
      ],
      &Handlers.handle_websocket_event/4,
      nil
    )

    # Attach security events
    :telemetry.attach_many(
      "cgraph-security-handlers",
      [
        [:cgraph, :auth, :token, :created],
        [:cgraph, :auth, :token, :refreshed],
        [:cgraph, :auth, :token, :revoked],
        [:cgraph, :auth, :account, :locked],
        [:cgraph, :auth, :account, :unlocked]
      ],
      &Handlers.handle_security_event/4,
      nil
    )

    Logger.info("CGraphWeb.Telemetry handlers attached")
    :ok
  end

  @doc """
  Return metric definitions for monitoring exporters and LiveDashboard.
  """
  defdelegate metrics(), to: Metrics

  # ---------------------------------------------------------------------------
  # Utility Functions
  # ---------------------------------------------------------------------------

  @doc """
  Emit a custom business event.

  Convenience function for emitting telemetry events with standard metadata.

  ## Examples

      CGraphWeb.Telemetry.emit(:messaging, :message, :sent, %{latency_ms: 45}, %{channel_id: 1})
  """
  def emit(domain, resource, action, measurements, metadata \\ %{}) do
    :telemetry.execute(
      [:cgraph, domain, resource, action],
      Map.merge(%{timestamp: System.system_time()}, measurements),
      Map.merge(%{node: node()}, metadata)
    )
  end

  @doc """
  Get current telemetry statistics.

  Returns aggregated metrics for monitoring dashboards.
  """
  def stats do
    %{
      vm: %{
        memory: :erlang.memory(),
        process_count: :erlang.system_info(:process_count),
        uptime_seconds: :erlang.statistics(:wall_clock) |> elem(0) |> div(1000)
      },
      schedulers: %{
        online: :erlang.system_info(:schedulers_online),
        total: :erlang.system_info(:schedulers)
      }
    }
  end
end
