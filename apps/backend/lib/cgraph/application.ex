defmodule CGraph.Application do
  @moduledoc """
  Main application supervisor for CGraph backend.

  Starts all required services including:
  - Ecto repository
  - Phoenix endpoint
  - Redis connection pool
  - Sub-supervisors for Caches, Workers, and Security
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
    Logger.info("application_database_url", masked_url: masked_url)
    Logger.info("application_redis_status", enabled: redis_enabled?)

    base_children = [
      # Start telemetry reporters
      CGraphWeb.Telemetry,

      # Start the Ecto repository (CRITICAL)
      CGraph.Repo,

      # Start the read replica repository (falls back to primary if no replica)
      CGraph.ReadRepo,

      # Start the PubSub system
      # Pool size = number of partitions for parallel message dispatch.
      # Default pool_size=1 is a bottleneck at >5K concurrent connections.
      # Rule of thumb: pool_size = System.schedulers_online() (usually 4-8).
      # PG2 adapter auto-clusters via Erlang distribution (no Redis needed for PubSub).
      {Phoenix.PubSub,
        name: CGraph.PubSub,
        pool_size: pubsub_pool_size()},

      # === SUPERVISION HIERARCHY ===

      # 0. OpenTelemetry distributed tracing (before other services)
      {Task, fn -> CGraph.Telemetry.OpenTelemetry.setup() end},

      # 1. Caching Layer
      CGraph.CacheSupervisor,

      # 2. Security Layer
      CGraph.SecuritySupervisor,

      # 3. Worker Layer (Oban, Presence, WebRTC)
      CGraph.WorkerSupervisor,

      # Start in-app metrics collector/exporter
      CGraph.Metrics,

      # Discord-style Snowflake ID generator for message ordering
      CGraph.Snowflake,

      # 4. Database query analysis (N+1 detection, slow query logging)
      CGraph.Telemetry.SlowQueryReporter,

      # Start Finch for HTTP requests (used by Swoosh, Tesla)
      {Finch, name: CGraph.Finch},

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

    Logger.info("application_starting", child_count: length(children))

    opts = [strategy: :one_for_one, name: CGraph.Supervisor]

    case Supervisor.start_link(children, opts) do
      {:ok, pid} ->
        Logger.info("application_supervisor_started", pid: inspect(pid))

        # Initialize tier limits cache after Repo is started
        init_tier_limits_cache()

        # Warm up critical caches on deploy
        warm_up_caches()

        # Set up Meilisearch indexes (async, non-blocking)
        setup_search_indexes()

        {:ok, pid}

      {:error, reason} ->
        Logger.error("application_supervisor_failed", reason: inspect(reason))
        {:error, reason}
    end
  end

  defp init_tier_limits_cache do
    require Logger
    # Initialize tier limits ETS cache for fast lookups
    # This is done in a spawn to not block startup if DB isn't ready yet
    spawn(fn ->
      Process.sleep(1000)  # Wait for Repo to fully initialize
      try do
        CGraph.Subscriptions.TierLimits.init_cache()
        Logger.info("[Application] Tier limits cache initialized")
      rescue
        e -> Logger.warning("application_tier_cache_init_failed", error: inspect(e))
      end
    end)
  end

  defp warm_up_caches do
    require Logger
    # Warm up critical caches on startup to avoid thundering herd
    # Runs in a separate process to not block application startup
    spawn(fn ->
      Process.sleep(2000)  # Wait for all services to initialize

      try do
        Logger.info("[Application] Starting cache warm-up...")
        start = System.monotonic_time(:millisecond)

        # Warm up top active users (most frequently accessed)
        warm_user_cache()

        duration = System.monotonic_time(:millisecond) - start
        Logger.info("application_cache_warmup_completed", duration_ms: duration)
      rescue
        e -> Logger.warning("application_cache_warmup_failed", error: inspect(e))
      end
    end)
  end

  defp setup_search_indexes do
    require Logger
    # Configure Meilisearch indexes on startup (async, non-blocking)
    # Waits for Finch to be available, then creates/updates index settings
    spawn(fn ->
      Process.sleep(3000)  # Wait for Finch and other services to initialize

      try do
        backend = CGraph.Search.Engine.get_backend()
        Logger.info("[Application] Search backend: #{backend}")

        if backend == :meilisearch do
          case CGraph.Search.Engine.healthy?() do
            true ->
              Logger.info("[Application] Meilisearch is healthy, setting up indexes...")
              CGraph.Search.Engine.setup_indexes()
              Logger.info("[Application] Meilisearch indexes configured successfully")

            false ->
              Logger.warning("[Application] Meilisearch is not reachable at #{Application.get_env(:cgraph, CGraph.Search.Engine, [])[:meilisearch_url] || "http://localhost:7700"} — search will use PostgreSQL fallback")
          end
        else
          Logger.info("[Application] Search using PostgreSQL backend (MEILISEARCH_URL not set)")
        end
      rescue
        e -> Logger.warning("application_search_setup_failed", error: inspect(e))
      end
    end)
  end

  defp warm_user_cache do
    require Logger

    try do
      import Ecto.Query

      # Pre-load top 1000 most recently active users
      users = CGraph.Accounts.User
        |> where([u], not is_nil(u.last_login_at))
        |> order_by([u], desc: u.last_login_at)
        |> limit(1000)
        |> select([u], %{id: u.id, username: u.username})
        |> CGraph.Repo.all()

      items = Enum.map(users, fn user ->
        {"user:#{user.id}:basic", fn ->
          CGraph.Repo.get(CGraph.Accounts.User, user.id)
        end}
      end)

      if length(items) > 0 do
        CGraph.Cache.warm_up(items, concurrency: 10)
        Logger.info("application_user_cache_warmed", count: length(items))
      end
    rescue
      e -> Logger.warning("application_user_cache_warmup_failed", error: inspect(e))
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

  @impl true
  def prep_stop(_state) do
    require Logger
    Logger.info("[Application] SIGTERM received — starting graceful shutdown...")

    # 1. Mark as draining (readiness check returns 503)
    Application.put_env(:cgraph, :draining, true)

    # 2. Broadcast server_restart to all WebSocket clients
    #    Clients will auto-reconnect after 5s to another instance
    Phoenix.PubSub.broadcast(CGraph.PubSub, "system:events", {:server_restart, %{
      message: "Server is restarting, you will be reconnected shortly.",
      reconnect_after_ms: 5000
    }})

    # 3. Drain Oban queues (finish in-progress jobs, don't start new ones)
    try do
      Logger.info("[Application] Draining Oban queues...")
      Oban.drain_queue(queue: :default, with_safety: true)
      Oban.drain_queue(queue: :notifications, with_safety: true)
      Oban.drain_queue(queue: :mailers, with_safety: true)
    rescue
      e -> Logger.warning("application_oban_drain_failed", error: inspect(e))
    end

    # 4. Wait for in-flight requests to complete (max 25s, leaving 5s buffer)
    Logger.info("[Application] Waiting for in-flight requests to complete...")
    Process.sleep(5_000)

    Logger.info("[Application] Graceful shutdown complete")
    :ok
  end

  # PubSub pool size: partitions for parallel message dispatch.
  # Configurable via PUBSUB_POOL_SIZE env var.
  # Defaults to System.schedulers_online() (number of CPU cores).
  defp pubsub_pool_size do
    case System.get_env("PUBSUB_POOL_SIZE") do
      nil -> System.schedulers_online()
      size -> String.to_integer(size)
    end
  end

  defp redis_config do
    redis_url = System.get_env("REDIS_URL", "redis://localhost:6379/0")
    is_fly_upstash = String.contains?(redis_url, "upstash.io")

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

    # Fly.io's Upstash Redis uses private IPv6 network
    # Must use inet6 socket option for DNS resolution
    if is_fly_upstash do
      Keyword.put(base_config, :socket_opts, [:inet6])
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
end
