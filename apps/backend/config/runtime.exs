import Config

# Note: This file is loaded from config.exs using:
# import_config "#{config_env()}.exs"
#
# For production, you'll want to set these via environment variables.

# config/runtime.exs is executed after compilation and before the
# application starts, so it is the perfect place to load secrets.

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  # Pool size optimized for 10K+ concurrent users
  # Recommended: Set POOL_SIZE=50-100 based on instance count
  # Formula: (max_db_connections / app_instances) - 5
  # Consider deploying PgBouncer for connection multiplexing at scale
  config :cgraph, Cgraph.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "50"),
    queue_target: String.to_integer(System.get_env("POOL_QUEUE_TARGET") || "50"),
    queue_interval: String.to_integer(System.get_env("POOL_QUEUE_INTERVAL") || "1000"),
    socket_options: maybe_ipv6

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = System.get_env("PHX_HOST") || "cgraph.org"
  port = String.to_integer(System.get_env("PORT") || "4000")

  config :cgraph, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  config :cgraph, CgraphWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: port
    ],
    secret_key_base: secret_key_base

  # Guardian JWT configuration
  config :cgraph, Cgraph.Guardian,
    issuer: "cgraph",
    secret_key: System.get_env("JWT_SECRET") ||
      raise "environment variable JWT_SECRET is missing"

  # JWT token TTL
  config :cgraph, :jwt_access_token_ttl,
    String.to_integer(System.get_env("JWT_ACCESS_TOKEN_TTL") || "7200")

  config :cgraph, :jwt_refresh_token_ttl,
    String.to_integer(System.get_env("JWT_REFRESH_TOKEN_TTL") || "2592000")

  # Configure Swoosh for production
  config :cgraph, Cgraph.Mailer,
    adapter: Swoosh.Adapters.Resend,
    api_key: System.get_env("RESEND_API_KEY")

  # Sentry error tracking
  if System.get_env("SENTRY_DSN") do
    config :sentry,
      dsn: System.get_env("SENTRY_DSN"),
      environment_name: :prod,
      enable_source_code_context: true,
      root_source_code_paths: [File.cwd!()]
  end

  # ExAWS for Cloudflare R2
  config :ex_aws,
    access_key_id: System.get_env("R2_ACCESS_KEY_ID"),
    secret_access_key: System.get_env("R2_SECRET_ACCESS_KEY")

  config :ex_aws, :s3,
    scheme: "https://",
    host: "#{System.get_env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com",
    region: "auto"

  # OAuth configuration for production
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

  # Redis configuration for production
  redis_url = System.get_env("REDIS_URL") || "redis://localhost:6379/0"
  config :cgraph, :redis_url, redis_url

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
  config :cgraph, Cgraph.Search.SearchEngine,
    url: System.get_env("MEILISEARCH_URL") || "http://localhost:7700",
    api_key: System.get_env("MEILISEARCH_API_KEY")

  # WebRTC Signaling & ICE
  config :cgraph, Cgraph.WebRTC,
    stun_servers: String.split(System.get_env("WEBRTC_STUN_SERVERS") || "stun:stun.l.google.com:19302", ","),
    turn_servers: [], # Configure via WEBRTC_TURN_SERVERS if needed
    max_participants: String.to_integer(System.get_env("WEBRTC_MAX_PARTICIPANTS") || "10")

  # Distributed Rate Limiting (Redis-backed)
  config :cgraph, Cgraph.RateLimiter.Distributed,
    enabled: true,
    redis_pool: :rate_limiter_pool

  # Sampled Presence for Large Channels
  config :cgraph, Cgraph.Presence.Sampled,
    tiers: [
      %{max_size: 100, sample_rate: 1.0, batch_interval: 0},
      %{max_size: 1_000, sample_rate: 0.5, batch_interval: 1_000},
      %{max_size: 100_000, sample_rate: 0.01, batch_interval: 10_000},
      %{max_size: :infinity, sample_rate: 0.001, batch_interval: 30_000}
    ]
end
