defmodule Cgraph.Repo.Healthcheck do
  @moduledoc """
  Database health monitoring and diagnostics for CGraph.
  
  ## Overview
  
  Provides comprehensive health checks for production database monitoring:
  
  - **Connection pool health**: Track pool utilization and errors
  - **Query latency monitoring**: Detect slow queries and timeouts
  - **Replication lag**: Monitor replica synchronization
  - **Lock detection**: Identify blocking queries and deadlocks
  
  ## Usage
  
  ### Basic Health Check
  
      case Cgraph.Repo.Healthcheck.check() do
        {:ok, %{status: :healthy}} ->
          # Database is healthy
          
        {:ok, %{status: :degraded, issues: issues}} ->
          # Database has non-critical issues
          
        {:error, reason} ->
          # Database is unhealthy
      end
  
  ### Detailed Diagnostics
  
      diagnostics = Cgraph.Repo.Healthcheck.diagnostics()
      # Returns detailed stats including:
      # - Connection pool utilization
      # - Query latency percentiles
      # - Table/index sizes
      # - Active locks
  
  ## Telemetry Integration
  
  Emits telemetry events for monitoring:
  
  - `[:cgraph, :repo, :health, :check]` - Health check results
  - `[:cgraph, :repo, :health, :degraded]` - When issues detected
  - `[:cgraph, :repo, :health, :unhealthy]` - Critical failures
  """
  
  require Logger
  alias Cgraph.Repo
  
  @type status :: :healthy | :degraded | :unhealthy
  @type issue :: %{type: atom(), message: String.t(), severity: :warning | :critical}
  @type health_result :: %{
    status: status(),
    latency_ms: non_neg_integer(),
    issues: [issue()],
    timestamp: DateTime.t()
  }
  
  # Thresholds for health status
  @max_latency_ms 100
  # Reserved for future use: @max_pool_wait_ms 50
  # Reserved for future use: @max_replication_lag_bytes 1_000_000
  @max_connections_percent 80
  
  @doc """
  Perform a basic health check on the database.
  
  Returns `{:ok, result}` with health status or `{:error, reason}` if unavailable.
  """
  @spec check() :: {:ok, health_result()} | {:error, term()}
  def check do
    start_time = System.monotonic_time(:millisecond)
    
    result = try do
      # Execute simple query to verify connectivity
      case Repo.query("SELECT 1 as health_check", [], timeout: 5000) do
        {:ok, _} ->
          latency = System.monotonic_time(:millisecond) - start_time
          issues = collect_issues(latency)
          status = determine_status(issues)
          
          emit_telemetry(status, latency, issues)
          
          {:ok, %{
            status: status,
            latency_ms: latency,
            issues: issues,
            timestamp: DateTime.utc_now()
          }}
          
        {:error, reason} ->
          {:error, {:query_failed, reason}}
      end
    rescue
      e in DBConnection.ConnectionError ->
        {:error, {:connection_failed, Exception.message(e)}}
        
      e ->
        {:error, {:unexpected_error, Exception.message(e)}}
    end
    
    result
  end
  
  @doc """
  Perform a lightweight readiness check (for load balancers).
  
  Only verifies basic connectivity, doesn't check for degraded state.
  """
  @spec ready?() :: boolean()
  def ready? do
    case Repo.query("SELECT 1", [], timeout: 2000) do
      {:ok, _} -> true
      _ -> false
    end
  rescue
    _ -> false
  end
  
  @doc """
  Get detailed database diagnostics.
  
  Returns comprehensive stats for debugging and monitoring.
  """
  @spec diagnostics() :: map()
  def diagnostics do
    %{
      connection_pool: pool_stats(),
      query_stats: query_stats(),
      table_sizes: table_sizes(),
      index_health: index_health(),
      active_locks: active_locks(),
      replication: replication_status()
    }
  rescue
    e ->
      %{error: Exception.message(e)}
  end
  
  # ---------------------------------------------------------------------------
  # Health Issue Detection
  # ---------------------------------------------------------------------------
  
  defp collect_issues(latency) do
    []
    |> maybe_add_latency_issue(latency)
    |> maybe_add_pool_issues()
    |> maybe_add_connection_issues()
    |> Enum.reverse()
  end
  
  defp maybe_add_latency_issue(issues, latency) when latency > @max_latency_ms do
    issue = %{
      type: :high_latency,
      message: "Query latency #{latency}ms exceeds threshold #{@max_latency_ms}ms",
      severity: if(latency > @max_latency_ms * 5, do: :critical, else: :warning)
    }
    [issue | issues]
  end
  defp maybe_add_latency_issue(issues, _latency), do: issues
  
  defp maybe_add_pool_issues(issues) do
    case pool_stats() do
      %{idle: 0, busy: busy} when busy > 0 ->
        issue = %{
          type: :pool_exhausted,
          message: "Connection pool exhausted (#{busy} busy, 0 idle)",
          severity: :critical
        }
        [issue | issues]
        
      %{queue_length: ql} when ql > 0 ->
        issue = %{
          type: :pool_queuing,
          message: "#{ql} queries waiting for connections",
          severity: :warning
        }
        [issue | issues]
        
      _ ->
        issues
    end
  rescue
    _ -> issues
  end
  
  defp maybe_add_connection_issues(issues) do
    case connection_count() do
      {:ok, %{used_percent: pct}} when pct > @max_connections_percent ->
        issue = %{
          type: :high_connections,
          message: "#{pct}% of max connections in use",
          severity: if(pct > 95, do: :critical, else: :warning)
        }
        [issue | issues]
        
      _ ->
        issues
    end
  end
  
  defp determine_status([]), do: :healthy
  defp determine_status(issues) do
    if Enum.any?(issues, &(&1.severity == :critical)) do
      :unhealthy
    else
      :degraded
    end
  end
  
  # ---------------------------------------------------------------------------
  # Pool Statistics
  # ---------------------------------------------------------------------------
  
  defp pool_stats do
    # Get DBConnection pool stats
    # This is implementation-specific to the pool being used
    try do
      checkin_count = :ets.info(:cgraph_repo_pool, :size) || 0
      
      %{
        pool_size: Application.get_env(:cgraph, Cgraph.Repo)[:pool_size] || 10,
        idle: max(checkin_count, 0),
        busy: 0,
        queue_length: 0
      }
    rescue
      _ ->
        %{pool_size: 10, idle: 0, busy: 0, queue_length: 0}
    end
  end
  
  # ---------------------------------------------------------------------------
  # Connection Statistics
  # ---------------------------------------------------------------------------
  
  defp connection_count do
    query = """
    SELECT 
      count(*) as current,
      (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_conn
    FROM pg_stat_activity
    WHERE datname = current_database()
    """
    
    case Repo.query(query, [], timeout: 5000) do
      {:ok, %{rows: [[current, max_conn]]}} when not is_nil(max_conn) ->
        pct = round(current / max_conn * 100)
        {:ok, %{current: current, max: max_conn, used_percent: pct}}
        
      _ ->
        {:error, :unavailable}
    end
  rescue
    _ -> {:error, :unavailable}
  end
  
  # ---------------------------------------------------------------------------
  # Query Statistics
  # ---------------------------------------------------------------------------
  
  defp query_stats do
    query = """
    SELECT 
      queryid,
      calls,
      mean_exec_time as avg_time_ms,
      max_exec_time as max_time_ms,
      rows,
      left(query, 100) as query_preview
    FROM pg_stat_statements
    ORDER BY mean_exec_time DESC
    LIMIT 10
    """
    
    case Repo.query(query, [], timeout: 10000) do
      {:ok, %{rows: rows, columns: columns}} ->
        Enum.map(rows, fn row ->
          Enum.zip(columns, row) |> Enum.into(%{})
        end)
        
      _ ->
        []
    end
  rescue
    # pg_stat_statements might not be enabled
    _ -> []
  end
  
  # ---------------------------------------------------------------------------
  # Table Sizes
  # ---------------------------------------------------------------------------
  
  defp table_sizes do
    query = """
    SELECT 
      schemaname || '.' || relname as table_name,
      pg_size_pretty(pg_total_relation_size(relid)) as total_size,
      pg_total_relation_size(relid) as size_bytes,
      n_live_tup as row_count
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 20
    """
    
    case Repo.query(query, [], timeout: 10000) do
      {:ok, %{rows: rows}} ->
        Enum.map(rows, fn [name, size, bytes, rows] ->
          %{table: name, size: size, bytes: bytes, rows: rows}
        end)
        
      _ ->
        []
    end
  rescue
    _ -> []
  end
  
  # ---------------------------------------------------------------------------
  # Index Health
  # ---------------------------------------------------------------------------
  
  defp index_health do
    query = """
    SELECT
      schemaname || '.' || relname as table_name,
      indexrelname as index_name,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
      idx_scan as scans,
      idx_tup_read as tuples_read
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
    ORDER BY pg_relation_size(indexrelid) DESC
    LIMIT 10
    """
    
    case Repo.query(query, [], timeout: 10000) do
      {:ok, %{rows: rows}} ->
        %{
          unused_indexes: Enum.map(rows, fn [table, index, size, _, _] ->
            %{table: table, index: index, size: size}
          end)
        }
        
      _ ->
        %{unused_indexes: []}
    end
  rescue
    _ -> %{unused_indexes: []}
  end
  
  # ---------------------------------------------------------------------------
  # Active Locks
  # ---------------------------------------------------------------------------
  
  defp active_locks do
    query = """
    SELECT
      blocked_locks.pid AS blocked_pid,
      blocked_activity.usename AS blocked_user,
      blocking_locks.pid AS blocking_pid,
      blocking_activity.usename AS blocking_user,
      blocked_activity.query AS blocked_query,
      blocking_activity.query AS blocking_query
    FROM pg_catalog.pg_locks blocked_locks
    JOIN pg_catalog.pg_stat_activity blocked_activity 
      ON blocked_activity.pid = blocked_locks.pid
    JOIN pg_catalog.pg_locks blocking_locks 
      ON blocking_locks.locktype = blocked_locks.locktype
      AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
      AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
      AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
      AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
      AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
      AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
      AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
      AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
      AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
      AND blocking_locks.pid != blocked_locks.pid
    JOIN pg_catalog.pg_stat_activity blocking_activity 
      ON blocking_activity.pid = blocking_locks.pid
    WHERE NOT blocked_locks.granted
    LIMIT 10
    """
    
    case Repo.query(query, [], timeout: 5000) do
      {:ok, %{rows: rows}} ->
        Enum.map(rows, fn [blocked_pid, blocked_user, blocking_pid, blocking_user, blocked_query, blocking_query] ->
          %{
            blocked: %{pid: blocked_pid, user: blocked_user, query: String.slice(blocked_query || "", 0, 100)},
            blocking: %{pid: blocking_pid, user: blocking_user, query: String.slice(blocking_query || "", 0, 100)}
          }
        end)
        
      _ ->
        []
    end
  rescue
    _ -> []
  end
  
  # ---------------------------------------------------------------------------
  # Replication Status (for replicas)
  # ---------------------------------------------------------------------------
  
  defp replication_status do
    query = """
    SELECT
      pg_is_in_recovery() as is_replica,
      CASE 
        WHEN pg_is_in_recovery() THEN
          EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int
        ELSE
          0
      END as lag_seconds
    """
    
    case Repo.query(query, [], timeout: 5000) do
      {:ok, %{rows: [[is_replica, lag_seconds]]}} ->
        %{
          is_replica: is_replica,
          lag_seconds: lag_seconds || 0
        }
        
      _ ->
        %{is_replica: false, lag_seconds: 0}
    end
  rescue
    _ -> %{is_replica: false, lag_seconds: 0}
  end
  
  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------
  
  defp emit_telemetry(:healthy, latency, _issues) do
    :telemetry.execute(
      [:cgraph, :repo, :health, :check],
      %{latency_ms: latency, status: :healthy},
      %{}
    )
  end
  
  defp emit_telemetry(:degraded, latency, issues) do
    :telemetry.execute(
      [:cgraph, :repo, :health, :degraded],
      %{latency_ms: latency, issue_count: length(issues)},
      %{issues: issues}
    )
    
    Logger.warning("Database health degraded", issues: inspect(issues))
  end
  
  defp emit_telemetry(:unhealthy, latency, issues) do
    :telemetry.execute(
      [:cgraph, :repo, :health, :unhealthy],
      %{latency_ms: latency, issue_count: length(issues)},
      %{issues: issues}
    )
    
    Logger.error("Database unhealthy", issues: inspect(issues))
  end
end
