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
    cd: Path.expand("../apps/backend/assets", __DIR__),
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
    cd: Path.expand("../apps/backend/assets", __DIR__)
  ]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing
config :phoenix, :json_library, Jason

# Guardian configuration
config :cgraph, Cgraph.Guardian,
  issuer: "cgraph",
  secret_key: System.get_env("JWT_SECRET") || "dev-secret-please-change-in-production"

# Oban configuration
config :cgraph, Oban,
  repo: Cgraph.Repo,
  plugins: [Oban.Plugins.Pruner],
  queues: [default: 10, mailers: 5, notifications: 20]

# Swoosh mailer configuration
config :cgraph, Cgraph.Mailer,
  adapter: Swoosh.Adapters.Local

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
