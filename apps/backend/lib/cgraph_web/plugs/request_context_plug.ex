defmodule CgraphWeb.Plugs.RequestContext do
  @moduledoc """
  CgraphWeb.Plugs.RequestContext - Request Context Initialization Plug
  
  ## Overview
  
  This plug initializes the request context at the beginning of each request,
  extracting trace context, request IDs, and tenant information from headers.
  It integrates with `Cgraph.RequestContext` for context propagation.
  
  ## Features
  
  - Extracts or generates request ID
  - Parses W3C Trace Context headers
  - Initializes tenant context for multi-tenancy
  - Sets up Logger metadata for request correlation
  - Cleans up context after request completion
  
  ## Usage
  
      # In your router
      pipeline :api do
        plug CgraphWeb.Plugs.RequestContext
      end
  
  ## Options
  
  - `:generate_request_id` - Generate request ID if not provided (default: true)
  - `:log_request` - Log request details (default: true)
  - `:timing` - Track request timing (default: true)
  
  ## Request Headers
  
  The plug extracts context from these headers:
  
  - `x-request-id`: Request identifier
  - `x-correlation-id`: Correlation ID for distributed tracing
  - `x-tenant-id`: Tenant identifier for multi-tenancy
  - `traceparent`: W3C Trace Context parent
  - `tracestate`: W3C Trace Context state
  
  ## Response Headers
  
  The plug adds these headers to responses:
  
  - `x-request-id`: Echo back the request ID
  - `x-response-time`: Request processing time in milliseconds
  - `traceparent`: W3C Trace Context for distributed tracing
  """
  
  @behaviour Plug
  
  import Plug.Conn
  require Logger
  
  alias Cgraph.RequestContext
  
  # ---------------------------------------------------------------------------
  # Plug Callbacks
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(opts) do
    %{
      generate_request_id: Keyword.get(opts, :generate_request_id, true),
      log_request: Keyword.get(opts, :log_request, true),
      timing: Keyword.get(opts, :timing, true)
    }
  end
  
  @impl true
  def call(conn, opts) do
    start_time = if opts.timing, do: System.monotonic_time(:microsecond)
    
    # Initialize request context
    {context, conn} = RequestContext.init_from_conn(conn)
    
    # Store start time in conn
    conn = if start_time do
      put_private(conn, :request_start_time, start_time)
    else
      conn
    end
    
    # Log request start
    if opts.log_request do
      log_request_start(conn, context)
    end
    
    # Register callback to clean up and log completion
    register_before_send(conn, fn conn ->
      conn = if opts.timing do
        add_timing_header(conn, start_time)
      else
        conn
      end
      
      if opts.log_request do
        log_request_complete(conn, context)
      end
      
      # Cleanup context after response is sent
      # Note: This runs in the same process, so we can clean up here
      spawn(fn -> RequestContext.cleanup() end)
      
      conn
    end)
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------
  
  defp add_timing_header(conn, start_time) when is_integer(start_time) do
    end_time = System.monotonic_time(:microsecond)
    duration_ms = (end_time - start_time) / 1000
    
    formatted = Float.round(duration_ms, 2) |> to_string()
    put_resp_header(conn, "x-response-time", "#{formatted}ms")
  end
  defp add_timing_header(conn, _), do: conn
  
  defp log_request_start(conn, context) do
    Logger.info(
      "[Request] #{conn.method} #{conn.request_path}",
      request_id: context.request_id,
      trace_id: context.trace_id,
      tenant_id: context.tenant_id,
      user_agent: get_user_agent(conn),
      remote_ip: format_ip(conn.remote_ip)
    )
  end
  
  defp log_request_complete(conn, context) do
    duration_ms = RequestContext.get_duration_ms() || 0
    
    level = cond do
      conn.status >= 500 -> :error
      conn.status >= 400 -> :warning
      true -> :info
    end
    
    Logger.log(
      level,
      "[Response] #{conn.method} #{conn.request_path} - #{conn.status} (#{Float.round(duration_ms, 2)}ms)",
      request_id: context.request_id,
      status: conn.status,
      duration_ms: duration_ms
    )
  end
  
  defp get_user_agent(conn) do
    case get_req_header(conn, "user-agent") do
      [ua | _] -> String.slice(ua, 0, 100)
      [] -> nil
    end
  end
  
  defp format_ip({a, b, c, d}), do: "#{a}.#{b}.#{c}.#{d}"
  defp format_ip({a, b, c, d, e, f, g, h}), do: "#{a}:#{b}:#{c}:#{d}:#{e}:#{f}:#{g}:#{h}"
  defp format_ip(_), do: "unknown"
end
