defmodule CGraph.Operations.PerformanceProfiler do
  @moduledoc """
  Performance profiling toolkit for CGraph.

  Provides deep-dive profiling capabilities that complement (but do
  not overlap with) the existing performance modules:

  - `CGraph.Performance.QueryOptimizer` — query batching, cursor pagination,
    EXPLAIN ANALYZE on individual queries, N+1 detection
  - `CGraph.Performance.SLO` — runtime SLO tracking via telemetry
  - `CGraph.Performance.RequestCoalescing` — singleflight request dedup

  **This module focuses on:**

  - **Flame graphs** — CPU profiling via `:eprof` / `:fprof` integration
  - **Slow query reports** — Aggregate analysis from `pg_stat_statements`
    (vs QueryOptimizer's per-query EXPLAIN ANALYZE)
  - **Memory analysis** — BEAM memory breakdown + top process inspection

  ## Usage

      # CPU profiling
      {:ok, profile} = PerformanceProfiler.flame_graph(fn ->
        MyApp.heavy_computation()
      end)

      # Database slow query report (pg_stat_statements aggregate view)
      {:ok, report} = PerformanceProfiler.slow_query_report(limit: 20)

      # Memory analysis
      {:ok, analysis} = PerformanceProfiler.memory_analysis()
  """

  require Logger

  @type profile_result :: %{
          call_count: non_neg_integer(),
          total_time_us: non_neg_integer(),
          top_functions: [map()],
          profile_data: term()
        }

  @type slow_query :: %{
          query: String.t(),
          calls: non_neg_integer(),
          total_time_ms: float(),
          mean_time_ms: float(),
          rows: non_neg_integer(),
          shared_blks_hit: non_neg_integer(),
          shared_blks_read: non_neg_integer(),
          hit_rate_percent: float()
        }

  @type memory_report :: %{
          beam_memory: map(),
          top_processes: [map()],
          ets_tables: [map()],
          atom_usage: map(),
          recommendations: [String.t()]
        }

  # ── Flame Graph / CPU Profiling ─────────────────────────────

  @doc """
  Profile a function's CPU usage and generate flame-graph-compatible data.

  Uses Erlang's `:eprof` for lightweight profiling or `:fprof` for
  detailed call trees.

  ## Options

    * `:profiler` — `:eprof` (default, lower overhead) or `:fprof` (detailed)
    * `:sort` — `:time` (default) or `:calls`
    * `:top` — Number of top functions to include (default: 30)

  ## Returns

      {:ok, %{
        call_count: 1542,
        total_time_us: 45200,
        top_functions: [
          %{module: Enum, function: :map, arity: 2, calls: 500, time_us: 12000, percent: 26.5},
          ...
        ],
        profile_data: raw_eprof_data
      }}
  """
  @spec flame_graph((-> term()), keyword()) :: {:ok, profile_result()} | {:error, term()}
  def flame_graph(fun, opts \\ []) when is_function(fun, 0) do
    profiler = Keyword.get(opts, :profiler, :eprof)
    top_n = Keyword.get(opts, :top, 30)
    sort_by = Keyword.get(opts, :sort, :time)

    case profiler do
      :eprof -> profile_with_eprof(fun, top_n, sort_by)
      :fprof -> profile_with_fprof(fun, top_n, sort_by)
      other -> {:error, {:unknown_profiler, other}}
    end
  end

  defp profile_with_eprof(fun, top_n, sort_by) do
    Logger.info("[Profiler] Starting eprof CPU profiling")

    try do
      :eprof.start()
      :eprof.start_profiling([self()])

      result = fun.()

      :eprof.stop_profiling()

      # Capture eprof output
      profile_data = capture_eprof_analysis()

      :eprof.stop()

      top_functions =
        profile_data
        |> sort_profile_data(sort_by)
        |> Enum.take(top_n)

      total_time = Enum.reduce(top_functions, 0, &(&1.time_us + &2))
      total_calls = Enum.reduce(top_functions, 0, &(&1.calls + &2))

      profile = %{
        call_count: total_calls,
        total_time_us: total_time,
        top_functions: top_functions,
        profile_data: profile_data,
        profiled_result: result
      }

      {:ok, profile}
    rescue
      e ->
        :eprof.stop()
        {:error, {:profiling_failed, Exception.message(e)}}
    end
  end

  defp profile_with_fprof(fun, top_n, sort_by) do
    Logger.info("[Profiler] Starting fprof CPU profiling")

    trace_file = "/tmp/cgraph_fprof_#{:erlang.unique_integer([:positive])}.trace"

    try do
      :fprof.trace([:start, {:procs, [self()]}, {:file, String.to_charlist(trace_file)}])

      result = fun.()

      :fprof.trace(:stop)
      :fprof.profile(file: String.to_charlist(trace_file))

      # Analyze fprof results
      analysis_file = "/tmp/cgraph_fprof_analysis_#{:erlang.unique_integer([:positive])}.txt"

      :fprof.analyse(
        dest: String.to_charlist(analysis_file),
        sort: sort_by,
        totals: true,
        details: true
      )

      # Parse analysis (simplified — fprof output is complex)
      profile_data = parse_fprof_output(analysis_file)

      top_functions =
        profile_data
        |> sort_profile_data(sort_by)
        |> Enum.take(top_n)

      total_time = Enum.reduce(top_functions, 0, &(&1.time_us + &2))
      total_calls = Enum.reduce(top_functions, 0, &(&1.calls + &2))

      # Cleanup temp files
      File.rm(trace_file)
      File.rm(analysis_file)

      profile = %{
        call_count: total_calls,
        total_time_us: total_time,
        top_functions: top_functions,
        profile_data: profile_data,
        profiled_result: result
      }

      {:ok, profile}
    rescue
      e ->
        File.rm(trace_file)
        {:error, {:profiling_failed, Exception.message(e)}}
    end
  end

  defp capture_eprof_analysis do
    # eprof.analyze/0 writes to :io, capture it via StringIO
    try do
      {:ok, string_io} = StringIO.open("")

      original_gl = Process.group_leader()
      Process.group_leader(self(), string_io)

      try do
        :eprof.analyze(:total)
      after
        Process.group_leader(self(), original_gl)
      end

      {_input, output} = StringIO.close(string_io)
      parse_eprof_output(output)
    rescue
      _ -> []
    end
  end

  defp parse_eprof_output(output) when is_binary(output) do
    output
    |> String.split("\n")
    |> Enum.flat_map(fn line ->
      # Parse eprof lines: MODULE:FUNCTION/ARITY  CALLS  TIME  PERCENT
      case Regex.run(~r/^\s*(.+?):(.+?)\/(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)/, line) do
        [_, mod, fun, arity, calls, time, percent] ->
          [
            %{
              module: String.to_atom(mod),
              function: String.to_atom(fun),
              arity: String.to_integer(arity),
              calls: String.to_integer(calls),
              time_us: String.to_integer(time),
              percent: parse_float_safe(percent)
            }
          ]

        _ ->
          []
      end
    end)
  end

  defp parse_fprof_output(file_path) do
    case File.read(file_path) do
      {:ok, content} ->
        content
        |> String.split("\n")
        |> Enum.flat_map(fn line ->
          case Regex.run(~r/\{(\{[^}]+\}),\s*(\d+),\s*([\d.]+),\s*([\d.]+)\}/, line) do
            [_, mfa, calls, acc, own] ->
              [
                %{
                  mfa: mfa,
                  calls: String.to_integer(calls),
                  time_us: round(parse_float_safe(own) * 1000),
                  acc_time_us: round(parse_float_safe(acc) * 1000),
                  module: :unknown,
                  function: :unknown,
                  arity: 0,
                  percent: 0.0
                }
              ]

            _ ->
              []
          end
        end)

      {:error, _} ->
        []
    end
  end

  defp sort_profile_data(data, :time), do: Enum.sort_by(data, & &1.time_us, :desc)
  defp sort_profile_data(data, :calls), do: Enum.sort_by(data, & &1.calls, :desc)
  defp sort_profile_data(data, _), do: data

  defp parse_float_safe(str) do
    case Float.parse(str) do
      {val, _} -> val
      :error -> 0.0
    end
  end

  # ── Slow Query Report ───────────────────────────────────────
  # NOTE: This provides an AGGREGATE view from pg_stat_statements,
  # complementing QueryOptimizer.analyze_query/1 which does
  # EXPLAIN ANALYZE on individual Ecto queries.

  @doc """
  Generate a slow query report from pg_stat_statements.

  Unlike `QueryOptimizer.analyze_query/1` which runs EXPLAIN ANALYZE
  on a single Ecto query, this provides an aggregate view of all
  queries tracked by PostgreSQL.

  ## Options

    * `:limit` — Number of queries to return (default: 20)
    * `:sort_by` — `:mean_time` (default), `:total_time`, or `:calls`
    * `:min_calls` — Minimum call count to include (default: 10)
    * `:min_mean_ms` — Minimum mean time in ms to include (default: 1.0)

  ## Returns

      {:ok, %{
        queries: [%{query: "SELECT ...", mean_time_ms: 45.2, calls: 1200, ...}],
        stats: %{total_queries: 342, total_time_ms: 15200, cache_hit_rate: 99.2},
        generated_at: ~U[2026-03-12 10:00:00Z]
      }}
  """
  @spec slow_query_report(keyword()) :: {:ok, map()} | {:error, term()}
  def slow_query_report(opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    sort_by = Keyword.get(opts, :sort_by, :mean_time)
    min_calls = Keyword.get(opts, :min_calls, 10)
    min_mean_ms = Keyword.get(opts, :min_mean_ms, 1.0)

    order_clause =
      case sort_by do
        :total_time -> "total_exec_time DESC"
        :calls -> "calls DESC"
        _ -> "mean_exec_time DESC"
      end

    query = """
    SELECT
      query,
      calls,
      total_exec_time AS total_time_ms,
      mean_exec_time AS mean_time_ms,
      stddev_exec_time AS stddev_ms,
      min_exec_time AS min_time_ms,
      max_exec_time AS max_time_ms,
      rows,
      shared_blks_hit,
      shared_blks_read,
      CASE WHEN (shared_blks_hit + shared_blks_read) > 0
        THEN round(100.0 * shared_blks_hit / (shared_blks_hit + shared_blks_read), 2)
        ELSE 100.0
      END AS hit_rate_percent
    FROM pg_stat_statements
    WHERE calls >= #{min_calls}
      AND mean_exec_time >= #{min_mean_ms}
    ORDER BY #{order_clause}
    LIMIT #{limit};
    """

    stats_query = """
    SELECT
      count(*) AS total_queries,
      sum(total_exec_time) AS total_time_ms,
      sum(calls) AS total_calls,
      CASE WHEN sum(shared_blks_hit + shared_blks_read) > 0
        THEN round(100.0 * sum(shared_blks_hit) / sum(shared_blks_hit + shared_blks_read), 2)
        ELSE 100.0
      END AS cache_hit_rate
    FROM pg_stat_statements;
    """

    with {:ok, queries} <- safe_query(query),
         {:ok, [stats | _]} <- safe_query(stats_query) do
      formatted_queries =
        Enum.map(queries, fn q ->
          %{
            query: truncate_query(q["query"]),
            calls: q["calls"],
            total_time_ms: round_float(q["total_time_ms"]),
            mean_time_ms: round_float(q["mean_time_ms"]),
            stddev_ms: round_float(q["stddev_ms"]),
            min_time_ms: round_float(q["min_time_ms"]),
            max_time_ms: round_float(q["max_time_ms"]),
            rows: q["rows"],
            shared_blks_hit: q["shared_blks_hit"],
            shared_blks_read: q["shared_blks_read"],
            hit_rate_percent: q["hit_rate_percent"]
          }
        end)

      report = %{
        queries: formatted_queries,
        stats: %{
          total_queries: stats["total_queries"],
          total_time_ms: round_float(stats["total_time_ms"]),
          total_calls: stats["total_calls"],
          cache_hit_rate: stats["cache_hit_rate"]
        },
        generated_at: DateTime.utc_now()
      }

      {:ok, report}
    else
      {:error, reason} ->
        Logger.warning("[Profiler] Slow query report failed: #{inspect(reason)}")
        {:error, {:pg_stat_statements_unavailable, reason}}
    end
  end

  # ── Memory Analysis ─────────────────────────────────────────

  @doc """
  Comprehensive BEAM memory analysis.

  Inspects `:erlang.memory/0`, top memory-consuming processes,
  ETS table sizes, and atom table usage.

  ## Options

    * `:top_processes` — Number of top processes to include (default: 20)
    * `:include_ets` — Include ETS table analysis (default: true)
    * `:include_atoms` — Include atom stats (default: true)

  ## Returns

      {:ok, %{
        beam_memory: %{total_mb: 256, processes_mb: 120, ets_mb: 45, ...},
        top_processes: [%{pid: "#PID<0.500.0>", memory_kb: 2048, ...}],
        ets_tables: [%{name: :my_cache, size: 15000, memory_kb: 512}],
        atom_usage: %{count: 45000, limit: 1_048_576, percent: 4.3},
        recommendations: ["Consider increasing process heap size", ...]
      }}
  """
  @spec memory_analysis(keyword()) :: {:ok, memory_report()} | {:error, term()}
  def memory_analysis(opts \\ []) do
    top_n = Keyword.get(opts, :top_processes, 20)
    include_ets = Keyword.get(opts, :include_ets, true)
    include_atoms = Keyword.get(opts, :include_atoms, true)

    try do
      beam_memory = analyze_beam_memory()
      top_processes = analyze_top_processes(top_n)

      ets_tables = if include_ets, do: analyze_ets_tables(), else: []
      atom_usage = if include_atoms, do: analyze_atom_usage(), else: %{}

      recommendations = generate_memory_recommendations(beam_memory, top_processes, ets_tables)

      report = %{
        beam_memory: beam_memory,
        top_processes: top_processes,
        ets_tables: ets_tables,
        atom_usage: atom_usage,
        recommendations: recommendations,
        analyzed_at: DateTime.utc_now()
      }

      {:ok, report}
    rescue
      e ->
        {:error, {:analysis_failed, Exception.message(e)}}
    end
  end

  defp analyze_beam_memory do
    mem = :erlang.memory()

    %{
      total_mb: div(mem[:total], 1_048_576),
      processes_mb: div(mem[:processes], 1_048_576),
      processes_used_mb: div(mem[:processes_used], 1_048_576),
      system_mb: div(mem[:system], 1_048_576),
      atom_mb: div(mem[:atom], 1_048_576),
      atom_used_mb: div(mem[:atom_used], 1_048_576),
      binary_mb: div(mem[:binary], 1_048_576),
      code_mb: div(mem[:code], 1_048_576),
      ets_mb: div(mem[:ets], 1_048_576)
    }
  end

  defp analyze_top_processes(top_n) do
    Process.list()
    |> Enum.map(fn pid ->
      info = Process.info(pid, [:memory, :message_queue_len, :registered_name, :current_function, :reductions])

      case info do
        nil ->
          nil

        info ->
          %{
            pid: inspect(pid),
            memory_kb: div(info[:memory] || 0, 1024),
            message_queue_len: info[:message_queue_len] || 0,
            registered_name: info[:registered_name],
            current_function: format_mfa(info[:current_function]),
            reductions: info[:reductions] || 0
          }
      end
    end)
    |> Enum.reject(&is_nil/1)
    |> Enum.sort_by(& &1.memory_kb, :desc)
    |> Enum.take(top_n)
  end

  defp analyze_ets_tables do
    :ets.all()
    |> Enum.map(fn table ->
      try do
        info = :ets.info(table)

        if info do
          %{
            name: info[:name],
            id: table,
            size: info[:size] || 0,
            memory_kb: div((info[:memory] || 0) * :erlang.system_info(:wordsize), 1024),
            type: info[:type],
            owner: inspect(info[:owner]),
            protection: info[:protection]
          }
        end
      rescue
        _ -> nil
      end
    end)
    |> Enum.reject(&is_nil/1)
    |> Enum.sort_by(& &1.memory_kb, :desc)
    |> Enum.take(20)
  end

  defp analyze_atom_usage do
    atom_count =
      try do
        :erlang.system_info(:atom_count)
      rescue
        _ -> 0
      end

    atom_limit =
      try do
        :erlang.system_info(:atom_limit)
      rescue
        _ -> 1_048_576
      end

    %{
      count: atom_count,
      limit: atom_limit,
      percent: if(atom_limit > 0, do: Float.round(atom_count / atom_limit * 100, 2), else: 0.0)
    }
  end

  defp generate_memory_recommendations(beam_memory, top_processes, ets_tables) do
    recommendations = []

    # Check for high process memory usage
    recommendations =
      if beam_memory.processes_mb > beam_memory.total_mb * 0.7 do
        ["Process memory is >70% of total — inspect top processes for leaks" | recommendations]
      else
        recommendations
      end

    # Check for large message queues
    mailbox_issues =
      Enum.filter(top_processes, &(&1.message_queue_len > 1000))

    recommendations =
      if mailbox_issues != [] do
        names = Enum.map(mailbox_issues, &(&1.registered_name || &1.pid))
        ["Processes with large mailboxes (>1000): #{inspect(names)}" | recommendations]
      else
        recommendations
      end

    # Check for oversized ETS tables
    large_ets = Enum.filter(ets_tables, &(&1.memory_kb > 100_000))

    recommendations =
      if large_ets != [] do
        names = Enum.map(large_ets, & &1.name)
        ["Large ETS tables (>100MB): #{inspect(names)}" | recommendations]
      else
        recommendations
      end

    # Check binary memory
    recommendations =
      if beam_memory.binary_mb > beam_memory.total_mb * 0.3 do
        ["Binary memory is >30% of total — possible binary leak, check for sub-binaries" | recommendations]
      else
        recommendations
      end

    # Check atom usage
    atom_info = analyze_atom_usage()

    recommendations =
      if atom_info.percent > 50 do
        ["Atom table >50% full (#{atom_info.count}/#{atom_info.limit}) — review dynamic atom creation" | recommendations]
      else
        recommendations
      end

    Enum.reverse(recommendations)
  end

  defp format_mfa({m, f, a}), do: "#{inspect(m)}.#{f}/#{a}"
  defp format_mfa(nil), do: "unknown"
  defp format_mfa(other), do: inspect(other)

  # ── Helpers ─────────────────────────────────────────────────

  defp safe_query(query) do
    try do
      case CGraph.Repo.query(query) do
        {:ok, %{rows: rows, columns: cols}} ->
          result =
            Enum.map(rows, fn row ->
              cols |> Enum.zip(row) |> Map.new()
            end)

          {:ok, result}

        {:error, reason} ->
          {:error, reason}
      end
    rescue
      e ->
        {:error, {:query_exception, Exception.message(e)}}
    end
  end

  defp truncate_query(query) when byte_size(query) > 200 do
    String.slice(query, 0, 200) <> "..."
  end

  defp truncate_query(query), do: query

  defp round_float(nil), do: 0.0
  defp round_float(val) when is_float(val), do: Float.round(val, 2)
  defp round_float(val) when is_integer(val), do: val / 1.0
  defp round_float(val), do: val
end
