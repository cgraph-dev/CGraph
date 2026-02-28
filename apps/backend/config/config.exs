import Config

# General application configuration
config :cgraph,
  ecto_repos: [CGraph.Repo],
  env: Mix.env(),
  generators: [timestamp_type: :utc_datetime, binary_id: true],
  session_signing_salt: "cgraph_session_v1"

# Configures the endpoint
config :cgraph, CGraphWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: CGraphWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: CGraph.PubSub,
  live_view: [signing_salt: "cgraph_lv"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [
    :request_id,
    # Request/Response
    :method, :path, :status, :duration_ms, :status_category, :slow,
    # User context
    :user_id, :trace_id, :tenant_id, :user_agent, :remote_ip, :span_id,
    # Workers/Jobs
    :worker, :queue, :job_id, :attempt, :args, :error, :errors,
    :duration_ms, :snooze_seconds, :name, :cron,
    # Database
    :query, :total_time_ms, :source,
    # Rate limiting
    :tier, :retry_after_seconds, :retry_after_ms, :ip, :duration_seconds,
    # OAuth/Auth
    :provider, :reason, :email, :expected, :received,
    # Notifications
    :email_type, :to, :notification_id, :sent, :failed, :count,
    # Media
    :upload_id, :base_id, :thumb, :preview, :optimized,
    # Feature flags
    :flag, :config, :changes,
    # Audit
    :category, :event_type, :actor_id, :target_id, :ip_address, :metadata,
    :admin_id, :action, :details, :cutoff,
    # Channels
    :channel_id, :latency_ms,
    # Services
    :service, :failure_count, :threshold, :success_count,
    # Circuit breaker / Redis
    :command, :reset_timeout_ms, :connections_count,
    :failure_number, :failures, :targets, :token_count, :failed_count,
    # Workers / Partitioning
    :partition, :date,
    # Errors
    :kind, :stacktrace, :error_type, :fingerprint, :context, :severity,
    :issues, :data, :body,
    # Workers specific
    :deleted_count, :tags, :state, :resource_id,
    # Telemetry/Alerts
    :affected_users, :component, :message, :error_id, :level, :url
  ]

# Use Jason for JSON parsing
config :phoenix, :json_library, Jason

# Guardian configuration
# NOTE: In production, runtime.exs raises if JWT_SECRET is unset.
# The fallback here is ONLY for dev/test and is intentionally invalid for prod.
config :cgraph, CGraph.Guardian,
  issuer: "cgraph",
  secret_key: "dev-only-not-for-production"

# Oban configuration
config :cgraph, Oban,
  repo: CGraph.Repo,
  plugins: [
    # Prune completed jobs after 7 days
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},
    # Rescue orphaned jobs (stuck jobs older than 30 minutes)
    {Oban.Plugins.Lifeline, rescue_after: :timer.minutes(30)},
    # Cron jobs for scheduled tasks
    {Oban.Plugins.Cron,
     crontab: [
       # Process scheduled messages every minute
       {"* * * * *", CGraph.Workers.ScheduledMessageWorker},
       # Clear expired custom statuses every minute
       {"* * * * *", CGraph.Workers.StatusExpiryWorker},
       # Send email digests daily at 8 AM UTC
       {"0 8 * * *", CGraph.Workers.EmailDigestWorker},
       # Archive old messages daily at 3 AM UTC
       {"0 3 * * *", CGraph.Workers.MessageArchivalWorker}
     ]}
  ],
  queues: [
    default: 10,
    mailers: 5,
    notifications: 20,
    events: 5,
    cleanup: 3,
    notification_retry: 5,
    webhooks: 10,
    exports: 3,
    external_api: 5,
    dead_letter: 3,
    maintenance: 3,
    backups: 2,
    push_notifications: 10,
    email_notifications: 5,
    archival: 1,
    search: 5,
    critical: 10,
    emails: 5,
    media: 3,
    sync: 5
  ]

# Swoosh mailer configuration
config :cgraph, CGraph.Mailer,
  adapter: Swoosh.Adapters.Local

# OAuth configuration (override in runtime.exs for production)
config :cgraph, :oauth,
  google: [
    client_id: System.get_env("GOOGLE_CLIENT_ID", ""),
    client_secret: System.get_env("GOOGLE_CLIENT_SECRET", ""),
    redirect_uri: System.get_env("GOOGLE_REDIRECT_URI", "http://localhost:4000/api/v1/auth/oauth/google/callback")
  ],
  apple: [
    client_id: System.get_env("APPLE_CLIENT_ID", ""),
    team_id: System.get_env("APPLE_TEAM_ID", ""),
    key_id: System.get_env("APPLE_KEY_ID", ""),
    private_key: System.get_env("APPLE_PRIVATE_KEY", ""),
    redirect_uri: System.get_env("APPLE_REDIRECT_URI", "http://localhost:4000/api/v1/auth/oauth/apple/callback")
  ],
  facebook: [
    client_id: System.get_env("FACEBOOK_CLIENT_ID", ""),
    client_secret: System.get_env("FACEBOOK_CLIENT_SECRET", ""),
    redirect_uri: System.get_env("FACEBOOK_REDIRECT_URI", "http://localhost:4000/api/v1/auth/oauth/facebook/callback")
  ],
  tiktok: [
    client_key: System.get_env("TIKTOK_CLIENT_KEY", ""),
    client_secret: System.get_env("TIKTOK_CLIENT_SECRET", ""),
    redirect_uri: System.get_env("TIKTOK_REDIRECT_URI", "http://localhost:4000/api/v1/auth/oauth/tiktok/callback")
  ]

# ExAWS configuration for Cloudflare R2
config :ex_aws,
  access_key_id: {:system, "R2_ACCESS_KEY_ID"},
  secret_access_key: {:system, "R2_SECRET_ACCESS_KEY"},
  s3: [
    scheme: "https://",
    host: {:system, "R2_ACCOUNT_ID"},
    region: "auto"
  ]

# Suppress Tesla Builder deprecation warning (we'll migrate when ready)
config :tesla, disable_deprecated_builder_warning: true

# Import Stripe configuration
import_config "stripe.exs"

# Import environment specific config
import_config "#{config_env()}.exs"
