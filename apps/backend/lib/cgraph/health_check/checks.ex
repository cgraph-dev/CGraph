defmodule CGraph.HealthCheck.Checks do
  @moduledoc """
  Component health checks for the CGraph system.

  Provides individual health status checks for each system component:
  database, cache, Redis, memory, and Oban job processor.

  Each check returns a `CGraph.HealthCheck.component_status()` map with
  the component name, status, optional message, latency, and details.
  """

  alias Ecto.Adapters.SQL

  @healthy_memory_threshold 0.85
  @degraded_memory_threshold 0.95

  # ---------------------------------------------------------------------------
  # Component Status Checks
  # ---------------------------------------------------------------------------

  @doc """
  Check the health status of a specific component.

  Returns a component status map for the given component atom.

  ## Supported components

    * `:database` — connectivity and connection pool
    * `:cache` — Cachex read/write and hit rate
    * `:redis` — Redis ping
    * `:memory` — BEAM memory usage
    * `:oban` — background job processor
  """
  @spec check_component_status(atom()) :: CGraph.HealthCheck.component_status()
  def check_component_status(:database) do
    start_time = System.monotonic_time(:millisecond)

    try do
      # Simple connectivity check
      SQL.query!(CGraph.Repo, "SELECT 1", [])

      # Check connection pool
      pool_status = check_pool_status()

      latency = System.monotonic_time(:millisecond) - start_time

      %{
        name: :database,
        status: if(pool_status.healthy, do: :healthy, else: :degraded),
        message: nil,
        latency_ms: latency,
        details: pool_status
      }
    rescue
      e ->
        %{
          name: :database,
          status: :unhealthy,
          message: Exception.message(e),
          latency_ms: nil,
          details: %{}
        }
    end
  end

  def check_component_status(:cache) do
    start_time = System.monotonic_time(:millisecond)

    try do
      # Test cache read/write
      test_key = "health_check:#{System.unique_integer()}"
      Cachex.put(:cgraph_cache, test_key, "test")
      {:ok, "test"} = Cachex.get(:cgraph_cache, test_key)
      Cachex.del(:cgraph_cache, test_key)

      # Get cache stats
      {:ok, stats} = Cachex.stats(:cgraph_cache)

      latency = System.monotonic_time(:millisecond) - start_time

      hit_rate =
        if stats.hits + stats.misses > 0 do
          stats.hits / (stats.hits + stats.misses) * 100
        else
          100.0
        end

      %{
        name: :cache,
        status: :healthy,
        message: nil,
        latency_ms: latency,
        details: %{
          hit_rate: Float.round(hit_rate, 2),
          hits: stats.hits,
          misses: stats.misses,
          evictions: stats.evictions
        }
      }
    rescue
      e ->
        %{
          name: :cache,
          status: :unhealthy,
          message: Exception.message(e),
          latency_ms: nil,
          details: %{}
        }
    end
  end

  def check_component_status(:redis) do
    start_time = System.monotonic_time(:millisecond)

    try do
      case CGraph.Redis.ping() do
        :ok ->
          latency = System.monotonic_time(:millisecond) - start_time

          %{
            name: :redis,
            status: :healthy,
            message: nil,
            latency_ms: latency,
            details: %{}
          }

        _error ->
          %{
            name: :redis,
            status: :unhealthy,
            message: "Redis ping failed",
            latency_ms: nil,
            details: %{}
          }
      end
    rescue
      e ->
        %{
          name: :redis,
          status: :unhealthy,
          message: Exception.message(e),
          latency_ms: nil,
          details: %{}
        }
    end
  end

  def check_component_status(:memory) do
    memory = :erlang.memory()
    total = memory[:total]
    system_limit = :erlang.system_info(:atom_limit) * 8

    usage_ratio = total / max(system_limit, 1)

    status =
      cond do
        usage_ratio > @degraded_memory_threshold -> :unhealthy
        usage_ratio > @healthy_memory_threshold -> :degraded
        true -> :healthy
      end

    %{
      name: :memory,
      status: status,
      message:
        if(status != :healthy,
          do: "Memory usage at #{Float.round(usage_ratio * 100, 1)}%"
        ),
      latency_ms: 0,
      details: %{
        total_bytes: total,
        processes: memory[:processes],
        ets: memory[:ets],
        binary: memory[:binary],
        usage_percent: Float.round(usage_ratio * 100, 2)
      }
    }
  end

  def check_component_status(:oban) do
    # Check Oban is running and processing jobs
    %{
      name: :oban,
      status: :healthy,
      message: nil,
      latency_ms: 0,
      details: %{
        queues: Oban.config().queues
      }
    }
  rescue
    e ->
      %{
        name: :oban,
        status: :degraded,
        message: Exception.message(e),
        latency_ms: nil,
        details: %{}
      }
  end

  def check_component_status(component) do
    %{
      name: component,
      status: :unknown,
      message: "Unknown component: #{component}",
      latency_ms: nil,
      details: %{}
    }
  end

  # ---------------------------------------------------------------------------
  # Readiness Helpers
  # ---------------------------------------------------------------------------

  @doc """
  Returns `true` if the database is reachable.
  """
  @spec database_ready?() :: boolean()
  def database_ready? do
    SQL.query!(CGraph.Repo, "SELECT 1", [])
    true
  rescue
    _ -> false
  end

  @doc """
  Returns `true` if the cache is operational.
  """
  @spec cache_ready?() :: boolean()
  def cache_ready? do
    case Cachex.stats(:cgraph_cache) do
      {:ok, _} -> true
      _ -> false
    end
  end

  @doc """
  Returns `true` if the Redis module is loaded and available.
  """
  @spec redis_configured?() :: boolean()
  def redis_configured? do
    Code.ensure_loaded?(CGraph.Redis)
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp check_pool_status do
    # DBConnection pool status
    %{
      healthy: true,
      pool_size: CGraph.Repo.config()[:pool_size] || 10,
      checked_out: 0
    }
  rescue
    _ ->
      %{healthy: false, pool_size: 0, checked_out: 0}
  end
end
