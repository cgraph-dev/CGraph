defmodule CGraph.CacheSupervisor do
  @moduledoc "Supervisor for Cachex cache instances including general, session, and token caches."
  use Supervisor

  @doc "Starts the process and links it to the current process."
  @spec start_link(keyword()) :: Supervisor.on_start()
  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  @doc "Initializes the process state."
  @spec init(keyword()) :: {:ok, {Supervisor.sup_flags(), [Supervisor.child_spec()]}}
  def init(_init_arg) do
    children = [
      # Start Cachex for local caching with memory bounds
      # Default: 100MB limit with LRU eviction (configurable via CACHEX_LIMIT_MB)
      Supervisor.child_spec({Cachex, cachex_config(:cgraph_cache)}, id: :cgraph_cache),

      # Separate cache for sessions with shorter TTL
      Supervisor.child_spec({Cachex, cachex_config(:session_cache, limit: 50_000, ttl: :timer.hours(24))}, id: :session_cache),

      # Token cache for JWT/rate limit lookups
      Supervisor.child_spec({Cachex, cachex_config(:token_cache, limit: 100_000, ttl: :timer.minutes(15))}, id: :token_cache),

      # 2FA login challenge tokens — short-lived (5 min TTL), stores temp tokens
      # used between password verification and TOTP code submission
      Supervisor.child_spec({Cachex, cachex_config(:two_factor_challenges, limit: 50_000, ttl: :timer.minutes(5))}, id: :two_factor_challenges),

      # Lottie animation metadata cache — 24h TTL for CDN URL lookups
      Supervisor.child_spec({Cachex, cachex_config(:lottie_cache, limit: 50_000, ttl: :timer.hours(24))}, id: :lottie_cache)
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  # Helper to construct Cachex config (moved from Application.ex)
  defp cachex_config(name, opts \\ []) do
    # Memory limit in entries (default 100k, ~100MB assuming 1KB avg entry)
    default_limit = String.to_integer(System.get_env("CACHEX_LIMIT_ENTRIES") || "100000")
    limit = Keyword.get(opts, :limit, default_limit)
    default_ttl = Keyword.get(opts, :ttl, :timer.hours(1))

    import Cachex.Spec

    [
      name: name,
      # LRW eviction when limit reached (scheduled policy - lower memory overhead)
      hooks: [
        hook(module: Cachex.Stats),
        hook(module: Cachex.Limit.Scheduled, args: {
          limit,           # max size
          [reclaim: 0.1],  # options for Cachex.prune/3
          []               # options for Cachex.Limit.Scheduled
        })
      ],
      # Default TTL
      expiration: expiration(
        default: default_ttl,
        interval: :timer.seconds(30),
        lazy: true
      )
    ]
  end
end
