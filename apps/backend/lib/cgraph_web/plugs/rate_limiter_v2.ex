defmodule CGraphWeb.Plugs.RateLimiterV2 do
  @moduledoc """
  Production-grade rate limiter with distributed Redis backend.

  ## Algorithm

  Uses `CGraph.RateLimiter.Distributed` for cluster-wide rate limiting:

  - **Redis backend**: Lua scripts for atomic operations across nodes
  - **Local fallback**: Cachex when Redis is unavailable
  - **Sliding window**: Precise request counting without burst issues

  ## Rate Limit Tiers

  Different endpoints have different limits based on resource cost:

  | Tier        | Requests | Window | Use Case                    |
  |-------------|----------|--------|-----------------------------|
  | `:standard` | 100      | 60s    | Most API endpoints          |
  | `:strict`   | 20       | 60s    | Auth, password reset        |
  | `:relaxed`  | 500      | 60s    | Read-only, cached endpoints |
  | `:burst`    | 30       | 1s     | WebSocket events            |

  ## Usage

      # In router pipeline
      plug CGraphWeb.Plugs.RateLimiterV2, tier: :standard

      # Custom limits
      plug CGraphWeb.Plugs.RateLimiterV2, limit: 50, window_ms: 30_000

      # Per-action limits in controller
      plug CGraphWeb.Plugs.RateLimiterV2, tier: :strict when action in [:create, :delete]

  ## Response Headers

  All responses include standard rate limit headers:

  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Unix timestamp when window resets
  - `X-RateLimit-Policy`: Rate limit tier applied
  - `Retry-After`: Seconds to wait (only on 429 responses)

  ## Telemetry Events

  Emits telemetry events for monitoring:

  - `[:cgraph, :rate_limiter, :check]` - Every rate limit check
  - `[:cgraph, :rate_limiter, :exceeded]` - When limit is exceeded
  """

  import Plug.Conn
  require Logger

  alias CGraph.RateLimiter.Distributed, as: DistributedRateLimiter

  @behaviour Plug

  # Rate limit tier configurations
  @tiers %{
    standard: %{limit: 100, window_ms: 60_000},
    strict: %{limit: 20, window_ms: 60_000},
    relaxed: %{limit: 500, window_ms: 60_000},
    burst: %{limit: 30, window_ms: 1_000},
    upload: %{limit: 10, window_ms: 60_000}
  }

  @type tier :: :standard | :strict | :relaxed | :burst | :upload
  @type opts :: %{
    limit: pos_integer(),
    window_ms: pos_integer(),
    tier: tier(),
    key_prefix: String.t()
  }

  @doc """
  Initialize the rate limiter with options.

  ## Options

  - `:tier` - Predefined tier (`:standard`, `:strict`, `:relaxed`, `:burst`, `:upload`)
  - `:limit` - Custom request limit (overrides tier)
  - `:window_ms` - Custom window in milliseconds (overrides tier)
  - `:key_prefix` - Custom key prefix for rate limit bucket
  - `:by` - Rate limit key strategy (`:ip`, `:user`, `:ip_and_path`, `:user_and_action`)
  """
  @impl Plug
  def init(opts) do
    tier = Keyword.get(opts, :tier, :standard)
    tier_config = Map.get(@tiers, tier, @tiers.standard)

    %{
      limit: Keyword.get(opts, :limit, tier_config.limit),
      window_ms: Keyword.get(opts, :window_ms, tier_config.window_ms),
      tier: tier,
      key_prefix: Keyword.get(opts, :key_prefix, "rl"),
      by: Keyword.get(opts, :by, :ip)
    }
  end

  @doc """
  Check rate limit and either allow or reject the request.

  ## Process

  1. Check if rate limiting is disabled (e.g., in test environment)
  2. Generate rate limit key from request context
  3. Execute sliding window check against cache/Redis
  4. Add rate limit headers to response
  5. Either continue pipeline or return 429

  Rate limiting can be disabled via config:

      config :cgraph, CGraph.RateLimiter, enabled: false
  """
  @impl Plug
  def call(conn, opts) do
    # Bypass if rate limiting is disabled (e.g., test environment)
    if rate_limiting_enabled?() do
      do_rate_limit_check(conn, opts)
    else
      conn
    end
  end

  defp rate_limiting_enabled? do
    Application.get_env(:cgraph, CGraph.RateLimiter, [])
    |> Keyword.get(:enabled, true)
  end

  defp do_rate_limit_check(conn, opts) do
    start_time = System.monotonic_time()
    identifier = generate_identifier(conn, opts.by)
    scope = tier_to_scope(opts.tier)

    # Use distributed rate limiter with Redis backend
    result = DistributedRateLimiter.check(identifier, scope,
      limit: opts.limit,
      window: div(opts.window_ms, 1000)
    )

    # Emit telemetry
    emit_telemetry(result, opts, start_time, conn)

    case result do
      :ok ->
        # Get status for headers
        status = DistributedRateLimiter.status(identifier, scope)
        remaining = Map.get(status, :remaining, opts.limit - 1)
        reset_at = System.system_time(:millisecond) + opts.window_ms

        conn
        |> add_rate_limit_headers(opts, remaining, reset_at)

      {:error, :rate_limited, info} ->
        retry_after_ms = info.retry_after * 1000
        reset_at = DateTime.to_unix(info.reset_at, :millisecond)

        conn
        |> add_rate_limit_headers(opts, 0, reset_at)
        |> add_retry_after_header(retry_after_ms)
        |> send_rate_limit_response(retry_after_ms, opts)
        |> halt()
    end
  end

  defp tier_to_scope(:standard), do: :api
  defp tier_to_scope(:strict), do: :login
  defp tier_to_scope(:relaxed), do: :api
  defp tier_to_scope(:burst), do: :message_burst
  defp tier_to_scope(:upload), do: :upload
  defp tier_to_scope(_), do: :api

  # ---------------------------------------------------------------------------
  # Key Generation
  # ---------------------------------------------------------------------------

  defp generate_identifier(conn, :ip), do: extract_client_ip(conn)
  defp generate_identifier(conn, :user), do: extract_user_or_ip(conn)
  defp generate_identifier(conn, :ip_and_path), do: build_ip_path_identifier(conn)
  defp generate_identifier(conn, :user_and_action), do: build_user_action_identifier(conn)
  defp generate_identifier(conn, custom) when is_function(custom, 1), do: custom.(conn)

  defp extract_user_or_ip(conn) do
    case conn.assigns[:current_user] do
      %{id: user_id} -> "user:#{user_id}"
      _ -> extract_client_ip(conn)
    end
  end

  defp build_ip_path_identifier(conn) do
    ip = extract_client_ip(conn)
    path = conn.request_path |> String.replace(~r/[^a-zA-Z0-9]/, "_")
    "#{ip}:#{path}"
  end

  defp build_user_action_identifier(conn) do
    user_part = extract_user_or_ip(conn)
    action = conn.private[:phoenix_action] || "unknown"
    "#{user_part}:#{action}"
  end

  @doc """
  Extract the real client IP, accounting for proxies and load balancers.

  Checks headers in order of trust:
  1. CF-Connecting-IP (Cloudflare)
  2. X-Real-IP (nginx)
  3. X-Forwarded-For (standard proxy header, first IP)
  4. conn.remote_ip (direct connection)
  """
  def extract_client_ip(conn) do
    cond do
      # Cloudflare
      cf_ip = get_req_header(conn, "cf-connecting-ip") |> List.first() ->
        sanitize_ip(cf_ip)

      # Nginx real IP
      real_ip = get_req_header(conn, "x-real-ip") |> List.first() ->
        sanitize_ip(real_ip)

      # Standard forwarded header (take first, which is original client)
      forwarded = get_req_header(conn, "x-forwarded-for") |> List.first() ->
        forwarded
        |> String.split(",")
        |> List.first()
        |> String.trim()
        |> sanitize_ip()

      # Direct connection
      true ->
        conn.remote_ip
        |> :inet.ntoa()
        |> to_string()
    end
  end

  defp sanitize_ip(ip_string) when is_binary(ip_string) do
    ip_string
    |> String.trim()
    |> String.replace(~r/[^0-9a-fA-F.:]/, "")
    |> String.slice(0, 45)  # Max IPv6 length
  end

  # ---------------------------------------------------------------------------
  # Response Headers
  # ---------------------------------------------------------------------------

  defp add_rate_limit_headers(conn, opts, remaining, reset_at) do
    reset_unix = div(reset_at, 1000)

    conn
    |> put_resp_header("x-ratelimit-limit", Integer.to_string(opts.limit))
    |> put_resp_header("x-ratelimit-remaining", Integer.to_string(max(remaining, 0)))
    |> put_resp_header("x-ratelimit-reset", Integer.to_string(reset_unix))
    |> put_resp_header("x-ratelimit-policy", "#{opts.limit};w=#{div(opts.window_ms, 1000)}")
  end

  defp add_retry_after_header(conn, retry_after_ms) do
    retry_seconds = max(div(retry_after_ms, 1000), 1)
    put_resp_header(conn, "retry-after", Integer.to_string(retry_seconds))
  end

  defp send_rate_limit_response(conn, retry_after_ms, opts) do
    retry_seconds = max(div(retry_after_ms, 1000), 1)

    body = Jason.encode!(%{
      error: %{
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please wait #{retry_seconds} seconds before retrying.",
        details: %{
          limit: opts.limit,
          window_seconds: div(opts.window_ms, 1000),
          retry_after_seconds: retry_seconds
        }
      }
    })

    conn
    |> put_resp_content_type("application/json")
    |> send_resp(429, body)
  end

  # ---------------------------------------------------------------------------
  # Telemetry
  # ---------------------------------------------------------------------------

  defp emit_telemetry(result, opts, start_time, conn) do
    duration = System.monotonic_time() - start_time

    metadata = %{
      tier: opts.tier,
      limit: opts.limit,
      window_ms: opts.window_ms,
      path: conn.request_path,
      method: conn.method
    }

    case result do
      :ok ->
        :telemetry.execute(
          [:cgraph, :rate_limiter, :check],
          %{duration: duration, remaining: opts.limit},
          metadata
        )

      {:error, :rate_limited, info} ->
        retry_after_ms = info.retry_after * 1000

        :telemetry.execute(
          [:cgraph, :rate_limiter, :exceeded],
          %{duration: duration, retry_after_ms: retry_after_ms},
          metadata
        )

        Logger.info(
          "Rate limit exceeded",
          tier: opts.tier,
          path: conn.request_path,
          retry_after_seconds: info.retry_after
        )
    end
  end
end
