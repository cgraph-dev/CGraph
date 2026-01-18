defmodule CGraph.Application do
  @moduledoc """
  Main application supervisor for CGraph backend.

  Starts all required services including:
  - Ecto repository
  - Phoenix endpoint
  - Redis connection pool
  - Oban background job processor
  - Presence tracking
  - Token blacklist for JWT revocation
  """
  use Application

  @impl true
  def start(_type, _args) do
    require Logger
    Logger.info("[Application] Starting CGraph application...")

    # Check if Redis is available
    redis_enabled? = redis_available?()

    # Log database URL (masked)
    db_url = System.get_env("DATABASE_URL") || "NOT SET"
    masked_url = Regex.replace(~r/:[^:@]+@/, db_url, ":***@")
    Logger.info("[Application] DATABASE_URL: #{masked_url}")
    Logger.info("[Application] Redis enabled: #{redis_enabled?}")

    base_children = [
      # Start telemetry reporters
      CGraphWeb.Telemetry,

      # Start the Ecto repository
      CGraph.Repo,

      # Start the PubSub system
      {Phoenix.PubSub, name: CGraph.PubSub},

      # Start Cachex for local caching with memory bounds
      # Default: 100MB limit with LRU eviction (configurable via CACHEX_LIMIT_MB)
      Supervisor.child_spec({Cachex, cachex_config(:cgraph_cache)}, id: :cgraph_cache),

      # Separate cache for sessions with shorter TTL
      Supervisor.child_spec({Cachex, cachex_config(:session_cache, limit: 50_000, ttl: :timer.hours(24))}, id: :session_cache),

      # Token cache for JWT/rate limit lookups
      Supervisor.child_spec({Cachex, cachex_config(:token_cache, limit: 100_000, ttl: :timer.minutes(15))}, id: :token_cache),

      # JWT key rotation manager (supports dual-key verification during rotation)
      CGraph.Security.JWTKeyRotation,

      # Start in-app metrics collector/exporter
      CGraph.Metrics,

      # Start token blacklist for JWT revocation
      CGraph.Security.TokenBlacklist,

      # Start account lockout for brute force protection
      CGraph.Security.AccountLockout,

      # Start Finch for HTTP requests (used by Swoosh, Tesla)
      {Finch, name: CGraph.Finch},

      # Start Oban for background jobs
      {Oban, oban_config()},

      # Start Presence for online status tracking
      CGraph.Presence,

      # Start WebRTC call management
      CGraph.WebRTC,

      # Start sampled presence for large channels
      CGraph.Presence.Sampled,

      # Note: Search indexing is handled by Oban workers (SearchIndexWorker)
      # No separate GenServer needed for CGraph.Search.Indexer

      # Start the data export service (GDPR compliance)
      CGraph.DataExport,

      # Start API versioning (required for version negotiation)
      CGraph.ApiVersioning,

      # Start the Phoenix endpoint (must be last)
      CGraphWeb.Endpoint
    ]

    # Rate limiter ETS fallback is always needed, so start it unconditionally
    # Redis services only start if Redis is available
    redis_children = if redis_enabled? do
      [
        # Start Redis connection pool
        {Redix, redis_config()},

        # Start Redis GenServer wrapper (for rate limiting, etc.)
        CGraph.Redis,

        # Start distributed rate limiter (with Redis backend)
        CGraph.RateLimiter.Distributed
      ]
    else
      require Logger
      Logger.warning("[Application] Redis not configured - running with ETS-only rate limiting")
      [
        # Start distributed rate limiter (ETS-only mode)
        CGraph.RateLimiter.Distributed
      ]
    end

    # Insert Redis children after PubSub (position 3)
    children = Enum.take(base_children, 3) ++ redis_children ++ Enum.drop(base_children, 3)

    Logger.info("[Application] Starting #{length(children)} child processes...")

    opts = [strategy: :one_for_one, name: CGraph.Supervisor]

    case Supervisor.start_link(children, opts) do
      {:ok, pid} ->
        Logger.info("[Application] Supervisor started successfully with PID #{inspect(pid)}")
        {:ok, pid}

      {:error, reason} ->
        Logger.error("[Application] Supervisor failed to start: #{inspect(reason)}")
        {:error, reason}
    end
  end

  defp redis_available? do
    case System.get_env("REDIS_URL") do
      nil -> false
      "" -> false
      url when is_binary(url) -> true
    end
  end

  @impl true
  def config_change(changed, _new, removed) do
    CGraphWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp redis_config do
    redis_url = System.get_env("REDIS_URL", "redis://localhost:6379/0")
    is_upstash = String.contains?(redis_url, "upstash.io")

    base_config = [
      name: :redix,
      host: redis_host(redis_url),
      port: redis_port(redis_url),
      password: redis_password(redis_url),
      database: redis_db(redis_url),
      sync_connect: false,
      backoff_initial: 200,
      backoff_max: 5_000
    ]

    # Upstash requires SSL/TLS - ssl: true enables SSL
    if is_upstash do
      Keyword.put(base_config, :ssl, true)
    else
      base_config
    end
  end

  defp redis_host(url) do
    uri = URI.parse(url)
    uri.host || "localhost"
  end

  defp redis_port(url) do
    uri = URI.parse(url)
    uri.port || 6379
  end

  defp redis_password(url) do
    uri = URI.parse(url)

    case uri.userinfo do
      nil -> nil
      creds -> creds |> String.split(":") |> List.last()
    end
  end

  defp redis_db(url) do
    uri = URI.parse(url)

    case uri.path do
      "" -> 0
      nil -> 0
      path ->
        path
        |> String.trim_leading("/")
        |> case do
          "" -> 0
          db -> String.to_integer(db)
        end
    end
  end

  defp oban_config do
    Application.fetch_env!(:cgraph, Oban)
  end

  @doc false
  defp cachex_config(name, opts \\ []) do
    # Memory limit in entries (default 100k, ~100MB assuming 1KB avg entry)
    default_limit = String.to_integer(System.get_env("CACHEX_LIMIT_ENTRIES") || "100000")
    limit = Keyword.get(opts, :limit, default_limit)
    default_ttl = Keyword.get(opts, :ttl, :timer.hours(1))

    # Cachex 4.x uses hooks for limits and stats
    # See: https://hexdocs.pm/cachex/Cachex.Limit.Scheduled.html
    import Cachex.Spec

    [
      name: name,
      # LRW eviction when limit reached (scheduled policy - lower memory overhead)
      # Cachex 4.x format: {max_size, prune_options, hook_options}
      hooks: [
        hook(module: Cachex.Stats),
        hook(module: Cachex.Limit.Scheduled, args: {
          limit,           # max size
          [reclaim: 0.1],  # options for Cachex.prune/3
          []               # options for Cachex.Limit.Scheduled (e.g., frequency)
        })
      ],
      # Default TTL for entries without explicit TTL
      expiration: expiration(
        default: default_ttl,
        interval: :timer.seconds(30),
        lazy: true
      )
    ]
  end
end
