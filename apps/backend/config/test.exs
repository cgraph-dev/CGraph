import Config

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
config :cgraph, CGraph.Repo,
  username: "cgraph",
  password: "cgraph_dev_password",
  hostname: "localhost",
  database: "cgraph_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 50

# ReadRepo shares the primary database in test (no replica needed).
# Read replicas are a prod optimization, not a test concern.
config :cgraph, CGraph.ReadRepo,
  username: "cgraph",
  password: "cgraph_dev_password",
  hostname: "localhost",
  database: "cgraph_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 50

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :cgraph, CGraphWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "test-secret-key-base-at-least-64-characters-long-for-testing-purposes",
  server: false

# In test we don't send emails
config :cgraph, CGraph.Mailer, adapter: Swoosh.Adapters.Test

# Disable swoosh api client as it is only required for production adapters
config :swoosh, :api_client, false

# Suppress all logging during test (prevent Meilisearch/Redis error spam)
config :logger, level: :none

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Disable rate limiting in tests to prevent false failures
config :cgraph, CGraph.RateLimiter, enabled: false

# Hammer rate limiter backend config (ETS for test, no external deps)
config :hammer,
  backend: {Hammer.Backend.ETS, [expiry_ms: 60_000 * 60, cleanup_interval_ms: 60_000 * 10]}

# Skip message table partitioning in test (unpartitioned table preserves FK compat)
config :cgraph, skip_partitioning: true

# Oban testing mode
config :cgraph, Oban, testing: :inline

# Tell the app we're in :test env (used by Encryption, Chaos, etc.)
config :cgraph, env: :test

# Force PostgreSQL search backend in test (no Meilisearch needed)
config :cgraph, CGraph.Search.Engine,
  backend: :postgres,
  meilisearch_url: nil,
  meilisearch_key: nil
