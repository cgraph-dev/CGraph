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

# Configure logger format for production (JSON for log aggregation)
# Structured JSON output compatible with Grafana Loki, Datadog, CloudWatch
config :logger, :console,
  format: {CGraph.Telemetry.JsonFormatter, :format},
  metadata: [
    :request_id,
    :user_id,
    :trace_id,
    :span_id,
    :remote_ip,
    :method,
    :path,
    :status,
    :duration_us
  ]

# Disable Phoenix dev routes in production
config :cgraph, dev_routes: false

# Configure endpoint for production
# Note: Fly.io handles SSL termination at the proxy level
# force_ssl is disabled because health checks come via internal HTTP
config :cgraph, CGraphWeb.Endpoint,
  # cache_static_manifest not needed for API-only backend
  # force_ssl disabled - Fly.io proxy handles SSL termination
  check_origin: [
    # Production domains
    "https://cgraph.org",
    "https://www.cgraph.org",
    "https://*.cgraph.org",
    # Vercel deployment domains (explicit — no wildcards)
    "https://cgraph.vercel.app",
    "https://cgraph-web.vercel.app",
    "https://c-graph.vercel.app"
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
# Optimized for 10,000+ concurrent users
config :cgraph, Oban,
  repo: CGraph.Repo,
  plugins: [
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},  # 7 days
    {Oban.Plugins.Cron, crontab: [
      # Daily cleanup jobs
      {"0 3 * * *", CGraph.Workers.CleanupWorker},
      # Send email digests daily at 8 AM UTC
      {"0 8 * * *", CGraph.Workers.EmailDigestWorker}
    ]},
    # Rescue stalled jobs
    {Oban.Plugins.Lifeline, rescue_after: :timer.minutes(30)}
  ],
  queues: [
    default: 30,              # Increased for 10K users
    mailers: 20,              # Handle email bursts
    notifications: 60,        # High priority for real-time
    events: 10,               # Event processing
    cleanup: 5,               # Retention + cleanup jobs
    notification_retry: 10,   # Failed notification retries
    critical: 10,             # Urgent tasks
    search: 15,               # Search indexing
    webhooks: 20              # Webhook delivery processing
  ]

# Rate limiting settings for production (balanced for 10K users)
config :cgraph, :rate_limit,
  auth: [limit: 10, window_ms: 60_000],        # 10 auth attempts per minute (strict for security)
  api: [limit: 200, window_ms: 60_000],        # 200 API calls per minute per user
  upload: [limit: 30, window_ms: 60_000],      # 30 uploads per minute
  messages: [limit: 60, window_ms: 60_000],    # 60 messages per minute
  websocket: [limit: 500, window_ms: 60_000]   # 500 WS messages per minute

# Enable Telemetry metrics in production
config :cgraph, :telemetry_enabled, true

# Encryption key MUST be set in production (see runtime.exs)
# ENCRYPTION_KEY environment variable is required
