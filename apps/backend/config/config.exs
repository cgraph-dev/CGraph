import Config

# General application configuration
config :cgraph,
  ecto_repos: [Cgraph.Repo],
  generators: [timestamp_type: :utc_datetime, binary_id: true]

# Configures the endpoint
config :cgraph, CgraphWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: CgraphWeb.ErrorHTML, json: CgraphWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Cgraph.PubSub,
  live_view: [signing_salt: "cgraph_lv"]

# Configure esbuild
config :esbuild,
  version: "0.17.11",
  cgraph: [
    args: ~w(js/app.js --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

# Configure tailwind
config :tailwind,
  version: "3.4.1",
  cgraph: [
    args: ~w(
      --config=tailwind.config.js
      --input=css/app.css
      --output=../priv/static/assets/app.css
    ),
    cd: Path.expand("../assets", __DIR__)
  ]

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
    :upload_id,
    # Feature flags
    :flag, :config, :changes,
    # Audit
    :category, :event_type, :actor_id, :target_id, :ip_address, :metadata,
    :admin_id, :action, :details, :cutoff,
    # Channels
    :channel_id, :latency_ms,
    # Services
    :service, :failure_count, :threshold, :success_count,
    # Errors
    :kind, :stacktrace, :error_type, :fingerprint, :context, :severity,
    :issues, :data, :body,
    # Workers specific
    :deleted_count, :tags, :state, :resource_id
  ]

# Use Jason for JSON parsing
config :phoenix, :json_library, Jason

# Guardian configuration
config :cgraph, Cgraph.Guardian,
  issuer: "cgraph",
  secret_key: System.get_env("JWT_SECRET", "dev-jwt-key-override-in-production")

# Oban configuration
config :cgraph, Oban,
  repo: Cgraph.Repo,
  plugins: [Oban.Plugins.Pruner],
  queues: [default: 10, mailers: 5, notifications: 20]

# Swoosh mailer configuration
config :cgraph, Cgraph.Mailer,
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

# Import environment specific config
import_config "#{config_env()}.exs"
