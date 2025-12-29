import Config

# Configure your database
# Matches docker-compose.yml settings
config :cgraph, Cgraph.Repo,
  username: System.get_env("POSTGRES_USER", "cgraph"),
  password: System.get_env("POSTGRES_PASSWORD", "cgraph_dev_password"),
  hostname: System.get_env("POSTGRES_HOST", "localhost"),
  database: System.get_env("POSTGRES_DB", "cgraph_dev"),
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# For development, we disable any cache and enable debugging and code reloading
config :cgraph, CgraphWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "dev-secret-key-base-please-change-in-production-this-is-at-least-64-chars",
  watchers: [
    esbuild: {Esbuild, :install_and_run, [:cgraph, ~w(--sourcemap=inline --watch)]},
    tailwind: {Tailwind, :install_and_run, [:cgraph, ~w(--watch)]}
  ]

# Watch static and templates for browser reloading
config :cgraph, CgraphWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r"priv/static/.*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"priv/gettext/.*(po)$",
      ~r"lib/cgraph_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]

# Enable dev routes for dashboard and mailbox
config :cgraph, dev_routes: true

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Set a higher stacktrace during development
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime

# Include HEEx debug annotations as HTML comments
config :phoenix_live_view, :debug_heex_annotations, true

# Disable swoosh api client as it is only required for production adapters
config :swoosh, :api_client, false

# JWT settings for development
config :cgraph, :jwt_access_token_ttl, 7200
config :cgraph, :jwt_refresh_token_ttl, 2_592_000
