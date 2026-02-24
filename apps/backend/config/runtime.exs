import Config

# Note: This file is loaded from config.exs using:
# import_config "#{config_env()}.exs"
#
# For production, you'll want to set these via environment variables.

# config/runtime.exs is executed after compilation and before the
# application starts, so it is the perfect place to load secrets.

if config_env() == :prod do
  # ---------------------------------------------------------------------------
  # Logger — runtime log level override via LOG_LEVEL env var
  # ---------------------------------------------------------------------------
  if log_level = System.get_env("LOG_LEVEL") do
    valid_levels = ~w(emergency alert critical error warning notice info debug)

    if log_level in valid_levels do
      config :logger, level: String.to_existing_atom(log_level)
    else
      IO.puts("[WARNING] Invalid LOG_LEVEL=#{log_level} — must be one of: #{Enum.join(valid_levels, ", ")}. Using default.")
    end
  end

  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  # Force IPv4 for DNS resolution (Fly.io can have issues with external IPv4-only hosts)
  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: [:inet]

  # SSL configuration for cloud databases (Supabase, etc.)
  ssl_enabled = System.get_env("DATABASE_SSL") in ~w(true 1)

  # Pool size optimized for 10K+ concurrent users
  # Recommended: Set POOL_SIZE=50-100 based on instance count
  # Formula: (max_db_connections / app_instances) - 5
  # Consider deploying PgBouncer for connection multiplexing at scale
  #
  # For 10K users on 2 instances: 50 connections each = 100 total
  # Supabase Pro: 500 connections, so 50/instance is safe
  repo_config = [
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "50"),
    queue_target: String.to_integer(System.get_env("POOL_QUEUE_TARGET") || "100"),
    queue_interval: String.to_integer(System.get_env("POOL_QUEUE_INTERVAL") || "2000"),
    socket_options: maybe_ipv6,
    # Timeout settings for high load
    timeout: 30_000,
    connect_timeout: 10_000,
    handshake_timeout: 10_000
  ]

  repo_config = if ssl_enabled do
    # SSL configuration - Postgrex uses `ssl: opts_list` directly (not ssl_opts)
    ssl_opts = case System.get_env("DATABASE_SSL_VERIFY") do
      "none" ->
        # Only use verify_none when explicitly configured (e.g., Supabase, some cloud providers)
        [verify: :verify_none]
      _ ->
        # Default: Proper certificate verification using system CA store
        [
          verify: :verify_peer,
          cacerts: :public_key.cacerts_get(),
          depth: 3,
          customize_hostname_check: [
            match_fun: :public_key.pkix_verify_hostname_match_fun(:https)
          ],
          server_name_indication: to_charlist(System.get_env("DATABASE_HOST", "localhost"))
        ]
    end
    # Pass ssl options directly - Postgrex 0.18+ uses `ssl: opts` not `ssl: true, ssl_opts: opts`
    Keyword.put(repo_config, :ssl, ssl_opts)
  else
    repo_config
  end

  config :cgraph, CGraph.Repo, repo_config

  # ── Read Replica Configuration ──
  # Offloads heavy read queries (leaderboards, analytics, search indexing)
  # Set READ_REPLICA_DATABASE_URL to enable; otherwise falls back to primary
  read_replica_url = System.get_env("READ_REPLICA_DATABASE_URL")

  if read_replica_url do
    read_config = [
      url: read_replica_url,
      pool_size: String.to_integer(System.get_env("READ_REPLICA_POOL_SIZE") || "20"),
      queue_target: 200,
      queue_interval: 3000,
      socket_options: maybe_ipv6,
      timeout: 30_000,
      connect_timeout: 10_000,
      # Read replicas don't need write capabilities
      read_only: true
    ]

    read_config = if ssl_enabled do
      Keyword.put(read_config, :ssl, Keyword.get(repo_config, :ssl))
    else
      read_config
    end

    config :cgraph, CGraph.ReadRepo, read_config
    IO.puts("[DB] Read replica enabled: offloading leaderboard/analytics queries")
  else
    # No replica — ReadRepo uses primary database
    config :cgraph, CGraph.ReadRepo, repo_config
    IO.puts("[DB] No read replica configured — using primary for all reads")
  end

  # ── PgBouncer Configuration ──
  # When PGBOUNCER_DATABASE_URL is set, the primary Repo connects via PgBouncer
  # PgBouncer multiplexes connections, allowing 5-10x more effective connections
  # Typical setup: app -> PgBouncer (localhost:6432) -> PostgreSQL
  if pgbouncer_url = System.get_env("PGBOUNCER_DATABASE_URL") do
    pgbouncer_config = Keyword.merge(repo_config, [
      url: pgbouncer_url,
      # PgBouncer doesn't support prepared statements in transaction mode
      prepare: :unnamed,
      # Smaller pool since PgBouncer handles multiplexing
      pool_size: String.to_integer(System.get_env("PGBOUNCER_POOL_SIZE") || "20"),
    ])
    config :cgraph, CGraph.Repo, pgbouncer_config

    # PgBouncer in transaction mode doesn't support LISTEN/NOTIFY
    # Switch Oban to PG-based notifier (uses distributed Erlang instead)
    config :cgraph, Oban, notifier: Oban.Notifiers.PG

    IO.puts("[DB] PgBouncer enabled — using connection multiplexing")
    IO.puts("[Oban] Using PG notifier (PgBouncer-compatible)")
  end

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = System.get_env("PHX_HOST") || "cgraph.org"
  port = String.to_integer(System.get_env("PORT") || "4000")

  config :cgraph, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")
  config :cgraph, :env, :prod

  config :cgraph, CGraphWeb.Endpoint,
    server: true,
    url: [host: host, port: 443, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: port
    ],
    secret_key_base: secret_key_base,
    live_view: [
      signing_salt: System.get_env("LIVE_VIEW_SIGNING_SALT") ||
        raise "environment variable LIVE_VIEW_SIGNING_SALT is missing (required for multi-instance LiveView)"
    ]

  # Session signing_salt is a key derivation namespace, NOT a secret.
  # The compile-time default "cgraph_session_v1" is fine — actual security
  # comes from secret_key_base. Only override if SESSION_SIGNING_SALT is explicitly set.
  if salt = System.get_env("SESSION_SIGNING_SALT") do
    config :cgraph, :session_signing_salt, salt
  end

  # Guardian JWT configuration
  config :cgraph, CGraph.Guardian,
    issuer: "cgraph",
    secret_key: System.get_env("JWT_SECRET") ||
      raise "environment variable JWT_SECRET is missing"

  # JWT token TTL (access: 15 minutes, refresh: 7 days)
  config :cgraph, :jwt_access_token_ttl,
    String.to_integer(System.get_env("JWT_ACCESS_TOKEN_TTL") || "900")

  config :cgraph, :jwt_refresh_token_ttl,
    String.to_integer(System.get_env("JWT_REFRESH_TOKEN_TTL") || "604800")

  # Configure Swoosh for production
  resend_api_key =
    System.get_env("RESEND_API_KEY") ||
      raise """
      environment variable RESEND_API_KEY is missing.
      This is required for sending transactional emails (password reset, 2FA, digests).
      Sign up at https://resend.com and set the API key.
      """

  config :cgraph, CGraph.Mailer,
    adapter: Swoosh.Adapters.Resend,
    api_key: resend_api_key

  # Stripe configuration for production (MUST be set at runtime, not compile time)
  stripe_secret =
    System.get_env("STRIPE_SECRET_KEY") ||
      raise """
      environment variable STRIPE_SECRET_KEY is missing.
      This is required for subscription billing. Set it from your Stripe dashboard.
      """

  config :stripity_stripe,
    api_key: stripe_secret,
    signing_secret: System.get_env("STRIPE_WEBHOOK_SECRET") ||
      raise("environment variable STRIPE_WEBHOOK_SECRET is missing")

  app_url = System.get_env("APP_URL") || "https://web.cgraph.org"

  stripe_price_premium =
    System.get_env("STRIPE_PRICE_PREMIUM") ||
      raise "environment variable STRIPE_PRICE_PREMIUM is missing (Stripe price ID for premium plan)"

  stripe_price_enterprise =
    System.get_env("STRIPE_PRICE_ENTERPRISE") ||
      raise "environment variable STRIPE_PRICE_ENTERPRISE is missing (Stripe price ID for enterprise plan)"

  config :cgraph, CGraph.Subscriptions,
    stripe_price_ids: %{
      premium: stripe_price_premium,
      enterprise: stripe_price_enterprise
    },
    success_url: app_url <> "/billing/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: app_url <> "/billing/cancel",
    portal_return_url: app_url <> "/settings/billing"

  # Sentry error tracking
  if System.get_env("SENTRY_DSN") do
    config :sentry,
      dsn: System.get_env("SENTRY_DSN"),
      environment_name: :prod,
      enable_source_code_context: true,
      root_source_code_paths: [File.cwd!()]
  end

  # OpenTelemetry configuration
  otel_endpoint = System.get_env("OTEL_EXPORTER_OTLP_ENDPOINT") || "http://localhost:4318"
  otel_sample_rate =
    case Float.parse(System.get_env("OTEL_SAMPLE_RATE") || "0.1") do
      {rate, _} -> rate
      :error -> 0.1
    end

  config :opentelemetry,
    span_processor: :batch,
    traces_exporter: :otlp,
    resource: [
      service: [name: System.get_env("OTEL_SERVICE_NAME") || "cgraph"],
      deployment: [environment: "production"]
    ]

  config :opentelemetry_exporter,
    otlp_protocol: :http_protobuf,
    otlp_endpoint: otel_endpoint

  config :cgraph, CGraph.Telemetry.OpenTelemetry,
    sample_rate: otel_sample_rate,
    enabled: true

  IO.puts("[OTel] Tracing enabled → #{otel_endpoint} (sample rate: #{otel_sample_rate})")

  # ExAWS for Cloudflare R2
  r2_access_key = System.get_env("R2_ACCESS_KEY_ID")
  r2_secret_key = System.get_env("R2_SECRET_ACCESS_KEY")
  r2_account_id = System.get_env("R2_ACCOUNT_ID")

  unless r2_access_key && r2_secret_key && r2_account_id do
    IO.puts("[WARNING] R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_ACCOUNT_ID missing — file uploads will fail")
  end

  config :ex_aws,
    access_key_id: r2_access_key,
    secret_access_key: r2_secret_key

  config :ex_aws, :s3,
    scheme: "https://",
    host: "#{r2_account_id}.r2.cloudflarestorage.com",
    region: "auto"

  # OAuth configuration for production
  google_client_id = System.get_env("GOOGLE_CLIENT_ID")

  unless google_client_id do
    IO.puts("[WARNING] GOOGLE_CLIENT_ID not set — Google OAuth login will be unavailable")
  end
  config :cgraph, :oauth,
    google: [
      client_id: System.get_env("GOOGLE_CLIENT_ID"),
      client_secret: System.get_env("GOOGLE_CLIENT_SECRET"),
      redirect_uri: "https://#{host}/api/v1/auth/oauth/google/callback"
    ],
    apple: [
      client_id: System.get_env("APPLE_CLIENT_ID"),
      team_id: System.get_env("APPLE_TEAM_ID"),
      key_id: System.get_env("APPLE_KEY_ID"),
      private_key: System.get_env("APPLE_PRIVATE_KEY"),
      redirect_uri: "https://#{host}/api/v1/auth/oauth/apple/callback"
    ],
    facebook: [
      client_id: System.get_env("FACEBOOK_CLIENT_ID"),
      client_secret: System.get_env("FACEBOOK_CLIENT_SECRET"),
      redirect_uri: "https://#{host}/api/v1/auth/oauth/facebook/callback"
    ],
    tiktok: [
      client_key: System.get_env("TIKTOK_CLIENT_KEY"),
      client_secret: System.get_env("TIKTOK_CLIENT_SECRET"),
      redirect_uri: "https://#{host}/api/v1/auth/oauth/tiktok/callback"
    ]

  # Encryption key for data at rest (REQUIRED in production)
  encryption_key =
    System.get_env("ENCRYPTION_KEY") ||
      raise """
      environment variable ENCRYPTION_KEY is missing.
      Generate one with: mix phx.gen.secret 32 | base64
      This key encrypts TOTP secrets, encrypted fields, and sensitive data at rest.
      """

  config :cgraph, :encryption_key, encryption_key

  # Redis configuration for production (optional, falls back to in-memory)
  redis_url = System.get_env("REDIS_URL")

  if redis_url do
    # Validate Redis URL has password in production
    redis_uri = URI.parse(redis_url)
    has_password = redis_uri.userinfo != nil and String.contains?(redis_uri.userinfo || "", ":")

    unless has_password do
      raise """
      REDIS_URL must include a password in production.
      Current URL appears to have no password.
      Use format: redis://:your_secure_password@host:6379/0
      """
    end

    config :cgraph, :redis_url, redis_url
  end
  # If no REDIS_URL provided, don't set the config - let it use default from code

  # Mark environment as production for conditional logic
  config :cgraph, :env, :prod

  # Push notification configuration
  if System.get_env("EXPO_ACCESS_TOKEN") do
    config :cgraph, :push_notifications,
      enabled: true,
      expo_access_token: System.get_env("EXPO_ACCESS_TOKEN")
  end

  # --- New in v0.7.32: Search, WebRTC, Rate Limiter ---

  # Meilisearch (Search Engine)
  config :cgraph, CGraph.Search.Engine,
    meilisearch_url: System.get_env("MEILISEARCH_URL") || "http://localhost:7700",
    meilisearch_key: System.get_env("MEILISEARCH_API_KEY"),
    backend: if(System.get_env("MEILISEARCH_URL"), do: :meilisearch, else: :postgres),
    fallback_to_postgres: true

  # WebRTC Signaling & ICE
  turn_servers =
    case System.get_env("WEBRTC_TURN_URL") do
      nil ->
        []

      turn_url ->
        [%{
          urls: turn_url,
          username: System.get_env("WEBRTC_TURN_USERNAME", ""),
          credential: System.get_env("WEBRTC_TURN_CREDENTIAL", "")
        }]
    end

  config :cgraph, CGraph.WebRTC,
    stun_servers: String.split(System.get_env("WEBRTC_STUN_SERVERS") || "stun:stun.l.google.com:19302", ","),
    turn_servers: turn_servers,
    sfu_enabled: System.get_env("WEBRTC_SFU_ENABLED") == "true",
    sfu_url: System.get_env("WEBRTC_SFU_URL", ""),
    max_participants: String.to_integer(System.get_env("WEBRTC_MAX_PARTICIPANTS") || "10")

  # Distributed Rate Limiting (Redis-backed, disabled if no Redis)
  config :cgraph, CGraph.RateLimiter.Distributed,
    enabled: redis_url != nil,
    redis_pool: :rate_limiter_pool

  # SECURITY: Rate limiting falls back to local Cachex when Redis is unavailable.
  # Distributed rate limiting is disabled, but per-instance limits remain active.
  unless redis_url do
    IO.puts("[WARNING] REDIS_URL not set — rate limiting using local Cachex only. " <>
            "Distributed rate limiting disabled. Set REDIS_URL for production.")
    config :cgraph, CGraph.RateLimiter, enabled: true, backend: :local
  end

  # Sampled Presence for Large Channels
  config :cgraph, CGraph.Presence.Sampled,
    tiers: [
      %{max_size: 100, sample_rate: 1.0, batch_interval: 0},
      %{max_size: 1_000, sample_rate: 0.5, batch_interval: 1_000},
      %{max_size: 100_000, sample_rate: 0.01, batch_interval: 10_000},
      %{max_size: :infinity, sample_rate: 0.001, batch_interval: 30_000}
    ]

  # ==========================================================================
  # AI Configuration - PLACEHOLDER FOR FUTURE CLAUDE INTEGRATION
  # ==========================================================================
  # AI features are not yet implemented. This is a placeholder for future use.
  # Provider: Claude (Anthropic) - planned features:
  # - Forum moderation
  # - Chat experience enhancements
  # - Content suggestions
  # - Smart search
  # See: docs/architecture/AI_INTEGRATION.md
  # ==========================================================================

  config :cgraph, CGraph.AI,
    enabled: false,  # AI features not yet implemented
    model: "claude-4-opus",
    provider: "anthropic",
    # Future features (currently disabled)
    features: %{
      forum_moderation: false,
      chat_suggestions: false,
      content_moderation: false,
      smart_search: false
    }

  IO.puts("[AI] AI features are disabled (placeholder for future Claude integration)")
end
