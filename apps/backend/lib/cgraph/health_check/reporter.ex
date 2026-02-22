defmodule CGraph.HealthCheck.Reporter do
  @moduledoc """
  Health report generation and telemetry for the CGraph system.

  Aggregates individual component checks into a unified health report
  and emits telemetry events on status transitions.
  """

  require Logger

  alias CGraph.HealthCheck.Checks

  # ---------------------------------------------------------------------------
  # Report Generation
  # ---------------------------------------------------------------------------

  @doc """
  Generate a detailed health report for all components.

  `started_at` is the monotonic start time (in seconds) of the
  HealthCheck GenServer, used to compute uptime.

  Returns a `CGraph.HealthCheck.health_report()` map.
  """
  @spec generate_report(integer()) :: CGraph.HealthCheck.health_report()
  def generate_report(started_at) do
    components =
      [
        Checks.check_component_status(:database),
        Checks.check_component_status(:cache),
        Checks.check_component_status(:memory),
        Checks.check_component_status(:oban)
      ]
      |> maybe_add_redis_check()

    overall_status = determine_overall_status(components)

    %{
      status: overall_status,
      timestamp: DateTime.utc_now(),
      version: Application.spec(:cgraph, :vsn) |> to_string(),
      uptime_seconds: System.monotonic_time(:second) - started_at,
      node: node(),
      components: components
    }
  end

  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------

  @doc """
  Emit telemetry events when health status changes.
  """
  @spec emit_status_change_telemetry(atom(), atom()) :: :ok
  def emit_status_change_telemetry(old_status, new_status) do
    event =
      case new_status do
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
      Logger.warning("health_status_changed", old_status: old_status, new_status: new_status)
    end

    :ok
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp maybe_add_redis_check(components) do
    if Checks.redis_configured?() do
      components ++ [Checks.check_component_status(:redis)]
    else
      components
    end
  end

  @doc false
  @spec determine_overall_status([map()]) :: CGraph.HealthCheck.status()
  def determine_overall_status(components) do
    statuses = Enum.map(components, & &1.status)

    cond do
      :unhealthy in statuses -> :unhealthy
      :degraded in statuses -> :degraded
      true -> :healthy
    end
  end
end
