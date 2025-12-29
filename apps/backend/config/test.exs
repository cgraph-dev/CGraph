import Config

# Configure your database
#
# The MIX_TEST_PARTITION environment variable can be used
# to provide built-in test partitioning in CI environment.
config :cgraph, Cgraph.Repo,
  username: "cgraph",
  password: "cgraph_dev_password",
  hostname: "localhost",
  database: "cgraph_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :cgraph, CgraphWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "test-secret-key-base-at-least-64-characters-long-for-testing-purposes",
  server: false

# In test we don't send emails
config :cgraph, Cgraph.Mailer, adapter: Swoosh.Adapters.Test

# Disable swoosh api client as it is only required for production adapters
config :swoosh, :api_client, false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Disable rate limiting in tests to prevent false failures
config :cgraph, Cgraph.RateLimiter, enabled: false

# Oban testing mode
config :cgraph, Oban, testing: :inline
