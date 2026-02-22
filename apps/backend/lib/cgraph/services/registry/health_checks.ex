defmodule CGraph.Services.Registry.HealthChecks do
  @moduledoc """
  Health check execution, built-in service checks, and telemetry for the service registry.

  Contains the logic for performing health checks on registered services,
  updating service state based on results, built-in health check functions
  for core infrastructure, and telemetry emission for observability.
  """

  require Logger

  @degraded_threshold_ms 1000

  # ---------------------------------------------------------------------------
  # Health Check Execution
  # ---------------------------------------------------------------------------

  @doc """
  Perform a health check for a named service and update registry state.

  Returns `{updated_state, health_result}`.
  """
  @spec perform_health_check(map(), String.t(), map()) :: {map(), atom()}
  def perform_health_check(state, name, service) do
    start_time = System.monotonic_time(:millisecond)

    {new_state, result} =
      try do
        case service.health_check do
          nil ->
            {state, :unknown}

          check_fn ->
            result = check_fn.()
            duration = System.monotonic_time(:millisecond) - start_time

            final_state =
              cond do
                result == :unhealthy -> :unhealthy
                duration > @degraded_threshold_ms -> :degraded
                true -> result
              end

            emit_health_check(name, final_state, duration)

            updated_service = update_service_state(service, final_state)

            if service.state != final_state do
              emit_state_change(name, service.state, final_state)
            end

            services = Map.put(state.services, name, updated_service)
            {%{state | services: services}, final_state}
        end
      rescue
        e ->
          Logger.warning("health_check_failed_for", name: name, e: inspect(e))

          updated_service = update_service_state(service, :unhealthy, inspect(e))
          services = Map.put(state.services, name, updated_service)

          emit_health_check(name, :unhealthy, 0)

          {%{state | services: services}, :unhealthy}
      end

    {new_state, result}
  end

  @doc """
  Update a service's state, tracking consecutive failures and timestamps.
  """
  @spec update_service_state(map(), atom(), String.t() | nil) :: map()
  def update_service_state(service, new_state, error \\ nil) do
    consecutive_failures =
      if new_state == :unhealthy do
        service.consecutive_failures + 1
      else
        0
      end

    %{
      service
      | state: new_state,
        last_check: DateTime.utc_now(),
        last_error: error,
        consecutive_failures: consecutive_failures
    }
  end

  # ---------------------------------------------------------------------------
  # Query Helpers
  # ---------------------------------------------------------------------------

  @doc """
  Count services in a given health state.
  """
  @spec count_by_state(map(), atom()) :: non_neg_integer()
  def count_by_state(services, target_state) do
    services
    |> Enum.count(fn {_, service} -> service.state == target_state end)
  end

  @doc """
  Check if all critical services are healthy or degraded.
  """
  @spec critical_healthy?(map()) :: boolean()
  def critical_healthy?(services) do
    services
    |> Enum.filter(fn {_, service} -> service.critical end)
    |> Enum.all?(fn {_, service} -> service.state in [:healthy, :degraded] end)
  end

  # ---------------------------------------------------------------------------
  # Built-in Service Definitions
  # ---------------------------------------------------------------------------

  @doc """
  Returns the list of built-in service configurations to register at startup.
  """
  @spec builtin_services() :: [{String.t(), map()}]
  def builtin_services do
    [
      {"postgres",
       %{
         type: :database,
         critical: true,
         health_check: &check_postgres/0
       }},
      {"redis",
       %{
         type: :database,
         critical: false,
         health_check: &check_redis/0
       }},
      {"cachex",
       %{
         type: :internal,
         critical: false,
         health_check: &check_cachex/0
       }},
      {"oban",
       %{
         type: :internal,
         critical: false,
         health_check: &check_oban/0
       }}
    ]
  end

  # ---------------------------------------------------------------------------
  # Built-in Health Checks
  # ---------------------------------------------------------------------------

  @doc false
  @spec check_postgres() :: :healthy | :unhealthy
  def check_postgres do
    case CGraph.Repo.query("SELECT 1") do
      {:ok, _} -> :healthy
      _ -> :unhealthy
    end
  rescue
    _ -> :unhealthy
  end

  @doc false
  @spec check_redis() :: :healthy | :unhealthy
  def check_redis do
    case CGraph.Redis.command(["PING"]) do
      {:ok, "PONG"} -> :healthy
      _ -> :unhealthy
    end
  rescue
    _ -> :unhealthy
  end

  @doc false
  @spec check_cachex() :: :healthy | :unhealthy
  def check_cachex do
    case Cachex.stats(:cgraph_cache) do
      {:ok, _} -> :healthy
      _ -> :unhealthy
    end
  rescue
    _ -> :unhealthy
  end

  @doc false
  @spec check_oban() :: :healthy | :unhealthy
  def check_oban do
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

  @doc false
  @spec emit_health_check(String.t(), atom(), non_neg_integer()) :: :ok
  def emit_health_check(name, state, duration) do
    :telemetry.execute(
      [:cgraph, :service, :health_check],
      %{duration: duration},
      %{service: name, state: state}
    )
  end

  @doc false
  @spec emit_state_change(String.t(), atom(), atom()) :: :ok
  def emit_state_change(name, from, to) do
    :telemetry.execute(
      [:cgraph, :service, :state_change],
      %{system_time: System.system_time()},
      %{service: name, from: from, to: to}
    )

    if to == :unhealthy do
      Logger.warning("service_became_unhealthy_was", name: name, from: from)
    else
      if from == :unhealthy do
        Logger.info("service_recovered_now", name: name, to: to)
      end
    end
  end
end
