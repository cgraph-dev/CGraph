defmodule CgraphWeb.Plugs.TracingPlug do
  @moduledoc """
  Plug for automatic distributed tracing of HTTP requests.
  
  ## Overview
  
  Automatically creates trace spans for incoming HTTP requests,
  propagating W3C Trace Context headers for distributed tracing.
  
  ## Features
  
  - Extracts `traceparent` and `tracestate` headers
  - Creates root span for each request
  - Adds request attributes (method, path, status)
  - Propagates context to downstream services
  - Records errors and exceptions
  
  ## Usage
  
  Add to your router pipeline:
  
      pipeline :api do
        plug CgraphWeb.Plugs.TracingPlug
      end
  
  ## Span Attributes
  
  The following attributes are automatically added:
  
  | Attribute | Description |
  |-----------|-------------|
  | `http.method` | HTTP method (GET, POST, etc.) |
  | `http.url` | Full request URL |
  | `http.route` | Route pattern |
  | `http.status_code` | Response status |
  | `http.user_agent` | User-Agent header |
  | `http.client_ip` | Client IP address |
  | `user.id` | Authenticated user ID |
  
  ## Configuration
  
      config :cgraph, CgraphWeb.Plugs.TracingPlug,
        # Header names
        traceparent_header: "traceparent",
        tracestate_header: "tracestate",
        
        # Sampling
        sample_rate: 1.0,
        
        # Paths to exclude
        exclude_paths: ["/health", "/metrics"],
        
        # Custom span name function
        span_name_fn: &custom_span_name/1
  """
  
  @behaviour Plug
  
  import Plug.Conn
  require Logger
  
  alias Cgraph.Tracing
  
  @default_config %{
    traceparent_header: "traceparent",
    tracestate_header: "tracestate",
    sample_rate: 1.0,
    exclude_paths: ["/health", "/metrics", "/api/v1/health"],
    include_request_body: false,
    max_path_params: 10
  }
  
  # ---------------------------------------------------------------------------
  # Plug Callbacks
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(opts) do
    config = Map.merge(@default_config, Map.new(opts))
    config
  end
  
  @impl true
  def call(conn, config) do
    if excluded_path?(conn.request_path, config.exclude_paths) do
      conn
    else
      trace_request(conn, config)
    end
  end
  
  # ---------------------------------------------------------------------------
  # Tracing Logic
  # ---------------------------------------------------------------------------
  
  defp trace_request(conn, config) do
    # Extract or create trace context
    ctx = extract_or_create_context(conn, config)
    
    # Add request attributes
    ctx = add_request_attributes(ctx, conn)
    
    # Store context in conn for downstream access
    conn = assign(conn, :trace_context, ctx)
    
    # Add response headers with trace info
    conn = put_resp_header(conn, "x-trace-id", ctx.trace_id)
    
    # Register callback to finish span on response
    register_before_send(conn, fn conn ->
      finish_request_span(conn, ctx)
    end)
  end
  
  defp extract_or_create_context(conn, config) do
    traceparent = get_header(conn, config.traceparent_header)
    span_name = build_span_name(conn)
    
    attributes = %{
      "http.scheme" => to_string(conn.scheme),
      "http.host" => conn.host,
      "http.target" => conn.request_path
    }
    
    case traceparent do
      nil ->
        # No incoming trace - start new one
        if Tracing.should_sample?(rate: config.sample_rate) do
          {:ok, ctx} = Tracing.start_trace(span_name, 
            sampled: true, 
            attributes: attributes
          )
          ctx
        else
          {:ok, ctx} = Tracing.start_trace(span_name, 
            sampled: false, 
            attributes: attributes
          )
          ctx
        end
        
      header ->
        # Continue existing trace
        {:ok, ctx} = Tracing.continue_trace(span_name, header, 
          attributes: attributes
        )
        ctx
    end
  end
  
  defp add_request_attributes(ctx, conn) do
    attributes = %{
      "http.method" => conn.method,
      "http.url" => build_url(conn),
      "http.user_agent" => get_header(conn, "user-agent") || "unknown",
      "http.client_ip" => format_ip(conn.remote_ip),
      "http.request_content_length" => get_header(conn, "content-length")
    }
    
    # Add authenticated user if available
    attributes = case conn.assigns do
      %{current_user: %{id: user_id}} ->
        Map.put(attributes, "user.id", user_id)
      _ ->
        attributes
    end
    
    Tracing.add_attributes(ctx, attributes)
  end
  
  defp finish_request_span(conn, ctx) do
    # Add response attributes
    ctx = Tracing.add_attributes(ctx, %{
      "http.status_code" => conn.status,
      "http.response_content_length" => get_header(conn, "content-length")
    })
    
    # Determine status
    status = if conn.status >= 400, do: :error, else: :ok
    
    # End the span
    Tracing.end_span(ctx, ctx.span_id, status)
    
    # Clean up context
    Tracing.clear_context()
    
    conn
  end
  
  # ---------------------------------------------------------------------------
  # Helper Functions
  # ---------------------------------------------------------------------------
  
  defp excluded_path?(path, exclude_paths) do
    Enum.any?(exclude_paths, fn excluded ->
      String.starts_with?(path, excluded)
    end)
  end
  
  defp build_span_name(conn) do
    method = conn.method
    
    # Use route pattern if available, otherwise path
    path = case conn.private do
      %{phoenix_router: _router, plug_route: {route, _}} -> 
        route
      _ -> 
        normalize_path(conn.request_path)
    end
    
    "#{method} #{path}"
  end
  
  defp normalize_path(path) do
    # Replace UUIDs and numeric IDs with placeholders
    path
    |> String.replace(~r/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, ":id")
    |> String.replace(~r/\/\d+/, "/:id")
  end
  
  defp build_url(conn) do
    query = if conn.query_string != "", do: "?#{conn.query_string}", else: ""
    "#{conn.scheme}://#{conn.host}#{conn.request_path}#{query}"
  end
  
  defp get_header(conn, header) do
    case get_req_header(conn, header) do
      [value | _] -> value
      _ -> nil
    end
  end
  
  defp format_ip(ip) when is_tuple(ip) do
    ip
    |> Tuple.to_list()
    |> Enum.join(".")
  end
  defp format_ip(ip), do: to_string(ip)
end
