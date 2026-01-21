import Config

# Configure your database
# Using Docker PostgreSQL (cgraph user by default, matches docker-compose.yml)
config :cgraph, CGraph.Repo,
  username: System.get_env("POSTGRES_USER", "cgraph"),
  password: System.get_env("POSTGRES_PASSWORD", "cgraph_dev_password"),
  hostname: System.get_env("POSTGRES_HOST", "localhost"),
  database: System.get_env("POSTGRES_DB", "cgraph_dev"),
  port: 5432,
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: String.to_integer(System.get_env("POOL_SIZE", "10")),
  ssl: if(System.get_env("POSTGRES_HOST", "localhost") != "localhost", do: true, else: false),
  ssl_opts: if(System.get_env("POSTGRES_HOST", "localhost") != "localhost", do: [verify: :verify_none], else: []),
  socket_options: if(System.get_env("POSTGRES_HOST", "localhost") != "localhost", do: [:inet6], else: [])

# For development, we disable any cache and enable debugging and code reloading
# Using 0.0.0.0 to allow connections from mobile devices on the local network
assets_path = Path.expand("../assets", __DIR__)

# Skip asset watchers when the assets directory is absent (API-only dev setups)
asset_watchers =
  if File.dir?(assets_path) do
    [
      esbuild: {Esbuild, :install_and_run, [:cgraph, ~w(--sourcemap=inline --watch)]},
      tailwind: {Tailwind, :install_and_run, [:cgraph, ~w(--watch)]}
    ]
  else
    []
  end

config :cgraph, CGraphWeb.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "dev-secret-key-base-please-change-in-production-this-is-at-least-64-chars",
  watchers: asset_watchers

# Watch static and templates for browser reloading
config :cgraph, CGraphWeb.Endpoint,
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
