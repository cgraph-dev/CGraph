defmodule Cgraph.MixProject do
  use Mix.Project

  @version "0.1.0"
  @elixir_version "~> 1.14"

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
      test_coverage: [tool: ExCoveralls],
      preferred_cli_env: [
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
      # Phoenix core
      {:phoenix, "~> 1.7.11"},
      {:phoenix_ecto, "~> 4.5"},
      {:phoenix_html, "~> 4.1"},
      {:phoenix_live_view, "~> 0.20.14"},
      {:phoenix_live_dashboard, "~> 0.8.3"},

      # Database
      {:ecto_sql, "~> 3.11"},
      {:postgrex, "~> 0.18"},

      # Authentication & Security
      {:argon2_elixir, "~> 4.0"},
      {:guardian, "~> 2.3"},
      {:guardian_phoenix, "~> 2.0"},
      {:corsica, "~> 2.1"},

      # Web3 / Ethereum wallet auth
      {:ex_keccak, "~> 0.7"},
      {:ex_secp256k1, "~> 0.7"},

      # Real-time
      {:phoenix_pubsub, "~> 2.1"},

      # Caching
      {:redix, "~> 1.3"},
      {:cachex, "~> 3.6"},

      # Background jobs
      {:oban, "~> 2.17"},

      # File uploads
      {:waffle, "~> 1.1"},
      {:waffle_ecto, "~> 0.0.12"},
      {:ex_aws, "~> 2.5"},
      {:ex_aws_s3, "~> 2.5"},
      {:sweet_xml, "~> 0.7"},

      # Email
      {:swoosh, "~> 1.15"},
      {:finch, "~> 0.18"},

      # JSON
      {:jason, "~> 1.4"},

      # HTTP client
      {:tesla, "~> 1.8"},
      {:hackney, "~> 1.20"},

      # Telemetry & monitoring
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:sentry, "~> 10.2"},

      # Utilities
      {:ecto_ulid, "~> 0.3"},
      {:timex, "~> 3.7"},
      {:slugify, "~> 1.3"},

      # Development & testing
      {:phoenix_live_reload, "~> 1.5", only: :dev},
      {:esbuild, "~> 0.8", runtime: Mix.env() == :dev},
      {:tailwind, "~> 0.2", runtime: Mix.env() == :dev},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false},
      {:sobelow, "~> 0.13", only: [:dev, :test], runtime: false},
      {:ex_machina, "~> 2.7", only: :test},
      {:excoveralls, "~> 0.18", only: :test},
      {:mox, "~> 1.1", only: :test},
      {:floki, "~> 0.35", only: :test},

      # Server
      {:bandit, "~> 1.2"},
      {:plug_cowboy, "~> 2.7"},
      {:gettext, "~> 0.24"},

      # Override for OTP 25 compatibility (use version before dynamic() type)
      {:jose, "1.11.6", override: true}
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
