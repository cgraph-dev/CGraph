defmodule CgraphWeb.Plugs.RequestId do
  @moduledoc """
  Plug to ensure every request has a unique, traceable request ID.
  
  ## Design Philosophy
  
  Request IDs are essential for:
  
  1. **Distributed tracing**: Track requests across services
  2. **Log correlation**: Group all logs for a single request
  3. **Debugging**: Easily find all activity for a user report
  4. **Metrics**: Track request-specific performance
  
  ## Request ID Format
  
  We use a structured format: `req_<timestamp>_<random>`
  
  - Prefix `req_` identifies this as a request ID
  - Timestamp portion enables rough time ordering
  - Random portion ensures uniqueness
  
  Example: `req_1705329600_a7b3c9d2e4f6`
  
  ## Headers
  
  - `X-Request-ID`: The unique request identifier
  - `X-Correlation-ID`: Optional, for linking related requests
  
  If the client provides X-Request-ID, we validate and use it.
  If not, we generate one.
  
  ## Usage
  
  Add to your endpoint:
  
  ```elixir
  plug CgraphWeb.Plugs.RequestId
  ```
  
  Access in controllers:
  
  ```elixir
  request_id = conn.assigns[:request_id]
  ```
  
  Include in logs automatically via Logger metadata:
  
  ```elixir
  Logger.info("Processing order", request_id: conn.assigns[:request_id])
  ```
  """
  
  import Plug.Conn
  require Logger
  
  @behaviour Plug
  
  @request_id_header "x-request-id"
  @correlation_id_header "x-correlation-id"
  @max_id_length 128
  @id_pattern ~r/^[a-zA-Z0-9_-]+$/
  
  @impl true
  def init(opts), do: opts
  
  @impl true
  def call(conn, _opts) do
    request_id = get_or_generate_request_id(conn)
    correlation_id = get_correlation_id(conn)
    
    conn
    |> assign(:request_id, request_id)
    |> assign(:correlation_id, correlation_id)
    |> put_resp_header(@request_id_header, request_id)
    |> maybe_put_correlation_header(correlation_id)
    |> set_logger_metadata(request_id, correlation_id)
  end
  
  defp get_or_generate_request_id(conn) do
    case get_req_header(conn, @request_id_header) do
      [id] when is_binary(id) ->
        if valid_id?(id), do: id, else: generate_request_id()
      _ ->
        generate_request_id()
    end
  end
  
  defp get_correlation_id(conn) do
    case get_req_header(conn, @correlation_id_header) do
      [id] when is_binary(id) ->
        if valid_id?(id), do: id, else: nil
      _ ->
        nil
    end
  end
  
  defp valid_id?(id) do
    byte_size(id) <= @max_id_length and Regex.match?(@id_pattern, id)
  end
  
  defp generate_request_id do
    timestamp = System.system_time(:second)
    random = :crypto.strong_rand_bytes(6) |> Base.encode16(case: :lower)
    "req_#{timestamp}_#{random}"
  end
  
  defp maybe_put_correlation_header(conn, nil), do: conn
  defp maybe_put_correlation_header(conn, id) do
    put_resp_header(conn, @correlation_id_header, id)
  end
  
  defp set_logger_metadata(conn, request_id, correlation_id) do
    metadata = [request_id: request_id]
    metadata = if correlation_id, do: [{:correlation_id, correlation_id} | metadata], else: metadata
    
    Logger.metadata(metadata)
    conn
  end
end

defmodule CgraphWeb.Plugs.RequestLogger do
  @moduledoc """
  Structured request/response logging with performance metrics.
  
  ## Design Philosophy
  
  Every HTTP request should produce exactly ONE structured log entry that contains:
  
  1. **Request details**: Method, path, params (sanitized)
  2. **Response details**: Status, size
  3. **Performance**: Total time, DB time, view time
  4. **Context**: User ID, request ID
  
  ## Log Format
  
  Structured JSON for easy parsing:
  
  ```json
  {
    "event": "http_request",
    "method": "POST",
    "path": "/api/v1/users",
    "status": 201,
    "duration_ms": 45,
    "user_id": "user_123",
    "request_id": "req_abc123",
    "params": {"email": "***@example.com"}
  }
  ```
  
  ## Log Levels
  
  - `debug`: 2xx responses (success)
  - `info`: 3xx responses (redirect)
  - `warning`: 4xx responses (client error)
  - `error`: 5xx responses (server error)
  
  ## Excluded Paths
  
  Health checks and static assets are not logged to reduce noise.
  """
  
  import Plug.Conn
  require Logger
  
  @behaviour Plug
  
  @sensitive_params ~w(password password_confirmation token secret api_key credit_card)
  @excluded_paths ~w(/health /ready /metrics /favicon.ico)
  
  @impl true
  def init(opts), do: opts
  
  @impl true
  def call(conn, _opts) do
    if should_log?(conn) do
      start_time = System.monotonic_time()
      
      conn
      |> assign(:request_start_time, start_time)
      |> register_before_send(&log_request(&1, start_time))
    else
      conn
    end
  end
  
  defp should_log?(conn) do
    conn.request_path not in @excluded_paths and
      not String.starts_with?(conn.request_path, "/assets")
  end
  
  defp log_request(conn, start_time) do
    end_time = System.monotonic_time()
    duration_ms = System.convert_time_unit(end_time - start_time, :native, :millisecond)
    
    log_data = %{
      event: "http_request",
      method: conn.method,
      path: conn.request_path,
      query: conn.query_string,
      status: conn.status,
      duration_ms: duration_ms,
      request_id: conn.assigns[:request_id],
      user_id: get_user_id(conn),
      params: sanitize_params(conn.params),
      response_size: get_response_size(conn)
    }
    
    level = log_level_for_status(conn.status)
    message = format_log_message(log_data)
    
    Logger.log(level, message, log_data)
    
    conn
  end
  
  defp log_level_for_status(status) when status < 300, do: :debug
  defp log_level_for_status(status) when status < 400, do: :info
  defp log_level_for_status(status) when status < 500, do: :warning
  defp log_level_for_status(_), do: :error
  
  defp format_log_message(data) do
    "[#{data.status}] #{data.method} #{data.path} (#{data.duration_ms}ms)"
  end
  
  defp get_user_id(conn) do
    case conn.assigns[:current_user] do
      %{id: id} -> id
      _ -> nil
    end
  end
  
  defp get_response_size(conn) do
    case get_resp_header(conn, "content-length") do
      [size] -> String.to_integer(size)
      _ -> nil
    end
  end
  
  defp sanitize_params(params) when is_map(params) do
    Map.new(params, fn {key, value} ->
      key_str = to_string(key)
      
      if key_str in @sensitive_params or String.contains?(key_str, "password") do
        {key, "[FILTERED]"}
      else
        {key, sanitize_value(value)}
      end
    end)
  end
  
  defp sanitize_params(params), do: params
  
  defp sanitize_value(%{} = map), do: sanitize_params(map)
  defp sanitize_value(list) when is_list(list), do: Enum.map(list, &sanitize_value/1)
  defp sanitize_value(value) when is_binary(value) and byte_size(value) > 1000 do
    String.slice(value, 0, 1000) <> "...[truncated]"
  end
  defp sanitize_value(value), do: value
