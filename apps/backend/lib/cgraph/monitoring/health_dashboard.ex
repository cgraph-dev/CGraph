defmodule CGraph.Monitoring.HealthDashboard do
  @moduledoc """
  Health dashboard extending the existing `CGraph.HealthCheck` system.

  Wraps `CGraph.HealthCheck.Checks` and `CGraph.HealthCheck.Reporter` and
  adds additional component checks (CDN, external services) plus a
  structured dashboard view suitable for admin UIs and monitoring.

  ## Architecture

  This module does **not** replace the existing health check system. It
  delegates to `CGraph.HealthCheck.Checks.check_component_status/1` for
  all existing components and adds CDN health via
  `CGraph.CDN.CDNManager.health_check/0`.

  ## Usage

      # Full dashboard report
      {:ok, dashboard} = HealthDashboard.dashboard()

      # Individual CDN check
      status = HealthDashboard.check_cdn()

      # Quick health endpoint payload
      payload = HealthDashboard.health_endpoint_payload()
  """

  require Logger

  alias CGraph.HealthCheck.Checks
  alias CGraph.HealthCheck.Reporter

  @type component_status :: %{
          name: atom(),
          status: :healthy | :degraded | :unhealthy | :unknown,
          message: String.t() | nil,
          latency_ms: non_neg_integer() | nil,
          details: map()
        }

  @type dashboard_report :: %{
          status: :healthy | :degraded | :unhealthy,
          timestamp: DateTime.t(),
          version: String.t(),
          node: atom(),
          components: [component_status()],
          summary: map()
        }

  # Components checked by the existing health check system
  @core_components [:database, :cache, :redis, :memory, :oban]

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Generate a comprehensive health dashboard report.

  Checks all core components (DB, cache, Redis, memory, Oban) plus
  CDN health, and returns a unified report.
  """
  @spec dashboard() :: {:ok, dashboard_report()}
  def dashboard do
    start_time = System.monotonic_time(:millisecond)

    core_statuses = check_core_components()
    cdn_status = check_cdn()

    all_components = core_statuses ++ [cdn_status]
    overall = Reporter.determine_overall_status(all_components)

    total_latency = System.monotonic_time(:millisecond) - start_time

    report = %{
      status: overall,
      timestamp: DateTime.utc_now(),
      version: Application.spec(:cgraph, :vsn) |> to_string(),
      node: node(),
      components: all_components,
      summary: %{
        total_check_ms: total_latency,
        healthy_count: Enum.count(all_components, &(&1.status == :healthy)),
        degraded_count: Enum.count(all_components, &(&1.status == :degraded)),
        unhealthy_count: Enum.count(all_components, &(&1.status == :unhealthy)),
        component_names: Enum.map(all_components, & &1.name)
      }
    }

    Logger.debug("health_dashboard_generated",
      status: overall,
      check_ms: total_latency,
      components: length(all_components)
    )

    {:ok, report}
  end

  @doc """
  Check CDN health status.

  Performs a connectivity check against the configured CDN backend.
  Returns a component status map.
  """
  @spec check_cdn() :: component_status()
  def check_cdn do
    start_time = System.monotonic_time(:millisecond)

    case CGraph.CDN.CDNManager.health_check() do
      :ok ->
        latency = System.monotonic_time(:millisecond) - start_time

        %{
          name: :cdn,
          status: :healthy,
          message: nil,
          latency_ms: latency,
          details: %{backend: cdn_backend()}
        }

      {:error, reason} ->
        latency = System.monotonic_time(:millisecond) - start_time

        %{
          name: :cdn,
          status: :degraded,
          message: "CDN check failed: #{inspect(reason)}",
          latency_ms: latency,
          details: %{backend: cdn_backend(), error: inspect(reason)}
        }
    end
  rescue
    e ->
      %{
        name: :cdn,
        status: :unhealthy,
        message: "CDN check error: #{Exception.message(e)}",
        latency_ms: nil,
        details: %{error: Exception.message(e)}
      }
  end

  @doc """
  Generate a payload suitable for the `/health` endpoint.

  Returns a JSON-serializable map with overall status and per-component
  status for load balancer integration.
  """
  @spec health_endpoint_payload() :: map()
  def health_endpoint_payload do
    {:ok, report} = dashboard()

    %{
      status: to_string(report.status),
      timestamp: DateTime.to_iso8601(report.timestamp),
      version: report.version,
      node: to_string(report.node),
      components:
        Enum.map(report.components, fn c ->
          %{
            name: to_string(c.name),
            status: to_string(c.status),
            latency_ms: c.latency_ms,
            message: c.message
          }
        end),
      healthy: report.summary.healthy_count,
      degraded: report.summary.degraded_count,
      unhealthy: report.summary.unhealthy_count
    }
  end

  @doc """
  Check a single component by name.

  Supports all core components plus `:cdn`.
  """
  @spec check_component(atom()) :: component_status()
  def check_component(:cdn), do: check_cdn()
  def check_component(component), do: Checks.check_component_status(component)

  @doc """
  List all monitored component names.
  """
  @spec component_names() :: [atom()]
  def component_names, do: @core_components ++ [:cdn]

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp check_core_components do
    @core_components
    |> Enum.map(fn component ->
      try do
        Checks.check_component_status(component)
      rescue
        e ->
          %{
            name: component,
            status: :unhealthy,
            message: Exception.message(e),
            latency_ms: nil,
            details: %{}
          }
      end
    end)
  end

  defp cdn_backend do
    config = Application.get_env(:cgraph, CGraph.CDN.CDNManager, [])
    Keyword.get(config, :backend, :r2)
  end
end
