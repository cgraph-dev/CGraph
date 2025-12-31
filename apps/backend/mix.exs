defmodule Cgraph.MixProject do
  use Mix.Project

  @version "0.1.0"
  # Using Elixir 1.19+ with OTP 28 for latest features and security
  @elixir_version "~> 1.19"

  def project do
    [
      app: :cgraph,
      version: @version,
      elixir: @elixir_version,
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      dialyzer: dialyzer(),
      test_coverage: [tool: ExCoveralls]
    ]
  end

  def cli do
    [
      preferred_envs: [
        coveralls: :test,
        "coveralls.detail": :test,
        "coveralls.html": :test
      ]
    ]
  end

  def application do
    [
      mod: {Cgraph.Application, []},
      extra_applications: [:logger, :runtime_tools, :os_mon]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      # Phoenix core (latest stable - 1.8.x with LiveView 1.x)
      {:phoenix, "~> 1.8.3"},
      {:phoenix_ecto, "~> 4.6"},
      {:phoenix_html, "~> 4.2"},
      {:phoenix_live_view, "~> 1.1.3"},
      {:phoenix_live_dashboard, "~> 0.8.7"},

      # Database (latest stable for OTP 28)
      {:ecto_sql, "~> 3.13"},
      {:postgrex, "~> 0.21"},

      # Authentication & Security (latest stable)
      {:argon2_elixir, "~> 4.1"},
      {:guardian, "~> 2.4"},
      {:guardian_phoenix, "~> 2.0"},
      {:corsica, "~> 2.1"},

      # Web3 / Ethereum wallet auth
      {:ex_keccak, "~> 0.7"},
      {:ex_secp256k1, "~> 0.7"},

      # Real-time
      {:phoenix_pubsub, "~> 2.1"},

      # Caching (latest stable for OTP 28)
      {:redix, "~> 1.5"},
      {:cachex, "~> 4.1"},

      # Background jobs (latest stable)
      {:oban, "~> 2.20"},

      # File uploads
      {:waffle, "~> 1.1"},
      {:waffle_ecto, "~> 0.0.12"},
      {:ex_aws, "~> 2.5"},
      {:ex_aws_s3, "~> 2.5"},
      {:sweet_xml, "~> 0.7"},

      # Email (latest stable)
      {:swoosh, "~> 1.20"},
      {:finch, "~> 0.20"},

      # JSON
      {:jason, "~> 1.4"},

      # HTTP client (latest stable)
      {:tesla, "~> 1.15"},
      {:hackney, "~> 1.20"},

      # Telemetry & monitoring (latest stable for OTP 28)
      {:telemetry_metrics, "~> 1.1"},
      {:telemetry_poller, "~> 1.1"},
      {:sentry, "~> 11.0"},

      # Utilities
      {:ecto_ulid, "~> 0.3"},
      {:timex, "~> 3.7"},
      {:slugify, "~> 1.3"},

      # Development & testing (latest stable)
      {:phoenix_live_reload, "~> 1.6", only: :dev},
      {:esbuild, "~> 0.10", runtime: Mix.env() == :dev},
      {:tailwind, "~> 0.4", runtime: Mix.env() == :dev},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false},
      {:sobelow, "~> 0.14", only: [:dev, :test], runtime: false},
      {:ex_machina, "~> 2.8", only: :test},
      {:excoveralls, "~> 0.18", only: :test},
      {:mox, "~> 1.2", only: :test},
      {:floki, "~> 0.37", only: :test},

      # Server (latest stable)
      {:bandit, "~> 1.10"},
      {:plug_cowboy, "~> 2.7"},
      {:gettext, "~> 0.26"},

      # JWT library (latest - OTP 28 compatible)
      {:jose, "~> 1.11"}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.setup", "assets.setup", "assets.build"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"],
      "assets.setup": ["tailwind.install --if-missing", "esbuild.install --if-missing"],
      "assets.build": ["tailwind cgraph", "esbuild cgraph"],
      "assets.deploy": [
        "tailwind cgraph --minify",
        "esbuild cgraph --minify",
        "phx.digest"
      ]
    ]
  end

  defp dialyzer do
    [
      plt_core_path: "priv/plts",
      plt_file: {:no_warn, "priv/plts/dialyzer.plt"},
      plt_add_apps: [:mix, :ex_unit]
    ]
  end
end
