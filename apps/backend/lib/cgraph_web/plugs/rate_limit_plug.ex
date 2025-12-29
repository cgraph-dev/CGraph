defmodule CgraphWeb.Plugs.RateLimitPlug do
  @moduledoc """
  Plug for rate limiting HTTP requests.
  
  ## Overview
  
  Integrates with `Cgraph.RateLimiter` to enforce rate limits at the request level:
  
  - **IP-based limiting**: Default for unauthenticated requests
  - **User-based limiting**: For authenticated requests
  - **Endpoint-specific limits**: Different limits per endpoint
  - **Proper HTTP headers**: Standard rate limit headers in response
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    RATE LIMIT PLUG                              │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  Request ──► Extract ID ──► Check Limit ──► Response           │
  │                  │               │              │                │
  │           ┌──────▼──────┐  ┌─────▼─────┐  ┌────▼────┐          │
  │           │ IP Address  │  │ RateLimiter│  │ Headers │          │
  │           │ User ID     │  │   Check    │  │ 429/200 │          │
  │           │ API Key     │  │            │  │         │          │
  │           └─────────────┘  └───────────┘  └─────────┘          │
  │                                                                  │
  │  Response Headers:                                               │
  │  ┌──────────────────────────────────────────────────────────┐  │
  │  │ X-RateLimit-Limit: 1000                                   │  │
  │  │ X-RateLimit-Remaining: 999                                │  │
  │  │ X-RateLimit-Reset: 1234567890                             │  │
  │  │ Retry-After: 60 (only on 429)                             │  │
  │  └──────────────────────────────────────────────────────────┘  │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Usage
  
  ### In Router
  
      # Apply to all API routes
      pipeline :api do
        plug CgraphWeb.Plugs.RateLimitPlug, scope: :api
      end
      
      # Custom scope for specific endpoints
      pipeline :auth_rate_limited do
        plug CgraphWeb.Plugs.RateLimitPlug, 
          scope: :login,
          by: :ip,
          limit: 5,
          window: 300
      end
  
  ### In Controller
  
      # Per-action rate limiting
      plug CgraphWeb.Plugs.RateLimitPlug, 
        scope: :upload,
        limit: 10,
        window: 3600
        when action in [:upload, :bulk_upload]
  
  ## Options
  
  | Option | Default | Description |
  |--------|---------|-------------|
  | `:scope` | `:api` | Rate limit scope/bucket |
  | `:by` | `:auto` | Identifier type (:ip, :user, :api_key, :auto) |
  | `:limit` | (from scope) | Override limit |
  | `:window` | (from scope) | Override window in seconds |
  | `:cost` | `1` | Request cost |
  | `:skip_whitelisted` | `true` | Skip if identifier is whitelisted |
  | `:error_view` | `CgraphWeb.ErrorJSON` | View for 429 response |
  """
  
  import Plug.Conn
  require Logger
  
  alias Cgraph.RateLimiter
  
  @behaviour Plug
  
  @default_scope :api
  @default_error_view CgraphWeb.ErrorJSON
  
  # ---------------------------------------------------------------------------
  # Plug Callbacks
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(opts) do
    %{
      scope: Keyword.get(opts, :scope, @default_scope),
      by: Keyword.get(opts, :by, :auto),
      limit: Keyword.get(opts, :limit),
      window: Keyword.get(opts, :window),
      cost: Keyword.get(opts, :cost, 1),
      skip_whitelisted: Keyword.get(opts, :skip_whitelisted, true),
      error_view: Keyword.get(opts, :error_view, @default_error_view)
    }
  end
  
  @impl true
  def call(conn, opts) do
    identifier = extract_identifier(conn, opts.by)
    
    # Check whitelist
    if opts.skip_whitelisted && RateLimiter.whitelisted?(identifier) do
      conn
    else
      # Check blacklist
      if RateLimiter.blacklisted?(identifier) do
        deny_blacklisted(conn, opts)
      else
        check_rate_limit(conn, identifier, opts)
      end
    end
  end
  
  # ---------------------------------------------------------------------------
  # Rate Limit Check
  # ---------------------------------------------------------------------------
  
  defp check_rate_limit(conn, identifier, opts) do
    rate_limit_opts = build_rate_limit_opts(opts)
    
    case RateLimiter.check(identifier, opts.scope, rate_limit_opts) do
      :ok ->
        # Add rate limit headers even on success
        add_rate_limit_headers(conn, identifier, opts)
      
      {:error, :rate_limited, info} ->
        deny_rate_limited(conn, info, opts)
    end
  end
  
  defp build_rate_limit_opts(opts) do
    []
    |> maybe_add_opt(:limit, opts.limit)
    |> maybe_add_opt(:window, opts.window)
    |> maybe_add_opt(:cost, opts.cost)
  end
  
  defp maybe_add_opt(list, _key, nil), do: list
  defp maybe_add_opt(list, key, value), do: [{key, value} | list]
  
  # ---------------------------------------------------------------------------
  # Identifier Extraction
  # ---------------------------------------------------------------------------
  
  defp extract_identifier(conn, :auto) do
    # Prefer user ID if authenticated, fall back to IP
    case get_user_id(conn) do
      nil -> extract_identifier(conn, :ip)
      user_id -> "user:#{user_id}"
    end
  end
  
  defp extract_identifier(conn, :ip) do
    ip = get_client_ip(conn)
    "ip:#{ip}"
  end
  
  defp extract_identifier(conn, :user) do
    case get_user_id(conn) do
      nil -> extract_identifier(conn, :ip)
      user_id -> "user:#{user_id}"
    end
  end
  
  defp extract_identifier(conn, :api_key) do
    case get_req_header(conn, "x-api-key") do
      [key | _] -> "api_key:#{key}"
      [] -> extract_identifier(conn, :ip)
    end
  end
  
  defp extract_identifier(conn, {:custom, fun}) when is_function(fun, 1) do
    fun.(conn)
  end
  
  defp get_user_id(conn) do
    # Check Guardian current resource
    case conn.assigns[:current_user] do
      nil -> nil
      user -> user.id
    end
  end
  
  defp get_client_ip(conn) do
    # Check forwarded headers first (for proxies)
    forwarded_for = get_req_header(conn, "x-forwarded-for")
    real_ip = get_req_header(conn, "x-real-ip")
    
    cond do
      forwarded_for != [] ->
        [ips | _] = forwarded_for
        ips |> String.split(",") |> List.first() |> String.trim()
      
      real_ip != [] ->
        List.first(real_ip)
      
      true ->
        conn.remote_ip
        |> :inet.ntoa()
        |> to_string()
    end
  end
  
  # ---------------------------------------------------------------------------
  # Response Headers
  # ---------------------------------------------------------------------------
  
  defp add_rate_limit_headers(conn, identifier, opts) do
    status = RateLimiter.status(identifier, opts.scope)
    
    conn
    |> put_resp_header("x-ratelimit-limit", to_string(status.limit))
    |> put_resp_header("x-ratelimit-remaining", to_string(status.remaining))
    |> maybe_add_reset_header(status)
  end
  
  defp maybe_add_reset_header(conn, %{reset_at: reset_at}) when not is_nil(reset_at) do
    put_resp_header(conn, "x-ratelimit-reset", to_string(DateTime.to_unix(reset_at)))
  end
  defp maybe_add_reset_header(conn, _), do: conn
  
  # ---------------------------------------------------------------------------
  # Denial Responses
  # ---------------------------------------------------------------------------
  
  defp deny_rate_limited(conn, info, opts) do
    Logger.warning("Rate limited: scope=#{opts.scope} remaining=#{info.remaining} retry_after=#{info.retry_after}")
    
    conn
    |> put_resp_content_type("application/json")
    |> put_resp_header("x-ratelimit-limit", to_string(info.limit))
    |> put_resp_header("x-ratelimit-remaining", "0")
    |> put_resp_header("x-ratelimit-reset", to_string(DateTime.to_unix(info.reset_at)))
    |> put_resp_header("retry-after", to_string(info.retry_after))
    |> send_resp(429, encode_error(opts, info))
    |> halt()
  end
  
  defp deny_blacklisted(conn, opts) do
    Logger.warning("Blacklisted identifier attempted request")
    
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(403, encode_blacklist_error(opts))
    |> halt()
  end
  
  defp encode_error(_opts, info) do
    Jason.encode!(%{
      error: %{
        code: "rate_limited",
        message: "Too many requests. Please try again later.",
        details: %{
          limit: info.limit,
          reset_at: DateTime.to_iso8601(info.reset_at),
          retry_after: info.retry_after
        }
      }
    })
  end
  
  defp encode_blacklist_error(_opts) do
    Jason.encode!(%{
      error: %{
        code: "forbidden",
        message: "Access denied."
      }
    })
  end
end
