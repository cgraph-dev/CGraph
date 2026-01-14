import Config

# Production configuration
# NOTE: Most runtime config is in runtime.exs which reads from environment variables.
# This file sets compile-time production defaults.

# Do NOT print debug messages in production
config :logger,
  level: :info,
  compile_time_purge_matching: [
    [level_lower_than: :info]
  ]

# Configure logger format for production (JSON-style for log aggregation)
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [
    :request_id,
    :user_id,
    :trace_id,
    :remote_ip
  ]

# Disable Phoenix dev routes in production
config :cgraph, dev_routes: false

# Configure endpoint for production
config :cgraph, CGraphWeb.Endpoint,
  cache_static_manifest: "priv/static/cache_manifest.json",
  force_ssl: [rewrite_on: [:x_forwarded_proto]],
  check_origin: [
    "https://cgraph.org",
    "https://www.cgraph.org",
    "https://*.cgraph.org"
  ]

# Use secure cookie settings in production
config :cgraph, :cookie_options,
  http_only: true,
  secure: true,
  same_site: "Strict",
  max_age: 7 * 24 * 60 * 60  # 7 days

# Configure Swoosh API client for production
config :swoosh, :api_client, Swoosh.ApiClient.Finch

# Configure Oban for production with more robust settings
config :cgraph, Oban,
  repo: CGraph.Repo,
  plugins: [
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},  # 7 days
    {Oban.Plugins.Cron, crontab: [
      # Daily cleanup jobs
      {"0 3 * * *", CGraph.Workers.CleanupWorker}
    ]}
  ],
  queues: [
    default: 20,
    mailers: 10,
    notifications: 40,
    critical: 5
  ]

# Rate limiting settings for production (stricter)
config :cgraph, :rate_limit,
  auth: [limit: 10, window_ms: 60_000],        # 10 auth attempts per minute
  api: [limit: 100, window_ms: 60_000],        # 100 API calls per minute
  upload: [limit: 20, window_ms: 60_000]       # 20 uploads per minute

# Enable Telemetry metrics in production
config :cgraph, :telemetry_enabled, true

# Encryption key MUST be set in production (see runtime.exs)
# ENCRYPTION_KEY environment variable is required