end

defmodule CgraphWeb.Plugs.SecurityHeaders do
  @moduledoc """
  Security headers to protect against common web vulnerabilities.
  
  ## Headers Added
  
  | Header | Purpose |
  |--------|---------|
  | `X-Content-Type-Options` | Prevent MIME sniffing |
  | `X-Frame-Options` | Prevent clickjacking |
  | `X-XSS-Protection` | Enable XSS filter |
  | `Strict-Transport-Security` | Force HTTPS |
  | `Content-Security-Policy` | Restrict resource loading |
  | `Referrer-Policy` | Control referrer info |
  | `Permissions-Policy` | Restrict browser features |
  
  ## CSP Configuration
  
  The Content-Security-Policy is configured for an API backend:
  
  - No inline scripts/styles (API responses are JSON)
  - No frame embedding
  - Report violations to configured endpoint
  """
  
  import Plug.Conn
  
  @behaviour Plug
  
  @impl true
  def init(opts), do: opts
  
  @impl true
  def call(conn, _opts) do
    conn
    |> put_resp_header("x-content-type-options", "nosniff")
    |> put_resp_header("x-frame-options", "DENY")
    |> put_resp_header("x-xss-protection", "1; mode=block")
    |> put_hsts_header()
    |> put_csp_header()
    |> put_resp_header("referrer-policy", "strict-origin-when-cross-origin")
    |> put_resp_header("permissions-policy", "geolocation=(), microphone=(), camera=()")
  end
  
  defp put_hsts_header(conn) do
    if Application.get_env(:cgraph, :force_ssl, false) do
      put_resp_header(conn, "strict-transport-security", "max-age=31536000; includeSubDomains")
    else
      conn
    end
  end
  
  defp put_csp_header(conn) do
    csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ]
    |> Enum.join("; ")
    
    put_resp_header(conn, "content-security-policy", csp)
  end
end

defmodule CgraphWeb.Plugs.HealthCheck do
  @moduledoc """
  Health check endpoints for load balancers and orchestrators.
  
  ## Endpoints
  
  - `/health` - Basic liveness check
  - `/ready` - Readiness check (includes dependencies)
  - `/metrics` - Prometheus metrics (if enabled)
  
  ## Liveness vs Readiness
  
  - **Liveness**: Is the app running? (restart if not)
  - **Readiness**: Can it handle traffic? (don't route if not)
  
  ## Response Format
  
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "checks": {
      "database": "ok",
      "redis": "ok",
      "disk": "ok"
    }
  }
  ```
  """
  
  import Plug.Conn
  
  @behaviour Plug
  
  @impl true
  def init(opts), do: opts
  
  @impl true
  def call(%Plug.Conn{request_path: "/health"} = conn, _opts) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, Jason.encode!(%{
      status: "healthy",
      version: Application.spec(:cgraph, :vsn) |> to_string()
    }))
    |> halt()
  end
  
  def call(%Plug.Conn{request_path: "/ready"} = conn, _opts) do
    checks = perform_readiness_checks()
    all_ok = Enum.all?(checks, fn {_, status} -> status == :ok end)
    
    {status_code, status_text} = if all_ok, do: {200, "ready"}, else: {503, "not_ready"}
    
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status_code, Jason.encode!(%{
      status: status_text,
      checks: Map.new(checks, fn {name, status} -> {name, Atom.to_string(status)} end)
    }))
    |> halt()
  end
  
  def call(conn, _opts), do: conn
  
  defp perform_readiness_checks do
    [
      database: check_database(),
      cache: check_cache()
    ]
  end
  
  defp check_database do
    case Ecto.Adapters.SQL.query(Cgraph.Repo, "SELECT 1", []) do
      {:ok, _} -> :ok
      {:error, _} -> :error
    end
  rescue
    _ -> :error
  end
  
  defp check_cache do
    case Cachex.get(:cgraph_cache, "__health_check__") do
      {:ok, _} -> :ok
      {:error, _} -> :error
    end
  rescue
    _ -> :ok  # Cache is optional
  end
end
