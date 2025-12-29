defmodule Cgraph.Telemetry do
  @moduledoc """
  Telemetry event handlers and metrics for CGraph.
  
  ## Overview
  
  This module sets up comprehensive observability for the CGraph application,
  including:
  
  - **Request metrics**: Latency, throughput, error rates
  - **Database metrics**: Query timing, connection pool stats
  - **Cache metrics**: Hit/miss rates, eviction counts
  - **Business metrics**: Messages sent, users online, etc.
  
  ## Architecture
  
  CGraph uses the Erlang `:telemetry` library as the foundation, which provides:
  
  1. **Low overhead**: ~100ns per event emission
  2. **Decoupled design**: Emitters don't know about handlers
  3. **Hot-swappable**: Handlers can be added/removed at runtime
  
  ## Event Naming Convention
  
  Events follow the pattern: `[:cgraph, :domain, :action]`
  
  Examples:
  - `[:cgraph, :repo, :query]` - Database queries
  - `[:cgraph, :http, :request, :stop]` - HTTP request completion
  - `[:cgraph, :messaging, :message, :sent]` - Message sent
  
  ## Metrics Export
  
  Metrics are exported to:
  - StatsD/DataDog (production)
  - Prometheus (via `telemetry_metrics_prometheus`)
  - Console (development)
  
  ## Usage
  
  Attach handlers in application startup:
  
      Cgraph.Telemetry.attach_handlers()
  
  Emit custom events:
  
      :telemetry.execute(
        [:cgraph, :messaging, :message, :sent],
        %{latency_ms: 45},
        %{channel_id: channel_id, user_id: user_id}
      )
  """
  
  require Logger
  
  @doc """
  Attach all telemetry handlers.
  
  Called during application startup in `Cgraph.Application.start/2`.
  """
  def attach_handlers do
    handlers = [
      # HTTP Request Metrics
      {[:phoenix, :endpoint, :stop], &__MODULE__.handle_request_stop/4},
      {[:phoenix, :router_dispatch, :stop], &__MODULE__.handle_router_dispatch/4},
      {[:phoenix, :router_dispatch, :exception], &__MODULE__.handle_router_exception/4},
      
      # Database Metrics
      {[:cgraph, :repo, :query], &__MODULE__.handle_repo_query/4},
      
      # Cache Metrics
      {[:cachex, :get], &__MODULE__.handle_cache_get/4},
      {[:cachex, :put], &__MODULE__.handle_cache_put/4},
      
      # Rate Limiter Metrics
      {[:cgraph, :rate_limiter, :check], &__MODULE__.handle_rate_limit_check/4},
      {[:cgraph, :rate_limiter, :exceeded], &__MODULE__.handle_rate_limit_exceeded/4},
      
      # Business Metrics
      {[:cgraph, :messaging, :message, :sent], &__MODULE__.handle_message_sent/4},
      {[:cgraph, :auth, :login, :success], &__MODULE__.handle_login_success/4},
      {[:cgraph, :auth, :login, :failure], &__MODULE__.handle_login_failure/4}
    ]
    
    Enum.each(handlers, fn {event, handler} ->
      handler_id = handler_id_for_event(event)
      :telemetry.attach(handler_id, event, handler, %{})
    end)
    
    Logger.info("Telemetry handlers attached", count: length(handlers))
  end
  
  @doc """
  Detach all telemetry handlers.
  
  Useful for testing or graceful shutdown.
  """
  def detach_handlers do
    [
      [:phoenix, :endpoint, :stop],
      [:phoenix, :router_dispatch, :stop],
      [:phoenix, :router_dispatch, :exception],
      [:cgraph, :repo, :query],
      [:cachex, :get],
      [:cachex, :put],
      [:cgraph, :rate_limiter, :check],
      [:cgraph, :rate_limiter, :exceeded],
      [:cgraph, :messaging, :message, :sent],
      [:cgraph, :auth, :login, :success],
      [:cgraph, :auth, :login, :failure]
    ]
    |> Enum.each(fn event ->
      handler_id = handler_id_for_event(event)
      :telemetry.detach(handler_id)
    end)
  end
  
  defp handler_id_for_event(event) do
    "cgraph_telemetry_#{Enum.join(event, "_")}"
  end

  # ---------------------------------------------------------------------------
  # HTTP Request Handlers
  # ---------------------------------------------------------------------------
  
  @doc """
  Handle HTTP request completion.
  
  Logs request with structured metadata for aggregation:
  - Method, path, status code
  - Duration in milliseconds
  - User ID if authenticated
  """
  def handle_request_stop(_event, measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(
      measurements[:duration],
      :native,
      :millisecond
    )
    
    status = get_in(metadata, [:conn, :status]) || 0
    method = get_in(metadata, [:conn, :method]) || "UNKNOWN"
    path = get_in(metadata, [:conn, :request_path]) || "/"
    
    # Categorize status code
    status_category = categorize_status(status)
    
    # Log with structured data
    Logger.info(
      "HTTP Request",
      method: method,
      path: sanitize_path(path),
      status: status,
      duration_ms: duration_ms,
      status_category: status_category
    )
    
    # Increment counters (would go to StatsD/Prometheus in production)
    increment_counter("http.requests.total", %{
      method: method,
      status_category: status_category
    })
    
    record_histogram("http.request.duration_ms", duration_ms, %{
      method: method,
      path_template: extract_path_template(metadata)
    })
  end
  
  @doc """
  Handle router dispatch completion for more granular controller metrics.
  """
  def handle_router_dispatch(_event, measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(
      measurements[:duration],
      :native,
      :millisecond
    )
    
    controller = metadata[:plug] |> to_string() |> String.replace("Elixir.", "")
    action = metadata[:plug_opts]
    
    record_histogram("controller.action.duration_ms", duration_ms, %{
      controller: controller,
      action: action
    })
  end
  
  @doc """
  Handle router exceptions for error tracking.
  """
  def handle_router_exception(_event, measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(
      measurements[:duration],
      :native,
      :millisecond
    )
    
    kind = metadata[:kind]
    reason = metadata[:reason]
    stacktrace = metadata[:stacktrace]
    
    Logger.error(
      "Request exception",
      kind: kind,
      error: inspect(reason),
      duration_ms: duration_ms,
      stacktrace: Exception.format_stacktrace(stacktrace)
    )
    
    increment_counter("http.requests.exceptions", %{
      kind: kind,
      error_type: error_type(reason)
    })
  end

  # ---------------------------------------------------------------------------
  # Database Handlers
  # ---------------------------------------------------------------------------
  
  @doc """
  Handle database query telemetry.
  
  Logs slow queries and tracks query patterns for optimization.
  Slow query threshold: 100ms (configurable)
  """
  def handle_repo_query(_event, measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(
      measurements[:total_time] || 0,
      :native,
      :millisecond
    )
    
    query = metadata[:query] || ""
    source = metadata[:source] || "unknown"
    
    # Log slow queries
    slow_query_threshold = Application.get_env(:cgraph, :slow_query_threshold_ms, 100)
    
    if duration_ms > slow_query_threshold do
      Logger.warning(
        "Slow query detected",
        duration_ms: duration_ms,
        source: source,
        query: truncate_query(query)
      )
    end
    
    # Track query metrics
    record_histogram("db.query.duration_ms", duration_ms, %{
      source: source,
      operation: extract_query_operation(query)
    })
  end

  # ---------------------------------------------------------------------------
  # Cache Handlers
  # ---------------------------------------------------------------------------
  
  @doc """
  Handle cache get operations to track hit/miss rates.
  """
  def handle_cache_get(_event, _measurements, metadata, _config) do
    result = if metadata[:result], do: :hit, else: :miss
    cache_name = metadata[:cache] || :unknown
    
    increment_counter("cache.operations", %{
      cache: cache_name,
      operation: :get,
      result: result
    })
  end
  
  @doc """
  Handle cache put operations.
  """
  def handle_cache_put(_event, _measurements, metadata, _config) do
    cache_name = metadata[:cache] || :unknown
    
    increment_counter("cache.operations", %{
      cache: cache_name,
      operation: :put
    })
  end

  # ---------------------------------------------------------------------------
  # Rate Limiter Handlers
  # ---------------------------------------------------------------------------
  
  @doc """
  Handle rate limit check events.
  """
  def handle_rate_limit_check(_event, measurements, metadata, _config) do
    record_histogram("rate_limiter.remaining", measurements[:remaining], %{
      tier: metadata[:tier],
      path: sanitize_path(metadata[:path])
    })
  end
  
  @doc """
  Handle rate limit exceeded events.
  """
  def handle_rate_limit_exceeded(_event, measurements, metadata, _config) do
    Logger.info(
      "Rate limit exceeded",
      tier: metadata[:tier],
      path: metadata[:path],
      retry_after_ms: measurements[:retry_after_ms]
    )
    
    increment_counter("rate_limiter.exceeded", %{
      tier: metadata[:tier]
    })
  end

  # ---------------------------------------------------------------------------
  # Business Metric Handlers
  # ---------------------------------------------------------------------------
  
  @doc """
  Handle message sent events for business metrics.
  """
  def handle_message_sent(_event, measurements, metadata, _config) do
    increment_counter("messaging.messages.sent", %{
      type: metadata[:type] || :dm
    })
    
    record_histogram("messaging.send.latency_ms", measurements[:latency_ms], %{
      type: metadata[:type] || :dm
    })
  end
  
  @doc """
  Handle successful login events.
  """
  def handle_login_success(_event, _measurements, metadata, _config) do
    increment_counter("auth.login.success", %{
      method: metadata[:method] || :password
    })
  end
  
  @doc """
  Handle failed login events.
  """
  def handle_login_failure(_event, _measurements, metadata, _config) do
    increment_counter("auth.login.failure", %{
      reason: metadata[:reason] || :unknown
    })
  end

  # ---------------------------------------------------------------------------
  # Helper Functions
  # ---------------------------------------------------------------------------
  
  defp categorize_status(status) when status >= 200 and status < 300, do: "2xx"
  defp categorize_status(status) when status >= 300 and status < 400, do: "3xx"
  defp categorize_status(status) when status >= 400 and status < 500, do: "4xx"
  defp categorize_status(status) when status >= 500, do: "5xx"
  defp categorize_status(_), do: "unknown"
  
  defp sanitize_path(path) when is_binary(path) do
    # Remove UUIDs and numeric IDs for aggregation
    path
    |> String.replace(~r/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, ":id")
    |> String.replace(~r/\/\d+/, "/:id")
  end
  defp sanitize_path(_), do: "/"
  
  defp extract_path_template(metadata) do
    case metadata[:route] do
      nil -> "unknown"
      route -> route
    end
  end
  
  defp error_type(%{__struct__: struct}), do: struct |> to_string() |> String.replace("Elixir.", "")
  defp error_type(_), do: "unknown"
  
  defp truncate_query(query) when byte_size(query) > 500 do
    String.slice(query, 0, 500) <> "..."
  end
  defp truncate_query(query), do: query
  
  defp extract_query_operation(query) do
    query
    |> String.trim()
    |> String.upcase()
    |> String.split(" ")
    |> List.first()
    |> case do
      op when op in ~w(SELECT INSERT UPDATE DELETE) -> String.downcase(op)
      _ -> "other"
    end
  end
  
  # Placeholder functions for metrics backends
  # In production, these would send to StatsD, Prometheus, etc.
  
  defp increment_counter(name, tags) do
    # In production: :statsd.increment(name, 1, tags: tags)
    if Application.get_env(:cgraph, :telemetry_debug, false) do
      Logger.debug("COUNTER: #{name}", tags: tags)
    end
  end
  
  defp record_histogram(name, value, tags) do
    # In production: :statsd.histogram(name, value, tags: tags)
    if Application.get_env(:cgraph, :telemetry_debug, false) do
      Logger.debug("HISTOGRAM: #{name}=#{value}", tags: tags)
    end
  end
end
