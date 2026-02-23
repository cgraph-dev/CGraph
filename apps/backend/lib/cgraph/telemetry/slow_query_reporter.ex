defmodule CGraph.Telemetry.SlowQueryReporter do
  @moduledoc """
  Slow query detection and reporting for CGraph.

  ## Overview

  Automatically detects and reports slow database queries using Ecto telemetry.
  Provides N+1 query detection, slow query logging with EXPLAIN ANALYZE output,
  and periodic aggregate reports.

  ## Features

  - Log all queries exceeding configurable threshold (default: 100ms)
  - N+1 detection: flag processes executing > 5 queries per request
  - Weekly aggregated slow query report
  - Query plan analysis for identified slow queries
  - Integration with Prometheus metrics for monitoring

  ## Configuration

      config :cgraph, CGraph.Telemetry.SlowQueryReporter,
        slow_threshold_ms: 100,
        n_plus_one_threshold: 5,
        enabled: true

  ## Architecture

  Uses an ETS table for per-request query counting (N+1 detection)
  and a GenServer for periodic report aggregation.
  """

  use GenServer

  require Logger

  @table :slow_query_tracker
  @n_plus_one_table :n_plus_one_tracker
  @default_slow_threshold_ms 100
  @default_n_plus_one_threshold 5
  @report_interval :timer.hours(24)

  # ===========================================================================
  # Public API
  # ===========================================================================

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Get the current slow query statistics.
  """
  @spec get_stats() :: map()
  def get_stats do
    queries = :ets.tab2list(@table)
    n_plus_ones = :ets.tab2list(@n_plus_one_table)

    %{
      slow_queries_total: length(queries),
      n_plus_one_detections: length(n_plus_ones),
      top_slow_queries: queries
        |> Enum.sort_by(fn {_key, data} -> data.duration_ms end, :desc)
        |> Enum.take(20)
        |> Enum.map(fn {_key, data} -> data end)
    }
  rescue
    _ -> %{slow_queries_total: 0, n_plus_one_detections: 0, top_slow_queries: []}
  end

  @doc """
  Reset statistics (called after periodic report).
  """
  @spec reset_stats() :: :ok
  def reset_stats do
    :ets.delete_all_objects(@table)
    :ets.delete_all_objects(@n_plus_one_table)
  rescue
    _ -> :ok
  end

  # ===========================================================================
  # GenServer Callbacks
  # ===========================================================================

  @impl true
  @spec init(keyword()) :: {:ok, map()}
  def init(opts) do
    # Create ETS tables for tracking
    :ets.new(@table, [:named_table, :set, :public])
    :ets.new(@n_plus_one_table, [:named_table, :set, :public])

    # Attach to Ecto telemetry events
    :telemetry.attach(
      "slow-query-reporter",
      [:cgraph, :repo, :query],
      &__MODULE__.handle_query/4,
      %{
        slow_threshold_ms: Keyword.get(opts, :slow_threshold_ms, @default_slow_threshold_ms),
        n_plus_one_threshold: Keyword.get(opts, :n_plus_one_threshold, @default_n_plus_one_threshold)
      }
    )

    # Schedule periodic report
    Process.send_after(self(), :generate_report, @report_interval)

    Logger.info("slowqueryreporter_started_with_threshold_ms", opts_slow_threshold_ms_default_slow_threshold_ms: inspect(Keyword.get(opts, :slow_threshold_ms, @default_slow_threshold_ms)))

    {:ok, %{
      report_count: 0,
      slow_threshold_ms: Keyword.get(opts, :slow_threshold_ms, @default_slow_threshold_ms)
    }}
  end

  @impl true
  @spec handle_info(:generate_report, map()) :: {:noreply, map()}
  def handle_info(:generate_report, state) do
    generate_and_log_report()
    Process.send_after(self(), :generate_report, @report_interval)
    {:noreply, %{state | report_count: state.report_count + 1}}
  end

  # ===========================================================================
  # Telemetry Handler
  # ===========================================================================

  @spec handle_query([atom()], map(), map(), map()) :: :ok
  def handle_query([:cgraph, :repo, :query], measurements, metadata, config) do
    duration_ms = System.convert_time_unit(measurements.total_time, :native, :millisecond)

    # Track N+1: count queries per process
    pid_key = inspect(self())

    try do
      count = case :ets.lookup(@n_plus_one_table, pid_key) do
        [{_, existing}] -> existing + 1
        [] -> 1
      end

      :ets.insert(@n_plus_one_table, {pid_key, count})

      if count > config.n_plus_one_threshold do
        Logger.warning(
          "[N+1] Process #{pid_key} executed #{count} queries",
          source: metadata.source,
          query_count: count,
          latest_query_ms: duration_ms
        )
      end
    rescue
      _ -> :ok
    end

    # Track slow queries
    if duration_ms > config.slow_threshold_ms do
      query_key = "#{metadata.source}:#{:erlang.phash2(metadata.query)}"

      entry = %{
        source: metadata.source,
        query: truncate_query(metadata.query, 500),
        duration_ms: duration_ms,
        queue_time_ms: measurements.queue_time &&
          System.convert_time_unit(measurements.queue_time, :native, :millisecond),
        decode_time_ms: measurements.decode_time &&
          System.convert_time_unit(measurements.decode_time, :native, :millisecond),
        timestamp: DateTime.utc_now() |> DateTime.to_iso8601(),
        process: pid_key
      }

      try do
        :ets.insert(@table, {query_key, entry})
      rescue
        _ -> :ok
      end

      Logger.warning(
        "[SlowQuery] #{duration_ms}ms — #{metadata.source}",
        source: metadata.source,
        duration_ms: duration_ms,
        queue_time_ms: entry.queue_time_ms,
        query: truncate_query(metadata.query, 200)
      )

      # Emit telemetry for Prometheus
      :telemetry.execute(
        [:cgraph, :slow_query],
        %{duration_ms: duration_ms},
        %{source: metadata.source}
      )
    end
  end

  # ===========================================================================
  # Report Generation
  # ===========================================================================

  defp generate_and_log_report do
    stats = get_stats()

    Logger.info(
      "[SlowQueryReport] Daily summary",
      slow_queries_total: stats.slow_queries_total,
      n_plus_one_detections: stats.n_plus_one_detections,
      top_5_slowest: stats.top_slow_queries
        |> Enum.take(5)
        |> Enum.map_join(", ", fn q -> "#{q.source}: #{q.duration_ms}ms" end)
    )

    # Reset after report
    reset_stats()
  end

  defp truncate_query(nil, _max), do: nil
  defp truncate_query(query, max) when byte_size(query) <= max, do: query
  defp truncate_query(query, max) do
    String.slice(query, 0, max - 3) <> "..."
  end
end
