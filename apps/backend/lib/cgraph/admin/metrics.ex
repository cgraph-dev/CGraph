defmodule CGraph.Admin.Metrics do
  @moduledoc """
  System metrics and real-time stats for the admin dashboard.

  This module encapsulates all metric-gathering functions that power the
  administrative dashboard, including user counts, message volumes,
  BEAM runtime statistics, and live performance indicators.

  These functions are delegated from `CGraph.Admin` so the public API
  surface remains unchanged.
  """

  import Ecto.Query

  alias CGraph.Accounts.User
  alias CGraph.ReadRepo
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Get comprehensive system metrics for dashboard.

  Returns metrics across all major system components including users,
  messages, groups, BEAM runtime, and background jobs.
  """
  @spec get_system_metrics() :: {:ok, map()}
  def get_system_metrics do
    {:ok, %{
      users: user_metrics(),
      messages: message_metrics(),
      groups: group_metrics(),
      system: system_metrics(),
      jobs: job_metrics(),
      collected_at: DateTime.utc_now()
    }}
  end

  @doc """
  Get real-time stats for live dashboard updates.

  Returns point-in-time performance indicators such as active WebSocket
  connections, request rate, database latency, cache hit rate, and
  memory usage.
  """
  @spec get_realtime_stats() :: map()
  def get_realtime_stats do
    %{
      active_connections: get_active_websocket_count(),
      requests_per_minute: get_request_rate(),
      database_latency_ms: get_db_latency(),
      cache_hit_rate: get_cache_hit_rate(),
      memory_usage_mb: get_memory_usage(),
      timestamp: DateTime.utc_now()
    }
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp user_metrics do
    total = ReadRepo.aggregate(User, :count)
    today = Date.utc_today()
    start_of_day = DateTime.new!(today, ~T[00:00:00], "Etc/UTC")

    new_today = ReadRepo.one(
      from u in User,
      where: u.inserted_at >= ^start_of_day,
      select: count()
    )

    active_24h = ReadRepo.one(
      from u in User,
      where: u.last_seen_at >= ago(24, "hour"),
      select: count()
    )

    %{
      total: total,
      new_today: new_today,
      active_24h: active_24h,
      premium: ReadRepo.one(from u in User, where: u.is_premium == true, select: count()),
      verified: ReadRepo.one(from u in User, where: u.is_verified == true, select: count())
    }
  end

  defp message_metrics do
    # Would query from messages table
    %{
      total: 0,
      today: 0,
      avg_per_user: 0.0
    }
  end

  defp group_metrics do
    # Would query from groups table
    %{
      total: 0,
      public: 0,
      private: 0,
      avg_members: 0.0
    }
  end

  defp system_metrics do
    memory = :erlang.memory()
    {uptime_ms, _} = :erlang.statistics(:wall_clock)

    %{
      uptime_seconds: div(uptime_ms, 1000),
      memory: %{
        total_mb: div(memory[:total], 1_048_576),
        processes_mb: div(memory[:processes], 1_048_576),
        ets_mb: div(memory[:ets], 1_048_576),
        binary_mb: div(memory[:binary], 1_048_576)
      },
      processes: :erlang.system_info(:process_count),
      schedulers: :erlang.system_info(:schedulers_online),
      otp_release: :erlang.system_info(:otp_release) |> to_string(),
      elixir_version: System.version()
    }
  end

  defp job_metrics do
    # Would query Oban jobs
    %{
      pending: 0,
      running: 0,
      completed_24h: 0,
      failed_24h: 0
    }
  end

  defp get_active_websocket_count do
    # Would use Phoenix.Presence or channel tracking
    0
  end

  defp get_request_rate do
    # Would use telemetry metrics
    0
  end

  defp get_db_latency do
    start = System.monotonic_time(:millisecond)
    Repo.query("SELECT 1")
    System.monotonic_time(:millisecond) - start
  end

  defp get_cache_hit_rate do
    case Cachex.stats(:cgraph_cache) do
      {:ok, stats} ->
        hits = Map.get(stats, :hits, 0)
        misses = Map.get(stats, :misses, 0)
        total = hits + misses
        if total > 0, do: Float.round(hits / total * 100, 2), else: 100.0
      _ -> 0.0
    end
  end

  defp get_memory_usage do
    div(:erlang.memory(:total), 1_048_576)
  end
end
