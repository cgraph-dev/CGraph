defmodule CGraphWeb.HealthController do
  @moduledoc """
  Health check endpoints for monitoring and load balancer probes.

  ## Endpoints

  | Endpoint      | Purpose                     | Response Codes     |
  |---------------|-----------------------------|--------------------|
  | `GET /health` | Liveness probe             | 200 always         |
  | `GET /ready`  | Readiness probe            | 200 OK, 503 unready|
  | `GET /status` | Detailed health (internal) | 200/503            |

  ## Load Balancer Integration

  Configure your load balancer to:
  1. Use `/health` for liveness checks (restart if failing)
  2. Use `/ready` for readiness checks (remove from pool if failing)
  """
  use CGraphWeb, :controller

  import CGraphWeb.ControllerHelpers, only: [render_data: 2]

  alias CGraph.Repo
  alias CGraph.Repo.Healthcheck
  alias CGraph.Search.Engine

  @doc """
  Basic liveness check - returns OK if the service is running.

  This endpoint should always return 200 if the Erlang VM is running.
  Used by Kubernetes/Docker for liveness probes.
  """
  def index(conn, _params) do
    render_data(conn, %{
      status: "ok",
      service: "cgraph-api",
      version: Application.spec(:cgraph, :vsn) |> to_string(),
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
    })
  end

  @doc """
  Readiness check - verifies all dependencies are available.

  Returns 503 if any critical dependency is unavailable.
  Used by load balancers to route traffic only to healthy instances.
  """
  def ready(conn, _params) do
    # Check if server is draining (graceful shutdown in progress)
    if Application.get_env(:cgraph, :draining, false) do
      conn
      |> put_status(503)
      |> json(%{
        status: "draining",
        message: "Server is shutting down gracefully"
      })
    else
      ready_check(conn)
    end
  end

  defp ready_check(conn) do
    start_time = System.monotonic_time(:millisecond)

    checks = %{
      database: check_database(),
      cache: check_cache(),
      redis: check_redis(),
      search: check_search()
    }

    duration_ms = System.monotonic_time(:millisecond) - start_time

    # Determine overall status
    critical_checks = [:database]
    critical_ok = Enum.all?(critical_checks, fn k -> checks[k] == "ok" end)
    all_ok = Enum.all?(checks, fn {_k, v} -> v in ["ok", "not_configured"] end)

    {status, http_status} = cond do
      critical_ok and all_ok -> {"ready", 200}
      critical_ok -> {"degraded", 200}
      true -> {"not_ready", 503}
    end

    conn
    |> put_status(http_status)
    |> json(%{
      status: status,
      checks: checks,
      duration_ms: duration_ms,
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
    })
  end

  @doc """
  Detailed health status for internal monitoring.

  Returns comprehensive diagnostics including:
  - Database pool stats
  - Query performance
  - Memory usage
  - Active connections
  """
  def status(conn, _params) do
    case Healthcheck.check() do
      {:ok, health} ->
        diagnostics = if health.status != :healthy do
          Healthcheck.diagnostics()
        else
          %{}
        end

        response = %{
          status: Atom.to_string(health.status),
          latency_ms: health.latency_ms,
          issues: format_issues(health.issues),
          diagnostics: diagnostics,
          system: system_info(),
          timestamp: DateTime.to_iso8601(health.timestamp)
        }

        http_status = case health.status do
          :healthy -> 200
          :degraded -> 200
          :unhealthy -> 503
        end

        conn
        |> put_status(http_status)
        |> json(response)

      {:error, reason} ->
        conn
        |> put_status(503)
        |> json(%{
          status: "unhealthy",
          error: inspect(reason),
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        })
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp check_database do
    case Repo.query("SELECT 1", [], timeout: 3000) do
      {:ok, _} -> "ok"
      {:error, _} -> "error"
    end
  rescue
    _ -> "error"
  end

  defp check_cache do
    case Cachex.get(:cgraph_cache, "__health_check__") do
      {:ok, _} -> "ok"
      {:error, _} -> "error"
    end
  rescue
    _ -> "not_configured"
  end

  defp check_redis do
    case Process.whereis(:redix) do
      nil -> "not_configured"
      pid when is_pid(pid) ->
        case Redix.command(pid, ["PING"]) do
          {:ok, "PONG"} -> "ok"
          _ -> "error"
        end
    end
  rescue
    _ -> "not_configured"
  end

  defp check_search do
    case Engine.get_backend() do
      :meilisearch ->
        if Engine.healthy?(), do: "ok", else: "degraded"
      :postgres ->
        "postgres_fallback"
    end
  rescue
    _ -> "not_configured"
  end

  defp format_issues(issues) do
    Enum.map(issues, fn issue ->
      %{
        type: Atom.to_string(issue.type),
        message: issue.message,
        severity: Atom.to_string(issue.severity)
      }
    end)
  end

  defp system_info do
    memory = :erlang.memory()

    %{
      memory: %{
        total_mb: div(memory[:total], 1_048_576),
        processes_mb: div(memory[:processes], 1_048_576),
        ets_mb: div(memory[:ets], 1_048_576)
      },
      processes: :erlang.system_info(:process_count),
      schedulers: :erlang.system_info(:schedulers_online),
      uptime_seconds: :erlang.statistics(:wall_clock) |> elem(0) |> div(1000)
    }
  end
end
